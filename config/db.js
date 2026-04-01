// ─────────────────────────────────────────
//  config/db.js
//  Creates and exports MySQL connection pool
//  A pool reuses connections — better than
//  opening a new connection for every request
// ─────────────────────────────────────────

const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// .promise() lets us use async/await instead of callbacks
module.exports = pool.promise();
