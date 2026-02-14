import { logger } from "../utils/logger.js";

/**
 * Express Error Handler Middleware
 * Should be mounted AFTER all other routes
 */
export function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV !== "production";

  // Log the error
  logger.error({
    message: err.message,
    stack: err.stack,
    requestId: req.id,
    method: req.method,
    path: req.path,
    ip: req.ip,
    status: err.status || 500,
  });

  // Determine response status
  const status = err.status || err.statusCode || 500;

  // Build response
  const response = {
    message:
      isDev && err.message ? err.message : "Internal server error",
    ...(isDev && { requestId: req.id }),
  };

  // Add additional details in development
  if (isDev && err.details) {
    response.details = err.details;
  }

  res.status(status).json(response);
}

/**
 * 404 Handler
 */
export function notFoundHandler(req, res) {
  logger.warn({
    message: "Route not found",
    requestId: req.id,
    method: req.method,
    path: req.path,
  });

  res.status(404).json({
    message: "Route not found",
    requestId: req.id,
  });
}

/**
 * Request logging middleware
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;

    logger.info({
      requestId: req.id,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
  });

  next();
}
