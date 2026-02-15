const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function resetPassword(email, newPassword) {
  try {
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the password in database
    const result = await pool.query(
      "UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING email",
      [hashedPassword, email],
    );

    if (result.rows.length === 0) {
      console.log(`❌ User with email ${email} not found`);
    } else {
      console.log(`✅ Password updated for ${result.rows[0].email}`);
      console.log(`   New password: ${newPassword}`);
    }
  } catch (error) {
    console.error("Error updating password:", error.message);
  } finally {
    await pool.end();
  }
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log("Usage: node reset-password.js <email> <new-password>");
  console.log("Example: node reset-password.js user@example.com MyNewPass123");
  process.exit(1);
}

resetPassword(email, password);
