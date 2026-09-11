import { mockFetch } from './api';
import { DEMO_FEATURE_CONTRIBUTIONS, DEMO_FORECAST } from '@/data/mockData';
import type { FeatureContribution } from '@/types';

export const explainabilityService = {
  async getFeatureContributions(forecastId?: string): Promise<FeatureContribution[]> {
    const result = await mockFetch(DEMO_FEATURE_CONTRIBUTIONS, 250);
    return result.data;
  },

  async getHistoricalContributions(windowCount = 5): Promise<Array<{ windowId: number; contributions: FeatureContribution[] }>> {
    const windows = Array.from({ length: windowCount }, (_, i) => ({
      windowId: 16 + i,
      contributions: DEMO_FEATURE_CONTRIBUTIONS.map(f => ({
        ...f,
        contribution: f.contribution * (0.6 + i * 0.1 + Math.random() * 0.1),
      })),
    }));
    const result = await mockFetch(windows, 300);
    return result.data;
  },
};
