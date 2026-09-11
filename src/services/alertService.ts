import { apiGet, getActiveDatasetId } from './api';
import type { Alert } from '@/types';

export const alertService = {
  async getAlerts(limit = 50): Promise<Alert[]> {
    return apiGet<Alert[]>('/api/alerts', { limit, datasetId: getActiveDatasetId() });
  },
};
