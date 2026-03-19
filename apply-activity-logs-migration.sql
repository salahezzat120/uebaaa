-- Activity Logs Migration
-- Run this in Supabase SQL Editor to create the activity_logs table

-- Check if table already exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'activity_logs') THEN
        RAISE NOTICE 'Table activity_logs already exists. Migration may have already been applied.';
    ELSE
        RAISE NOTICE 'Creating activity_logs table...';
    END IF;
END $$;

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(255) NOT NULL,
    actor VARCHAR(255) NOT NULL,
    target VARCHAR(255),
    type VARCHAR(50) NOT NULL CHECK (type IN ('auth', 'config', 'alert', 'model', 'data')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'warning', 'error')),
    details TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_status ON activity_logs(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor ON activity_logs(actor);

-- Row Level Security (RLS) - Enable for authenticated users
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for service role (backend)
DROP POLICY IF EXISTS "Service role can do everything" ON activity_logs;
CREATE POLICY "Service role can do everything" ON activity_logs
    FOR ALL USING (true);

-- Verify table was created
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activity_logs') 
        THEN '✅ Table activity_logs created successfully!'
        ELSE '❌ Table creation failed'
    END as status;

-- Show table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'activity_logs'
ORDER BY ordinal_position;



