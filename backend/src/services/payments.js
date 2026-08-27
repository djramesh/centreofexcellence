import crypto from "crypto";
import Razorpay from "razorpay";

import { getDbPool, withTransaction } from "../config/db.js";
import { logger } from "../utils/logger.js";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

export const razorpayKeyId = keyId;

export const razorpay =
  keyId && keySecret ? new Razorpay({ key_id: keyId, key_secret: keySecret }) : null;

export const isRazorpayConfigured = () => Boolean(razorpay && keySecret);

export const RAZORPAY_NOT_CONFIGURED =
  "Payments are not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env " +
  "(use test keys from Razorpay Dashboard → Test Mode).";

/**
 * Compare two hex digests without leaking, through timing, how many leading
 * bytes matched. A plain `!==` returns as soon as it hits a differing byte,
 * which is measurable over enough requests and lets an attacker walk a valid
 * signature out one byte at a time.
 */
function safeCompareHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

/** Verify the `order_id|payment_id` HMAC that Razorpay Checkout hands the browser. */
export function verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, signature }) {
  if (!keySecret || !razorpayOrderId || !razorpayPaymentId || !signature) return false;
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  return safeCompareHex(expected, signature);
}

/** Verify a webhook body signature against the raw bytes Razorpay sent. */
export function verifyWebhookSignature(rawBody, signature) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret || !rawBody || !signature) return false;
  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");
  return safeCompareHex(expected, signature);
}

export class PaymentError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/**
 * Idempotently mark an order paid.
 *
 * Used by the checkout confirmation, the "Pay Now" retry flow, and the Razorpay
 * webhook, so an order completes exactly once no matter how many of those fire.
 *
 * Stock is deducted HERE — only on confirmed payment, never at order creation —
 * so abandoned checkouts cannot drain inventory.
 *
 * Throws PaymentError with .code:
 *   ORDER_NOT_FOUND | ORDER_MISMATCH | INSUFFICIENT_STOCK | ORDER_NOT_PAYABLE
 */
