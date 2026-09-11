/**
 * Deterministic synthetic demo dataset.
 * Seeded PRNG only — the same seed always produces byte-identical flows,
 * so demo mode is fully reproducible and never uses Math.random().
 */
import { emptyFlags, type CanonicalFlow } from "./types";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface DemoOptions {
  seed?: number;
  /** Fixed epoch start so states/graph are reproducible across runs. */
  startMs?: number;
  durationSeconds?: number;
}

export const DEMO_SEED = 20240117;
export const DEMO_START_MS = Date.UTC(2024, 0, 17, 9, 0, 0);

const INTERNAL = ["10.0.1.15", "10.0.1.22", "10.0.1.37", "10.0.2.8", "10.0.2.41", "10.0.3.12", "10.0.3.99", "192.168.10.5"];
const SERVERS = ["10.0.5.10", "10.0.5.11", "10.0.5.20"];
const EXTERNAL = ["52.94.236.248", "104.18.32.115", "142.250.185.78", "185.199.108.153", "203.0.113.77"];
const ATTACKER = "198.51.100.66";

const pick = <T,>(rng: () => number, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]!;

function makeFlow(
  index: number,
  tsMs: number,
  srcIp: string,
  dstIp: string,
  srcPort: number,
  dstPort: number,
  protocol: string,
  packets: number,
  bytes: number,
  durationMs: number,
  flags: Partial<ReturnType<typeof emptyFlags>> = {},
  retrans = 0,
): CanonicalFlow {
  const iatMean = packets > 1 ? durationMs / (packets - 1) : 0;
  return {
    flowId: `synthetic-${index}`,
    timestampMs: Math.round(tsMs),
    srcIp,
    dstIp,
    srcPort,
    dstPort,
    protocol,
    packetCount: packets,
    byteCount: bytes,
    durationMs: Math.round(durationMs),
    tcpFlags: { ...emptyFlags(), ...flags },
    ttl: 64,
    iatMean: Number(iatMean.toFixed(2)),
    iatStd: Number((iatMean * 0.25).toFixed(2)),
    retransmissionCount: retrans,
    derived: {},
  };
}

/**
 * Timeline (10 minutes):
 *  0-3 min  baseline office traffic
 *  3-5 min  port scan from 198.51.100.66
 *  5-7 min  SYN flood against 10.0.5.10
 *  7-10 min large outbound data transfer (exfiltration pattern)
 */
export function generateSyntheticFlows(options: DemoOptions = {}): CanonicalFlow[] {
  const rng = mulberry32(options.seed ?? DEMO_SEED);
  const start = options.startMs ?? DEMO_START_MS;
  const duration = (options.durationSeconds ?? 600) * 1000;
  const flows: CanonicalFlow[] = [];
  let i = 0;

  // Baseline traffic across the whole window.
  const baselineCount = 900;
  for (let n = 0; n < baselineCount; n++) {
    const ts = start + rng() * duration;
    const internal = pick(rng, INTERNAL);
    const outbound = rng() > 0.35;
    const dst = outbound ? pick(rng, EXTERNAL) : pick(rng, SERVERS);
    const dstPort = outbound ? (rng() > 0.2 ? 443 : 80) : pick(rng, [22, 445, 3306, 5432, 8080]);
    const packets = 4 + Math.floor(rng() * 60);
    const bytes = packets * (200 + Math.floor(rng() * 900));
    flows.push(
      makeFlow(i++, ts, internal, dst, 32768 + Math.floor(rng() * 28000), dstPort, "TCP", packets, bytes, 200 + rng() * 4000, {
        syn: 1,
        ack: packets - 1,
        fin: 1,
      }, rng() > 0.9 ? 1 : 0),
    );
  }

  // DNS lookups.
  for (let n = 0; n < 220; n++) {
    const ts = start + rng() * duration;
    flows.push(makeFlow(i++, ts, pick(rng, INTERNAL), "10.0.5.20", 40000 + Math.floor(rng() * 20000), 53, "UDP", 2, 180 + Math.floor(rng() * 200), 10 + rng() * 40));
  }

  // Port scan: 3-5 min.
  for (let port = 1; port <= 420; port++) {
    const ts = start + 180_000 + (port / 420) * 120_000;
    flows.push(makeFlow(i++, ts, ATTACKER, "10.0.5.10", 50000 + port, port, "TCP", 2, 120, 5, { syn: 1, rst: 1 }));
  }

  // SYN flood: 5-7 min.
  for (let n = 0; n < 700; n++) {
    const ts = start + 300_000 + rng() * 120_000;
    flows.push(makeFlow(i++, ts, ATTACKER, "10.0.5.10", 20000 + Math.floor(rng() * 40000), 443, "TCP", 1, 60, 1, { syn: 1 }));
  }

  // Exfiltration: 7-10 min.
  for (let n = 0; n < 40; n++) {
    const ts = start + 420_000 + rng() * 180_000;
    const packets = 2500 + Math.floor(rng() * 2500);
    flows.push(
      makeFlow(i++, ts, "10.0.3.99", ATTACKER, 44444, 8443, "TCP", packets, packets * 1400, 3000 + rng() * 4000, {
        syn: 1,
        ack: packets - 2,
        psh: Math.floor(packets / 3),
      }, Math.floor(rng() * 12)),
    );
  }

  flows.sort((a, b) => a.timestampMs - b.timestampMs);
  return flows.map((f, index) => ({ ...f, flowId: `synthetic-${index}` }));
}
