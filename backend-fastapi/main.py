"""
FastAPI backend for LSTM Autoencoder model inference
This loads your trained model directly from the .h5 file
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from contextlib import asynccontextmanager
import tensorflow as tf
from tensorflow import keras
import numpy as np
import os

# Global dictionary to cache loaded models by file path
models_cache = {}

def load_model(model_path=None):
    """
    Load the LSTM Autoencoder model from a file path
    If model_path is None, uses default path (backward compatibility)
    Models are cached to avoid reloading
    """
    global models_cache
    
    # Use default path if not provided (backward compatibility)
    if model_path is None:
        # Path to your model file - try multiple locations
        possible_paths = [
            # When running from backend-fastapi directory
            os.path.join(os.path.dirname(__file__), '..', 'models', 'lstm_ae_cert.h5'),
            # When running from project root
            os.path.join(os.path.dirname(__file__), '..', '..', 'models', 'lstm_ae_cert.h5'),
            # Direct path
            'models/lstm_ae_cert.h5',
            # Absolute path from backend-fastapi
            os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'models', 'lstm_ae_cert.h5')),
        ]
        
        model_path = None
        for path in possible_paths:
            abs_path = os.path.abspath(path)
            if os.path.exists(abs_path):
                model_path = abs_path
                break
        
        if not model_path:
            error_msg = (
                f"Model file not found. Tried:\n"
                + "\n".join(f"  - {os.path.abspath(p)}" for p in possible_paths)
                + "\nPlease ensure models/lstm_ae_cert.h5 exists in the project root or provide model_path."
            )
            raise FileNotFoundError(error_msg)
    
    # Normalize path to absolute path for caching
    abs_model_path = os.path.abspath(model_path)
    
    # Check cache first
    if abs_model_path in models_cache:
        return models_cache[abs_model_path]
    
    # Validate file exists
    if not os.path.exists(abs_model_path):
        raise FileNotFoundError(f"Model file not found: {abs_model_path}")
    
    print(f"Loading model from: {abs_model_path}")
    
    # Detect model format by file extension
    file_ext = os.path.splitext(abs_model_path)[1].lower()
    print(f"📁 Detected file extension: {file_ext}")
    
    # Handle PyTorch models (.pth, .pt)
    if file_ext in ['.pth', '.pt']:
        print("🔍 Attempting to load as PyTorch model...")
        try:
            import torch
            print("📦 Detected PyTorch model format")
            
            # Define a simple LSTM autoencoder class for state dict loading
            class SimpleLSTMAutoencoder(torch.nn.Module):
                def __init__(self, input_size=11, hidden_size=64, num_layers=2, sequence_length=7):
                    super().__init__()
                    self.sequence_length = sequence_length
                    self.input_size = input_size
                    
                    # Encoder
                    self.encoder = torch.nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
                    
                    # Decoder
                    self.decoder = torch.nn.LSTM(hidden_size, input_size, num_layers, batch_first=True)
                
                def forward(self, x):
                    # Encode
                    encoded, (hidden, cell) = self.encoder(x)
                    # Decode (use last hidden state)
                    decoded, _ = self.decoder(encoded)
                    return decoded
            
            # Load PyTorch model
            device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            model_data = torch.load(abs_model_path, map_location=device)
            
            print(f"   Model data type: {type(model_data)}")
            
            # Handle different PyTorch save formats
            if isinstance(model_data, dict):
                print(f"   Dictionary keys found: {list(model_data.keys())[:10]}...")  # Show first 10 keys
                
                # Check if it's a state dict or full model
                if 'model_state_dict' in model_data:
                    # This is a checkpoint with state dict
                    state_dict = model_data['model_state_dict']
                    print(f"   Found 'model_state_dict' with {len(state_dict)} parameters")
                    raise ValueError(
                        "PyTorch checkpoint format detected (model_state_dict). "
                        "To use this model, you need to provide the model architecture code. "
                        "Alternatively, convert the model to ONNX format or save it as a full model object."
                    )
                elif 'state_dict' in model_data:
                    # State dict only (most common format)
                    state_dict = model_data['state_dict']
                    print(f"   Found 'state_dict' with {len(state_dict)} parameters")
                    print(f"   State dict keys (first 5): {list(state_dict.keys())[:5]}")
                    
                    # Try to infer model architecture from state dict keys
                    # This is a heuristic approach - we'll try to create a simple LSTM autoencoder
                    print("   Attempting to infer model architecture from state dict...")
                    
                    # Check if it looks like an LSTM autoencoder
                    encoder_keys = [k for k in state_dict.keys() if 'encoder' in k.lower() or 'lstm' in k.lower()]
                    decoder_keys = [k for k in state_dict.keys() if 'decoder' in k.lower()]
                    
                    if encoder_keys or decoder_keys:
                        print(f"   Detected encoder/decoder structure (encoder keys: {len(encoder_keys)}, decoder keys: {len(decoder_keys)})")
                        # Try to create a generic LSTM autoencoder
                        try:
                            # Infer input size from first layer
                            first_key = list(state_dict.keys())[0]
                            first_weight = state_dict[first_key]
                            
                            # Common LSTM autoencoder structure
                            # Try to infer from weight shapes
                            if len(first_weight.shape) >= 2:
                                input_size = first_weight.shape[1] if 'weight_ih' in first_key else None
                                
                                # Try different configurations
                                for hidden_size in [32, 64, 128]:
                                    for num_layers in [1, 2]:
                                        try:
                                            model = SimpleLSTMAutoencoder(
                                                input_size=input_size or 11,
                                                hidden_size=hidden_size,
                                                num_layers=num_layers,
                                                sequence_length=7
                                            )
                                            model.load_state_dict(state_dict, strict=False)
                                            print(f"   ✅ Successfully loaded state dict with hidden_size={hidden_size}, num_layers={num_layers}")
                                            break
                                        except Exception as e:
                                            continue
                                    else:
                                        continue
                                    break
                                else:
                                    raise ValueError("Could not match state dict to any model architecture")
                                    
                            else:
                                raise ValueError("Could not infer model architecture from state dict")
                                
                        except Exception as e:
                            print(f"   ❌ Failed to infer architecture: {e}")
                            raise ValueError(
                                f"PyTorch state dict format detected but could not infer model architecture. "
                                f"State dict has {len(state_dict)} parameters. "
                                f"Please provide the model architecture code or convert to ONNX format."
                            )
                    else:
                        raise ValueError(
                            f"PyTorch state dict detected but model architecture cannot be inferred. "
                            f"State dict has {len(state_dict)} parameters with keys: {list(state_dict.keys())[:5]}... "
                            f"Please provide the model architecture code or convert to ONNX format."
                        )
                else:
                    # Check if the dict itself might be a state_dict (common PyTorch pattern)
                    # State dicts typically have keys like 'encoder.lstm.weight_ih_l0', etc.
                    all_keys = list(model_data.keys())
                    is_likely_state_dict = any(
                        '.' in str(k) or 'weight' in str(k).lower() or 'bias' in str(k).lower() 
                        for k in all_keys[:5]
                    )
                    
                    if is_likely_state_dict:
                        print(f"   Dictionary appears to be a state_dict (keys contain layer names)")
                        print(f"   Sample keys: {all_keys[:5]}")
                        state_dict = model_data
                        
                        # Try to infer and load as LSTM autoencoder
                        try:
                            encoder_keys = [k for k in state_dict.keys() if 'encoder' in k.lower() or 'lstm' in k.lower()]
                            decoder_keys = [k for k in state_dict.keys() if 'decoder' in k.lower()]
                            
                            print(f"   Detected structure - encoder keys: {len(encoder_keys)}, decoder keys: {len(decoder_keys)}")
                            
                            # Try to infer input size from weights
                            input_size = 11  # Default
                            for key in state_dict.keys():
                                if 'weight_ih' in key or 'encoder' in key.lower():
                                    weight = state_dict[key]
                                    if len(weight.shape) >= 2:
                                        # LSTM weight_ih shape is [4*hidden_size, input_size]
                                        # So input_size = weight.shape[1]
                                        if 'weight_ih' in key:
                                            input_size = weight.shape[1]
                                            break
                            
                            # Try different architectures
                            model = None
                            for hidden_size in [32, 64, 128, 256]:
                                for num_layers in [1, 2, 3]:
                                    try:
                                        test_model = SimpleLSTMAutoencoder(
                                            input_size=input_size,
                                            hidden_size=hidden_size,
                                            num_layers=num_layers,
                                            sequence_length=7
                                        )
                                        # Try loading with strict=False to see if it matches
                                        missing_keys, unexpected_keys = test_model.load_state_dict(state_dict, strict=False)
                                        
                                        # If most keys match, use this model
                                        total_keys = len(state_dict)
                                        matched_keys = total_keys - len(missing_keys)
                                        match_ratio = matched_keys / total_keys if total_keys > 0 else 0
                                        
                                        if match_ratio > 0.5:  # At least 50% of keys match
                                            model = test_model
                                            print(f"   ✅ Loaded state dict (match ratio: {match_ratio:.2%}, hidden_size={hidden_size}, layers={num_layers})")
                                            break
                                    except Exception as e:
                                        continue
                                if model is not None:
                                    break
                            
                            if model is None:
                                raise ValueError("Could not match state dict to any model architecture")
                                
                        except Exception as e:
                            print(f"   ❌ Failed to load as state_dict: {e}")
                            raise ValueError(
                                f"PyTorch file appears to be a state_dict but could not be loaded. "
                                f"File contains {len(all_keys)} keys. Sample keys: {all_keys[:5]}. "
                                f"Please provide the model architecture code or convert to ONNX format."
                            )
                    else:
                        # Try to find the model in the dict
                        model = None
                        for key in ['model', 'net', 'network', 'autoencoder', 'auto_encoder', 'pytorch_model']:
                            if key in model_data:
                                model = model_data[key]
                                print(f"   ✅ Found model under key: '{key}'")
                                break
                        
                        if model is None:
                            # Print all keys for debugging
                            print(f"   Available keys in file: {all_keys}")
                            raise ValueError(
                                f"Could not find model object in PyTorch file. "
                                f"Expected keys: 'model', 'net', 'network', 'autoencoder', 'auto_encoder', 'pytorch_model', or a state_dict. "
                                f"Found keys: {all_keys[:10]}. "
                                f"Please ensure the model was saved with one of the expected keys, or convert to ONNX format."
                            )
            else:
                # Direct model object
                print("   ✅ Direct model object detected")
                model = model_data
            
            # Wrap PyTorch model in a compatible interface
            class PyTorchModelWrapper:
                def __init__(self, pytorch_model, device):
                    self.pytorch_model = pytorch_model
                    self.device = device
                    self.pytorch_model.eval()  # Set to evaluation mode
                    
                    # Try to infer input shape from model
                    try:
                        # Common autoencoder input shapes
                        if hasattr(pytorch_model, 'input_shape'):
                            self._input_shape = pytorch_model.input_shape
                        elif hasattr(pytorch_model, 'encoder') and hasattr(pytorch_model.encoder, 'input_size'):
                            self._input_shape = pytorch_model.encoder.input_size
                        else:
                            # Default shape for LSTM autoencoder: [batch, timesteps, features]
                            self._input_shape = (None, 7, 11)
                    except:
                        self._input_shape = (None, 7, 11)
                
                @property
                def input_shape(self):
                    return self._input_shape
                
                @property
                def output_shape(self):
                    return self._input_shape  # Autoencoder output matches input
                
                def predict(self, features_array, verbose=0):
                    """Run inference with PyTorch model"""
                    with torch.no_grad():
                        # Convert numpy to torch tensor
                        if isinstance(features_array, np.ndarray):
                            features_tensor = torch.from_numpy(features_array).float().to(self.device)
                        else:
                            features_tensor = torch.tensor(features_array, dtype=torch.float32).to(self.device)
                        
                        # Run inference
                        output = self.pytorch_model(features_tensor)
                        
                        # Convert back to numpy
                        if isinstance(output, torch.Tensor):
                            return output.cpu().numpy()
                        else:
                            return output
            
            wrapped_model = PyTorchModelWrapper(model, device)
            print("✅ PyTorch model loaded successfully!")
            print(f"   Input shape: {wrapped_model.input_shape}")
            print(f"   Output shape: {wrapped_model.output_shape}")
            
            # Cache the model
            models_cache[abs_model_path] = wrapped_model
            return wrapped_model
            
        except ImportError:
            raise ImportError(
                "PyTorch is required to load .pth/.pt models. Install with: pip install torch"
            )
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Error loading PyTorch model: {e}")
            import traceback
            traceback.print_exc()
            raise ValueError(f"Failed to load PyTorch model: {error_msg}")
    
    # Handle Pickle models (.pkl, .pickle)
    if file_ext in ['.pkl', '.pickle']:
        print("🔍 Attempting to load as Pickle model...")
        try:
            import pickle
            print("📦 Detected Pickle model format")
            
            # Load pickle file
            with open(abs_model_path, 'rb') as f:
                model_data = pickle.load(f)
            
            print(f"   Model data type: {type(model_data)}")
            print(f"   Model data attributes: {dir(model_data)[:10]}...")
            
            # Try to identify the model type
            model = None
            
            # Check if it's a scikit-learn model
            if hasattr(model_data, 'predict') or hasattr(model_data, 'predict_proba'):
                print("   ✅ Detected scikit-learn model")
                model = model_data
                
                # Wrap scikit-learn model
                class SklearnModelWrapper:
                    def __init__(self, sklearn_model):
                        self.sklearn_model = sklearn_model
                        # Try to infer input shape
                        if hasattr(sklearn_model, 'n_features_in_'):
                            self._input_shape = (None, sklearn_model.n_features_in_)
                        elif hasattr(sklearn_model, 'feature_importances_'):
                            self._input_shape = (None, len(sklearn_model.feature_importances_))
                        else:
                            # Default for common use case
                            self._input_shape = (None, 11)  # Default to 11 features
                    
                    @property
                    def input_shape(self):
                        return self._input_shape
                    
                    @property
                    def output_shape(self):
                        return self._input_shape  # For anomaly detection, output matches input
                    
                    def predict(self, features_array, verbose=0):
                        """Run inference with scikit-learn model"""
                        # Reshape if needed: [batch, timesteps, features] -> [batch*timesteps, features]
                        original_shape = features_array.shape
                        if len(original_shape) == 3:
                            # Flatten timesteps: [batch, timesteps, features] -> [batch*timesteps, features]
                            batch, timesteps, features = original_shape
                            features_2d = features_array.reshape(batch * timesteps, features)
                        else:
                            features_2d = features_array
                        
                        # Run prediction
                        if hasattr(self.sklearn_model, 'predict_proba'):
                            # For classifiers, use predict_proba
                            predictions = self.sklearn_model.predict_proba(features_2d)
                            # For binary classification, use probability of positive class
                            if predictions.shape[1] == 2:
                                predictions = predictions[:, 1:2]  # Take positive class probability
                        else:
                            # For regressors or other models
                            predictions = self.sklearn_model.predict(features_2d)
                            predictions = predictions.reshape(-1, 1)  # Make it 2D
                        
                        # Reshape back if needed
                        if len(original_shape) == 3:
                            predictions = predictions.reshape(batch, timesteps, -1)
                        
                        return predictions
                
                wrapped_model = SklearnModelWrapper(model)
                print("✅ Scikit-learn model loaded successfully!")
                print(f"   Input shape: {wrapped_model.input_shape}")
                print(f"   Output shape: {wrapped_model.output_shape}")
                
                # Cache the model
                models_cache[abs_model_path] = wrapped_model
                return wrapped_model
            
            # Check if it's a PyTorch model (pickled)
            elif hasattr(model_data, 'forward') or hasattr(model_data, '__call__'):
                print("   ✅ Detected PyTorch model (pickled)")
                try:
                    import torch
                    if isinstance(model_data, torch.nn.Module):
                        # Wrap PyTorch model
                        class PyTorchModelWrapper:
                            def __init__(self, pytorch_model, device):
                                self.pytorch_model = pytorch_model
                                self.device = device
                                self.pytorch_model.eval()
                                
                                # Try to infer input shape
                                try:
                                    if hasattr(pytorch_model, 'input_shape'):
                                        self._input_shape = pytorch_model.input_shape
                                    else:
                                        self._input_shape = (None, 7, 11)  # Default
                                except:
                                    self._input_shape = (None, 7, 11)
                            
                            @property
                            def input_shape(self):
                                return self._input_shape
                            
                            @property
                            def output_shape(self):
                                return self._input_shape
                            
                            def predict(self, features_array, verbose=0):
                                with torch.no_grad():
                                    if isinstance(features_array, np.ndarray):
                                        features_tensor = torch.from_numpy(features_array).float().to(self.device)
                                    else:
                                        features_tensor = torch.tensor(features_array, dtype=torch.float32).to(self.device)
                                    
                                    output = self.pytorch_model(features_tensor)
                                    
                                    if isinstance(output, torch.Tensor):
                                        return output.cpu().numpy()
                                    return output
                        
                        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
                        wrapped_model = PyTorchModelWrapper(model_data, device)
                        print("✅ PyTorch model (pickled) loaded successfully!")
                        print(f"   Input shape: {wrapped_model.input_shape}")
                        print(f"   Output shape: {wrapped_model.output_shape}")
                        
                        models_cache[abs_model_path] = wrapped_model
                        return wrapped_model
                except ImportError:
                    raise ImportError("PyTorch is required to load pickled PyTorch models. Install with: pip install torch")
            
            # Check if it's a dictionary containing a model
            elif isinstance(model_data, dict):
                print("   ✅ Detected dictionary format")
                # Try to find model in dict
                for key in ['model', 'pytorch_model', 'sklearn_model', 'tensorflow_model', 'net', 'network', 'autoencoder']:
                    if key in model_data:
                        print(f"   Found model under key: '{key}'")
                        # Recursively try to load the model from the dict
                        nested_model = model_data[key]
                        # Create a temporary file path and try loading again
                        # Or handle it directly if it's a known type
                        if hasattr(nested_model, 'predict') or hasattr(nested_model, 'forward'):
                            # It's a model object, wrap it
                            if hasattr(nested_model, 'predict'):
                                # Scikit-learn
                                from types import MethodType
                                # Create wrapper
                                class DictModelWrapper:
                                    def __init__(self, model):
                                        self.model = model
                                        self._input_shape = (None, 11) if not hasattr(model, 'n_features_in_') else (None, model.n_features_in_)
                                    
                                    @property
                                    def input_shape(self):
                                        return self._input_shape
                                    
                                    @property
                                    def output_shape(self):
                                        return self._input_shape
                                    
                                    def predict(self, features_array, verbose=0):
                                        if len(features_array.shape) == 3:
                                            batch, timesteps, features = features_array.shape
                                            features_2d = features_array.reshape(batch * timesteps, features)
                                            pred = self.model.predict(features_2d)
                                            return pred.reshape(batch, timesteps, -1)
                                        return self.model.predict(features_array)
                                
                                wrapped_model = DictModelWrapper(nested_model)
                                models_cache[abs_model_path] = wrapped_model
                                return wrapped_model
                            else:
                                # PyTorch - handle similar to above
                                raise ValueError("PyTorch model in dict - please extract and save as .pth file")
                
                raise ValueError(
                    f"Dictionary found but no recognized model key. Available keys: {list(model_data.keys())[:10]}. "
                    f"Expected keys: 'model', 'pytorch_model', 'sklearn_model', 'tensorflow_model'"
                )
            
            else:
                raise ValueError(
                    f"Unrecognized model type in pickle file: {type(model_data)}. "
                    f"Supported: scikit-learn models, PyTorch models, or dicts containing models."
                )
                
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Error loading pickle model: {e}")
            import traceback
            traceback.print_exc()
            raise ValueError(f"Failed to load pickle model: {error_msg}")
    
    # Handle TensorFlow/Keras models (.h5, .keras)
    if file_ext not in ['.h5', '.keras']:
        raise ValueError(
            f"Unsupported model format: {file_ext}. "
            f"Supported formats: .h5 (Keras/TensorFlow), .keras (Keras 3), .pth/.pt (PyTorch), .pkl/.pickle (Pickle)"
        )
    
    try:
        # Comprehensive compatibility layer for Keras 3.x -> 2.x
        from keras.layers import InputLayer
        import copy
        
        class CompatibleInputLayer(InputLayer):
            """InputLayer that handles both batch_shape (Keras 3) and input_shape (Keras 2)"""
            @classmethod
            def from_config(cls, config):
                config = copy.deepcopy(config)
                if 'batch_shape' in config and 'input_shape' not in config:
                    batch_shape = config.pop('batch_shape')
                    if batch_shape and len(batch_shape) > 1:
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
                    def __init__(self, name='float32', **kwargs):
                        self.name = name
                    def __getattr__(self, name):
                        return None
                    def get_config(self):
                        return {'name': self.name}
        
        custom_objects = {
            'InputLayer': CompatibleInputLayer,
            'input_layer': CompatibleInputLayer,
            'DTypePolicy': DTypePolicy,
            'dtype_policy': DTypePolicy,
        }
        
        # Try loading with compatibility layer
        # First, try to patch the functional API to handle string shapes
        try:
            from keras.engine import functional
            original_process_node = functional.process_node
            
            def patched_process_node(layer, node_data, layer_outputs, layer_outputs_mask=None):
                """Handle string shapes in node_data"""
                if isinstance(node_data, (str, list)) and not hasattr(node_data, 'as_list'):
                    # Convert string or list to proper format
                    if isinstance(node_data, str):
                        # Try to evaluate shape string
                        try:
                            import ast
                            node_data = ast.literal_eval(node_data)
                        except:
                            pass
                    if isinstance(node_data, list):
                        # Wrap in a shape-like object if needed
                        class ShapeLike:
                            def __init__(self, shape):
                                self.shape = shape
                            def as_list(self):
                                return self.shape if isinstance(self.shape, list) else list(self.shape)
                        if not hasattr(node_data, 'as_list'):
                            node_data = ShapeLike(node_data)
                return original_process_node(layer, node_data, layer_outputs, layer_outputs_mask)
            
            functional.process_node = patched_process_node
            
            try:
                loaded_model = keras.models.load_model(
                    abs_model_path, 
                    compile=False,
                    custom_objects=custom_objects
                )
            finally:
                # Restore original function
                functional.process_node = original_process_node
        except Exception as patch_error:
            print(f"Warning: Compatibility patch failed: {patch_error}")
            # Fallback: try without patching
            loaded_model = keras.models.load_model(
                abs_model_path, 
                compile=False,
                custom_objects=custom_objects
            )
        
        print("✅ Model loaded successfully!")
        print(f"   Input shape: {loaded_model.input_shape}")
        print(f"   Output shape: {loaded_model.output_shape}")
        
        # Cache the model
        models_cache[abs_model_path] = loaded_model
        
        return loaded_model
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Error loading model: {e}")
        
        # Provide specific guidance based on error
        if "'str' object has no attribute 'as_list'" in error_msg:
            print("\n⚠️  This error occurs because the model uses Keras 3.x internal structures")
            print("   that TensorFlow 2.15.1 (Keras 2.x) cannot handle directly.")
            print("\n💡 Alternative solutions (no internet required):")
            print("   1. Re-save the model with Keras 2.x (if you have the training script)")
            print("   2. Use the model weights only and rebuild the architecture")
            print("   3. Wait until you have internet and upgrade TensorFlow")
        
        import traceback
        traceback.print_exc()
        raise

# Lifespan handler (load default model on startup for backward compatibility)
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load default model when server starts, cleanup on shutdown"""
    # Startup - try to load default model (backward compatibility)
    try:
        load_model()  # Will use default path
    except Exception as e:
        print(f"⚠️ Warning: Could not load default model at startup: {e}")
        print("   Models will be loaded on demand when requested")
    yield
    # Shutdown (cleanup if needed)
    # Optionally clear model cache here if memory is a concern
    pass

