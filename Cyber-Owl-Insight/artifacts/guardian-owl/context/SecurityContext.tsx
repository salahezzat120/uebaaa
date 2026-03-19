import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import React, { useCallback, useEffect, useState } from 'react';
import type { SeverityLevel } from '@/constants/colors';

export type Alert = {
  id: string;
  type: string;
  user: string;
  time: string;
  severity: SeverityLevel;
  description: string;
  riskScore: number;
  anomaly: number;
  behavior: number;
  temporal: number;
  historical: number;
  contextual: number;
  status: 'active' | 'investigating' | 'resolved';
  endpoint: string;
  department: string;
};

export type SecuritySettings = {
  anomalyWeight: number;
  behaviorWeight: number;
  temporalWeight: number;
  historicalWeight: number;
  contextualWeight: number;
  autonomousBlock: boolean;
  autonomousPasswordReset: boolean;
  autonomousQuarantine: boolean;
  criticalThreshold: number;
  highThreshold: number;
  mediumThreshold: number;
};

export type ModelPerformance = {
  precision: number;
  recall: number;
  f1: number;
  accuracy: number;
};

const DEFAULT_SETTINGS: SecuritySettings = {
  anomalyWeight: 0.30,
  behaviorWeight: 0.25,
  temporalWeight: 0.20,
  historicalWeight: 0.15,
  contextualWeight: 0.10,
  autonomousBlock: false,
  autonomousPasswordReset: true,
  autonomousQuarantine: false,
  criticalThreshold: 85,
  highThreshold: 65,
  mediumThreshold: 40,
};

const MOCK_ALERTS: Alert[] = [
  {
    id: '1',
    type: 'Data Exfiltration Attempt',
    user: 'j.morrison@acmecorp.com',
    time: '2 min ago',
    severity: 'critical',
    description: 'User attempted to transfer 4.2GB of sensitive data to external storage device outside approved hours.',
    riskScore: 94,
    anomaly: 97,
    behavior: 89,
    temporal: 95,
    historical: 88,
    contextual: 91,
    status: 'active',
    endpoint: 'WKST-JM-2847',
    department: 'Finance',
  },
  {
    id: '2',
    type: 'Privilege Escalation',
    user: 'k.chen@acmecorp.com',
    time: '8 min ago',
    severity: 'critical',
    description: 'Repeated unauthorized attempts to access admin-level permissions and modify system configurations.',
    riskScore: 91,
    anomaly: 88,
    behavior: 93,
    temporal: 78,
    historical: 94,
    contextual: 85,
    status: 'investigating',
    endpoint: 'WKST-KC-1034',
    department: 'IT',
  },
  {
    id: '3',
    type: 'Unusual Access Pattern',
    user: 'r.patel@acmecorp.com',
    time: '23 min ago',
    severity: 'high',
    description: 'Accessing confidential HR records outside normal business hours from an unrecognized IP address.',
    riskScore: 72,
    anomaly: 76,
    behavior: 68,
    temporal: 82,
    historical: 61,
    contextual: 70,
    status: 'active',
    endpoint: 'WKST-RP-0091',
    department: 'HR',
  },
  {
    id: '4',
    type: 'Bulk Email Forward',
    user: 's.nguyen@acmecorp.com',
    time: '41 min ago',
    severity: 'high',
    description: 'Mass forwarding of internal communications to personal email account detected.',
    riskScore: 67,
    anomaly: 71,
    behavior: 65,
    temporal: 58,
    historical: 73,
    contextual: 62,
    status: 'active',
    endpoint: 'WKST-SN-3312',
    department: 'Sales',
  },
  {
    id: '5',
    type: 'Repeated Failed Logins',
    user: 'm.johnson@acmecorp.com',
    time: '1 hr ago',
    severity: 'medium',
    description: 'Multiple failed authentication attempts followed by successful login from different geolocation.',
    riskScore: 51,
    anomaly: 55,
    behavior: 48,
    temporal: 52,
    historical: 44,
    contextual: 58,
    status: 'investigating',
    endpoint: 'WKST-MJ-5521',
    department: 'Engineering',
  },
  {
    id: '6',
    type: 'USB Device Connected',
    user: 't.rodriguez@acmecorp.com',
    time: '2 hr ago',
    severity: 'medium',
    description: 'Unknown USB mass storage device connected to workstation with access to restricted project files.',
    riskScore: 44,
    anomaly: 48,
    behavior: 42,
    temporal: 38,
    historical: 50,
    contextual: 41,
    status: 'resolved',
    endpoint: 'WKST-TR-7734',
    department: 'R&D',
  },
  {
    id: '7',
    type: 'After-Hours Activity',
    user: 'l.kim@acmecorp.com',
    time: '3 hr ago',
    severity: 'low',
    description: 'Login activity detected at 3:47 AM on a Saturday. Accessing project management tools.',
    riskScore: 28,
    anomaly: 31,
    behavior: 25,
    temporal: 35,
    historical: 22,
    contextual: 27,
    status: 'resolved',
    endpoint: 'WKST-LK-4401',
    department: 'Marketing',
  },
];

