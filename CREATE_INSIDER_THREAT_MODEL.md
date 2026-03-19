# Create Insider Threat Detection Model

This guide will help you create and integrate an insider threat detection AI model into your S-UEBA system.

## Quick Start

### Step 1: Train the Model

Run the quick training script to create the insider threat model:

```bash
cd backend-fastapi
python quick_train_insider_model.py
```

This will:
- Create synthetic training data (normal behavior + anomalies)
- Train an LSTM Autoencoder model
- Save the model as `insider_threat_model.h5`
- Take approximately 5-15 minutes

### Step 2: Verify Model Created

Check that the model file exists:

```bash
ls -lh insider_threat_model.h5
```

### Step 3: Upload Model to System

You can upload the model via the UI:

1. Go to the **Models** page
2. Click **"Upload Model"**
3. Select `backend-fastapi/insider_threat_model.h5`
4. Fill in details:
   - **Name**: Insider Threat Detector
   - **Type**: Insider Threat
   - **Framework**: TensorFlow (.h5)
   - **Description**: Detects brute force attacks, location hopping, and suspicious patterns

### Step 4: Enable the Model

After uploading, enable the model by toggling it on in the Models page. The model will then be used in ensemble predictions.

## What the Model Detects

The insider threat model detects:

1. **Brute Force Attacks** - Multiple failed login attempts
2. **Location Hopping** - Rapid IP address changes
3. **Off-Hours Access** - Unusual access patterns outside business hours
4. **Suspicious Activity Velocity** - Unusually high action rates
5. **External IP Access** - Access from external IPs to sensitive resources

## Model Architecture

- **Type**: LSTM Autoencoder
- **Input**: 7 timesteps × 20 features
- **Features**: 
  - Action type, status, temporal patterns
  - IP and location information
  - User behavior metrics (failed attempts, login frequency, IP changes)
  - Resource sensitivity and access patterns

## API Usage

### Direct API Call (Insider Threat Endpoint)

```python
import requests

events = [
    {
        'user_id': 'user@company.com',
        'timestamp': '2024-01-15T10:00:00',
        'action': 'login',
        'source_ip': '192.168.1.100',
        'resource': '/login',
        'status': 'failed'
    },
    # ... more events (at least 7)
]

response = requests.post('http://localhost:5000/predict-insider-threat', json={
    'events': events
})

result = response.json()
print(f"Anomaly: {result['isAnomaly']}")
print(f"Threat Type: {result['threatType']}")
print(f"Risk Factors: {result['riskFactors']}")
```

### Standard Prediction Endpoint

The model can also be used via the standard `/predict` endpoint when uploaded to the system.

## Integration with Logstash

The model will automatically be used when processing logs through Logstash if:
1. It's uploaded to the system
2. It's enabled (toggled on)
3. It's selected for ensemble prediction

## Customization

To customize the model:

1. **Modify features**: Edit `insider_threat_detector.py` → `extract_features()` method
2. **Adjust architecture**: Edit `insider_threat_detector.py` → `build_insider_threat_model()` function
3. **Retrain**: Run `quick_train_insider_model.py` again

## Troubleshooting

### Model not found
- Ensure you've run the training script
- Check that `insider_threat_model.h5` exists in `backend-fastapi/` directory

### Training fails
- Check that TensorFlow is installed: `pip install tensorflow`
- Ensure you have enough memory (model training requires ~2GB RAM)

### Predictions not working
- Verify FastAPI is running: `python backend-fastapi/main.py`
- Check that model file is accessible
- Review FastAPI logs for errors

## Files Created

- `backend-fastapi/insider_threat_model.h5` - Trained model file
- `backend-fastapi/insider_threat_detector.py` - Feature extraction and model building code
- `backend-fastapi/quick_train_insider_model.py` - Training script

## Next Steps

1. ✅ Train the model
2. ✅ Upload to system
3. ✅ Enable the model
4. ✅ Test with real data
5. ✅ Monitor performance
6. ✅ Retrain periodically with new data

---

**Your insider threat detection model is now ready!** 🚀

