# Insider Threat Detection Model Guide
## Building AI Model to Detect Brute Force, Location Changes & Suspicious Patterns

**For:** AI Team (Member B - Advanced, Member C - Medium)  
**Purpose:** Create/Enhance AI model to detect insider threats and account compromise  
**Last Updated:** [Current Date]

---

## 🎯 What We're Building

An enhanced LSTM Autoencoder model that detects:

1. ✅ **Brute Force Attacks** - Multiple failed login attempts
2. ✅ **Location Hopping** - Login from different locations in short time
3. ✅ **Unusual Access Patterns** - Off-hours, new devices, etc.
4. ✅ **Account Takeover** - Sudden behavior changes
5. ✅ **Data Exfiltration** - Unusual data access/download patterns

---

## 📊 Enhanced Feature Engineering

### **Current Features (11):**
Your current model uses:
1. Action type (0-5)
2. Status (0-1)
3. IP part 1 (normalized)
4. IP part 2 (normalized)
5. IP part 3 (normalized)
6. IP part 4 (normalized)
7. Hour (normalized)
8. User ID hash (normalized)
9. Resource length (normalized)
10. Average IP (normalized)
11. Resource length alternative (normalized)

### **Enhanced Features for Insider Threat Detection (20+):**

We'll expand to **20-25 features** to capture insider threat patterns:

```python
# Enhanced Feature Set (20 features)
features = [
    # Basic features (1-6)
    1. action_type,              # 0-5 (login, access_file, etc.)
    2. status,                   # 0-1 (success/failed)
    3. hour_normalized,          # 0-1 (hour / 24)
    4. day_of_week,              # 0-1 (Monday=0, Sunday=6)
    5. is_weekend,               # 0-1 (weekend=1, weekday=0)
    6. is_off_hours,             # 0-1 (8 AM - 6 PM = 0, else = 1)
    
    # IP & Location features (7-12)
    7. ip_normalized_1,          # 0-1 (IP octet 1 / 255)
    8. ip_normalized_2,          # 0-1 (IP octet 2 / 255)
    9. ip_normalized_3,          # 0-1 (IP octet 3 / 255)
    10. ip_normalized_4,         # 0-1 (IP octet 4 / 255)
    11. is_external_ip,          # 0-1 (external=1, internal=0)
    12. location_change_score,    # 0-1 (based on IP changes in last hour)
    
    # User behavior features (13-16)
    13. failed_attempts_count,    # 0-1 (failed logins in last 10 min / 10)
    14. login_frequency,          # 0-1 (logins per hour / 20)
    15. unique_ips_last_hour,     # 0-1 (unique IPs in last hour / 5)
    16. action_velocity,          # 0-1 (actions per minute / 10)
    
    # Resource & Access features (17-20)
    17. resource_sensitivity,     # 0-1 (sensitive resource=1, normal=0)
    18. resource_access_frequency, # 0-1 (accesses to this resource / 100)
    19. data_transfer_size,       # 0-1 (bytes transferred / 1GB)
    20. privilege_level,          # 0-1 (admin=1, user=0.5, guest=0)
]
```

---

## 🔧 Feature Extraction Implementation

### **Complete Feature Extraction Function**

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from collections import defaultdict

