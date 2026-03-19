# Testing Activity Logs

This guide will help you verify that the Activity Logs feature is working correctly.

## Step 1: Run Database Migration

First, you need to apply the database migration to create the `activity_logs` table.

### Option A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy and paste the contents of `supabase/migrations/004_activity_logs.sql`
6. Click **Run** to execute the migration

### Option B: Via Supabase CLI (If installed)

```bash
supabase migration up
```

## Step 2: Verify Database Table Exists

In Supabase SQL Editor, run:

```sql
SELECT COUNT(*) FROM activity_logs;
```

If the table exists, this will return `0` (no logs yet) or an error if it doesn't exist.

## Step 3: Test Activity Log Creation

### Test 1: Update an Alert Status

1. Go to the **Alerts** page in your application
2. Open an alert
3. Change its status (e.g., from "open" to "resolved")
4. Wait 5 seconds
5. Go to the **Activity Logs** page
6. You should see a log entry like "Alert resolved" or "Alert status updated"

### Test 2: Connect a Data Source

1. Go to the **Data Sources** page
2. If you have a Logstash data source, click **Connect**
3. Wait 5 seconds
4. Go to the **Activity Logs** page
5. You should see a log entry like "Data source connected"

### Test 3: Upload or Update a Model

1. Go to the **Models** page
2. Either:
   - Upload a new model, OR
   - Toggle a model's enabled/disabled status, OR
   - Update a model's configuration
3. Wait 5 seconds
4. Go to the **Activity Logs** page
5. You should see a log entry like "Model uploaded" or "Model configuration updated"

## Step 4: Test Activity Logs API Directly

You can test the API endpoint directly using curl or your browser:

```bash
# Get all activity logs
curl http://localhost:3000/api/activity

# Filter by type
curl http://localhost:3000/api/activity?type=alert

# Filter by status
curl http://localhost:3000/api/activity?status=success

# Search
curl http://localhost:3000/api/activity?search=alert
```

Or open in browser:
- http://localhost:3000/api/activity
- http://localhost:3000/api/activity?type=alert
- http://localhost:3000/api/activity?status=success

## Step 5: Check Backend Logs

Check your Node.js backend console for activity logging messages. You should see entries like:

```
[Activity Logger] Creating activity log: Alert resolved
```

If you see errors, check:
1. Database connection is working
2. Migration was applied correctly
3. Service role key is configured in `.env`

## Troubleshooting

### No logs appearing?

1. **Check database migration**: Make sure the `activity_logs` table exists
2. **Check backend console**: Look for errors when actions are performed
3. **Check environment**: Verify `SUPABASE_SERVICE_ROLE_KEY` is set in `backend-node/.env`
4. **Check network**: Open browser DevTools → Network tab, verify API calls to `/api/activity` succeed

### Activity logging errors?

Activity logging is designed to not break main operations. If logging fails, you'll see errors in the backend console like:

```
[Activity Logger] Error creating activity log: ...
```

The main operation (alert update, model upload, etc.) will still succeed even if logging fails.

### Frontend not showing logs?

1. **Check API response**: Open browser DevTools → Network tab → Check `/api/activity` response
2. **Check React Query**: In DevTools → React Query DevTools, verify the query is fetching data
3. **Check console**: Look for JavaScript errors in browser console

## Expected Log Types

You should see logs for:

- **Alert actions**: "Alert resolved", "Alert dismissed", "Alert investigated", "Alert created"
- **Model actions**: "Model uploaded", "Model configuration updated", "Model enabled", "Model disabled", "Model deleted"
- **Data source actions**: "Data source added", "Data source connected", "Data source disconnected"
- **Authentication**: (Can be added later if you implement auth actions)

## Verification Checklist

- [ ] Database migration applied successfully
- [ ] `activity_logs` table exists in Supabase
- [ ] Backend API endpoint `/api/activity` returns data (or empty array)
- [ ] Frontend Activity Logs page loads without errors
- [ ] Performing actions (alert update, model toggle, etc.) creates log entries
- [ ] Logs appear in the Activity Logs page within 5-10 seconds
- [ ] Filters (type, status) work correctly
- [ ] Search functionality works

If all checkboxes are checked, your Activity Logs feature is working correctly! ✅



