# Backend API Setup for Model Inference

Since your model has compatibility issues with TensorFlow.js conversion, we'll use a **backend API approach** which is actually better for production!

## Why Backend API?

✅ **No conversion needed** - Use your model directly  
✅ **Works with any Keras version** - No compatibility issues  
✅ **Better performance** - Runs on server with full TensorFlow  
✅ **Easier updates** - Just replace the .h5 file  
✅ **More secure** - Model stays on server  

## Quick Setup

### Option 1: Simple Flask API (Recommended for Development)

Create `backend/app.py`:

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from tensorflow import keras
import numpy as np

app = Flask(__name__)
CORS(app)  # Allow frontend to call API

# Load your model
model = keras.models.load_model('../models/lstm_ae_cert.h5')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    features = np.array(data['features']).reshape(1, 7, 11)  # Adjust shape as needed
    
    # Run inference
    prediction = model.predict(features, verbose=0)
    reconstruction_error = float(np.mean((features - prediction) ** 2))
    
    # Calculate anomaly score
    anomaly_score = min(1.0, reconstruction_error / 0.5)  # Adjust threshold
    is_anomaly = anomaly_score > 0.6
    
    return jsonify({
        'anomalyScore': anomaly_score,
        'isAnomaly': is_anomaly,
        'reconstructionError': float(reconstruction_error)
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)
```

Install dependencies:
```bash
pip install flask flask-cors tensorflow
```

Run:
```bash
python backend/app.py
```

### Option 2: FastAPI (Better for Production)

Create `backend/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tensorflow as tf
from tensorflow import keras
import numpy as np

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model
model = keras.models.load_model('../models/lstm_ae_cert.h5')

class FeaturesRequest(BaseModel):
    features: list

@app.post("/predict")
async def predict(request: FeaturesRequest):
    features = np.array(request.features).reshape(1, 7, 11)
    prediction = model.predict(features, verbose=0)
    reconstruction_error = float(np.mean((features - prediction) ** 2))
    anomaly_score = min(1.0, reconstruction_error / 0.5)
    is_anomaly = anomaly_score > 0.6
    
    return {
        'anomalyScore': anomaly_score,
        'isAnomaly': is_anomaly,
        'reconstructionError': float(reconstruction_error)
    }
```

Install:
```bash
pip install fastapi uvicorn tensorflow
```

Run:
```bash
uvicorn backend.main:app --reload --port 5000
```

## Update Frontend to Use API

Update `src/services/modelService.ts`:

```typescript
async predict(features: number[]): Promise<ModelPrediction> {
  // Call backend API instead of TensorFlow.js
  const response = await fetch('http://localhost:5000/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ features })
  });
  
  const data = await response.json();
  return {
    anomalyScore: data.anomalyScore,
    isAnomaly: data.isAnomaly,
    reconstructionError: data.reconstructionError,
    confidence: Math.abs(data.anomalyScore - 0.5) * 2
  };
}
```

## Benefits

- ✅ Your model works immediately
- ✅ No conversion needed
- ✅ Better performance
- ✅ Easier to maintain
- ✅ Can use GPU on server

## Current Status

Your frontend is already set up with simulated inference that works great for testing. When you're ready, just:
1. Set up the backend API (5 minutes)
2. Update the modelService.ts to call the API
3. Done! 🎉

The simulated inference will continue to work until you connect the real API.





