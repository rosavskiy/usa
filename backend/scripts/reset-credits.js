const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setCredits() {
  const client = await pool.connect();
  try {
    // Set credits to 5
    await client.query(
      `UPDATE users SET credits = 5 WHERE email = 'narditnel@gmail.com'`
    );
    console.log('✅ Credits set to 5');

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

setCredits();
