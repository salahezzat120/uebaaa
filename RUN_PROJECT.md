# How to Run the Complete Project

This guide walks you through running the entire system: Frontend (React), Node.js Backend, FastAPI (AI Model), and Supabase.

## Prerequisites

- Node.js (v18+)
- Python (v3.8+)
- Supabase account (for database)

## Step-by-Step Setup

### 1. Install Frontend Dependencies

```bash
# Navigate to project root
cd C:\Users\user\Documents\GitHub\ueba-grad\guardian-owl-main

# Install frontend dependencies
npm install
```

### 2. Install Node.js Backend Dependencies

```bash
# Navigate to Node.js backend
cd backend-node

# Install backend dependencies
npm install

# Go back to root
cd ..
```

### 3. Install Python Dependencies

```bash
# Install FastAPI and dependencies
pip install fastapi uvicorn tensorflow numpy
```

### 4. Set Up Supabase Environment Variables

Create `backend-node/.env` file:

```env
# Supabase Configuration
SUPABASE_URL=https://zljuzuryhwweaqetgwwz.supabase.co
SUPABASE_ANON_KEY=sb_publishable_iMovUttXIPzOkTkZoX27aw_wYK3fUl3
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# FastAPI Configuration
FASTAPI_URL=http://localhost:5000
```

**Note:** Get your `SUPABASE_SERVICE_ROLE_KEY` from Supabase Dashboard → Settings → API → service_role key

### 5. Set Up Supabase Database

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Open SQL Editor
3. Run the migration script: `supabase/migrations/001_initial_schema.sql`
4. (Optional) Run seed script: `TEST_DATA_SQL.sql`

### 6. Verify Model File Exists

Ensure your model file is at:
```
models/lstm_ae_cert.h5
```

If it's in a different location, update the path in `backend-fastapi/main.py` (line 38).

---

## Running the Project

You need to run **3 services** simultaneously. Open **3 separate terminal windows**:

### Terminal 1: FastAPI (AI Model Service)

```bash
# Navigate to project root
cd C:\Users\user\Documents\GitHub\ueba-grad\guardian-owl-main

# Start FastAPI server
cd backend-fastapi
python main.py
```

**Expected output:**
```
🚀 Starting FastAPI server...
   Model will be loaded from: models/lstm_ae_cert.h5
   API will be available at: http://localhost:5000
Loading LSTM Autoencoder model from: models/lstm_ae_cert.h5
✅ Model loaded successfully!
INFO:     Uvicorn running on http://0.0.0.0:5000 (Press CTRL+C to quit)
```

**Test:** Open http://localhost:5000/docs to see the API documentation

### Terminal 2: Node.js Backend

```bash
# Navigate to Node.js backend
cd C:\Users\user\Documents\GitHub\ueba-grad\guardian-owl-main\backend-node

# Start Node.js server
npm run dev
```

**Expected output:**
```
Server running on http://localhost:3000
FastAPI URL: http://localhost:5000
Connected to Supabase
```

**Test:** Open http://localhost:3000/api/health

### Terminal 3: Frontend (React/Vite)

```bash
# Navigate to project root
cd C:\Users\user\Documents\GitHub\ueba-grad\guardian-owl-main

# Start frontend dev server
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Open:** http://localhost:5173 in your browser

---

## Verify Everything is Working

### 1. Check FastAPI Health
```bash
curl http://localhost:5000/health
```

Should return:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_input_shape": [null, 7, 11]
}
```

### 2. Check Node.js Backend Health
```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

### 3. Test Model Inference
```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"features": [[0,1,0.75,0.29,0.41,0.39,0.33,0.5,0.1,0.46,0.1]]}'
```

### 4. Open Frontend
- Go to: http://localhost:5173
- Navigate to "Data Sources" page
- Upload a CSV file
- Watch real-time processing with your actual model!

---

## Project Structure

```
guardian-owl-main/
├── src/                          # Frontend (React)
│   ├── services/
│   │   ├── modelService.ts       # Calls backend API
│   │   └── csvProcessor.ts       # Processes CSV
│   └── pages/
│       └── DataSources.tsx       # Main UI
│
├── backend-node/                 # Node.js API Gateway
│   ├── src/
│   │   ├── server.js            # Express server
│   │   ├── routes/
│   │   │   └── ai.js            # Proxies to FastAPI
│   │   └── config/
│   │       └── fastapi.js       # FastAPI client config
│   └── .env                     # Environment variables
│
├── backend-fastapi/              # Python AI Service
│   └── main.py                  # FastAPI server + model
│
├── models/
│   └── lstm_ae_cert.h5          # Your trained model
│
└── public/
    └── test-anomaly-detection.csv  # Test data
```

---

## Data Flow

1. **User uploads CSV** → Frontend (`DataSources.tsx`)
2. **CSV processing** → `csvProcessor.ts` extracts features
3. **Model inference request** → `modelService.ts` calls `http://localhost:3000/api/ai/predict`
4. **Node.js proxy** → `backend-node/src/routes/ai.js` forwards to `http://localhost:5000/predict`
5. **FastAPI** → `backend-fastapi/main.py` loads model, runs inference
6. **Results** → Sent back through the chain to frontend
7. **Display** → Real-time results in UI

---

## Troubleshooting

### FastAPI can't find model file
**Error:** `FileNotFoundError: Model file not found`

**Solution:** 
- Check that `models/lstm_ae_cert.h5` exists
- Update path in `backend-fastapi/main.py` line 38 if different

### Node.js can't connect to FastAPI
**Error:** `ECONNREFUSED` when calling `/api/ai/predict`

**Solution:**
- Ensure FastAPI is running on port 5000
- Check `backend-node/src/config/fastapi.js` has correct URL

### Supabase connection errors
**Error:** `Invalid API key` or connection refused

**Solution:**
- Verify `.env` file has correct Supabase credentials
- Check Supabase dashboard for correct URL and keys
- Ensure Supabase project is active

### Model predictions seem wrong
**Solution:**
- Check FastAPI logs for reconstruction errors
- Adjust anomaly score mapping in `backend-fastapi/main.py` (lines 108-122)
- Verify feature extraction matches your training data format

---

## Quick Start (All in One)

If you want to run everything quickly, use these commands in order:

**Terminal 1:**
```bash
cd backend-fastapi && python main.py
```

**Terminal 2:**
```bash
cd backend-node && npm run dev
```

**Terminal 3:**
```bash
npm run dev
```

Then open: http://localhost:5173

---

## Stopping Services

Press `Ctrl+C` in each terminal to stop the services.

---

## Next Steps

1. ✅ All services running
2. ✅ Upload CSV file in frontend
3. ✅ See real-time predictions from your model!
4. 🎉 Enjoy using your LSTM Autoencoder for anomaly detection!





