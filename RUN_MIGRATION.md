# Run Database Migration

## Quick Method: Use the Migration Script

### Option 1: Automatic (Recommended)

```bash
cd backend-node
npm run migrate
```

This will:
1. Check if tables exist
2. Insert test data automatically
3. Show you what to do if tables don't exist

### Option 2: Manual (If script doesn't work)

#### Step 1: Create Tables

1. Go to Supabase SQL Editor:
   https://supabase.com/dashboard/project/zljuzuryhwweaqetgwwz/sql/new

2. Copy ALL SQL from: `supabase/migrations/001_initial_schema.sql`

3. Paste and click **Run**

#### Step 2: Add Test Data

1. Still in SQL Editor, run this SQL:

```sql
INSERT INTO data_sources (name, type, status, health, records, events_per_sec, config, last_sync)
VALUES
  ('Production Auth Logs', 'logstash', 'connected', 98, 1250000, 450, '{"endpoint": "https://logstash.company.com:5044", "indexPattern": "logs-*"}'::jsonb, NOW()),
  ('Security Events API', 'api', 'connected', 95, 890000, 320, '{"endpoint": "https://api.company.com/events"}'::jsonb, NOW()),
  ('User Activity Database', 'database', 'disconnected', 0, 0, 0, '{"connectionString": "postgresql://..."}'::jsonb, NULL),
  ('Q4 Auth Logs', 'csv', 'connected', 100, 50000, 0, '{"fileName": "q4_auth_logs.csv"}'::jsonb, NOW()),
  ('After Hours Activity', 'csv', 'connected', 100, 25000, 0, '{"fileName": "ueba_afterhours_strong.csv"}'::jsonb, NOW());
```

2. Click **Run**

#### Step 3: Verify

- Check: http://localhost:3000/api/data-sources
- Should return array with 5 data sources
- Refresh your page: http://localhost:8080/data-sources

## What Gets Created

✅ **Tables:**
- `data_sources` - Your data source configurations
- `users` - User accounts and risk scores
- `alerts` - Security alerts
- `processed_rows` - CSV processing results

✅ **Test Data:**
- 5 Data Sources (Logstash, API, Database, 2 CSV files)
- Ready to display on your page!

## Troubleshooting

**"Table doesn't exist" error:**
→ Run Step 1 first (create tables)

**"Permission denied" error:**
→ Check your Supabase service role key in `.env`

**Script doesn't work:**
→ Use Manual method (Option 2) - it's just as fast!

