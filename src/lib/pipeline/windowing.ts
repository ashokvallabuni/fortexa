/**
 * Time-windowing + Network State Engine.
 * Produces the discrete network state S(t) for each aligned time window.
 */
import { extractFeatures, type FeatureVector } from "./features";
import type { CanonicalFlow, WindowSize } from "./types";

export interface NetworkStateWindow {
  windowStartMs: number;
  windowEndMs: number;
  windowSizeSeconds: WindowSize;
  flowCount: number;
  packetCount: number;
  byteCount: number;
  activeHosts: number;
  uniqueConnections: number;
  features: FeatureVector;
  protocolStats: Record<string, { flows: number; packets: number; bytes: number }>;
  graphStats: { nodes: number; edges: number; density: number; avgDegree: number };
  anomalyScore: number;
  riskScore: number;
}

/** Aligns flows onto fixed window boundaries; windows with no traffic are still emitted. */
export function buildWindows(flows: CanonicalFlow[], windowSizeSeconds: WindowSize): CanonicalFlow[][] {
  if (flows.length === 0) return [];
  const sizeMs = windowSizeSeconds * 1000;
  const start = Math.floor(Math.min(...flows.map((f) => f.timestampMs)) / sizeMs) * sizeMs;
  const end = Math.max(...flows.map((f) => f.timestampMs + f.durationMs));
  const count = Math.max(1, Math.min(5000, Math.ceil((end - start) / sizeMs)));

  const buckets: CanonicalFlow[][] = Array.from({ length: count }, () => []);
  for (const flow of flows) {
    const index = Math.min(count - 1, Math.max(0, Math.floor((flow.timestampMs - start) / sizeMs)));
    buckets[index]!.push(flow);
  }
  return buckets;
}

const clamp = (v: number) => Math.max(0, Math.min(1, v));

/** Per-source behavioural scoring: scanning, SYN flooding and bulk egress. */
function perSourceAnomaly(bucket: CanonicalFlow[], windowSeconds: number): number {
  const bySource = new Map<string, { ports: Set<number>; synOnly: number; flows: number; bytes: number }>();
  for (const f of bucket) {
    const entry = bySource.get(f.srcIp) ?? { ports: new Set<number>(), synOnly: 0, flows: 0, bytes: 0 };
    if (f.dstPort !== null) entry.ports.add(f.dstPort);
    if (f.tcpFlags.syn > 0 && f.tcpFlags.ack === 0) entry.synOnly += 1;
    entry.flows += 1;
    entry.bytes += f.byteCount;
    bySource.set(f.srcIp, entry);
  }

  let worst = 0;
  for (const entry of bySource.values()) {
    const portFanOut = clamp(entry.ports.size / 25);
    const synOnlyRatio = clamp(entry.synOnly / Math.max(1, entry.flows));
    const synRate = clamp(entry.synOnly / windowSeconds / 5);
    const egress = clamp(entry.bytes / windowSeconds / 1_500_000);
    worst = Math.max(worst, clamp(Math.max(portFanOut, 0.5 * synOnlyRatio + 0.5 * synRate, egress)));
  }
  return worst;
}

function scoreWindow(
  features: FeatureVector,
  graphStats: NetworkStateWindow["graphStats"],
  bucket: CanonicalFlow[],
  windowSeconds: number,
): { anomalyScore: number; riskScore: number } {
  // Deterministic heuristic scoring over normalized signals (0..1).
  const behavioural = perSourceAnomaly(bucket, windowSeconds);
  const resets = clamp(features.rst_ratio * 2);
  const volume = clamp(features.bytes_per_second / 5_000_000);
  const fanOut = clamp(features.unique_destination_ips / 120);
  const instability = clamp(features.retransmission_rate * 6);
  const density = clamp(graphStats.density * 2);

  const anomaly = clamp(0.7 * behavioural + 0.1 * resets + 0.08 * fanOut + 0.06 * instability + 0.06 * volume);
  const risk = clamp(0.7 * anomaly + 0.15 * density + 0.15 * volume);
  return { anomalyScore: Number(anomaly.toFixed(4)), riskScore: Number(risk.toFixed(4)) };
}


export function buildNetworkStates(
  flows: CanonicalFlow[],
  windowSizeSeconds: WindowSize,
  startOverrideMs?: number,
): NetworkStateWindow[] {
  const sizeMs = windowSizeSeconds * 1000;
  const buckets = buildWindows(flows, windowSizeSeconds);
  if (buckets.length === 0) return [];
  const baseStart =
    startOverrideMs ?? Math.floor(Math.min(...flows.map((f) => f.timestampMs)) / sizeMs) * sizeMs;

  return buckets.map((bucket, index) => {
    const windowStartMs = baseStart + index * sizeMs;
    const features = extractFeatures(bucket, windowSizeSeconds);

    const hosts = new Set<string>();
    const pairs = new Set<string>();
    const protocolStats: NetworkStateWindow["protocolStats"] = {};

    for (const f of bucket) {
      hosts.add(f.srcIp);
      hosts.add(f.dstIp);
      pairs.add(`${f.srcIp}->${f.dstIp}`);
      const entry = (protocolStats[f.protocol] ??= { flows: 0, packets: 0, bytes: 0 });
      entry.flows += 1;
      entry.packets += f.packetCount;
      entry.bytes += f.byteCount;
    }

    const nodes = hosts.size;
    const edges = pairs.size;
    const possible = nodes * (nodes - 1);
    const graphStats = {
      nodes,
      edges,
      density: possible > 0 ? Number((edges / possible).toFixed(5)) : 0,
      avgDegree: nodes > 0 ? Number(((2 * edges) / nodes).toFixed(3)) : 0,
    };

    const { anomalyScore, riskScore } = scoreWindow(features, graphStats, bucket, windowSizeSeconds);

    return {
      windowStartMs,
      windowEndMs: windowStartMs + sizeMs,
      windowSizeSeconds,
      flowCount: bucket.length,
      packetCount: features.packet_count,
      byteCount: features.byte_count,
      activeHosts: nodes,
      uniqueConnections: edges,
      features,
      protocolStats,
      graphStats,
      anomalyScore,
      riskScore,
    };
  });
}
