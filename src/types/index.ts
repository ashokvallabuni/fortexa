// ─── Core Data Contracts ─────────────────────────────────────────────────────

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'safe';
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type DataLabel = 'observed' | 'inferred' | 'forecast' | 'recommendation';
export type ModelStatus = 'ready' | 'training' | 'error' | 'idle';

export interface NetworkState {
  timestamp: string;
  windowId: number;
  activeHosts: number;
  activeConnections: number;
  totalPackets: number;
  totalBytes: number;
  uniquePorts: number;
  avgFlowDuration: number;
  synRate: number;
  retransmissionRate: number;
  newDestinationPorts: number;
  connectionFrequency: number;
  trafficVolumeMbps: number;
  riskScore: number;
  riskLevel: RiskLevel;
  protocols: Record<string, number>;
  topPorts: Array<{ port: number; count: number }>;
  anomalyScore: number;
}

export interface NetworkFlow {
  id: string;
  timestamp: string;
  srcIp: string;
  dstIp: string;
  protocol: string;
  srcPort: number;
  dstPort: number;
  packets: number;
  bytes: number;
  duration: number;
  riskScore: number;
  flags: string[];
}

export interface GraphNode {
  id: string;
  type: 'ip' | 'host' | 'server' | 'domain' | 'port';
  label: string;
  riskScore: number;
  riskLevel: RiskLevel;
  connections: number;
  trafficMbps: number;
  lastSeen: string;
  properties: Record<string, string | number | boolean>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: 'COMMUNICATES_WITH' | 'CONNECTS_TO' | 'QUERIES' | 'TRANSFERS_TO';
  weight: number;
  packetCount: number;
  byteCount: number;
  riskScore: number;
  lastActivity: string;
}

export interface ForecastState {
  windowIndex: number;
  timestamp: string;
  predictedRisk: number;
  confidence: number;
  riskLevel: RiskLevel;
  potentialTactic: string;
  importantFeatures: FeatureContribution[];
  deltaFromCurrent: number;
  isObserved: boolean;
}

export interface Forecast {
  id: string;
  createdAt: string;
  horizon: number;
  currentRisk: number;
  currentRiskLevel: RiskLevel;
  modelVersion: string;
  states: ForecastState[];
  overallConfidence: number;
  predictedAttackProgression: AttackStage[];
}

export interface AttackStage {
  id: string;
  mitreId: string;
  tacticName: string;
  techniqueName: string;
  probability: number;
  confidence: number;
  label: DataLabel;
  timestamp?: string;
  evidence: string[];
  affectedEntities: string[];
  description: string;
}

export interface FeatureContribution {
  feature: string;
  contribution: number;
  direction: 'positive' | 'negative';
  value: number | string;
  unit?: string;
  description: string;
}

export interface Alert {
  id: string;
  createdAt: string;
  severity: AlertSeverity;
  riskScore: number;
  confidence: number;
  forecastHorizon: number;
  affectedEntities: string[];
  predictedBehavior: string;
  reason: string;
  label: DataLabel;
  isAcknowledged: boolean;
  isResolved: boolean;
  relatedForecastId?: string;
}

export interface ModelVersion {
  id: string;
  name: string;
  purpose: string;
  status: ModelStatus;
  version: string;
  latencyMs: number;
  lastUpdated: string;
  architecture: string;
  description: string;
}

export interface EvaluationMetric {
  modelName: string;
  precision: number | null;
  recall: number | null;
  f1: number | null;
  falsePositiveRate: number | null;
  auroc: number | null;
  auprc: number | null;
  brierScore: number | null;
  earlyWarningLeadTime: number | null;
  calibration: number | null;
  available: boolean;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  label?: DataLabel;
  sources?: string[];
}

export interface IngestionFile {
  id: string;
  name: string;
  size: number;
  type: 'pcap' | 'netflow' | 'ipfix' | 'csv';
  status: 'uploading' | 'validated' | 'parsing' | 'extracting' | 'windowing' | 'generating_state' | 'generating_graph' | 'ready' | 'error';
  progress: number;
  records?: number;
  timeRange?: { start: string; end: string };
  networkEntities?: number;
  errorMessage?: string;
  uploadedAt: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  behavior: string;
  label: DataLabel;
  confidence: number;
  evidence: string[];
  mitreMapping?: {
    tacticId: string;
    tacticName: string;
    techniqueId: string;
    techniqueName: string;
  };
  affectedEntities: string[];
}

export interface SystemStatus {
  status: 'operational' | 'degraded' | 'error';
  modelVersion: string;
  datasetStatus: 'loaded' | 'processing' | 'empty';
  datasetName?: string;
  lastUpdated: string;
  isDemoMode: boolean;
}
