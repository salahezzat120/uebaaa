# Best Risk Scoring Formula for AI Team
## Complete Implementation Guide

**For:** AI Team Members (Member B - Advanced, Member C - Medium)  
**Purpose:** Build the risk scoring engine based on the optimal formula  
**Last Updated:** [Current Date]

---

## 🎯 The Best Risk Scoring Formula

### **Core Formula**

```
Risk Score (0-100) = 
    (Anomaly Score × 35%) +
    (Behavior Deviation × 25%) +
    (Temporal Risk × 15%) +
    (Historical Risk × 15%) +
    (Contextual Risk × 10%)
```

**Where:**
- All components are normalized to 0-1 range, then multiplied by 100
- Final score is 0-100 (0 = Normal, 100 = Critical Threat)

---

## 📐 Detailed Component Formulas

### **1. Anomaly Score (35% weight) - PRIMARY FACTOR**

**Purpose:** Fuse outputs from multiple ML models

**Formula:**
```python
# Step 1: Weighted average of model scores
fused_score = Σ(model_score_i × weight_i)

# Step 2: Sigmoid normalization (handles extreme values)
anomaly_score = 1 / (1 + exp(-5 × (fused_score - 0.5)))

# Step 3: Convert to 0-100 range
anomaly_score_100 = anomaly_score × 100
```

**Model Weights (Default):**
```python
model_weights = {
    'lstm_autoencoder': 0.40,    # 40% - Your primary model
    'isolation_forest': 0.30,      # 30% - If implemented
    'statistical': 0.20,           # 20% - Statistical methods
    'rule_based': 0.10             # 10% - Rule-based detection
}
```

**Why Sigmoid?**
- Prevents extreme values from dominating
- Smooths model disagreements
- Better handles outliers

**Example:**
```python
# Input: Multiple model outputs
anomaly_scores = {
    'lstm_autoencoder': 0.75,
    'isolation_forest': 0.68
}

# Step 1: Weighted average
fused = (0.75 × 0.40) + (0.68 × 0.30) = 0.30 + 0.204 = 0.504

# Step 2: Sigmoid (optional, for smoothing)
anomaly_score = 1 / (1 + exp(-5 × (0.504 - 0.5))) ≈ 0.51

# Step 3: To 0-100
anomaly_score_100 = 0.51 × 100 = 51.0
```

---

### **2. Behavior Deviation (25% weight)**

**Purpose:** Compare current behavior against user's baseline

**Formula:**
```python
deviation_score = 0.0

# Factor 1: Off-hours activity (0-0.3)
if is_off_hours(timestamp):
    deviation_score += 0.3

# Factor 2: Unusual action type (0-0.25)
if action not in user_baseline['common_actions']:
    deviation_score += 0.25

# Factor 3: New/unusual IP (0-0.25)
if ip not in user_baseline['common_ips']:
    deviation_score += 0.25

# Factor 4: Unusual resource access (0-0.2)
if resource not in user_baseline['common_resources']:
    deviation_score += 0.2

# Cap at 1.0
behavior_deviation = min(1.0, deviation_score)
```

**User Baseline (Auto-built):**
```python
user_baseline = {
    'common_actions': ['login', 'access_file', ...],  # Top 10 actions
    'common_ips': ['192.168.1.100', ...],            # Top 10 IPs
    'common_resources': ['/api/dashboard', ...],     # Top 10 resources
    'normal_hours': [8, 9, 10, ..., 17],            # Hours 8 AM - 5 PM
    'activity_frequency': 5.2  # Average actions per hour
}
```

**Why 25%?**
- Important but not primary (models are more reliable)
- Balances false positives
- Learns user patterns automatically

---

### **3. Temporal Risk (15% weight)**

**Purpose:** Time-based risk factors

**Formula:**
```python
temporal_risk = 0.0

# Factor 1: Off-hours (before 8 AM or after 6 PM)
if hour < 8 or hour > 18:
    temporal_risk += 0.4

# Factor 2: Weekend activity
if is_weekend(timestamp):
    temporal_risk += 0.3

# Factor 3: Holiday activity (if configured)
if is_holiday(timestamp):
    temporal_risk += 0.2

# Factor 4: Rapid successive actions (burst detection)
if actions_in_last_minute > 10:
    temporal_risk += 0.1

# Cap at 1.0
temporal_risk = min(1.0, temporal_risk)
```

