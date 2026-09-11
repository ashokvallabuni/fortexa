import { mockFetch } from './api';
import type { CopilotMessage } from '@/types';
import { DEMO_FORECAST, DEMO_FEATURE_CONTRIBUTIONS, DEMO_NETWORK_STATES } from '@/data/mockData';

const CANNED_RESPONSES: Record<string, Omit<CopilotMessage, 'id' | 'timestamp' | 'role'>> = {
  default: {
    content: `Based on the current network state analysis:\n\n**Observed:** The network is exhibiting elevated SYN rates (8× baseline) from host 10.0.1.42, with active SMB connections to 3 internal servers.\n\n**Inferred:** Behavioral patterns are consistent with active lateral movement tactics. Confidence: 74%.\n\n**Forecast:** The world model predicts continued risk escalation over the next 2–3 windows (5–15 minutes). Risk score is projected to reach 0.87–0.91 with confidence 0.58–0.74.\n\n**Recommendation:** Isolate host 10.0.1.42 and audit authentication events on DC01 (192.168.10.5). Review SMB access logs on FILE01.`,
    label: 'recommendation',
    sources: ['Network State Window 20', 'Forecast Engine v2.0.1', 'World Model v1.5.0'],
  },
  risk: {
    content: `**Current Risk Assessment** (FORTEXA Model Estimate)\n\nCurrent risk score: **0.72 (HIGH)**\nAnomaly score: **0.84**\nForecast confidence: **81%**\n\nThe risk level has escalated from LOW (0.18) to HIGH (0.72) over the last 6 windows (30 minutes). The primary drivers are:\n1. SYN rate increase (+0.24 model contribution)\n2. New destination port discovery (+0.18)\n3. Connection frequency elevation (+0.15)\n\nThis is a **model estimate** based on learned network dynamics, not a confirmed attack.`,
    label: 'forecast',
    sources: ['Forecast Engine', 'Temporal Encoder', 'Explainability Module'],
  },
  progression: {
    content: `**Predicted Attack Progression** (Model Estimate — 5-Window Horizon)\n\n**Window 1 (T+5 min):** Predicted risk 0.79 — Possible lateral movement expansion\n**Window 2 (T+10 min):** Predicted risk 0.84 — Potential initial access to additional hosts\n**Window 3 (T+15 min):** Predicted risk 0.87 — Possible persistence establishment\n**Window 4 (T+20 min):** Predicted risk 0.91 — Potential C2 communication setup\n**Window 5 (T+25 min):** Predicted risk 0.93 — Model-estimated data staging risk\n\n⚠️ These are probabilistic forecasts from the world model. Confidence decreases from 88% → 58% across the horizon. Do not treat these as confirmed events.`,
    label: 'forecast',
    sources: ['World Model v1.5.0', 'Forecast Engine v2.0.1'],
  },
};

export const copilotService = {
  async sendMessage(userMessage: string, history: CopilotMessage[]): Promise<CopilotMessage> {
    const lower = userMessage.toLowerCase();
    let response = CANNED_RESPONSES.default;

    if (lower.includes('risk') || lower.includes('current')) {
      response = CANNED_RESPONSES.risk;
    } else if (lower.includes('progression') || lower.includes('happen') || lower.includes('next')) {
      response = CANNED_RESPONSES.progression;
    }

    await new Promise(r => setTimeout(r, 900 + Math.random() * 600));

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      timestamp: new Date().toISOString(),
      ...response,
    };
  },
};
