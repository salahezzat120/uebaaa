# S-UEBA Backend API

FastAPI backend for the S-UEBA Behavior Analytics application.

## Project Structure

The backend is organized into a clean, modular structure:

```
backend/
├── app.py              # Main FastAPI application
├── main.py             # Entry point
├── config/             # Configuration
├── schemas/            # Pydantic models
├── routes/             # API endpoints
├── models/             # Data layer
└── services/           # Business logic
```

See [STRUCTURE.md](STRUCTURE.md) for detailed documentation.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 5000
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:5000/docs
- **ReDoc**: http://localhost:5000/redoc

## API Endpoints

### Data Sources
- `GET /api/data-sources` - Get all data sources
- `GET /api/data-sources/{id}` - Get specific data source
- `POST /api/data-sources` - Create data source
- `PATCH /api/data-sources/{id}` - Update data source
- `DELETE /api/data-sources/{id}` - Delete data source
- `POST /api/data-sources/{id}/connect` - Connect to data source
- `POST /api/data-sources/{id}/disconnect` - Disconnect from data source
- `POST /api/data-sources/{id}/sync` - Sync data source
- `POST /api/data-sources/upload-csv` - Upload CSV file

### Alerts
- `GET /api/alerts` - Get all alerts (with filters)
- `GET /api/alerts/{id}` - Get specific alert
- `PATCH /api/alerts/{id}` - Update alert
- `GET /api/alerts/stats` - Get alert statistics

### Users/Entities
- `GET /api/users` - Get all users (with filters)
- `GET /api/users/{id}` - Get specific user
- `PATCH /api/users/{id}` - Update user

### Models
- `GET /api/models` - Get all models
- `GET /api/models/{id}` - Get specific model
- `POST /api/models` - Create model
- `PATCH /api/models/{id}` - Update model
- `POST /api/models/{id}/train` - Train model
- `DELETE /api/models/{id}` - Delete model

### Inference
- `POST /api/inference/predict` - Run model inference

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Activity Logs
- `GET /api/activity` - Get activity logs

### Reports
- `GET /api/reports` - Get all reports
- `POST /api/reports/generate` - Generate new report

### Settings
- `GET /api/settings` - Get settings
- `PATCH /api/settings` - Update settings

### Health
- `GET /health` - Health check

## Configuration

Set environment variables:
- `VITE_API_URL` - Backend API URL (default: http://localhost:5000)

## Model Setup

Place your trained model at `../models/lstm_ae_cert.h5` (relative to backend directory).

The model service will automatically load it on startup.