export async function markOrderPaid({
  orderId,
  userId = null,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature = null,
}) {
  return withTransaction(async (connection) => {
    // Lock the order row so two concurrent confirmations cannot both proceed.
    const where = userId != null ? "id = ? AND user_id = ?" : "id = ?";
    const params = userId != null ? [orderId, userId] : [orderId];

    const [orderRows] = await connection.query(
      `SELECT id, user_id, status, total_amount, payment_status, razorpay_order_id
         FROM orders WHERE ${where} FOR UPDATE`,
      params
    );

    if (orderRows.length === 0) {
      throw new PaymentError("ORDER_NOT_FOUND", "Order not found");
    }

    const order = orderRows[0];

    // Idempotency: already settled, so report success without double-charging
    // stock or inserting a second payment row.
    if (order.payment_status === "PAID") {
      return { alreadyPaid: true, orderId: order.id };
    }

    if (order.status === "CANCELLED") {
      throw new PaymentError("ORDER_NOT_PAYABLE", "This order has been cancelled");
    }

    /* ─────────────────────────────────────────────────────────────────────
       The signature only proves "this Razorpay order was paid" — it says
       nothing about WHICH of our orders it belongs to. Without this binding,
       a valid ₹1 receipt could be replayed against a ₹50,000 order.

       Retries mint a fresh Razorpay order each time, so we accept any gateway
       order that was issued *for this order*: the one currently on the row, or
       any recorded against it in `payments`.
    ───────────────────────────────────────────────────────────────────────*/
    if (!razorpayOrderId) {
      throw new PaymentError("ORDER_MISMATCH", "Payment does not belong to this order");
    }

    const [attachedRows] = await connection.query(
      "SELECT 1 FROM payments WHERE order_id = ? AND razorpay_order_id = ? LIMIT 1",
      [orderId, razorpayOrderId]
    );

    if (order.razorpay_order_id !== razorpayOrderId && attachedRows.length === 0) {
      throw new PaymentError("ORDER_MISMATCH", "Payment does not belong to this order");
    }

    /* Deduct stock atomically (row-locked) at payment time.

       By the time we get here Razorpay has ALREADY captured the money, so
       refusing the order over a stock shortfall is the worst outcome available:
       the customer is charged and the order stays PENDING until the sweeper
       cancels it. Instead we honour the order, clamp the deduction so stock
       never goes negative, and record the shortfall loudly for the admin to
       reconcile. A shortfall only happens if the last unit sells between order
       creation and payment capture. */
    const [itemRows] = await connection.query(
      "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
      [orderId]
    );

    const shortfalls = [];

    for (const item of itemRows) {
      const [prodRows] = await connection.query(
        "SELECT id, name, stock FROM products WHERE id = ? FOR UPDATE",
        [item.product_id]
      );
      const product = prodRows[0];

      if (!product) {
        shortfalls.push({ productId: item.product_id, name: null, ordered: item.quantity, available: 0 });
        continue;
      }

      if (product.stock < item.quantity) {
        shortfalls.push({
          productId: product.id,
          name: product.name,
          ordered: item.quantity,
          available: product.stock,
        });
      }

      const deduct = Math.min(product.stock, item.quantity);
      if (deduct > 0) {
        await connection.query("UPDATE products SET stock = stock - ? WHERE id = ?", [
          deduct,
          item.product_id,
        ]);
      }
    }

    if (shortfalls.length > 0) {
      logger.error({
        message: "OVERSOLD: payment captured for stock that was not available",
        orderId,
        razorpayPaymentId,
        shortfalls,
        action: "Contact the customer to arrange a restock or refund.",
      });
    }

    await connection.query(
      `UPDATE orders
          SET status = 'PAID', payment_status = 'PAID', razorpay_payment_id = ?
        WHERE id = ?`,
      [razorpayPaymentId, orderId]
    );

    /* Settle the PENDING row this gateway order created at initiate time. If
       there is none (the original checkout path), insert one. The unique index
       on razorpay_payment_id is the second line of defence against a replayed
       confirmation creating duplicate rows. */
    const [settled] = await connection.query(
      `UPDATE payments
          SET razorpay_payment_id = ?, razorpay_signature = ?, status = 'SUCCESS', amount = ?
        WHERE order_id = ? AND razorpay_order_id = ? AND status = 'PENDING'`,
      [razorpayPaymentId, razorpaySignature, order.total_amount, orderId, razorpayOrderId]
    );

    if (settled.affectedRows === 0) {
      await connection.query(
        `INSERT IGNORE INTO payments
           (order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, status, amount, currency)
         VALUES (?, ?, ?, ?, 'SUCCESS', ?, 'INR')`,
        [
          orderId,
          razorpayOrderId || order.razorpay_order_id,
          razorpayPaymentId,
          razorpaySignature,
          order.total_amount,
        ]
      );
    }

    return { alreadyPaid: false, orderId: order.id };
  });
}

/** Record a freshly created gateway order so a later confirmation can be bound to it. */
export async function attachGatewayOrder({ orderId, razorpayOrderId, amount }) {
  await getDbPool().query(
    `INSERT INTO payments (order_id, razorpay_order_id, status, amount, currency)
     VALUES (?, ?, 'PENDING', ?, 'INR')`,
    [orderId, razorpayOrderId, amount]
  );
}

/** Map a PaymentError onto the HTTP status the client should see. */
export function paymentErrorStatus(err) {
  switch (err?.code) {
    case "ORDER_NOT_FOUND":
      return 404;
    case "ORDER_MISMATCH":
      return 400;
    case "ORDER_NOT_PAYABLE":
      return 409;
    case "INSUFFICIENT_STOCK":
      return 409;
    default:
      return null;
  }
}

/**
 * Look up the internal order backing a Razorpay order id.
 *
 * Falls back to `payments` so a webhook for a superseded retry attempt still
 * resolves — the orders row only ever holds the most recent gateway order.
 */
export async function findOrderIdByRazorpayOrderId(razorpayOrderId) {
  const pool = getDbPool();

  const [orderRows] = await pool.query(
    "SELECT id FROM orders WHERE razorpay_order_id = ? LIMIT 1",
    [razorpayOrderId]
  );
  if (orderRows[0]?.id) return orderRows[0].id;

  const [paymentRows] = await pool.query(
    "SELECT order_id FROM payments WHERE razorpay_order_id = ? ORDER BY id DESC LIMIT 1",
    [razorpayOrderId]
  );
  return paymentRows[0]?.order_id ?? null;
}
