import { logger } from "./logger.js";

export const isProduction = () => process.env.NODE_ENV === "production";

/**
 * Send an error response without leaking internals to the client.
 *
 * The underlying error is always logged in full. `err.message` is only echoed
 * back outside production, so MySQL/driver text (table names, column names,
 * query fragments) never escapes a live deployment.
 */
export function fail(res, status, message, err, context = {}) {
  if (err) {
    logger.error({
      requestId: res.req?.id,
      method: res.req?.method,
      path: res.req?.originalUrl,
      message: `${message}: ${err.message}`,
      stack: err.stack,
      ...context,
    });
  }

  const body = { message };
  if (err && !isProduction()) body.error = err.message;

  return res.status(status).json(body);
}

/**
 * Parse a positive integer route/query param, returning null when it is not a
 * clean positive integer. Guards against `NaN` reaching a query and against
 * values like "12abc" being silently coerced by MySQL.
 */
export function parseId(value) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const str = String(value).trim();
  if (!/^\d+$/.test(str)) return null;
  const num = Number(str);
  return Number.isSafeInteger(num) && num > 0 ? num : null;
}

/** Clamp `page`/`limit` query params into a safe range. */
export function parsePagination(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, offset: (page - 1) * limit };
}
