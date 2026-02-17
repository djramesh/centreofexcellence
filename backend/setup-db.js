import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

// Parse MYSQL_URL properly
const mysqlUrl = process.env.MYSQL_URL || 
  `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const url = new URL(mysqlUrl);
const config = {
  host: url.hostname,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1), // removes leading /
};

console.log(`🔧 Setting up database at ${config.host}...`);

async function setupDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
      multipleStatements: true,
    });

    console.log("✅ Connected to MySQL server");

    const schemaPath = path.join(__dirname, "db", "schema.sql");
    const schemaSQL = fs.readFileSync(schemaPath, "utf8");

    console.log("📝 Running schema.sql...");
    await connection.query(schemaSQL);
    console.log("✅ Schema created successfully");

    const seedPath = path.join(__dirname, "db", "seed.sql");
    const seedSQL = fs.readFileSync(seedPath, "utf8");

    console.log("📝 Running seed.sql...");
    await connection.query(seedSQL);
    console.log("✅ Seed data inserted successfully");

    const [tables] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
      [config.database]
    );

    console.log(`\n📊 Database '${config.database}' has ${tables.length} tables:`);
    tables.forEach((table) => {
      console.log(`   ✓ ${table.TABLE_NAME}`);
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