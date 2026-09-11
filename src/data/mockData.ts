import type {
  NetworkState, NetworkFlow, GraphNode, GraphEdge,
  Forecast, ForecastState, AttackStage, FeatureContribution,
  Alert, ModelVersion, EvaluationMetric, TimelineEvent, SystemStatus
} from '@/types';

// ─── Deterministic Synthetic Enterprise Dataset ───────────────────────────────

export const DEMO_SYSTEM_STATUS: SystemStatus = {
  status: 'operational',
  modelVersion: 'FORTEXA-v2.1.4',
  datasetStatus: 'loaded',
  datasetName: 'Synthetic Enterprise Dataset v3',
  lastUpdated: '2024-01-15T09:42:00Z',
  isDemoMode: true,
};

export const DEMO_MODELS: ModelVersion[] = [
  {
    id: 'temporal-encoder',
    name: 'Temporal Encoder',
    purpose: 'Encodes sequential network state windows into temporal latent representations',
    status: 'ready',
    version: '2.1.4',
    latencyMs: 12,
    lastUpdated: '2024-01-10T08:00:00Z',
    architecture: 'Bidirectional LSTM + Attention',
    description: 'Processes time-series of network state vectors to capture evolving behavioral patterns',
  },
  {
    id: 'gnn',
    name: 'Graph Neural Network',
    purpose: 'Models entity relationships and propagates risk across the network topology',
    status: 'ready',
    version: '1.8.2',
    latencyMs: 28,
    lastUpdated: '2024-01-08T14:30:00Z',
    architecture: 'GraphSAGE + Edge Attention',
    description: 'Learns structural patterns from IP-host-domain communication graphs',
  },
  {
    id: 'world-model',
    name: 'World Model / Dynamics Model',
    purpose: 'Simulates future network states given current latent representation',
    status: 'ready',
    version: '1.5.0',
    latencyMs: 45,
    lastUpdated: '2024-01-12T11:00:00Z',
    architecture: 'Recurrent State Space Model (RSSM)',
    description: 'Learned dynamics model that predicts how network state evolves over time',
  },
  {
    id: 'forecast-engine',
    name: 'Forecast Engine',
    purpose: 'Converts simulated future states into attack probability estimates',
    status: 'ready',
    version: '2.0.1',
    latencyMs: 8,
    lastUpdated: '2024-01-14T16:45:00Z',
    architecture: 'Calibrated MLP Classifier',
    description: 'Maps latent world-model states to risk scores with uncertainty quantification',
  },
];

export const DEMO_NETWORK_STATES: NetworkState[] = Array.from({ length: 20 }, (_, i) => {
  const base = i < 14;
  const escalating = i >= 14;
  const risk = base
    ? 0.18 + i * 0.02 + Math.sin(i * 0.8) * 0.05
    : 0.45 + (i - 14) * 0.08;
  return {
    timestamp: new Date(Date.now() - (19 - i) * 5 * 60 * 1000).toISOString(),
    windowId: i + 1,
    activeHosts: 142 + i * 2,
    activeConnections: 3200 + i * 180,
    totalPackets: 450000 + i * 22000,
    totalBytes: 680000000 + i * 35000000,
    uniquePorts: 88 + (escalating ? (i - 13) * 4 : i),
    avgFlowDuration: 2.4 - (escalating ? (i - 13) * 0.1 : 0),
    synRate: escalating ? 1200 + (i - 13) * 400 : 340 + i * 15,
    retransmissionRate: escalating ? 0.08 + (i - 13) * 0.02 : 0.02 + i * 0.001,
    newDestinationPorts: escalating ? 18 + (i - 13) * 5 : 3 + Math.floor(i * 0.5),
    connectionFrequency: escalating ? 4.8 + (i - 13) * 0.6 : 1.2 + i * 0.05,
    trafficVolumeMbps: escalating ? 280 + (i - 13) * 40 : 80 + i * 8,
    riskScore: Math.min(risk, 0.98),
    riskLevel: risk > 0.75 ? 'critical' : risk > 0.6 ? 'high' : risk > 0.4 ? 'medium' : risk > 0.2 ? 'low' : 'safe',
    protocols: { TCP: 68 + i, UDP: 24, ICMP: 4, HTTP: 12, HTTPS: 52 },
    topPorts: [
      { port: 443, count: 1240 + i * 20 },
      { port: 80, count: 820 + i * 10 },
      { port: 22, count: 340 + (escalating ? (i - 13) * 80 : i * 5) },
      { port: 445, count: escalating ? 180 + (i - 13) * 60 : 40 },
      { port: 3389, count: escalating ? 90 + (i - 13) * 30 : 12 },
    ],
    anomalyScore: escalating ? 0.62 + (i - 13) * 0.07 : 0.14 + i * 0.01,
  };
});

