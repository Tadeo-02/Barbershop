import mysql from "mysql2/promise"; // allows to use promises, better than Callbacks

const pool = mysql.createPool({
  //createPool > createConnection
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

export default pool;
