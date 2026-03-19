# How to Start the Backend

## Quick Start

### 1. Navigate to backend directory
```bash
cd backend-node
```

### 2. Install dependencies (if not done)
```bash
npm install
```

### 3. Create/Check .env file
Make sure `backend-node/.env` exists with:
```env
PORT=3000
SUPABASE_URL=https://zljuzuryhwweaqetgwwz.supabase.co
SUPABASE_ANON_KEY=sb_publishable_iMovUttXIPzOkTkZoX27aw_wYK3fUl3
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
FRONTEND_URL=http://localhost:8080
FASTAPI_URL=http://localhost:5000
```

### 4. Start the server
```bash
npm run dev
```

You should see:
```
✅ Supabase configured
🚀 Node.js Backend running on http://localhost:3000
```

### 5. Test it
Open: http://localhost:3000/health

Should return: `{"status":"healthy","service":"Node.js Backend",...}`

## Troubleshooting

### "Cannot find module"
- Run `npm install` in `backend-node` directory

### "Missing Supabase environment variables"
- Check `.env` file exists in `backend-node/`
- Verify all SUPABASE_* variables are set

### "Table does not exist"
- Go to Supabase Dashboard → SQL Editor
- Run migration: `supabase/migrations/001_initial_schema.sql`
- The API will return empty arrays until tables are created

### Port 3000 already in use
- Change PORT in `.env` to another port (e.g., 3001)
- Update `VITE_API_URL` in frontend `.env` to match

## Running in Background

### Windows PowerShell:
```powershell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend-node; npm run dev"
```

### Or use a new terminal window:
1. Open new terminal
2. `cd backend-node`
3. `npm run dev`
4. Keep terminal open





