# Risk Scoring Engine Guide
## Comprehensive Risk Calculation for S-UEBA

---

## 🎯 Overview

The Risk Scoring Engine is an advanced system that calculates comprehensive risk scores by combining multiple signals:

1. **Model Anomaly Scores** - ML model outputs (LSTM, Isolation Forest, etc.)
2. **Behavior Deviation** - How much current behavior differs from user baseline
3. **Temporal Risk** - Time-based factors (off-hours, weekends, holidays)
4. **Historical Risk** - User's recent risk history and trends
5. **Contextual Risk** - Context factors (IP, action type, resource sensitivity)

**Final Risk Score Range:** 0-100

---

## 🚀 Quick Start

### Basic Usage

```python
from services.risk_scoring import RiskScoringEngine
from datetime import datetime

# Initialize engine
risk_engine = RiskScoringEngine()

# Calculate risk score
result = risk_engine.calculate_risk_score(
    anomaly_scores={
        'lstm_autoencoder': 0.75,  # Model output (0-1)
        'isolation_forest': 0.68   # Optional: additional models
    },
    user_id='john.doe@company.com',
    timestamp=datetime.now(),
    context={
        'action': 'admin_action',
        'source_ip': '192.168.1.100',
        'resource': '/api/admin/users',
        'status': 'success'
    }
)

print(f"Risk Score: {result['riskScore']}")  # 0-100
print(f"Severity: {result['severity']}")     # critical/high/medium/low/normal
print(f"Confidence: {result['confidence']}")  # 0-1
print(f"Risk Factors: {result['riskFactors']}")
```

### API Usage

```bash
# Calculate risk score
curl -X POST http://localhost:5000/api/risk/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "anomalyScores": {
      "lstm_autoencoder": 0.75
    },
    "userId": "john.doe@company.com",
    "timestamp": "2024-01-15T14:30:00",
    "context": {
      "action": "admin_action",
      "source_ip": "192.168.1.100",
      "resource": "/api/admin/users",
      "status": "success"
    }
  }'
```

**Response:**
```json
{
  "riskScore": 78.5,
  "severity": "high",
  "confidence": 0.85,
  "components": {
    "anomaly_score": 75.0,
    "behavior_deviation": 65.0,
    "temporal_risk": 30.0,
    "historical_risk": 20.0,
    "contextual_risk": 45.0
  },
  "riskFactors": [
    "High anomaly detection score",
    "Unusual behavior pattern",
    "Privileged action"
  ],
  "timestamp": "2024-01-15T14:30:00"
}
```

---

## 📊 Risk Score Components

### 1. Anomaly Score (35% weight)
- **Source:** ML model outputs (LSTM Autoencoder, Isolation Forest, etc.)
- **Range:** 0-100 (converted from 0-1 model outputs)
- **Calculation:** Weighted fusion of multiple model scores

### 2. Behavior Deviation (25% weight)
- **Source:** Comparison with user's baseline behavior
- **Factors:**
  - Off-hours activity
  - Unusual action types
  - New/unusual IP addresses
  - Unusual resource access
  - Activity spikes

### 3. Temporal Risk (15% weight)
- **Source:** Time-based patterns
- **Factors:**
  - Off-hours (before 8 AM, after 6 PM)
  - Weekend activity
  - Holiday activity
  - Rapid successive actions

### 4. Historical Risk (15% weight)
- **Source:** User's recent risk history
- **Factors:**
  - Average risk score over last 24 hours
  - Risk trend (increasing/decreasing)
  - Recent high-risk events

### 5. Contextual Risk (10% weight)
- **Source:** Context of the current event
- **Factors:**
  - Failed authentication
  - Admin/privileged actions
  - Sensitive resource access
  - External IP addresses
  - Large data transfers

---

## 🎚️ Risk Severity Levels

| Severity | Score Range | Description |
|----------|-------------|-------------|
| **Critical** | 85-100 | Immediate investigation required |
| **High** | 70-84 | Priority investigation |
| **Medium** | 50-69 | Monitor closely |
| **Low** | 30-49 | Low priority review |
| **Normal** | 0-29 | No action needed |

---

## ⚙️ Configuration

### Model Weights

Control how different models contribute to the final score:

```python
risk_engine.update_model_weights({
    'lstm_autoencoder': 0.40,
    'isolation_forest': 0.30,
    'statistical': 0.20,
    'rule_based': 0.10
})
```

### Risk Thresholds

Adjust severity thresholds:

```python
risk_engine.update_thresholds({
    'critical': 85,
    'high': 70,
    'medium': 50,
    'low': 30
})
```

### Factor Weights

Modify component weights (must sum to ~1.0):

```python
# Access internal weights (advanced)
risk_engine.factor_weights = {
    'anomaly_score': 0.40,      # Increase ML model importance
    'behavior_deviation': 0.25,
    'temporal_risk': 0.15,
    'historical_risk': 0.10,    # Decrease historical importance
    'contextual_risk': 0.10
}
```

### Score Smoothing

Adjust smoothing factor to reduce volatility:

```python
# Lower = more responsive, Higher = more stable
risk_engine.smoothing_factor = 0.15  # Default: 0.15
```

---

## 📈 User Risk Score

Get overall risk score for a user based on recent activity:

```python
# Calculate user's overall risk
user_risk = risk_engine.calculate_user_risk_score('john.doe@company.com')

print(f"User Risk Score: {user_risk['riskScore']}")
print(f"Risk Trend: {user_risk['riskTrend']}")  # Positive = increasing
print(f"Severity: {user_risk['severity']}")
print(f"Recent Activity: {user_risk['recentActivity']} events")
```

**API:**
```bash
curl http://localhost:5000/api/risk/user/john.doe@company.com
```

---

## 🔍 Risk Factors

The engine automatically identifies risk factors:

- **High anomaly detection score** - ML models detected anomaly
- **Unusual behavior pattern** - Behavior deviates from baseline
- **Off-hours or unusual timing** - Activity at unusual times
- **Failed authentication** - Authentication failures
- **Privileged action** - Admin or sensitive operations
- **Unusual IP** - Access from new/unusual IP address
- **Unusual resource** - Access to resources not in baseline
- **Multiple model agreement** - Multiple models agree on high risk

---

## 💡 Best Practices

### 1. Use Multiple Models
Combine outputs from multiple models for better accuracy:
```python
anomaly_scores = {
    'lstm_autoencoder': 0.75,
    'isolation_forest': 0.68,
    'statistical': 0.55
}
```

### 2. Provide Rich Context
More context = better risk assessment:
```python
context = {
    'action': 'admin_action',
    'source_ip': '192.168.1.100',
    'resource': '/api/admin/users',
    'status': 'success',
    'data_size': 1024,  # Optional
    'location': 'US'     # Optional
}
```

### 3. Monitor User Baselines
The engine automatically builds user baselines. For new users, scores may be lower initially until baseline is established.

### 4. Adjust Weights Based on Environment
- **High-security environment:** Increase `anomaly_score` and `contextual_risk` weights
- **User-focused environment:** Increase `behavior_deviation` weight
- **Time-sensitive:** Increase `temporal_risk` weight

### 5. Use Confidence Scores
High confidence scores indicate reliable risk assessments. Low confidence may indicate:
- Insufficient historical data
- Conflicting model outputs
- New user patterns

---

## 🔧 Integration Examples

### With CSV Processing

The CSV processor automatically uses the risk scoring engine:

```python
from services.csv_processor import CSVProcessorService

processor = CSVProcessorService()
result = await processor.process_file(csv_content)

# Each processed row includes risk score
for row in result['rows']:
    print(f"Risk Score: {row['riskScore']}")
    print(f"Severity: {row['riskSeverity']}")
    print(f"Factors: {row['riskFactors']}")
```

### With Model Inference

```python
from services.model_inference import ModelInferenceService
from services.risk_scoring import RiskScoringEngine

model_service = ModelInferenceService()
risk_engine = RiskScoringEngine()

# Get model prediction
prediction = await model_service.predict(features)

# Calculate risk score
risk_result = risk_engine.calculate_risk_score(
    anomaly_scores={'lstm_autoencoder': prediction['anomalyScore']},
    user_id='user@company.com',
    timestamp=datetime.now(),
    context={'action': 'login', 'status': 'success'}
)
```

---

## 📊 Example Output

```python
{
    "riskScore": 78.5,
    "severity": "high",
    "confidence": 0.85,
    "components": {
        "anomaly_score": 75.0,        # From ML models
        "behavior_deviation": 65.0,    # Unusual behavior
        "temporal_risk": 30.0,         # Off-hours activity
        "historical_risk": 20.0,      # Recent history
        "contextual_risk": 45.0        # Admin action
    },
    "riskFactors": [
        "High anomaly detection score",
        "Unusual behavior pattern",
        "Privileged action",
        "Off-hours or unusual timing"
    ],
    "timestamp": "2024-01-15T14:30:00"
}
```

---

## 🎯 Performance Considerations

- **In-memory storage:** User baselines and history stored in memory (use DB in production)
- **Sliding window:** History limited to 1000 entries per user
- **Baseline limits:** Common actions/IPs/resources limited to prevent memory growth
- **Smoothing:** Exponential moving average reduces volatility

---

## 🔐 Security Notes

- Risk scores are calculated server-side
- User baselines are built automatically (no PII stored)
- Historical data can be purged based on retention policy
- All scores are normalized to 0-100 range

---

## 📝 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/risk/calculate` | POST | Calculate risk score for an event |
| `/api/risk/user/{user_id}` | GET | Get overall user risk score |
| `/api/risk/settings/thresholds` | POST | Update risk thresholds |
| `/api/risk/settings/model-weights` | POST | Update model weights |

---

## 🐛 Troubleshooting

### Low Risk Scores for Obvious Threats
- **Check model weights:** Ensure models are properly weighted
- **Verify context:** Make sure context includes all relevant information
- **Check thresholds:** Thresholds may be too high

### High False Positives
- **Increase smoothing:** Reduce `smoothing_factor`
- **Adjust thresholds:** Increase severity thresholds
- **Review weights:** Reduce weight of noisy components

### Inconsistent Scores
- **Check user baseline:** New users may have unstable baselines
- **Review historical data:** Insufficient history affects accuracy
- **Verify model outputs:** Ensure models are producing consistent outputs

---

**For more information, see the main project documentation or contact the team leader.**

