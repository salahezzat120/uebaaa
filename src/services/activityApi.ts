const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface ActivityLog {
  id: string;
  action: string;
  actor: string;
  target?: string;
  type: 'auth' | 'config' | 'alert' | 'model' | 'data';
  status: 'success' | 'warning' | 'error';
  details?: string;
  metadata?: Record<string, any>;
  created_at: string;
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

export const activityApi = {
  // Get all activity logs
  async getAll(options?: {
    type?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ActivityLog[]> {
    const params = new URLSearchParams();
    if (options?.type && options.type !== 'all') params.append('type', options.type);
    if (options?.status && options.status !== 'all') params.append('status', options.status);
    if (options?.search) params.append('search', options.search);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    
    const query = params.toString();
    return apiRequest<ActivityLog[]>(`/api/activity${query ? `?${query}` : ''}`);
  },
};



