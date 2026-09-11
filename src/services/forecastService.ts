import { mockFetch } from './api';
import { DEMO_FORECAST, DEMO_FEATURE_CONTRIBUTIONS } from '@/data/mockData';
import type { Forecast, FeatureContribution } from '@/types';

export const forecastService = {
  async runForecast(horizon: number = 5): Promise<Forecast> {
    const result = await mockFetch({ ...DEMO_FORECAST, horizon }, 800);
    return result.data;
  },

  async getLatestForecast(): Promise<Forecast> {
    const result = await mockFetch(DEMO_FORECAST, 300);
    return result.data;
  },

  async getFeatureContributions(forecastId: string): Promise<FeatureContribution[]> {
    const result = await mockFetch(DEMO_FEATURE_CONTRIBUTIONS, 200);
    return result.data;
  },
};
