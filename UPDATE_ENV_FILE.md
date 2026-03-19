# Update .env File with Correct Keys

## Copy This Exact Content

Open `backend-node/.env` and **replace everything** with this:

```env
# Supabase Configuration
SUPABASE_URL=https://zljuzuryhwweaqetgwwz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsanV6dXJ5aHd3ZWFxZXRnd3d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzI0OTIsImV4cCI6MjA4MTQwODQ5Mn0.w5nYLvUGHhWgv28jb9qaIE-Jt_e6n_Bb9eOJ0zx3bBU

# Service Role Key (REQUIRED for CSV uploads)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsanV6dXJ5aHd3ZWFxZXRnd3d6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTgzMjQ5MiwiZXhwIjoyMDgxNDA4NDkyfQ.-O3jDaRc9umVZb6Zg8VtmS30ACrj-wklg3DzvXsnQ28

# FastAPI Configuration (fixed to use IPv4)
FASTAPI_URL=http://127.0.0.1:5000

# Server Configuration
PORT=3000
NODE_ENV=development
```

## After Updating

1. **Save the file**
2. **Restart Node.js backend:**
   ```powershell
   # Stop backend (Ctrl+C)
   cd backend-node
   npm run dev
   ```

3. **Verify it loaded:**
   You should see:
   ```
   ✅ Supabase configured
      URL: https://zljuzuryhwweaqetgwwz.supabase.co
      Admin client: Available (service role key set)  ✅
   ```

## What Changed

- ✅ **Service Role Key**: Now using correct JWT token format
- ✅ **Anon Key**: Updated to correct public JWT token
- ✅ **FastAPI URL**: Changed to `127.0.0.1` (fixes IPv6 issue)

## Test

After restart, try:
1. **Upload CSV** - should work without errors
2. **Process CSV** - should connect to FastAPI and use real model

Everything should work now! 🎉





