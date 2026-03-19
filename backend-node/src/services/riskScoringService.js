import { supabaseAdmin } from '../config/supabase.js';

class RiskScoringService {
  constructor() {
    // Default weights and thresholds (fallback)
    this.weights = {
      anomaly: 0.35,
      behavior: 0.25,
      temporal: 0.15,
      historical: 0.15,
      contextual: 0.10
    };
    this.thresholds = {
      low: 30,
      medium: 50,
      high: 70,
      critical: 85
    };
    this.fusion = {
      method: 'weighted',
      smoothing_factor: 0.15
    };

    // Initialize - will load from DB
    this.initialize();
  }

  async initialize() {
    try {
      const { data } = await supabaseAdmin.from('system_settings').select('key, value');
      if (data) {
        data.forEach(item => {
          if (item.key === 'risk_weights') this.weights = item.value;
          if (item.key === 'risk_thresholds') this.thresholds = item.value;
          if (item.key === 'risk_fusion') this.fusion = item.value;
        });
      }
    } catch (error) {
      console.warn('[RiskScoringService] Falling back to default settings:', error.message);
    }
  }

  /**
   * Calculate comprehensive risk score (0-100)
   */
  async calculateRiskScore(event, anomalyScore = 0) {
    const { user_id, timestamp, action, source_ip, resource, status } = event;
    const time = new Date(timestamp);
    const hour = time.getHours();

    // 1. Anomaly Component (35%)
    // Sigmoid normalization from formula: 1 / (1 + exp(-5 * (score - 0.5)))
    const sigmoidAnomaly = 1 / (1 + Math.exp(-5 * (anomalyScore - 0.5)));
    const anomalyComponent = sigmoidAnomaly * 100;

    // 2. Behavior Deviation (25%)
    const behaviorComponent = await this._calculateBehaviorDeviation(user_id, time, action, source_ip, resource);

    // 3. Temporal Risk (15%)
    const temporalComponent = this._calculateTemporalRisk(time, user_id);

    // 4. Historical Risk (15%)
    const historicalComponent = await this._calculateHistoricalRisk(user_id);

    // 5. Contextual Risk (10%)
    const contextualComponent = this._calculateContextualRisk(action, resource, source_ip, status);

    // Weighted Combine
    let riskScore = (
      (anomalyComponent * this.weights.anomaly) +
      (behaviorComponent * this.weights.behavior) +
      (temporalComponent * this.weights.temporal) +
      (historicalComponent * this.weights.historical) +
      (contextualComponent * this.weights.contextual)
    );

    // Apply Smoothing (Exponential Moving Average)
    const finalScore = await this._applySmoothing(user_id, riskScore);

    // Severity Classification
    const severity = this._getSeverity(finalScore);

    return {
      riskScore: Math.round(finalScore * 100) / 100,
      severity,
      components: {
        anomaly: Math.round(anomalyComponent * 100) / 100,
        behavior: Math.round(behaviorComponent * 100) / 100,
        temporal: Math.round(temporalComponent * 100) / 100,
        historical: Math.round(historicalComponent * 100) / 100,
        contextual: Math.round(contextualComponent * 100) / 100
      }
    };
  }

  async _calculateBehaviorDeviation(userId, time, action, ip, resource) {
    let deviation = 0;
    
    // Get user baseline from metadata
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('metadata')
      .eq('id', userId)
      .maybeSingle();

    const baseline = user?.metadata?.baseline || {
      common_actions: [],
      common_ips: [],
      common_resources: [],
      normal_hours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
    };

    // Factor 1: Off-hours (0.3)
    const hour = time.getHours();
    if (!baseline.normal_hours.includes(hour)) {
      deviation += 0.3;
    }

    // Factor 2: Unusual action (0.25)
    if (baseline.common_actions.length > 0 && !baseline.common_actions.includes(action)) {
      deviation += 0.25;
    }

    // Factor 3: New IP (0.25)
    if (baseline.common_ips.length > 0 && !baseline.common_ips.includes(ip)) {
      deviation += 0.25;
    }

    // Factor 4: Unusual resource (0.2)
    if (baseline.common_resources.length > 0 && !baseline.common_resources.includes(resource)) {
      deviation += 0.2;
    }

    return Math.min(1.0, deviation) * 100;
  }

