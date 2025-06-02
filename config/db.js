// config/db.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection once when server starts
(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Connected to MySQL database');
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    process.exit(1); // Optional: stop the server if DB fails
  }
})();

module.exports = pool;
