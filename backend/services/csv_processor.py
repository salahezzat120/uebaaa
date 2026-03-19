"""
CSV Processing Service
Handles CSV parsing and row-by-row processing
"""

import csv
import io
from typing import List, Dict, Any
from datetime import datetime
from services.model_inference import ModelInferenceService
from services.risk_scoring import RiskScoringEngine

class CSVProcessorService:
    def __init__(self):
        self.model_service = ModelInferenceService()
        self.model_service.load_model()
        self.risk_engine = RiskScoringEngine()
        self.feature_window: List[List[float]] = []
    
    def _extract_features(self, row: Dict[str, str]) -> List[float]:
        """Extract features from CSV row"""
        # Action types
        action_types = {
            'login': 0,
            'access_file': 1,
            'download_file': 2,
            'upload_file': 3,
            'admin_action': 4,
            'execute_script': 5,
        }
        
        # Status types
        status_types = {
            'success': 1,
            'failed': 0,
        }
        
        # Extract IP address segments
        ip_parts = row.get('source_ip', '0.0.0.0').split('.')
        ip1 = float(ip_parts[0]) if len(ip_parts) > 0 and ip_parts[0].isdigit() else 0.0
        ip2 = float(ip_parts[1]) if len(ip_parts) > 1 and ip_parts[1].isdigit() else 0.0
        ip3 = float(ip_parts[2]) if len(ip_parts) > 2 and ip_parts[2].isdigit() else 0.0
        ip4 = float(ip_parts[3]) if len(ip_parts) > 3 and ip_parts[3].isdigit() else 0.0
        
        # Extract hour from timestamp
        hour = 0
        try:
            timestamp = row.get('timestamp', '')
            if ' ' in timestamp:
                time_part = timestamp.split(' ')[1]
                hour = int(time_part.split(':')[0])
        except:
            pass
        
        # User ID hash
        user_id = row.get('user_id', '')
        user_hash = sum(ord(c) for c in user_id) % 100
        
        # Resource length
        resource_length = len(row.get('resource', ''))
        
        # Return 11 features to match model input
        return [
            float(action_types.get(row.get('action', ''), 0)),
            float(status_types.get(row.get('status', ''), 0)),
            ip1 / 255.0,
            ip2 / 255.0,
            ip3 / 255.0,
            ip4 / 255.0,
            hour / 24.0,
            user_hash / 100.0,
            resource_length / 100.0,
            (ip1 + ip2 + ip3 + ip4) / (255.0 * 4),  # Average IP
            min(1.0, resource_length / 200.0),  # Normalized resource length
        ]
    
    async def process_file(self, file_content: bytes, rows_per_second: float = 1.0) -> Dict[str, Any]:
        """Process CSV file and return results"""
        # Parse CSV
        text = file_content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(text))
        rows = list(reader)
        
        processed_rows = []
        anomalies_detected = 0
        total_anomaly_score = 0.0
        
        # Process each row
        for idx, row in enumerate(rows, start=1):
            features = self._extract_features(row)
            
            # Add to feature window (for LSTM sequence)
            self.feature_window.append(features)
            if len(self.feature_window) > 7:
                self.feature_window.pop(0)
            
            # Pad if needed (model needs 7 timesteps)
            sequence = self.feature_window.copy()
            if len(sequence) < 7:
                padding = [sequence[0]] * (7 - len(sequence))
                sequence = padding + sequence
            
            # Run inference
            prediction = await self.model_service.predict(sequence)
            
            # Calculate comprehensive risk score
            user_id = row.get('user_id', '')
            timestamp_str = row.get('timestamp', '')
            try:
                if ' ' in timestamp_str:
                    event_timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
                else:
                    event_timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            except:
                event_timestamp = datetime.utcnow()
            
            # Prepare context for risk scoring
            context = {
                'action': row.get('action', ''),
                'source_ip': row.get('source_ip', ''),
                'resource': row.get('resource', ''),
                'status': row.get('status', '')
            }
            
            # Calculate risk score using the engine
            anomaly_scores = {
                'lstm_autoencoder': prediction['anomalyScore']
            }
            
            risk_result = self.risk_engine.calculate_risk_score(
                anomaly_scores=anomaly_scores,
                user_id=user_id,
                timestamp=event_timestamp,
                context=context
            )
            
            # Create processed row with risk score
            processed_row = {
                "rowNumber": idx,
                "user_id": user_id,
                "timestamp": timestamp_str,
                "action": row.get('action', ''),
                "source_ip": row.get('source_ip', ''),
                "resource": row.get('resource', ''),
                "status": row.get('status', ''),
                "anomalyScore": prediction['anomalyScore'],
                "isAnomaly": prediction['isAnomaly'],
                "riskScore": risk_result['riskScore'],
                "riskSeverity": risk_result['severity'],
                "riskConfidence": risk_result['confidence'],
                "riskFactors": risk_result['riskFactors'],
                "processedAt": datetime.utcnow().isoformat()
            }
            
            processed_rows.append(processed_row)
            
            if prediction['isAnomaly']:
                anomalies_detected += 1
            
            total_anomaly_score += prediction['anomalyScore']
        
        # Calculate stats
        avg_anomaly_score = total_anomaly_score / len(processed_rows) if processed_rows else 0.0
        
        return {
            "totalRows": len(rows),
            "processedRows": len(processed_rows),
            "anomaliesDetected": anomalies_detected,
            "averageAnomalyScore": avg_anomaly_score,
            "processingRate": rows_per_second,
            "rows": processed_rows
        }

