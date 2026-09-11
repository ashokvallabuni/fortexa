/**
 * Server-only orchestration: validation -> parsing -> normalization ->
 * feature extraction -> windowing/state generation -> graph generation -> persistence.
 */
import { deriveFlowFeatures } from "@/lib/pipeline/features";
import { buildGraph } from "@/lib/pipeline/graph";
import { packetsToFlows } from "@/lib/pipeline/normalize";
import { parsePcap } from "@/lib/pipeline/pcap";
import { parseCsv, parseRecordDocument, recordsToFlows } from "@/lib/pipeline/tabular";
import {
  DEFAULT_WINDOW_SIZE,
  PipelineError,
  type CanonicalFlow,
  type ProcessingStatus,
  type SourceFormat,
  type WindowSize,
} from "@/lib/pipeline/types";
import { buildNetworkStates, type NetworkStateWindow } from "@/lib/pipeline/windowing";
import { MAX_STORED_FLOWS, validateUpload } from "./validation";

type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

async function admin(): Promise<Admin> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const iso = (ms: number) => new Date(Math.round(ms)).toISOString();

async function setStatus(uploadId: string, status: ProcessingStatus, progress: number, errorMessage?: string) {
  const db = await admin();
  await db
    .from("uploads")
    .update({ status, progress, error_message: errorMessage ?? null, updated_at: new Date().toISOString() })
    .eq("id", uploadId);
}

export async function logAudit(action: string, resourceType: string, resourceId: string, detail: Record<string, unknown>, actorId?: string | null) {
  const db = await admin();
  await db.from("audit_logs").insert({
    actor_id: actorId ?? null,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    detail: detail as never,
  });
}

/** Adapter dispatch — every input format converges on CanonicalFlow[]. */
export function parseToCanonicalFlows(bytes: Uint8Array, format: SourceFormat): CanonicalFlow[] {
  if (format === "pcap") {
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    return packetsToFlows(parsePcap(buffer));
  }
  const text = new TextDecoder().decode(bytes);
  if (format === "csv") return recordsToFlows(parseCsv(text), "csv");
  return recordsToFlows(parseRecordDocument(text), format);
}

export interface PersistResult {
  datasetId: string;
  flowCount: number;
  stateCount: number;
  entityCount: number;
  edgeCount: number;
  alertCount: number;
  timeStartMs: number;
  timeEndMs: number;
}

