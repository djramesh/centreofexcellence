import mysql from "mysql2/promise";

const {
  DB_HOST = "localhost",
  DB_PORT = 3306,
  DB_USER = "root",
  DB_PASSWORD = "",
  DB_NAME = "coe_ecommerce",
} = process.env;

let pool;

export function getDbPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  return pool;
}

export async function testDbConnection() {
  const poolInstance = getDbPool();
  const connection = await poolInstance.getConnection();
  await connection.ping();
  connection.release();
}

