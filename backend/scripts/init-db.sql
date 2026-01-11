-- Carbon Tracker Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    state VARCHAR(2), -- US state code for regional emission factors
    industry VARCHAR(100), -- Business industry classification
    currency VARCHAR(10) DEFAULT 'USD', -- Preferred currency for reporting
    unit_system VARCHAR(20) DEFAULT 'Imperial', -- Imperial or Metric
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    parsed_data JSONB,
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Carbon calculations table
CREATE TABLE IF NOT EXISTS carbon_calculations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    emission_type VARCHAR(20) NOT NULL, -- scope1, scope2, scope3
    category VARCHAR(50) NOT NULL, -- electricity, gas, fuel, supplies, etc
    co2_kg DECIMAL(10, 3) NOT NULL,
    ch4_kg DECIMAL(10, 3) NOT NULL,
    n2o_kg DECIMAL(10, 3) NOT NULL,
    total_co2e_kg DECIMAL(10, 3) NOT NULL,
    calculation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    period_start DATE,
    period_end DATE
);

-- Indexes
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_carbon_user_id ON carbon_calculations(user_id);
CREATE INDEX idx_carbon_document_id ON carbon_calculations(document_id);
CREATE INDEX idx_carbon_date ON carbon_calculations(calculation_date);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