/** Feature extraction + windowing + graph + persistence for a canonical flow set. */
export async function persistAnalysis(
  datasetId: string,
  flowsInput: CanonicalFlow[],
  windowSizeSeconds: WindowSize,
  onStage?: (stage: ProcessingStatus, progress: number) => Promise<void>,
): Promise<PersistResult> {
  const db = await admin();
  const flows = flowsInput.slice(0, MAX_STORED_FLOWS).map((f) => ({ ...f, derived: deriveFlowFeatures(f) }));
  if (flows.length === 0) throw new PipelineError("PARSING", "No flows were produced from this input.");

  await onStage?.("FEATURE_EXTRACTION", 45);

  // Wipe any previous analysis for this dataset (idempotent re-processing).
  await Promise.all([
    db.from("network_flows").delete().eq("dataset_id", datasetId),
    db.from("network_features").delete().eq("dataset_id", datasetId),
    db.from("network_states").delete().eq("dataset_id", datasetId),
    db.from("network_entities").delete().eq("dataset_id", datasetId),
    db.from("graph_edges").delete().eq("dataset_id", datasetId),
    db.from("alerts").delete().eq("dataset_id", datasetId),
  ]);

  const flowRows = flows.map((f) => ({
    dataset_id: datasetId,
    flow_id: f.flowId,
    timestamp: iso(f.timestampMs),
    src_ip: f.srcIp,
    dst_ip: f.dstIp,
    src_port: f.srcPort,
    dst_port: f.dstPort,
    protocol: f.protocol,
    packet_count: f.packetCount,
    byte_count: f.byteCount,
    duration_ms: f.durationMs,
    tcp_flags: f.tcpFlags,
    ttl: f.ttl,
    iat_mean: f.iatMean,
    iat_std: f.iatStd,
    retransmission_count: f.retransmissionCount,
    derived: f.derived,
  }));
  await insertChunks(flowRows, "network_flows");

  await onStage?.("STATE_GENERATION", 65);
  const states: NetworkStateWindow[] = buildNetworkStates(flows, windowSizeSeconds);

  const stateRows = states.map((s, index) => ({
    dataset_id: datasetId,
    state_index: index,
    timestamp_start: iso(s.windowStartMs),
    timestamp_end: iso(s.windowEndMs),
    window_size_seconds: s.windowSizeSeconds,
    active_hosts: s.activeHosts,
    active_connections: s.uniqueConnections,
    packet_rate: s.features.packets_per_second,
    byte_rate: s.features.bytes_per_second,
    unique_ports: s.features.unique_destination_ports,
    syn_ratio: s.features.syn_ratio,
    rst_ratio: s.features.rst_ratio,
    iat_mean: s.features.iat_mean,
    iat_variance: s.features.iat_variance,
    retransmission_rate: s.features.retransmission_rate,
    protocol_distribution: s.protocolStats,
    graph_statistics: { ...s.graphStats, flow_count: s.flowCount, risk_score: s.riskScore },
    anomaly_score: s.anomalyScore,
  }));

  const { data: insertedStates, error: stateError } = await db.from("network_states").insert(stateRows).select("id, state_index");
  if (stateError) throw new PipelineError("STATE_GENERATION", stateError.message);

  const stateIdByIndex = new Map<number, string>();
  for (const row of insertedStates ?? []) stateIdByIndex.set(row.state_index as number, row.id as string);

  await insertChunks(
    states.map((s, index) => ({
      dataset_id: datasetId,
      state_id: stateIdByIndex.get(index) ?? null,
      scope: "window",
      entity_key: null,
      features: s.features as unknown as Record<string, unknown>,
    })),
    "network_features",
  );

  await onStage?.("GRAPH_GENERATION", 85);
  const graph = buildGraph(flows);

  await insertChunks(
    graph.entities.map((e) => ({
      dataset_id: datasetId,
      entity_key: e.entityKey,
      entity_type: e.entityType,
      label: e.label,
      first_seen: iso(e.firstSeenMs),
      last_seen: iso(e.lastSeenMs),
      packet_count: 0,
      byte_count: Number(e.properties["total_bytes"] ?? 0),
      connection_count: e.degree,
      risk_score: e.riskScore,
      metadata: e.properties,
    })),
    "network_entities",
  );

  await insertChunks(
    graph.edges.map((e) => ({
      dataset_id: datasetId,
      source_key: e.sourceKey,
      target_key: e.targetKey,
      relationship: e.relationshipType,
      weight: e.weight,
      packet_count: e.packetCount,
      byte_count: e.byteCount,
      first_seen: iso(e.firstSeenMs),
      last_seen: iso(e.lastSeenMs),
      metadata: {
        flow_count: e.flowCount,
        protocols: e.protocols,
        ports: e.ports,
        anomaly_score: e.anomalyScore,
      },
    })),
    "graph_edges",
  );

  // Deterministic alerting from state anomaly scores.
  const alertRows = states
    .map((s, index) => ({ s, index }))
    .filter(({ s }) => s.anomalyScore >= 0.45)
    .map(({ s, index }) => ({
      dataset_id: datasetId,
      state_id: stateIdByIndex.get(index) ?? null,
      severity: s.anomalyScore >= 0.75 ? "critical" : s.anomalyScore >= 0.6 ? "high" : "medium",
      title: describeAnomaly(s),
      description: `Window ${index} (${iso(s.windowStartMs)}) scored ${s.anomalyScore.toFixed(2)} across ${s.flowCount} flows.`,
      entity_key: null,
      detected_at: iso(s.windowStartMs),
      status: "open",
      evidence: { features: s.features, graph: s.graphStats },
    }));
  await insertChunks(alertRows, "alerts");

  const timeStartMs = Math.min(...flows.map((f) => f.timestampMs));
  const timeEndMs = Math.max(...flows.map((f) => f.timestampMs + f.durationMs));

  await db
    .from("datasets")
    .update({
      window_size_seconds: windowSizeSeconds,
      time_start: iso(timeStartMs),
      time_end: iso(timeEndMs),
      flow_count: flows.length,
      entity_count: graph.entities.length,
      state_count: states.length,
    })
    .eq("id", datasetId);

  return {
    datasetId,
    flowCount: flows.length,
    stateCount: states.length,
    entityCount: graph.entities.length,
    edgeCount: graph.edges.length,
    alertCount: alertRows.length,
    timeStartMs,
    timeEndMs,
  };
}

