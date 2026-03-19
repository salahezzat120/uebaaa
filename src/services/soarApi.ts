const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface SOARPlaybook {
  id: string;
  name: string;
  description?: string;
  action_type: 'block_user' | 'force_password_reset' | 'trigger_mfa' | 'revoke_tokens' | 'quarantine_endpoint' | 'update_alert_status' | 'send_notification';
  conditions: {
    severity?: string[];
    alert_types?: string[];
    auto_execute?: boolean;
    min_risk_score?: number | null;
  };
  action_config: Record<string, any>;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SOARExecution {
  id: string;
  playbook_id: string;
  alert_id: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  result: Record<string, any>;
  triggered_by: 'automatic' | 'manual';
  triggered_by_user?: string;
  created_at: string;
  completed_at?: string;
  error_message?: string;
  soar_playbooks?: { name: string; action_type: string };
  alerts?: { title: string; severity: string; status: string };
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

export const soarApi = {
  // Get all playbooks
  async getPlaybooks(): Promise<SOARPlaybook[]> {
    return apiRequest<SOARPlaybook[]>('/api/soar/playbooks');
  },

  // Get single playbook
  async getPlaybook(id: string): Promise<SOARPlaybook> {
    return apiRequest<SOARPlaybook>(`/api/soar/playbooks/${id}`);
  },

  // Create playbook
  async createPlaybook(data: Partial<SOARPlaybook>): Promise<SOARPlaybook> {
    return apiRequest<SOARPlaybook>('/api/soar/playbooks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update playbook
  async updatePlaybook(id: string, data: Partial<SOARPlaybook>): Promise<SOARPlaybook> {
    return apiRequest<SOARPlaybook>(`/api/soar/playbooks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Delete playbook
  async deletePlaybook(id: string): Promise<void> {
    await apiRequest(`/api/soar/playbooks/${id}`, {
      method: 'DELETE',
    });
  },

  // Execute playbook on alerts
  async executePlaybook(playbookId: string, alertIds: string[], triggeredByUser?: string): Promise<{
    playbook_id: string;
    total: number;
    results: Array<{
      executionId?: string;
      playbook: string;
      alertId: string;
      success: boolean;
      message: string;
      details?: Record<string, any>;
    }>;
  }> {
    return apiRequest(`/api/soar/playbooks/${playbookId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ alert_ids: alertIds, triggered_by_user: triggeredByUser }),
    });
  },

  // Get execution history
  async getExecutions(filters?: {
    playbook_id?: string;
    alert_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<SOARExecution[]> {
    const params = new URLSearchParams();
    if (filters?.playbook_id) params.append('playbook_id', filters.playbook_id);
    if (filters?.alert_id) params.append('alert_id', filters.alert_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    
    const query = params.toString();
    return apiRequest<SOARExecution[]>(`/api/soar/executions${query ? `?${query}` : ''}`);
  },
};



