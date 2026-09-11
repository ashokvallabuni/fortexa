import type { IngestionFile } from '@/types';
import { apiGet, apiPost, setActiveDatasetId } from './api';

/** Backend processing stages mapped onto the UI's stage vocabulary. */
const STATUS_MAP: Record<string, IngestionFile['status']> = {
  UPLOADED: 'uploading',
  VALIDATING: 'validated',
  PARSING: 'parsing',
  FEATURE_EXTRACTION: 'extracting',
  STATE_GENERATION: 'generating_state',
  GRAPH_GENERATION: 'generating_graph',
  COMPLETED: 'ready',
  FAILED: 'error',
};

interface UploadRow {
  id: string;
  dataset_id: string;
  filename: string;
  file_format: IngestionFile['type'];
  size_bytes: number;
  status: string;
  progress: number;
  error_message: string | null;
  stats: Record<string, number | string> | null;
  created_at: string;
}

interface DatasetRow {
  id: string;
  name: string;
  sourceFormat: string;
  timeStart: string | null;
  timeEnd: string | null;
  flowCount: number;
  entityCount: number;
  stateCount: number;
}

// Keep each multipart request below common serverless request limits while
// preserving complete CSV records. Each chunk becomes an independently
// queryable dataset until a background aggregation job is introduced.
const CSV_CHUNK_BYTES = 3 * 1024 * 1024;

function toIngestionFile(row: UploadRow, dataset?: DatasetRow): IngestionFile {
  const file: IngestionFile = {
    id: row.id,
    name: row.filename,
    size: row.size_bytes,
    type: (['pcap', 'csv', 'netflow', 'ipfix'].includes(row.file_format)
      ? row.file_format
      : 'pcap') as IngestionFile['type'],
    status: STATUS_MAP[row.status] ?? 'uploading',
    progress: row.progress,
    uploadedAt: row.created_at,
  };
  if (row.error_message) file.errorMessage = row.error_message;
  if (dataset) {
    file.records = dataset.flowCount;
    file.networkEntities = dataset.entityCount;
    if (dataset.timeStart && dataset.timeEnd) {
      file.timeRange = { start: dataset.timeStart, end: dataset.timeEnd };
    }
  }
  return file;
}

async function pollUntilDone(
  uploadId: string,
  onProgress: (file: IngestionFile) => void,
): Promise<IngestionFile | null> {
  for (let attempt = 0; attempt < 240; attempt++) {
    await new Promise((r) => setTimeout(r, 1000));
    let row: UploadRow;
    try {
      row = await apiGet<UploadRow>(`/api/uploads/${uploadId}`);
    } catch {
      continue;
    }
    if (row.status === 'COMPLETED' || row.status === 'FAILED') {
      const datasets = await apiGet<DatasetRow[]>('/api/datasets').catch(() => [] as DatasetRow[]);
      const dataset = datasets.find((d) => d.id === row.dataset_id);
      if (row.status === 'COMPLETED') setActiveDatasetId(row.dataset_id);
      const done = toIngestionFile(row, dataset);
      onProgress(done);
      return done;
    }
    onProgress(toIngestionFile(row));
  }
  return null;
}

