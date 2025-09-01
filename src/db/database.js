import mysql from "mysql2/promise";
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "password",
  database: "password_manager",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("Database connection successful!");
    connection.release();
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

export default pool;
