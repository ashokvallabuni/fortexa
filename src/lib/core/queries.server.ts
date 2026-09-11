/** Read layer: maps stored rows onto the contracts the frontend already uses. */
import type { GraphEdge, GraphNode, NetworkFlow, NetworkState, RiskLevel } from '@/types';
import type { Alert, AlertSeverity } from '@/types';

async function admin() {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  return supabaseAdmin;
}

export function riskLevel(score: number): RiskLevel {
  if (score >= 0.8) return 'critical';
  if (score >= 0.6) return 'high';
  if (score >= 0.4) return 'medium';
  if (score >= 0.2) return 'low';
  return 'safe';
}

export interface DatasetSummary {
  id: string;
  name: string;
  description: string | null;
  sourceFormat: string;
  windowSizeSeconds: number;
  timeStart: string | null;
  timeEnd: string | null;
  flowCount: number;
  entityCount: number;
  stateCount: number;
  createdAt: string;
}

export async function listDatasets(): Promise<DatasetSummary[]> {
  const db = await admin();
  const { data, error } = await db
    .from('datasets')
    .select('*')
    .gt('state_count', 0)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    sourceFormat: d.source_format,
    windowSizeSeconds: d.window_size_seconds,
    timeStart: d.time_start,
    timeEnd: d.time_end,
    flowCount: d.flow_count,
    entityCount: d.entity_count,
    stateCount: d.state_count,
    createdAt: d.created_at,
  }));
}

/** Latest completed dataset — used when the UI does not specify one. */
export async function resolveDatasetId(datasetId?: string | null): Promise<string | null> {
  if (datasetId) return datasetId;
  const datasets = await listDatasets();
  return datasets[0]?.id ?? null;
}

