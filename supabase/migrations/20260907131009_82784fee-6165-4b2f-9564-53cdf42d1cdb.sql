
-- ROLES ---------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('admin', 'analyst', 'viewer');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_upsert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- DATASETS / UPLOADS --------------------------------------------------
CREATE TABLE public.datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  source_format TEXT NOT NULL CHECK (source_format IN ('pcap','csv','netflow','ipfix','synthetic')),
  is_demo BOOLEAN NOT NULL DEFAULT false,
  owner_id UUID,
  window_size_seconds INTEGER NOT NULL DEFAULT 10,
  time_start TIMESTAMPTZ,
  time_end TIMESTAMPTZ,
  flow_count INTEGER NOT NULL DEFAULT 0,
  entity_count INTEGER NOT NULL DEFAULT 0,
  state_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.datasets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.datasets TO authenticated;
GRANT ALL ON public.datasets TO service_role;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "datasets_public_read" ON public.datasets FOR SELECT USING (true);
CREATE POLICY "datasets_owner_write" ON public.datasets FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE TABLE public.uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE,
  owner_id UUID,
  filename TEXT NOT NULL,
  file_format TEXT NOT NULL CHECK (file_format IN ('pcap','csv','netflow','ipfix','synthetic')),
  size_bytes BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'UPLOADED' CHECK (status IN ('UPLOADED','VALIDATING','PARSING','FEATURE_EXTRACTION','STATE_GENERATION','GRAPH_GENERATION','COMPLETED','FAILED')),
  progress INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.uploads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.uploads TO authenticated;
GRANT ALL ON public.uploads TO service_role;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uploads_public_read" ON public.uploads FOR SELECT USING (true);
CREATE POLICY "uploads_owner_write" ON public.uploads FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE INDEX idx_uploads_dataset ON public.uploads(dataset_id);
CREATE INDEX idx_uploads_status ON public.uploads(status);

-- CANONICAL FLOWS -----------------------------------------------------
CREATE TABLE public.network_flows (
  id BIGSERIAL PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  flow_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  src_ip INET NOT NULL,
  dst_ip INET NOT NULL,
  src_port INTEGER,
  dst_port INTEGER,
  protocol TEXT NOT NULL,
  packet_count INTEGER NOT NULL DEFAULT 0,
  byte_count BIGINT NOT NULL DEFAULT 0,
  duration_ms DOUBLE PRECISION NOT NULL DEFAULT 0,
  tcp_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  ttl INTEGER,
  iat_mean DOUBLE PRECISION,
  iat_std DOUBLE PRECISION,
  retransmission_count INTEGER NOT NULL DEFAULT 0,
  derived JSONB NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT ON public.network_flows TO anon;
GRANT SELECT ON public.network_flows TO authenticated;
GRANT ALL ON public.network_flows TO service_role;
ALTER TABLE public.network_flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flows_public_read" ON public.network_flows FOR SELECT USING (true);
CREATE INDEX idx_flows_dataset_ts ON public.network_flows(dataset_id, timestamp);
CREATE INDEX idx_flows_src ON public.network_flows(dataset_id, src_ip);
CREATE INDEX idx_flows_dst ON public.network_flows(dataset_id, dst_ip);

-- NETWORK STATES ------------------------------------------------------
CREATE TABLE public.network_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  state_index INTEGER NOT NULL,
  timestamp_start TIMESTAMPTZ NOT NULL,
  timestamp_end TIMESTAMPTZ NOT NULL,
  window_size_seconds INTEGER NOT NULL,
  active_hosts INTEGER NOT NULL DEFAULT 0,
  active_connections INTEGER NOT NULL DEFAULT 0,
  packet_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  byte_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  unique_ports INTEGER NOT NULL DEFAULT 0,
  syn_ratio DOUBLE PRECISION NOT NULL DEFAULT 0,
  rst_ratio DOUBLE PRECISION NOT NULL DEFAULT 0,
  iat_mean DOUBLE PRECISION NOT NULL DEFAULT 0,
  iat_variance DOUBLE PRECISION NOT NULL DEFAULT 0,
  retransmission_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  protocol_distribution JSONB NOT NULL DEFAULT '{}'::jsonb,
  graph_statistics JSONB NOT NULL DEFAULT '{}'::jsonb,
  anomaly_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  UNIQUE (dataset_id, state_index)
);
GRANT SELECT ON public.network_states TO anon;
GRANT SELECT ON public.network_states TO authenticated;
GRANT ALL ON public.network_states TO service_role;
ALTER TABLE public.network_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "states_public_read" ON public.network_states FOR SELECT USING (true);
CREATE INDEX idx_states_dataset_time ON public.network_states(dataset_id, timestamp_start);

