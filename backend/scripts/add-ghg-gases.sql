-- Add columns for additional greenhouse gases (HFCs, PFCs, SF6)
-- All values stored in kilograms (kg), converted to metric tons (mt) in reports

ALTER TABLE carbon_calculations
ADD COLUMN IF NOT EXISTS hfcs_kg DECIMAL(10, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS pfcs_kg DECIMAL(10, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sf6_kg DECIMAL(10, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_kg DECIMAL(10, 3) DEFAULT 0;

-- Update existing rows to have 0 for new columns
UPDATE carbon_calculations 
SET hfcs_kg = 0, pfcs_kg = 0, sf6_kg = 0, other_kg = 0
WHERE hfcs_kg IS NULL OR pfcs_kg IS NULL OR sf6_kg IS NULL OR other_kg IS NULL;
