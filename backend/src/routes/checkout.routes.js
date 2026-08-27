import express from "express";
import { body, validationResult } from "express-validator";

import { getDbPool, withTransaction } from "../config/db.js";
import { authRequired } from "../middleware/auth.js";
import { fail } from "../utils/http.js";
import { logger } from "../utils/logger.js";
import {
  razorpay,
  razorpayKeyId,
  isRazorpayConfigured,
  RAZORPAY_NOT_CONFIGURED,
  markOrderPaid,
  paymentErrorStatus,
  verifyPaymentSignature,
  verifyWebhookSignature,
  findOrderIdByRazorpayOrderId,
  attachGatewayOrder,
} from "../services/payments.js";
import { expireStalePendingOrders } from "../services/orders.js";

const router = express.Router();
const pool = getDbPool();

const MAX_LINE_ITEMS = 50;
const MAX_QUANTITY_PER_LINE = 99;

/* Prices are never taken from the client. `price`/`totalAmount` may be sent by
   the browser but are ignored — every amount is recomputed from the products
   table below. */
const createOrderValidation = [
  body("items")
    .isArray({ min: 1, max: MAX_LINE_ITEMS })
    .withMessage(`Provide between 1 and ${MAX_LINE_ITEMS} items`),
  body("items.*.productId").isInt({ min: 1 }).withMessage("Valid product ID required"),
  body("items.*.quantity")
    .isInt({ min: 1, max: MAX_QUANTITY_PER_LINE })
    .withMessage(`Quantity must be between 1 and ${MAX_QUANTITY_PER_LINE}`),
  body("address.line1").trim().notEmpty().withMessage("Address line 1 is required").isLength({ max: 255 }),
  body("address.line2").optional({ values: "falsy" }).trim().isLength({ max: 255 }),
  body("address.city").trim().notEmpty().withMessage("City is required").isLength({ max: 100 }),
  body("address.state").trim().notEmpty().withMessage("State is required").isLength({ max: 100 }),
  body("address.pincode")
    .trim()
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage("Enter a valid 6-digit pincode"),
  body("address.country").optional({ values: "falsy" }).trim().isLength({ max: 100 }),
];

/**
 * POST /api/checkout/create-order
 * Creates the DB order at server-resolved prices, then opens a Razorpay order.
 */
router.post("/create-order", authRequired, createOrderValidation, async (req, res) => {
  if (!isRazorpayConfigured()) {
    return res.status(503).json({ message: RAZORPAY_NOT_CONFIGURED });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }

  const { items, address } = req.body;
  const userId = req.user.id;

  // Collapse duplicate lines for the same product so "2 × qty 3" cannot slip
  // past the per-line quantity cap.
  const merged = new Map();
  for (const item of items) {
    const id = Number(item.productId);
    merged.set(id, (merged.get(id) || 0) + Number(item.quantity));
  }
  for (const [productId, quantity] of merged) {
    if (quantity > MAX_QUANTITY_PER_LINE) {
      return res.status(400).json({
        message: `Quantity for product ${productId} exceeds the maximum of ${MAX_QUANTITY_PER_LINE}`,
      });
    }
  }

  let orderId;
  let computedTotal = 0;

  try {
    ({ orderId, computedTotal } = await withTransaction(async (connection) => {
      const pricedItems = [];
      let total = 0;

      for (const [productId, quantity] of merged) {
        const [productRows] = await connection.query(
          "SELECT id, name, price, stock FROM products WHERE id = ? AND is_active = 1",
          [productId]
        );

        if (productRows.length === 0) {
          const err = new Error(`Product ${productId} is no longer available`);
          err.httpStatus = 404;
          throw err;
        }

        const product = productRows[0];
        if (product.stock < quantity) {
          const err = new Error(
            `Insufficient stock for ${product.name}. Available: ${product.stock}`
          );
          err.httpStatus = 400;
          throw err;
        }

        const unitPrice = Number(product.price); // server price — client value ignored
        const lineTotal = unitPrice * quantity;
        total += lineTotal;
        pricedItems.push({ productId: product.id, quantity, unitPrice, lineTotal });
      }

      const [addressResult] = await connection.query(
        `INSERT INTO addresses (user_id, line1, line2, city, state, pincode, country, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          userId,
          address.line1,
          address.line2 || null,
          address.city,
          address.state,
          address.pincode,
          address.country || "India",
        ]
      );

      const [orderResult] = await connection.query(
        `INSERT INTO orders (user_id, address_id, status, payment_status, total_amount)
         VALUES (?, ?, 'PENDING', 'PENDING', ?)`,
        [userId, addressResult.insertId, total]
      );

      // Stock is NOT deducted here — only on confirmed payment (markOrderPaid),
      // so abandoned checkouts cannot drain inventory.
      for (const item of pricedItems) {
        await connection.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
           VALUES (?, ?, ?, ?, ?)`,
          [orderResult.insertId, item.productId, item.quantity, item.unitPrice, item.lineTotal]
        );
      }

      return { orderId: orderResult.insertId, computedTotal: total };
    }));
  } catch (err) {
    if (err.httpStatus) return res.status(err.httpStatus).json({ message: err.message });
    return fail(res, 500, "Failed to create order", err);
  }

  // ── Payment-gateway call, deliberately OUTSIDE the DB transaction so a
  //    connection is never held open across a network round-trip. ──
  let razorpayOrder;
  try {
    razorpayOrder = await razorpay.orders.create({
      amount: Math.round(computedTotal * 100), // paise
      currency: "INR",
      receipt: `order_${orderId}`,
      notes: { orderId: String(orderId), userId: String(userId) },
    });
  } catch (rzpErr) {
    logger.error({ message: "Razorpay order create failed", orderId, error: rzpErr.message });
    try {
      await pool.query(
        "UPDATE orders SET status = 'CANCELLED', payment_status = 'FAILED' WHERE id = ?",
        [orderId]
      );
    } catch {
      /* leaving the order PENDING is acceptable; the sweeper will expire it */
    }
    return res.status(502).json({ message: "Payment gateway error. Please try again." });
  }

  try {
    await pool.query("UPDATE orders SET razorpay_order_id = ? WHERE id = ?", [
      razorpayOrder.id,
      orderId,
    ]);
    await attachGatewayOrder({ orderId, razorpayOrderId: razorpayOrder.id, amount: computedTotal });
  } catch (err) {
    // Without this link the payment can never be matched back to the order,
    // so fail loudly instead of letting the customer pay into a void.
    logger.error({ message: "Failed to attach razorpay_order_id", orderId, error: err.message });
    return fail(res, 500, "Failed to start payment. Please try again.", err);
  }

  expireStalePendingOrders();

  res.json({
    orderId,
    razorpayOrderId: razorpayOrder.id,
    // Returned so the browser never needs its own copy of the key. Previously
    // the SPA read VITE_RAZORPAY_KEY_ID and checkout silently died when unset.
    keyId: razorpayKeyId,
    amount: razorpayOrder.amount, // authoritative amount in paise
    currency: razorpayOrder.currency,
  });
});

