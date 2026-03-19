# 🚀 Quick Start - Guardian Owl

## One Command to Start Everything

```powershell
.\START_ALL.ps1
```

That's it! This will start:
- ✅ FastAPI (AI Model Service) - Port 5000
- ✅ Node.js Backend - Port 3000  
- ✅ React Frontend - Port 8080
- ✅ Logstash - Port 5044

---

## What Happens?

The script will open **4 separate PowerShell windows** (one for each service) so you can monitor each service's logs individually.

**To stop everything:**
```powershell
.\STOP_ALL.ps1
```

---

## Alternative: Background Mode

If you don't want separate windows:

```powershell
.\START_ALL_BACKGROUND.ps1
```

Services run in the background (no windows).

---

## After Starting

1. Wait 10-15 seconds for all services to initialize
2. Open your browser: **http://localhost:8080**
3. Navigate to **Data Sources** → **Add Source** → **Logstash**
4. Connect and start processing!

---

## Troubleshooting

### Services won't start?

1. Make sure ports are free:
   ```powershell
   .\STOP_ALL.ps1
   ```

2. Check dependencies:
   - Frontend: `npm install`
   - Backend: `cd backend-node && npm install`
   - FastAPI: `pip install -r backend-fastapi/requirements.txt`

3. Check environment:
   - `backend-node/.env` file exists with Supabase credentials

### Need more help?

See `QUICK_START.md` for detailed troubleshooting and manual setup instructions.




