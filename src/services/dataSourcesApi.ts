const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface DataSource {
  id: string;
  name: string;
  type: 'csv' | 'logstash' | 'api' | 'database';
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  health: number;
  records?: number;
  events_per_sec?: number;
  config?: {
    fileName?: string;
    fileSize?: number;
    storagePath?: string;
    storageUrl?: string;
    uploadedAt?: string;
    endpoint?: string;
    apiKey?: string;
    connectionString?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateDataSourceRequest {
  name: string;
  type: 'csv' | 'logstash' | 'api' | 'database';
  config?: Record<string, any>;
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

// Real-time updates subscription
let realTimeSubscription: ((sources: DataSource[]) => void) | null = null;
let realTimeInterval: number | null = null;

export const dataSourcesApi = {
  async getAll(): Promise<DataSource[]> {
    return apiRequest<DataSource[]>('/api/data-sources');
  },

  async getById(id: string): Promise<DataSource> {
    return apiRequest<DataSource>(`/api/data-sources/${id}`);
  },

  async create(data: CreateDataSourceRequest): Promise<DataSource> {
    return apiRequest<DataSource>('/api/data-sources', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, updates: Partial<DataSource>): Promise<DataSource> {
    return apiRequest<DataSource>(`/api/data-sources/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async delete(id: string): Promise<void> {
    await apiRequest<void>(`/api/data-sources/${id}`, {
      method: 'DELETE',
    });
  },

  async connect(id: string, options?: { intervalMs?: number }): Promise<DataSource> {
    return apiRequest<DataSource>(`/api/data-sources/${id}/connect`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  },

  async disconnect(id: string): Promise<DataSource> {
    return apiRequest<DataSource>(`/api/data-sources/${id}/disconnect`, {
      method: 'POST',
    });
  },

  async sync(id: string): Promise<DataSource> {
    return apiRequest<DataSource>(`/api/data-sources/${id}/sync`, {
      method: 'POST',
    });
  },

  async uploadCSV(name: string, file: File): Promise<DataSource> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);

    const response = await fetch(`${API_BASE_URL}/api/data-sources/upload-csv`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `Upload failed: ${response.statusText}`);
    }

    return response.json();
  },

  async reprocessCSV(id: string): Promise<{ fileName: string; fileSize: number; storagePath: string; message: string }> {
    return apiRequest<{ fileName: string; fileSize: number; storagePath: string; message: string }>(
      `/api/data-sources/${id}/reprocess`,
      {
        method: 'POST',
      }
    );
  },

  async downloadCSV(id: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/api/data-sources/${id}/download-csv`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `Download failed: ${response.statusText}`);
    }
    return response.blob();
  },

  async getProcessedRows(id: string, options?: { limit?: number; offset?: number; anomaly_only?: boolean }): Promise<any[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.anomaly_only) params.append('anomaly_only', 'true');
    
    const queryString = params.toString();
    const endpoint = `/api/data-sources/${id}/processed-rows${queryString ? `?${queryString}` : ''}`;
    return apiRequest<any[]>(endpoint);
  },

  startRealTimeUpdates(callback: (sources: DataSource[]) => void): void {
    realTimeSubscription = callback;
    
    // Poll for updates every 5 seconds
    realTimeInterval = window.setInterval(async () => {
      try {
        const sources = await this.getAll();
        if (realTimeSubscription) {
          realTimeSubscription(sources);
        }
      } catch (error) {
        console.error('Error fetching real-time updates:', error);
      }
    }, 5000);
  },

  stopRealTimeUpdates(): void {
    realTimeSubscription = null;
    if (realTimeInterval !== null) {
      clearInterval(realTimeInterval);
      realTimeInterval = null;
    }
  },
};
