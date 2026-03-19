-- Seed test data for Data Sources
-- Run this after 001_initial_schema.sql

-- Insert test data sources
INSERT INTO data_sources (name, type, status, health, records, events_per_sec, config, created_at, updated_at)
VALUES
  (
    'Production Auth Logs',
    'logstash',
    'connected',
    98,
    1250000,
    450,
    '{"endpoint": "https://logstash.company.com:5044", "indexPattern": "logs-*"}'::jsonb,
    NOW() - INTERVAL '7 days',
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
    NOW() - INTERVAL '5 days',
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
    NOW() - INTERVAL '3 days',
    NOW()
  ),
  (
    'Q4 Auth Logs',
    'csv',
    'connected',
    100,
    50000,
    0,
    '{"fileName": "q4_auth_logs.csv", "fileSize": 2048000, "uploadedAt": "' || NOW()::text || '"}'::jsonb,
    NOW() - INTERVAL '1 day',
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
    NOW() - INTERVAL '2 hours',
    NOW()
  )
ON CONFLICT DO NOTHING;

-- Insert test users
INSERT INTO users (email, username, risk_score, status, metadata, created_at, updated_at)
VALUES
  ('john.doe@company.com', 'johndoe', 45.5, 'active', '{"department": "Engineering", "role": "Developer"}'::jsonb, NOW() - INTERVAL '30 days', NOW()),
  ('jane.smith@company.com', 'janesmith', 72.3, 'active', '{"department": "Sales", "role": "Manager"}'::jsonb, NOW() - INTERVAL '25 days', NOW()),
  ('admin@company.com', 'admin', 15.2, 'active', '{"department": "IT", "role": "Administrator"}'::jsonb, NOW() - INTERVAL '60 days', NOW()),
  ('suspicious.user@company.com', 'suspicious', 88.7, 'suspended', '{"department": "Unknown", "role": "Unknown", "flags": ["multiple_failed_logins", "unusual_hours"]}'::jsonb, NOW() - INTERVAL '5 days', NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert test alerts
INSERT INTO alerts (title, description, severity, status, user_id, data_source_id, anomaly_score, metadata, created_at, updated_at)
SELECT
  'Multiple Failed Login Attempts',
  'User ' || u.email || ' has attempted to login 5 times in the last 10 minutes',
  'high',
  'open',
  u.id,
  ds.id,
  85.5,
  '{"attempts": 5, "timeWindow": "10 minutes", "ipAddress": "192.168.1.100"}'::jsonb,
  NOW() - INTERVAL '2 hours',
  NOW()
FROM users u, data_sources ds
WHERE u.email = 'suspicious.user@company.com' AND ds.name = 'Production Auth Logs'
LIMIT 1;

INSERT INTO alerts (title, description, severity, status, user_id, data_source_id, anomaly_score, metadata, created_at, updated_at)
SELECT
  'Unusual Access Pattern',
  'User accessing resources outside normal business hours',
  'medium',
  'open',
  u.id,
  ds.id,
  65.2,
  '{"accessTime": "03:45 AM", "normalHours": "9 AM - 5 PM"}'::jsonb,
  NOW() - INTERVAL '1 hour',
  NOW()
FROM users u, data_sources ds
WHERE u.email = 'john.doe@company.com' AND ds.name = 'After Hours Activity'
LIMIT 1;

-- Update timestamps
UPDATE data_sources SET last_sync = NOW() WHERE status = 'connected';