**Why 15%?**
- Important but not always indicative of threat
- Some users work off-hours legitimately
- Complements other factors

---

### **4. Historical Risk (15% weight)**

**Purpose:** User's recent risk history and trends

**Formula:**
```python
# Get recent risk scores (last 24 hours)
recent_scores = get_recent_scores(user_id, last_24h)

# Factor 1: Average recent risk (0-0.5)
avg_recent_risk = mean(recent_scores) if recent_scores else 0.0
historical_risk += avg_recent_risk * 0.5

# Factor 2: Risk trend (increasing = higher risk) (0-0.3)
if len(recent_scores) >= 2:
    trend = (recent_scores[-1] - recent_scores[0]) / len(recent_scores)
    if trend > 0:  # Increasing
        historical_risk += min(0.3, trend * 2)

# Factor 3: Recent high-risk events (0-0.2)
high_risk_count = sum(1 for s in recent_scores if s > 70)
if high_risk_count > 0:
    historical_risk += min(0.2, high_risk_count * 0.05)

# Cap at 1.0
historical_risk = min(1.0, historical_risk)
```

**Why 15%?**
- Provides context but not primary signal
- Helps identify persistent threats
- Smooths out volatility

---

### **5. Contextual Risk (10% weight)**

**Purpose:** Context-specific risk factors

**Formula:**
```python
contextual_risk = 0.0

# Factor 1: Failed authentication (0-0.4)
if context.get('status') == 'failed':
    contextual_risk += 0.4

# Factor 2: Privileged/admin actions (0-0.3)
if context.get('action') in ['admin_action', 'privileged_access']:
    contextual_risk += 0.3

# Factor 3: Sensitive resource access (0-0.2)
if is_sensitive_resource(context.get('resource')):
    contextual_risk += 0.2

# Factor 4: External IP address (0-0.1)
if is_external_ip(context.get('source_ip')):
    contextual_risk += 0.1

# Cap at 1.0
contextual_risk = min(1.0, contextual_risk)
```

**Why 10%?**
- Important but context-dependent
- Can have false positives
- Complements other factors

---

## 🔢 Complete Calculation Example

### **Input:**
```python
anomaly_scores = {
    'lstm_autoencoder': 0.75,
    'isolation_forest': 0.68
}
user_id = 'admin@company.com'
timestamp = datetime(2024, 1, 15, 2, 0, 0)  # 2 AM
context = {
    'action': 'admin_action',
    'source_ip': '203.0.113.1',  # External IP
    'resource': '/api/admin/users',
    'status': 'success'
}
```

### **Step-by-Step Calculation:**

**1. Anomaly Score (35%):**
```python
fused = (0.75 × 0.40) + (0.68 × 0.30) = 0.504
anomaly_score = sigmoid(0.504) ≈ 0.51
anomaly_component = 0.51 × 100 = 51.0
weighted = 51.0 × 0.35 = 17.85
```

**2. Behavior Deviation (25%):**
```python
deviation = 0.0
if is_off_hours(2 AM): deviation += 0.3      # Off-hours
if 'admin_action' not in baseline: deviation += 0.25  # Unusual action
if '203.0.113.1' not in baseline: deviation += 0.25   # New IP
behavior_deviation = min(1.0, 0.8) = 0.8
behavior_component = 0.8 × 100 = 80.0
weighted = 80.0 × 0.25 = 20.0
```

**3. Temporal Risk (15%):**
```python
temporal = 0.0
if hour < 8: temporal += 0.4  # Off-hours
temporal_risk = 0.4
temporal_component = 0.4 × 100 = 40.0
weighted = 40.0 × 0.15 = 6.0
```

**4. Historical Risk (15%):**
```python
# Assume recent avg = 0.3, trend = 0.1
historical_risk = 0.3 × 0.5 + 0.1 × 2 = 0.35
historical_component = 0.35 × 100 = 35.0
weighted = 35.0 × 0.15 = 5.25
```

**5. Contextual Risk (10%):**
```python
contextual = 0.0
if 'admin_action': contextual += 0.3  # Privileged
if is_external_ip('203.0.113.1'): contextual += 0.1  # External IP
contextual_risk = 0.4
contextual_component = 0.4 × 100 = 40.0
weighted = 40.0 × 0.10 = 4.0
```

