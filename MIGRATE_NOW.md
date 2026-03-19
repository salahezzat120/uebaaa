# 🚀 Run Migration Now - Quick Guide

## Step 1: Create Tables (2 minutes)

1. **Open Supabase SQL Editor:**
   https://supabase.com/dashboard/project/zljuzuryhwweaqetgwwz/sql/new

2. **Copy this entire SQL** (from `supabase/migrations/001_initial_schema.sql`):

```sql
-- Guardian Owl Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Data Sources Table
CREATE TABLE IF NOT EXISTS data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('csv', 'logstash', 'api', 'database')),
    status VARCHAR(50) NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'syncing', 'error')),
    health INTEGER DEFAULT 0 CHECK (health >= 0 AND health <= 100),
    records BIGINT DEFAULT 0,
    events_per_sec INTEGER DEFAULT 0,
    last_sync TIMESTAMPTZ,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100),
    risk_score DECIMAL(5,2) DEFAULT 0.0 CHECK (risk_score >= 0 AND risk_score <= 100),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'false_positive')),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    data_source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
    anomaly_score DECIMAL(5,2),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Processed Rows Table
CREATE TABLE IF NOT EXISTS processed_rows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_source_id UUID REFERENCES data_sources(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    user_id VARCHAR(255),
    timestamp TIMESTAMPTZ,
    action VARCHAR(100),
    source_ip VARCHAR(50),
    resource TEXT,
    status VARCHAR(50),
    anomaly_score DECIMAL(5,2),
    is_anomaly BOOLEAN DEFAULT FALSE,
    features JSONB,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(data_source_id, row_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_data_sources_status ON data_sources(status);
CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(type);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_risk_score ON users(risk_score);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_processed_rows_data_source ON processed_rows(data_source_id);
CREATE INDEX IF NOT EXISTS idx_processed_rows_anomaly ON processed_rows(is_anomaly) WHERE is_anomaly = TRUE;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_data_sources_updated_at BEFORE UPDATE ON data_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_rows ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Service role can do everything" ON data_sources
    FOR ALL USING (true);

CREATE POLICY "Service role can do everything" ON users
    FOR ALL USING (true);

CREATE POLICY "Service role can do everything" ON alerts
    FOR ALL USING (true);

CREATE POLICY "Service role can do everything" ON processed_rows
    FOR ALL USING (true);
```

3. **Click "Run"** button

## Step 2: Add Test Data (30 seconds)

**Still in SQL Editor**, run this:

```sql
INSERT INTO data_sources (name, type, status, health, records, events_per_sec, config, last_sync)
VALUES
  ('Production Auth Logs', 'logstash', 'connected', 98, 1250000, 450, '{"endpoint": "https://logstash.company.com:5044", "indexPattern": "logs-*"}'::jsonb, NOW()),
  ('Security Events API', 'api', 'connected', 95, 890000, 320, '{"endpoint": "https://api.company.com/events"}'::jsonb, NOW()),
  ('User Activity Database', 'database', 'disconnected', 0, 0, 0, '{"connectionString": "postgresql://..."}'::jsonb, NULL),
  ('Q4 Auth Logs', 'csv', 'connected', 100, 50000, 0, '{"fileName": "q4_auth_logs.csv"}'::jsonb, NOW()),
  ('After Hours Activity', 'csv', 'connected', 100, 25000, 0, '{"fileName": "ueba_afterhours_strong.csv"}'::jsonb, NOW());
```

**Click "Run"** again

## Step 3: Verify & Refresh

1. **Check API:** http://localhost:3000/api/data-sources
   - Should return array with 5 items

2. **Refresh your page:** http://localhost:8080/data-sources
   - You should see all 5 data sources!

## ✅ Done!

Your Data Sources page should now show:
- 5 Data Sources
- Connected Sources: 4/5
- Total Records: ~2.2M
- Events/Second: 770
- Avg Health: ~78%

