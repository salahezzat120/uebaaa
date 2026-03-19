-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial risk scoring settings
INSERT INTO system_settings (key, value, description)
VALUES 
('risk_weights', '{
    "anomaly": 0.35,
    "behavior": 0.25,
    "temporal": 0.15,
    "historical": 0.15,
    "contextual": 0.10
}', 'Weights for the 5-component risk scoring formula'),
('risk_thresholds', '{
    "low": 30,
    "medium": 50,
    "high": 70,
    "critical": 85
}', 'Thresholds for alert severity based on risk score'),
('risk_fusion', '{
    "method": "weighted",
    "smoothing_factor": 0.15
}', 'Settings for risk score fusion and smoothing')
ON CONFLICT (key) DO NOTHING;

-- Trigger to update updated_at
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
