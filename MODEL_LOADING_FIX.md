# Model Loading Issue - Fix Guide

## Current Problem

Your TensorFlow.js model is **failing to load** with this error:
```
ValueError: An InputLayer should be passed either a `batchInputShape` or an `inputShape`.
```

This means the model conversion from Keras (`.h5`) to TensorFlow.js format didn't preserve the input shape information correctly.

## What's Happening Now

Because the model fails to load, the system is **automatically using the simulated inference fallback**. This is why you're seeing results, but they're from the simulation code, not your actual trained model.

## Solutions

### Option 1: Use Backend API (RECOMMENDED - Easiest)

This avoids the TensorFlow.js conversion issues entirely. Your model runs on the backend (Python/FastAPI) where it works natively.

**Steps:**
1. Set `useBackendAPI = true` in `src/services/modelService.ts` (line 16)
2. Set up FastAPI backend to load your `.h5` model directly
3. No conversion needed - use your model as-is

**Benefits:**
- ✅ No conversion issues
- ✅ Model works immediately
- ✅ Better performance (Python backend)
- ✅ Can use GPU if available

### Option 2: Fix Model Conversion

Re-convert your model with explicit input shape:

**Python script to fix conversion:**

```python
import tensorflow as tf
from tensorflow import keras
import tensorflowjs as tfjs

# Load your original model
model = keras.models.load_model('models/lstm_ae_cert.h5', compile=False)

# Verify input shape
print("Model input shape:", model.input_shape)  # Should be (None, 7, 11)

# Convert with explicit input shape preservation
tfjs.converters.save_keras_model(
    model,
    'public/models',
    quantization_dtype=None,  # Keep full precision
    weight_shard_size_bytes=1024*1024*4  # 4MB shards
)

print("Conversion complete!")
```

**Then rebuild your frontend:**
```bash
npm run build
```

### Option 3: Manual Fix of model.json

Edit `public/models/model.json` and find the first layer. Add the input shape:

```json
{
  "config": {
    "batch_input_shape": [null, 7, 11],
    "dtype": "float32",
    "sparse": false,
    "name": "input_layer"
  },
  "class_name": "InputLayer",
  ...
}
```

## Current Status

**You're using SIMULATED INFERENCE** - not your actual model.

The simulation code provides reasonable results for testing, but it's not your trained LSTM Autoencoder. To use your actual model, you need to fix one of the issues above.

## Recommendation

**Use Option 1 (Backend API)** - it's the most reliable and avoids all conversion issues. Your model will work exactly as trained.

## Quick Check

After applying a fix, check the browser console. You should see:
- ✅ `TensorFlow.js model loaded successfully!` (Option 2 or 3)
- OR
- ✅ `Model service initialized (using backend API)` (Option 1)

If you see `using simulated inference fallback`, the model is still not loading.





