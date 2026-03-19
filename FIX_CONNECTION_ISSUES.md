# Fix Connection Issues

## Problems Found

1. ✅ **FastAPI is working** - Direct test confirmed it responds correctly
2. ❌ **Node.js → FastAPI connection** - Getting 503 errors
3. ❌ **Supabase CSV upload** - "Invalid Compact JWS" authentication error

## Solutions

### 1. Restart Node.js Backend

The Node.js backend may need a restart to pick up connection changes:

```powershell
# Stop Node.js backend (Ctrl+C)
# Then restart:
cd backend-node
npm run dev
```

### 2. Check Node.js Backend Logs

When you restart, watch for:
- `[AI Service] Calling FastAPI /predict...` messages
- Connection errors
- FastAPI response logs

### 3. Fix Supabase CSV Upload

The "Invalid Compact JWS" error means the Supabase service role key is missing or invalid.

**Check `.env` file in `backend-node/`:**

```env
SUPABASE_URL=https://zljuzuryhwweaqetgwwz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Get your service role key:**
1. Go to Supabase Dashboard
2. Settings → API
3. Copy "service_role" key (NOT the anon key)
4. Add to `.env` file

## Quick Test

After fixing, test the connection:

1. **Check FastAPI directly:**
   ```powershell
   curl http://localhost:5000/health
   ```
   Should return: `{"status":"healthy","model_loaded":true}`

2. **Check Node.js → FastAPI:**
   - Upload a CSV file
   - Watch Node.js backend logs
   - Should see `[AI Service] FastAPI response received`

3. **Check CSV upload:**
   - Try uploading a CSV
   - Should succeed without "Invalid Compact JWS" error

## Current Status

- ✅ FastAPI: Working (model loaded, responds to requests)
- ⚠️ Node.js Backend: Needs restart, may have connection issues
- ⚠️ Supabase: Needs service role key for CSV uploads





