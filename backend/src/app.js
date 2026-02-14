import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import { v4 as uuidv4 } from "uuid";

import { testDbConnection } from "./config/db.js";
import { errorHandler, notFoundHandler, requestLogger } from "./middleware/errorHandler.js";
import { logger } from "./utils/logger.js";
import authRoutes from "./routes/auth.routes.js";
import checkoutRoutes from "./routes/checkout.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import productsRoutes from "./routes/products.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import shippingRoutes from "./routes/shipping.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// ============= SECURITY MIDDLEWARE =============

// Security headers
app.use(helmet());

// CORS with production configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_ORIGIN || "http://localhost:5173").split(",");

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parser with size limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));

// ============= LOGGING & TRACKING =============

// Add request ID to all requests
app.use((req, res, next) => {
  req.id = req.get("x-request-id") || uuidv4();
  res.set("X-Request-ID", req.id);
  next();
});

// Request logging (before rate limiting so we can log rate limit hits)
app.use(morgan((tokens, req, res) => {
  return JSON.stringify({
    requestId: req.id,
    timestamp: tokens.date(req, res, "iso"),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    responseTime: tokens.response_time(req, res),
    contentLength: tokens.res(req, res, "content-length"),
  });
}));

app.use(requestLogger);

// ============= RATE LIMITING =============

// General API rate limiter (100 requests per 15 minutes)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/api/health", // Don't rate limit health checks
});

// Strict rate limiter for auth endpoints (5 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again later",
  skipSuccessfulRequests: true,
});

// Strict rate limiter for payment endpoints (10 requests per 5 minutes)
const checkoutLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: "Too many checkout attempts, please try again later",
});

app.use("/api/", generalLimiter);

// ============= STATIC FILES =============

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "../public")));

// ============= HEALTH CHECK =============

app.get("/api/health", async (req, res) => {
  try {
    await testDbConnection();
    logger.info({ requestId: req.id, message: "Health check passed" });
    res.json({ status: "ok", db: "connected", requestId: req.id });
  } catch (err) {
    logger.error({ requestId: req.id, message: "Health check failed", error: err.message });
    res.status(500).json({ status: "error", message: "DB connection failed" });
  }
});

// ============= ROUTES =============

// Auth routes
app.use("/api/auth", authLimiter, authRoutes);

// Checkout routes
app.use("/api/checkout", checkoutLimiter, checkoutRoutes);

// Public products (for storefront)
app.use("/api/products", productsRoutes);

// User orders (list, detail, invoice)
app.use("/api/orders", ordersRoutes);

// Admin (protected)
app.use("/api/admin", adminRoutes);

// Shipping (protected - admin)
app.use("/api/shipping", shippingRoutes);

// ============= ERROR HANDLING =============

// Multer error handling
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File size must be less than 1MB" });
  }
  if (err.message === "Only image files are allowed") {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
