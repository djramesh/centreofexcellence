/**
 * Idempotent schema migrations.
 *
 *   npm run migrate            (from backend/)
 *
 * Safe to run repeatedly: every step checks information_schema first, and each
 * applied migration is recorded in `schema_migrations`. Nothing here drops or
 * rewrites existing data.
 *
 * Written as JS rather than a .sql file because conditional DDL in MySQL needs
 * either a stored procedure (which requires DELIMITER, a mysql-CLI construct the
 * mysql2 driver does not understand) or these information_schema checks.
 */
import mysql from "mysql2/promise";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

function parseUrl(raw) {
  const url = new URL(raw);
  return {
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
  };
}

function resolveConfig() {
  /* An explicit connection URL on the command line beats everything:
   *
   *   node db/migrate.js "mysql://user:pass@host:port/dbname"
   *
   * This is how you migrate a remote database (Railway, PlanetScale) from a
   * laptop. It has to take precedence over .env because dotenv does NOT
   * override variables already present, so a DB_HOST=localhost sitting in
   * .env would otherwise win and you would quietly migrate the wrong
   * database — your local one — while believing you had migrated production. */
  const cliUrl = process.argv[2];
  if (cliUrl) {
    if (!/^mysql:\/\//i.test(cliUrl)) {
      throw new Error(`Expected a mysql:// connection URL, got: ${cliUrl}`);
    }
    return { ...parseUrl(cliUrl), origin: "command line" };
  }

  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, MYSQL_URL, DATABASE_URL } = process.env;

  if (!DB_HOST && (MYSQL_URL || DATABASE_URL)) {
    return { ...parseUrl(MYSQL_URL || DATABASE_URL), origin: "MYSQL_URL" };
  }

  return {
    host: DB_HOST || "localhost",
    port: Number(DB_PORT) || 3306,
    user: DB_USER || "root",
    password: DB_PASSWORD || "",
    database: DB_NAME || "coe_ecommerce",
    origin: "DB_* variables",
  };
}

let config;
try {
  config = resolveConfig();
} catch (err) {
  console.error(`\n❌ ${err.message}\n`);
  console.error("Usage:");
  console.error("  node db/migrate.js                          # use backend/.env");
  console.error('  node db/migrate.js "mysql://u:p@host:port/db"  # migrate a remote database\n');
  process.exit(1);
}

let connection;
const applied = [];
const skipped = [];

async function columnExists(table, column) {
  const [rows] = await connection.query(
    `SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [config.database, table, column]
  );
  return rows.length > 0;
}

async function indexExists(table, indexName) {
  const [rows] = await connection.query(
    `SELECT 1 FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
    [config.database, table, indexName]
  );
  return rows.length > 0;
}

async function tableExists(table) {
  const [rows] = await connection.query(
    `SELECT 1 FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? LIMIT 1`,
    [config.database, table]
  );
  return rows.length > 0;
}

async function addColumn(table, column, definition) {
  const label = `${table}.${column}`;
  if (!(await tableExists(table))) return skipped.push(`${label} (table missing)`);
  if (await columnExists(table, column)) return skipped.push(label);
  await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`);
  applied.push(`+ column ${label}`);
}

async function addIndex(table, indexName, definition) {
  const label = `${table}.${indexName}`;
  if (!(await tableExists(table))) return skipped.push(`${label} (table missing)`);
  if (await indexExists(table, indexName)) return skipped.push(label);
  try {
    await connection.query(`ALTER TABLE \`${table}\` ADD ${definition}`);
    applied.push(`+ index ${label}`);
  } catch (err) {
    // A UNIQUE index fails if the column already holds duplicates. Report it
    // rather than aborting the whole migration.
    if (err.code === "ER_DUP_ENTRY") {
      skipped.push(`${label} (blocked: existing duplicate values — clean these up, then re-run)`);
      return;
    }
    throw err;
  }
}

async function run(sql, description) {
  await connection.query(sql);
  applied.push(description);
}

