const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface DashboardStats {
  // Basic stats
  totalUsers: number;
  activeAlerts: number;
  threatsBlocked: number;
  totalDataSources: number;
  totalModels: number;
  
  // Changes
  userChange: number;
  alertChange: number;
  threatChange: number;
  
  // Risk metrics
  systemRiskScore: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  riskPercentages: {
    low: number;
    medium: number;
    high: number;
  };
  
  // Trends
  riskTrend24h: Array<{ time: string; risk: number; alerts: number }>;
  riskTrend7d: Array<{ time: string; risk: number; alerts: number }>;
  riskTrend30d: Array<{ time: string; risk: number; alerts: number }>;
  
  // Recent data
  recentAlerts: Array<{
    id: string;
    type: string;
    severity: string;
    message: string;
    user?: string;
    entity?: string;
    timestamp: string;
  }>;
  topRiskyUsers: Array<{
    id: string;
    email: string;
    name: string;
    riskScore: number;
    change: number;
    department: string;
    lastActivity: string;
  }>;
  threatDistribution: Array<{
    name: string;
    count: number;
    severity: string;
    percentage: number;
  }>;
  
  timestamp: string;
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

export const dashboardApi = {
  async getDashboardStats(): Promise<DashboardStats> {
    return apiRequest<DashboardStats>('/api/dashboard/stats');
  },
};



