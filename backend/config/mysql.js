import mysql from "mysql2/promise"
import dotenv from "dotenv"
dotenv.config()

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "root",
  database: process.env.DB_NAME || "hospital_db",
  waitForConnections: true,
  connectionLimit: 10,
})

db.getConnection()
  .then(() => console.log("MySQL Connected"))
  .catch((err) => console.error("MySQL Connection Error:", err))

export default db