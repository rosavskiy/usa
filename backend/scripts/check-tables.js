const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkTables() {
  try {
    // Check activity_logs
    const logs = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_logs'",
    );

    console.log(
      logs.rows.length > 0
        ? "✅ activity_logs table exists"
        : "❌ activity_logs table NOT FOUND",
    );

    // Check if admin columns exist
    const columns = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('is_admin', 'is_super', 'is_blocked', 'last_login')",
    );

    console.log(`\n✅ Admin columns in users table: ${columns.rows.length}/4`);
    columns.rows.forEach((row) => console.log(`   - ${row.column_name}`));
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

checkTables();