class InsiderThreatFeatureExtractor:
    """
    Enhanced feature extractor for insider threat detection
    Detects: brute force, location changes, suspicious patterns
    """
    
    def __init__(self):
        # Track user history for context
        self.user_history = defaultdict(list)
        self.user_ips = defaultdict(set)
        self.user_failed_attempts = defaultdict(list)
        self.resource_access_count = defaultdict(int)
        
    def extract_features(self, row: dict, user_history: list = None) -> np.array:
        """
        Extract 20 features for insider threat detection
        
        Args:
            row: Dictionary with user_id, timestamp, action, source_ip, 
                 resource, status, etc.
            user_history: List of recent events for this user (last hour)
        
        Returns:
            numpy array of 20 features (normalized 0-1)
        """
        features = []
        
        # 1. Basic Action Features
        action_types = {
            'login': 0, 'access_file': 1, 'download_file': 2,
            'upload_file': 3, 'admin_action': 4, 'execute_script': 5
        }
        action_type = action_types.get(row.get('action', 'login'), 0)
        features.append(action_type / 5.0)  # Normalize 0-1
        
        # 2. Status
        status = 1.0 if row.get('status') == 'success' else 0.0
        features.append(status)
        
        # 3. Temporal Features
        timestamp = pd.to_datetime(row.get('timestamp', datetime.now()))
        hour = timestamp.hour
        day_of_week = timestamp.weekday()
        is_weekend = 1.0 if day_of_week >= 5 else 0.0
        is_off_hours = 1.0 if hour < 8 or hour > 18 else 0.0
        
        features.append(hour / 24.0)
        features.append(day_of_week / 6.0)
        features.append(is_weekend)
        features.append(is_off_hours)
        
        # 4. IP & Location Features
        source_ip = row.get('source_ip', '0.0.0.0')
        ip_parts = [int(x) for x in source_ip.split('.') if x.isdigit()]
        if len(ip_parts) < 4:
            ip_parts = [0, 0, 0, 0]
        
        features.append(ip_parts[0] / 255.0)
        features.append(ip_parts[1] / 255.0)
        features.append(ip_parts[2] / 255.0)
        features.append(ip_parts[3] / 255.0)
        
        # Is external IP? (simplified: not in 192.168.x.x, 10.x.x.x, 172.16-31.x.x)
        is_external = 1.0 if not (
            (ip_parts[0] == 192 and ip_parts[1] == 168) or
            (ip_parts[0] == 10) or
            (ip_parts[0] == 172 and 16 <= ip_parts[1] <= 31)
        ) else 0.0
        features.append(is_external)
        
        # Location change score (IP changes in last hour)
        user_id = row.get('user_id', '')
        if user_history:
            recent_ips = set([e.get('source_ip') for e in user_history[-10:]])
            location_change = 1.0 if source_ip not in recent_ips else 0.0
        else:
            location_change = 0.0
        features.append(location_change)
        
        # 5. Brute Force Detection Features
        if user_history:
            # Failed attempts in last 10 minutes
            recent_failed = [e for e in user_history[-20:] 
                           if e.get('status') == 'failed' 
                           and (timestamp - pd.to_datetime(e.get('timestamp'))).seconds < 600]
            failed_count = len(recent_failed)
        else:
            failed_count = 1 if status == 0.0 else 0
        
        features.append(min(1.0, failed_count / 10.0))  # Cap at 10 failed attempts
        
        # Login frequency (logins per hour)
        if user_history:
            recent_logins = [e for e in user_history[-60:] 
                           if e.get('action') == 'login'
                           and (timestamp - pd.to_datetime(e.get('timestamp'))).seconds < 3600]
            login_freq = len(recent_logins)
        else:
            login_freq = 1 if action_type == 0 else 0
        features.append(min(1.0, login_freq / 20.0))  # Cap at 20 logins/hour
        
        # Unique IPs in last hour (location hopping)
        if user_history:
            recent_ips = set([e.get('source_ip') for e in user_history[-60:]
                            if (timestamp - pd.to_datetime(e.get('timestamp'))).seconds < 3600])
            unique_ips = len(recent_ips)
        else:
            unique_ips = 1
        features.append(min(1.0, unique_ips / 5.0))  # Cap at 5 unique IPs
        
        # Action velocity (actions per minute)
        if user_history:
            recent_actions = [e for e in user_history[-10:]
                            if (timestamp - pd.to_datetime(e.get('timestamp'))).seconds < 60]
            action_vel = len(recent_actions)
        else:
            action_vel = 1
        features.append(min(1.0, action_vel / 10.0))  # Cap at 10 actions/min
        
        # 6. Resource & Access Features
        resource = row.get('resource', '')
        
        # Resource sensitivity (check if contains sensitive keywords)
        sensitive_keywords = ['admin', 'password', 'secret', 'confidential', 'private']
        resource_sensitivity = 1.0 if any(kw in resource.lower() for kw in sensitive_keywords) else 0.0
        features.append(resource_sensitivity)
        
        # Resource access frequency
        if user_history:
            resource_access = len([e for e in user_history[-100:]
                                 if e.get('resource') == resource])
        else:
            resource_access = 0
        features.append(min(1.0, resource_access / 100.0))
        
        # Data transfer size (if available)
        data_size = row.get('data_size', 0) or 0
        features.append(min(1.0, data_size / (1024 * 1024 * 1024)))  # Normalize to GB
        
        # Privilege level
        privilege_map = {
            'admin_action': 1.0,
            'execute_script': 0.8,
            'upload_file': 0.6,
            'download_file': 0.4,
            'access_file': 0.2,
            'login': 0.1
        }
        privilege = privilege_map.get(row.get('action', 'login'), 0.1)
        features.append(privilege)
        
        return np.array(features, dtype=np.float32)
    
    def update_history(self, row: dict):
        """Update user history for context"""
        user_id = row.get('user_id', '')
        self.user_history[user_id].append(row)
        
        # Keep only last 100 events per user
        if len(self.user_history[user_id]) > 100:
            self.user_history[user_id] = self.user_history[user_id][-100:]
