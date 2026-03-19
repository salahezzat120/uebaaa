import { supabaseAdmin } from '../config/supabase.js';
import fs from 'fs/promises';
import path from 'path';

const REPORTS_DIR = path.join(process.cwd(), 'reports');

// Ensure reports directory exists
async function ensureReportsDir() {
  try {
    await fs.mkdir(REPORTS_DIR, { recursive: true });
  } catch (error) {
    console.error('[Report Generator] Error creating reports directory:', error);
  }
}

// Generate report data based on template
async function generateReportData(report, timePeriod = null, customStart = null, customEnd = null) {
  const templateId = report.template_id || report.name.toLowerCase().replace(/\s+/g, '_');
  const now = new Date();
  
  // Determine period dates
  let periodDates;
  if (timePeriod) {
    periodDates = getTimePeriodDates(timePeriod, now, customStart, customEnd);
  } else {
    periodDates = {
      start: getPeriodStart(report.frequency, now),
      end: now.toISOString(),
    };
  }

  const reportData = {
    report_id: report.id,
    report_name: report.name,
    generated_at: now.toISOString(),
    time_period: timePeriod || report.frequency,
    period: periodDates,
  };

  try {
    switch (templateId) {
      case 'executive_security_summary':
        reportData.data = await generateExecutiveSummary(periodDates);
        break;
      case 'threat_intelligence_report':
      case 'threat_analysis':
        reportData.data = await generateThreatAnalysis(periodDates);
        break;
      case 'user_risk_assessment':
      case 'user_behavior':
        reportData.data = await generateUserRiskAssessment(periodDates);
        break;
      case 'compliance_audit_trail':
      case 'security_posture':
        reportData.data = await generateComplianceAudit(periodDates);
        break;
      case 'model_performance_analysis':
        reportData.data = await generateModelPerformance(periodDates);
        break;
      case 'incident_response_summary':
        reportData.data = await generateIncidentResponse(periodDates);
        break;
      case 'top_users':
      case 'top_risky_users':
        reportData.data = await generateTopUsersReport(periodDates);
        break;
      case 'risk_analytics':
      case 'risk_metrics':
        reportData.data = await generateRiskAnalyticsReport(periodDates);
        break;
      case 'security_metrics':
        reportData.data = await generateSecurityMetricsReport(periodDates);
        break;
      default:
        reportData.data = await generateGenericReport(periodDates);
    }
  } catch (error) {
    console.error(`[Report Generator] Error generating report data for ${templateId}:`, error);
    throw error;
  }

  return reportData;
}

// Get period start based on frequency
function getPeriodStart(frequency, endDate) {
  const end = new Date(endDate);
  switch (frequency) {
    case 'daily':
      end.setHours(0, 0, 0, 0);
      return end.toISOString();
    case 'weekly':
      const dayOfWeek = end.getDay();
      end.setDate(end.getDate() - dayOfWeek);
      end.setHours(0, 0, 0, 0);
      return end.toISOString();
    case 'monthly':
      end.setDate(1);
      end.setHours(0, 0, 0, 0);
      return end.toISOString();
    default:
      // on-demand: last 30 days
      end.setDate(end.getDate() - 30);
      return end.toISOString();
  }
}

