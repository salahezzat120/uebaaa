"""
Quick training script for Insider Threat Detection Model
Creates and trains the model with synthetic data
"""
import os
import sys
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from insider_threat_detector import (
    InsiderThreatFeatureExtractor,
    build_insider_threat_model
)
from tensorflow import keras
from sklearn.model_selection import train_test_split

def create_synthetic_training_data(num_normal=500, num_anomalies=150):
    """Create synthetic training data for insider threat detection"""
    print("📝 Creating synthetic training data...")
    
    data = []
    
    # Normal behavior patterns
    print("   Creating normal behavior samples...")
    for i in range(num_normal):
        user_id = f'user{i % 20}@company.com'
        base_time = datetime.now() - timedelta(hours=num_normal-i)
        
        # Normal actions during business hours
        hour = 9 + (i % 8)  # Business hours 9-17
        action = np.random.choice(['login', 'access_file', 'download_file'], p=[0.3, 0.5, 0.2])
        ip = f'192.168.1.{np.random.randint(1, 50)}'  # Internal IP
        status = 'success'
        
        data.append({
            'user_id': user_id,
            'timestamp': base_time.replace(hour=hour),
            'action': action,
            'source_ip': ip,
            'resource': f'/files/{np.random.choice(["documents", "reports", "images"])}',
            'status': status
        })
    
    # Anomaly 1: Brute Force Attacks
    print("   Creating brute force attack samples...")
    for i in range(num_anomalies // 3):
        user_id = f'user_brute{i}@company.com'
        base_time = datetime.now() - timedelta(days=i)
        
        # Multiple failed login attempts
        for j in range(8):  # 8 failed attempts
            data.append({
                'user_id': user_id,
                'timestamp': base_time - timedelta(minutes=10-j),
                'action': 'login',
                'source_ip': '192.168.1.100',
                'resource': '/login',
                'status': 'failed'
            })
        # Then one successful login
        data.append({
            'user_id': user_id,
            'timestamp': base_time,
            'action': 'login',
            'source_ip': '192.168.1.100',
            'resource': '/login',
            'status': 'success'
        })
    
    # Anomaly 2: Location Hopping
    print("   Creating location hopping samples...")
    for i in range(num_anomalies // 3):
        user_id = f'user_hopper{i}@company.com'
        base_time = datetime.now() - timedelta(days=i)
        
        # Multiple logins from different IPs in short time
        ips = [
            f'{np.random.randint(100, 200)}.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}'
            for _ in range(6)
        ]
        for j, ip in enumerate(ips):
            data.append({
                'user_id': user_id,
                'timestamp': base_time - timedelta(minutes=60-j*10),
                'action': 'login',
                'source_ip': ip,
                'resource': '/login',
                'status': 'success'
            })
    
    # Anomaly 3: Off-hours Privileged Access
    print("   Creating off-hours access samples...")
    for i in range(num_anomalies // 3):
        user_id = f'user_admin{i}@company.com'
        base_time = datetime.now() - timedelta(days=i)
        
        # Off-hours admin actions
        for hour in [2, 3, 23]:  # Off-hours
            data.append({
                'user_id': user_id,
                'timestamp': base_time.replace(hour=hour),
                'action': 'admin_action',
                'source_ip': f'{np.random.randint(200, 255)}.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}',
                'resource': '/api/admin/users',
                'status': 'success'
            })
    
    return pd.DataFrame(data)

def main():
    print("=" * 60)
    print("🚀 Quick Training: Insider Threat Detection Model")
    print("=" * 60)
    
    # Create training data
    print("\n📂 Step 1: Creating training data...")
    df = create_synthetic_training_data(num_normal=500, num_anomalies=150)
    print(f"✅ Created {len(df)} training samples")
    
    # Extract features
    print("\n🔍 Step 2: Extracting features...")
    extractor = InsiderThreatFeatureExtractor()
    sequences = []
    
    for user_id, user_data in df.groupby('user_id'):
        user_data = user_data.sort_values('timestamp')
        user_events = []
        
        for _, row in user_data.iterrows():
            row_dict = row.to_dict()
            user_history = user_events[-60:] if len(user_events) > 0 else []
            
            # Extract features
            features = extractor.extract_features(row_dict, user_history)
            extractor.update_history(row_dict)
            user_events.append(row_dict)
            
            # Create sequences of 7 timesteps
            if len(user_events) >= 7:
                sequence = []
                for idx in range(len(user_events) - 7, len(user_events)):
                    event = user_events[idx]
                    event_history = user_events[:idx]
                    seq_features = extractor.extract_features(event, event_history[-60:])
                    sequence.append(seq_features)
                sequences.append(sequence)
    
    if len(sequences) == 0:
        print("❌ No sequences created. Need at least 7 events per user.")
        return
    
    X = np.array(sequences)
    print(f"✅ Created {len(X)} sequences")
    print(f"   Shape: {X.shape} (samples={X.shape[0]}, timesteps={X.shape[1]}, features={X.shape[2]})")
    
    # Split data
    print("\n📊 Step 3: Splitting data...")
    X_train, X_test = train_test_split(X, test_size=0.2, random_state=42)
    print(f"✅ Training: {len(X_train)} samples")
    print(f"✅ Test: {len(X_test)} samples")
    
    # Build model
    print("\n🏗️ Step 4: Building model...")
    model = build_insider_threat_model(
        input_timesteps=X.shape[1],
        input_features=X.shape[2],
        encoding_dim=64
    )
    print("✅ Model built successfully")
    model.summary()
    
    # Train model
    print("\n🎓 Step 5: Training model...")
    print("   This will take 5-15 minutes...")
    
    history = model.fit(
        X_train, X_train,  # Autoencoder: input = target
        validation_data=(X_test, X_test),
        epochs=30,  # Reduced epochs for quick training
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
    
    # Evaluate
    print("\n📊 Step 6: Evaluating model...")
    train_pred = model.predict(X_train, verbose=0)
    train_error = np.mean(np.square(X_train - train_pred), axis=(1, 2))
    
    test_pred = model.predict(X_test, verbose=0)
    test_error = np.mean(np.square(X_test - test_pred), axis=(1, 2))
    
    threshold = np.percentile(train_error, 95)
    
    print(f"\n✅ Training Results:")
    print(f"   Mean error: {np.mean(train_error):.6f}")
    print(f"   Std error: {np.std(train_error):.6f}")
    print(f"   95th percentile threshold: {threshold:.6f}")
    
    print(f"\n✅ Test Results:")
    print(f"   Mean error: {np.mean(test_error):.6f}")
    print(f"   Std error: {np.std(test_error):.6f}")
    print(f"   Anomalies detected (>threshold): {np.sum(test_error > threshold)}/{len(test_error)}")
    
    # Save final model
    model_path = 'insider_threat_model.h5'
    model.save(model_path)
    print(f"\n✅ Model saved to: {model_path}")
    
    print("\n" + "=" * 60)
    print("🎉 Training Complete!")
    print("=" * 60)
    print("\n📝 Next Steps:")
    print("1. The model is ready to use in FastAPI")
    print("2. You can upload it via the Models page in the UI")
    print("3. Model file location: backend-fastapi/insider_threat_model.h5")
    print("\n")

if __name__ == "__main__":
    main()

