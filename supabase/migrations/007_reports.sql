-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('executive', 'technical', 'compliance')),
    frequency VARCHAR(50) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'on-demand')),
    template_id VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'generating', 'scheduled', 'failed')),
    last_generated_at TIMESTAMPTZ,
    next_scheduled_at TIMESTAMPTZ,
    file_path TEXT,
    file_size BIGINT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create report_generations table for history
CREATE TABLE IF NOT EXISTS report_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('generating', 'completed', 'failed')),
    file_path TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_frequency ON reports(frequency);
CREATE INDEX IF NOT EXISTS idx_reports_next_scheduled_at ON reports(next_scheduled_at);
CREATE INDEX IF NOT EXISTS idx_report_generations_report_id ON report_generations(report_id);
CREATE INDEX IF NOT EXISTS idx_report_generations_status ON report_generations(status);
CREATE INDEX IF NOT EXISTS idx_report_generations_started_at ON report_generations(started_at DESC);

-- RLS Policies
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can do everything on reports" ON reports
    FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE report_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can do everything on report_generations" ON report_generations
    FOR ALL USING (true) WITH CHECK (true);

-- Trigger to update updated_at for reports
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



