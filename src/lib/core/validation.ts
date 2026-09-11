/** Upload validation: size, extension, magic bytes, declared vs detected format. */
import { PipelineError, type SourceFormat } from "@/lib/pipeline/types";

export const MAX_UPLOAD_BYTES = 60 * 1024 * 1024;
export const MAX_STORED_FLOWS = 50_000;

const EXTENSION_FORMAT: Record<string, SourceFormat> = {
  pcap: "pcap",
  pcapng: "pcap",
  cap: "pcap",
  csv: "csv",
  tsv: "csv",
  json: "netflow",
  ndjson: "netflow",
  jsonl: "netflow",
  nfcapd: "netflow",
  ipfix: "ipfix",
};

export interface ValidationResult {
  format: SourceFormat;
  extension: string;
  sizeBytes: number;
}

export function validateUpload(filename: string, sizeBytes: number, head: Uint8Array): ValidationResult {
  if (sizeBytes <= 0) throw new PipelineError("VALIDATING", "The file is empty.");
  if (sizeBytes > MAX_UPLOAD_BYTES) {
    throw new PipelineError("VALIDATING", `File is larger than the ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB limit.`);
  }

  const extension = (filename.split(".").pop() ?? "").toLowerCase();
  const byExtension = EXTENSION_FORMAT[extension];
  if (!byExtension) {
    throw new PipelineError(
      "VALIDATING",
      `Unsupported file type ".${extension}". Supported: .pcap, .pcapng, .csv, .json/.ndjson (NetFlow/IPFIX).`,
    );
  }

  const detected = detectFormat(head);
  if (detected === "pcap" && byExtension !== "pcap") {
    throw new PipelineError("VALIDATING", "File contents look like a packet capture but the extension says otherwise.");
  }
  if (detected !== "pcap" && byExtension === "pcap") {
    throw new PipelineError("VALIDATING", "File does not have a valid libpcap or pcapng signature.");
  }

  return { format: byExtension, extension, sizeBytes };
}

export function detectFormat(head: Uint8Array): SourceFormat | "unknown" {
  if (head.length >= 4) {
    const b = [head[0]!, head[1]!, head[2]!, head[3]!];
    const magics = [
      [0xd4, 0xc3, 0xb2, 0xa1],
      [0xa1, 0xb2, 0xc3, 0xd4],
      [0x4d, 0x3c, 0xb2, 0xa1],
      [0xa1, 0xb2, 0x3c, 0x4d],
      [0x0a, 0x0d, 0x0d, 0x0a],
    ];
    if (magics.some((m) => m.every((v, i) => v === b[i]))) return "pcap";
  }
  const text = new TextDecoder().decode(head.slice(0, 512)).trim();
  if (text.startsWith("{") || text.startsWith("[")) return "netflow";
  if (text.includes(",")) return "csv";
  return "unknown";
}
