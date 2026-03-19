const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface User {
  id: string;
  email: string;
  username?: string;
  risk_score: number;
  status: 'active' | 'suspended' | 'inactive';
  metadata?: {
    name?: string;
    department?: string;
    role?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
  // Stats fields (when includeStats=true)
  alert_count?: number;
  last_alert_time?: string;
  risk_factors?: string[];
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

export const usersApi = {
  async getAll(includeStats: boolean = false): Promise<User[]> {
    const params = new URLSearchParams();
    if (includeStats) {
      params.append('includeStats', 'true');
    }
    const query = params.toString();
    return apiRequest<User[]>(`/api/users${query ? `?${query}` : ''}`);
  },

  async getById(id: string): Promise<User> {
    return apiRequest<User>(`/api/users/${id}`);
  },

  async suspendUser(id: string): Promise<User> {
    return apiRequest<User>(`/api/users/${id}/suspend`, {
      method: 'PATCH',
    });
  },

  async forcePasswordReset(id: string): Promise<User> {
    return apiRequest<User>(`/api/users/${id}/force-password-reset`, {
      method: 'PATCH',
    });
  },

  async triggerMFA(id: string): Promise<User> {
    return apiRequest<User>(`/api/users/${id}/trigger-mfa`, {
      method: 'PATCH',
    });
  },

  async revokeTokens(id: string): Promise<User> {
    return apiRequest<User>(`/api/users/${id}/revoke-tokens`, {
      method: 'PATCH',
    });
  },
};



