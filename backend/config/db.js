// MySQL connection pool shared by all controllers.
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'expense_tracker_db',
  waitForConnections: true,
  connectionLimit: 10,
  // Return DATE columns as plain 'YYYY-MM-DD' strings (avoids timezone shifts)
  dateStrings: true,
});

module.exports = pool;
