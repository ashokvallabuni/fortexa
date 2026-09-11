/** Canonical internal representation shared by every input adapter. */

export type SourceFormat = 'pcap' | 'csv' | 'netflow' | 'ipfix';

export const WINDOW_SIZES = [1, 5, 10, 30, 60] as const;
export type WindowSize = (typeof WINDOW_SIZES)[number];
export const DEFAULT_WINDOW_SIZE: WindowSize = 10;

export const PROCESSING_STATUSES = [
  'UPLOADED',
  'VALIDATING',
  'PARSING',
  'FEATURE_EXTRACTION',
  'STATE_GENERATION',
  'GRAPH_GENERATION',
  'COMPLETED',
  'FAILED',
] as const;
export type ProcessingStatus = (typeof PROCESSING_STATUSES)[number];

/** One observed packet (PCAP path) before flow aggregation. */
export interface ParsedPacket {
  tsMs: number;
  srcIp: string;
  dstIp: string;
  srcPort: number | null;
  dstPort: number | null;
  protocol: string;
  length: number;
  ttl: number | null;
  flags: TcpFlags;
  seq: number | null;
  payloadLength: number;
}

export interface TcpFlags {
  syn: number;
  ack: number;
  fin: number;
  rst: number;
  psh: number;
  urg: number;
}

export const emptyFlags = (): TcpFlags => ({ syn: 0, ack: 0, fin: 0, rst: 0, psh: 0, urg: 0 });

/** Canonical flow record — the single internal representation all adapters produce. */
export interface CanonicalFlow {
  flowId: string;
  timestampMs: number;
  srcIp: string;
  dstIp: string;
  srcPort: number | null;
  dstPort: number | null;
  protocol: string;
  packetCount: number;
  byteCount: number;
  durationMs: number;
  tcpFlags: TcpFlags;
  ttl: number | null;
  iatMean: number;
  iatStd: number;
  retransmissionCount: number;
  derived: Record<string, number>;
}

export interface ParseResult {
  flows: CanonicalFlow[];
  warnings: string[];
  parsedRecords: number;
}

export class PipelineError extends Error {
  readonly stage: ProcessingStatus;
  constructor(stage: ProcessingStatus, message: string) {
    super(message);
    this.name = 'PipelineError';
    this.stage = stage;
  }
}
