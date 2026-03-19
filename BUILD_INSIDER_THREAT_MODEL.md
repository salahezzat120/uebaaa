# Build Insider Threat Model - Step by Step
## Complete Implementation Guide

**Goal:** Build and integrate insider threat detection (brute force, location hopping, etc.) into your S-UEBA system

---

## 🎯 Overview

We'll build this in **4 phases**:
1. **Phase 1:** Update feature extraction (enhance from 11 to 20 features)
2. **Phase 2:** Train new model (or use existing with new features)
3. **Phase 3:** Integrate detection into FastAPI
4. **Phase 4:** Update frontend to show threat types

**Estimated Time:** 2-3 days

---

## 📋 Prerequisites

- ✅ Your existing FastAPI backend running
- ✅ Your model file (`lstm_ae_cert.h5` or similar)
- ✅ Python 3.8+ with TensorFlow installed
- ✅ Your security log CSV files

---

## 🚀 Phase 1: Update Feature Extraction (30 minutes)

### **Step 1.1: Verify Insider Threat Detector is Ready**

The file `backend-fastapi/insider_threat_detector.py` is already created. Verify it exists:

```bash
# Check if file exists
ls backend-fastapi/insider_threat_detector.py
```

### **Step 1.2: Test Feature Extraction**

Create a test script to verify feature extraction works:

```python
# test_feature_extraction.py
import sys
sys.path.append('backend-fastapi')

from insider_threat_detector import InsiderThreatFeatureExtractor
from datetime import datetime

# Initialize extractor
extractor = InsiderThreatFeatureExtractor()

# Test with sample data
test_row = {
    'user_id': 'test_user@company.com',
    'timestamp': datetime.now().isoformat(),
    'action': 'login',
    'source_ip': '192.168.1.100',
    'resource': '/login',
    'status': 'failed'
}

# Extract features
features = extractor.extract_features(test_row)
print(f"✅ Extracted {len(features)} features")
print(f"Features: {features}")

# Test with history (for brute force detection)
extractor.update_history(test_row)
for i in range(5):
    test_row['status'] = 'failed'  # Multiple failed attempts
    extractor.update_history(test_row)
    features = extractor.extract_features(test_row, extractor.get_user_history('test_user@company.com'))
    print(f"Failed attempt {i+1}: Feature 12 (brute force) = {features[12]:.2f}")
```

**Run it:**
```bash
cd backend-fastapi
python test_feature_extraction.py
```

**Expected output:**
```
✅ Extracted 20 features
Features: [0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.75, 0.65, 0.0, 0.39, ...]
Failed attempt 1: Feature 12 (brute force) = 0.10
Failed attempt 2: Feature 12 (brute force) = 0.20
...
```

---

## 🏗️ Phase 2: Train New Model (2-4 hours)

### **Step 2.1: Prepare Training Data**

Create a training script:

