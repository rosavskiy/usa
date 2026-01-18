-- Create reporting_periods table
CREATE TABLE IF NOT EXISTS reporting_periods (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'annual')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add reporting_period_id to carbon_calculations
ALTER TABLE carbon_calculations 
ADD COLUMN IF NOT EXISTS reporting_period_id INTEGER REFERENCES reporting_periods(id) ON DELETE SET NULL;

-- Add reporting_period_id to documents
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS reporting_period_id INTEGER REFERENCES reporting_periods(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reporting_periods_user_id ON reporting_periods(user_id);
CREATE INDEX IF NOT EXISTS idx_reporting_periods_active ON reporting_periods(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_calculations_period ON carbon_calculations(reporting_period_id);
CREATE INDEX IF NOT EXISTS idx_documents_period ON documents(reporting_period_id);