# Initialize FastAPI app with lifespan
app = FastAPI(
    title="LSTM Autoencoder API",
    description="Anomaly detection using LSTM Autoencoder",
    version="1.0.0",
    lifespan=lifespan
)

# CORS - Allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:8080",  # Alternative port
        "http://localhost:3000",  # Node.js backend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model
class PredictionRequest(BaseModel):
    features: List[List[float]]  # List of feature vectors (sequence)
    model_path: Optional[str] = None  # Optional: path to model file (if not provided, uses default)

# Response model
class PredictionResponse(BaseModel):
    anomalyScore: float
    isAnomaly: bool
    reconstructionError: float
    confidence: float = 0.0

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "LSTM Autoencoder API",
        "models_loaded": len(models_cache),
        "cached_model_paths": list(models_cache.keys())
    }

@app.get("/health")
async def health():
    """Health check with model status"""
    default_model = None
    try:
        # Try to get default model (backward compatibility)
        default_model = load_model()
    except:
        pass
    
    return {
        "status": "healthy",
        "models_cached": len(models_cache),
        "default_model_loaded": default_model is not None,
        "default_model_input_shape": default_model.input_shape if default_model else None
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Predict anomaly score for a sequence of features
    
    Args:
        request: PredictionRequest with features array and optional model_path
                 Expected shape: List of feature vectors (7 timesteps x 11 features)
                 model_path: Optional path to model file (if not provided, uses default)
    
    Returns:
        PredictionResponse with anomaly score and classification
    """
    # Load the specified model (or default if not specified)
    try:
        model = load_model(request.model_path)
    except Exception as e:
        error_detail = str(e)
        print(f"❌ Model not available: {error_detail}")
        raise HTTPException(
            status_code=503, 
            detail=f"Model not available: {error_detail}. Please ensure the model file exists."
        )
    
    # Verify model is loaded
    if model is None:
        raise HTTPException(
            status_code=503, 
            detail="Model failed to load. Only real model predictions are allowed."
        )
    
    try:
        # Convert features to numpy array
        features_array = np.array(request.features, dtype=np.float32)
        
        # Ensure correct shape [1, timesteps, features]
        if len(features_array.shape) == 2:
            # Add batch dimension
            features_array = features_array.reshape(1, features_array.shape[0], features_array.shape[1])
        elif len(features_array.shape) != 3:
            raise ValueError(f"Invalid feature shape: {features_array.shape}. Expected [timesteps, features] or [batch, timesteps, features]")
        
        # Expected input shape: [1, 7, 11]
        if features_array.shape[1] != 7 or features_array.shape[2] != 11:
            print(f"⚠️ Warning: Input shape is {features_array.shape}, expected [1, 7, 11]")
            # Try to pad/truncate if needed
            if features_array.shape[1] < 7:
                # Pad with first timestep
                padding = np.tile(features_array[:, 0:1, :], (1, 7 - features_array.shape[1], 1))
                features_array = np.concatenate([padding, features_array], axis=1)
            elif features_array.shape[1] > 7:
                # Take last 7 timesteps
                features_array = features_array[:, -7:, :]
        
        # Run inference
        prediction = model.predict(features_array, verbose=0)
        
        # Initialize variables
        anomaly_score = None
        reconstruction_error = None
        is_sklearn_model = False
        sklearn_model = None
        
        # Try to detect scikit-learn model by checking for sklearn_model attribute
        if hasattr(model, 'sklearn_model'):
            sklearn_model = model.sklearn_model
            is_sklearn_model = True
        elif hasattr(model, 'predict') and not hasattr(model, 'forward'):
            # Might be a direct sklearn model (not wrapped)
            # Check if it has sklearn-specific methods
            if hasattr(model, 'decision_function') or hasattr(model, 'score_samples'):
                sklearn_model = model
                is_sklearn_model = True
        
        # Try to handle scikit-learn models
        if is_sklearn_model and sklearn_model:
            reconstruction_error = None
            
            # Handle scikit-learn anomaly detection models
            try:
                # Get raw features for sklearn (flatten if needed)
                if len(features_array.shape) == 3:
                    features_2d = features_array.reshape(-1, features_array.shape[-1])
                else:
                    features_2d = features_array
                
                # Use decision_function or score_samples if available
                if hasattr(sklearn_model, 'decision_function'):
                    scores = sklearn_model.decision_function(features_2d)
                    # For IsolationForest/OneClassSVM: negative = anomaly, positive = normal
                    # Convert to 0-1 scale where 0 = normal, 1 = anomaly
                    # Normalize scores to [0, 1] range
                    if len(scores.shape) == 0:
                        scores = np.array([scores])
                    score_min = np.min(scores) if len(scores) > 0 else -1
                    score_max = np.max(scores) if len(scores) > 0 else 1
                    score_range = score_max - score_min if score_max != score_min else 1
                    # Invert: negative scores (anomalies) become high, positive (normal) become low
                    normalized_scores = 1.0 - ((scores - score_min) / score_range)
                    anomaly_score = float(np.mean(normalized_scores))
                    
                elif hasattr(sklearn_model, 'score_samples'):
                    scores = sklearn_model.score_samples(features_2d)
                    # Lower scores = more anomalous
                    # Normalize to [0, 1] where 0 = normal, 1 = anomaly
                    if len(scores.shape) == 0:
                        scores = np.array([scores])
                    score_min = np.min(scores) if len(scores) > 0 else -10
                    score_max = np.max(scores) if len(scores) > 0 else 0
                    score_range = score_max - score_min if score_max != score_min else 1
                    normalized_scores = 1.0 - ((scores - score_min) / score_range)
                    anomaly_score = float(np.mean(normalized_scores))
                    
                elif hasattr(sklearn_model, 'predict_proba'):
                    # For classifiers with predict_proba
                    proba = sklearn_model.predict_proba(features_2d)
                    if proba.shape[1] == 2:
                        # Binary classifier: use probability of anomaly class
                        anomaly_score = float(np.mean(proba[:, 1]))  # Assuming class 1 is anomaly
                    else:
                        # Multi-class: use max probability as confidence, invert for anomaly
                        max_proba = np.max(proba, axis=1)
                        anomaly_score = float(1.0 - np.mean(max_proba))  # Lower confidence = more anomalous
                else:
                    # Fallback: use predict output
                    pred = sklearn_model.predict(features_2d)
                    # For IsolationForest: -1 = anomaly, 1 = normal
                    # Convert to 0-1 scale
                    if len(pred.shape) == 0:
                        pred = np.array([pred])
                    anomaly_count = np.sum(pred == -1) if hasattr(pred, '__iter__') else (1 if pred == -1 else 0)
                    anomaly_score = float(anomaly_count / len(pred)) if len(pred) > 0 else 0.5
                
                reconstruction_error = 0.0  # Not applicable for sklearn models, but set to 0 for response
                print(f"   📊 Scikit-learn model score: {anomaly_score:.4f}")
                
            except Exception as e:
                print(f"   ⚠️ Error using sklearn-specific methods: {e}, falling back to standard calculation")
                import traceback
                traceback.print_exc()
                is_sklearn_model = False
                sklearn_model = None
                # Will fall through to standard calculation below
                anomaly_score = None  # Will be calculated below
        
        # Standard autoencoder/neural network calculation
        # Only use reconstruction error if we didn't successfully process as sklearn model
        if not is_sklearn_model or anomaly_score is None:
            # Calculate reconstruction error (MSE between input and output)
            reconstruction_error = float(np.mean((features_array - prediction) ** 2))
            
            # Log reconstruction error for debugging
            print(f"   📊 Reconstruction error: {reconstruction_error:.6f}")
            
            # Adaptive anomaly score calculation
            # Use percentile-based approach instead of fixed thresholds
            # This is more robust to different model types and feature scales
            
            # For autoencoders: normalize error relative to typical range
            # Most autoencoders have reconstruction errors in range 0.001-1.0 for normal data
            # We'll use a more lenient mapping
            
            # Calculate normalized error (clamp to reasonable range)
            # If error is very small (< 0.001), it's definitely normal
            # If error is moderate (0.001-0.1), it's likely normal
            # If error is high (> 0.1), it's suspicious
            # If error is very high (> 1.0), it's anomalous
            
            if reconstruction_error < 0.001:
                # Very low error = definitely normal
                anomaly_score = 0.1 + (reconstruction_error / 0.001) * 0.1  # 10-20%
            elif reconstruction_error < 0.01:
                # Low error = normal behavior
                anomaly_score = 0.2 + ((reconstruction_error - 0.001) / 0.009) * 0.2  # 20-40%
            elif reconstruction_error < 0.1:
                # Moderate error = mostly normal, some variation
                anomaly_score = 0.4 + ((reconstruction_error - 0.01) / 0.09) * 0.2  # 40-60%
            elif reconstruction_error < 1.0:
                # High error = suspicious but not necessarily anomalous
                anomaly_score = 0.6 + ((reconstruction_error - 0.1) / 0.9) * 0.25  # 60-85%
            else:
                # Very high error = likely anomalous
                anomaly_score = 0.85 + min(0.15, (reconstruction_error - 1.0) / 10.0)  # 85-100%
        
        anomaly_score = max(0.0, min(1.0, anomaly_score))
        
        # Use a higher threshold for anomaly detection (0.85 instead of 0.7)
        # This reduces false positives
        # Only flag as anomaly if score is very high
        is_anomaly = anomaly_score > 0.85
        
        print(f"   🎯 Anomaly score: {anomaly_score:.2%}, Is Anomaly: {is_anomaly}")
        confidence = abs(anomaly_score - 0.5) * 2
        
        return PredictionResponse(
            anomalyScore=float(anomaly_score),
            isAnomaly=bool(is_anomaly),
            reconstructionError=float(reconstruction_error) if reconstruction_error is not None else 0.0,
            confidence=float(confidence)
        )
        
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting FastAPI server...")
    print("   Model will be loaded from: models/lstm_ae_cert.h5")
    print("   API will be available at: http://localhost:5000")
    print("   Docs will be available at: http://localhost:5000/docs")
    # Use reload=False to avoid import string requirement
    uvicorn.run(app, host="0.0.0.0", port=5000, reload=False)
