// config/db.js

const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables

// Create MySQL connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,     // usually 'localhost'
  user: process.env.DB_USER,     // usually 'root'
  password: process.env.DB_PASS, // often blank in XAMPP
  database: process.env.DB_NAME  // the name of your DB (car_rental)
});

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Connected to MySQL Database');
  }
});

module.exports = connection;