```python
# train_insider_threat_model.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sys
sys.path.append('backend-fastapi')

from insider_threat_detector import (
    InsiderThreatFeatureExtractor,
    build_insider_threat_model
)
from tensorflow import keras
from sklearn.model_selection import train_test_split

print("🚀 Starting Insider Threat Model Training...")

# 1. Load your existing data
print("\n📂 Loading data...")
try:
    df = pd.read_csv('public/test-data-sample.csv')  # Or your data file
    print(f"✅ Loaded {len(df)} rows")
except FileNotFoundError:
    print("❌ Data file not found. Using synthetic data...")
    # Create synthetic data
    df = pd.DataFrame({
        'user_id': ['user1@company.com'] * 100,
        'timestamp': [datetime.now() - timedelta(minutes=i) for i in range(100)],
        'action': ['login'] * 100,
        'source_ip': ['192.168.1.100'] * 100,
        'resource': ['/login'] * 100,
        'status': ['success'] * 100
    })

# 2. Add synthetic anomalies (brute force, location hopping)
print("\n🔧 Adding synthetic anomalies...")
anomalies = []

# Brute force attacks (10 failed logins)
for i in range(20):
    anomalies.append({
        'user_id': f'user{i}@company.com',
        'timestamp': datetime.now() - timedelta(minutes=10-i),
        'action': 'login',
        'source_ip': '192.168.1.100',
        'resource': '/login',
        'status': 'failed'
    })

# Location hopping (5 logins from different IPs)
ips = ['203.0.113.1', '198.51.100.2', '192.0.2.3', '203.0.113.4', '198.51.100.5']
for i, ip in enumerate(ips):
    anomalies.append({
        'user_id': 'user_hopper@company.com',
        'timestamp': datetime.now() - timedelta(minutes=60-i*15),
        'action': 'login',
        'source_ip': ip,
        'resource': '/login',
        'status': 'success'
    })

anomaly_df = pd.DataFrame(anomalies)
df = pd.concat([df, anomaly_df], ignore_index=True)
print(f"✅ Added {len(anomalies)} anomaly samples")

# 3. Extract features
print("\n🔍 Extracting features...")
extractor = InsiderThreatFeatureExtractor()
sequences = []

for user_id, user_data in df.groupby('user_id'):
    user_data = user_data.sort_values('timestamp')
    user_events = []
    
    for _, row in user_data.iterrows():
        row_dict = row.to_dict()
        features = extractor.extract_features(row_dict, user_events)
        extractor.update_history(row_dict)
        user_events.append(row_dict)
        
        # Create sequences of 7 timesteps
        if len(user_events) >= 7:
            sequence = []
            for event in user_events[-7:]:
                seq_features = extractor.extract_features(
                    event,
                    user_events[:user_events.index(event)]
                )
                sequence.append(seq_features)
            sequences.append(sequence)

X = np.array(sequences)
print(f"✅ Created {len(X)} sequences")
print(f"   Shape: {X.shape} (samples, timesteps, features)")

# 4. Split data
X_train, X_test = train_test_split(X, test_size=0.2, random_state=42)
print(f"✅ Training: {len(X_train)} samples, Test: {len(X_test)} samples")

# 5. Build model
print("\n🏗️ Building model...")
model = build_insider_threat_model(
    input_timesteps=7,
    input_features=20,
    encoding_dim=64
)
model.summary()

# 6. Train model
print("\n🎓 Training model...")
history = model.fit(
    X_train, X_train,  # Autoencoder: input = target
    validation_data=(X_test, X_test),
    epochs=50,
    batch_size=32,
    callbacks=[
        keras.callbacks.EarlyStopping(
            patience=5,
            restore_best_weights=True,
            monitor='val_loss'
        ),
        keras.callbacks.ModelCheckpoint(
            'insider_threat_model.h5',
            save_best_only=True,
            monitor='val_loss'
        )
    ],
    verbose=1
)

# 7. Evaluate
print("\n📊 Evaluating model...")
train_pred = model.predict(X_train, verbose=0)
train_error = np.mean(np.square(X_train - train_pred), axis=(1, 2))

test_pred = model.predict(X_test, verbose=0)
test_error = np.mean(np.square(X_test - test_pred), axis=(1, 2))

threshold = np.percentile(train_error, 95)
print(f"✅ Training error: {np.mean(train_error):.4f}")
print(f"✅ Test error: {np.mean(test_error):.4f}")
print(f"✅ Recommended threshold: {threshold:.4f}")

# 8. Save model
model.save('insider_threat_model.h5')
print("\n✅ Model saved to: insider_threat_model.h5")
print("🎉 Training complete!")
```

**Run it:**
```bash
cd backend-fastapi
python train_insider_threat_model.py
```

**Expected output:**
```
🚀 Starting Insider Threat Model Training...
📂 Loading data...
✅ Loaded 100 rows
🔧 Adding synthetic anomalies...
✅ Added 25 anomaly samples
🔍 Extracting features...
✅ Created 125 sequences
   Shape: (125, 7, 20)
...
🎉 Training complete!
```

---

## 🔌 Phase 3: Integrate into FastAPI (1 hour)

### **Step 3.1: Update FastAPI Main File**

Update `backend-fastapi/main.py` to include insider threat detection:

```python
# Add at the top of main.py
from insider_threat_detector import (
    InsiderThreatFeatureExtractor,
    detect_insider_threat
)

# After model loading, initialize extractor
insider_extractor = InsiderThreatFeatureExtractor()

# Add new endpoint
@app.post("/api/ai/detect-insider-threat")
async def detect_threat(request: dict):
    """
    Detect insider threats from recent events
    """
    try:
        recent_events = request.get('events', [])
        
        if len(recent_events) < 1:
            raise HTTPException(status_code=400, detail="At least 1 event required")
        
        # Use your existing model or load insider threat model
        # For now, use existing model
        model = load_model()  # Your existing model loader
        
        # Detect threats
        result = detect_insider_threat(
            model,
            insider_extractor,
            recent_events
        )
        
        return {
            'isAnomaly': result['is_anomaly'],
            'anomalyScore': result['anomaly_score'],
            'threatType': result['threat_type'],
            'riskFactors': result['risk_factors'],
            'reconstructionError': result['reconstruction_error'],
            'featureScores': result['feature_scores']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### **Step 3.2: Update Existing Predict Endpoint**

Modify your existing `/predict` endpoint to use enhanced features:

```python
# In your existing predict endpoint
from insider_threat_detector import InsiderThreatFeatureExtractor

