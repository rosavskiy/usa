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

    // Add F-gas columns to carbon_calculations
    await pool.query(`
      ALTER TABLE carbon_calculations 
      ADD COLUMN IF NOT EXISTS hfcs_kg DECIMAL(10, 3) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS pfcs_kg DECIMAL(10, 3) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS sf6_kg DECIMAL(10, 3) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS other_kg DECIMAL(10, 3) DEFAULT 0;
    `);
    console.log("✅ Added F-gas columns (hfcs_kg, pfcs_kg, sf6_kg, other_kg)");

    console.log("✅ All migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
