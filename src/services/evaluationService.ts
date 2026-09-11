import { mockFetch } from './api';
import { DEMO_EVALUATION_METRICS } from '@/data/mockData';
import type { EvaluationMetric } from '@/types';

export const evaluationService = {
  async getMetrics(): Promise<EvaluationMetric[]> {
    const result = await mockFetch(DEMO_EVALUATION_METRICS, 200);
    return result.data;
  },
};
