import mysql from "mysql2/promise";

/**
 * Resolve connection settings.
 *
 * Discrete DB_* vars win when DB_HOST is set explicitly (the local dev case),
 * and a connection URL is the fallback. Managed platforms (Railway, PlanetScale)
 * inject only MYSQL_URL/DATABASE_URL and no DB_HOST — without this fallback the
 * pool silently defaulted to `localhost` there and every query failed.
 */
function resolveConfig() {
  const {
    DB_HOST,
    DB_PORT = 3306,
    DB_USER = "root",
    DB_PASSWORD = "",
    DB_NAME = "coe_ecommerce",
    MYSQL_URL,
    DATABASE_URL,
  } = process.env;

  if (!DB_HOST && (MYSQL_URL || DATABASE_URL)) {
    const url = new URL(MYSQL_URL || DATABASE_URL);
    return {
      host: url.hostname,
      port: Number(url.port) || 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, "") || DB_NAME,
      source: "connection URL",
    };
  }

  return {
    host: DB_HOST || "localhost",
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    source: "DB_* variables",
  };
}

let pool;

export function getDbPool() {
  if (!pool) {
    const config = resolveConfig();

    // Tune per deployment. Each Node instance gets its own pool, so total
    // connections to MySQL = DB_POOL_LIMIT × instances — keep that under the
    // server's max_connections.
    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_POOL_LIMIT || 20),
      queueLimit: Number(process.env.DB_QUEUE_LIMIT || 0),
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      // Reject multi-statement payloads outright: it removes the class of SQL
      // injection where a stacked `; DROP TABLE` rides along on one param.
      multipleStatements: false,
    });

    console.log(
      `💾 MySQL pool → ${config.host}:${config.port}/${config.database} (from ${config.source})`
    );
  }

  return pool;
}

export async function testDbConnection() {
  const connection = await getDbPool().getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

/**
 * Run `fn` inside a transaction, committing on success and rolling back on any
 * throw. Guarantees the connection is released exactly once on every path.
 */
export async function withTransaction(fn) {
  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await fn(connection);
    await connection.commit();
    return result;
  } catch (err) {
    try {
      await connection.rollback();
    } catch {
      /* rollback failure must not mask the original error */
    }
    throw err;
  } finally {
    connection.release();
  }
}
