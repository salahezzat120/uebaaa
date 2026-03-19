-- Activity Logs Table
-- Tracks all platform actions for audit trail

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
CREATE POLICY "Service role can do everything" ON activity_logs
    FOR ALL USING (true);



