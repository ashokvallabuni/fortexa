import { API_BASE_URL, apiClient } from '@/api/client';

export const ANALYTICS_API_URL = API_BASE_URL || 'not configured';

async function get<T>(path: string): Promise<T> {
  return apiClient.get<T>(path);
}

export interface DatasetSummary {
  dataset_path: string;
  label_column: string;
  feature_count: number;
  file_count: number;
  files: Array<{ name: string; size_bytes: number; columns: number }>;
  source_scope: string;
}

export interface TrafficSummary {
  total_flows: number;
  normal_flows: number;
  malicious_flows: number;
  duplicate_rows: number;
  missing_cells: number;
  source_scope: string;
}

export interface AttackDistribution {
  labels: Array<{ label: string; count: number; is_attack: boolean }>;
  source_scope: string;
}

export interface Timeline {
  points: Array<{ timestamp: string; normal: number; malicious: number; total: number }>;
  source_scope: string;
}

export interface ModelMetrics {
  status: string;
  model?: string;
  training_rows?: number;
  test_rows?: number;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1?: number;
  feature_importance?: Array<{ feature: string; importance: number }>;
}

export const analyticsService = {
  getDatasetSummary: () => get<DatasetSummary>('/api/dataset/summary'),
  getTrafficSummary: () => get<TrafficSummary>('/api/traffic/summary'),
  getAttackDistribution: () => get<AttackDistribution>('/api/attacks/distribution'),
  getTimeline: () => get<Timeline>('/api/traffic/timeline'),
  getFeatures: () => get<{ features: Array<{ feature: string; mean_absolute_value: number; missing_values: number }> }>('/api/features'),
  getModelStatus: () => get<ModelMetrics>('/api/model/status'),
  getModelMetrics: () => get<ModelMetrics>('/api/model/metrics'),
  trainModel: () => apiClient.post<ModelMetrics>('/api/model/train'),
};
