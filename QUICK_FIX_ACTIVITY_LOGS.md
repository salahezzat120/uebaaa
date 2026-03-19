# Quick Fix: Activity Logs Not Appearing

## Problem
You're seeing actions in the backend console (like model toggles) but no logs appear on the Activity Logs page.

## Solution

### Step 1: Apply Database Migration (MOST IMPORTANT!)

The `activity_logs` table needs to be created in your database.

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Go to SQL Editor** (left sidebar)
4. **Click "New Query"**
5. **Copy the entire contents** of `apply-activity-logs-migration.sql` (or `supabase/migrations/004_activity_logs.sql`)
6. **Click "Run"** (or press Ctrl+Enter)
7. **Verify success** - You should see "Table activity_logs created successfully!"

### Step 2: Restart Your Backend

Since we just added activity logging to the toggle endpoint, restart your Node.js backend:

```powershell
# Stop the backend (Ctrl+C in the terminal running it)
# Then restart it
cd backend-node
npm run dev
```

### Step 3: Test Again

1. **Toggle a model** in the Models page
2. **Wait 5 seconds**
3. **Go to Activity Logs page**
4. **You should see**: "Model enabled" or "Model disabled" log entry

### Step 4: Verify It's Working

Run this in PowerShell:

```powershell
.\check-activity-logs.ps1
```

Or test the API directly:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/activity" | ConvertTo-Json
```

If you see logs in the JSON response, it's working! The frontend will update automatically.

## Common Issues

### Issue: Still seeing 0 logs after migration

**Check backend console** for errors like:
```
[Activity Logger] Error creating activity log: ...
```

**Common causes:**
- Table name mismatch
- RLS (Row Level Security) blocking inserts
- Missing service role key in `.env`

**Fix:** Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in `backend-node/.env`

### Issue: API returns empty array `[]`

This is normal if:
- Migration just ran
- No actions have been performed yet

**Solution:** Perform an action (toggle model, update alert, connect data source) and logs will appear.

### Issue: Frontend shows "No activity logs found"

**Check:**
1. Backend is running on port 3000
2. Frontend can reach the API (check browser DevTools → Network tab)
3. Look for errors in browser console (F12)

## Verify Database Migration Was Applied

Run this in Supabase SQL Editor:

```sql
SELECT COUNT(*) as log_count FROM activity_logs;
```

If you see a number (even 0), the table exists! ✅

If you get an error about table not existing, run the migration again.



