const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'acknowledged' | 'resolved' | 'false_positive' | 'investigating' | 'dismissed';
  user_id?: string;
  data_source_id?: string;
  anomaly_score?: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
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

  return response.json();
}

export const alertsApi = {
  // Get all alerts
  async getAll(options?: { 
    status?: string; 
    severity?: string; 
    limit?: number;
    offset?: number;
  }): Promise<Alert[]> {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.severity) params.append('severity', options.severity);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    
    const query = params.toString();
    return apiRequest<Alert[]>(`/api/alerts${query ? `?${query}` : ''}`);
  },

  // Get alert by ID
  async getById(id: string): Promise<Alert> {
    return apiRequest<Alert>(`/api/alerts/${id}`);
  },

  // Update alert status
  async updateStatus(id: string, status: Alert['status']): Promise<Alert> {
    return apiRequest<Alert>(`/api/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Delete alert
  async delete(id: string): Promise<void> {
    await apiRequest(`/api/alerts/${id}`, {
      method: 'DELETE',
    });
  },
};