export async function getNetworkStates(datasetId: string, limit = 40): Promise<NetworkState[]> {
  const db = await admin();
  const { data, error } = await db
    .from('network_states')
    .select('*')
    .eq('dataset_id', datasetId)
    .order('state_index', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  const rows = (data ?? []).slice().reverse();
  const { data: featureRows } = await db
    .from('network_features')
    .select('state_id, features')
    .eq('dataset_id', datasetId)
    .eq('scope', 'window');
  const featuresByState = new Map<string, Record<string, unknown>>();
  for (const row of featureRows ?? []) {
    if (row.state_id)
      featuresByState.set(row.state_id, (row.features ?? {}) as Record<string, unknown>);
  }

  return rows.map((row) => {
    const features = featuresByState.get(row.id) ?? {};
    const graph = (row.graph_statistics ?? {}) as Record<string, number>;
    const protocolStats = (row.protocol_distribution ?? {}) as Record<
      string,
      { packets: number; bytes: number }
    >;
    const totalPackets = Number(features['packet_count'] ?? 0);
    const totalBytes = Number(features['byte_count'] ?? 0);
    const protocols: Record<string, number> = {};
    for (const [proto, stats] of Object.entries(protocolStats)) {
      protocols[proto] = totalPackets > 0 ? Number((stats.packets / totalPackets).toFixed(4)) : 0;
    }
    const risk = Number(graph['risk_score'] ?? row.anomaly_score ?? 0);

    return {
      timestamp: row.timestamp_start,
      windowId: row.state_index,
      activeHosts: row.active_hosts,
      activeConnections: row.active_connections,
      totalPackets,
      totalBytes,
      uniquePorts: row.unique_ports,
      avgFlowDuration:
        Number(features['flow_duration_ms'] ?? 0) / Math.max(1, Number(graph['flow_count'] ?? 1)),
      synRate: row.syn_ratio,
      retransmissionRate: row.retransmission_rate,
      newDestinationPorts: Number(features['unique_destination_ports'] ?? row.unique_ports),
      connectionFrequency: Number(features['connection_frequency'] ?? 0),
      trafficVolumeMbps: Number(((row.byte_rate * 8) / 1_000_000).toFixed(3)),
      riskScore: Number((risk * 100).toFixed(1)),
      riskLevel: riskLevel(risk),
      protocols,
      topPorts: [],
      anomalyScore: Number((row.anomaly_score * 100).toFixed(1)),
    } satisfies NetworkState;
  });
}

export async function getFlows(
  datasetId: string,
  page = 0,
  pageSize = 25,
): Promise<{ flows: NetworkFlow[]; total: number }> {
  const db = await admin();
  const from = page * pageSize;
  const { data, error, count } = await db
    .from('network_flows')
    .select('*', { count: 'exact' })
    .eq('dataset_id', datasetId)
    .order('timestamp', { ascending: false })
    .range(from, from + pageSize - 1);
  if (error) throw new Error(error.message);

  const flows: NetworkFlow[] = (data ?? []).map((row) => {
    const flags = (row.tcp_flags ?? {}) as Record<string, number>;
    const derived = (row.derived ?? {}) as Record<string, number>;
    const risk = Math.min(
      1,
      (derived['syn_ratio'] ?? 0) * 0.5 +
        (derived['rst_ratio'] ?? 0) * 0.3 +
        (derived['retransmission_rate'] ?? 0) * 0.2,
    );
    return {
      id: `${row.id}`,
      timestamp: row.timestamp,
      srcIp: String(row.src_ip),
      dstIp: String(row.dst_ip),
      protocol: row.protocol,
      srcPort: row.src_port ?? 0,
      dstPort: row.dst_port ?? 0,
      packets: row.packet_count,
      bytes: Number(row.byte_count),
      duration: Number((row.duration_ms / 1000).toFixed(3)),
      riskScore: Number((risk * 100).toFixed(1)),
      flags: Object.entries(flags)
        .filter(([, v]) => Number(v) > 0)
        .map(([k]) => k.toUpperCase()),
    };
  });

  return { flows, total: count ?? flows.length };
}

export async function getGraph(
  datasetId: string,
  maxNodes = 250,
): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const db = await admin();
  const [{ data: entityRows, error: entityError }, { data: edgeRows, error: edgeError }] =
    await Promise.all([
      db
        .from('network_entities')
        .select('*')
        .eq('dataset_id', datasetId)
        .order('connection_count', { ascending: false })
        .limit(maxNodes),
      db
        .from('graph_edges')
        .select('*')
        .eq('dataset_id', datasetId)
        .order('weight', { ascending: false })
        .limit(800),
    ]);
  if (entityError) throw new Error(entityError.message);
  if (edgeError) throw new Error(edgeError.message);

  const nodes: GraphNode[] = (entityRows ?? []).map((row) => ({
    id: row.entity_key,
    type: row.entity_type as GraphNode['type'],
    label: row.label,
    riskScore: Number((row.risk_score * 100).toFixed(1)),
    riskLevel: riskLevel(row.risk_score),
    connections: row.connection_count,
    trafficMbps: Number(((Number(row.byte_count) * 8) / 1_000_000).toFixed(3)),
    lastSeen: row.last_seen ?? new Date().toISOString(),
    properties: (row.metadata ?? {}) as Record<string, string | number | boolean>,
  }));

  const known = new Set(nodes.map((n) => n.id));
  const edges: GraphEdge[] = (edgeRows ?? [])
    .filter((row) => known.has(row.source_key) && known.has(row.target_key))
    .map((row) => {
      const meta = (row.metadata ?? {}) as Record<string, number>;
      return {
        id: `${row.id}`,
        source: row.source_key,
        target: row.target_key,
        relationship: row.relationship as GraphEdge['relationship'],
        weight: row.weight,
        packetCount: Number(row.packet_count),
        byteCount: Number(row.byte_count),
        riskScore: Number(((meta['anomaly_score'] ?? 0) * 100).toFixed(1)),
        lastActivity: row.last_seen ?? new Date().toISOString(),
      };
    });

  return { nodes, edges };
}

export async function getAlerts(datasetId: string, limit = 50): Promise<Alert[]> {
  const db = await admin();
  const { data, error } = await db
    .from('alerts')
    .select('*')
    .eq('dataset_id', datasetId)
    .order('detected_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    createdAt: row.detected_at,
    severity: (row.severity as AlertSeverity) || "medium",
    riskScore: row.severity === "critical" ? 88 : row.severity === "high" ? 72 : row.severity === "medium" ? 55 : 25,
    confidence: 0.85,
    forecastHorizon: 5,
    affectedEntities: row.entity_key ? [row.entity_key] : [],
    predictedBehavior: row.title,
    reason: row.description || row.title,
    label: "observed" as const,
    isAcknowledged: row.status === "acknowledged",
    isResolved: row.status === "resolved",
  }));
}
