"""
Advanced Risk Scoring Engine for S-UEBA
Implements comprehensive risk calculation combining multiple signals
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from collections import defaultdict
import math

class RiskScoringEngine:
    """
    Advanced risk scoring engine that combines:
    - Model anomaly scores
    - User behavior patterns
    - Temporal factors
    - Historical context
    - Multiple model fusion
    """
    
    def __init__(self):
        # Model weights for fusion (sum should be ~1.0)
        self.model_weights = {
            'lstm_autoencoder': 0.40,
            'isolation_forest': 0.30,
            'statistical': 0.20,
            'rule_based': 0.10
        }
        
        # Risk factor weights
        self.factor_weights = {
            'anomaly_score': 0.35,      # Primary: ML model outputs
            'behavior_deviation': 0.25, # User behavior patterns
            'temporal_risk': 0.15,      # Time-based factors
            'historical_risk': 0.15,    # Historical patterns
            'contextual_risk': 0.10     # Contextual factors (IP, location, etc.)
        }
        
        # Risk thresholds
        self.thresholds = {
            'critical': 85,
            'high': 70,
            'medium': 50,
            'low': 30
        }
        
        # User behavior baselines (in-memory, should be in DB in production)
        self.user_baselines: Dict[str, Dict] = defaultdict(dict)
        
        # Historical risk scores (sliding window)
        self.user_history: Dict[str, List[Tuple[datetime, float]]] = defaultdict(list)
        
        # Score smoothing factor (exponential moving average)
        self.smoothing_factor = 0.15
    
    def calculate_risk_score(
        self,
        anomaly_scores: Dict[str, float],
        user_id: str,
        timestamp: datetime,
        context: Optional[Dict[str, any]] = None
    ) -> Dict[str, any]:
        """
        Calculate comprehensive risk score
        
        Args:
            anomaly_scores: Dict of model_name -> anomaly_score (0-1)
            user_id: User identifier
            timestamp: Event timestamp
            context: Additional context (IP, action, resource, etc.)
        
        Returns:
            Dict with risk_score (0-100), severity, factors, confidence
        """
        context = context or {}
        
        # 1. Fuse multiple model scores
        fused_anomaly_score = self._fuse_model_scores(anomaly_scores)
        
        # 2. Calculate behavior deviation
        behavior_deviation = self._calculate_behavior_deviation(
            user_id, timestamp, context
        )
        
        # 3. Calculate temporal risk
        temporal_risk = self._calculate_temporal_risk(timestamp, context)
        
        # 4. Calculate historical risk
        historical_risk = self._calculate_historical_risk(user_id, timestamp)
        
        # 5. Calculate contextual risk
        contextual_risk = self._calculate_contextual_risk(context)
        
        # 6. Combine all factors with weights
        risk_components = {
            'anomaly_score': fused_anomaly_score * 100,  # Convert to 0-100
            'behavior_deviation': behavior_deviation * 100,
            'temporal_risk': temporal_risk * 100,
            'historical_risk': historical_risk * 100,
            'contextual_risk': contextual_risk * 100
        }
        
        # Weighted combination
        raw_risk_score = (
            risk_components['anomaly_score'] * self.factor_weights['anomaly_score'] +
            risk_components['behavior_deviation'] * self.factor_weights['behavior_deviation'] +
            risk_components['temporal_risk'] * self.factor_weights['temporal_risk'] +
            risk_components['historical_risk'] * self.factor_weights['historical_risk'] +
            risk_components['contextual_risk'] * self.factor_weights['contextual_risk']
        )
        
        # 7. Apply smoothing (exponential moving average with historical scores)
        smoothed_score = self._apply_smoothing(user_id, raw_risk_score, timestamp)
        
        # 8. Normalize to 0-100 range
        final_risk_score = max(0, min(100, smoothed_score))
        
        # 9. Determine severity
        severity = self._determine_severity(final_risk_score)
        
        # 10. Calculate confidence
        confidence = self._calculate_confidence(
            anomaly_scores, behavior_deviation, historical_risk
        )
        
        # 11. Identify risk factors
        risk_factors = self._identify_risk_factors(
            risk_components, context, anomaly_scores
        )
        
        # Update user history
        self._update_user_history(user_id, final_risk_score, timestamp)
        
        return {
            'riskScore': round(final_risk_score, 2),
            'severity': severity,
            'confidence': round(confidence, 2),
            'components': {
                k: round(v, 2) for k, v in risk_components.items()
            },
            'riskFactors': risk_factors,
            'timestamp': timestamp.isoformat()
        }
    
    def _fuse_model_scores(self, anomaly_scores: Dict[str, float]) -> float:
        """
        Fuse multiple model anomaly scores using weighted average
        """
        if not anomaly_scores:
            return 0.0
        
        total_weight = 0.0
        weighted_sum = 0.0
        
        for model_name, score in anomaly_scores.items():
            # Get weight for this model (default to equal weight if not found)
            weight = self.model_weights.get(model_name, 1.0 / len(anomaly_scores))
            weighted_sum += score * weight
            total_weight += weight
        
        if total_weight == 0:
            return 0.0
        
        # Normalize by total weight
        fused_score = weighted_sum / total_weight
        
        # Apply sigmoid function for better distribution
        # This helps with extreme values
        fused_score = 1 / (1 + math.exp(-5 * (fused_score - 0.5)))
        
        return fused_score
    
    def _calculate_behavior_deviation(
        self,
        user_id: str,
        timestamp: datetime,
        context: Dict[str, any]
    ) -> float:
        """
        Calculate how much current behavior deviates from user's baseline
        """
        baseline = self.user_baselines.get(user_id, {})
        
        if not baseline:
            # New user - initialize baseline
            baseline = {
                'avg_hour': 12.0,  # Noon
                'common_actions': set(),
                'common_ips': set(),
                'common_resources': set(),
                'action_frequency': defaultdict(int)
            }
            self.user_baselines[user_id] = baseline
        
        deviation_score = 0.0
        factors = []
        
        # 1. Time deviation (off-hours activity)
        hour = timestamp.hour
        avg_hour = baseline.get('avg_hour', 12.0)
        hour_deviation = abs(hour - avg_hour) / 12.0  # Normalize to 0-1
        if hour_deviation > 0.5:  # More than 6 hours from average
            deviation_score += 0.3
            factors.append('off_hours_activity')
        
        # 2. Action deviation (unusual action types)
        action = context.get('action', '')
        common_actions = baseline.get('common_actions', set())
        if action and action not in common_actions and len(common_actions) > 0:
            deviation_score += 0.25
            factors.append('unusual_action')
        
        # 3. IP deviation (new/unusual IP address)
        source_ip = context.get('source_ip', '')
        common_ips = baseline.get('common_ips', set())
        if source_ip and source_ip not in common_ips and len(common_ips) > 0:
            deviation_score += 0.2
            factors.append('unusual_ip')
        
        # 4. Resource deviation (accessing unusual resources)
        resource = context.get('resource', '')
        common_resources = baseline.get('common_resources', set())
        if resource and resource not in common_resources and len(common_resources) > 0:
            deviation_score += 0.15
            factors.append('unusual_resource')
        
        # 5. Action frequency (sudden spike in activity)
        action_freq = baseline.get('action_frequency', defaultdict(int))
        if action:
            recent_freq = action_freq.get(action, 0)
            if recent_freq > 0:
                # If this action is suddenly much more frequent
                deviation_score += min(0.1, recent_freq / 100.0)
        
        # Update baseline (sliding window approach)
        self._update_baseline(user_id, timestamp, context)
        
        return min(1.0, deviation_score)
    
    def _calculate_temporal_risk(
        self,
        timestamp: datetime,
        context: Dict[str, any]
    ) -> float:
        """
        Calculate risk based on temporal patterns
        """
        risk = 0.0
        
        # 1. Off-hours activity (outside 8 AM - 6 PM)
        hour = timestamp.hour
        if hour < 8 or hour > 18:
            risk += 0.3
        
        # 2. Weekend activity
        weekday = timestamp.weekday()
        if weekday >= 5:  # Saturday or Sunday
            risk += 0.2
        
        # 3. Holiday detection (simplified - check for common holidays)
        # In production, use a proper holiday calendar
        month = timestamp.month
        day = timestamp.day
        if (month == 12 and day >= 24 and day <= 26) or \
           (month == 1 and day == 1) or \
           (month == 7 and day == 4):
            risk += 0.15
        
        # 4. Rapid successive actions (burst detection)
        # This would require tracking recent actions per user
        # For now, we'll use a simplified version
        action = context.get('action', '')
        if action in ['login', 'admin_action', 'execute_script']:
            risk += 0.1
        
        return min(1.0, risk)
    
    def _calculate_historical_risk(
        self,
        user_id: str,
        timestamp: datetime
    ) -> float:
        """
        Calculate risk based on user's historical patterns
        """
        history = self.user_history.get(user_id, [])
        
        if not history:
            return 0.0
        
        # Look at last 24 hours
        cutoff_time = timestamp - timedelta(hours=24)
        recent_scores = [
            score for ts, score in history
            if ts >= cutoff_time
        ]
        
        if not recent_scores:
            return 0.0
        
        # Calculate risk based on:
        # 1. Recent high scores
        avg_recent = np.mean(recent_scores)
        if avg_recent > 70:
            return 0.4
        elif avg_recent > 50:
            return 0.25
        elif avg_recent > 30:
            return 0.1
        
        # 2. Trend (increasing risk)
        if len(recent_scores) >= 3:
            trend = np.polyfit(range(len(recent_scores)), recent_scores, 1)[0]
            if trend > 5:  # Increasing trend
                return 0.2
        
        return 0.0
    
    def _calculate_contextual_risk(self, context: Dict[str, any]) -> float:
        """
        Calculate risk based on contextual factors
        """
        risk = 0.0
        
        # 1. Failed authentication
        status = context.get('status', '').lower()
        if status == 'failed':
            risk += 0.4
        
        # 2. Admin actions
        action = context.get('action', '').lower()
        if 'admin' in action or 'privilege' in action:
            risk += 0.3
        
        # 3. Sensitive resources
        resource = context.get('resource', '').lower()
        sensitive_keywords = ['admin', 'config', 'password', 'secret', 'key', 'credential']
        if any(keyword in resource for keyword in sensitive_keywords):
            risk += 0.25
        
        # 4. External IP (if internal network expected)
        source_ip = context.get('source_ip', '')
        if source_ip:
            # Check if IP is in private ranges (simplified)
            ip_parts = source_ip.split('.')
            if len(ip_parts) == 4:
                first_octet = int(ip_parts[0]) if ip_parts[0].isdigit() else 0
                # Private IP ranges: 10.x, 172.16-31.x, 192.168.x
                is_private = (
                    first_octet == 10 or
                    (first_octet == 172 and 16 <= int(ip_parts[1]) <= 31) or
                    (first_octet == 192 and int(ip_parts[1]) == 168)
                )
                if not is_private:
                    risk += 0.15
        
        # 5. Large data transfer
        # This would require additional context about data size
        # For now, we'll use resource length as proxy
        resource_length = len(resource)
        if resource_length > 200:  # Unusually long resource path
            risk += 0.1
        
        return min(1.0, risk)
    
    def _apply_smoothing(
        self,
        user_id: str,
        current_score: float,
        timestamp: datetime
    ) -> float:
        """
        Apply exponential moving average smoothing to reduce volatility
        """
        history = self.user_history.get(user_id, [])
        
        if not history:
            return current_score
        
        # Get most recent score
        if history:
            last_score = history[-1][1]
            # Exponential moving average
            smoothed = (
                self.smoothing_factor * current_score +
                (1 - self.smoothing_factor) * last_score
            )
            return smoothed
        
        return current_score
    
    def _determine_severity(self, risk_score: float) -> str:
        """Determine severity level based on risk score"""
        if risk_score >= self.thresholds['critical']:
            return 'critical'
        elif risk_score >= self.thresholds['high']:
            return 'high'
        elif risk_score >= self.thresholds['medium']:
            return 'medium'
        elif risk_score >= self.thresholds['low']:
            return 'low'
        else:
            return 'normal'
    
    def _calculate_confidence(
        self,
        anomaly_scores: Dict[str, float],
        behavior_deviation: float,
        historical_risk: float
    ) -> float:
        """
        Calculate confidence in the risk score
        """
        # More models = higher confidence
        model_confidence = min(1.0, len(anomaly_scores) / 3.0)
        
        # Consistent signals = higher confidence
        if anomaly_scores:
            scores = list(anomaly_scores.values())
            score_variance = np.var(scores)
            consistency = 1.0 - min(1.0, score_variance)
        else:
            consistency = 0.5
        
        # Historical data = higher confidence
        history_confidence = min(1.0, historical_risk * 2) if historical_risk > 0 else 0.3
        
        # Weighted combination
        confidence = (
            model_confidence * 0.4 +
            consistency * 0.4 +
            history_confidence * 0.2
        )
        
        return confidence
    
    def _identify_risk_factors(
        self,
        components: Dict[str, float],
        context: Dict[str, any],
        anomaly_scores: Dict[str, float]
    ) -> List[str]:
        """Identify specific risk factors"""
        factors = []
        
        # High anomaly score
        if components['anomaly_score'] > 70:
            factors.append('High anomaly detection score')
        
        # Behavior deviation
        if components['behavior_deviation'] > 60:
            factors.append('Unusual behavior pattern')
        
        # Temporal risk
        if components['temporal_risk'] > 50:
            factors.append('Off-hours or unusual timing')
        
        # Contextual factors
        if context.get('status') == 'failed':
            factors.append('Failed authentication')
        
        if 'admin' in context.get('action', '').lower():
            factors.append('Privileged action')
        
        # Multiple high scores
        high_scores = [s for s in anomaly_scores.values() if s > 0.7]
        if len(high_scores) >= 2:
            factors.append('Multiple model agreement')
        
        return factors[:5]  # Return top 5 factors
    
    def _update_baseline(
        self,
        user_id: str,
        timestamp: datetime,
        context: Dict[str, any]
    ):
        """Update user behavior baseline"""
        baseline = self.user_baselines[user_id]
        
        # Update average hour (exponential moving average)
        hour = timestamp.hour
        if 'avg_hour' not in baseline:
            baseline['avg_hour'] = hour
        else:
            baseline['avg_hour'] = 0.9 * baseline['avg_hour'] + 0.1 * hour
        
        # Update common actions (keep last 20)
        action = context.get('action', '')
        if action:
            common_actions = baseline.get('common_actions', set())
            common_actions.add(action)
            if len(common_actions) > 20:
                common_actions.pop()
            baseline['common_actions'] = common_actions
        
        # Update common IPs (keep last 10)
        source_ip = context.get('source_ip', '')
        if source_ip:
            common_ips = baseline.get('common_ips', set())
            common_ips.add(source_ip)
            if len(common_ips) > 10:
                common_ips.pop()
            baseline['common_ips'] = common_ips
        
        # Update common resources (keep last 30)
        resource = context.get('resource', '')
        if resource:
            common_resources = baseline.get('common_resources', set())
            common_resources.add(resource)
            if len(common_resources) > 30:
                common_resources.pop()
            baseline['common_resources'] = common_resources
        
        # Update action frequency
        if action:
            action_freq = baseline.get('action_frequency', defaultdict(int))
            action_freq[action] += 1
            baseline['action_frequency'] = action_freq
    
    def _update_user_history(
        self,
        user_id: str,
        risk_score: float,
        timestamp: datetime
    ):
        """Update user risk score history"""
        history = self.user_history[user_id]
        history.append((timestamp, risk_score))
        
        # Keep only last 1000 entries per user
        if len(history) > 1000:
            history.pop(0)
    
    def calculate_user_risk_score(self, user_id: str) -> Dict[str, any]:
        """
        Calculate overall risk score for a user based on recent activity
        """
        history = self.user_history.get(user_id, [])
        
        if not history:
            return {
                'riskScore': 0,
                'riskTrend': 0,
                'severity': 'normal',
                'recentActivity': 0
            }
        
        # Get recent scores (last 7 days)
        cutoff_time = datetime.now() - timedelta(days=7)
        recent_scores = [
            score for ts, score in history
            if ts >= cutoff_time
        ]
        
        if not recent_scores:
            return {
                'riskScore': 0,
                'riskTrend': 0,
                'severity': 'normal',
                'recentActivity': 0
            }
        
        # Calculate average risk score
        avg_risk = np.mean(recent_scores)
        
        # Calculate trend
        if len(recent_scores) >= 2:
            trend = recent_scores[-1] - recent_scores[0]
        else:
            trend = 0
        
        return {
            'riskScore': round(avg_risk, 2),
            'riskTrend': round(trend, 2),
            'severity': self._determine_severity(avg_risk),
            'recentActivity': len(recent_scores)
        }
    
    def update_model_weights(self, weights: Dict[str, float]):
        """Update model weights for fusion"""
        # Normalize weights to sum to 1.0
        total = sum(weights.values())
        if total > 0:
            self.model_weights = {
                k: v / total for k, v in weights.items()
            }
    
    def update_thresholds(self, thresholds: Dict[str, int]):
        """Update risk score thresholds"""
        self.thresholds.update(thresholds)

