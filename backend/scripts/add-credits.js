const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addCreditsToUser(email, credits) {
  const client = await pool.connect();
  try {
    // First, add credits column if it doesn't exist
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 5;
    `);
    console.log("✅ Credits column added (if not exists)");

    // Update existing users to have 5 free trial credits if they don't have any
    await client.query(`
      UPDATE users SET credits = 5 WHERE credits IS NULL OR credits = 0;
    `);
    console.log("✅ Existing users updated with 5 trial credits");

    // Create function to add credits
    await client.query(`
      CREATE OR REPLACE FUNCTION add_credits_to_user(user_email TEXT, credit_amount INTEGER)
      RETURNS VOID AS $$
      BEGIN
        UPDATE users 
        SET credits = COALESCE(credits, 0) + credit_amount
        WHERE email = user_email;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log("✅ Function add_credits_to_user created");

    // Add credits to specific user
    await client.query(`SELECT add_credits_to_user($1, $2)`, [email, credits]);
    console.log(`✅ Added ${credits} credits to ${email}`);

    // Check current balance
    const result = await client.query(
      `SELECT email, credits FROM users WHERE email = $1`,
      [email],
    );

    if (result.rows.length > 0) {
      console.log(
        `\n📊 Current balance for ${email}:`,
        result.rows[0].credits,
        "credits",
      );
    } else {
      console.log(`\n⚠️  User ${email} not found`);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Add 13 credits to narditnel@gmail.com
addCreditsToUser("narditnel@gmail.com", 13);