function describeAnomaly(s: NetworkStateWindow): string {
  if (s.features.unique_destination_ports > 100) return "Port scan pattern detected";
  if (s.features.syn_ratio > 0.6) return "SYN flood pattern detected";
  if (s.features.bytes_per_second > 1_000_000) return "Large outbound data transfer";
  if (s.features.rst_ratio > 0.3) return "Elevated connection resets";
  return "Anomalous traffic window";
}

async function insertChunks(rows: Record<string, unknown>[], table: string, size = 1000) {
  if (rows.length === 0) return;
  const db = (await admin()) as unknown as {
    from: (table: string) => { insert: (rows: unknown) => Promise<{ error: { message: string } | null }> };
  };
  for (let i = 0; i < rows.length; i += size) {
    const { error } = await db.from(table).insert(rows.slice(i, i + size));
    if (error) throw new PipelineError("PARSING", `Failed writing ${table}: ${error.message}`);
  }
}

/** Full ingestion run for a stored upload. */
export async function processUpload(uploadId: string, windowSizeSeconds: WindowSize = DEFAULT_WINDOW_SIZE) {
  const db = await admin();
  const { data: upload, error } = await db.from("uploads").select("*").eq("id", uploadId).maybeSingle();
  if (error || !upload) throw new PipelineError("VALIDATING", "Upload not found.");

  try {
    await setStatus(uploadId, "VALIDATING", 10);
    const download = await db.storage.from("network-uploads").download(upload.storage_path as string);
    if (download.error || !download.data) throw new PipelineError("VALIDATING", "Stored file could not be read back.");
    const bytes = new Uint8Array(await download.data.arrayBuffer());

    const validation = validateUpload(upload.filename as string, bytes.byteLength, bytes.slice(0, 512));

    await setStatus(uploadId, "PARSING", 25);
    const flows = parseToCanonicalFlows(bytes, validation.format);

    const result = await persistAnalysis(upload.dataset_id as string, flows, windowSizeSeconds, async (stage, progress) => {
      await setStatus(uploadId, stage, progress);
    });

    await db
      .from("uploads")
      .update({
        status: "COMPLETED",
        progress: 100,
        error_message: null,
        stats: {
          flows: result.flowCount,
          states: result.stateCount,
          entities: result.entityCount,
          edges: result.edgeCount,
          alerts: result.alertCount,
          format: validation.format,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", uploadId);

    await logAudit("ingestion.completed", "upload", uploadId, { ...result }, upload.owner_id as string | null);
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown processing error";
    const stage = err instanceof PipelineError ? err.stage : "PARSING";
    await setStatus(uploadId, "FAILED", 100, `[${stage}] ${message}`);
    await logAudit("ingestion.failed", "upload", uploadId, { stage, message }, upload.owner_id as string | null);
    throw err;
  }
}
