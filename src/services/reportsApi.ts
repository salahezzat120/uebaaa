const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Report {
  id: string;
  name: string;
  description?: string;
  type: 'executive' | 'technical' | 'compliance';
  frequency: 'daily' | 'weekly' | 'monthly' | 'on-demand';
  template_id?: string;
  status: 'ready' | 'generating' | 'scheduled' | 'failed';
  last_generated_at?: string;
  next_scheduled_at?: string;
  file_path?: string;
  file_size?: number;
  metadata?: Record<string, any>;
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

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const reportsApi = {
  async getAll(filters?: { type?: string; status?: string; frequency?: string }): Promise<Report[]> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.frequency) params.append('frequency', filters.frequency);

    const query = params.toString();
    return apiRequest<Report[]>(`/api/reports${query ? `?${query}` : ''}`);
  },

  async getById(id: string): Promise<Report> {
    return apiRequest<Report>(`/api/reports/${id}`);
  },

  async create(report: Omit<Report, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<Report> {
    return apiRequest<Report>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  },

  async update(id: string, updates: Partial<Report>): Promise<Report> {
    return apiRequest<Report>(`/api/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async delete(id: string): Promise<void> {
    await apiRequest<void>(`/api/reports/${id}`, {
      method: 'DELETE',
    });
  },

  async generate(
    id: string,
    timePeriod?: 'today' | 'week' | 'month' | 'year' | 'custom',
    customStart?: string,
    customEnd?: string
  ): Promise<{ message: string; generation_id?: string; time_period?: string }> {
    const body: any = {};
    if (timePeriod) {
      body.timePeriod = timePeriod;
    }
    if (customStart) {
      body.customStart = customStart;
    }
    if (customEnd) {
      body.customEnd = customEnd;
    }
    return apiRequest<{ message: string; generation_id?: string; time_period?: string }>(
      `/api/reports/${id}/generate`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
  },

  async download(id: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/api/reports/${id}/download`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `Download failed: ${response.statusText}`);
    }
    return response.blob();
  },

  async schedule(id: string, next_scheduled_at: string): Promise<Report> {
    return apiRequest<Report>(`/api/reports/${id}/schedule`, {
      method: 'POST',
      body: JSON.stringify({ next_scheduled_at }),
    });
  },
};

