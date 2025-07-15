const mysql = require('mysql2/promise'); // permite utilizar promesas, que son mejores que Callbacks

const pool = mysql.createPool({ //createPool > createConnection
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

module.exports = pool;