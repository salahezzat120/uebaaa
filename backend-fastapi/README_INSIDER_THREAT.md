# Insider Threat Detection Model

## Quick Start

To create and train the insider threat detection model:

### Option 1: Quick Training (Recommended)

```bash
cd backend-fastapi
python quick_train_insider_model.py
```

This will:
- Create synthetic training data with normal and anomalous patterns
- Train an LSTM Autoencoder model
- Save the model as `insider_threat_model.h5`
- Take approximately 5-15 minutes

### Option 2: Use Existing Training Script

```bash
cd backend-fastapi
python train_insider_threat_model.py
```

## What It Detects

The model detects:

1. **Brute Force Attacks** - Multiple failed login attempts
2. **Location Hopping** - Rapid IP address changes
3. **Off-Hours Access** - Unusual access patterns outside business hours
4. **Suspicious Activity Velocity** - Unusually high action rates
5. **External IP Access** - Access from external IPs to sensitive resources

## Model Details

- **Architecture**: LSTM Autoencoder
- **Input Shape**: [batch, 7 timesteps, 20 features]
- **Features**: 20 features including action types, IP/location data, user behavior metrics, and resource access patterns

## Integration

After training, the model can be:

1. **Uploaded via UI**: Go to Models page → Upload Model → Select `insider_threat_model.h5`
2. **Used in FastAPI**: The model is automatically available via `/predict-insider-threat` endpoint
3. **Enabled for Ensemble**: Toggle it on in the Models page to use in ensemble predictions

## API Endpoint

The model exposes a dedicated endpoint:

```
POST /predict-insider-threat
```

Request body:
```json
{
  "events": [
    {
      "user_id": "user@company.com",
      "timestamp": "2024-01-15T10:00:00",
      "action": "login",
      "source_ip": "192.168.1.100",
      "resource": "/login",
      "status": "failed"
    }
    // ... at least 7 events
  ]
}
```

Response:
```json
{
  "isAnomaly": true,
  "anomalyScore": 0.85,
  "threatType": "brute_force",
  "riskFactors": ["Brute force attack detected (8 failed attempts)"],
  "reconstructionError": 0.12,
  "featureScores": {
    "failed_attempts": 0.8,
    "unique_ips": 0.2,
    "action_velocity": 0.1,
    "off_hours": 0.0,
    "external_ip": 0.0
  }
}
```

## Files

- `insider_threat_detector.py` - Feature extraction and model building code
- `quick_train_insider_model.py` - Quick training script with synthetic data
- `train_insider_threat_model.py` - Full training script (can use real data)
- `test_insider_detection.py` - Test script

## Next Steps

1. Run the training script
2. Upload the model via the UI
3. Enable it in the Models page
4. Test with real data
5. Monitor performance and retrain as needed

---

For more details, see `CREATE_INSIDER_THREAT_MODEL.md` in the project root.

