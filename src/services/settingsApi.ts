const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface RiskWeights {
  anomaly: number;
  behavior: number;
  temporal: number;
  historical: number;
  contextual: number;
}

export interface RiskThresholds {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface RiskFusion {
  method: string;
  smoothing_factor: number;
}

export interface SystemSettings {
  risk_weights: RiskWeights;
  risk_thresholds: RiskThresholds;
  risk_fusion: RiskFusion;
}

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `API request failed: ${response.statusText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const fetchSettings = async (): Promise<SystemSettings> => {
  return apiRequest<SystemSettings>('/api/settings');
};

export const updateSetting = async (key: string, value: any): Promise<void> => {
  await apiRequest(`/api/settings/${key}`, {
    method: 'PATCH',
    body: JSON.stringify({ value }),
  });
};
