import { getDbPool } from "../config/db.js";
import { logger } from "../utils/logger.js";
import { resolveTracking } from "./carriers.js";

const PENDING_ORDER_TTL_DAYS = Number(process.env.PENDING_ORDER_TTL_DAYS || 2);
const SWEEP_INTERVAL_MS = 15 * 60 * 1000;

let lastSweepAt = 0;

/**
 * Cancel orders left unpaid past the TTL.
 *
 * The order page tells customers "unpaid orders are automatically cancelled
 * after 2 days" — nothing actually did that, so PENDING rows accumulated
 * forever. Runs opportunistically (at most every 15 minutes) rather than on a
 * scheduler, since the app has no job runner. Fire-and-forget: a sweep failure
 * must never break the request that triggered it.
 */
export function expireStalePendingOrders() {
  const now = Date.now();
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = now;

  getDbPool()
    .query(
      `UPDATE orders
          SET status = 'CANCELLED', payment_status = 'FAILED'
        WHERE status = 'PENDING'
          AND payment_status = 'PENDING'
          AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [PENDING_ORDER_TTL_DAYS]
    )
    .then(([result]) => {
      if (result.affectedRows > 0) {
        logger.info({
          message: "Expired stale pending orders",
          count: result.affectedRows,
        });
      }
    })
    .catch((err) => {
      logger.warn({ message: "Pending-order sweep failed", error: err.message });
    });
}

/* Columns a customer is allowed to see. Payment-gateway identifiers and
   internal ShipRocket ids are deliberately excluded — the old `o.*` published
   razorpay_order_id, razorpay_payment_id and shiprocket ids to the browser. */
export const CUSTOMER_ORDER_COLUMNS = `
  o.id, o.user_id, o.status, o.payment_status, o.total_amount,
  o.tracking_id, o.courier_company, o.tracking_url, o.shipping_status,
  o.shipped_at, o.delivered_at, o.created_at, o.updated_at`;

/**
 * Build the customer-facing tracking block for an order.
 * Returns null when nothing has shipped yet, so the UI can branch cleanly.
 */
export function buildTracking(order) {
  if (!order?.tracking_id) return null;

  const resolved = resolveTracking({
    courier: order.courier_company,
    trackingNumber: order.tracking_id,
    explicitUrl: order.tracking_url,
  });

  if (!resolved) return null;

  return {
    ...resolved,
    status: order.shipping_status || null,
    shippedAt: order.shipped_at || null,
    deliveredAt: order.delivered_at || null,
  };
}

/** Attach the tracking block and drop the raw shipping columns from the payload. */
export function presentOrder(order) {
  if (!order) return order;
  const {
    tracking_id,
    courier_company,
    tracking_url,
    shipping_status,
    ...rest
  } = order;

  return { ...rest, tracking: buildTracking(order) };
}
