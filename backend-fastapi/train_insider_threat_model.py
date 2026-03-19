"""
Train Insider Threat Detection Model
Detects: Brute Force, Location Hopping, Suspicious Patterns
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from insider_threat_detector import (
    InsiderThreatFeatureExtractor,
    build_insider_threat_model
)
from tensorflow import keras
from sklearn.model_selection import train_test_split

def create_synthetic_data(num_normal=200, num_anomalies=50):
    """Create synthetic training data"""
    print("📝 Creating synthetic training data...")
    
    data = []
    
    # Normal behavior
    for i in range(num_normal):
        data.append({
            'user_id': f'user{i % 10}@company.com',
            'timestamp': datetime.now() - timedelta(hours=24-i),
            'action': np.random.choice(['login', 'access_file', 'download_file']),
            'source_ip': f'192.168.1.{np.random.randint(1, 10)}',
            'resource': f'/api/{np.random.choice(["dashboard", "files", "reports"])}',
            'status': 'success'
        })
    
    # Brute force attacks
    for i in range(num_anomalies // 3):
        user_id = f'user_brute{i}@company.com'
        base_time = datetime.now() - timedelta(days=i)
        for j in range(10):  # 10 failed attempts
            data.append({
                'user_id': user_id,
                'timestamp': base_time - timedelta(minutes=10-j),
                'action': 'login',
                'source_ip': '192.168.1.100',
                'resource': '/login',
                'status': 'failed'
            })
    
    # Location hopping
    for i in range(num_anomalies // 3):
        user_id = f'user_hopper{i}@company.com'
        base_time = datetime.now() - timedelta(days=i)
        ips = [
            f'{np.random.randint(100, 200)}.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}'
            for _ in range(5)
        ]
        for j, ip in enumerate(ips):
            data.append({
                'user_id': user_id,
                'timestamp': base_time - timedelta(minutes=60-j*15),
                'action': 'login',
                'source_ip': ip,
                'resource': '/login',
                'status': 'success'
            })
    
    # Off-hours privileged access
    for i in range(num_anomalies // 3):
        data.append({
            'user_id': f'user_admin{i}@company.com',
            'timestamp': datetime.now() - timedelta(days=i, hours=np.random.choice([2, 3, 23])),
            'action': 'admin_action',
            'source_ip': f'{np.random.randint(200, 255)}.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}',
            'resource': '/api/admin/users',
            'status': 'success'
        })
    
    return pd.DataFrame(data)

def main():
    print("=" * 60)
    print("🚀 Insider Threat Model Training")
    print("=" * 60)
    
    # 1. Load or create data
    print("\n📂 Step 1: Loading data...")
    data_file = '../public/test-data-sample.csv'
    
    if os.path.exists(data_file):
        try:
            df = pd.read_csv(data_file)
            print(f"✅ Loaded {len(df)} rows from {data_file}")
            
            # Add synthetic anomalies
            print("🔧 Adding synthetic anomalies...")
            anomaly_df = create_synthetic_data(num_normal=0, num_anomalies=50)
            df = pd.concat([df, anomaly_df], ignore_index=True)
            print(f"✅ Added {len(anomaly_df)} anomaly samples")
        except Exception as e:
            print(f"⚠️ Error loading file: {e}")
            print("📝 Creating synthetic data...")
            df = create_synthetic_data(num_normal=200, num_anomalies=50)
    else:
        print(f"⚠️ File not found: {data_file}")
        print("📝 Creating synthetic data...")
        df = create_synthetic_data(num_normal=200, num_anomalies=50)
    
    print(f"✅ Total data: {len(df)} rows")
    
    # 2. Extract features
    print("\n🔍 Step 2: Extracting features...")
    extractor = InsiderThreatFeatureExtractor()
    sequences = []
    
    for user_id, user_data in df.groupby('user_id'):
        user_data = user_data.sort_values('timestamp')
        user_events = []
        
        for _, row in user_data.iterrows():
            row_dict = row.to_dict()
            
            # Extract features
            features = extractor.extract_features(row_dict, user_events)
            extractor.update_history(row_dict)
            user_events.append(row_dict)
            
            # Create sequences of 7 timesteps
            if len(user_events) >= 7:
                sequence = []
                for idx, event in enumerate(user_events[-7:]):
                    # Get history up to this point
                    event_history = user_events[:len(user_events)-7+idx]
                    seq_features = extractor.extract_features(event, event_history)
                    sequence.append(seq_features)
                sequences.append(sequence)
    
    if len(sequences) == 0:
        print("❌ No sequences created. Need at least 7 events per user.")
        return
    
    X = np.array(sequences)
    print(f"✅ Created {len(X)} sequences")
    print(f"   Shape: {X.shape} (samples, timesteps={X.shape[1]}, features={X.shape[2]})")
    
    # Verify shape
    if X.shape[2] != 20:
        print(f"⚠️ Warning: Expected 20 features, got {X.shape[2]}")
        print("   Model will be built with {X.shape[2]} features")
    
    # 3. Split data
    print("\n📊 Step 3: Splitting data...")
    X_train, X_test = train_test_split(X, test_size=0.2, random_state=42)
    print(f"✅ Training: {len(X_train)} samples")
    print(f"✅ Test: {len(X_test)} samples")
    
    # 4. Build model
    print("\n🏗️ Step 4: Building model...")
    model = build_insider_threat_model(
        input_timesteps=X.shape[1],
        input_features=X.shape[2],
        encoding_dim=64
    )
    print("✅ Model built successfully")
    model.summary()
    
    # 5. Train model
    print("\n🎓 Step 5: Training model...")
    print("   This may take 10-30 minutes depending on your data size...")
    
    history = model.fit(
        X_train, X_train,  # Autoencoder: input = target
        validation_data=(X_test, X_test),
        epochs=50,
        batch_size=32,
        callbacks=[
            keras.callbacks.EarlyStopping(
                patience=5,
                restore_best_weights=True,
                monitor='val_loss',
                verbose=1
            ),
            keras.callbacks.ModelCheckpoint(
                'insider_threat_model.h5',
                save_best_only=True,
                monitor='val_loss',
                verbose=1
            )
        ],
        verbose=1
    )
    
    # 6. Evaluate
    print("\n📊 Step 6: Evaluating model...")
    train_pred = model.predict(X_train, verbose=0)
    train_error = np.mean(np.square(X_train - train_pred), axis=(1, 2))
    
    test_pred = model.predict(X_test, verbose=0)
    test_error = np.mean(np.square(X_test - test_pred), axis=(1, 2))
    
    threshold = np.percentile(train_error, 95)
    
    print(f"\n✅ Training Results:")
    print(f"   Mean error: {np.mean(train_error):.6f}")
    print(f"   Std error: {np.std(train_error):.6f}")
    print(f"   95th percentile: {threshold:.6f}")
    
    print(f"\n✅ Test Results:")
    print(f"   Mean error: {np.mean(test_error):.6f}")
    print(f"   Std error: {np.std(test_error):.6f}")
    
    print(f"\n✅ Recommended threshold: {threshold:.6f}")
    print(f"   (Use this in detect_insider_threat function)")
    
    # 7. Save model
    model_path = 'insider_threat_model.h5'
    model.save(model_path)
    print(f"\n✅ Model saved to: {model_path}")
    
    print("\n" + "=" * 60)
    print("🎉 Training Complete!")
    print("=" * 60)
    print("\n📝 Next Steps:")
    print("1. Test the model: python test_insider_detection.py")
    print("2. Integrate into FastAPI: Update main.py")
    print("3. Test with real data")
    print("\n")

if __name__ == "__main__":
    main()






