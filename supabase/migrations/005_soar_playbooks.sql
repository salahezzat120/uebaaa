-- SOAR Playbooks and Executions Tables
-- Tracks automated security response playbooks and their executions

-- SOAR Playbooks Table
CREATE TABLE IF NOT EXISTS soar_playbooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
        'block_user', 
        'force_password_reset', 
        'trigger_mfa', 
        'revoke_tokens', 
        'quarantine_endpoint', 
        'update_alert_status', 
        'send_notification'
    )),
    conditions JSONB DEFAULT '{}',
    action_config JSONB DEFAULT '{}',
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SOAR Executions Table
CREATE TABLE IF NOT EXISTS soar_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playbook_id UUID REFERENCES soar_playbooks(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed')),
    result JSONB DEFAULT '{}',
    triggered_by VARCHAR(20) NOT NULL CHECK (triggered_by IN ('automatic', 'manual')),
    triggered_by_user VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_soar_playbooks_enabled ON soar_playbooks(enabled);
CREATE INDEX IF NOT EXISTS idx_soar_playbooks_action_type ON soar_playbooks(action_type);
CREATE INDEX IF NOT EXISTS idx_soar_executions_playbook_id ON soar_executions(playbook_id);
CREATE INDEX IF NOT EXISTS idx_soar_executions_alert_id ON soar_executions(alert_id);
CREATE INDEX IF NOT EXISTS idx_soar_executions_status ON soar_executions(status);
CREATE INDEX IF NOT EXISTS idx_soar_executions_created_at ON soar_executions(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_soar_playbooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE TRIGGER update_soar_playbooks_updated_at BEFORE UPDATE ON soar_playbooks
    FOR EACH ROW EXECUTE FUNCTION update_soar_playbooks_updated_at();

-- Row Level Security (RLS) - Enable for authenticated users
ALTER TABLE soar_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE soar_executions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for service role (backend)
CREATE POLICY "Service role can do everything" ON soar_playbooks
    FOR ALL USING (true);

CREATE POLICY "Service role can do everything" ON soar_executions
    FOR ALL USING (true);