/**
 * POST /api/checkout/verify-payment
 * Client-driven confirmation after the Razorpay modal closes.
 */
router.post("/verify-payment", authRequired, async (req, res) => {
  if (!isRazorpayConfigured()) {
    return res.status(503).json({ message: RAZORPAY_NOT_CONFIGURED });
  }

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ message: "Missing payment details" });
  }

  if (!verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, signature: razorpaySignature })) {
    logger.warn({ message: "Rejected payment: bad signature", orderId, userId: req.user.id });
    return res.status(400).json({ message: "Invalid payment signature" });
  }

  try {
    await markOrderPaid({
      orderId,
      userId: req.user.id,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
    res.json({ success: true, message: "Payment verified successfully", orderId });
  } catch (err) {
    const status = paymentErrorStatus(err);
    if (status) {
      logger.warn({ message: `Payment rejected: ${err.code}`, orderId, userId: req.user.id });
      return res.status(status).json({ message: err.message });
    }
    fail(res, 500, "Failed to verify payment", err);
  }
});

/**
 * POST /api/checkout/webhook
 * Authoritative server-to-server confirmation. Ensures an order completes even
 * if the customer closes the tab immediately after paying.
 *
 * Requires RAZORPAY_WEBHOOK_SECRET and the raw body (captured by express.json's
 * `verify` hook in app.js → req.rawBody).
 */
router.post("/webhook", async (req, res) => {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    // Not configured — 200 so Razorpay stops retrying.
    return res.status(200).json({ status: "ignored" });
  }

  const signature = req.headers["x-razorpay-signature"];
  if (!req.rawBody || !signature) {
    return res.status(400).json({ message: "Missing webhook signature" });
  }

  if (!verifyWebhookSignature(req.rawBody, signature)) {
    logger.warn({ message: "Rejected webhook: bad signature", requestId: req.id });
    return res.status(400).json({ message: "Invalid webhook signature" });
  }

  const event = req.body || {};

  try {
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload?.payment?.entity;
      const razorpayOrderId = payment?.order_id;
      const razorpayPaymentId = payment?.id;

      if (razorpayOrderId) {
        const orderId = await findOrderIdByRazorpayOrderId(razorpayOrderId);
        if (orderId) {
          await markOrderPaid({ orderId, razorpayOrderId, razorpayPaymentId });
          logger.info({ message: "Order settled via webhook", orderId, event: event.event });
        } else {
          logger.warn({ message: "Webhook for unknown order", razorpayOrderId });
        }
      }
    }
    res.json({ status: "ok" });
  } catch (err) {
    /* A PaymentError is permanent — the order does not exist, or this payment
       belongs to a different one. Retrying cannot change that, so acknowledge
       it rather than making Razorpay retry for hours. Anything else is treated
       as transient: a 5xx tells Razorpay to try again later. */
    if (paymentErrorStatus(err)) {
      logger.warn({ message: `Webhook ignored: ${err.code}`, error: err.message });
      return res.json({ status: "ignored", reason: err.code });
    }
    logger.error({ message: "Webhook processing error", error: err.message, stack: err.stack });
    res.status(500).json({ status: "error" });
  }
});

export default router;
