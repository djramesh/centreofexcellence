/**
 * Database backup — writes a restorable .sql file.
 *
 *   npm run backup                                  # backend/.env target
 *   npm run backup -- "mysql://user:pass@host:port/db"   # a remote database
 *
 * Why this exists rather than `mysqldump`: the usual client on a Windows dev
 * machine comes from XAMPP, which ships MariaDB 10.4. That client cannot
 * authenticate against a modern MySQL 8/9 server (it has no caching_sha2
 * support), so `mysqldump` fails before it reads a single row. This talks to
 * the server through mysql2 — the same driver the application already uses —
 * so it works wherever the app itself works.
 *
 * Suitable for databases of this size (a few MB). It buffers each table in
 * memory, so it is not the right tool for a multi-gigabyte database; use
 * mysqldump proper, or the host's own snapshot feature, at that scale.
 */
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const ROWS_PER_INSERT = 200;

function resolveTarget() {
  const arg = process.argv[2];
  if (arg) {
    if (!/^mysql:\/\//i.test(arg)) {
      throw new Error(`Expected a mysql:// connection URL, got: ${arg}`);
    }
    const url = new URL(arg);
    return {
      config: {
        host: url.hostname,
        port: Number(url.port) || 3306,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.replace(/^\//, ""),
      },
      origin: "command line",
    };
  }

  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, MYSQL_URL, DATABASE_URL } = process.env;
  if (!DB_HOST && (MYSQL_URL || DATABASE_URL)) {
    const url = new URL(MYSQL_URL || DATABASE_URL);
    return {
      config: {
        host: url.hostname,
        port: Number(url.port) || 3306,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.replace(/^\//, ""),
      },
      origin: "MYSQL_URL",
    };
  }
  return {
    config: {
      host: DB_HOST || "localhost",
      port: Number(DB_PORT) || 3306,
      user: DB_USER || "root",
      password: DB_PASSWORD || "",
      database: DB_NAME || "coe_ecommerce",
    },
    origin: "DB_* variables",
  };
}

/** Render one value as SQL. mysql2's escaper handles quoting and encoding. */
function toSql(connection, value) {
  if (value === null || value === undefined) return "NULL";
  if (Buffer.isBuffer(value)) return `X'${value.toString("hex")}'`;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "NULL";
    return connection.escape(value.toISOString().slice(0, 19).replace("T", " "));
  }
  if (typeof value === "object") return connection.escape(JSON.stringify(value));
  return connection.escape(value);
}

async function backup() {
  const { config, origin } = resolveTarget();
  const connection = await mysql.createConnection({ ...config, dateStrings: false });

  const [[info]] = await connection.query("SELECT VERSION() AS version, DATABASE() AS db");
  console.log(`🗄  Source: ${config.user}@${config.host}:${config.port}/${config.database}`);
  console.log(`   MySQL ${info.version} (resolved from ${origin})\n`);

  const [tableRows] = await connection.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME`
  );
  const tables = tableRows.map((r) => r.TABLE_NAME);
  if (tables.length === 0) throw new Error("No tables found — is this the right database?");

  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outPath = path.resolve(
    process.env.BACKUP_DIR || path.join(__dirname, "..", "backups"),
    `${config.database}-${stamp}.sql`
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const out = fs.createWriteStream(outPath, { encoding: "utf8" });
  const write = (text) =>
    new Promise((resolve, reject) =>
      out.write(text, (err) => (err ? reject(err) : resolve()))
    );

  await write(
    `-- Backup of \`${config.database}\` from ${config.host}\n` +
      `-- MySQL ${info.version}\n` +
      `-- Taken ${new Date().toISOString()}\n\n` +
      "SET NAMES utf8mb4;\n" +
      "SET FOREIGN_KEY_CHECKS = 0;\n" +
      "SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n\n"
  );

  let grandTotal = 0;

  for (const table of tables) {
    const [[created]] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
    const ddl = created["Create Table"];

    await write(`--\n-- Table: ${table}\n--\n\n`);
    await write(`DROP TABLE IF EXISTS \`${table}\`;\n${ddl};\n\n`);

    const [[{ n }]] = await connection.query(`SELECT COUNT(*) AS n FROM \`${table}\``);

    if (n > 0) {
      const [rows] = await connection.query(`SELECT * FROM \`${table}\``);
      const columns = Object.keys(rows[0]).map((c) => `\`${c}\``).join(", ");

      for (let i = 0; i < rows.length; i += ROWS_PER_INSERT) {
        const chunk = rows.slice(i, i + ROWS_PER_INSERT);
        const values = chunk
          .map((row) => `(${Object.values(row).map((v) => toSql(connection, v)).join(", ")})`)
          .join(",\n  ");
        await write(`INSERT INTO \`${table}\` (${columns}) VALUES\n  ${values};\n`);
      }
      await write("\n");
    }

    grandTotal += n;
    console.log(`   ${table.padEnd(20)} ${String(n).padStart(7)} row(s)`);
  }

  await write("SET FOREIGN_KEY_CHECKS = 1;\n");
  await new Promise((resolve) => out.end(resolve));
  await connection.end();

  const kb = Math.max(1, Math.round(fs.statSync(outPath).size / 1024));
  console.log(`\n✅ ${tables.length} table(s), ${grandTotal} row(s) → ${kb} KB`);
  console.log(`   ${outPath}`);
  console.log(`\n   Restore with:\n   node db/restore.js "<mysql-url>" "${path.basename(outPath)}"`);
}

backup().catch((err) => {
  console.error(`\n❌ Backup failed: ${err.message}`);
  if (err.code === "ER_ACCESS_DENIED_ERROR") {
    console.error("   Check the credentials in the connection URL.");
  } else if (err.code === "ETIMEDOUT" || err.code === "ECONNREFUSED") {
    console.error(
      "   Could not reach the server. For Railway, use MYSQL_PUBLIC_URL\n" +
        "   (the *.proxy.rlwy.net address) — the .railway.internal host only\n" +
        "   resolves from inside Railway."
    );
  }
  process.exit(1);
});
