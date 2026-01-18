const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  try {
    console.log("🔄 Running migrations...");

    // Add missing columns
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
    `);
    console.log("✅ Added google_id column");

    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
    `);
    console.log("✅ Added industry column");

    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';
    `);
    console.log("✅ Added currency column");

    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS unit_system VARCHAR(20) DEFAULT 'Imperial';
    `);
    console.log("✅ Added unit_system column");

    // Add address, phone, logo fields
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(500);
    `);
    console.log("✅ Added address column");

    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
    `);
    console.log("✅ Added phone column");

    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS logo_path VARCHAR(500);
    `);
    console.log("✅ Added logo_path column");

    // Add F-gas columns to carbon_calculations
    await pool.query(`
      ALTER TABLE carbon_calculations 
      ADD COLUMN IF NOT EXISTS hfcs_kg DECIMAL(10, 3) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS pfcs_kg DECIMAL(10, 3) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS sf6_kg DECIMAL(10, 3) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS other_kg DECIMAL(10, 3) DEFAULT 0;
    `);
    console.log("✅ Added F-gas columns (hfcs_kg, pfcs_kg, sf6_kg, other_kg)");

    // Create reporting_periods table
    await pool.query(`
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
    `);
    console.log("✅ Created reporting_periods table");

    // Add reporting_period_id to carbon_calculations
    await pool.query(`
      ALTER TABLE carbon_calculations 
      ADD COLUMN IF NOT EXISTS reporting_period_id INTEGER REFERENCES reporting_periods(id) ON DELETE SET NULL;
    `);
    console.log("✅ Added reporting_period_id to carbon_calculations");

    // Add reporting_period_id to documents
    await pool.query(`
      ALTER TABLE documents 
      ADD COLUMN IF NOT EXISTS reporting_period_id INTEGER REFERENCES reporting_periods(id) ON DELETE SET NULL;
    `);
    console.log("✅ Added reporting_period_id to documents");

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_reporting_periods_user_id ON reporting_periods(user_id);
      CREATE INDEX IF NOT EXISTS idx_reporting_periods_active ON reporting_periods(user_id, is_active);
      CREATE INDEX IF NOT EXISTS idx_calculations_period ON carbon_calculations(reporting_period_id);
      CREATE INDEX IF NOT EXISTS idx_documents_period ON documents(reporting_period_id);
    `);
    console.log("✅ Created indexes for reporting periods");

    console.log("✅ All migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