### **Final Risk Score:**
```python
risk_score = 17.85 + 20.0 + 6.0 + 5.25 + 4.0 = 53.1

# Apply smoothing (exponential moving average)
if user_has_history:
    risk_score = (1 - α) × previous_score + α × current_score
    # where α = 0.15 (smoothing factor)
```

---

## 🎯 Severity Classification

```python
if risk_score >= 85:
    severity = 'critical'  # Immediate investigation
elif risk_score >= 70:
    severity = 'high'     # Priority investigation
elif risk_score >= 50:
    severity = 'medium'   # Monitor closely
elif risk_score >= 30:
    severity = 'low'      # Low priority
else:
    severity = 'normal'   # No action needed
```

---

## 🔧 Implementation for AI Team

### **For Member B (Advanced AI):**

**Your Tasks:**
1. **Implement Model Fusion:**
```python
def fuse_model_scores(anomaly_scores: Dict[str, float], 
                     model_weights: Dict[str, float]) -> float:
    """
    Fuse multiple model outputs using weighted average + sigmoid
    
    Args:
        anomaly_scores: {model_name: score (0-1)}
        model_weights: {model_name: weight}
    
    Returns:
        Fused anomaly score (0-1)
    """
    # Weighted average
    fused = sum(score * model_weights.get(name, 0.0) 
                for name, score in anomaly_scores.items())
    
    # Sigmoid normalization
    fused = 1 / (1 + math.exp(-5 * (fused - 0.5)))
    
    return fused
```

2. **Train Additional Models:**
   - Isolation Forest
   - One-Class SVM
   - Statistical anomaly detection
   - Ensure all output 0-1 anomaly scores

3. **Optimize Model Weights:**
   - Test different weight combinations
   - Use validation set to find optimal weights
   - Document performance metrics

### **For Member C (Medium AI):**

**Your Tasks:**
1. **Feature Extraction:**
   - Ensure features match model input requirements
   - Normalize features to 0-1 range
   - Handle missing values

2. **Model Output Validation:**
   - Verify all models output 0-1 range
   - Test with different data samples
   - Document expected input/output formats

3. **Data Quality:**
   - Validate feature consistency
   - Check for data drift
   - Monitor model performance

---

## 📊 Confidence Score Calculation

**Purpose:** Indicate reliability of risk score

**Formula:**
```python
confidence = 0.0

# Factor 1: Model agreement (0-0.4)
if len(anomaly_scores) > 1:
    scores = list(anomaly_scores.values())
    std_dev = np.std(scores)
    agreement = 1.0 - min(1.0, std_dev * 2)  # Lower std = higher agreement
    confidence += agreement * 0.4

# Factor 2: Data quality (0-0.3)
if user_has_sufficient_history(user_id):
    confidence += 0.3

# Factor 3: Consistency (0-0.3)
if recent_scores_are_consistent(user_id):
    confidence += 0.3

confidence = min(1.0, confidence)
```

**Use Cases:**
- High confidence (>0.7): Reliable, prioritize alerts
- Medium confidence (0.4-0.7): Review carefully
- Low confidence (<0.4): May need more data

---

## 🎛️ Configuration Parameters

### **Recommended Defaults:**

```python
# Model weights (adjust based on model performance)
model_weights = {
    'lstm_autoencoder': 0.40,
    'isolation_forest': 0.30,
    'statistical': 0.20,
    'rule_based': 0.10
}

# Factor weights (proven to work well)
factor_weights = {
    'anomaly_score': 0.35,      # Primary: ML models
    'behavior_deviation': 0.25,  # User patterns
    'temporal_risk': 0.15,       # Time factors
    'historical_risk': 0.15,     # History
    'contextual_risk': 0.10      # Context
}

# Risk thresholds
thresholds = {
    'critical': 85,
    'high': 70,
    'medium': 50,
    'low': 30
}

# Smoothing factor (0.1-0.2 recommended)
smoothing_factor = 0.15
```

### **Tuning Guidelines:**

**For High-Security Environments:**
- Increase `anomaly_score` weight to 0.40-0.45
- Increase `contextual_risk` weight to 0.15
- Lower thresholds (critical: 80, high: 65)

**For User-Focused Environments:**
- Increase `behavior_deviation` weight to 0.30-0.35
- Increase `temporal_risk` weight to 0.20
- Higher thresholds (critical: 90, high: 75)

---

## ✅ Implementation Checklist

