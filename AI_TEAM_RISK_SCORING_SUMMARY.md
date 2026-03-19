# Risk Scoring System - Summary for AI Team
## Technical Overview & Integration Guide

**Date:** [Current Date]  
**For:** AI Team Members (Member B - Advanced, Member C - Medium)  
**Purpose:** Understand and integrate with the new risk scoring engine

---

## 🎯 What Was Built

A **comprehensive risk scoring engine** that transforms raw ML model outputs (anomaly scores) into actionable risk scores (0-100) by combining multiple signals.

---

## 📊 System Architecture

```
ML Models → Risk Scoring Engine → Risk Score (0-100)
   ↓              ↓                    ↓
LSTM AE      Multi-Factor         Severity Level
Isolation    Calculation          + Confidence
Forest       + Fusion             + Risk Factors
Statistical  + Context
```

---

## 🔧 How It Works

### Input: Model Anomaly Scores
Your ML models output anomaly scores (0-1 range):
- **LSTM Autoencoder**: `0.75` (reconstruction error-based)
- **Isolation Forest**: `0.68` (if implemented)
- **Statistical Models**: `0.55` (if implemented)

### Processing: Multi-Factor Calculation
The engine combines **5 weighted factors**:

| Factor | Weight | Source | Description |
|--------|--------|--------|-------------|
| **Anomaly Score** | 35% | Your ML models | Primary signal from models |
| **Behavior Deviation** | 25% | User baseline | How much behavior differs from normal |
| **Temporal Risk** | 15% | Time patterns | Off-hours, weekends, holidays |
| **Historical Risk** | 15% | User history | Recent risk trends |
| **Contextual Risk** | 10% | Event context | IP, action type, resource sensitivity |

### Output: Comprehensive Risk Score
```python
{
    "riskScore": 78.5,           # 0-100
    "severity": "high",           # critical/high/medium/low/normal
    "confidence": 0.85,            # 0-1 (model agreement, data quality)
    "components": {                # Breakdown of each factor
        "anomaly_score": 75.0,
        "behavior_deviation": 65.0,
        "temporal_risk": 30.0,
        "historical_risk": 20.0,
        "contextual_risk": 45.0
    },
    "riskFactors": [              # Why it's risky
        "High anomaly detection score",
        "Unusual behavior pattern",
        "Privileged action"
    ]
}
```

---

## 🔌 Integration with Your Models

### Current Integration (LSTM Autoencoder)

The system is **already integrated** with your LSTM Autoencoder:

```python
# In csv_processor.py - automatically calculates risk scores
prediction = await model_service.predict(sequence)  # Your model

# Risk scoring happens automatically
risk_result = risk_engine.calculate_risk_score(
    anomaly_scores={'lstm_autoencoder': prediction['anomalyScore']},
    user_id=user_id,
    timestamp=timestamp,
    context={'action': action, 'source_ip': ip, ...}
)
```

### Adding New Models (Member B - Advanced)

To add **Isolation Forest** or other models:

**Step 1:** Train/load your model
```python
from sklearn.ensemble import IsolationForest

# Your model training code
isolation_model = IsolationForest(contamination=0.1)
isolation_model.fit(training_data)
```

**Step 2:** Get anomaly score (0-1 range)
```python
# Get prediction (-1 for anomaly, 1 for normal)
prediction = isolation_model.predict(features)
anomaly_score = (1 - prediction[0]) / 2  # Convert to 0-1
```

**Step 3:** Pass to risk scoring engine
```python
from services.risk_scoring import RiskScoringEngine

risk_engine = RiskScoringEngine()

# Combine multiple models
result = risk_engine.calculate_risk_score(
    anomaly_scores={
        'lstm_autoencoder': lstm_score,      # 0.75
        'isolation_forest': isolation_score, # 0.68
        'statistical': statistical_score      # 0.55
    },
    user_id='user@company.com',
    timestamp=datetime.now(),
    context={'action': 'login', ...}
)
```