```

---

## 🏗️ Model Architecture

### **Enhanced LSTM Autoencoder**

```python
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np

def build_insider_threat_model(
    input_timesteps=7,
    input_features=20,
    encoding_dim=64
):
    """
    Build LSTM Autoencoder for insider threat detection
    
    Architecture:
    - Encoder: LSTM layers to compress input
    - Decoder: LSTM layers to reconstruct input
    - Output: Reconstruction error indicates anomaly
    """
    
    # Input layer
    input_layer = layers.Input(shape=(input_timesteps, input_features))
    
    # Encoder
    encoder = layers.LSTM(128, return_sequences=True)(input_layer)
    encoder = layers.Dropout(0.2)(encoder)
    encoder = layers.LSTM(64, return_sequences=True)(encoder)
    encoder = layers.Dropout(0.2)(encoder)
    encoder = layers.LSTM(32, return_sequences=False)(encoder)
    
    # Bottleneck (encoded representation)
    encoded = layers.Dense(encoding_dim, activation='relu')(encoder)
    
    # Decoder
    decoder = layers.RepeatVector(input_timesteps)(encoded)
    decoder = layers.LSTM(32, return_sequences=True)(decoder)
    decoder = layers.Dropout(0.2)(decoder)
    decoder = layers.LSTM(64, return_sequences=True)(decoder)
    decoder = layers.Dropout(0.2)(decoder)
    decoder = layers.LSTM(128, return_sequences=True)(decoder)
    
    # Output layer (reconstruct input)
    decoder = layers.TimeDistributed(
        layers.Dense(input_features, activation='linear')
    )(decoder)
    
    # Create model
    model = keras.Model(input_layer, decoder)
    
    # Compile
    model.compile(
        optimizer='adam',
        loss='mse',  # Mean Squared Error for reconstruction
        metrics=['mae']
    )
    
    return model

# Example usage
model = build_insider_threat_model(
    input_timesteps=7,  # 7 timesteps (last 7 events)
    input_features=20,  # 20 features per event
    encoding_dim=64     # Encoded representation size
)

model.summary()
```

---

## 📚 Training Data Preparation

### **1. Load and Prepare Data**

```python
import pandas as pd
import numpy as np

def prepare_training_data(csv_path: str):
    """
    Prepare training data with enhanced features
    """
    # Load CSV
    df = pd.read_csv(csv_path)
    
    # Initialize feature extractor
    extractor = InsiderThreatFeatureExtractor()
    
    # Group by user
    sequences = []
    labels = []  # 0 = normal, 1 = anomaly
    
    for user_id, user_data in df.groupby('user_id'):
        user_data = user_data.sort_values('timestamp')
        user_history = []
        
        for idx, row in user_data.iterrows():
            # Extract features
            features = extractor.extract_features(
                row.to_dict(),
                user_history
            )
            
            # Update history
            extractor.update_history(row.to_dict())
            user_history.append(row.to_dict())
            
            # Create sequences (sliding window of 7)
            if len(sequences) >= 6:  # Need at least 7 events
                sequence = [s[-1] for s in sequences[-6:]]  # Last 6
                sequence.append(features)  # Current
                sequences.append(sequence)
                
                # Label: 1 if brute force or location change detected
                is_anomaly = (
                    features[12] > 0.5 or  # Failed attempts > 5
                    features[14] > 0.6 or   # Unique IPs > 3
                    features[15] > 0.7     # Action velocity > 7/min
                )
                labels.append(1 if is_anomaly else 0)
            
            sequences.append([features])
    
    # Convert to numpy arrays
    X = np.array(sequences)
    y = np.array(labels)
    
    return X, y
