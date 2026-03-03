const mysql = require("mysql2/promise");
require("dotenv").config();

async function testConnection() {
  try {
    console.log("Testing database connection...");
    console.log("DB_HOST:", process.env.DB_HOST);
    console.log("DB_USER:", process.env.DB_USER);
    console.log("DB_NAME:", process.env.DB_NAME);

    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });

    const [rows] = await pool.query("SELECT 1 as test");
    console.log("✅ Database connection successful!", rows);

    const [barberos] = await pool.query("SELECT * FROM barberos LIMIT 5");
    console.log("✅ Barberos table query successful:", barberos);

    await pool.end();
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  }
}

// testConnection();
