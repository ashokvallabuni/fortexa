/**
 * csv_adapter / netflow_adapter / ipfix_adapter.
 * All three consume record-oriented exports and emit canonical flows directly.
 */
import { emptyFlags, PipelineError, type CanonicalFlow, type SourceFormat, type TcpFlags } from "./types";

/** Minimal RFC4180 CSV reader (quoted fields, embedded commas and newlines). */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const header = rows.shift();
  if (!header) throw new PipelineError("PARSING", "CSV file has no header row.");
  const keys = header.map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));

  return rows
    .filter((r) => r.some((c) => c.trim() !== ""))
    .map((r) => {
      const obj: Record<string, string> = {};
      keys.forEach((k, idx) => {
        obj[k] = (r[idx] ?? "").trim();
      });
      return obj;
    });
}

const ALIASES: Record<string, string[]> = {
  timestamp: ["timestamp", "ts", "time", "first_switched", "flowstartmilliseconds", "start_time", "starttime", "date_first_seen"],
  src_ip: ["src_ip", "source_ip", "srcaddr", "ip_src", "sourceipv4address", "src", "srcip", "source"],
  dst_ip: ["dst_ip", "destination_ip", "dstaddr", "ip_dst", "destinationipv4address", "dst", "dstip", "destination"],
  src_port: ["src_port", "source_port", "srcport", "sourcetransportport", "sport"],
  dst_port: ["dst_port", "destination_port", "dstport", "destinationtransportport", "dport"],
  protocol: ["protocol", "proto", "protocolidentifier", "ip_proto"],
  packet_count: ["packet_count", "packets", "dpkts", "packetdeltacount", "pkts", "total_packets"],
  byte_count: ["byte_count", "bytes", "doctets", "octetdeltacount", "total_bytes"],
  duration: ["duration", "duration_ms", "flow_duration", "dur", "flowduration"],
  tcp_flags: ["tcp_flags", "tcpflags", "flags", "tcpcontrolbits"],
  ttl: ["ttl", "min_ttl", "iptimetolive"],
  iat_mean: ["iat_mean", "flow_iat_mean"],
  iat_std: ["iat_std", "flow_iat_std"],
  retransmission_count: ["retransmission_count", "retransmits", "tcp_retrans"],
};

const PROTO_NUMBERS: Record<string, string> = { "1": "ICMP", "6": "TCP", "17": "UDP", "58": "ICMP", "132": "SCTP" };

function pick(record: Record<string, unknown>, field: keyof typeof ALIASES): string | null {
  for (const alias of ALIASES[field]!) {
    const value = record[alias];
    if (value !== undefined && value !== null && `${value}` !== "") return `${value}`;
  }
  return null;
}

const num = (value: string | null, fallback = 0): number => {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

function parseTimestamp(raw: string | null, index: number): number {
  if (!raw) return Date.now() + index * 1000;
  const asNumber = Number(raw);
  if (Number.isFinite(asNumber) && raw.trim() !== "") {
    if (asNumber > 1e14) return asNumber / 1000; // microseconds
    if (asNumber > 1e11) return asNumber; // milliseconds
    return asNumber * 1000; // seconds
  }
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) throw new PipelineError("PARSING", `Unparseable timestamp "${raw}".`);
  return parsed;
}

function parseTcpFlags(raw: string | null): TcpFlags {
  const flags = emptyFlags();
  if (!raw) return flags;
  const trimmed = raw.trim();
  const asNumber = Number(trimmed);
  if (Number.isFinite(asNumber) && /^\d+$/.test(trimmed)) {
    flags.fin = asNumber & 0x01 ? 1 : 0;
    flags.syn = asNumber & 0x02 ? 1 : 0;
    flags.rst = asNumber & 0x04 ? 1 : 0;
    flags.psh = asNumber & 0x08 ? 1 : 0;
    flags.ack = asNumber & 0x10 ? 1 : 0;
    flags.urg = asNumber & 0x20 ? 1 : 0;
    return flags;
  }
  const upper = trimmed.toUpperCase();
  if (upper.includes("S")) flags.syn = 1;
  if (upper.includes("A")) flags.ack = 1;
  if (upper.includes("F")) flags.fin = 1;
  if (upper.includes("R")) flags.rst = 1;
  if (upper.includes("P")) flags.psh = 1;
  if (upper.includes("U")) flags.urg = 1;
  return flags;
}

