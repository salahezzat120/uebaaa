# Risk Scoring System - Quick Reference for AI Team

## 🎯 What It Does
Transforms your ML model anomaly scores (0-1) into comprehensive risk scores (0-100) by combining multiple factors.

---

## 🔌 How to Use

### Current Integration (Already Done)
✅ LSTM Autoencoder is **already integrated** - risk scores calculated automatically

### Adding New Models

```python
from services.risk_scoring import RiskScoringEngine

risk_engine = RiskScoringEngine()

# Your model outputs anomaly score (0-1)
lstm_score = 0.75
isolation_score = 0.68

# Pass to risk engine
result = risk_engine.calculate_risk_score(
    anomaly_scores={
        'lstm_autoencoder': lstm_score,
        'isolation_forest': isolation_score  # Add your model here
    },
    user_id='user@company.com',
    timestamp=datetime.now(),
    context={'action': 'login', 'status': 'success'}
)

# Get risk score (0-100)
print(result['riskScore'])  # 78.5
print(result['severity'])   # 'high'
```

---

## 📊 Model Requirements

**Output Format:**
- Anomaly score: `float` in range `0.0` to `1.0`
- `0.0` = Normal, `1.0` = Highly anomalous

**Example:**
```python
{
    "anomalyScore": 0.75,  # Required: 0-1 range
    "isAnomaly": True,     # Optional
    "confidence": 0.85     # Optional
}
```

---

## 🎓 Team Member Tasks

### Member B (Advanced AI)
- [ ] Train Isolation Forest model
- [ ] Add model to risk scoring engine
- [ ] Optimize model weights for fusion
- [ ] Evaluate model combinations

### Member C (Medium AI)
- [ ] Verify feature extraction (11 features)
- [ ] Test model outputs (0-1 range)
- [ ] Validate preprocessing pipeline
- [ ] Test with different data samples

---

## 🔧 Key Features

| Feature | Description |
|---------|-------------|
| **Multi-Model Fusion** | Combines multiple model outputs with weights |
| **User Profiling** | Automatically learns user behavior patterns |
| **Confidence Scoring** | Indicates reliability of risk assessment |
| **Risk Factors** | Identifies why score is high |

---

## 📈 Risk Score Output

```python
{
    "riskScore": 78.5,        # 0-100
    "severity": "high",       # critical/high/medium/low/normal
    "confidence": 0.85,        # 0-1
    "components": {           # Breakdown
        "anomaly_score": 75.0,
        "behavior_deviation": 65.0,
        "temporal_risk": 30.0,
        "historical_risk": 20.0,
        "contextual_risk": 45.0
    },
    "riskFactors": [          # Why it's risky
        "High anomaly detection score",
        "Unusual behavior pattern"
    ]
}
```

---

## 🚀 API Endpoints

```bash
# Calculate risk score
POST /api/risk/calculate
{
  "anomalyScores": {"lstm_autoencoder": 0.75},
  "userId": "user@company.com",
  "context": {"action": "login"}
}

# Update model weights
POST /api/risk/settings/model-weights
{
  "lstm_autoencoder": 0.40,
  "isolation_forest": 0.30
}
```

---

## 📁 Files

- **Engine**: `backend/services/risk_scoring.py`
- **Integration**: `backend/services/csv_processor.py`
- **API**: `backend/api.py`
- **Full Docs**: `RISK_SCORING_GUIDE.md`
- **Test**: `backend/test_risk_scoring.py`

---

## ✅ Status

- ✅ Risk scoring engine: **Ready**
- ✅ LSTM integration: **Complete**
- ✅ API endpoints: **Available**
- ⏳ Additional models: **Your task**

---

**Questions?** See `AI_TEAM_RISK_SCORING_SUMMARY.md` for detailed guide.

