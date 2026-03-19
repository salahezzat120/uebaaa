-- AI Models Table
CREATE TABLE IF NOT EXISTS ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('account_compromise', 'insider_threat', 'anomaly_detection', 'risk_fusion')),
    framework VARCHAR(50) NOT NULL,
    description TEXT,
    required_features JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'training', 'inactive', 'error')),
    file_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    enabled BOOLEAN DEFAULT FALSE,
    weight DECIMAL(3,2) DEFAULT 0.25 CHECK (weight >= 0 AND weight <= 1),
    accuracy DECIMAL(5,2),
    precision DECIMAL(5,2),
    recall DECIMAL(5,2),
    f1_score DECIMAL(5,2),
    predictions BIGINT DEFAULT 0,
    last_trained TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_models_status ON ai_models(status);
CREATE INDEX IF NOT EXISTS idx_ai_models_enabled ON ai_models(enabled);
CREATE INDEX IF NOT EXISTS idx_ai_models_type ON ai_models(type);

-- RLS Policies
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "Allow read access to ai_models" ON ai_models
    FOR SELECT USING (true);

-- Only service role can insert/update/delete (handled by backend with service role key)
CREATE POLICY "Allow service role full access to ai_models" ON ai_models
    FOR ALL USING (auth.role() = 'service_role');