async function migrate() {
  const { origin, ...connectOptions } = config;
  connection = await mysql.createConnection({ ...connectOptions, multipleStatements: false });

  /* Print the exact target before touching anything. Migrating the wrong
     database is the expensive mistake here, and it is silent. */
  console.log(`🔧 Target: ${config.user}@${config.host}:${config.port}/${config.database}`);
  console.log(`   (resolved from ${origin})\n`);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(191) NOT NULL PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`);

  /* ── 1. Product dimensions ────────────────────────────────────────────
     The admin UI and the API have written these since before this migration
     existed, but schema.sql never declared them — a fresh database was missing
     the columns entirely. */
  await addColumn("products", "length_cm", "length_cm DECIMAL(8,2) NULL AFTER is_active");
  await addColumn("products", "breadth_cm", "breadth_cm DECIMAL(8,2) NULL AFTER length_cm");
  await addColumn("products", "height_cm", "height_cm DECIMAL(8,2) NULL AFTER breadth_cm");

  /* ── 2. Product gallery ───────────────────────────────────────────────── */
  if (!(await tableExists("product_images"))) {
    await run(
      `CREATE TABLE product_images (
         id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
         product_id INT UNSIGNED NOT NULL,
         image_url VARCHAR(500) NOT NULL,
         alt_text VARCHAR(255) NULL,
         sort_order INT NOT NULL DEFAULT 0,
         is_primary TINYINT(1) NOT NULL DEFAULT 0,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
         CONSTRAINT fk_product_images_product
           FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
       ) ENGINE=InnoDB`,
      "+ table product_images"
    );
  } else {
    await addColumn("product_images", "alt_text", "alt_text VARCHAR(255) NULL AFTER image_url");
    await addColumn(
      "product_images",
      "is_primary",
      "is_primary TINYINT(1) NOT NULL DEFAULT 0 AFTER sort_order"
    );
    // Cloudinary URLs routinely exceed the original VARCHAR(255).
    await run(
      "ALTER TABLE product_images MODIFY COLUMN image_url VARCHAR(500) NOT NULL",
      "~ widened product_images.image_url to VARCHAR(500)"
    );
  }
  await addIndex(
    "product_images",
    "idx_product_images_product",
    "INDEX idx_product_images_product (product_id, is_primary DESC, sort_order)"
  );

  /* ── 3. Shipping / tracking columns ───────────────────────────────────
     migration_add_shipping.sql adds most of these but is not idempotent, so
     re-add each one conditionally and introduce tracking_provider. */
  await addColumn("orders", "shiprocket_order_id", "shiprocket_order_id VARCHAR(191) NULL");
  await addColumn("orders", "shiprocket_shipment_id", "shiprocket_shipment_id VARCHAR(191) NULL");
  await addColumn("orders", "tracking_id", "tracking_id VARCHAR(191) NULL");
  await addColumn("orders", "courier_company", "courier_company VARCHAR(100) NULL");
  await addColumn("orders", "tracking_url", "tracking_url VARCHAR(500) NULL");
  await addColumn("orders", "shipping_status", "shipping_status VARCHAR(50) NULL");
  await addColumn("orders", "shipped_at", "shipped_at TIMESTAMP NULL");
  await addColumn("orders", "delivered_at", "delivered_at TIMESTAMP NULL");
  await addColumn(
    "orders",
    "tracking_provider",
    "tracking_provider ENUM('MANUAL','SHIPROCKET') NULL AFTER tracking_url"
  );

  // Backfill: shipments that predate tracking_provider came from ShipRocket.
  await run(
    `UPDATE orders SET tracking_provider = 'SHIPROCKET'
      WHERE tracking_provider IS NULL AND shiprocket_shipment_id IS NOT NULL`,
    "~ backfilled tracking_provider for existing ShipRocket shipments"
  );
  await run(
    `UPDATE orders SET tracking_provider = 'MANUAL'
      WHERE tracking_provider IS NULL AND tracking_id IS NOT NULL`,
    "~ backfilled tracking_provider for existing manual shipments"
  );

  /* ── 4. Payment integrity ─────────────────────────────────────────────
     Without this, a replayed confirmation could insert the same gateway payment
     twice and double-count revenue.

     An existing database may already hold duplicates created by the old retry
     path, which inserted a payments row on every confirmation with no
     idempotency check. MySQL refuses to build a UNIQUE index over those, so
     surface them explicitly instead of letting the index be quietly skipped —
     otherwise the protection appears applied but is not there. */
  if (
    (await tableExists("payments")) &&
    !(await indexExists("payments", "uniq_payments_razorpay_payment"))
  ) {
    const [dupes] = await connection.query(
      `SELECT razorpay_payment_id, COUNT(*) AS copies, GROUP_CONCAT(id ORDER BY id) AS row_ids
         FROM payments
        WHERE razorpay_payment_id IS NOT NULL
        GROUP BY razorpay_payment_id
       HAVING COUNT(*) > 1
        ORDER BY copies DESC`
    );

    if (dupes.length > 0) {
      console.error(
        `\n⚠️  ${dupes.length} duplicate payment id(s) found — the UNIQUE index cannot be built yet:\n`
      );
      dupes.slice(0, 10).forEach((row) => {
        console.error(
          `   ${row.razorpay_payment_id}  ×${row.copies}  (payments.id: ${row.row_ids})`
        );
      });
      if (dupes.length > 10) console.error(`   …and ${dupes.length - 10} more`);
      console.error(
        "\n   These are almost certainly double-recorded confirmations of a single\n" +
          "   real payment, so revenue totals are currently overstated. Verify against\n" +
          "   your Razorpay dashboard, keep the earliest row of each group, then re-run:\n\n" +
          "     DELETE p FROM payments p\n" +
          "       JOIN (SELECT MIN(id) AS keep_id, razorpay_payment_id\n" +
          "               FROM payments WHERE razorpay_payment_id IS NOT NULL\n" +
          "              GROUP BY razorpay_payment_id HAVING COUNT(*) > 1) d\n" +
          "         ON p.razorpay_payment_id = d.razorpay_payment_id\n" +
          "      WHERE p.id <> d.keep_id;\n"
      );
    }
  }

  await addIndex(
    "payments",
    "uniq_payments_razorpay_payment",
    "UNIQUE INDEX uniq_payments_razorpay_payment (razorpay_payment_id)"
  );
  await addIndex(
    "payments",
    "idx_payments_razorpay_order",
    "INDEX idx_payments_razorpay_order (razorpay_order_id)"
  );

  /* ── 5. Query indexes ────────────────────────────────────────────────
     Every one of these backs a query the app runs on a hot path and which was
     doing a full table scan. */
  await addIndex("orders", "idx_orders_user_created", "INDEX idx_orders_user_created (user_id, created_at DESC)");
  await addIndex("orders", "idx_orders_status", "INDEX idx_orders_status (status)");
  await addIndex("orders", "idx_orders_razorpay_order", "INDEX idx_orders_razorpay_order (razorpay_order_id)");
  await addIndex("orders", "idx_orders_tracking", "INDEX idx_orders_tracking (tracking_id)");
  await addIndex("orders", "idx_orders_pending_sweep", "INDEX idx_orders_pending_sweep (status, payment_status, created_at)");
  await addIndex("products", "idx_products_active_category", "INDEX idx_products_active_category (is_active, category_id)");
  await addIndex("order_items", "idx_order_items_product", "INDEX idx_order_items_product (product_id)");
  await addIndex("addresses", "idx_addresses_user", "INDEX idx_addresses_user (user_id)");
  await addIndex("admin_audit_logs", "idx_audit_created", "INDEX idx_audit_created (created_at DESC)");

  await connection.query(
    "INSERT IGNORE INTO schema_migrations (name) VALUES ('002_gallery_tracking_indexes')"
  );

  console.log(`✅ Applied ${applied.length} change(s):`);
  applied.forEach((line) => console.log(`   ${line}`));

  if (skipped.length) {
    console.log(`\n⏭️  Already present / skipped (${skipped.length}):`);
    skipped.forEach((line) => console.log(`   ${line}`));
  }

  console.log("\n✨ Migration complete.");
}

migrate()
  .then(async () => {
    await connection?.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("\n❌ Migration failed:", err.message);

    if (err.code === "ER_BAD_DB_ERROR") {
      console.error(
        `\n   The database '${config.database}' does not exist yet.\n` +
          "   Create it and load the schema first:  npm run setup-db\n" +
          "   Then run this again:                  npm run migrate"
      );
    } else if (err.code === "ECONNREFUSED") {
      console.error(
        `\n   Could not reach MySQL at ${config.host}:${config.port}.\n` +
          "   Check the server is running and that DB_HOST / MYSQL_URL in backend/.env are correct."
      );
    } else if (err.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("\n   MySQL rejected the credentials in backend/.env (DB_USER / DB_PASSWORD).");
    }

    await connection?.end();
    process.exit(1);
  });
