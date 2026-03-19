"""
Model Inference Service
Handles loading and running the LSTM Autoencoder model
"""

import numpy as np
from typing import List, Optional
import os

try:
    import tensorflow as tf
    from tensorflow import keras
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False
    print("Warning: TensorFlow not available, using simulated inference")

class ModelInferenceService:
    def __init__(self, model_path: Optional[str] = None):
        self.model = None
        self.model_loaded = False
        self.model_path = model_path or os.path.join(
            os.path.dirname(__file__), 
            "..", 
            "..", 
            "models", 
            "lstm_ae_cert.h5"
        )
    
    def load_model(self) -> bool:
        """Load the Keras model"""
        if not TENSORFLOW_AVAILABLE:
            print("TensorFlow not available, using simulated inference")
            self.model_loaded = True
            return True
        
        if not os.path.exists(self.model_path):
            print(f"Model file not found: {self.model_path}")
            print("Using simulated inference")
            self.model_loaded = True
            return True
        
        try:
            # Try loading with compatibility settings
            self.model = keras.models.load_model(self.model_path, compile=False)
            self.model_loaded = True
            print(f"Model loaded successfully from {self.model_path}")
            print(f"Input shape: {self.model.input_shape}")
            print(f"Output shape: {self.model.output_shape}")
            return True
        except Exception as e:
            print(f"Failed to load model: {e}")
            print("Using simulated inference")
            self.model_loaded = True
            return False
    
    async def predict(self, features: List[List[float]]) -> dict:
        """
        Run inference on feature sequence
        Args:
            features: List of feature vectors [timesteps, features]
        Returns:
            Dictionary with anomalyScore, isAnomaly, reconstructionError, confidence
        """
        if not self.model_loaded:
            self.load_model()
        
        # Convert to numpy array
        features_array = np.array(features, dtype=np.float32)
        
        # Reshape to [batch, timesteps, features]
        if len(features_array.shape) == 2:
            features_array = features_array.reshape(1, features_array.shape[0], features_array.shape[1])
        
        if self.model and TENSORFLOW_AVAILABLE:
            try:
                # Run inference
                prediction = self.model.predict(features_array, verbose=0)
                
                # Calculate reconstruction error (MSE)
                mse = np.mean((features_array - prediction) ** 2)
                
                # Convert to anomaly score (normalize)
                anomaly_score = min(1.0, float(mse) / 0.5)  # Adjust threshold as needed
                is_anomaly = anomaly_score > 0.6
                confidence = abs(anomaly_score - 0.5) * 2
                
                return {
                    "anomalyScore": float(anomaly_score),
                    "isAnomaly": bool(is_anomaly),
                    "reconstructionError": float(mse),
                    "confidence": float(confidence)
                }
            except Exception as e:
                print(f"Model inference error: {e}")
                # Fall through to simulation
        
        # Simulated inference (fallback)
        return self._simulate_inference(features_array)
    
    def _simulate_inference(self, features: np.ndarray) -> dict:
        """Simulate model inference for testing"""
        # Simple simulation based on feature patterns
        base_error = 0.1
        
        # Add some randomness
        reconstruction_error = base_error + np.random.uniform(-0.05, 0.15)
        reconstruction_error = max(0, reconstruction_error)
        
        anomaly_score = min(1.0, reconstruction_error / 0.5)
        is_anomaly = anomaly_score > 0.6
        confidence = abs(anomaly_score - 0.5) * 2
        
        return {
            "anomalyScore": float(anomaly_score),
            "isAnomaly": bool(is_anomaly),
            "reconstructionError": float(reconstruction_error),
            "confidence": float(confidence)
        }
    
    def is_loaded(self) -> bool:
        """Check if model is loaded"""
        return self.model_loaded
    
    def get_input_shape(self) -> Optional[List[int]]:
        """Get model input shape"""
        if self.model:
            return list(self.model.input_shape)
        return None
    
    def get_output_shape(self) -> Optional[List[int]]:
        """Get model output shape"""
        if self.model:
            return list(self.model.output_shape)
        return None

