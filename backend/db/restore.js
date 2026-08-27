/**
 * Restore a backup produced by db/backup.js.
 *
 *   node db/restore.js "mysql://user:pass@host:port/db" backups/<file>.sql --yes
 *
 * This DROPS AND REPLACES every table in the backup, so it refuses to run
 * without --yes and always prints the target first. Restoring over the wrong
 * database is the kind of mistake that has no undo.
 */
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const [urlArg, fileArg, ...flags] = process.argv.slice(2);
const confirmed = flags.includes("--yes");

if (!urlArg || !fileArg) {
  console.error("Usage:");
  console.error('  node db/restore.js "mysql://user:pass@host:port/db" <backup.sql> --yes\n');
  process.exit(1);
}
if (!/^mysql:\/\//i.test(urlArg)) {
  console.error(`❌ Expected a mysql:// connection URL, got: ${urlArg}`);
  process.exit(1);
}

const filePath = path.isAbsolute(fileArg)
  ? fileArg
  : fs.existsSync(fileArg)
    ? path.resolve(fileArg)
    : path.join(__dirname, "..", "backups", fileArg);

if (!fs.existsSync(filePath)) {
  console.error(`❌ Backup file not found: ${filePath}`);
  process.exit(1);
}

const url = new URL(urlArg);
const config = {
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ""),
};

/* Split on semicolons that end a statement, ignoring those inside strings or
   comments. The dump is machine-generated, but row data routinely contains
   semicolons and quotes, so a naive split(";") corrupts the restore. */
function splitStatements(sql) {
  const statements = [];
  let current = "";
  let quote = null;
  let escaped = false;
  let lineComment = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];

    if (lineComment) {
      if (ch === "\n") { lineComment = false; current += ch; }
      continue;
    }
    if (!quote && ch === "-" && sql[i + 1] === "-" && (sql[i + 2] === " " || sql[i + 2] === "\n")) {
      lineComment = true;
      continue;
    }
    if (quote) {
      current += ch;
      if (escaped) { escaped = false; continue; }
      if (ch === "\\") { escaped = true; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") { quote = ch; current += ch; continue; }
    if (ch === ";") {
      if (current.trim()) statements.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

async function confirm() {
  if (confirmed) return true;
  if (!process.stdin.isTTY) {
    console.error("\n❌ Refusing to restore without --yes (no terminal to confirm on).");
    return false;
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) =>
    rl.question(`\nType the database name to confirm (${config.database}): `, resolve)
  );
  rl.close();
  return answer.trim() === config.database;
}

async function restore() {
  console.log("⚠️  RESTORE — this drops and replaces every table in the backup.\n");
  console.log(`   Target: ${config.user}@${config.host}:${config.port}/${config.database}`);
  console.log(`   Source: ${filePath}`);

  if (!(await confirm())) {
    console.error("\nAborted — nothing was changed.");
    process.exit(1);
  }

  const sql = fs.readFileSync(filePath, "utf8");
  const statements = splitStatements(sql);
  const connection = await mysql.createConnection({ ...config, multipleStatements: false });

  console.log(`\n   Executing ${statements.length} statement(s)…`);
  let done = 0;
  try {
    for (const statement of statements) {
      await connection.query(statement);
      done++;
    }
  } catch (err) {
    console.error(`\n❌ Failed on statement ${done + 1}: ${err.message}`);
    console.error(`   ${statements[done]?.slice(0, 160)}…`);
    await connection.end();
    process.exit(1);
  }

  const [tables] = await connection.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME`
  );
  console.log("\n   Restored:");
  let total = 0;
  for (const { TABLE_NAME } of tables) {
    const [[{ n }]] = await connection.query(`SELECT COUNT(*) AS n FROM \`${TABLE_NAME}\``);
    total += n;
    console.log(`     ${TABLE_NAME.padEnd(20)} ${String(n).padStart(7)} row(s)`);
  }

  await connection.end();
  console.log(`\n✅ ${tables.length} table(s), ${total} row(s) restored.`);
}

restore().catch((err) => {
  console.error(`\n❌ Restore failed: ${err.message}`);
  process.exit(1);
});
