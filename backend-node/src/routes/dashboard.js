import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

// Helper function to extract alert type from title/metadata
function getAlertType(alert) {
  const title = (alert.title || '').toLowerCase();
  const description = (alert.description || '').toLowerCase();
  const metadata = alert.metadata || {};
  
  if (title.includes('account') || title.includes('login') || title.includes('auth') || 
      description.includes('login') || description.includes('authentication')) {
    return 'account_compromise';
  }
  if (title.includes('insider') || title.includes('exfiltration') || 
      description.includes('exfiltration') || description.includes('data transfer')) {
    return 'insider_threat';
  }
  if (title.includes('entity') || title.includes('anomaly') || 
      description.includes('anomaly') || description.includes('unusual')) {
    return 'entity_anomaly';
  }
  if (title.includes('policy') || title.includes('violation') || 
      description.includes('policy') || description.includes('violation')) {
    return 'policy_violation';
  }
  
  // Default based on metadata
  if (metadata.alert_type) {
    return metadata.alert_type;
  }
  
  return 'entity_anomaly'; // Default
}

// Get comprehensive dashboard stats
router.get('/stats', async (req, res, next) => {
  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const last30Days = new Date(now);
    last30Days.setDate(last30Days.getDate() - 30);

    // Basic counts
    const [usersResult, alertsResult, dataSourcesResult, modelsResult] = await Promise.all([
      supabaseAdmin.from('users').select('id, risk_score, status, created_at', { count: 'exact' }),
      supabaseAdmin.from('alerts').select('id, status, created_at, severity, title, description, metadata, user_id, anomaly_score'),
      supabaseAdmin.from('data_sources').select('id, status', { count: 'exact' }),
      supabaseAdmin.from('ai_models').select('id, enabled', { count: 'exact' }),
    ]);

    const users = usersResult.data || [];
    const alerts = alertsResult.data || [];
    const totalUsers = usersResult.count || 0;
    const totalDataSources = dataSourcesResult.count || 0;
    const totalModels = modelsResult.count || 0;

    // Active alerts (open, acknowledged, investigating)
    const activeAlerts = alerts.filter(a => 
      ['open', 'acknowledged', 'investigating'].includes(a.status)
    ).length;

    // Threats blocked (resolved alerts)
    const threatsBlocked = alerts.filter(a => a.status === 'resolved').length;

    // Calculate changes
    const usersLastWeek = users.filter(u => new Date(u.created_at) >= lastWeek).length;
    const userChange = totalUsers > 0 ? Math.round((usersLastWeek / totalUsers) * 100) : 0;

    const alertsYesterday = alerts.filter(a => {
      const alertDate = new Date(a.created_at);
      return alertDate >= yesterday && alertDate < now;
    }).length;
    const alertChange = activeAlerts > 0 ? Math.round(((alertsYesterday - activeAlerts) / activeAlerts) * 100) : 0;

    const threatsThisMonth = alerts.filter(a => {
      const alertDate = new Date(a.created_at);
      return alertDate >= lastMonth && a.status === 'resolved';
    }).length;
    const threatsLastMonth = alerts.filter(a => {
      const alertDate = new Date(a.created_at);
      return alertDate >= lastMonth && alertDate < lastMonth && a.status === 'resolved';
    }).length;
    const threatChange = threatsLastMonth > 0 
      ? Math.round(((threatsThisMonth - threatsLastMonth) / threatsLastMonth) * 100)
      : threatsThisMonth > 0 ? 100 : 0;

    // Risk metrics
    const riskScores = users.map(u => parseFloat(u.risk_score) || 0).filter(r => !isNaN(r));
    const systemRiskScore = riskScores.length > 0
      ? Math.round(riskScores.reduce((a, b) => a + b, 0) / riskScores.length)
      : 0;

    const riskDistribution = {
      low: users.filter(u => (parseFloat(u.risk_score) || 0) < 40).length,
      medium: users.filter(u => {
        const score = parseFloat(u.risk_score) || 0;
        return score >= 40 && score < 80;
      }).length,
      high: users.filter(u => (parseFloat(u.risk_score) || 0) >= 80).length,
    };

    const totalRiskUsers = riskDistribution.low + riskDistribution.medium + riskDistribution.high;
    const riskPercentages = {
      low: totalRiskUsers > 0 ? Math.round((riskDistribution.low / totalRiskUsers) * 100) : 0,
      medium: totalRiskUsers > 0 ? Math.round((riskDistribution.medium / totalRiskUsers) * 100) : 0,
      high: totalRiskUsers > 0 ? Math.round((riskDistribution.high / totalRiskUsers) * 100) : 0,
    };

    // Risk trends
    const riskTrend24h = [];
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now);
      hourStart.setHours(hourStart.getHours() - i, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hourEnd.getHours() + 1);

      const hourAlerts = alerts.filter(a => {
        const alertDate = new Date(a.created_at);
        return alertDate >= hourStart && alertDate < hourEnd;
      });

      const avgRisk = hourAlerts.length > 0
        ? Math.round(hourAlerts.reduce((sum, a) => sum + (parseFloat(a.anomaly_score) || 0), 0) / hourAlerts.length)
        : systemRiskScore;

      riskTrend24h.push({
        time: hourStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        risk: avgRisk,
        alerts: hourAlerts.length,
      });
    }

    const riskTrend7d = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayAlerts = alerts.filter(a => {
        const alertDate = new Date(a.created_at);
        return alertDate >= dayStart && alertDate < dayEnd;
      });

      const avgRisk = dayAlerts.length > 0
        ? Math.round(dayAlerts.reduce((sum, a) => sum + (parseFloat(a.anomaly_score) || 0), 0) / dayAlerts.length)
        : systemRiskScore;

      riskTrend7d.push({
        time: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        risk: avgRisk,
        alerts: dayAlerts.length,
      });
    }

    const riskTrend30d = [];
    for (let i = 29; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayAlerts = alerts.filter(a => {
        const alertDate = new Date(a.created_at);
        return alertDate >= dayStart && alertDate < dayEnd;
      });

      const avgRisk = dayAlerts.length > 0
        ? Math.round(dayAlerts.reduce((sum, a) => sum + (parseFloat(a.anomaly_score) || 0), 0) / dayAlerts.length)
        : systemRiskScore;

      riskTrend30d.push({
        time: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        risk: avgRisk,
        alerts: dayAlerts.length,
      });
    }

    // Recent alerts (last 10)
    const recentAlertsRaw = alerts
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    const recentAlerts = await Promise.all(
      recentAlertsRaw.map(async (alert) => {
        let userEmail = alert.metadata?.user_email || 'System';
        if (alert.user_id && !userEmail.includes('@')) {
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('email')
            .eq('id', alert.user_id)
            .maybeSingle();
          if (user) userEmail = user.email;
        }

        return {
          id: alert.id,
          type: getAlertType(alert),
          severity: alert.severity || 'medium',
          message: alert.description || alert.title,
          user: userEmail !== 'System' ? userEmail : undefined,
          entity: alert.metadata?.entity || undefined,
          timestamp: alert.created_at,
        };
      })
    );

    // Top risky users (top 5 by risk score)
    const topRiskyUsersRaw = users
      .map(u => ({
        ...u,
        riskScore: parseFloat(u.risk_score) || 0,
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5);

    const topRiskyUsers = await Promise.all(
      topRiskyUsersRaw.map(async (user) => {
        // Get user's alert count
        const { count: alertCount } = await supabaseAdmin
          .from('alerts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['open', 'acknowledged', 'investigating']);

        // Calculate change (simplified - compare with previous risk score)
        // In a real system, you'd track historical risk scores
        const change = 0; // TODO: Implement historical tracking

        const metadata = user.metadata || {};
        const name = metadata.name || user.username || user.email.split('@')[0];
        const department = metadata.department || 'Unknown';

        return {
          id: user.id,
          email: user.email,
          name,
          riskScore: Math.round(user.riskScore),
          change,
          department,
          lastActivity: user.updated_at,
        };
      })
    );

    // Threat distribution
    const threatCounts = {};
    alerts.forEach(alert => {
      const type = getAlertType(alert);
      if (!threatCounts[type]) {
        threatCounts[type] = { count: 0, severity: alert.severity || 'medium' };
      }
      threatCounts[type].count++;
    });

    const totalThreats = Object.values(threatCounts).reduce((sum, t) => sum + t.count, 0);
    const threatDistribution = Object.entries(threatCounts).map(([name, data]) => ({
      name: name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      count: data.count,
      severity: data.severity,
      percentage: totalThreats > 0 ? Math.round((data.count / totalThreats) * 100) : 0,
    })).sort((a, b) => b.count - a.count);

    const stats = {
      // Basic stats
      totalUsers,
      activeAlerts,
      threatsBlocked,
      totalDataSources,
      totalModels,
      
      // Changes
      userChange,
      alertChange,
      threatChange,
      
      // Risk metrics
      systemRiskScore,
      riskDistribution,
      riskPercentages,
      
      // Trends
      riskTrend24h,
      riskTrend7d,
      riskTrend30d,
      
      // Recent data
      recentAlerts,
      topRiskyUsers,
      threatDistribution,
      
      timestamp: new Date().toISOString(),
    };

    res.json(stats);
  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    next(error);
  }
});

export default router;