# Initialize extractor (do this once at startup)
insider_extractor = InsiderThreatFeatureExtractor()

@app.post("/predict")
async def predict(request: dict):
    # ... existing code ...
    
    # If you want to use enhanced features, convert old features to new format
    # Or extract new features from raw data
    # For now, keep existing functionality and add new endpoint
```

---

## 🎨 Phase 4: Update Frontend (1-2 hours)

### **Step 4.1: Update CSV Processor**

Update `src/services/csvProcessor.ts` to use enhanced features:

```typescript
// Add new feature extraction method
private extractEnhancedFeatures(row: CSVRow, userHistory: CSVRow[] = []): number[] {
  // This will call backend API to extract 20 features
  // For now, keep existing 11 features and add backend call for enhanced
  return this.extractFeatures(row); // Keep existing for now
}
```

### **Step 4.2: Add Threat Detection Display**

Update your frontend to show threat types. In your results display component:

```typescript
// Show threat information
{row.threatType && (
  <div className="threat-info">
    <Badge variant={row.threatType === 'brute_force' ? 'destructive' : 'warning'}>
      {row.threatType}
    </Badge>
    {row.riskFactors?.map((factor, i) => (
      <span key={i} className="risk-factor">{factor}</span>
    ))}
  </div>
)}
```

---

## ✅ Quick Start (All at Once)

### **Option A: Use Existing Model with Enhanced Features**

If you want to use your existing model but with enhanced detection:

```python
# test_insider_detection.py
import sys
sys.path.append('backend-fastapi')

from insider_threat_detector import (
    InsiderThreatFeatureExtractor,
    detect_insider_threat
)
from tensorflow import keras
from datetime import datetime, timedelta

# Load your existing model
model = keras.models.load_model('models/lstm_ae_cert.h5')

# Initialize extractor
extractor = InsiderThreatFeatureExtractor()

# Test: Brute force scenario
events = []
for i in range(10):
    events.append({
        'user_id': 'test_user@company.com',
        'timestamp': (datetime.now() - timedelta(minutes=10-i)).isoformat(),
        'action': 'login',
        'source_ip': '192.168.1.100',
        'resource': '/login',
        'status': 'failed'
    })

# Detect
result = detect_insider_threat(model, extractor, events)

print(f"✅ Anomaly: {result['is_anomaly']}")
print(f"✅ Threat Type: {result['threat_type']}")
print(f"✅ Risk Factors: {result['risk_factors']}")
```

**Run:**
```bash
cd backend-fastapi
python test_insider_detection.py
```

---

## 📊 Testing Checklist

- [ ] Feature extraction works (20 features)
- [ ] Model trains successfully
- [ ] Brute force detection works
- [ ] Location hopping detection works
- [ ] FastAPI endpoint responds
- [ ] Frontend displays threat types

---

## 🎯 Next Steps After Building

1. **Test with real data** - Use your security logs
2. **Tune thresholds** - Adjust detection sensitivity
3. **Add more threat types** - Extend detection logic
4. **Integrate with alerts** - Trigger alerts on threats
5. **Monitor performance** - Track false positives

---

## 🐛 Troubleshooting

### **Error: Module not found**
```bash
# Make sure you're in the right directory
cd backend-fastapi
python -c "from insider_threat_detector import InsiderThreatFeatureExtractor; print('OK')"
```

### **Error: Model shape mismatch**
- Your existing model expects [1, 7, 11]
- New model expects [1, 7, 20]
- Solution: Train new model OR adapt features

### **Error: Feature extraction fails**
- Check that all required fields are in your CSV
- Verify timestamp format
- Check IP address format

---

## 📚 Files Created/Modified

- ✅ `backend-fastapi/insider_threat_detector.py` (already created)
- ⏳ `backend-fastapi/train_insider_threat_model.py` (create this)
- ⏳ `backend-fastapi/main.py` (update this)
- ⏳ `src/services/csvProcessor.ts` (update this)

---

**Ready to start? Begin with Phase 1!** 🚀