**Step 4:** Update model weights (optional)
```python
# Adjust how much each model contributes
risk_engine.update_model_weights({
    'lstm_autoencoder': 0.40,    # 40% weight
    'isolation_forest': 0.30,    # 30% weight
    'statistical': 0.20,         # 20% weight
    'rule_based': 0.10           # 10% weight
})
```

---

## 📈 Model Fusion Algorithm

The engine uses **weighted average with sigmoid normalization**:

```python
# 1. Weighted average of model scores
fused_score = sum(score * weight for score, weight in models.items())

# 2. Sigmoid normalization (handles extreme values)
fused_score = 1 / (1 + exp(-5 * (fused_score - 0.5)))
```

**Benefits:**
- ✅ Multiple models improve accuracy
- ✅ Handles model disagreement gracefully
- ✅ Configurable weights based on model performance

---

## 🎓 For Member B (Advanced AI)

### Your Responsibilities

1. **Train Additional Models**
   - Isolation Forest
   - One-Class SVM
   - Statistical anomaly detection
   - Any other models you develop

2. **Model Evaluation**
   - Evaluate each model's performance
   - Recommend optimal weights for fusion
   - Test model combinations

3. **Model Fusion Logic** (Optional Enhancement)
   - Current: Weighted average
   - Future: ML-based fusion (train a meta-model to combine outputs)

### Example: Adding Isolation Forest

```python
# In your model training script
from sklearn.ensemble import IsolationForest
import numpy as np

# Train model
model = IsolationForest(contamination=0.1, random_state=42)
model.fit(X_train)

# Inference function
def predict_isolation_forest(features):
    prediction = model.predict(features.reshape(1, -1))
    # Convert -1/1 to 0-1 range
    anomaly_score = (1 - prediction[0]) / 2
    return anomaly_score

# Integration with risk engine
anomaly_scores = {
    'lstm_autoencoder': lstm_predict(features),
    'isolation_forest': predict_isolation_forest(features)
}
```

---

## 🎓 For Member C (Medium AI)

### Your Responsibilities

1. **Feature Engineering**
   - Ensure features match model input requirements
   - Extract features from raw logs
   - Normalize/preprocess data

2. **Model Testing**
   - Test models with different data samples
   - Validate feature extraction
   - Check model outputs are in 0-1 range

3. **Data Quality**
   - Ensure consistent feature format
   - Handle missing values
   - Validate data before model inference

### Example: Feature Extraction

```python
# Your feature extraction (already in csv_processor.py)
def extract_features(row):
    features = [
        action_type,      # 0-5
        status,           # 0-1
        ip_normalized,    # 0-1
        hour_normalized, # 0-1
        # ... 11 features total
    ]
    return features

# Ensure features are in correct format for risk scoring
features = extract_features(row)
prediction = model.predict(features)
risk_score = risk_engine.calculate_risk_score(
    anomaly_scores={'lstm_autoencoder': prediction['anomalyScore']},
    user_id=row['user_id'],
    timestamp=parse_timestamp(row['timestamp']),
    context={
        'action': row['action'],
        'source_ip': row['source_ip'],
        'resource': row['resource'],
        'status': row['status']
    }
)
```

---

## 🔬 Model Output Requirements

### Required Format

Your models should output:
- **Anomaly Score**: `float` in range `0.0` to `1.0`
  - `0.0` = Normal behavior
  - `1.0` = Highly anomalous
- **Optional**: `isAnomaly` (boolean), `confidence` (float)

### Current Model (LSTM Autoencoder)

✅ **Already compatible** - outputs:
```python
{
    "anomalyScore": 0.75,      # 0-1 range ✓
    "isAnomaly": True,         # Optional
    "reconstructionError": 0.15,
    "confidence": 0.85
}
```

### New Models Should Follow Same Format

```python
# Example: Isolation Forest wrapper
def predict_with_isolation_forest(features):
    prediction = isolation_model.predict(features)
    # Convert to 0-1 range
    anomaly_score = (1 - prediction[0]) / 2
    
    return {
        "anomalyScore": anomaly_score,
        "isAnomaly": anomaly_score > 0.6,
        "confidence": 0.8  # Model-specific confidence
    }
```

---

## 📊 Risk Score Thresholds

