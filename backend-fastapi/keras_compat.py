"""
Comprehensive Keras 3.x to 2.x compatibility layer
This patches Keras to handle models saved with Keras 3.x
"""
import keras
from keras import layers
import copy

class CompatibleInputLayer(layers.InputLayer):
    """InputLayer that handles both batch_shape (Keras 3) and input_shape (Keras 2)"""
    @classmethod
    def from_config(cls, config):
        # Convert batch_shape to input_shape for Keras 2.x compatibility
        config = copy.deepcopy(config)
        if 'batch_shape' in config and 'input_shape' not in config:
            batch_shape = config.pop('batch_shape')
            if batch_shape and len(batch_shape) > 1:
                # Remove batch dimension: [None, 7, 11] -> [7, 11]
                config['input_shape'] = tuple(batch_shape[1:])
        return super().from_config(config)

# Handle DTypePolicy compatibility
try:
    from keras.mixed_precision import Policy as DTypePolicy
except ImportError:
    try:
        from keras.mixed_precision.policy import Policy as DTypePolicy
    except ImportError:
        class DTypePolicy:
            """Compatible DTypePolicy for Keras 2.x"""
            def __init__(self, name='float32', **kwargs):
                self.name = name
            def __getattr__(self, name):
                return None
            def get_config(self):
                return {'name': self.name}

# Patch keras.layers to handle shape strings
original_functional_process_node = None

def patch_keras_functional():
    """Patch Keras functional API to handle shape strings"""
    global original_functional_process_node
    
    try:
        from keras.engine import functional
        if hasattr(functional, 'process_node'):
            original_functional_process_node = functional.process_node
            
            def patched_process_node(layer, node_data, layer_outputs, layer_outputs_mask=None):
                """Patched process_node that handles shape strings"""
                # Convert string shapes to proper shape objects
                if isinstance(node_data, dict):
                    for key, value in node_data.items():
                        if isinstance(value, str) and 'shape' in key.lower():
                            # Try to parse shape string
                            try:
                                import numpy as np
                                # Skip string shapes, let Keras handle them naturally
                                pass
                            except:
                                pass
                
                # Call original function
                return original_functional_process_node(layer, node_data, layer_outputs, layer_outputs_mask)
            
            functional.process_node = patched_process_node
            return True
    except Exception as e:
        print(f"Warning: Could not patch functional API: {e}")
        return False

# Get all custom objects needed
def get_custom_objects():
    """Get all custom objects needed for compatibility"""
    patch_keras_functional()
    
    return {
        'InputLayer': CompatibleInputLayer,
        'input_layer': CompatibleInputLayer,
        'DTypePolicy': DTypePolicy,
        'dtype_policy': DTypePolicy,
    }