```

### **2. Add Synthetic Anomalies (Brute Force, Location Changes)**

```python
def add_synthetic_anomalies(df: pd.DataFrame, num_anomalies: int = 100):
    """
    Add synthetic anomalies for training:
    - Brute force attacks (multiple failed logins)
    - Location hopping (rapid IP changes)
    - Off-hours access
    """
    anomalies = []
    
    # Get unique users
    users = df['user_id'].unique()
    
    for i in range(num_anomalies):
        user = np.random.choice(users)
        base_time = pd.Timestamp.now() - pd.Timedelta(days=np.random.randint(1, 30))
        
        # Type 1: Brute Force Attack
        if i % 3 == 0:
            for j in range(10):  # 10 failed login attempts
                anomalies.append({
                    'user_id': user,
                    'timestamp': base_time + pd.Timedelta(minutes=j),
                    'action': 'login',
                    'source_ip': f"192.168.1.{np.random.randint(1, 255)}",
                    'resource': '/login',
                    'status': 'failed'  # All failed
                })
        
        # Type 2: Location Hopping
        elif i % 3 == 1:
            for j in range(5):  # 5 logins from different IPs in 1 hour
                anomalies.append({
                    'user_id': user,
                    'timestamp': base_time + pd.Timedelta(minutes=j*10),
                    'action': 'login',
                    'source_ip': f"{np.random.randint(100, 200)}.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}",
                    'resource': '/login',
                    'status': 'success'
                })
        
        # Type 3: Off-hours + Unusual Activity
        else:
            anomalies.append({
                'user_id': user,
                'timestamp': base_time.replace(hour=np.random.choice([2, 3, 4, 23])),  # Off-hours
                'action': 'admin_action',
                'source_ip': f"{np.random.randint(200, 255)}.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}",  # External IP
                'resource': '/api/admin/users',
                'status': 'success'
            })
    
    # Combine with original data
    anomaly_df = pd.DataFrame(anomalies)
    combined_df = pd.concat([df, anomaly_df], ignore_index=True)
    
    return combined_df
```

---

## 🎓 Training the Model

### **Complete Training Script**

```python
import pandas as pd
import numpy as np
from tensorflow import keras
from sklearn.model_selection import train_test_split

# 1. Load data
print("Loading data...")
df = pd.read_csv('your_security_logs.csv')

# 2. Add synthetic anomalies
print("Adding synthetic anomalies...")
df = add_synthetic_anomalies(df, num_anomalies=200)

# 3. Prepare features
print("Extracting features...")
extractor = InsiderThreatFeatureExtractor()
X, y = prepare_training_data(df)

# 4. Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 5. Build model
print("Building model...")
model = build_insider_threat_model(
    input_timesteps=7,
    input_features=20,
    encoding_dim=64
)

# 6. Train
print("Training model...")
history = model.fit(
    X_train, X_train,  # Autoencoder: input = target
    validation_data=(X_test, X_test),
    epochs=50,
    batch_size=32,
    callbacks=[
        keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True),
        keras.callbacks.ModelCheckpoint(
            'insider_threat_model.h5',
            save_best_only=True
        )
    ]
)

# 7. Evaluate
print("Evaluating model...")
# Calculate reconstruction error
train_pred = model.predict(X_train)
train_error = np.mean(np.square(X_train - train_pred), axis=(1, 2))

test_pred = model.predict(X_test)
test_error = np.mean(np.square(X_test - test_pred), axis=(1, 2))

# Threshold: 95th percentile of training error
threshold = np.percentile(train_error, 95)

# Predict anomalies
y_pred = (test_error > threshold).astype(int)

# Calculate metrics
from sklearn.metrics import classification_report, confusion_matrix
print("\nClassification Report:")
print(classification_report(y_test, y_pred))
print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

# 8. Save model
model.save('insider_threat_model.h5')
print("\nModel saved to insider_threat_model.h5")
```

---

## 🔍 Detection Logic

### **Anomaly Detection Function**

```python
def detect_insider_threat(
    model,
    feature_extractor,
    recent_events: list,
    threshold: float = None
) -> dict:
    """
    Detect insider threats from recent events
    
    Returns:
        {
            'is_anomaly': bool,
            'anomaly_score': float (0-1),
            'threat_type': str,
            'risk_factors': list
        }
    """
    # Extract features for last 7 events
    if len(recent_events) < 7:
        # Pad with zeros if not enough events
        features_list = [[0]*20] * (7 - len(recent_events))
        for event in recent_events:
            features_list.append(feature_extractor.extract_features(event))
    else:
        features_list = [
            feature_extractor.extract_features(event)
            for event in recent_events[-7:]
        ]
    
    # Prepare input
    sequence = np.array([features_list])  # Shape: [1, 7, 20]
    
    # Get reconstruction
    reconstructed = model.predict(sequence, verbose=0)
    
    # Calculate reconstruction error
    mse = np.mean(np.square(sequence - reconstructed))
    
    # Determine threshold (if not provided)
    if threshold is None:
        threshold = 0.05  # Default threshold
    
    # Check for specific threat patterns
    latest_features = features_list[-1]
    risk_factors = []
    threat_type = None
    
    # Brute force detection
    if latest_features[12] > 0.5:  # Failed attempts > 5
        risk_factors.append("Brute force attack detected")
        threat_type = "brute_force"
    
    # Location hopping
    if latest_features[14] > 0.6:  # Unique IPs > 3
        risk_factors.append("Location hopping detected")
        threat_type = "location_hopping"
    
    # Off-hours access
    if latest_features[5] > 0.5 and latest_features[19] > 0.7:  # Off-hours + privilege
        risk_factors.append("Off-hours privileged access")
        threat_type = "off_hours_access"
    
    # High action velocity
    if latest_features[15] > 0.7:  # Actions > 7/min
        risk_factors.append("Unusual activity velocity")
        threat_type = "rapid_activity"
    
    # Calculate anomaly score
    anomaly_score = min(1.0, mse / threshold)
    is_anomaly = mse > threshold or len(risk_factors) > 0
    
    return {
        'is_anomaly': is_anomaly,
        'anomaly_score': anomaly_score,
        'threat_type': threat_type,
        'risk_factors': risk_factors,
        'reconstruction_error': float(mse)
    }
