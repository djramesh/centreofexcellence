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
import categoriesRoutes from "./routes/categories.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import shippingRoutes from "./routes/shipping.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// ============= PROXY =============

/* Railway/Netlify/Nginx terminate TLS and forward the real client IP in
   X-Forwarded-For. Without this, req.ip is the proxy's address, so every
   visitor shares one rate-limit bucket and the per-IP limits are meaningless.
   Trust exactly one hop — trusting all of them lets a client spoof the header
   and dodge rate limiting entirely. */
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS || 1));
app.disable("x-powered-by");

// ============= SECURITY MIDDLEWARE =============

app.use(
  helmet({
    /* The storefront runs on a different origin than the API, so helmet's
       default same-origin CORP would block every /assets/* image the browser
       tries to load from here. */
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // API responses aren't documents; the SPA host sets its own CSP.
  })
);

// CORS with production configuration
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  process.env.FRONTEND_ORIGIN ||
  "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // No Origin header = same-origin, curl, or a server-to-server call
      // (Razorpay's webhook). Those are not subject to CORS.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      /* Reject by withholding the CORS headers rather than throwing. Throwing
         here surfaced as an unhandled 500 with a stack trace; the browser
         blocks the response either way. */
      logger.warn({ message: "Blocked CORS origin", origin });
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization", "x-request-id"],
    maxAge: 86400,
  })
);

// Body parser with size limits.
// Capture the raw body so the Razorpay webhook can verify its HMAC signature
// (the signature is computed over the exact bytes Razorpay sent).
app.use(
  express.json({
    limit: "1mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ limit: "1mb", extended: true }));

// ============= LOGGING & TRACKING =============

app.use((req, res, next) => {
  req.id = req.get("x-request-id") || uuidv4();
  res.setHeader("x-request-id", req.id);
  next();
});

const logFormat = ":remote-addr - :method :url :status :response-time ms - :req[x-request-id]";
app.use(morgan(logFormat, { skip: () => process.env.NODE_ENV === "test" }));

app.use(requestLogger);

// ============= RATE LIMITING =============

const limitResponse = (message) => ({ message });

/* Browsing the storefront is chatty — the products page alone fans out to
   several category endpoints — and shoppers behind office NAT or mobile CGNAT
   share an IP. 100/15min throttled ordinary customers, so the general bucket is
   generous and the sensitive routes below carry the real limits. */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || 600),
  message: limitResponse("Too many requests from this IP, please try again later"),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/api/health",
});

// Credential-guessing defence. skipSuccessfulRequests means a legitimate user
// signing in normally never burns through the budget.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AUTH_MAX || 10),
  message: limitResponse("Too many login attempts, please try again in 15 minutes"),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const checkoutLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_CHECKOUT_MAX || 20),
  message: limitResponse("Too many checkout attempts, please try again shortly"),
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", generalLimiter);

// ============= STATIC FILES =============

app.use(
  express.static(path.join(__dirname, "../public"), {
    maxAge: "7d",
    etag: true,
    // Product images are content-addressed by their upload timestamp, so they
    // are safe to cache; anything else falls back to revalidation.
    setHeaders: (res, filePath) => {
      if (!/\.(png|jpe?g|webp|gif|svg|avif)$/i.test(filePath)) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  })
);

// ============= HEALTH CHECK =============

app.get("/api/health", async (req, res) => {
  try {
    await testDbConnection();
    res.json({ status: "ok", db: "connected", requestId: req.id });
  } catch (err) {
    logger.error({ requestId: req.id, message: "Health check failed", error: err.message });
    res.status(503).json({ status: "error", message: "DB connection failed" });
  }
});

// ============= ROUTES =============

/* The strict auth limiter is scoped to the credential endpoints only. Applying
   it to the whole /api/auth prefix also counted GET /me, which the SPA calls on
   every page load — an expired token could then lock a user out of signing back
   in for 15 minutes. */
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth", authRoutes);

/* The Razorpay webhook is exempt from the checkout limiter: it is the
   authoritative server-to-server confirmation, it is authenticated by HMAC
   rather than by IP, and Razorpay retries on failure — throttling it would
   drop payment confirmations for orders the customer has already paid for. */
app.use(
  "/api/checkout",
  (req, res, next) => (req.path === "/webhook" ? next() : checkoutLimiter(req, res, next)),
  checkoutRoutes
);

app.use("/api/products", productsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/shipping", shippingRoutes);

// ============= ERROR HANDLING =============

// Multer / upload errors
app.use((err, req, res, next) => {
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "Each image must be smaller than 5MB" });
  }
  if (err?.code === "LIMIT_FILE_COUNT" || err?.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({ message: "Too many files uploaded" });
  }
  if (err?.message === "Only image files are allowed") {
    return res.status(400).json({ message: err.message });
  }
  return next(err);
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
