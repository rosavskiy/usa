const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.qbmmwhmbanqgnjswbkhw:O7gheo12Chi@aws-1-eu-west-1.pooler.supabase.com:5432/postgres'
});

async function checkGasDocument() {
  try {
    // Get latest gas document
    const result = await pool.query(`
      SELECT id, file_name, status, parsed_data 
      FROM documents 
      WHERE status = 'completed'
      ORDER BY id DESC 
      LIMIT 10
    `);
    
    console.log('\n=== Last 10 completed documents ===\n');
    result.rows.forEach(doc => {
      console.log(`ID: ${doc.id}`);
      console.log(`File: ${doc.file_name}`);
      console.log(`Status: ${doc.status}`);
      console.log(`Parsed Data:`, JSON.stringify(doc.parsed_data, null, 2));
      console.log('---\n');
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

checkGasDocument();