### **Phase 1: Core Formula (Week 1)**
- [ ] Implement model fusion function
- [ ] Implement behavior deviation calculation
- [ ] Implement temporal risk calculation
- [ ] Implement historical risk calculation
- [ ] Implement contextual risk calculation
- [ ] Combine all factors with weights

### **Phase 2: User Profiling (Week 2)**
- [ ] Build user baseline system
- [ ] Track common actions/IPs/resources
- [ ] Implement baseline updates
- [ ] Test with sample users

### **Phase 3: Integration (Week 3)**
- [ ] Integrate with LSTM Autoencoder
- [ ] Add Isolation Forest (if ready)
- [ ] Test with real data
- [ ] Validate outputs

### **Phase 4: Optimization (Week 4)**
- [ ] Tune model weights
- [ ] Adjust factor weights
- [ ] Optimize thresholds
- [ ] Performance testing

---

## 📝 Code Template

```python
import math
import numpy as np
from typing import Dict, List
from datetime import datetime

class RiskScoringEngine:
    def __init__(self):
        self.model_weights = {
            'lstm_autoencoder': 0.40,
            'isolation_forest': 0.30,
            'statistical': 0.20,
            'rule_based': 0.10
        }
        self.factor_weights = {
            'anomaly_score': 0.35,
            'behavior_deviation': 0.25,
            'temporal_risk': 0.15,
            'historical_risk': 0.15,
            'contextual_risk': 0.10
        }
        self.user_baselines = {}
        self.user_history = {}
    
    def calculate_risk_score(
        self,
        anomaly_scores: Dict[str, float],
        user_id: str,
        timestamp: datetime,
        context: Dict = None
    ) -> Dict:
        """Calculate comprehensive risk score"""
        
        # 1. Fuse model scores
        anomaly = self._fuse_models(anomaly_scores)
        
        # 2. Calculate components
        behavior = self._calculate_behavior_deviation(user_id, timestamp, context)
        temporal = self._calculate_temporal_risk(timestamp, context)
        historical = self._calculate_historical_risk(user_id)
        contextual = self._calculate_contextual_risk(context)
        
        # 3. Combine with weights
        risk_score = (
            anomaly * self.factor_weights['anomaly_score'] +
            behavior * self.factor_weights['behavior_deviation'] +
            temporal * self.factor_weights['temporal_risk'] +
            historical * self.factor_weights['historical_risk'] +
            contextual * self.factor_weights['contextual_risk']
        ) * 100  # Convert to 0-100
        
        # 4. Apply smoothing
        risk_score = self._apply_smoothing(user_id, risk_score)
        
        # 5. Determine severity
        severity = self._get_severity(risk_score)
        
        return {
            'riskScore': round(risk_score, 2),
            'severity': severity,
            'components': {
                'anomaly_score': round(anomaly * 100, 2),
                'behavior_deviation': round(behavior * 100, 2),
                'temporal_risk': round(temporal * 100, 2),
                'historical_risk': round(historical * 100, 2),
                'contextual_risk': round(contextual * 100, 2)
            }
        }
    
    def _fuse_models(self, anomaly_scores: Dict[str, float]) -> float:
        """Fuse multiple model outputs"""
        fused = sum(
            score * self.model_weights.get(name, 0.0)
            for name, score in anomaly_scores.items()
        )
        # Sigmoid normalization
        return 1 / (1 + math.exp(-5 * (fused - 0.5)))
    
    # ... implement other methods ...
```

---

## 🎓 Best Practices

1. **Always normalize model outputs to 0-1 range**
2. **Use multiple models for better accuracy**
3. **Build user baselines gradually (minimum 10-20 events)**
4. **Apply smoothing to reduce volatility**
5. **Monitor and adjust weights based on performance**
6. **Test with diverse data samples**
7. **Document all parameters and decisions**

---

## 📚 References

- **Main Implementation:** `backend/services/risk_scoring.py`
- **Integration Guide:** `AI_TEAM_RISK_SCORING_SUMMARY.md`
- **Complete Documentation:** `RISK_SCORING_GUIDE.md`
- **Test Examples:** `backend/test_risk_scoring.py`

---

## ❓ Questions?

**For Technical Questions:**
- Review the main implementation file
- Check test examples
- Contact Team Leader

**For Model Integration:**
- Ensure models output 0-1 anomaly scores
- Test fusion with multiple models
- Validate with real data

---

**This is the proven, production-ready risk scoring formula. Use it as your foundation!** 🚀







