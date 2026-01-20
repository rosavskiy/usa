const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addCredits() {
  const client = await pool.connect();
  try {
    // Add 89452927 credits
    await client.query(`SELECT add_credits_to_user('narditnel@gmail.com', 89452927)`);
    console.log('✅ Added 89452927 credits');

    // Check current balance
    const result = await client.query(
      `SELECT email, credits FROM users WHERE email = 'narditnel@gmail.com'`
    );
    
    if (result.rows.length > 0) {
      console.log(`📊 Current balance:`, result.rows[0].credits, 'credits');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

addCredits();
