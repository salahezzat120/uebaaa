# Add Test Data to Data Sources Page

## Quick Method: Use the API Endpoint

### Option 1: Run Seed Endpoint (Recommended)

Open your browser or use curl:

```bash
# In browser or Postman:
POST http://localhost:3000/api/seed/test-data
```

Or use PowerShell:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/seed/test-data" -Method POST
```

### Option 2: Run SQL in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/zljuzuryhwweaqetgwwz/sql/new
2. Copy and paste the SQL from `supabase/migrations/002_seed_test_data.sql`
3. Click "Run"

### Option 3: Use the API to Create Data Sources

You can create data sources directly via API:

```bash
# Create a data source
POST http://localhost:3000/api/data-sources
Content-Type: application/json

{
  "name": "Production Auth Logs",
  "type": "logstash",
  "config": {
    "endpoint": "https://logstash.company.com:5044",
    "indexPattern": "logs-*"
  }
}
```

## Test Data Included

The seed will create:
- ✅ 5 Data Sources (Logstash, API, Database, 2 CSV files)
- ✅ 4 Users with different risk scores
- ✅ 2 Alerts

## Verify Data

After seeding, check:
- http://localhost:3000/api/data-sources
- Your Data Sources page should show the data