export const DEMO_FLOWS: NetworkFlow[] = [
  { id: 'f1', timestamp: '2024-01-15T09:38:00Z', srcIp: '10.0.1.42', dstIp: '192.168.10.5', protocol: 'TCP', srcPort: 54221, dstPort: 445, packets: 842, bytes: 1240000, duration: 4.2, riskScore: 0.82, flags: ['SYN', 'PSH', 'ACK'] },
  { id: 'f2', timestamp: '2024-01-15T09:38:12Z', srcIp: '10.0.1.42', dstIp: '192.168.10.8', protocol: 'TCP', srcPort: 54342, dstPort: 445, packets: 621, bytes: 880000, duration: 3.1, riskScore: 0.79, flags: ['SYN', 'ACK'] },
  { id: 'f3', timestamp: '2024-01-15T09:38:24Z', srcIp: '10.0.1.42', dstIp: '192.168.10.15', protocol: 'TCP', srcPort: 54489, dstPort: 3389, packets: 390, bytes: 520000, duration: 2.8, riskScore: 0.74, flags: ['SYN'] },
  { id: 'f4', timestamp: '2024-01-15T09:37:40Z', srcIp: '172.16.0.22', dstIp: '8.8.8.8', protocol: 'UDP', srcPort: 45122, dstPort: 53, packets: 48, bytes: 12800, duration: 0.4, riskScore: 0.21, flags: [] },
  { id: 'f5', timestamp: '2024-01-15T09:37:55Z', srcIp: '10.0.5.100', dstIp: '10.0.1.42', protocol: 'TCP', srcPort: 48200, dstPort: 22, packets: 1240, bytes: 2100000, duration: 18.4, riskScore: 0.68, flags: ['ACK', 'PSH'] },
  { id: 'f6', timestamp: '2024-01-15T09:36:20Z', srcIp: '10.0.2.18', dstIp: '203.0.113.55', protocol: 'TCP', srcPort: 52001, dstPort: 443, packets: 284, bytes: 428000, duration: 6.2, riskScore: 0.44, flags: ['ACK'] },
  { id: 'f7', timestamp: '2024-01-15T09:39:01Z', srcIp: '10.0.1.42', dstIp: '192.168.10.20', protocol: 'TCP', srcPort: 54601, dstPort: 445, packets: 1102, bytes: 1800000, duration: 5.1, riskScore: 0.88, flags: ['SYN', 'PSH'] },
  { id: 'f8', timestamp: '2024-01-15T09:35:44Z', srcIp: '10.0.3.77', dstIp: '10.0.1.1', protocol: 'ICMP', srcPort: 0, dstPort: 0, packets: 124, bytes: 15500, duration: 1.2, riskScore: 0.18, flags: [] },
];

export const DEMO_GRAPH_NODES: GraphNode[] = [
  { id: 'n1', type: 'host', label: '10.0.1.42', riskScore: 0.88, riskLevel: 'critical', connections: 24, trafficMbps: 148, lastSeen: '2024-01-15T09:42:00Z', properties: { os: 'Windows Server 2019', role: 'Workstation', subnet: '10.0.1.0/24' } },
  { id: 'n2', type: 'server', label: '192.168.10.5 (DC01)', riskScore: 0.72, riskLevel: 'high', connections: 18, trafficMbps: 82, lastSeen: '2024-01-15T09:41:50Z', properties: { role: 'Domain Controller', os: 'Windows Server 2022', services: 'AD, DNS, LDAP' } },
  { id: 'n3', type: 'server', label: '192.168.10.8 (FILE01)', riskScore: 0.65, riskLevel: 'high', connections: 12, trafficMbps: 54, lastSeen: '2024-01-15T09:41:40Z', properties: { role: 'File Server', os: 'Windows Server 2019', services: 'SMB, NFS' } },
  { id: 'n4', type: 'host', label: '10.0.5.100', riskScore: 0.52, riskLevel: 'medium', connections: 8, trafficMbps: 28, lastSeen: '2024-01-15T09:40:00Z', properties: { os: 'Ubuntu 22.04', role: 'Dev Workstation', subnet: '10.0.5.0/24' } },
  { id: 'n5', type: 'ip', label: '203.0.113.55', riskScore: 0.38, riskLevel: 'medium', connections: 4, trafficMbps: 12, lastSeen: '2024-01-15T09:38:00Z', properties: { type: 'External IP', geo: 'DE', asn: 'AS15169' } },
  { id: 'n6', type: 'domain', label: 'update.contoso.local', riskScore: 0.15, riskLevel: 'safe', connections: 42, trafficMbps: 8, lastSeen: '2024-01-15T09:41:00Z', properties: { type: 'Internal Domain', zone: 'contoso.local' } },
  { id: 'n7', type: 'server', label: '192.168.10.15 (RDP-SRV)', riskScore: 0.61, riskLevel: 'high', connections: 6, trafficMbps: 22, lastSeen: '2024-01-15T09:41:30Z', properties: { role: 'Remote Desktop Server', os: 'Windows Server 2016', services: 'RDP' } },
  { id: 'n8', type: 'host', label: '172.16.0.22', riskScore: 0.22, riskLevel: 'low', connections: 3, trafficMbps: 4, lastSeen: '2024-01-15T09:37:40Z', properties: { os: 'macOS 14', role: 'Analyst Workstation', subnet: '172.16.0.0/24' } },
];

