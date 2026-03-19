# Quick Start Guide - Guardian Owl

This guide will help you start all services quickly.

## One-Command Start (Recommended)

### Option 1: Start in Separate Windows (Best for Development)

```powershell
.\START_ALL.ps1
```

This will:
- Open 4 separate PowerShell windows (one for each service)
- Each window shows logs for that service
- Easy to monitor and debug

### Option 2: Start in Background (No Windows)

```powershell
.\START_ALL_BACKGROUND.ps1
```

This will:
- Start all services in the background
- No windows opened
- Services run silently

### Stop All Services

```powershell
.\STOP_ALL.ps1
```

This will stop all services running on the configured ports.

---

## Manual Start (Step by Step)

If you prefer to start services manually, follow these steps:

### 1. Start FastAPI (AI Model Service)

```powershell
cd backend-fastapi
python main.py
```

Expected output:
```
🚀 Starting FastAPI server...
✅ Model loaded successfully
INFO:     Uvicorn running on http://127.0.0.1:5000
```

### 2. Start Node.js Backend

Open a **new terminal**:

```powershell
cd backend-node
npm run dev
```

Expected output:
```
🚀 Node.js Backend running on http://localhost:3000
```

### 3. Start Frontend

Open a **new terminal**:

```powershell
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
```

### 4. Start Logstash (Optional)

Open a **new terminal**:

```powershell
cd logstash-9.2.3
.\bin\logstash.bat -f config\guardian-owl.conf
```

Expected output:
```
[INFO] Pipeline started successfully
```

---

## Service URLs

Once all services are running:

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:8080 | Web UI |
| Node.js API | http://localhost:3000 | Backend API |
| FastAPI | http://localhost:5000 | AI Model Service |
| Logstash | http://localhost:5044 | Log Processing |

---

## Troubleshooting

### Port Already in Use

If you see "port already in use" errors:

1. **Find what's using the port:**
   ```powershell
   netstat -ano | findstr :3000
   netstat -ano | findstr :5000
   netstat -ano | findstr :8080
   ```

2. **Kill the process:**
   ```powershell
   taskkill /PID <process_id> /F
   ```

   Or use the stop script:
   ```powershell
   .\STOP_ALL.ps1
   ```

### Services Not Starting

1. **Check dependencies are installed:**
   ```powershell
   # Frontend
   npm install

   # Backend
   cd backend-node
   npm install

   # Python/FastAPI
   pip install fastapi uvicorn tensorflow numpy
   ```

2. **Check environment variables:**
   - Ensure `backend-node/.env` exists with Supabase credentials
   - Check `SUPABASE_SERVICE_ROLE_KEY` is valid

3. **Check model file exists:**
   - FastAPI needs the model file at the path specified in `backend-fastapi/main.py`

### Logstash Not Starting

1. **Check Java is installed:**
   ```powershell
   java -version
   ```

2. **Check Logstash config:**
   - Verify `logstash-9.2.3/config/guardian-owl.conf` exists

---

## Next Steps

1. Open http://localhost:8080 in your browser
2. Navigate to **Data Sources** page
3. Click **"Add Source"** → Select **"Logstash"**
4. Enter:
   - Source Name: `Test Logstash`
   - Logstash Endpoint: `http://localhost:5044`
   - Index Pattern: `logs-*`
5. Click **"Connect"**
6. Click **"Connect"** on the data source card to start processing
7. Go to **Alerts** page to see detected anomalies

---

## Tips

- Use `START_ALL.ps1` for development (see logs in real-time)
- Use `START_ALL_BACKGROUND.ps1` for quick testing (no windows)
- Always stop services properly using `STOP_ALL.ps1` before restarting
- Check service health:
  - FastAPI: http://localhost:5000/health
  - Node.js: http://localhost:3000/health
