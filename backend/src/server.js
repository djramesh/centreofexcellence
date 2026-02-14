import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from backend folder (works whether you run from backend/ or backend/src/)
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

// ============= ENVIRONMENT VALIDATION =============
const requiredEnvVars = [
  "DB_HOST",
  "DB_USER",
  "DB_NAME",
  "JWT_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
];

const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  console.error("ERROR: Missing required environment variables:");
  missingVars.forEach((key) => console.error(`   - ${key}`));
  console.error("\n Please copy backend/.env.example to backend/.env and fill in the values");
  process.exit(1);
}

// Warn if using default/weak JWT secret in production
if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET?.length < 32) {
  console.error(" ERROR: JWT_SECRET must be at least 32 characters in production");
  console.error("   Generate a strong secret: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
  process.exit(1);
}

// ============= START SERVER =============
const { default: app } = await import("./app.js");

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`✅ COE backend listening on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`💾 Database: ${process.env.DB_NAME}`);
});


