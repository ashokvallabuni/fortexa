/**
 * Feature extraction — deterministic and reproducible: the same flow set
 * always yields the same feature vector (no randomness, no wall-clock reads).
 */
import type { CanonicalFlow } from "./types";

export interface FeatureVector {
  packet_count: number;
  byte_count: number;
  flow_duration_ms: number;
  packets_per_second: number;
  bytes_per_second: number;
  unique_destination_ports: number;
  unique_destination_ips: number;
  unique_source_ips: number;
  syn_count: number;
  ack_count: number;
  fin_count: number;
  rst_count: number;
  syn_ratio: number;
  rst_ratio: number;
  average_packet_size: number;
  iat_mean: number;
  iat_variance: number;
  retransmission_rate: number;
  connection_frequency: number;
  protocol_distribution: Record<string, number>;
}

const safeDiv = (a: number, b: number) => (b > 0 ? a / b : 0);
const round = (v: number, digits = 4) => Number.isFinite(v) ? Number(v.toFixed(digits)) : 0;

export function extractFeatures(flows: CanonicalFlow[], windowSeconds: number): FeatureVector {
  const packets = flows.reduce((s, f) => s + f.packetCount, 0);
  const bytes = flows.reduce((s, f) => s + f.byteCount, 0);
  const duration = flows.reduce((s, f) => s + f.durationMs, 0);

  const dstPorts = new Set<number>();
  const dstIps = new Set<string>();
  const srcIps = new Set<string>();
  const protocolCounts: Record<string, number> = {};

  let syn = 0;
  let ack = 0;
  let fin = 0;
  let rst = 0;
  let retrans = 0;
  let iatWeightedSum = 0;
  let iatWeight = 0;

  for (const f of flows) {
    if (f.dstPort !== null) dstPorts.add(f.dstPort);
    dstIps.add(f.dstIp);
    srcIps.add(f.srcIp);
    protocolCounts[f.protocol] = (protocolCounts[f.protocol] ?? 0) + f.packetCount;
    syn += f.tcpFlags.syn;
    ack += f.tcpFlags.ack;
    fin += f.tcpFlags.fin;
    rst += f.tcpFlags.rst;
    retrans += f.retransmissionCount;
    if (f.packetCount > 1) {
      iatWeightedSum += f.iatMean * (f.packetCount - 1);
      iatWeight += f.packetCount - 1;
    }
  }

  const iatMean = safeDiv(iatWeightedSum, iatWeight);
  let iatVarianceSum = 0;
  for (const f of flows) {
    if (f.packetCount > 1) {
      iatVarianceSum += (f.iatStd ** 2 + (f.iatMean - iatMean) ** 2) * (f.packetCount - 1);
    }
  }

  const totalFlagged = syn + ack + fin + rst;
  const protocolDistribution: Record<string, number> = {};
  for (const [proto, count] of Object.entries(protocolCounts)) {
    protocolDistribution[proto] = round(safeDiv(count, packets));
  }

  return {
    packet_count: packets,
    byte_count: bytes,
    flow_duration_ms: round(duration, 2),
    packets_per_second: round(safeDiv(packets, windowSeconds), 2),
    bytes_per_second: round(safeDiv(bytes, windowSeconds), 2),
    unique_destination_ports: dstPorts.size,
    unique_destination_ips: dstIps.size,
    unique_source_ips: srcIps.size,
    syn_count: syn,
    ack_count: ack,
    fin_count: fin,
    rst_count: rst,
    syn_ratio: round(safeDiv(syn, totalFlagged)),
    rst_ratio: round(safeDiv(rst, totalFlagged)),
    average_packet_size: round(safeDiv(bytes, packets), 2),
    iat_mean: round(iatMean, 3),
    iat_variance: round(safeDiv(iatVarianceSum, iatWeight), 3),
    retransmission_rate: round(safeDiv(retrans, packets)),
    connection_frequency: round(safeDiv(flows.length, windowSeconds), 3),
    protocol_distribution: protocolDistribution,
  };
}

/** Per-flow derived features, stored alongside each canonical flow. */
export function deriveFlowFeatures(flow: CanonicalFlow): Record<string, number> {
  const seconds = flow.durationMs / 1000;
  return {
    packets_per_second: round(safeDiv(flow.packetCount, seconds || 1), 2),
    bytes_per_second: round(safeDiv(flow.byteCount, seconds || 1), 2),
    average_packet_size: round(safeDiv(flow.byteCount, flow.packetCount), 2),
    syn_ratio: round(safeDiv(flow.tcpFlags.syn, flow.packetCount)),
    rst_ratio: round(safeDiv(flow.tcpFlags.rst, flow.packetCount)),
    retransmission_rate: round(safeDiv(flow.retransmissionCount, flow.packetCount)),
  };
}
