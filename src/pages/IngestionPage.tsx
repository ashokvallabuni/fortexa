import { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader2, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle } from '@/components/fx/Card';
import { Button } from '@/components/fx/Button';
import { Badge } from '@/components/fx/Badge';
import { ingestionService } from '@/services/ingestionService';
import { formatBytes } from '@/data/mockData';
import type { IngestionFile } from '@/types';

const PIPELINE_STAGES: { key: IngestionFile['status']; label: string }[] = [
  { key: 'uploading', label: 'Uploading' },
  { key: 'validated', label: 'Validated' },
  { key: 'parsing', label: 'Parsing' },
  { key: 'extracting', label: 'Feature Extraction' },
  { key: 'windowing', label: 'Time Windowing' },
  { key: 'generating_state', label: 'Network State' },
  { key: 'generating_graph', label: 'Graph Generated' },
  { key: 'ready', label: 'Ready for Forecast' },
];

const STAGE_ORDER = PIPELINE_STAGES.map((s) => s.key);

export function IngestionPage() {
  const [files, setFiles] = useState<IngestionFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    ingestionService.processFile(file, (updated) => {
      setFiles((prev) => {
        const idx = prev.findIndex((f) => f.name === file.name);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [...prev, updated];
      });
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    Array.from(e.dataTransfer.files).forEach(processFile);
  };

  const getStageIndex = (status: IngestionFile['status']) => STAGE_ORDER.indexOf(status);

  return (
    <div className="p-4 space-y-4 max-w-screen-lg mx-auto">
      <div>
        <h1 className="text-base font-semibold text-[var(--foreground)]">Data Ingestion</h1>
        <p className="text-xs text-[var(--muted-foreground)]">
          Upload network capture files for processing and analysis
        </p>
      </div>

      {/* Upload zone */}
      <div
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-[var(--radius)] p-10 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-blue-500 bg-blue-500/5'
            : 'border-[var(--border)] hover:border-blue-500/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pcap,.csv,.json,.ipfix"
          className="hidden"
          onChange={(e) => Array.from(e.target.files ?? []).forEach(processFile)}
        />
        <Upload className="size-8 text-[var(--muted-foreground)] mx-auto mb-3" />
        <p className="text-sm font-medium text-[var(--foreground)]">
          Drop files here or click to upload
        </p>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          Supported: PCAP, NetFlow, IPFIX, CSV
        </p>
      </div>

      {/* Format badges */}
      <div className="flex gap-2 flex-wrap">
        {['PCAP', 'NetFlow', 'IPFIX', 'CSV'].map((fmt) => (
          <Badge key={fmt} variant="default">
            {fmt}
          </Badge>
        ))}
      </div>

      {/* Files */}
      {files.length > 0 && (
        <div className="space-y-4">
          {files.map((file) => {
            const stageIdx = getStageIndex(file.status);
            return (
              <Card key={file.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FileText className="size-5 text-[var(--muted-foreground)]" />
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">{file.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {formatBytes(file.size)} · {file.type.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.status === 'ready' ? (
                      <CheckCircle className="size-4 text-emerald-400" />
                    ) : file.status === 'error' ? (
                      <AlertCircle className="size-4 text-red-400" />
                    ) : (
                      <Loader2 className="size-4 text-blue-400 animate-spin" />
                    )}
                    <span className="text-xs font-mono text-[var(--muted-foreground)]">
                      {file.progress}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-[var(--border)] rounded-full mb-4">
                  <motion.div
                    className={`h-full rounded-full ${file.status === 'ready' ? 'bg-emerald-400' : 'bg-blue-500'}`}
                    style={{ width: `${file.progress}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>

                {/* Pipeline stages */}
                <div className="grid grid-cols-4 md:grid-cols-8 gap-1">
                  {PIPELINE_STAGES.map((stage, i) => (
                    <div key={stage.key} className="flex flex-col items-center gap-1">
                      <div
                        className={`size-5 rounded-full flex items-center justify-center border ${
                          i < stageIdx
                            ? 'bg-emerald-400/20 border-emerald-400'
                            : i === stageIdx
                              ? 'bg-blue-500/20 border-blue-500'
                              : 'bg-transparent border-[var(--border)]'
                        }`}
                      >
                        {i < stageIdx ? (
                          <CheckCircle className="size-3 text-emerald-400" />
                        ) : i === stageIdx ? (
                          <Loader2 className="size-3 text-blue-400 animate-spin" />
                        ) : null}
                      </div>
                      <p className="text-[9px] text-center text-[var(--muted-foreground)] leading-tight">
                        {stage.label}
                      </p>
                    </div>
                  ))}
                </div>

                {file.status === 'ready' && (
                  <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-[var(--muted-foreground)]">Records</p>
                      <p className="font-mono font-semibold text-[var(--foreground)]">
                        {file.records?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--muted-foreground)]">Time Range</p>
                      <p className="font-mono text-[var(--foreground)]">
                        {file.timeRange?.start.slice(11, 19)} – {file.timeRange?.end.slice(11, 19)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--muted-foreground)]">Entities</p>
                      <p className="font-mono font-semibold text-[var(--foreground)]">
                        {file.networkEntities}
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
