"""
Insider Threat Detection Module
Detects: Brute Force, Location Hopping, Suspicious Patterns
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from collections import defaultdict
from typing import List, Dict, Optional
from tensorflow import keras


class InsiderThreatFeatureExtractor:
    """
    Enhanced feature extractor for insider threat detection
    Extracts 20 features including brute force and location change indicators
    """
    
    def __init__(self):
        self.user_history = defaultdict(list)
        self.max_history = 100  # Keep last 100 events per user
    
    def extract_features(self, row: Dict, user_history: Optional[List] = None) -> np.ndarray:
        """
        Extract 20 features for insider threat detection
        
        Features:
        0-5: Basic (action, status, time)
        6-11: IP & Location
        12-15: User Behavior (brute force, velocity)
        16-19: Resource & Access
        """
        features = []
        
        # 1. Basic Action Features (0-5)
        action_types = {
            'login': 0, 'access_file': 1, 'download_file': 2,
            'upload_file': 3, 'admin_action': 4, 'execute_script': 5
        }
        action = row.get('action', 'login')
        action_type = action_types.get(action, 0)
        features.append(action_type / 5.0)
        
        # Status
        status_val = 1.0 if row.get('status') == 'success' else 0.0
        features.append(status_val)
        
        # Temporal features
        timestamp_str = row.get('timestamp', datetime.now().isoformat())
        try:
            if isinstance(timestamp_str, str):
                timestamp = pd.to_datetime(timestamp_str)
            else:
                timestamp = timestamp_str
        except:
            timestamp = datetime.now()
        
        hour = timestamp.hour
        day_of_week = timestamp.weekday()
        is_weekend = 1.0 if day_of_week >= 5 else 0.0
        is_off_hours = 1.0 if hour < 8 or hour > 18 else 0.0
        
        features.append(hour / 24.0)
        features.append(day_of_week / 6.0)
        features.append(is_weekend)
        features.append(is_off_hours)
        
        # 2. IP & Location Features (6-11)
        source_ip = str(row.get('source_ip', '0.0.0.0'))
        ip_parts = []
        for part in source_ip.split('.'):
            try:
                ip_parts.append(int(part))
            except:
                ip_parts.append(0)
        
        while len(ip_parts) < 4:
            ip_parts.append(0)
        
        features.append(ip_parts[0] / 255.0)
        features.append(ip_parts[1] / 255.0)
        features.append(ip_parts[2] / 255.0)
        features.append(ip_parts[3] / 255.0)
        
        # Is external IP?
        is_external = 1.0 if not (
            (ip_parts[0] == 192 and ip_parts[1] == 168) or
            (ip_parts[0] == 10) or
            (ip_parts[0] == 172 and 16 <= ip_parts[1] <= 31)
        ) else 0.0
        features.append(is_external)
        
        # Location change score
        if user_history and len(user_history) > 0:
            recent_ips = set([
                str(e.get('source_ip', '')) 
                for e in user_history[-10:]
            ])
            location_change = 1.0 if source_ip not in recent_ips else 0.0
        else:
            location_change = 0.0
        features.append(location_change)
        
        # 3. User Behavior Features (12-15) - BRUTE FORCE DETECTION
        if user_history:
            # Failed attempts in last 10 minutes
            recent_failed = []
            for e in user_history[-20:]:
                try:
                    event_time = pd.to_datetime(e.get('timestamp', timestamp))
                    time_diff = (timestamp - event_time).total_seconds()
                    if (e.get('status') == 'failed' and 
                        time_diff < 600 and 
                        e.get('action') == 'login'):
                        recent_failed.append(e)
                except:
                    pass
            failed_count = len(recent_failed)
        else:
            failed_count = 1 if status_val == 0.0 and action == 'login' else 0
        
        features.append(min(1.0, failed_count / 10.0))  # Brute force indicator
        
        # Login frequency (logins per hour)
        if user_history:
            recent_logins = []
            for e in user_history[-60:]:
                try:
                    event_time = pd.to_datetime(e.get('timestamp', timestamp))
                    time_diff = (timestamp - event_time).total_seconds()
                    if (e.get('action') == 'login' and time_diff < 3600):
                        recent_logins.append(e)
                except:
                    pass
            login_freq = len(recent_logins)
        else:
            login_freq = 1 if action == 'login' else 0
        features.append(min(1.0, login_freq / 20.0))
        
        # Unique IPs in last hour (LOCATION HOPPING DETECTION)
        if user_history:
            recent_ips_set = set()
            for e in user_history[-60:]:
                try:
                    event_time = pd.to_datetime(e.get('timestamp', timestamp))
                    time_diff = (timestamp - event_time).total_seconds()
                    if time_diff < 3600:
                        recent_ips_set.add(str(e.get('source_ip', '')))
                except:
                    pass
            unique_ips = len(recent_ips_set)
        else:
            unique_ips = 1
        features.append(min(1.0, unique_ips / 5.0))  # Location hopping indicator
        
        # Action velocity (actions per minute)
        if user_history:
            recent_actions = []
            for e in user_history[-10:]:
                try:
                    event_time = pd.to_datetime(e.get('timestamp', timestamp))
                    time_diff = (timestamp - event_time).total_seconds()
                    if time_diff < 60:
                        recent_actions.append(e)
                except:
                    pass
            action_vel = len(recent_actions)
        else:
            action_vel = 1
        features.append(min(1.0, action_vel / 10.0))
        
        # 4. Resource & Access Features (16-19)
        resource = str(row.get('resource', ''))
        
        # Resource sensitivity
        sensitive_keywords = ['admin', 'password', 'secret', 'confidential', 'private', 'key']
        resource_sensitivity = 1.0 if any(
            kw in resource.lower() for kw in sensitive_keywords
        ) else 0.0
        features.append(resource_sensitivity)
        
        # Resource access frequency
        if user_history:
            resource_access = len([
                e for e in user_history[-100:]
                if str(e.get('resource', '')) == resource
            ])
        else:
            resource_access = 0
        features.append(min(1.0, resource_access / 100.0))
        
        # Data transfer size
        data_size = row.get('data_size', 0) or row.get('bytes_transferred', 0) or 0
        try:
            data_size = float(data_size)
        except:
            data_size = 0.0
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
        privilege = privilege_map.get(action, 0.1)
        features.append(privilege)
        
        return np.array(features, dtype=np.float32)
    
    def update_history(self, row: Dict):
        """Update user history for context"""
        user_id = row.get('user_id', 'unknown')
        self.user_history[user_id].append(row)
        
        # Keep only last N events
        if len(self.user_history[user_id]) > self.max_history:
            self.user_history[user_id] = self.user_history[user_id][-self.max_history:]
    
    def get_user_history(self, user_id: str, limit: int = 100) -> List[Dict]:
        """Get recent history for a user"""
        return self.user_history.get(user_id, [])[-limit:]


def detect_insider_threat(
    model: keras.Model,
    feature_extractor: InsiderThreatFeatureExtractor,
    recent_events: List[Dict],
    threshold: Optional[float] = None
) -> Dict:
    """
    Detect insider threats from recent events
    
    Args:
        model: Trained LSTM Autoencoder model
        feature_extractor: Feature extractor instance
        recent_events: List of recent events (last 7+ events)
        threshold: Reconstruction error threshold (default: 0.05)
    
    Returns:
        {
            'is_anomaly': bool,
            'anomaly_score': float (0-1),
            'threat_type': str,
            'risk_factors': list,
            'reconstruction_error': float
        }
    """
    if threshold is None:
        threshold = 0.05
    
    # Get user ID from events
    user_id = recent_events[-1].get('user_id', 'unknown') if recent_events else 'unknown'
    user_history = feature_extractor.get_user_history(user_id, limit=100)
    
    # Extract features for last 7 events
    if len(recent_events) < 7:
        # Pad with zeros if not enough events
        features_list = [np.zeros(20, dtype=np.float32)] * (7 - len(recent_events))
        for event in recent_events:
            features_list.append(
                feature_extractor.extract_features(event, user_history)
            )
    else:
        features_list = [
            feature_extractor.extract_features(event, user_history)
            for event in recent_events[-7:]
        ]
    
    # Prepare input sequence
    sequence = np.array([features_list])  # Shape: [1, 7, 20]
    
    # Get reconstruction
    try:
        reconstructed = model.predict(sequence, verbose=0)
        
        # Calculate reconstruction error (MSE)
        mse = np.mean(np.square(sequence - reconstructed))
    except Exception as e:
        # Fallback if model fails
        mse = 0.0
        print(f"Model prediction error: {e}")
    
    # Check for specific threat patterns from latest event
    latest_features = features_list[-1]
    risk_factors = []
    threat_type = None
    
    # Brute force detection (feature 12: failed_attempts_count)
    if latest_features[12] > 0.5:  # More than 5 failed attempts
        risk_factors.append(f"Brute force attack detected ({int(latest_features[12] * 10)} failed attempts)")
        threat_type = "brute_force"
    
    # Location hopping (feature 14: unique_ips_last_hour)
    if latest_features[14] > 0.6:  # More than 3 unique IPs
        risk_factors.append(f"Location hopping detected ({int(latest_features[14] * 5)} unique IPs in last hour)")
        threat_type = "location_hopping"
    
    # Off-hours privileged access
    if latest_features[5] > 0.5 and latest_features[19] > 0.7:  # Off-hours + high privilege
        risk_factors.append("Off-hours privileged access detected")
        if threat_type is None:
            threat_type = "off_hours_access"
    
    # High action velocity (feature 15: action_velocity)
    if latest_features[15] > 0.7:  # More than 7 actions per minute
        risk_factors.append(f"Unusual activity velocity ({int(latest_features[15] * 10)} actions/min)")
        if threat_type is None:
            threat_type = "rapid_activity"
    
    # External IP with sensitive resource
    if latest_features[10] > 0.5 and latest_features[16] > 0.5:  # External IP + sensitive resource
        risk_factors.append("External IP accessing sensitive resource")
        if threat_type is None:
            threat_type = "external_access"
    
    # Calculate anomaly score
    anomaly_score = min(1.0, mse / threshold) if threshold > 0 else 0.0
    is_anomaly = mse > threshold or len(risk_factors) > 0
    
    return {
        'is_anomaly': bool(is_anomaly),
        'anomaly_score': float(anomaly_score),
        'threat_type': threat_type,
        'risk_factors': risk_factors,
        'reconstruction_error': float(mse),
        'feature_scores': {
            'failed_attempts': float(latest_features[12]),
            'unique_ips': float(latest_features[14]),
            'action_velocity': float(latest_features[15]),
            'off_hours': float(latest_features[5]),
            'external_ip': float(latest_features[10])
        }
    }


def build_insider_threat_model(
    input_timesteps: int = 7,
    input_features: int = 20,
    encoding_dim: int = 64
) -> keras.Model:
    """
    Build LSTM Autoencoder for insider threat detection
    
    Args:
        input_timesteps: Number of timesteps (default: 7)
        input_features: Number of features per timestep (default: 20)
        encoding_dim: Encoded representation dimension (default: 64)
    
    Returns:
        Compiled Keras model
    """
    from tensorflow.keras import layers
    
    # Input layer
    input_layer = layers.Input(shape=(input_timesteps, input_features))
    
    # Encoder
    encoder = layers.LSTM(128, return_sequences=True)(input_layer)
    encoder = layers.Dropout(0.2)(encoder)
    encoder = layers.LSTM(64, return_sequences=True)(encoder)
    encoder = layers.Dropout(0.2)(encoder)
    encoder = layers.LSTM(32, return_sequences=False)(encoder)
    
    # Bottleneck
    encoded = layers.Dense(encoding_dim, activation='relu')(encoder)
    
    # Decoder
    decoder = layers.RepeatVector(input_timesteps)(encoded)
    decoder = layers.LSTM(32, return_sequences=True)(decoder)
    decoder = layers.Dropout(0.2)(decoder)
    decoder = layers.LSTM(64, return_sequences=True)(decoder)
    decoder = layers.Dropout(0.2)(decoder)
    decoder = layers.LSTM(128, return_sequences=True)(decoder)
    
    # Output layer
    decoder = layers.TimeDistributed(
        layers.Dense(input_features, activation='linear')
    )(decoder)
    
    # Create model
    model = keras.Model(input_layer, decoder)
    
    # Compile
    model.compile(
        optimizer='adam',
        loss='mse',
        metrics=['mae']
    )
    
    return model







