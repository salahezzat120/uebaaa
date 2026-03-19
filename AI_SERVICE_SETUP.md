# AI Service Setup (Optional)

## Note

The FastAPI AI service has been removed from the main backend folder. If you need AI/ML model inference features, you can:

### Option 1: Use Frontend TensorFlow.js (Current)
- Model runs in browser using TensorFlow.js
- No backend needed
- Already configured in `src/services/modelService.ts`

### Option 2: Set Up FastAPI Backend (For Better Performance)

If you want to use FastAPI for AI inference:

1. **Create FastAPI service:**
   ```bash
   mkdir backend-ai
   cd backend-ai
   ```

2. **Install dependencies:**
   ```bash
   pip install fastapi uvicorn tensorflow numpy
   ```

3. **Create minimal FastAPI app:**
   ```python
   # main.py
   from fastapi import FastAPI
   from fastapi.middleware.cors import CORSMiddleware
   import tensorflow as tf
   from tensorflow import keras
   import numpy as np

   app = FastAPI()
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:8080"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )

   model = None

   @app.on_event("startup")
   async def load_model():
       global model
       try:
           model = keras.models.load_model("../models/lstm_ae_cert.h5")
       except:
           print("Model not found, using simulated inference")

   @app.get("/health")
   async def health():
       return {"status": "healthy"}

   @app.post("/api/inference/predict")
   async def predict(features: list):
       if model:
           # Run actual inference
           input_data = np.array([features]).reshape(1, 7, 11)
           prediction = model.predict(input_data, verbose=0)
           reconstruction_error = float(np.mean((input_data - prediction) ** 2))
           anomaly_score = min(1.0, reconstruction_error / 0.5)
           return {
               "anomalyScore": anomaly_score,
               "isAnomaly": anomaly_score > 0.6,
               "reconstructionError": float(reconstruction_error)
           }
       else:
           # Simulated inference
           return {
               "anomalyScore": 0.5,
               "isAnomaly": False,
               "reconstructionError": 0.1
           }
   ```

4. **Start FastAPI:**
   ```bash
   uvicorn main:app --reload --port 5000
   ```

5. **Update Node.js backend:**
   - Set `FASTAPI_URL=http://localhost:5000` in `backend-node/.env`
   - Node.js will automatically proxy AI requests to FastAPI

## Current Status

✅ **Frontend AI**: Working with TensorFlow.js (browser-based)
⚠️ **Backend AI**: Not configured (FastAPI removed)
✅ **Node.js Backend**: Running and handling all other API requests
✅ **Supabase**: Connected for database and storage

You can continue using the app without FastAPI - AI inference will work in the browser!





