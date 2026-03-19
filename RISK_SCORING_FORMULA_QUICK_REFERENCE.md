# Risk Scoring Formula - Quick Reference Card
## For AI Team - One Page Summary

---

## 🎯 The Formula

```
Risk Score = (A×35%) + (B×25%) + (T×15%) + (H×15%) + (C×10%)

Where:
A = Anomaly Score (from ML models)
B = Behavior Deviation (vs user baseline)
T = Temporal Risk (time-based)
H = Historical Risk (user history)
C = Contextual Risk (IP, action, etc.)

All components: 0-1 range → multiplied by 100 → Final: 0-100
```

---

## 📊 Component Calculations

### **1. Anomaly Score (A) - 35%**
```python
# Fuse multiple models
fused = Σ(model_score × weight)
anomaly = sigmoid(fused)  # Optional smoothing
```

**Model Weights:**
- LSTM Autoencoder: 40%
- Isolation Forest: 30%
- Statistical: 20%
- Rule-based: 10%

---

### **2. Behavior Deviation (B) - 25%**
```python
deviation = 0.0
if off_hours: deviation += 0.3
if unusual_action: deviation += 0.25
if new_ip: deviation += 0.25
if unusual_resource: deviation += 0.2
# Cap at 1.0
```

---

### **3. Temporal Risk (T) - 15%**
```python
temporal = 0.0
if hour < 8 or hour > 18: temporal += 0.4
if weekend: temporal += 0.3
if holiday: temporal += 0.2
if burst_activity: temporal += 0.1
# Cap at 1.0
```

---

### **4. Historical Risk (H) - 15%**
```python
historical = 0.0
historical += avg_recent_risk × 0.5
if increasing_trend: historical += trend × 0.3
if high_risk_events: historical += count × 0.2
# Cap at 1.0
```

---

### **5. Contextual Risk (C) - 10%**
```python
contextual = 0.0
if failed_auth: contextual += 0.4
if privileged_action: contextual += 0.3
if sensitive_resource: contextual += 0.2
if external_ip: contextual += 0.1
# Cap at 1.0
```

---

## 🎚️ Severity Levels

| Score | Severity | Action |
|-------|----------|--------|
| 85-100 | **Critical** | Immediate investigation |
| 70-84 | **High** | Priority (1 hour) |
| 50-69 | **Medium** | Review (24 hours) |
| 30-49 | **Low** | Monitor weekly |
| 0-29 | **Normal** | No action |

---

## 💻 Quick Code Example

```python
# Input
anomaly_scores = {'lstm_autoencoder': 0.75}
user_id = 'user@company.com'
timestamp = datetime.now()
context = {'action': 'login', 'status': 'success'}

# Calculate
A = fuse_models(anomaly_scores)           # 0.75 → 75.0
B = behavior_deviation(user_id, context)   # 0.2 → 20.0
T = temporal_risk(timestamp)              # 0.0 → 0.0
H = historical_risk(user_id)              # 0.1 → 10.0
C = contextual_risk(context)             # 0.0 → 0.0

# Final Score
risk_score = (75×0.35) + (20×0.25) + (0×0.15) + (10×0.15) + (0×0.10)
           = 26.25 + 5.0 + 0 + 1.5 + 0
           = 32.75 → "Low" severity
```

---

## ⚙️ Key Parameters

**Factor Weights (Default):**
- Anomaly: 35%
- Behavior: 25%
- Temporal: 15%
- Historical: 15%
- Contextual: 10%

**Model Weights (Default):**
- LSTM: 40%
- Isolation Forest: 30%
- Statistical: 20%
- Rule-based: 10%

**Thresholds:**
- Critical: 85
- High: 70
- Medium: 50
- Low: 30

**Smoothing:** α = 0.15 (exponential moving average)

---

## ✅ Model Output Requirements

**Your models must output:**
- **Anomaly Score:** `float` in range `0.0` to `1.0`
  - `0.0` = Normal
  - `1.0` = Highly anomalous

**Example:**
```python
{
    "anomalyScore": 0.75,  # Required: 0-1 range
    "isAnomaly": True,     # Optional
    "confidence": 0.85      # Optional
}
```

---

## 🔧 Integration Steps

1. **Train/load your models**
2. **Get anomaly score (0-1 range)**
3. **Pass to risk engine:**
   ```python
   result = risk_engine.calculate_risk_score(
       anomaly_scores={'lstm_autoencoder': 0.75},
       user_id='user@company.com',
       timestamp=datetime.now(),
       context={'action': 'login', 'status': 'success'}
   )
   ```
4. **Use risk score:**
   - `result['riskScore']` → 0-100
   - `result['severity']` → critical/high/medium/low/normal
   - `result['confidence']` → 0-1

---

## 📚 Full Documentation

- **Complete Guide:** `AI_TEAM_RISK_SCORING_FORMULA.md`
- **Integration:** `AI_TEAM_RISK_SCORING_SUMMARY.md`
- **Implementation:** `backend/services/risk_scoring.py`

---

**Print this page and keep it handy!** 📌







