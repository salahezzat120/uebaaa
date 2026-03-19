# Quick Test Data Setup

## ⚡ Fastest Way: Run SQL in Supabase

1. **Go to Supabase SQL Editor:**
   https://supabase.com/dashboard/project/zljuzuryhwweaqetgwwz/sql/new

2. **Copy this SQL and run it:**

```sql
-- Insert test data sources
INSERT INTO data_sources (name, type, status, health, records, events_per_sec, config)
VALUES
  ('Production Auth Logs', 'logstash', 'connected', 98, 1250000, 450, '{"endpoint": "https://logstash.company.com:5044", "indexPattern": "logs-*"}'::jsonb),
  ('Security Events API', 'api', 'connected', 95, 890000, 320, '{"endpoint": "https://api.company.com/events"}'::jsonb),
  ('User Activity Database', 'database', 'disconnected', 0, 0, 0, '{"connectionString": "postgresql://..."}'::jsonb),
  ('Q4 Auth Logs', 'csv', 'connected', 100, 50000, 0, '{"fileName": "q4_auth_logs.csv"}'::jsonb),
  ('After Hours Activity', 'csv', 'connected', 100, 25000, 0, '{"fileName": "ueba_afterhours_strong.csv"}'::jsonb)
ON CONFLICT DO NOTHING;
```

3. **Refresh your Data Sources page** - you should see 5 data sources!

## 🔄 Alternative: Use API Endpoint

```bash
POST http://localhost:3000/api/seed/test-data
```

Or in PowerShell:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/seed/test-data" -Method POST
```

## ✅ Verify

After adding data, check:
- http://localhost:3000/api/data-sources
- Your Data Sources page should show the data

## 🐛 If Tables Don't Exist

First run the migration:
1. Go to Supabase SQL Editor
2. Run: `supabase/migrations/001_initial_schema.sql`
3. Then add test data





