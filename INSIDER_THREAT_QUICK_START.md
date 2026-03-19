# Insider Threat Detection - Quick Start Guide
## Detect Brute Force, Location Hopping & Suspicious Patterns

---

## 🚀 Quick Start (5 Minutes)

### **Step 1: Use Existing Model (If You Have One)**

If you already have a trained model, you can use it immediately:

```python
from backend_fastapi.insider_threat_detector import (
    InsiderThreatFeatureExtractor,
    detect_insider_threat
)
from tensorflow import keras

# Load your existing model
model = keras.models.load_model('your_model.h5')

# Initialize feature extractor
extractor = InsiderThreatFeatureExtractor()

# Recent events (last 7+ events)
recent_events = [
    {
        'user_id': 'user@company.com',
        'timestamp': '2024-01-15 10:00:00',
        'action': 'login',
        'source_ip': '192.168.1.100',
        'resource': '/login',
        'status': 'failed'
    },
    # ... more events
]

# Detect threats
result = detect_insider_threat(model, extractor, recent_events)

print(f"Anomaly: {result['is_anomaly']}")
print(f"Threat Type: {result['threat_type']}")
print(f"Risk Factors: {result['risk_factors']}")
```

---

## 🎯 What It Detects

### **1. Brute Force Attacks**
- **Detects:** Multiple failed login attempts in short time
- **Feature:** `failed_attempts_count` (feature #12)
- **Threshold:** > 5 failed attempts in 10 minutes

**Example:**
```python
# 10 failed logins in 5 minutes = BRUTE FORCE DETECTED
events = [
    {'user_id': 'user@company.com', 'action': 'login', 'status': 'failed', ...},
    {'user_id': 'user@company.com', 'action': 'login', 'status': 'failed', ...},
    # ... 8 more failed logins
]
# Result: threat_type='brute_force'
```

---

### **2. Location Hopping**
- **Detects:** Login from different IPs in short time
- **Feature:** `unique_ips_last_hour` (feature #14)
- **Threshold:** > 3 unique IPs in 1 hour

**Example:**
```python
# 5 logins from different IPs in 1 hour = LOCATION HOPPING
events = [
    {'source_ip': '203.0.113.1', ...},
    {'source_ip': '198.51.100.2', ...},
    {'source_ip': '192.0.2.3', ...},
    {'source_ip': '203.0.113.4', ...},
    {'source_ip': '198.51.100.5', ...},
]
# Result: threat_type='location_hopping'
```

---

### **3. Off-Hours Privileged Access**
- **Detects:** Admin actions outside business hours
- **Features:** `is_off_hours` (feature #5) + `privilege_level` (feature #19)
- **Threshold:** Off-hours (before 8 AM or after 6 PM) + High privilege

**Example:**
```python
# Admin action at 2 AM = OFF-HOURS ACCESS
events = [
    {
        'timestamp': '2024-01-15 02:00:00',  # 2 AM
        'action': 'admin_action',
        'source_ip': '203.0.113.1',  # External IP
        ...
    }
]
# Result: threat_type='off_hours_access'
```

---

### **4. Rapid Activity**
- **Detects:** Unusually high action velocity
- **Feature:** `action_velocity` (feature #15)
- **Threshold:** > 7 actions per minute

**Example:**
```python
# 10 actions in 1 minute = RAPID ACTIVITY
events = [
    # 10 events within 1 minute
]
# Result: threat_type='rapid_activity'
```

---

## 📊 Feature Map

| Feature # | Name | Purpose | Detection |
|-----------|------|---------|-----------|
| 0 | action_type | Action category | General |
| 1 | status | Success/failed | General |
| 2 | hour | Time of day | Temporal |
| 3 | day_of_week | Day (0-6) | Temporal |
| 4 | is_weekend | Weekend flag | Temporal |
| 5 | is_off_hours | Off-hours flag | **Off-hours access** |
| 6-9 | IP parts | IP address | Location |
| 10 | is_external_ip | External IP flag | **External access** |
| 11 | location_change | IP change flag | Location |
| 12 | failed_attempts_count | Failed logins | **BRUTE FORCE** |
| 13 | login_frequency | Logins/hour | General |
| 14 | unique_ips_last_hour | Unique IPs | **LOCATION HOPPING** |
| 15 | action_velocity | Actions/min | **RAPID ACTIVITY** |
| 16 | resource_sensitivity | Sensitive resource | Access |
| 17 | resource_access_frequency | Resource access count | General |
| 18 | data_transfer_size | Bytes transferred | Data exfiltration |
| 19 | privilege_level | User privilege | **Privileged access** |

---

## 🔧 Integration with Your System

### **Option 1: Use with Existing CSV Processor**

Update your CSV processor to use insider threat detection:

```python
# In your CSV processor
from backend_fastapi.insider_threat_detector import (
    InsiderThreatFeatureExtractor,
    detect_insider_threat
)

extractor = InsiderThreatFeatureExtractor()
model = keras.models.load_model('insider_threat_model.h5')

# For each user, collect recent events
user_events = []  # Last 7+ events for this user

for row in csv_rows:
    user_events.append(row)
    
    # Keep only last 7 events
    if len(user_events) > 7:
        user_events = user_events[-7:]
    
    # Detect threats
    if len(user_events) >= 7:
        threat_result = detect_insider_threat(model, extractor, user_events)
        
        if threat_result['is_anomaly']:
            print(f"⚠️ THREAT DETECTED: {threat_result['threat_type']}")
            print(f"   Risk Factors: {threat_result['risk_factors']}")
```

---

### **Option 2: Add to FastAPI Endpoint**

```python
# In backend-fastapi/main.py
from backend_fastapi.insider_threat_detector import (
    InsiderThreatFeatureExtractor,
    detect_insider_threat
)

extractor = InsiderThreatFeatureExtractor()
insider_model = keras.models.load_model('insider_threat_model.h5')

@app.post("/api/ai/detect-insider-threat")
async def detect_threat(request: dict):
    """Detect insider threats from recent events"""
    recent_events = request.get('events', [])
    
    result = detect_insider_threat(
        insider_model,
        extractor,
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
```

---

## 🧪 Test Scenarios

### **Test 1: Brute Force**

```python
from datetime import datetime, timedelta

# Create 10 failed logins in 5 minutes
events = []
base_time = datetime.now()

for i in range(10):
    events.append({
        'user_id': 'test_user@company.com',
        'timestamp': (base_time - timedelta(minutes=5-i)).isoformat(),
        'action': 'login',
        'source_ip': '192.168.1.100',
        'resource': '/login',
        'status': 'failed'
    })

result = detect_insider_threat(model, extractor, events)
assert result['threat_type'] == 'brute_force'
assert result['is_anomaly'] == True
```

### **Test 2: Location Hopping**

```python
# 5 logins from different IPs in 1 hour
events = []
base_time = datetime.now()
ips = ['203.0.113.1', '198.51.100.2', '192.0.2.3', '203.0.113.4', '198.51.100.5']

for i, ip in enumerate(ips):
    events.append({
        'user_id': 'test_user@company.com',
        'timestamp': (base_time - timedelta(minutes=60-i*15)).isoformat(),
        'action': 'login',
        'source_ip': ip,
        'resource': '/login',
        'status': 'success'
    })

result = detect_insider_threat(model, extractor, events)
assert result['threat_type'] == 'location_hopping'
```

---

## 📝 Training Your Model

### **Quick Training Script**

See `INSIDER_THREAT_MODEL_GUIDE.md` for complete training guide, or use this quick script:

```python
# train_insider_threat_model.py
import pandas as pd
import numpy as np
from tensorflow import keras
from backend_fastapi.insider_threat_detector import (
    InsiderThreatFeatureExtractor,
    build_insider_threat_model
)

# 1. Load your data
df = pd.read_csv('your_security_logs.csv')

# 2. Prepare sequences
extractor = InsiderThreatFeatureExtractor()
sequences = []

for user_id, user_data in df.groupby('user_id'):
    user_data = user_data.sort_values('timestamp')
    user_events = []
    
    for _, row in user_data.iterrows():
        features = extractor.extract_features(row.to_dict(), user_events)
        extractor.update_history(row.to_dict())
        user_events.append(row.to_dict())
        
        if len(user_events) >= 7:
            sequence = [
                extractor.extract_features(e, user_events[:i])
                for i, e in enumerate(user_events[-7:])
            ]
            sequences.append(sequence)

X = np.array(sequences)

# 3. Build and train model
model = build_insider_threat_model(input_timesteps=7, input_features=20)
model.fit(X, X, epochs=50, batch_size=32, validation_split=0.2)

# 4. Save model
model.save('insider_threat_model.h5')
```

---

## ✅ Checklist

- [ ] Install dependencies: `tensorflow`, `pandas`, `numpy`
- [ ] Copy `insider_threat_detector.py` to your backend
- [ ] Load or train your model
- [ ] Test with brute force scenario
- [ ] Test with location hopping scenario
- [ ] Integrate with your CSV processor
- [ ] Add API endpoint (optional)
- [ ] Test with real data

---

## 🎯 Next Steps

1. **Use existing model** → Test detection immediately
2. **Train new model** → Follow training guide
3. **Integrate** → Add to your system
4. **Test** → Validate with test scenarios
5. **Deploy** → Use in production

---

**You're ready to detect insider threats!** 🚀

For complete details, see: `INSIDER_THREAT_MODEL_GUIDE.md`







