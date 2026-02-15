const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function makeUserAdmin(email) {
  try {
    const result = await pool.query(
      "UPDATE users SET is_admin = TRUE, is_super = TRUE WHERE email = $1 RETURNING email, is_admin, is_super",
      [email],
    );

    if (result.rows.length === 0) {
      console.log(`❌ User with email ${email} not found`);
    } else {
      console.log(`✅ User ${result.rows[0].email} is now an admin`);
      console.log(`   Admin: ${result.rows[0].is_admin}`);
      console.log(`   Super: ${result.rows[0].is_super}`);
    }
  } catch (error) {
    console.error("Error making user admin:", error);
  } finally {
    await pool.end();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log("Usage: node make-admin.js <email>");
  console.log("Example: node make-admin.js user@example.com");
  process.exit(1);
}

makeUserAdmin(email);
