import mysql from "mysql2/promise";

const {
  DB_HOST = "localhost",
  DB_PORT = 3306,
  DB_USER = "root",
  DB_PASSWORD = "",
  DB_NAME = "coe_ecommerce",
  // Tune these per deployment. Each Node instance gets its own pool, so the
  // total connections to MySQL = DB_POOL_LIMIT × number of instances — keep
  // that under the server's max_connections.
  DB_POOL_LIMIT = 20,
  DB_QUEUE_LIMIT = 0,
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
      connectionLimit: Number(DB_POOL_LIMIT),
      queueLimit: Number(DB_QUEUE_LIMIT),
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
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

