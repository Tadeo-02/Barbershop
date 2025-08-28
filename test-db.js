const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_NAME:', process.env.DB_NAME);
    
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });
    
    console.log('Pool created, testing query...');
    const [rows] = await pool.query('SELECT * FROM barberos');
    console.log('Query result:', rows);
    
    // Test insert
    console.log('Testing insert...');
    const [result] = await pool.query('INSERT INTO barberos (cuil, nombre, apellido, telefono) VALUES (?, ?, ?, ?)', ['TEST123', 'Test', 'User', '1234567890']);
    console.log('Insert result:', result);
    
    // Check if it was inserted
    const [afterInsert] = await pool.query('SELECT * FROM barberos WHERE cuil = ?', ['TEST123']);
    console.log('After insert:', afterInsert);
    
    await pool.end();
  } catch (error) {
    console.error('Database error:', error);
  }
}

// testConnection();
