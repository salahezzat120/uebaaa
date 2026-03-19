-- Quick Test Data for Data Sources Page
-- Run this AFTER creating tables with 001_initial_schema.sql

-- Insert 5 test data sources
INSERT INTO data_sources (name, type, status, health, records, events_per_sec, config, last_sync)
VALUES
  (
    'Production Auth Logs',
    'logstash',
    'connected',
    98,
    1250000,
    450,
    '{"endpoint": "https://logstash.company.com:5044", "indexPattern": "logs-*"}'::jsonb,
    NOW()
  ),
  (
    'Security Events API',
    'api',
    'connected',
    95,
    890000,
    320,
    '{"endpoint": "https://api.company.com/events", "apiKey": "***"}'::jsonb,
    NOW()
  ),
  (
    'User Activity Database',
    'database',
    'disconnected',
    0,
    0,
    0,
    '{"connectionString": "postgresql://...", "dbType": "postgres"}'::jsonb,
    NULL
  ),
  (
    'Q4 Auth Logs',
    'csv',
    'connected',
    100,
    50000,
    0,
    '{"fileName": "q4_auth_logs.csv", "fileSize": 2048000, "uploadedAt": "' || NOW()::text || '"}'::jsonb,
    NOW()
  ),
  (
    'After Hours Activity',
    'csv',
    'connected',
    100,
    25000,
    0,
    '{"fileName": "ueba_afterhours_strong.csv", "fileSize": 1024000, "uploadedAt": "' || NOW()::text || '"}'::jsonb,
    NOW()
  )
ON CONFLICT DO NOTHING;

-- Verify data was inserted
SELECT 
  name, 
  type, 
  status, 
  health, 
  records, 
  events_per_sec 
FROM data_sources 
ORDER BY created_at DESC;





