import { mockFetch } from './api';
import { DEMO_FORECAST, DEMO_FEATURE_CONTRIBUTIONS, DEMO_ALERTS } from '@/data/mockData';

export interface ReportPayload {
  id: string;
  generatedAt: string;
  forecast: typeof DEMO_FORECAST;
  features: typeof DEMO_FEATURE_CONTRIBUTIONS;
  alerts: typeof DEMO_ALERTS;
}

export const reportService = {
  async generateReport(): Promise<ReportPayload> {
    const result = await mockFetch({
      id: `RPT-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      forecast: DEMO_FORECAST,
      features: DEMO_FEATURE_CONTRIBUTIONS,
      alerts: DEMO_ALERTS,
    }, 1000);
    return result.data;
  },
};
