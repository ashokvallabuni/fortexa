/** Deterministic demo dataset loader (idempotent). */
import { generateSyntheticFlows } from "@/lib/pipeline/demo";
import { DEFAULT_WINDOW_SIZE } from "@/lib/pipeline/types";
import { logAudit, persistAnalysis } from "./pipeline.server";

const DEMO_NAME = "Synthetic Enterprise Capture v3";

export async function loadDemoDataset() {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");

  const { data: existing } = await db.from("datasets").select("id, state_count").eq("name", DEMO_NAME).maybeSingle();

  let datasetId = existing?.id as string | undefined;
  if (!datasetId) {
    const { data, error } = await db
      .from("datasets")
      .insert({
        name: DEMO_NAME,
        description: "Deterministic synthetic enterprise traffic: baseline, port scan, SYN flood and data exfiltration.",
        source_format: "pcap",
        provenance: "synthetic-benchmark-v3",
        license: "CC-BY-4.0",
        validation_status: "validated",
        processing_status: "ready",
        window_size_seconds: DEFAULT_WINDOW_SIZE,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    datasetId = data.id as string;
  } else if ((existing?.state_count ?? 0) > 0) {
    return { datasetId, regenerated: false };
  }

  const flows = generateSyntheticFlows();
  const result = await persistAnalysis(datasetId, flows, DEFAULT_WINDOW_SIZE);
  await logAudit("demo.loaded", "dataset", datasetId, { ...result });
  return { ...result, datasetId, regenerated: true };
}
