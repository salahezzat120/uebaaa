# Backend API Integration Guide

## Overview

The backend API is now separated from the frontend and provides all REST endpoints for the S-UEBA application.

## Backend Structure

```
backend/
├── main.py              # Entry point (imports from api.py)
├── api.py               # Complete REST API with all endpoints
├── requirements.txt     # Python dependencies
├── README.md           # Backend documentation
└── services/
    ├── model_inference.py    # Model inference service
    └── csv_processor.py      # CSV processing service
```

## Setup Backend

1. **Install dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Run the server:**
```bash
python main.py
```

Server will start at: `http://localhost:5000`

## Frontend Configuration

The frontend is configured to use the backend API via environment variable:

- Default: `http://localhost:5000`
- Can be overridden with `VITE_API_URL` environment variable

## API Endpoints Summary

### Data Sources (`/api/data-sources`)
- `GET /api/data-sources` - List all
- `GET /api/data-sources/{id}` - Get one
- `POST /api/data-sources` - Create
- `PATCH /api/data-sources/{id}` - Update
- `DELETE /api/data-sources/{id}` - Delete
- `POST /api/data-sources/{id}/connect` - Connect
- `POST /api/data-sources/{id}/disconnect` - Disconnect
- `POST /api/data-sources/{id}/sync` - Sync
- `POST /api/data-sources/upload-csv` - Upload CSV

### Alerts (`/api/alerts`)
- `GET /api/alerts` - List (with filters: severity, status, type, search)
- `GET /api/alerts/{id}` - Get one
- `PATCH /api/alerts/{id}` - Update
- `GET /api/alerts/stats` - Statistics

### Users (`/api/users`)
- `GET /api/users` - List (with filters: search, department, status)
- `GET /api/users/{id}` - Get one
- `PATCH /api/users/{id}` - Update

### Models (`/api/models`)
- `GET /api/models` - List all
- `GET /api/models/{id}` - Get one
- `POST /api/models` - Create
- `PATCH /api/models/{id}` - Update
- `POST /api/models/{id}/train` - Train
- `DELETE /api/models/{id}` - Delete

### Inference (`/api/inference`)
- `POST /api/inference/predict` - Run prediction

### Dashboard (`/api/dashboard`)
- `GET /api/dashboard/stats` - Statistics

### Activity Logs (`/api/activity`)
- `GET /api/activity` - List logs

### Reports (`/api/reports`)
- `GET /api/reports` - List all
- `POST /api/reports/generate` - Generate

### Settings (`/api/settings`)
- `GET /api/settings` - Get settings
- `PATCH /api/settings` - Update settings

## Testing the API

1. **Swagger UI** (Interactive documentation):
   Visit: http://localhost:5000/docs

2. **ReDoc** (Alternative docs):
   Visit: http://localhost:5000/redoc

3. **Health Check**:
   ```bash
   curl http://localhost:5000/health
   ```

## Frontend Integration

The frontend service layer (`src/services/dataSourcesApi.ts`) has been updated to use the backend API instead of mock data.

All API calls now go through:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

## Model Integration

The backend loads your LSTM Autoencoder model from:
- Path: `../models/lstm_ae_cert.h5` (relative to backend directory)
- Service: `services/model_inference.py`

The model service:
- Automatically loads the model on first prediction
- Falls back to simulated inference if model not found
- Handles sequences of shape [7, 11] (timesteps × features)

## CSV Processing

CSV files uploaded through the API are processed using:
- Service: `services/csv_processor.py`
- Feature extraction from CSV rows
- Model inference for anomaly detection
- Returns processed rows with anomaly scores

## Next Steps

1. **Database Integration**: Currently uses in-memory storage. Replace with a real database (PostgreSQL, MongoDB, etc.)

2. **Authentication**: Add authentication/authorization (JWT tokens, OAuth, etc.)

3. **Real-time Updates**: Consider WebSockets for real-time updates instead of polling

4. **Error Handling**: Enhance error handling and logging

5. **Testing**: Add unit tests and integration tests

6. **Deployment**: Prepare for production deployment (Docker, Kubernetes, etc.)

