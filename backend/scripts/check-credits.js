const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkCredits() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT email, credits FROM users WHERE email = 'narditnel@gmail.com'`,
    );

    if (result.rows.length > 0) {
      console.log("📊 User found:", result.rows[0]);
    } else {
      console.log("⚠️  User not found");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkCredits();
