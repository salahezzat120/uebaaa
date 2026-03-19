"""
Fix model loading for Keras 2.x/3.x compatibility
This script converts batch_shape to input_shape in the model file
"""
import h5py
import os
import json

def fix_model_file(model_path):
    """Fix batch_shape -> input_shape in the H5 model file"""
    print(f"Fixing model file: {model_path}")
    
    try:
        with h5py.File(model_path, 'r+') as f:
            # Navigate to model config
            if 'model_weights' in f:
                # Keras save format
                if 'model_config' in f.attrs:
                    config_str = f.attrs['model_config']
                    if isinstance(config_str, bytes):
                        config_str = config_str.decode('utf-8')
                    
                    config = json.loads(config_str)
                    fixed = fix_config(config)
                    
                    if fixed:
                        # Update the config in the file
                        f.attrs['model_config'] = json.dumps(config).encode('utf-8')
                        print("✅ Fixed model_config in H5 file")
                        return True
            
            # Try alternative paths
            for key in f.keys():
                if 'config' in key.lower():
                    try:
                        group = f[key]
                        if 'model_config' in group.attrs:
                            config_str = group.attrs['model_config']
                            if isinstance(config_str, bytes):
                                config_str = config_str.decode('utf-8')
                            
                            config = json.loads(config_str)
                            fixed = fix_config(config)
                            
                            if fixed:
                                group.attrs['model_config'] = json.dumps(config).encode('utf-8')
                                print(f"Fixed model_config in {key}")
                                return True
                    except:
                        continue
        
        print("Warning: Could not find model_config in H5 file")
        return False
        
    except Exception as e:
        print(f"Error fixing model file: {e}")
        return False

def fix_config(config_obj):
    """Recursively fix batch_shape -> input_shape in config"""
    fixed = False
    
    if isinstance(config_obj, dict):
        # Check if this is a layer config with batch_shape
        if 'class_name' in config_obj and config_obj['class_name'] == 'InputLayer':
            if 'config' in config_obj and 'batch_shape' in config_obj['config']:
                batch_shape = config_obj['config'].pop('batch_shape')
                if batch_shape and len(batch_shape) > 1:
                    # Convert [None, 7, 11] to [7, 11]
                    config_obj['config']['input_shape'] = list(batch_shape[1:])
                    print(f"   Converted batch_shape {batch_shape} -> input_shape {config_obj['config']['input_shape']}")
                    fixed = True
        
        # Recursively fix nested configs
        for key, value in config_obj.items():
            if fix_config(value):
                fixed = True
    
    elif isinstance(config_obj, list):
        for item in config_obj:
            if fix_config(item):
                fixed = True
    
    return fixed

if __name__ == "__main__":
    model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'lstm_ae_cert.h5')
    model_path = os.path.abspath(model_path)
    
    if not os.path.exists(model_path):
        print(f"Error: Model file not found: {model_path}")
        exit(1)
    
    # Create backup first
    backup_path = model_path + '.backup'
    if not os.path.exists(backup_path):
        print(f"Creating backup: {backup_path}")
        import shutil
        shutil.copy2(model_path, backup_path)
    
    if fix_model_file(model_path):
        print("Model file fixed! Try loading again.")
    else:
        print("Model file may not need fixing or format is different")