export const DEMO_GRAPH_EDGES: GraphEdge[] = [
  { id: 'e1', source: 'n1', target: 'n2', relationship: 'COMMUNICATES_WITH', weight: 0.88, packetCount: 842, byteCount: 1240000, riskScore: 0.84, lastActivity: '2024-01-15T09:42:00Z' },
  { id: 'e2', source: 'n1', target: 'n3', relationship: 'CONNECTS_TO', weight: 0.79, packetCount: 621, byteCount: 880000, riskScore: 0.76, lastActivity: '2024-01-15T09:38:12Z' },
  { id: 'e3', source: 'n1', target: 'n7', relationship: 'CONNECTS_TO', weight: 0.61, packetCount: 390, byteCount: 520000, riskScore: 0.66, lastActivity: '2024-01-15T09:38:24Z' },
  { id: 'e4', source: 'n4', target: 'n1', relationship: 'COMMUNICATES_WITH', weight: 0.52, packetCount: 1240, byteCount: 2100000, riskScore: 0.60, lastActivity: '2024-01-15T09:37:55Z' },
  { id: 'e5', source: 'n2', target: 'n6', relationship: 'QUERIES', weight: 0.18, packetCount: 88, byteCount: 14000, riskScore: 0.10, lastActivity: '2024-01-15T09:41:00Z' },
  { id: 'e6', source: 'n8', target: 'n5', relationship: 'TRANSFERS_TO', weight: 0.38, packetCount: 284, byteCount: 428000, riskScore: 0.40, lastActivity: '2024-01-15T09:36:20Z' },
  { id: 'e7', source: 'n1', target: 'n8', relationship: 'COMMUNICATES_WITH', weight: 0.42, packetCount: 180, byteCount: 240000, riskScore: 0.45, lastActivity: '2024-01-15T09:39:30Z' },
];

export const DEMO_FEATURE_CONTRIBUTIONS: FeatureContribution[] = [
  { feature: 'SYN Rate', contribution: 0.24, direction: 'positive', value: 2840, unit: 'pkts/min', description: 'Elevated SYN rate significantly above baseline — consistent with port scanning or connection flooding' },
  { feature: 'New Destination Ports', contribution: 0.18, direction: 'positive', value: 28, unit: 'new ports', description: 'Unusually high count of newly observed destination ports in this window' },
  { feature: 'Connection Frequency', contribution: 0.15, direction: 'positive', value: 6.4, unit: 'conn/sec', description: 'Per-host connection initiation rate elevated — possible lateral movement probe' },
  { feature: 'Traffic Volume', contribution: 0.09, direction: 'positive', value: 320, unit: 'Mbps', description: 'Traffic volume 4× typical baseline for this time window' },
  { feature: 'Retransmission Rate', contribution: 0.06, direction: 'positive', value: 0.12, unit: 'ratio', description: 'High TCP retransmission ratio suggesting congested or filtered paths' },
  { feature: 'Avg Flow Duration', contribution: 0.04, direction: 'negative', value: 1.8, unit: 'sec', description: 'Shorter average flow duration — suggests rapid sequential probe connections' },
  { feature: 'Unique Source IPs', contribution: 0.03, direction: 'negative', value: 3, unit: 'IPs', description: 'Activity concentrated in very few source IPs — focused internal threat' },
  { feature: 'Protocol Distribution', contribution: 0.02, direction: 'positive', value: '91% TCP', description: 'Anomalous TCP dominance relative to baseline protocol mix' },
];