const MODEL_PERFORMANCE: ModelPerformance = {
  precision: 97.3,
  recall: 94.8,
  f1: 96.0,
  accuracy: 98.2,
};

const [SecurityContextProvider, useSecurityContext] = createContextHook(() => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [settings, setSettings] = useState<SecuritySettings>(DEFAULT_SETTINGS);
  const [threatLevel, setThreatLevel] = useState(78);
  const [modelPerformance] = useState<ModelPerformance>(MODEL_PERFORMANCE);

  useEffect(() => {
    AsyncStorage.getItem('guardian_settings').then((stored) => {
      if (stored) {
        try {
          setSettings(JSON.parse(stored));
        } catch {}
      }
    });
  }, []);

  const authenticate = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const lockApp = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const updateSettings = useCallback(async (newSettings: SecuritySettings) => {
    setSettings(newSettings);
    await AsyncStorage.setItem('guardian_settings', JSON.stringify(newSettings));
  }, []);

  const blockUser = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'resolved' as const } : a))
    );
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  const addNewAlert = useCallback(() => {
    const severities: SeverityLevel[] = ['critical', 'high', 'medium'];
    const types = ['Anomalous Download', 'Policy Violation', 'Credential Stuffing', 'Shadow IT Access'];
    const users = ['a.smith@acmecorp.com', 'b.jones@acmecorp.com', 'c.davis@acmecorp.com'];
    const s = severities[Math.floor(Math.random() * severities.length)];
    const newAlert: Alert = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type: types[Math.floor(Math.random() * types.length)],
      user: users[Math.floor(Math.random() * users.length)],
      time: 'Just now',
      severity: s,
      description: 'Automated threat detection flagged this activity as suspicious.',
      riskScore: Math.floor(Math.random() * 40) + 50,
      anomaly: Math.floor(Math.random() * 40) + 50,
      behavior: Math.floor(Math.random() * 40) + 50,
      temporal: Math.floor(Math.random() * 40) + 50,
      historical: Math.floor(Math.random() * 40) + 50,
      contextual: Math.floor(Math.random() * 40) + 50,
      status: 'active',
      endpoint: 'WKST-NEW-' + Math.floor(Math.random() * 9999),
      department: 'Unknown',
    };
    setAlerts((prev) => [newAlert, ...prev]);
    setThreatLevel((prev) => Math.min(99, prev + Math.floor(Math.random() * 8) + 2));
  }, []);

  const criticalCount = alerts.filter((a) => a.severity === 'critical' && a.status === 'active').length;
  const activeCount = alerts.filter((a) => a.status === 'active').length;

  return {
    isAuthenticated,
    alerts,
    settings,
    threatLevel,
    modelPerformance,
    criticalCount,
    activeCount,
    authenticate,
    lockApp,
    updateSettings,
    blockUser,
    dismissAlert,
    addNewAlert,
  };
});

export { SecurityContextProvider, useSecurityContext };
