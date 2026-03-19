# Setup Test Data - Step by Step

## Step 1: Create Tables in Supabase

1. **Go to Supabase SQL Editor:**
   https://supabase.com/dashboard/project/zljuzuryhwweaqetgwwz/sql/new

2. **Run this SQL** (creates all tables):
   - Copy the entire content from: `supabase/migrations/001_initial_schema.sql`
   - Paste in SQL Editor
   - Click **Run**

## Step 2: Add Test Data

**Option A: Quick SQL (Recommended)**

Run this in Supabase SQL Editor:

```sql
-- Insert 5 test data sources
INSERT INTO data_sources (name, type, status, health, records, events_per_sec, config)
VALUES
  ('Production Auth Logs', 'logstash', 'connected', 98, 1250000, 450, '{"endpoint": "https://logstash.company.com:5044", "indexPattern": "logs-*"}'::jsonb),
  ('Security Events API', 'api', 'connected', 95, 890000, 320, '{"endpoint": "https://api.company.com/events"}'::jsonb),
  ('User Activity Database', 'database', 'disconnected', 0, 0, 0, '{"connectionString": "postgresql://..."}'::jsonb),
  ('Q4 Auth Logs', 'csv', 'connected', 100, 50000, 0, '{"fileName": "q4_auth_logs.csv"}'::jsonb),
  ('After Hours Activity', 'csv', 'connected', 100, 25000, 0, '{"fileName": "ueba_afterhours_strong.csv"}'::jsonb);
```

**Option B: Use API Endpoint**

After tables are created, run:
```bash
POST http://localhost:3000/api/seed/test-data
```

## Step 3: Verify

1. **Check API:**
   - http://localhost:3000/api/data-sources
   - Should return array with 5 data sources

2. **Refresh your page:**
   - Go to: http://localhost:8080/data-sources
   - You should see data!

## What You'll See

After setup, your Data Sources page will show:
- ✅ **5 Data Sources** (2 Logstash/API, 1 Database, 2 CSV)
- ✅ **Connected Sources**: 4/5
- ✅ **Total Records**: ~2.2M
- ✅ **Events/Second**: 770
- ✅ **Avg Health**: ~78%

## Troubleshooting

**"Table doesn't exist" error:**
→ Run Step 1 first (create tables)

**"0 data sources" after seeding:**
→ Check Supabase Dashboard → Table Editor → data_sources table
→ Verify data was inserted

**API returns empty array:**
→ Make sure Node.js backend is running
→ Check Supabase connection in backend logs