| Score Range | Severity | Meaning |
|------------|----------|---------|
| 85-100 | **Critical** | Immediate threat |
| 70-84 | **High** | Priority investigation |
| 50-69 | **Medium** | Monitor closely |
| 30-49 | **Low** | Low priority |
| 0-29 | **Normal** | No action needed |

**Configurable via API:**
```python
risk_engine.update_thresholds({
    'critical': 85,
    'high': 70,
    'medium': 50,
    'low': 30
})
```

---

## 🚀 API Endpoints

### Calculate Risk Score
```bash
POST /api/risk/calculate
{
  "anomalyScores": {
    "lstm_autoencoder": 0.75,
    "isolation_forest": 0.68
  },
  "userId": "user@company.com",
  "context": {
    "action": "login",
    "source_ip": "192.168.1.100",
    "status": "success"
  }
}
```

### Get User Risk Score
```bash
GET /api/risk/user/{user_id}
```

### Update Model Weights
```bash
POST /api/risk/settings/model-weights
{
  "lstm_autoencoder": 0.40,
  "isolation_forest": 0.30,
  "statistical": 0.20
}
```

---

## 🔍 Key Features for AI Team

### 1. **Multi-Model Fusion**
- Combine outputs from multiple models
- Weighted average with configurable weights
- Handles model disagreement

### 2. **Automatic User Profiling**
- Builds user behavior baselines automatically
- Learns normal patterns over time
- Detects deviations from baseline

### 3. **Confidence Scoring**
- Calculates confidence based on:
  - Model agreement (multiple models agreeing = higher confidence)
  - Data quality (more history = higher confidence)
  - Consistency (consistent signals = higher confidence)

### 4. **Risk Factor Identification**
- Automatically identifies why a score is high
- Helps with model explainability
- Useful for debugging model outputs

---

## 📝 Integration Checklist

### For Member B (Advanced):
- [ ] Train additional models (Isolation Forest, etc.)
- [ ] Ensure models output 0-1 anomaly scores
- [ ] Test model fusion with risk engine
- [ ] Evaluate optimal model weights
- [ ] Document model performance metrics

### For Member C (Medium):
- [ ] Verify feature extraction matches model requirements
- [ ] Test feature normalization
- [ ] Validate model outputs are in correct range
- [ ] Test with different data samples
- [ ] Document feature engineering process

---

## 🎯 Next Steps

1. **Member B**: Add Isolation Forest model
   - Train model on security log data
   - Integrate with risk scoring engine
   - Test fusion with LSTM Autoencoder

2. **Member C**: Feature Engineering
   - Ensure all features are properly extracted
   - Test feature quality
   - Validate preprocessing pipeline

3. **Both**: Model Evaluation
   - Compare model performance
   - Recommend optimal weights
   - Test different model combinations

---

## 📚 Files Reference

- **Risk Scoring Engine**: `backend/services/risk_scoring.py`
- **Integration**: `backend/services/csv_processor.py`
- **API Endpoints**: `backend/api.py` (lines 611-650)
- **Documentation**: `RISK_SCORING_GUIDE.md`
- **Test Script**: `backend/test_risk_scoring.py`

---

## ❓ Questions?

**For Technical Questions:**
- Review `RISK_SCORING_GUIDE.md` for detailed documentation
- Check `backend/test_risk_scoring.py` for usage examples
- Contact Team Leader for integration help

**For Model Integration:**
- Ensure models output 0-1 anomaly scores
- Test with risk scoring engine
- Adjust model weights based on performance

---

## ✅ Summary

**What You Need to Know:**
1. ✅ Risk scoring engine is **ready to use**
2. ✅ **Already integrated** with LSTM Autoencoder
3. ✅ **Easy to add** new models (just pass anomaly scores)
4. ✅ **Configurable** model weights and thresholds
5. ✅ **Automatic** user profiling and behavior analysis

**Your Tasks:**
- **Member B**: Add more models, optimize fusion
- **Member C**: Ensure feature quality, test models

**The system handles everything else automatically!** 🚀

---

*Last Updated: [Current Date]*  
*Contact: Team Leader for questions or integration support*

