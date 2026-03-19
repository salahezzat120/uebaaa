# FastAPI AI Service for Guardian Owl

This FastAPI service handles all AI/ML operations including model inference and CSV processing.

## Setup

1. **Install dependencies:**
   ```bash
   cd backend-fastapi
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add:
   - Model path
   - API keys
   - Supabase connection (if needed)

3. **Start the server:**
   ```bash
   uvicorn main:app --reload --port 5000
   ```

## API Endpoints

- `GET /health` - Health check
- `POST /api/inference/predict` - Run model inference
- `POST /api/inference/process-csv` - Process CSV with model

## Integration

The Node.js backend proxies AI requests to this FastAPI service. The frontend should call Node.js endpoints, which then forward to FastAPI.





