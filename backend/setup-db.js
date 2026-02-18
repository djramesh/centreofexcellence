import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const mysqlUrl =
  process.env.MYSQL_URL ||
  `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const url = new URL(mysqlUrl);
const config = {
  host: url.hostname,
  port: url.port || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
};

console.log(`🔧 Setting up database at ${config.host}...`);

async function setupDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      multipleStatements: true,
    });

    console.log("✅ Connected to MySQL server");

    // 1. Run schema
    const schemaPath = path.join(__dirname, "db", "schema.sql");
    const schemaSQL = fs.readFileSync(schemaPath, "utf8");
    console.log("📝 Running schema.sql...");
    await connection.query(schemaSQL);
    console.log("✅ Schema created successfully");

    // 2. Run main seed
    const seedPath = path.join(__dirname, "db", "seed.sql");
    const seedSQL = fs.readFileSync(seedPath, "utf8");
    console.log("📝 Running seed.sql...");
    await connection.query(seedSQL);
    console.log("✅ Seed data inserted successfully");

    // 3. Run Prerana & Shristi seed
    const preranaSeedPath = path.join(__dirname, "db", "seed_prerana_shristi.sql");
    if (fs.existsSync(preranaSeedPath)) {
      const preranaSeedSQL = fs.readFileSync(preranaSeedPath, "utf8");
      console.log("📝 Running seed_prerana_shristi.sql...");
      await connection.query(preranaSeedSQL);
      console.log("✅ Prerana & Shristi products inserted successfully");
    } else {
      console.log("⚠️  seed_prerana_shristi.sql not found, skipping...");
    }

    // Summary
    const [tables] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
      [config.database]
    );

    console.log(`\n📊 Database '${config.database}' has ${tables.length} tables:`);
    tables.forEach((table) => {
      console.log(`   ✓ ${table.TABLE_NAME}`);
    });

    // Quick product count per category
    const [categoryCounts] = await connection.query(`
      SELECT c.name AS category, COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.name
    `);

    console.log("\n🛍️  Products per category:");
    categoryCounts.forEach((r) => {
      console.log(`   ✓ ${r.category}: ${r.product_count} products`);
    });

    await connection.end();
    console.log("\n✨ Database setup complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error setting up database:");
    console.error(error.message);
    process.exit(1);
  }
}

setupDatabase();