```

---

## 🔌 Integration with Your System

### **Update Your FastAPI Backend**

```python
# In backend-fastapi/main.py

from insider_threat_detector import InsiderThreatFeatureExtractor, detect_insider_threat

# Initialize
feature_extractor = InsiderThreatFeatureExtractor()
insider_model = keras.models.load_model('insider_threat_model.h5')

@app.post("/api/ai/predict-insider-threat")
async def predict_insider_threat(request: dict):
    """
    Detect insider threats from recent events
    """
    recent_events = request.get('events', [])
    
    # Detect threats
    result = detect_insider_threat(
        insider_model,
        feature_extractor,
        recent_events
    )
    
    return {
        'isAnomaly': result['is_anomaly'],
        'anomalyScore': result['anomaly_score'],
        'threatType': result['threat_type'],
        'riskFactors': result['risk_factors'],
        'reconstructionError': result['reconstruction_error']
    }
```

---

## 📊 Testing Scenarios

### **Test Case 1: Brute Force Attack**

```python
# Simulate brute force: 10 failed logins in 5 minutes
events = []
for i in range(10):
    events.append({
        'user_id': 'test_user@company.com',
        'timestamp': datetime.now() - timedelta(minutes=5-i),
        'action': 'login',
        'source_ip': '192.168.1.100',
        'resource': '/login',
        'status': 'failed'
    })

result = detect_insider_threat(model, extractor, events)
# Expected: is_anomaly=True, threat_type='brute_force'
```

### **Test Case 2: Location Hopping**

```python
# Simulate location hopping: 5 logins from different IPs in 1 hour
events = []
ips = ['203.0.113.1', '198.51.100.2', '192.0.2.3', '203.0.113.4', '198.51.100.5']
for i, ip in enumerate(ips):
    events.append({
        'user_id': 'test_user@company.com',
        'timestamp': datetime.now() - timedelta(minutes=60-i*15),
        'action': 'login',
        'source_ip': ip,
        'resource': '/login',
        'status': 'success'
    })

result = detect_insider_threat(model, extractor, events)
# Expected: is_anomaly=True, threat_type='location_hopping'
```

---

## ✅ Implementation Checklist

### **For Member B (Advanced AI):**

- [ ] Implement enhanced feature extraction (20 features)
- [ ] Build new LSTM Autoencoder model
- [ ] Train model with normal + anomaly data
- [ ] Implement detection logic
- [ ] Test with brute force scenarios
- [ ] Test with location hopping scenarios
- [ ] Optimize model performance
- [ ] Document model architecture

### **For Member C (Medium AI):**

- [ ] Prepare training data
- [ ] Add synthetic anomalies
- [ ] Validate feature extraction
- [ ] Test feature quality
- [ ] Assist with model training
- [ ] Evaluate model performance
- [ ] Create test scenarios

---

## 📚 Resources

- **CERT Dataset:** https://www.cert.org/insider-threat-tools/datasets/
- **LSTM Autoencoder Guide:** Your existing model documentation
- **Feature Engineering:** See feature extraction code above

---

## 🎯 Next Steps

1. **Week 1:** Implement enhanced feature extraction
2. **Week 2:** Build and train new model
3. **Week 3:** Test with brute force and location scenarios
4. **Week 4:** Integrate with existing system
5. **Week 5:** Optimize and fine-tune

---

**This model will detect insider threats, brute force attacks, and location hopping!** 🚀