async function splitCsvFile(file: File): Promise<File[]> {
  const chunks: File[] = [];
  const encoder = new TextEncoder();
  let offset = 0;
  let chunkIndex = 0;
  let header = "";

  while (offset < file.size) {
    const raw = await file.slice(offset, Math.min(offset + CSV_CHUNK_BYTES, file.size)).text();
    const rawBytes = encoder.encode(raw).byteLength;
    const isLast = offset + rawBytes >= file.size;
    const lineBreak = raw.lastIndexOf("\n");
    if (lineBreak < 0 && !isLast) {
      throw new Error(`Unable to split ${file.name}: a complete CSV row was not found.`);
    }

    const body = isLast ? raw : raw.slice(0, lineBreak + 1);
    const consumed = encoder.encode(body).byteLength;
    if (consumed === 0) throw new Error(`Unable to split ${file.name}: empty CSV chunk.`);

    if (chunkIndex === 0) {
      const headerEnd = body.indexOf("\n");
      if (headerEnd < 0) throw new Error(`Unable to split ${file.name}: CSV header is missing.`);
      header = body.slice(0, headerEnd + 1);
    }

    const content = chunkIndex === 0 ? body : `${header}${body}`;
    chunks.push(
      new File([content], `${file.name}.part-${String(chunkIndex + 1).padStart(4, "0")}.csv`, {
        type: "text/csv",
      }),
    );
    offset += consumed;
    chunkIndex += 1;

    if (isLast || offset >= file.size) break;
  }

  return chunks;
}

export const ingestionService = {
  /** Uploads the real file and runs the full backend pipeline. */
  async processFile(file: File, onProgress: (file: IngestionFile) => void): Promise<IngestionFile> {
    if (file.name.toLowerCase().endsWith(".csv") && file.size > CSV_CHUNK_BYTES) {
      let chunks: File[];
      try {
        chunks = await splitCsvFile(file);
      } catch (error) {
        const failed: IngestionFile = {
          id: `failed-${Date.now()}`,
          name: file.name,
          size: file.size,
          type: "csv",
          status: "error",
          progress: 100,
          uploadedAt: new Date().toISOString(),
          errorMessage: error instanceof Error ? error.message : "Could not split CSV file",
        };
        onProgress(failed);
        return failed;
      }
      let latest: IngestionFile | undefined;
      for (const [index, chunk] of chunks.entries()) {
        latest = await processSingleFile(chunk, onProgress, `${file.name} (${index + 1}/${chunks.length})`);
        if (latest.status === "error") return latest;
      }
      if (latest) {
        return latest;
      }
    }
    return processSingleFile(file, onProgress);
  },
};

async function processSingleFile(
  file: File,
  onProgress: (file: IngestionFile) => void,
  displayName = file.name,
): Promise<IngestionFile> {
    const placeholder: IngestionFile = {
      id: `pending-${Date.now()}`,
      name: displayName,
      size: file.size,
      type:
        file.name.endsWith('.pcap') || file.name.endsWith('.pcapng')
          ? 'pcap'
          : file.name.endsWith('.csv')
            ? 'csv'
            : file.name.endsWith('.json') || file.name.endsWith('.ndjson')
              ? 'netflow'
              : 'ipfix',
      status: 'uploading',
      progress: 5,
      uploadedAt: new Date().toISOString(),
    };
    onProgress({ ...placeholder });

    const form = new FormData();
    form.append('file', file);

    try {
      const result = await apiPost<{
        uploadId: string;
        datasetId: string;
        flowCount: number;
        entityCount: number;
        stateCount: number;
      }>('/api/uploads', form);
      setActiveDatasetId(result.datasetId);
      const row = await apiGet<UploadRow>(`/api/uploads/${result.uploadId}`);
      const datasets = await apiGet<DatasetRow[]>('/api/datasets').catch(() => [] as DatasetRow[]);
      const done = toIngestionFile(
        row,
        datasets.find((d) => d.id === result.datasetId),
      );
      onProgress(done);
      return done;
    } catch (error) {
      // The request may have timed out while the pipeline is still running — poll for the result.
      const uploads = await apiGet<UploadRow[]>('/api/uploads').catch(() => [] as UploadRow[]);
      const match = uploads.find((u) => u.filename === file.name);
      if (match && match.status !== 'FAILED') {
        const polled = await pollUntilDone(match.id, onProgress);
        if (polled) return polled;
      }
      const failed: IngestionFile = {
        ...placeholder,
        status: 'error',
        progress: 100,
        errorMessage: error instanceof Error ? error.message : 'Processing failed',
      };
      onProgress(failed);
      return failed;
    }
}
