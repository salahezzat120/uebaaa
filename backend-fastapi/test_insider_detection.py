"""
Test Insider Threat Detection
Tests: Brute Force, Location Hopping, Off-hours Access
"""

import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from insider_threat_detector import (
    InsiderThreatFeatureExtractor,
    detect_insider_threat
)
from tensorflow import keras

def test_brute_force():
    """Test brute force detection"""
    print("\n" + "=" * 60)
    print("🧪 Test 1: Brute Force Attack")
    print("=" * 60)
    
    # Load model (try both)
    model = None
    model_paths = [
        'insider_threat_model.h5',
        '../models/lstm_ae_cert.h5',
        'models/lstm_ae_cert.h5'
    ]
    
    for path in model_paths:
        if os.path.exists(path):
            try:
                model = keras.models.load_model(path)
                print(f"✅ Loaded model from: {path}")
                break
            except Exception as e:
                print(f"⚠️ Could not load {path}: {e}")
    
    if model is None:
        print("❌ No model found. Please train a model first or ensure model file exists.")
        return
    
    # Initialize extractor
    extractor = InsiderThreatFeatureExtractor()
    
    # Create brute force scenario: 10 failed logins in 5 minutes
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
        extractor.update_history(events[-1])
    
    print(f"\n📊 Scenario: {len(events)} failed login attempts in 5 minutes")
    
    # Detect
    result = detect_insider_threat(model, extractor, events)
    
    print(f"\n✅ Results:")
    print(f"   Anomaly: {result['is_anomaly']}")
    print(f"   Threat Type: {result['threat_type']}")
    print(f"   Anomaly Score: {result['anomaly_score']:.2f}")
    print(f"   Risk Factors: {result['risk_factors']}")
    print(f"   Failed Attempts Feature: {result['feature_scores']['failed_attempts']:.2f}")
    
    if result['threat_type'] == 'brute_force':
        print("\n✅ ✅ ✅ BRUTE FORCE DETECTED CORRECTLY!")
    else:
        print("\n⚠️ Brute force not detected. Check thresholds.")

def test_location_hopping():
    """Test location hopping detection"""
    print("\n" + "=" * 60)
    print("🧪 Test 2: Location Hopping")
    print("=" * 60)
    
    # Load model
    model = None
    model_paths = [
        'insider_threat_model.h5',
        '../models/lstm_ae_cert.h5',
        'models/lstm_ae_cert.h5'
    ]
    
    for path in model_paths:
        if os.path.exists(path):
            try:
                model = keras.models.load_model(path)
                break
            except:
                pass
    
    if model is None:
        print("❌ No model found.")
        return
    
    extractor = InsiderThreatFeatureExtractor()
    
    # Create location hopping scenario: 5 logins from different IPs in 1 hour
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
        extractor.update_history(events[-1])
    
    print(f"\n📊 Scenario: {len(events)} logins from {len(ips)} different IPs in 1 hour")
    
    # Detect
    result = detect_insider_threat(model, extractor, events)
    
    print(f"\n✅ Results:")
    print(f"   Anomaly: {result['is_anomaly']}")
    print(f"   Threat Type: {result['threat_type']}")
    print(f"   Anomaly Score: {result['anomaly_score']:.2f}")
    print(f"   Risk Factors: {result['risk_factors']}")
    print(f"   Unique IPs Feature: {result['feature_scores']['unique_ips']:.2f}")
    
    if result['threat_type'] == 'location_hopping':
        print("\n✅ ✅ ✅ LOCATION HOPPING DETECTED CORRECTLY!")
    else:
        print("\n⚠️ Location hopping not detected. Check thresholds.")

def test_off_hours():
    """Test off-hours privileged access"""
    print("\n" + "=" * 60)
    print("🧪 Test 3: Off-Hours Privileged Access")
    print("=" * 60)
    
    # Load model
    model = None
    model_paths = [
        'insider_threat_model.h5',
        '../models/lstm_ae_cert.h5',
        'models/lstm_ae_cert.h5'
    ]
    
    for path in model_paths:
        if os.path.exists(path):
            try:
                model = keras.models.load_model(path)
                break
            except:
                pass
    
    if model is None:
        print("❌ No model found.")
        return
    
    extractor = InsiderThreatFeatureExtractor()
    
    # Create off-hours admin action
    events = [{
        'user_id': 'admin@company.com',
        'timestamp': datetime.now().replace(hour=2, minute=0, second=0).isoformat(),  # 2 AM
        'action': 'admin_action',
        'source_ip': '203.0.113.1',  # External IP
        'resource': '/api/admin/users',
        'status': 'success'
    }]
    
    # Need at least 7 events, pad with normal events
    for i in range(6):
        events.insert(0, {
            'user_id': 'admin@company.com',
            'timestamp': (datetime.now().replace(hour=2) - timedelta(hours=1-i)).isoformat(),
            'action': 'login',
            'source_ip': '192.168.1.100',
            'resource': '/login',
            'status': 'success'
        })
    
    for event in events:
        extractor.update_history(event)
    
    print(f"\n📊 Scenario: Admin action at 2 AM from external IP")
    
    # Detect
    result = detect_insider_threat(model, extractor, events)
    
    print(f"\n✅ Results:")
    print(f"   Anomaly: {result['is_anomaly']}")
    print(f"   Threat Type: {result['threat_type']}")
    print(f"   Anomaly Score: {result['anomaly_score']:.2f}")
    print(f"   Risk Factors: {result['risk_factors']}")
    print(f"   Off-hours Feature: {result['feature_scores']['off_hours']:.2f}")
    print(f"   External IP Feature: {result['feature_scores']['external_ip']:.2f}")
    
    if result['is_anomaly']:
        print("\n✅ ✅ ✅ OFF-HOURS THREAT DETECTED!")
    else:
        print("\n⚠️ Off-hours threat not detected. Check thresholds.")

def main():
    print("=" * 60)
    print("🧪 Insider Threat Detection Tests")
    print("=" * 60)
    
    # Run tests
    test_brute_force()
    test_location_hopping()
    test_off_hours()
    
    print("\n" + "=" * 60)
    print("✅ All Tests Complete!")
    print("=" * 60)
    print("\n📝 Next Steps:")
    print("1. Review test results")
    print("2. Adjust thresholds if needed")
    print("3. Integrate into FastAPI")
    print("4. Test with real data")
    print("\n")

if __name__ == "__main__":
    main()






