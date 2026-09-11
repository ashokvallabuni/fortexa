ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'researcher';

ALTER TABLE public.datasets
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS license TEXT,
  ADD COLUMN IF NOT EXISTS provenance TEXT,
  ADD COLUMN IF NOT EXISTS validation_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'not_started';

ALTER TABLE public.datasets DROP CONSTRAINT IF EXISTS datasets_source_format_check;
ALTER TABLE public.datasets ADD CONSTRAINT datasets_source_format_check
  CHECK (source_format IN ('pcap', 'csv', 'netflow', 'ipfix'));
ALTER TABLE public.datasets DROP COLUMN IF EXISTS is_demo;

DROP POLICY IF EXISTS "datasets_public_read" ON public.datasets;
DROP POLICY IF EXISTS "uploads_public_read" ON public.uploads;
DROP POLICY IF EXISTS "flows_public_read" ON public.network_flows;
DROP POLICY IF EXISTS "states_public_read" ON public.network_states;
DROP POLICY IF EXISTS "features_public_read" ON public.network_features;
DROP POLICY IF EXISTS "entities_public_read" ON public.network_entities;
DROP POLICY IF EXISTS "edges_public_read" ON public.graph_edges;
DROP POLICY IF EXISTS "alerts_public_read" ON public.alerts;
DROP POLICY IF EXISTS "models_public_read" ON public.model_versions;

CREATE POLICY "datasets_owner_read" ON public.datasets FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "uploads_owner_read" ON public.uploads FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "flows_owner_read" ON public.network_flows FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.datasets d WHERE d.id = dataset_id AND (d.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "states_owner_read" ON public.network_states FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.datasets d WHERE d.id = dataset_id AND (d.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "features_owner_read" ON public.network_features FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.datasets d WHERE d.id = dataset_id AND (d.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "entities_owner_read" ON public.network_entities FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.datasets d WHERE d.id = dataset_id AND (d.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "edges_owner_read" ON public.graph_edges FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.datasets d WHERE d.id = dataset_id AND (d.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "alerts_owner_read" ON public.alerts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.datasets d WHERE d.id = dataset_id AND (d.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "models_authenticated_read" ON public.model_versions FOR SELECT TO authenticated USING (true);