export const DEMO_FORECAST: Forecast = {
  id: 'f-2024-01-15-001',
  createdAt: '2024-01-15T09:42:00Z',
  horizon: 5,
  currentRisk: 0.72,
  currentRiskLevel: 'high',
  modelVersion: 'FORTEXA-v2.1.4',
  overallConfidence: 0.81,
  states: [
    { windowIndex: 0, timestamp: '2024-01-15T09:42:00Z', predictedRisk: 0.72, confidence: 1.0, riskLevel: 'high', potentialTactic: 'Observed — Active Scanning / Lateral Movement', importantFeatures: DEMO_FEATURE_CONTRIBUTIONS.slice(0, 3), deltaFromCurrent: 0, isObserved: true },
    { windowIndex: 1, timestamp: '2024-01-15T09:47:00Z', predictedRisk: 0.79, confidence: 0.88, riskLevel: 'high', potentialTactic: 'Predicted — Possible Lateral Movement Expansion', importantFeatures: DEMO_FEATURE_CONTRIBUTIONS.slice(0, 3), deltaFromCurrent: +0.07, isObserved: false },
    { windowIndex: 2, timestamp: '2024-01-15T09:52:00Z', predictedRisk: 0.84, confidence: 0.81, riskLevel: 'critical', potentialTactic: 'Predicted — Potential Initial Access / Exploitation', importantFeatures: DEMO_FEATURE_CONTRIBUTIONS.slice(1, 4), deltaFromCurrent: +0.12, isObserved: false },
    { windowIndex: 3, timestamp: '2024-01-15T09:57:00Z', predictedRisk: 0.87, confidence: 0.74, riskLevel: 'critical', potentialTactic: 'Predicted — Possible Persistence Establishment', importantFeatures: DEMO_FEATURE_CONTRIBUTIONS.slice(2, 5), deltaFromCurrent: +0.15, isObserved: false },
    { windowIndex: 4, timestamp: '2024-01-15T10:02:00Z', predictedRisk: 0.91, confidence: 0.66, riskLevel: 'critical', potentialTactic: 'Predicted — Potential C2 Communication', importantFeatures: DEMO_FEATURE_CONTRIBUTIONS.slice(0, 4), deltaFromCurrent: +0.19, isObserved: false },
    { windowIndex: 5, timestamp: '2024-01-15T10:07:00Z', predictedRisk: 0.93, confidence: 0.58, riskLevel: 'critical', potentialTactic: 'Predicted — Model-Estimated Data Staging/Exfiltration Risk', importantFeatures: DEMO_FEATURE_CONTRIBUTIONS, deltaFromCurrent: +0.21, isObserved: false },
  ] as ForecastState[],
  predictedAttackProgression: [
    { id: 'a1', mitreId: 'TA0043', tacticName: 'Reconnaissance', techniqueName: 'Active Scanning (T1595)', probability: 0.91, confidence: 0.95, label: 'observed', timestamp: '2024-01-15T09:28:00Z', evidence: ['Elevated SYN rate to 254 IPs', 'Sequential port probing pattern', 'ICMP sweep activity'], affectedEntities: ['10.0.1.42'], description: 'Host 10.0.1.42 exhibiting active scanning behavior against internal subnet' },
    { id: 'a2', mitreId: 'TA0001', tacticName: 'Initial Access', techniqueName: 'Valid Accounts (T1078)', probability: 0.74, confidence: 0.81, label: 'inferred', timestamp: '2024-01-15T09:35:00Z', evidence: ['Multiple RDP connection attempts to domain controller', 'Credential-based authentication spikes'], affectedEntities: ['10.0.1.42', '192.168.10.5'], description: 'Pattern suggests credential-based access attempts to privileged systems' },
    { id: 'a3', mitreId: 'TA0008', tacticName: 'Lateral Movement', techniqueName: 'SMB/Windows Admin Shares (T1021.002)', probability: 0.68, confidence: 0.74, label: 'inferred', evidence: ['SMB connections to 3 servers in rapid succession', 'High byte transfers on port 445'], affectedEntities: ['10.0.1.42', '192.168.10.5', '192.168.10.8'], description: 'Lateral movement pattern via SMB — multiple server targets in rapid succession' },
    { id: 'a4', mitreId: 'TA0003', tacticName: 'Persistence', techniqueName: 'Create Account (T1136)', probability: 0.52, confidence: 0.66, label: 'forecast', evidence: ['Model-estimated: elevated auth API calls'], affectedEntities: ['192.168.10.5'], description: 'World model forecasts potential persistence mechanism in next 2–3 windows' },
    { id: 'a5', mitreId: 'TA0011', tacticName: 'Command and Control', techniqueName: 'Application Layer Protocol (T1071)', probability: 0.41, confidence: 0.58, label: 'forecast', evidence: ['Model-estimated: unusual outbound HTTPS patterns'], affectedEntities: ['10.0.1.42', '203.0.113.55'], description: 'Forecast indicates possible C2 channel establishment — external IP of interest' },
    { id: 'a6', mitreId: 'TA0010', tacticName: 'Exfiltration', techniqueName: 'Exfiltration Over C2 Channel (T1041)', probability: 0.28, confidence: 0.45, label: 'forecast', evidence: ['Model-estimated: growing outbound byte asymmetry'], affectedEntities: ['10.0.1.42', '203.0.113.55'], description: 'Low-confidence model estimate of potential data exfiltration risk in horizon 4–5' },
  ] as AttackStage[],
};

