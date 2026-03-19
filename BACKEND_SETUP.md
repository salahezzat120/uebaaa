# Backend Setup Guide

## Quick Start

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Start Backend Server

```bash
python main.py
```

Or with uvicorn:
```bash
uvicorn main:app --reload --port 5000
```

The API will be available at:
- **API**: http://localhost:5000
- **Interactive Docs**: http://localhost:5000/docs
- **ReDoc**: http://localhost:5000/redoc

### 3. Update Frontend Environment

Create a `.env` file in the project root:
```
VITE_API_URL=http://localhost:5000
```

Then restart your frontend dev server.

## Architecture

```
Frontend (React + Vite)
    ↓ HTTP Requests
Backend API (FastAPI)
    ↓
Model Service (TensorFlow/Keras)
    ↓
LSTM Autoencoder Model
```

## API Endpoints

### Data Sources
- `GET /api/data-sources` - List all data sources
- `POST /api/data-sources` - Create new data source
- `GET /api/data-sources/{id}` - Get specific data source
- `PATCH /api/data-sources/{id}` - Update data source
- `DELETE /api/data-sources/{id}` - Delete data source
- `POST /api/data-sources/{id}/connect` - Connect
- `POST /api/data-sources/{id}/disconnect` - Disconnect
- `POST /api/data-sources/{id}/sync` - Sync data
- `POST /api/data-sources/upload-csv` - Upload CSV

### Model Inference
- `POST /api/model/predict` - Run anomaly detection
- `GET /api/model/status` - Check model status

### CSV Processing
- `POST /api/csv/process` - Process CSV file

## Model Setup

1. Place your trained model at: `models/lstm_ae_cert.h5`
2. The backend will automatically load it
3. If model not found, it uses simulated inference

## Development

- Backend auto-reloads on code changes
- Frontend connects to backend automatically
- CORS is configured for local development

## Production Deployment

### Backend
```bash
uvicorn main:app --host 0.0.0.0 --port 5000 --workers 4
```

### Frontend
Build and serve static files:
```bash
npm run build
# Serve dist/ folder with nginx or similar
```

## Benefits of Separated Backend

✅ **Better Performance** - Model runs on server with full TensorFlow  
✅ **No Conversion Needed** - Use Keras model directly  
✅ **Easier Updates** - Replace model file without frontend changes  
✅ **More Secure** - Model stays on server  
✅ **Scalable** - Can add caching, queuing, etc.  
✅ **Better Error Handling** - Centralized error management  
✅ **API Documentation** - Auto-generated with FastAPI  

## Troubleshooting

**Backend won't start:**
- Check Python version (3.8+)
- Install dependencies: `pip install -r requirements.txt`
- Check port 5000 is available

**Frontend can't connect:**
- Verify backend is running: http://localhost:5000/health
- Check CORS settings in `backend/main.py`
- Verify `VITE_API_URL` in `.env`

**Model not loading:**
- Check model path in `backend/services/model_inference.py`
- Verify model file exists
- Check TensorFlow installation