// Get time period dates based on period type
function getTimePeriodDates(period, endDate = new Date(), customStart = null, customEnd = null) {
  if (period === 'custom' && customStart && customEnd) {
    return {
      start: new Date(customStart).toISOString(),
      end: new Date(customEnd).toISOString(),
    };
  }

  const end = new Date(endDate);
  const start = new Date(end);
  
  switch(period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(end.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start.setDate(end.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
    case 'year':
      start.setFullYear(end.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      // Default to last 30 days if period not recognized
      start.setDate(end.getDate() - 30);
      start.setHours(0, 0, 0, 0);
  }
  
  return { 
    start: start.toISOString(), 
    end: end.toISOString() 
  };
}

// Get risk level classification
function getRiskLevel(score) {
  const numScore = parseFloat(score) || 0;
  if (numScore >= 80) return 'critical';
  if (numScore >= 60) return 'high';
  if (numScore >= 40) return 'medium';
  return 'low';
}

// Generate Executive Security Summary
async function generateExecutiveSummary(periodDates = null) {
  let usersQuery = supabaseAdmin.from('users').select('id, risk_score, status, updated_at');
  let alertsQuery = supabaseAdmin.from('alerts').select('id, severity, status, created_at');
  
  if (periodDates) {
    alertsQuery = alertsQuery.gte('created_at', periodDates.start).lte('created_at', periodDates.end);
    usersQuery = usersQuery.gte('updated_at', periodDates.start).lte('updated_at', periodDates.end);
  }

  const [usersResult, alertsResult, modelsResult] = await Promise.all([
    usersQuery,
    alertsQuery,
    supabaseAdmin.from('ai_models').select('id, enabled, accuracy'),
  ]);

  const users = usersResult.data || [];
  const alerts = alertsResult.data || [];
  const models = modelsResult.data || [];

  const avgRiskScore = users.length > 0
    ? users.reduce((sum, u) => sum + (parseFloat(u.risk_score) || 0), 0) / users.length
    : 0;

  const highRiskUsers = users.filter(u => (parseFloat(u.risk_score) || 0) >= 80).length;
  const activeAlerts = alerts.filter(a => ['open', 'acknowledged', 'investigating'].includes(a.status)).length;
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved').length;

  return {
    summary: {
      total_users: users.length,
      high_risk_users: highRiskUsers,
      average_risk_score: Math.round(avgRiskScore * 100) / 100,
      active_alerts: activeAlerts,
      resolved_alerts: resolvedAlerts,
      active_models: models.filter(m => m.enabled).length,
    },
    top_threats: await getTopThreats(alerts),
    risk_distribution: getRiskDistribution(users),
  };
}

// Generate Threat Intelligence Report
async function generateThreatAnalysis(periodDates = null) {
  let query = supabaseAdmin
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (periodDates) {
    query = query.gte('created_at', periodDates.start).lte('created_at', periodDates.end);
  }

  const { data: alerts } = await query;

  const threatBreakdown = {};
  (alerts || []).forEach(alert => {
    const type = getAlertType(alert);
    if (!threatBreakdown[type]) {
      threatBreakdown[type] = { count: 0, severity_breakdown: {} };
    }
    threatBreakdown[type].count++;
    const severity = alert.severity || 'medium';
    threatBreakdown[type].severity_breakdown[severity] = 
      (threatBreakdown[type].severity_breakdown[severity] || 0) + 1;
  });

  return {
    total_alerts: alerts?.length || 0,
    threat_breakdown: threatBreakdown,
    recent_alerts: (alerts || []).slice(0, 20).map(a => ({
      id: a.id,
      title: a.title,
      severity: a.severity,
      created_at: a.created_at,
      user: a.metadata?.user_email,
    })),
  };
}

// Generate User Risk Assessment
async function generateUserRiskAssessment(periodDates = null) {
  let query = supabaseAdmin
    .from('users')
    .select('id, email, username, risk_score, status, metadata, updated_at')
    .order('risk_score', { ascending: false });

  if (periodDates) {
    query = query.gte('updated_at', periodDates.start).lte('updated_at', periodDates.end);
  }

  const { data: users } = await query;

  const topRiskyUsers = (users || [])
    .map(u => ({
      email: u.email,
      username: u.username,
      risk_score: parseFloat(u.risk_score) || 0,
      risk_level: getRiskLevel(u.risk_score),
      status: u.status,
      department: u.metadata?.department || 'Unknown',
      last_activity: u.updated_at,
    }))
    .slice(0, 20);

  return {
    total_users: users?.length || 0,
    risk_distribution: getRiskDistribution(users || []),
    top_risky_users: topRiskyUsers,
    risk_trends: await getRiskTrends(periodDates),
  };
}

// Generate Compliance Audit Trail
async function generateComplianceAudit(periodDates = null) {
  let query = supabaseAdmin
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5000);

  if (periodDates) {
    query = query.gte('created_at', periodDates.start).lte('created_at', periodDates.end);
  }

  const { data: activityLogs } = await query;

  const activityByType = {};
  (activityLogs || []).forEach(log => {
    const type = log.type || 'other';
    if (!activityByType[type]) {
      activityByType[type] = [];
    }
    activityByType[type].push({
      action: log.action,
      actor: log.actor,
      target: log.target,
      timestamp: log.created_at,
    });
  });

  return {
    total_activities: activityLogs?.length || 0,
    activity_by_type: activityByType,
    recent_activities: (activityLogs || []).slice(0, 100),
  };
}

// Generate Model Performance Analysis
async function generateModelPerformance(periodDates = null) {
  // Model performance doesn't need time filtering for model list, but predictions could be filtered
  const { data: models } = await supabaseAdmin
    .from('ai_models')
    .select('*')
    .order('created_at', { ascending: false });

  const modelStats = (models || []).map(m => ({
    name: m.name,
    type: m.type,
    enabled: m.enabled,
    accuracy: m.accuracy,
    precision: m.precision,
    recall: m.recall,
    f1_score: m.f1_score,
    predictions: m.predictions || 0,
    last_trained: m.last_trained,
  }));

  return {
    total_models: models?.length || 0,
    active_models: models?.filter(m => m.enabled).length || 0,
    model_statistics: modelStats,
    average_accuracy: models?.length > 0
      ? models.reduce((sum, m) => sum + (parseFloat(m.accuracy) || 0), 0) / models.length
      : 0,
  };
}

// Generate Incident Response Summary
async function generateIncidentResponse(periodDates = null) {
  let alertsQuery = supabaseAdmin.from('alerts').select('*').order('created_at', { ascending: false }).limit(1000);
  let executionsQuery = supabaseAdmin.from('soar_executions').select('*').order('created_at', { ascending: false }).limit(1000);

  if (periodDates) {
    alertsQuery = alertsQuery.gte('created_at', periodDates.start).lte('created_at', periodDates.end);
    executionsQuery = executionsQuery.gte('created_at', periodDates.start).lte('created_at', periodDates.end);
  }

  const [alertsResult, executionsResult] = await Promise.all([
    alertsQuery,
    executionsQuery,
  ]);

  const alerts = alertsResult.data || [];
  const executions = executionsResult.data || [];

  return {
    total_alerts: alerts.length,
    resolved_alerts: alerts.filter(a => a.status === 'resolved').length,
    soar_executions: executions.length,
    successful_executions: executions.filter(e => e.status === 'completed').length,
    recent_incidents: alerts.slice(0, 20),
    soar_activity: executions.slice(0, 20),
  };
}

// Generate Top Users Report
async function generateTopUsersReport(periodDates = null, limit = 50) {
  let query = supabaseAdmin
    .from('users')
    .select(`
      id,
      email,
      username,
      risk_score,
      status,
      metadata,
      updated_at
    `)
    .order('risk_score', { ascending: false })
    .limit(limit);

  if (periodDates) {
    query = query.gte('updated_at', periodDates.start).lte('updated_at', periodDates.end);
  }

  const { data: users } = await query;

  // Get alert counts for each user
  const usersWithAlerts = await Promise.all(
    (users || []).map(async (user) => {
      let alertQuery = supabaseAdmin
        .from('alerts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (periodDates) {
        alertQuery = alertQuery.gte('created_at', periodDates.start).lte('created_at', periodDates.end);
      }

      const { count: alertCount } = await alertQuery;

      return {
        id: user.id,
        email: user.email,
        username: user.username || user.email.split('@')[0],
        name: user.metadata?.name || user.username || user.email.split('@')[0],
        risk_score: parseFloat(user.risk_score) || 0,
        risk_level: getRiskLevel(user.risk_score),
        status: user.status,
        department: user.metadata?.department || 'Unknown',
        role: user.metadata?.role || 'User',
        alert_count: alertCount || 0,
        last_activity: user.updated_at,
      };
    })
  );

  // Sort by risk score again (after getting alert counts)
  usersWithAlerts.sort((a, b) => b.risk_score - a.risk_score);

  return {
    period: periodDates || { start: null, end: null },
    total_users: usersWithAlerts.length,
    top_risky_users: usersWithAlerts,
    risk_distribution: getRiskDistribution(users || []),
    summary: {
      highest_risk_score: usersWithAlerts.length > 0 ? usersWithAlerts[0].risk_score : 0,
      average_risk_score: usersWithAlerts.length > 0
        ? usersWithAlerts.reduce((sum, u) => sum + u.risk_score, 0) / usersWithAlerts.length
        : 0,
      critical_users: usersWithAlerts.filter(u => u.risk_score >= 80).length,
      high_risk_users: usersWithAlerts.filter(u => u.risk_score >= 60 && u.risk_score < 80).length,
    },
  };
}

// Generate Risk Analytics Report
async function generateRiskAnalyticsReport(periodDates = null) {
  let query = supabaseAdmin
    .from('users')
    .select('id, risk_score, updated_at, metadata')
    .order('risk_score', { ascending: false });

  if (periodDates) {
    query = query.gte('updated_at', periodDates.start).lte('updated_at', periodDates.end);
  }

  const { data: users } = await query;

  const riskScores = (users || []).map(u => parseFloat(u.risk_score) || 0).filter(score => score >= 0);

  // Calculate statistics
  const sortedScores = [...riskScores].sort((a, b) => a - b);
  const avg = riskScores.length > 0
    ? riskScores.reduce((sum, s) => sum + s, 0) / riskScores.length
    : 0;
  const min = sortedScores.length > 0 ? sortedScores[0] : 0;
  const max = sortedScores.length > 0 ? sortedScores[sortedScores.length - 1] : 0;
  const median = sortedScores.length > 0
    ? sortedScores.length % 2 === 0
      ? (sortedScores[Math.floor(sortedScores.length / 2) - 1] + sortedScores[Math.floor(sortedScores.length / 2)]) / 2
      : sortedScores[Math.floor(sortedScores.length / 2)]
    : 0;
  
  // Standard deviation
  const variance = riskScores.length > 0
    ? riskScores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / riskScores.length
    : 0;
  const stdDev = Math.sqrt(variance);

  // Risk distribution
  const distribution = getRiskDistribution(users || []);

  // Risk score histogram (10 buckets: 0-10, 10-20, ..., 90-100)
  const histogram = Array.from({ length: 10 }, (_, i) => {
    const bucketMin = i * 10;
    const bucketMax = (i + 1) * 10;
    const count = riskScores.filter(s => s >= bucketMin && s < bucketMax).length;
    return {
      range: `${bucketMin}-${bucketMax}`,
      count,
      percentage: riskScores.length > 0 ? Math.round((count / riskScores.length) * 100 * 100) / 100 : 0,
    };
  });

  // Risk trends
  const trends = await getRiskTrends(periodDates);

  return {
    period: periodDates || { start: null, end: null },
    statistics: {
      total_users: riskScores.length,
      average: Math.round(avg * 100) / 100,
      median: Math.round(median * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      standard_deviation: Math.round(stdDev * 100) / 100,
    },
    distribution,
    histogram,
    trends,
    risk_levels: {
      low: {
        count: distribution.low,
        percentage: distribution.percentages.low,
        range: '0-39',
      },
      medium: {
        count: distribution.medium,
        percentage: distribution.percentages.medium,
        range: '40-59',
      },
      high: {
        count: distribution.high,
        percentage: distribution.percentages.high,
        range: '60-79',
      },
      critical: {
        count: distribution.critical,
        percentage: distribution.percentages.critical,
        range: '80-100',
      },
    },
  };
}

// Generate Security Metrics Report (comprehensive)
async function generateSecurityMetricsReport(periodDates = null) {
  let usersQuery = supabaseAdmin.from('users').select('id, risk_score, status, updated_at');
  let alertsQuery = supabaseAdmin.from('alerts').select('id, severity, status, created_at');
  let activityQuery = supabaseAdmin.from('activity_logs').select('id, type, created_at');
  let modelsQuery = supabaseAdmin.from('ai_models').select('id, enabled, accuracy, predictions');

  if (periodDates) {
    usersQuery = usersQuery.gte('updated_at', periodDates.start).lte('updated_at', periodDates.end);
    alertsQuery = alertsQuery.gte('created_at', periodDates.start).lte('created_at', periodDates.end);
    activityQuery = activityQuery.gte('created_at', periodDates.start).lte('created_at', periodDates.end);
  }

  const [usersResult, alertsResult, activityResult, modelsResult] = await Promise.all([
    usersQuery,
    alertsQuery,
    activityQuery,
    modelsQuery,
  ]);

  const users = usersResult.data || [];
  const alerts = alertsResult.data || [];
  const activities = activityResult.data || [];
  const models = modelsResult.data || [];

  // User metrics
  const userMetrics = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    high_risk: users.filter(u => (parseFloat(u.risk_score) || 0) >= 80).length,
    average_risk_score: users.length > 0
      ? Math.round((users.reduce((sum, u) => sum + (parseFloat(u.risk_score) || 0), 0) / users.length) * 100) / 100
      : 0,
  };

  // Alert metrics
  const alertMetrics = {
    total: alerts.length,
    open: alerts.filter(a => a.status === 'open').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    false_positive: alerts.filter(a => a.status === 'false_positive').length,
    by_severity: {
      low: alerts.filter(a => a.severity === 'low').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      high: alerts.filter(a => a.severity === 'high').length,
      critical: alerts.filter(a => a.severity === 'critical').length,
    },
  };

  // Threat metrics
  const threatMetrics = {
    top_threats: await getTopThreats(alerts),
    total_threat_types: Object.keys(await getTopThreats(alerts)).length,
  };

  // Model metrics
  const modelMetrics = {
    total: models.length,
    active: models.filter(m => m.enabled).length,
    average_accuracy: models.length > 0
      ? Math.round((models.reduce((sum, m) => sum + (parseFloat(m.accuracy) || 0), 0) / models.length) * 100) / 100
      : 0,
    total_predictions: models.reduce((sum, m) => sum + (parseInt(m.predictions) || 0), 0),
  };

  // Activity metrics
  const activityByType = {};
  activities.forEach(activity => {
    const type = activity.type || 'other';
    activityByType[type] = (activityByType[type] || 0) + 1;
  });

  const activityMetrics = {
    total: activities.length,
    by_type: activityByType,
  };

  // Risk distribution
  const riskDistribution = getRiskDistribution(users);

  // Risk trends
  const riskTrends = await getRiskTrends(periodDates);

  return {
    period: periodDates || { start: null, end: null },
    user_metrics: userMetrics,
    alert_metrics: alertMetrics,
    threat_metrics: threatMetrics,
    model_metrics: modelMetrics,
    activity_metrics: activityMetrics,
    risk_distribution: riskDistribution,
    risk_trends: riskTrends,
  };
}

// Generate generic report
async function generateGenericReport(periodDates = null) {
  let usersQuery = supabaseAdmin.from('users').select('id', { count: 'exact', head: true });
  let alertsQuery = supabaseAdmin.from('alerts').select('id', { count: 'exact', head: true });

  if (periodDates) {
    alertsQuery = alertsQuery.gte('created_at', periodDates.start).lte('created_at', periodDates.end);
    usersQuery = usersQuery.gte('updated_at', periodDates.start).lte('updated_at', periodDates.end);
  }

  const [usersResult, alertsResult] = await Promise.all([
    usersQuery,
    alertsQuery,
  ]);

  return {
    summary: {
      total_users: usersResult.count || 0,
      total_alerts: alertsResult.count || 0,
    },
  };
}

// Helper functions
function getAlertType(alert) {
  const title = (alert.title || '').toLowerCase();
  if (title.includes('account') || title.includes('login') || title.includes('auth')) {
    return 'account_compromise';
  }
  if (title.includes('insider') || title.includes('exfiltration')) {
    return 'insider_threat';
  }
  if (title.includes('entity') || title.includes('anomaly')) {
    return 'entity_anomaly';
  }
  if (title.includes('policy') || title.includes('violation')) {
    return 'policy_violation';
  }
  return 'other';
}

function getRiskDistribution(users) {
  const low = users.filter(u => (parseFloat(u.risk_score) || 0) < 40).length;
  const medium = users.filter(u => {
    const score = parseFloat(u.risk_score) || 0;
    return score >= 40 && score < 60;
  }).length;
  const high = users.filter(u => {
    const score = parseFloat(u.risk_score) || 0;
    return score >= 60 && score < 80;
  }).length;
  const critical = users.filter(u => (parseFloat(u.risk_score) || 0) >= 80).length;
  const total = users.length;

  return {
    low,
    medium,
    high,
    critical,
    total,
    percentages: total > 0 ? {
      low: Math.round((low / total) * 100 * 100) / 100,
      medium: Math.round((medium / total) * 100 * 100) / 100,
      high: Math.round((high / total) * 100 * 100) / 100,
      critical: Math.round((critical / total) * 100 * 100) / 100,
    } : { low: 0, medium: 0, high: 0, critical: 0 },
  };
}

async function getTopThreats(alerts) {
  const threatCounts = {};
  alerts.forEach(alert => {
    const type = getAlertType(alert);
    threatCounts[type] = (threatCounts[type] || 0) + 1;
  });
  return Object.entries(threatCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

async function getRiskTrends(periodDates = null) {
  let query = supabaseAdmin
    .from('users')
    .select('risk_score, updated_at')
    .order('updated_at', { ascending: false });

  if (periodDates) {
    // Compare current period with previous period
    const periodDuration = new Date(periodDates.end) - new Date(periodDates.start);
    const previousPeriodStart = new Date(new Date(periodDates.start).getTime() - periodDuration);
    
    const [currentResult, previousResult] = await Promise.all([
      query.gte('updated_at', periodDates.start).lte('updated_at', periodDates.end),
      supabaseAdmin
        .from('users')
        .select('risk_score, updated_at')
        .gte('updated_at', previousPeriodStart.toISOString())
        .lt('updated_at', periodDates.start),
    ]);

    const currentUsers = currentResult.data || [];
    const previousUsers = previousResult.data || [];

    const currentAvg = currentUsers.length > 0
      ? currentUsers.reduce((sum, u) => sum + (parseFloat(u.risk_score) || 0), 0) / currentUsers.length
      : 0;
    const previousAvg = previousUsers.length > 0
      ? previousUsers.reduce((sum, u) => sum + (parseFloat(u.risk_score) || 0), 0) / previousUsers.length
      : 0;

    return {
      current_average: Math.round(currentAvg * 100) / 100,
      previous_average: Math.round(previousAvg * 100) / 100,
      trend: currentAvg > previousAvg ? 'increasing' : currentAvg < previousAvg ? 'decreasing' : 'stable',
      change: Math.round((currentAvg - previousAvg) * 100) / 100,
    };
  }

  // Simplified trend calculation without period filtering
  const { data: users } = await query.limit(100);
  const recent = (users || []).slice(0, 50);
  const older = (users || []).slice(50);

  const recentAvg = recent.length > 0
    ? recent.reduce((sum, u) => sum + (parseFloat(u.risk_score) || 0), 0) / recent.length
    : 0;
  const olderAvg = older.length > 0
    ? older.reduce((sum, u) => sum + (parseFloat(u.risk_score) || 0), 0) / older.length
    : 0;

  return {
    recent_average: Math.round(recentAvg * 100) / 100,
    previous_average: Math.round(olderAvg * 100) / 100,
    trend: recentAvg > olderAvg ? 'increasing' : recentAvg < olderAvg ? 'decreasing' : 'stable',
  };
}

// Main generation function
export async function generateReport(report, generationId, timePeriod = null, customStart = null, customEnd = null) {
  try {
    await ensureReportsDir();

    // Generate report data
    const reportData = await generateReportData(report, timePeriod, customStart, customEnd);

    // Save to file
    const fileName = `${report.id}_${Date.now()}.json`;
    const filePath = path.join(REPORTS_DIR, fileName);
    await fs.writeFile(filePath, JSON.stringify(reportData, null, 2), 'utf8');

    // Get file size
    const stats = await fs.stat(filePath);
    const fileSize = stats.size;

    // Update report record
    await supabaseAdmin
      .from('reports')
      .update({
        status: 'ready',
        file_path: fileName,
        file_size: fileSize,
        last_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', report.id);

    // Update generation record if exists
    if (generationId) {
      await supabaseAdmin
        .from('report_generations')
        .update({
          status: 'completed',
          file_path: fileName,
          completed_at: new Date().toISOString(),
        })
        .eq('id', generationId);
    }

    console.log(`[Report Generator] ✅ Report ${report.id} generated successfully: ${fileName}`);
  } catch (error) {
    console.error(`[Report Generator] ❌ Error generating report ${report.id}:`, error);

    // Update report status to failed
    await supabaseAdmin
      .from('reports')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', report.id);

    // Update generation record if exists
    if (generationId) {
      await supabaseAdmin
        .from('report_generations')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', generationId);
    }
  }
}