export const DEMO_ALERTS: Alert[] = [
  {
    id: 'al1', createdAt: '2024-01-15T09:42:00Z', severity: 'critical', riskScore: 0.88, confidence: 0.85,
    forecastHorizon: 5, affectedEntities: ['10.0.1.42', '192.168.10.5', '192.168.10.8'],
    predictedBehavior: 'Predicted lateral movement expansion to additional domain controllers',
    reason: 'SYN rate 8× baseline, SMB connections to 3 servers, RDP probing — world model predicts attack progression within 2 windows',
    label: 'forecast', isAcknowledged: false, isResolved: false, relatedForecastId: 'f-2024-01-15-001',
  },
  {
    id: 'al2', createdAt: '2024-01-15T09:38:00Z', severity: 'high', riskScore: 0.72, confidence: 0.78,
    forecastHorizon: 3, affectedEntities: ['10.0.1.42', '192.168.10.15'],
    predictedBehavior: 'Potential credential-based access to RDP server',
    reason: 'Repeated RDP connection attempts correlate with credential spray pattern in temporal model',
    label: 'inferred', isAcknowledged: true, isResolved: false,
  },
  {
    id: 'al3', createdAt: '2024-01-15T09:20:00Z', severity: 'medium', riskScore: 0.51, confidence: 0.62,
    forecastHorizon: 2, affectedEntities: ['10.0.5.100', '10.0.1.42'],
    predictedBehavior: 'Unusual SSH session from dev workstation to high-risk host',
    reason: 'SSH session duration and byte transfer pattern deviates significantly from baseline',
    label: 'observed', isAcknowledged: true, isResolved: true,
  },
  {
    id: 'al4', createdAt: '2024-01-15T08:55:00Z', severity: 'low', riskScore: 0.31, confidence: 0.54,
    forecastHorizon: 1, affectedEntities: ['172.16.0.22'],
    predictedBehavior: 'Elevated DNS query rate from analyst workstation',
    reason: 'DNS query volume 3× baseline — possibly benign but logged for monitoring',
    label: 'observed', isAcknowledged: true, isResolved: true,
  },
];

