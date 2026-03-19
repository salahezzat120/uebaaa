"""
Feature Extractor for Insider Threat Detection
Based on BEST_INSIDER_THREAT_DETECTION.md patterns
"""

import pandas as pd
import numpy as np
from collections import defaultdict

class InsiderThreatFeatureExtractor:
    """
    Extract features for insider threat detection based on:
    - Brute Force Attacks (Feature #12)
    - Location Hopping (Feature #13)
    - Off-Hours Privileged Access (Feature #14)
    - Data Exfiltration (Feature #16)
    - Privilege Escalation (Feature #19)
    - Unusual Resource Access (Feature #18)
    """
    
    def __init__(self):
        self.user_baselines = defaultdict(lambda: {
            'normal_hours': set(),
            'common_ips': set(),
            'common_resources': set(),
            'privilege_level': 0
        })
        self.user_ip_history = defaultdict(list)
        self.user_failed_logins = defaultdict(list)
        
    def extract_features(self, df):
        """
        Extract 20 features from CERT dataset
        """
        print("🔧 Extracting features...")
        
        # Map CERT columns to our format
        if 'user' in df.columns:
            df['user_id'] = df['user']
        elif 'id' in df.columns:
            df['user_id'] = df['id']
            
        # Handle timestamp
        if 'date' in df.columns and 'time' in df.columns:
            df['timestamp'] = pd.to_datetime(df['date'] + ' ' + df['time'], errors='coerce')
        elif 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
        
        # Handle PC/IP (location)
        if 'pc' in df.columns:
            df['source_ip'] = df['pc']
        elif 'ip' in df.columns:
            df['source_ip'] = df['ip']
        
        # Handle activity/action
        if 'activity' in df.columns:
            df['action'] = df['activity']
        
        # Sort by timestamp
        df = df.sort_values('timestamp').reset_index(drop=True)
        
        # Initialize feature columns
        features = []
        
        for idx, row in df.iterrows():
            user_id = str(row.get('user_id', 'unknown'))
            timestamp = row.get('timestamp')
            source_ip = str(row.get('source_ip', 'unknown'))
            action = str(row.get('action', 'unknown')).lower()
            
            if pd.isna(timestamp):
                continue
                
            # Initialize user history if needed
            if user_id not in self.user_baselines:
                self.user_baselines[user_id] = {
                    'normal_hours': set(),
                    'common_ips': set(),
                    'common_resources': set(),
                    'privilege_level': 0
                }
                self.user_ip_history[user_id] = []
                self.user_failed_logins[user_id] = []
            
            # Feature 1: Action type (encoded)
            action_map = {
                'logon': 0, 'login': 0, 'logoff': 1, 'logout': 1,
                'file': 2, 'email': 3, 'http': 4, 'device': 5
            }
            action_type = action_map.get(action, 5)
            
            # Feature 2: Status (success/failed)
            status = 1 if 'logon' in action or 'success' in action else 0
            
            # Feature 3-6: IP segments (normalized)
            ip_segments = self._parse_ip(source_ip)
            
            # Feature 7: Hour of day (normalized)
            hour = timestamp.hour / 23.0
            
            # Feature 8: Day of week (normalized)
            day_of_week = timestamp.weekday() / 6.0
            
            # Feature 9: User ID hash (normalized)
            user_hash = hash(user_id) % 1000 / 1000.0
            
            # Feature 10: Resource length (if available)
            resource = str(row.get('file', row.get('to', row.get('url', ''))))
            resource_len = len(resource) / 1000.0  # Normalize
            
            # Feature 11: Average IP (normalized)
            avg_ip = sum(ip_segments) / 4.0 if ip_segments else 0.5
            
            # Feature 12: Failed login attempts (last 10 minutes) - BRUTE FORCE
            if 'logoff' in action or 'logout' in action:
                self.user_failed_logins[user_id].append(timestamp)
            # Clean old entries (older than 10 minutes)
            cutoff = timestamp - pd.Timedelta(minutes=10)
            self.user_failed_logins[user_id] = [
                t for t in self.user_failed_logins[user_id] if t > cutoff
            ]
            failed_attempts = len(self.user_failed_logins[user_id]) / 10.0  # Normalize
            
            # Feature 13: Unique IPs per hour - LOCATION HOPPING
            self.user_ip_history[user_id].append((timestamp, source_ip))
            # Clean old entries (older than 1 hour)
            hour_cutoff = timestamp - pd.Timedelta(hours=1)
            self.user_ip_history[user_id] = [
                (t, ip) for t, ip in self.user_ip_history[user_id] if t > hour_cutoff
            ]
            unique_ips = len(set([ip for _, ip in self.user_ip_history[user_id]])) / 10.0  # Normalize
            
            # Feature 14: Off-hours flag - OFF-HOURS PRIVILEGED ACCESS
            is_off_hours = 1 if hour < 0.2 or hour > 0.7 else 0  # Before 5 AM or after 5 PM
            
            # Feature 15: Privilege level (simplified - can be enhanced)
            privilege_level = 1 if 'admin' in action or 'root' in action else 0
            
            # Feature 16: Data transfer size (if available) - DATA EXFILTRATION
            data_size = float(row.get('size', row.get('bytes', 0))) / 100000000.0  # Normalize to 100MB
            
            # Feature 17: Resource sensitivity (simplified)
            sensitive_keywords = ['confidential', 'secret', 'admin', 'root', 'password']
            resource_sensitivity = 1 if any(kw in resource.lower() for kw in sensitive_keywords) else 0
            
            # Feature 18: Unusual resource access - UNUSUAL RESOURCE ACCESS
            if resource and resource not in self.user_baselines[user_id]['common_resources']:
                unusual_resource = 1
            else:
                unusual_resource = 0
            
            # Update baseline (after first 100 events per user)
            user_event_count = len([f for f in features if f[0] == user_id]) if features else 0
            if user_event_count < 100:
                self.user_baselines[user_id]['common_resources'].add(resource)
                self.user_baselines[user_id]['normal_hours'].add(hour)
                self.user_baselines[user_id]['common_ips'].add(source_ip)
            
            # Feature 19: Privilege escalation (sudden jump)
            prev_privilege = self.user_baselines[user_id]['privilege_level']
            privilege_escalation = 1 if privilege_level > prev_privilege else 0
            self.user_baselines[user_id]['privilege_level'] = max(prev_privilege, privilege_level)
            
            # Feature 20: Time since last activity (normalized)
            if user_event_count > 0:
                last_activity = features[-1][1] if features else timestamp
                time_diff = (timestamp - last_activity).total_seconds() / 3600.0  # Hours
            else:
                time_diff = 0
            
            # Combine all features
            feature_vector = [
                action_type, status, *ip_segments, hour, day_of_week, user_hash,
                resource_len, avg_ip, failed_attempts, unique_ips, is_off_hours,
                privilege_level, data_size, resource_sensitivity, unusual_resource,
                privilege_escalation, time_diff
            ]
            
            features.append((user_id, timestamp, feature_vector))
            
            if (idx + 1) % 10000 == 0:
                print(f"  Processed {idx + 1:,} events...")
        
        print(f"✅ Extracted features from {len(features):,} events")
        
        # Convert to DataFrame
        feature_df = pd.DataFrame([
            {'user_id': f[0], 'timestamp': f[1], 'features': f[2]}
            for f in features
        ])
        
        return feature_df
    
    def _parse_ip(self, ip_str):
        """Parse IP address or PC name to 4 segments"""
        # If it's a PC name, hash it to get consistent segments
        if '.' not in ip_str:
            # Hash the string to get 4 numbers
            h = hash(ip_str)
            return [
                abs((h >> 24) & 0xFF) / 255.0,
                abs((h >> 16) & 0xFF) / 255.0,
                abs((h >> 8) & 0xFF) / 255.0,
                abs(h & 0xFF) / 255.0
            ]
        else:
            # Real IP address
            try:
                segments = [int(x) / 255.0 for x in ip_str.split('.')[:4]]
                while len(segments) < 4:
                    segments.append(0.0)
                return segments[:4]
            except:
                return [0.5, 0.5, 0.5, 0.5]



