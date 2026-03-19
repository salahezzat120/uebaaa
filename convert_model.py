#!/usr/bin/env python
"""
Convert Keras H5 model to TensorFlow.js format
This script works around the tensorflow-decision-forests dependency issue
"""
import os
import sys

# Make tensorflow-decision-forests import optional
try:
    import tensorflow_decision_forests
except ImportError:
    # Create a dummy module if it doesn't exist
    class DummyModule:
        pass
    sys.modules['tensorflow_decision_forests'] = DummyModule()

# Now import tensorflowjs and keras
import tensorflow as tf
from tensorflow import keras
from keras.layers import InputLayer

# Create compatibility wrappers for older Keras versions
class CompatibleInputLayer(InputLayer):
    """InputLayer that handles both batch_shape (old) and input_shape (new)"""
    @classmethod
    def from_config(cls, config):
        # Convert batch_shape to input_shape for compatibility
        if 'batch_shape' in config and 'input_shape' not in config:
            batch_shape = config.pop('batch_shape')
            if batch_shape and len(batch_shape) > 1:
                # Remove batch dimension
                config['input_shape'] = batch_shape[1:]
        return super().from_config(config)

# Use actual Keras DTypePolicy for compatibility
try:
    from keras.mixed_precision import Policy as DTypePolicy
except ImportError:
    try:
        from keras.mixed_precision.policy import Policy as DTypePolicy
    except ImportError:
        # Fallback compatibility
        class CompatibleDTypePolicy:
            def __init__(self, *args, **kwargs):
                self.name = kwargs.get('name', 'float32')
            def __getattr__(self, name):
                return None
        DTypePolicy = CompatibleDTypePolicy

def convert_model(input_path, output_path):
    """Convert Keras H5 model to TensorFlow.js format"""
    print(f"Converting {input_path} to {output_path}...")
    
    # Create output directory if it doesn't exist
    os.makedirs(output_path, exist_ok=True)
    
    # Load the Keras model with compatibility settings
    print("Loading Keras model with compatibility layer...")
    try:
        # Use custom_objects to handle compatibility with older Keras versions
        custom_objects = {
            'InputLayer': CompatibleInputLayer,
            'input_layer': CompatibleInputLayer,
            'DTypePolicy': DTypePolicy,
            'dtype_policy': DTypePolicy,
        }
        
        # Also try with safe_mode=False for older models
        try:
            model = keras.models.load_model(
                input_path, 
                compile=False, 
                custom_objects=custom_objects,
                safe_mode=False
            )
        except TypeError:
            # safe_mode might not be available in this version
            model = keras.models.load_model(
                input_path, 
                compile=False, 
                custom_objects=custom_objects
            )
        model = keras.models.load_model(input_path, compile=False, custom_objects=custom_objects)
        print(f"Model loaded successfully!")
        print(f"Model input shape: {model.input_shape}")
        print(f"Model output shape: {model.output_shape}")
    except Exception as e:
        print(f"Error loading model: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    # Convert using tensorflowjs converter
    print("Converting to TensorFlow.js format...")
    from tensorflowjs.converters import save_keras_model
    save_keras_model(model, output_path)
    
    print(f"Conversion complete! Model saved to {output_path}")
    print(f"Files created:")
    for file in os.listdir(output_path):
        print(f"  - {file}")

if __name__ == "__main__":
    input_model = "models/lstm_ae_cert.h5"
    output_dir = "public/models"
    
    if not os.path.exists(input_model):
        print(f"Error: Model file not found: {input_model}")
        sys.exit(1)
    
    convert_model(input_model, output_dir)