const IP_RE = /^[0-9a-fA-F.:]+$/;

/** Converts already-aggregated records (CSV / NetFlow v5,v9 / IPFIX exports) into canonical flows. */
export function recordsToFlows(records: Record<string, unknown>[], format: SourceFormat): CanonicalFlow[] {
  if (records.length === 0) throw new PipelineError("PARSING", "The file contained no usable records.");
  const flows: CanonicalFlow[] = [];

  records.forEach((raw, index) => {
    const record: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) record[k.trim().toLowerCase().replace(/\s+/g, "_")] = v;

    const srcIp = pick(record, "src_ip");
    const dstIp = pick(record, "dst_ip");
    if (!srcIp || !dstIp || !IP_RE.test(srcIp) || !IP_RE.test(dstIp)) return;

    const protoRaw = (pick(record, "protocol") ?? "TCP").toUpperCase();
    const protocol = PROTO_NUMBERS[protoRaw] ?? protoRaw;
    const timestampMs = parseTimestamp(pick(record, "timestamp"), index);
    const durationRaw = num(pick(record, "duration"), 0);
    const durationMs = durationRaw > 0 && durationRaw < 1000 ? durationRaw * 1000 : durationRaw;
    const packetCount = Math.max(1, Math.round(num(pick(record, "packet_count"), 1)));
    const byteCount = Math.max(0, Math.round(num(pick(record, "byte_count"), 0)));
    const srcPortRaw = pick(record, "src_port");
    const dstPortRaw = pick(record, "dst_port");

    flows.push({
      flowId: `${format}-${index}`,
      timestampMs,
      srcIp,
      dstIp,
      srcPort: srcPortRaw === null ? null : Math.round(num(srcPortRaw)),
      dstPort: dstPortRaw === null ? null : Math.round(num(dstPortRaw)),
      protocol,
      packetCount,
      byteCount,
      durationMs,
      tcpFlags: parseTcpFlags(pick(record, "tcp_flags")),
      ttl: pick(record, "ttl") === null ? null : Math.round(num(pick(record, "ttl"))),
      iatMean: num(pick(record, "iat_mean"), packetCount > 1 ? durationMs / (packetCount - 1) : 0),
      iatStd: num(pick(record, "iat_std"), 0),
      retransmissionCount: Math.round(num(pick(record, "retransmission_count"), 0)),
      derived: {},
    });
  });

  if (flows.length === 0) throw new PipelineError("PARSING", "No records contained valid source and destination addresses.");
  return flows;
}

/** NetFlow / IPFIX JSON exports: array, {flows:[...]}, {records:[...]} or NDJSON. */
export function parseRecordDocument(text: string): Record<string, unknown>[] {
  const trimmed = text.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    let doc: unknown;
    try {
      doc = JSON.parse(trimmed);
    } catch {
      return parseNdjson(trimmed);
    }
    if (Array.isArray(doc)) return doc as Record<string, unknown>[];
    const obj = doc as Record<string, unknown>;
    for (const key of ["flows", "records", "data", "dataRecords", "entries"]) {
      if (Array.isArray(obj[key])) return obj[key] as Record<string, unknown>[];
    }
    throw new PipelineError("PARSING", "JSON export did not contain a flow record array.");
  }
  return parseNdjson(trimmed);
}

function parseNdjson(text: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    try {
      out.push(JSON.parse(t) as Record<string, unknown>);
    } catch {
      throw new PipelineError("PARSING", "Export contains a line that is not valid JSON.");
    }
  }
  return out;
}
