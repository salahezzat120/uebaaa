"""
Quick test script for risk scoring engine
Run with: python backend/test_risk_scoring.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.risk_scoring import RiskScoringEngine
from datetime import datetime

def test_risk_scoring():
    """Test the risk scoring engine"""
    print("=" * 60)
    print("Risk Scoring Engine Test")
    print("=" * 60)
    
    # Initialize engine
    engine = RiskScoringEngine()
    
    # Test Case 1: High-risk event (admin action at 2 AM)
    print("\n📊 Test Case 1: High-Risk Event")
    print("-" * 60)
    result1 = engine.calculate_risk_score(
        anomaly_scores={'lstm_autoencoder': 0.85},
        user_id='admin@company.com',
        timestamp=datetime(2024, 1, 15, 2, 0, 0),  # 2 AM
        context={
            'action': 'admin_action',
            'source_ip': '203.0.113.1',  # External IP
            'resource': '/api/admin/users',
            'status': 'success'
        }
    )
    print(f"Risk Score: {result1['riskScore']:.2f}")
    print(f"Severity: {result1['severity']}")
    print(f"Confidence: {result1['confidence']:.2f}")
    print(f"Components: {result1['components']}")
    print(f"Risk Factors: {result1['riskFactors']}")
    
    # Test Case 2: Normal event (login during business hours)
    print("\n📊 Test Case 2: Normal Event")
    print("-" * 60)
    result2 = engine.calculate_risk_score(
        anomaly_scores={'lstm_autoencoder': 0.25},
        user_id='user@company.com',
        timestamp=datetime(2024, 1, 15, 10, 0, 0),  # 10 AM
        context={
            'action': 'login',
            'source_ip': '192.168.1.100',  # Internal IP
            'status': 'success'
        }
    )
    print(f"Risk Score: {result2['riskScore']:.2f}")
    print(f"Severity: {result2['severity']}")
    print(f"Confidence: {result2['confidence']:.2f}")
    print(f"Components: {result2['components']}")
    print(f"Risk Factors: {result2['riskFactors']}")
    
    # Test Case 3: Failed authentication
    print("\n📊 Test Case 3: Failed Authentication")
    print("-" * 60)
    result3 = engine.calculate_risk_score(
        anomaly_scores={'lstm_autoencoder': 0.60},
        user_id='user@company.com',
        timestamp=datetime(2024, 1, 15, 14, 0, 0),
        context={
            'action': 'login',
            'source_ip': '192.168.1.100',
            'status': 'failed'  # Failed auth
        }
    )
    print(f"Risk Score: {result3['riskScore']:.2f}")
    print(f"Severity: {result3['severity']}")
    print(f"Confidence: {result3['confidence']:.2f}")
    print(f"Components: {result3['components']}")
    print(f"Risk Factors: {result3['riskFactors']}")
    
    # Test Case 4: Multiple models
    print("\n📊 Test Case 4: Multiple Model Fusion")
    print("-" * 60)
    result4 = engine.calculate_risk_score(
        anomaly_scores={
            'lstm_autoencoder': 0.75,
            'isolation_forest': 0.68,
            'statistical': 0.55
        },
        user_id='user@company.com',
        timestamp=datetime(2024, 1, 15, 15, 0, 0),
        context={
            'action': 'access_file',
            'source_ip': '192.168.1.100',
            'resource': '/sensitive/data.csv',
            'status': 'success'
        }
    )
    print(f"Risk Score: {result4['riskScore']:.2f}")
    print(f"Severity: {result4['severity']}")
    print(f"Confidence: {result4['confidence']:.2f}")
    print(f"Components: {result4['components']}")
    print(f"Risk Factors: {result4['riskFactors']}")
    
    # Test Case 5: User risk score
    print("\n📊 Test Case 5: User Overall Risk Score")
    print("-" * 60)
    # First, generate some history
    for i in range(5):
        engine.calculate_risk_score(
            anomaly_scores={'lstm_autoencoder': 0.5 + i * 0.1},
            user_id='test_user@company.com',
            timestamp=datetime(2024, 1, 15, 10 + i, 0, 0),
            context={'action': 'login', 'status': 'success'}
        )
    
    user_risk = engine.calculate_user_risk_score('test_user@company.com')
    print(f"User Risk Score: {user_risk['riskScore']:.2f}")
    print(f"Risk Trend: {user_risk['riskTrend']:.2f}")
    print(f"Severity: {user_risk['severity']}")
    print(f"Recent Activity: {user_risk['recentActivity']} events")
    
    print("\n" + "=" * 60)
    print("✅ All tests completed!")
    print("=" * 60)

if __name__ == "__main__":
    test_risk_scoring()