export const DEMO_TIMELINE_EVENTS: TimelineEvent[] = [
  { id: 't1', timestamp: '2024-01-15T08:42:00Z', behavior: 'Baseline network activity — normal operational pattern', label: 'observed', confidence: 0.98, evidence: ['Protocol distribution nominal', 'SYN rate within 2σ baseline'], affectedEntities: ['NETWORK'], mitreMapping: undefined },
  { id: 't2', timestamp: '2024-01-15T09:02:00Z', behavior: 'Unusual scanning activity detected from internal host 10.0.1.42', label: 'observed', confidence: 0.94, evidence: ['SYN packets to 254 consecutive IPs in 90 sec', 'Sequential port enumeration pattern'], affectedEntities: ['10.0.1.42'], mitreMapping: { tacticId: 'TA0043', tacticName: 'Reconnaissance', techniqueId: 'T1595', techniqueName: 'Active Scanning' } },
  { id: 't3', timestamp: '2024-01-15T09:18:00Z', behavior: 'Potential reconnaissance activity inferred from flow patterns', label: 'inferred', confidence: 0.82, evidence: ['Service enumeration on common Windows ports', 'SMB, RDP, WinRM probing sequence'], affectedEntities: ['10.0.1.42', '192.168.10.0/24'], mitreMapping: { tacticId: 'TA0043', tacticName: 'Reconnaissance', techniqueId: 'T1046', techniqueName: 'Network Service Discovery' } },
  { id: 't4', timestamp: '2024-01-15T09:32:00Z', behavior: 'Possible credential-based access attempt to domain controller', label: 'inferred', confidence: 0.71, evidence: ['Elevated authentication events on DC01', 'Source IP matches scanning host'], affectedEntities: ['10.0.1.42', '192.168.10.5'], mitreMapping: { tacticId: 'TA0001', tacticName: 'Initial Access', techniqueId: 'T1078', techniqueName: 'Valid Accounts' } },
  { id: 't5', timestamp: '2024-01-15T09:40:00Z', behavior: 'Active SMB lateral movement to multiple servers', label: 'observed', confidence: 0.89, evidence: ['SMB connections to DC01, FILE01, RDP-SRV within 2 min', 'High-volume byte transfers on port 445'], affectedEntities: ['10.0.1.42', '192.168.10.5', '192.168.10.8', '192.168.10.15'], mitreMapping: { tacticId: 'TA0008', tacticName: 'Lateral Movement', techniqueId: 'T1021.002', techniqueName: 'SMB/Windows Admin Shares' } },
  { id: 't6', timestamp: '2024-01-15T09:55:00Z', behavior: 'Possible initial access: persistence mechanism predicted', label: 'forecast', confidence: 0.66, evidence: ['World model estimate based on current trajectory', 'Pattern matches known APT staging behavior'], affectedEntities: ['192.168.10.5'], mitreMapping: { tacticId: 'TA0003', tacticName: 'Persistence', techniqueId: 'T1136', techniqueName: 'Create Account' } },
  { id: 't7', timestamp: '2024-01-15T10:10:00Z', behavior: 'Potential command and control channel: model-estimated behavior', label: 'forecast', confidence: 0.48, evidence: ['Forecast horizon 4 — low-confidence model estimate'], affectedEntities: ['10.0.1.42', '203.0.113.55'], mitreMapping: { tacticId: 'TA0011', tacticName: 'Command and Control', techniqueId: 'T1071', techniqueName: 'Application Layer Protocol' } },
];

export const DEMO_EVALUATION_METRICS: EvaluationMetric[] = [
  { modelName: 'Logistic Regression', precision: null, recall: null, f1: null, falsePositiveRate: null, auroc: null, auprc: null, brierScore: null, earlyWarningLeadTime: null, calibration: null, available: false },
  { modelName: 'Random Forest', precision: null, recall: null, f1: null, falsePositiveRate: null, auroc: null, auprc: null, brierScore: null, earlyWarningLeadTime: null, calibration: null, available: false },
  { modelName: 'XGBoost', precision: null, recall: null, f1: null, falsePositiveRate: null, auroc: null, auprc: null, brierScore: null, earlyWarningLeadTime: null, calibration: null, available: false },
  { modelName: 'FORTEXA', precision: null, recall: null, f1: null, falsePositiveRate: null, auroc: null, auprc: null, brierScore: null, earlyWarningLeadTime: null, calibration: null, available: false },
];

export const DEMO_COPILOT_SUGGESTIONS = [
  'What is the current network risk level?',
  'Why is the risk increasing in recent windows?',
  'What could happen in the next 5 forecast windows?',
  'Which hosts are involved in the anomalous activity?',
  'What evidence supports this forecast?',
  'Summarize the predicted attack progression.',
  'Generate an incident briefing for this alert.',
  'What MITRE ATT&CK techniques are associated with this behavior?',
];

export const getRiskColor = (risk: number): string => {
  if (risk >= 0.8) return '#FF3B30';
  if (risk >= 0.6) return '#F59E0B';
  if (risk >= 0.4) return '#F59E0B';
  if (risk >= 0.2) return '#00A8FF';
  return '#22C55E';
};

export const getRiskLabel = (risk: number): string => {
  if (risk >= 0.8) return 'CRITICAL';
  if (risk >= 0.6) return 'HIGH';
  if (risk >= 0.4) return 'MEDIUM';
  if (risk >= 0.2) return 'LOW';
  return 'SAFE';
};

export const formatBytes = (bytes: number): string => {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
};