-- FEATURES ------------------------------------------------------------
CREATE TABLE public.network_features (
  id BIGSERIAL PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  state_id UUID REFERENCES public.network_states(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'window',
  entity_key TEXT,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.network_features TO anon;
GRANT SELECT ON public.network_features TO authenticated;
GRANT ALL ON public.network_features TO service_role;
ALTER TABLE public.network_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "features_public_read" ON public.network_features FOR SELECT USING (true);
CREATE INDEX idx_features_dataset ON public.network_features(dataset_id);
CREATE INDEX idx_features_state ON public.network_features(state_id);

-- ENTITIES ------------------------------------------------------------
CREATE TABLE public.network_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  entity_key TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('ip','host','server','domain','port')),
  label TEXT NOT NULL,
  first_seen TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  packet_count BIGINT NOT NULL DEFAULT 0,
  byte_count BIGINT NOT NULL DEFAULT 0,
  connection_count INTEGER NOT NULL DEFAULT 0,
  risk_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (dataset_id, entity_key)
);
GRANT SELECT ON public.network_entities TO anon;
GRANT SELECT ON public.network_entities TO authenticated;
GRANT ALL ON public.network_entities TO service_role;
ALTER TABLE public.network_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entities_public_read" ON public.network_entities FOR SELECT USING (true);
CREATE INDEX idx_entities_dataset ON public.network_entities(dataset_id, entity_type);

-- GRAPH ---------------------------------------------------------------
CREATE TABLE public.graph_edges (
  id BIGSERIAL PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  source_key TEXT NOT NULL,
  target_key TEXT NOT NULL,
  relationship TEXT NOT NULL CHECK (relationship IN ('COMMUNICATES_WITH','CONNECTS_TO','QUERIES','TRANSFERS_TO')),
  weight DOUBLE PRECISION NOT NULL DEFAULT 1,
  packet_count BIGINT NOT NULL DEFAULT 0,
  byte_count BIGINT NOT NULL DEFAULT 0,
  first_seen TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (dataset_id, source_key, target_key, relationship)
);
GRANT SELECT ON public.graph_edges TO anon;
GRANT SELECT ON public.graph_edges TO authenticated;
GRANT ALL ON public.graph_edges TO service_role;
ALTER TABLE public.graph_edges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edges_public_read" ON public.graph_edges FOR SELECT USING (true);
CREATE INDEX idx_edges_dataset ON public.graph_edges(dataset_id);
CREATE INDEX idx_edges_source ON public.graph_edges(dataset_id, source_key);
CREATE INDEX idx_edges_target ON public.graph_edges(dataset_id, target_key);

-- ALERTS --------------------------------------------------------------
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  state_id UUID REFERENCES public.network_states(id) ON DELETE SET NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  title TEXT NOT NULL,
  description TEXT,
  entity_key TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved')),
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT ON public.alerts TO anon;
GRANT SELECT, UPDATE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts_public_read" ON public.alerts FOR SELECT USING (true);
CREATE INDEX idx_alerts_dataset ON public.alerts(dataset_id, detected_at DESC);

-- MODEL VERSIONS ------------------------------------------------------
CREATE TABLE public.model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'phase1',
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, version)
);
GRANT SELECT ON public.model_versions TO anon;
GRANT SELECT ON public.model_versions TO authenticated;
GRANT ALL ON public.model_versions TO service_role;
ALTER TABLE public.model_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "models_public_read" ON public.model_versions FOR SELECT USING (true);

-- AUDIT LOGS ----------------------------------------------------------
CREATE TABLE public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_admin_read" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);
