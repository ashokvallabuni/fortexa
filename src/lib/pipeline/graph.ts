/**
 * Dynamic network graph construction G(t) = (V, E).
 * Entities: ip / host / server / domain / port.
 * Relationships: COMMUNICATES_WITH / CONNECTS_TO / QUERIES / TRANSFERS_TO.
 */
import type { CanonicalFlow } from "./types";

export type EntityType = "ip" | "host" | "server" | "domain" | "port";
export type RelationshipType = "COMMUNICATES_WITH" | "CONNECTS_TO" | "QUERIES" | "TRANSFERS_TO";

export interface GraphEntity {
  entityKey: string;
  entityType: EntityType;
  label: string;
  properties: Record<string, unknown>;
  degree: number;
  riskScore: number;
  firstSeenMs: number;
  lastSeenMs: number;
}

export interface GraphEdge {
  sourceKey: string;
  targetKey: string;
  relationshipType: RelationshipType;
  weight: number;
  flowCount: number;
  packetCount: number;
  byteCount: number;
  protocols: string[];
  ports: number[];
  firstSeenMs: number;
  lastSeenMs: number;
  anomalyScore: number;
}

export interface NetworkGraph {
  entities: GraphEntity[];
  edges: GraphEdge[];
}

const isPrivate = (ip: string) =>
  /^10\./.test(ip) || /^192\.168\./.test(ip) || /^172\.(1[6-9]|2\d|3[01])\./.test(ip) || ip === "127.0.0.1";

const SERVER_PORTS = new Set([22, 25, 53, 80, 110, 143, 389, 443, 445, 587, 993, 995, 1433, 3306, 3389, 5432, 8080, 8443]);

function classify(ip: string, servedPorts: Set<number>): EntityType {
  if ([...servedPorts].some((p) => SERVER_PORTS.has(p))) return "server";
  return isPrivate(ip) ? "host" : "ip";
}

function relationshipFor(flow: CanonicalFlow): RelationshipType {
  if (flow.dstPort === 53) return "QUERIES";
  if (flow.byteCount > 1_000_000) return "TRANSFERS_TO";
  if (flow.protocol === "TCP" && flow.dstPort !== null && SERVER_PORTS.has(flow.dstPort)) return "CONNECTS_TO";
  return "COMMUNICATES_WITH";
}

export function buildGraph(flows: CanonicalFlow[]): NetworkGraph {
  const served = new Map<string, Set<number>>();
  for (const f of flows) {
    if (f.dstPort !== null) {
      const set = served.get(f.dstIp) ?? new Set<number>();
      set.add(f.dstPort);
      served.set(f.dstIp, set);
    }
  }

  const entities = new Map<string, GraphEntity>();
  const edges = new Map<string, GraphEdge>();

  const touch = (ip: string, tsMs: number, bytes: number) => {
    let entity = entities.get(ip);
    if (!entity) {
      entity = {
        entityKey: ip,
        entityType: classify(ip, served.get(ip) ?? new Set()),
        label: ip,
        properties: { private: isPrivate(ip), served_ports: [...(served.get(ip) ?? [])].slice(0, 25) },
        degree: 0,
        riskScore: 0,
        firstSeenMs: tsMs,
        lastSeenMs: tsMs,
      };
      entities.set(ip, entity);
    }
    entity.firstSeenMs = Math.min(entity.firstSeenMs, tsMs);
    entity.lastSeenMs = Math.max(entity.lastSeenMs, tsMs + 1);
    entity.properties["total_bytes"] = ((entity.properties["total_bytes"] as number) ?? 0) + bytes;
  };

  for (const flow of flows) {
    touch(flow.srcIp, flow.timestampMs, flow.byteCount);
    touch(flow.dstIp, flow.timestampMs, flow.byteCount);

    const relationshipType = relationshipFor(flow);
    const key = `${flow.srcIp}|${flow.dstIp}|${relationshipType}`;
    let edge = edges.get(key);
    if (!edge) {
      edge = {
        sourceKey: flow.srcIp,
        targetKey: flow.dstIp,
        relationshipType,
        weight: 0,
        flowCount: 0,
        packetCount: 0,
        byteCount: 0,
        protocols: [],
        ports: [],
        firstSeenMs: flow.timestampMs,
        lastSeenMs: flow.timestampMs,
        anomalyScore: 0,
      };
      edges.set(key, edge);
    }
    edge.flowCount += 1;
    edge.packetCount += flow.packetCount;
    edge.byteCount += flow.byteCount;
    edge.firstSeenMs = Math.min(edge.firstSeenMs, flow.timestampMs);
    edge.lastSeenMs = Math.max(edge.lastSeenMs, flow.timestampMs + flow.durationMs);
    if (!edge.protocols.includes(flow.protocol)) edge.protocols.push(flow.protocol);
    if (flow.dstPort !== null && !edge.ports.includes(flow.dstPort) && edge.ports.length < 25) {
      edge.ports.push(flow.dstPort);
    }
  }

  const maxFlowCount = Math.max(1, ...[...edges.values()].map((e) => e.flowCount));
  for (const edge of edges.values()) {
    edge.weight = Number((edge.flowCount / maxFlowCount).toFixed(4));
    const portSpread = Math.min(1, edge.ports.length / 20);
    const burst = Math.min(1, edge.packetCount / 20_000);
    edge.anomalyScore = Number(Math.min(1, 0.6 * portSpread + 0.4 * burst).toFixed(4));

    const src = entities.get(edge.sourceKey);
    const dst = entities.get(edge.targetKey);
    if (src) src.degree += 1;
    if (dst) dst.degree += 1;
  }

  const maxDegree = Math.max(1, ...[...entities.values()].map((e) => e.degree));
  for (const entity of entities.values()) {
    entity.riskScore = Number(Math.min(1, entity.degree / maxDegree).toFixed(4));
  }

  return { entities: [...entities.values()], edges: [...edges.values()] };
}