  _calculateTemporalRisk(time, userId) {
    let risk = 0;
    const hour = time.getHours();
    const day = time.getDay();

    // Factor 1: Off-hours (0.4)
    if (hour < 8 || hour > 18) risk += 0.4;
    
    // Factor 2: Weekend (0.3)
    if (day === 0 || day === 6) risk += 0.3;

    // TODO: Holiday detection (not implemented)
    
    // Cap at 1.0
    return Math.min(1.0, risk) * 100;
  }

  async _calculateHistoricalRisk(userId) {
    // Get last N alerts/scores for this user
    const { data: recentAlerts } = await supabaseAdmin
      .from('alerts')
      .select('anomaly_score')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!recentAlerts || recentAlerts.length === 0) return 30; // Baseline modest risk for unknowns

    const scores = recentAlerts.map(a => parseFloat(a.anomaly_score) || 0);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    let historicalRisk = (avgScore / 100) * 0.5;

    // Trend analysis
    if (scores.length >= 2) {
      const trend = (scores[0] - scores[scores.length - 1]) / scores.length;
      if (trend > 0) {
        historicalRisk += Math.min(0.3, trend * 2);
      }
    }

    // High risk events
    const highRiskCount = scores.filter(s => s > 70).length;
    if (highRiskCount > 0) {
      historicalRisk += Math.min(0.2, highRiskCount * 0.05);
    }

    return Math.min(1.0, historicalRisk) * 100;
  }

  _calculateContextualRisk(action, resource, ip, status) {
    let risk = 0;

    // Factor 1: Failed Auth (0.4)
    if (status === 'failed' && action === 'login') risk += 0.4;

    // Factor 2: Admin Actions (0.3)
    if (action === 'admin_action' || action === 'execute_script') risk += 0.3;

    // Factor 3: Sensitive Resource (0.2)
    const sensitiveKeywords = ['admin', 'password', 'key', 'secret', 'confidential'];
    if (sensitiveKeywords.some(kw => resource?.toLowerCase().includes(kw))) {
      risk += 0.2;
    }

    // Factor 4: External IP (0.1)
    if (ip) {
      const isInternal = ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.');
      if (!isInternal) risk += 0.1;
    }

    return Math.min(1.0, risk) * 100;
  }

  async _applySmoothing(userId, currentScore) {
    const alpha = this.fusion.smoothing_factor || 0.15;
    
    // Get last user risk score
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('risk_score')
      .eq('id', userId)
      .maybeSingle();

    const previousScore = parseFloat(user?.risk_score) || 0;
    
    if (previousScore === 0) return currentScore;
    
    // EMA: (1 - α) * previous + α * current
    return ((1 - alpha) * previousScore) + (alpha * currentScore);
  }

  _getSeverity(score) {
    if (score >= this.thresholds.critical) return 'critical';
    if (score >= this.thresholds.high) return 'high';
    if (score >= this.thresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * Update user baseline statistics based on recent activity
   */
  async updateUserBaseline(userId) {
    // Get last 100 events for this user (from processed_rows)
    const { data: logs } = await supabaseAdmin
      .from('processed_rows')
      .select('action, source_ip, resource, timestamp')
      .eq('user_id', userId) // Note: user_id in logs might be email
      .order('timestamp', { ascending: false })
      .limit(100);

    if (!logs || logs.length < 10) return;

    // Calculate common actions
    const actionCounts = {};
    const ipCounts = {};
    const resourceCounts = {};
    const hourCounts = Array(24).fill(0);

    logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      ipCounts[log.source_ip] = (ipCounts[log.source_ip] || 0) + 1;
      resourceCounts[log.resource] = (resourceCounts[log.resource] || 0) + 1;
      hourCounts[new Date(log.timestamp).getHours()]++;
    });

    // Top 5 of each
    const common_actions = Object.entries(actionCounts).sort((a,b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
    const common_ips = Object.entries(ipCounts).sort((a,b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
    const common_resources = Object.entries(resourceCounts).sort((a,b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
    
    // Normal hours (any hour with > 5% of activity)
    const normal_hours = hourCounts.map((count, hr) => count > logs.length * 0.05 ? hr : null).filter(hr => hr !== null);

    // Update user metadata
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('metadata')
      .eq('id', userId)
      .maybeSingle();

    const metadata = user?.metadata || {};
    metadata.baseline = {
      common_actions,
      common_ips,
      common_resources,
      normal_hours,
      updated_at: new Date().toISOString()
    };

    await supabaseAdmin
      .from('users')
      .update({ metadata })
      .eq('id', userId);
  }
}

export const riskScoringService = new RiskScoringService();
