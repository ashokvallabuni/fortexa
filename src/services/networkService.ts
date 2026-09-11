import { apiGet, getActiveDatasetId } from './api';
import type { NetworkState, NetworkFlow } from '@/types';

export const networkService = {
  async getNetworkStates(limit = 20): Promise<NetworkState[]> {
    return apiGet<NetworkState[]>('/api/network/states', { limit, datasetId: getActiveDatasetId() });
  },

  async getCurrentState(): Promise<NetworkState | undefined> {
    const states = await apiGet<NetworkState[]>('/api/network/states', { limit: 1, datasetId: getActiveDatasetId() });
    return states[states.length - 1];
  },

  async getFlows(page = 0, pageSize = 20): Promise<{ flows: NetworkFlow[]; total: number }> {
    return apiGet<{ flows: NetworkFlow[]; total: number }>('/api/network/flows', {
      page,
      pageSize,
      datasetId: getActiveDatasetId(),
    });
  },
};
