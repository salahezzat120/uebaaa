#!/usr/bin/env python
"""Fix model.json to use batchInputShape instead of batch_shape"""
import json
import sys

# Read the model.json file
model_path = 'public/models/model.json'
try:
    with open(model_path, 'r', encoding='utf-8-sig') as f:  # Handle BOM if present
        data = json.load(f)
except Exception as e:
    print(f"Error reading file: {e}")
    sys.exit(1)

# Find the InputLayer and fix the batch_shape
try:
    layers = data['modelTopology']['model_config']['config']['layers']
    input_layer = None
    for layer in layers:
        if layer['class_name'] == 'InputLayer':
            input_layer = layer
            break
    
    if input_layer and 'config' in input_layer:
        config = input_layer['config']
        if 'batch_shape' in config:
            # Convert batch_shape to batchInputShape
            config['batchInputShape'] = config.pop('batch_shape')
            print(f"Fixed: Changed batch_shape to batchInputShape: {config['batchInputShape']}")
        else:
            print("No batch_shape found, model might already be fixed")
    else:
        print("Could not find InputLayer")
        sys.exit(1)

    # Write the fixed model back
    with open(model_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Successfully fixed {model_path}")
    
except Exception as e:
    print(f"Error fixing model: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

