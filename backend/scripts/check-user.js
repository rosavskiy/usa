const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkUser() {
  try {
    const result = await pool.query(
      "SELECT id, email, company_name, is_admin, is_super, created_at FROM users WHERE email = $1",
      ["narditnel@gmail.com"],
    );

    if (result.rows.length === 0) {
      console.log("❌ User NOT FOUND in database");
      console.log("You need to register this account first!");
    } else {
      console.log("✅ User found:");
      console.log(result.rows[0]);
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

checkUser();
