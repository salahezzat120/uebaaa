# How to Start All Services

## Quick Commands

Open **3 separate terminal windows** and run:

### Terminal 1: FastAPI (AI Model)
```powershell
cd C:\Users\user\Documents\GitHub\ueba-grad\guardian-owl-main\backend-fastapi
python main.py
```

**Expected output:**
```
Loading LSTM Autoencoder model from: C:\Users\user\...\models\lstm_ae_cert.h5
✅ Model loaded successfully!
   Input shape: (None, 7, 11)
   Output shape: (None, 7, 11)
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:5000
```

### Terminal 2: Node.js Backend
```powershell
cd C:\Users\user\Documents\GitHub\ueba-grad\guardian-owl-main\backend-node
npm run dev
```

**Expected output:**
```
Server running on http://localhost:3000
FastAPI URL: http://localhost:5000
Connected to Supabase
```

### Terminal 3: Frontend
```powershell
cd C:\Users\user\Documents\GitHub\ueba-grad\guardian-owl-main
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

## Verify Services Are Running

### Check FastAPI
- Open: http://localhost:5000/docs
- Should show API documentation
- Test `/health` endpoint

### Check Node.js
- Open: http://localhost:3000/api/health
- Should return: `{"status":"ok",...}`

### Check Frontend
- Open: http://localhost:5173
- Should load the Guardian Owl dashboard

## Troubleshooting

### FastAPI Can't Find Model
**Error:** `Model file not found`

**Fix:** Ensure `models/lstm_ae_cert.h5` exists in project root:
```
guardian-owl-main/
  ├── models/
  │   └── lstm_ae_cert.h5  ← Should be here
  └── backend-fastapi/
```

### Port Already in Use
**Error:** `Address already in use`

**Fix:** 
- Kill existing process: `netstat -ano | findstr :5000` then `taskkill /PID <pid> /F`
- Or change port in `main.py` (line 197)

### Node.js Can't Connect to FastAPI
**Error:** `ECONNREFUSED`

**Fix:**
- Ensure FastAPI is running first (Terminal 1)
- Check `backend-node/.env` has `FASTAPI_URL=http://localhost:5000`

## Testing the Full Flow

1. ✅ All 3 services running
2. ✅ Open http://localhost:5173
3. ✅ Go to "Data Sources" page
4. ✅ Upload `test-anomaly-detection.csv`
5. ✅ Watch real-time processing with your model!

---

## One-Line Start Scripts

Create these batch files for easy startup:

**start-fastapi.bat:**
```batch
cd backend-fastapi
python main.py
pause
```

**start-nodejs.bat:**
```batch
cd backend-node
npm run dev
pause
```

**start-frontend.bat:**
```batch
npm run dev
pause
```

Then just double-click all three files to start everything!





