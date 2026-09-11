/**
 * Normalization: packet stream -> canonical bidirectional-keyed flows,
 * with timestamp alignment, IAT statistics and retransmission counting.
 */
import { emptyFlags, PipelineError, type CanonicalFlow, type ParsedPacket, type TcpFlags } from "./types";

const FLOW_TIMEOUT_MS = 60_000;

interface Accumulator {
  key: string;
  srcIp: string;
  dstIp: string;
  srcPort: number | null;
  dstPort: number | null;
  protocol: string;
  firstTs: number;
  lastTs: number;
  packetCount: number;
  byteCount: number;
  flags: TcpFlags;
  ttl: number | null;
  iats: number[];
  seenSeq: Set<number>;
  retransmissions: number;
}

const flowKey = (p: ParsedPacket) =>
  `${p.srcIp}|${p.srcPort ?? "-"}|${p.dstIp}|${p.dstPort ?? "-"}|${p.protocol}`;

function finalize(acc: Accumulator, index: number): CanonicalFlow {
  const n = acc.iats.length;
  const mean = n > 0 ? acc.iats.reduce((s, v) => s + v, 0) / n : 0;
  const variance = n > 0 ? acc.iats.reduce((s, v) => s + (v - mean) ** 2, 0) / n : 0;
  const durationMs = acc.lastTs - acc.firstTs;

  return {
    flowId: `flow-${index}`,
    timestampMs: acc.firstTs,
    srcIp: acc.srcIp,
    dstIp: acc.dstIp,
    srcPort: acc.srcPort,
    dstPort: acc.dstPort,
    protocol: acc.protocol,
    packetCount: acc.packetCount,
    byteCount: acc.byteCount,
    durationMs,
    tcpFlags: acc.flags,
    ttl: acc.ttl,
    iatMean: mean,
    iatStd: Math.sqrt(variance),
    retransmissionCount: acc.retransmissions,
    derived: {},
  };
}

export function packetsToFlows(packets: ParsedPacket[]): CanonicalFlow[] {
  if (packets.length === 0) throw new PipelineError("PARSING", "Capture contained no decodable packets.");

  // Timestamp alignment: a single monotonically ordered stream.
  const ordered = [...packets].sort((a, b) => a.tsMs - b.tsMs);

  const open = new Map<string, Accumulator>();
  const closed: Accumulator[] = [];

  for (const pkt of ordered) {
    const key = flowKey(pkt);
    let acc = open.get(key);

    if (acc && pkt.tsMs - acc.lastTs > FLOW_TIMEOUT_MS) {
      closed.push(acc);
      open.delete(key);
      acc = undefined;
    }

    if (!acc) {
      acc = {
        key,
        srcIp: pkt.srcIp,
        dstIp: pkt.dstIp,
        srcPort: pkt.srcPort,
        dstPort: pkt.dstPort,
        protocol: pkt.protocol,
        firstTs: pkt.tsMs,
        lastTs: pkt.tsMs,
        packetCount: 0,
        byteCount: 0,
        flags: emptyFlags(),
        ttl: pkt.ttl,
        iats: [],
        seenSeq: new Set<number>(),
        retransmissions: 0,
      };
      open.set(key, acc);
    } else {
      acc.iats.push(pkt.tsMs - acc.lastTs);
      acc.lastTs = pkt.tsMs;
    }

    acc.packetCount += 1;
    acc.byteCount += pkt.length;
    acc.flags.syn += pkt.flags.syn;
    acc.flags.ack += pkt.flags.ack;
    acc.flags.fin += pkt.flags.fin;
    acc.flags.rst += pkt.flags.rst;
    acc.flags.psh += pkt.flags.psh;
    acc.flags.urg += pkt.flags.urg;

    // Retransmission heuristic: repeated sequence number carrying payload.
    if (pkt.protocol === "TCP" && pkt.seq !== null && pkt.payloadLength > 0) {
      if (acc.seenSeq.has(pkt.seq)) acc.retransmissions += 1;
      else if (acc.seenSeq.size < 20_000) acc.seenSeq.add(pkt.seq);
    }
  }

  closed.push(...open.values());
  closed.sort((a, b) => a.firstTs - b.firstTs);
  return closed.map(finalize);
}
