import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env
dotenv.config({ path: path.join(__dirname, ".env") });

// Get database credentials
const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
};

console.log(`🔧 Setting up database at ${config.host}...`);

async function setupDatabase() {
  try {
    // Connect to MySQL
    const connection = await mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
      multipleStatements: true,
    });

    console.log("✅ Connected to MySQL server");

    // Read schema.sql
    const schemaPath = path.join(__dirname, "db", "schema.sql");
    const schemaSQL = fs.readFileSync(schemaPath, "utf8");

    console.log("📝 Running schema.sql...");
    await connection.query(schemaSQL);
    console.log("✅ Schema created successfully");

    // Read seed.sql
    const seedPath = path.join(__dirname, "db", "seed.sql");
    const seedSQL = fs.readFileSync(seedPath, "utf8");

    console.log("📝 Running seed.sql...");
    await connection.query(seedSQL);
    console.log("✅ Seed data inserted successfully");

    // Verify
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
