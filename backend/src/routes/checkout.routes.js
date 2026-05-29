import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { body, validationResult } from "express-validator";
import { getDbPool } from "../config/db.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();
const pool = getDbPool();

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

const razorpay =
  keyId && keySecret
    ? new Razorpay({ key_id: keyId, key_secret: keySecret })
    : null;

/* ──────────────────────────────────────────────────────────────────────────
   Validation — note we deliberately DO NOT trust client-supplied prices.
   `price`/`totalAmount` are computed on the server from the products table,
   so they are optional here and ignored even if sent.
─────────────────────────────────────────────────────────────────────────── */
const createOrderValidation = [
  body("items").isArray().notEmpty().withMessage("Items are required"),
  body("items.*.productId").isInt().withMessage("Valid product ID required"),
  body("items.*.quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  body("address.line1").trim().notEmpty().withMessage("Address line 1 is required"),
  body("address.city").trim().notEmpty().withMessage("City is required"),
  body("address.state").trim().notEmpty().withMessage("State is required"),
  body("address.pincode").trim().notEmpty().withMessage("Pincode is required"),
];

/* ──────────────────────────────────────────────────────────────────────────
   Shared, idempotent "mark this order as paid" routine.

   Used by BOTH the client-driven verify-payment call and the Razorpay webhook,
   so an order is completed exactly once even if both fire (or fire twice).
   Stock is deducted HERE — only on confirmed payment — never at order creation,
   which prevents abandoned checkouts from silently draining inventory.

   Throws Error with .code: ORDER_NOT_FOUND | ORDER_MISMATCH | INSUFFICIENT_STOCK
─────────────────────────────────────────────────────────────────────────── */
async function markOrderPaid({
  orderId,
  userId = null,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature = null,
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Lock the order row so two concurrent confirmations can't both proceed.
    const where = userId != null ? "id = ? AND user_id = ?" : "id = ?";
    const params = userId != null ? [orderId, userId] : [orderId];
    const [orderRows] = await connection.query(
      `SELECT id, user_id, total_amount, payment_status, razorpay_order_id
         FROM orders WHERE ${where} FOR UPDATE`,
      params
    );

    if (orderRows.length === 0) {
      const e = new Error("Order not found");
      e.code = "ORDER_NOT_FOUND";
      throw e;
    }

    const order = orderRows[0];

    // Idempotency: if already paid, do nothing and report success.
    if (order.payment_status === "PAID") {
      await connection.commit();
      return { alreadyPaid: true };
    }

    // Guard against a payment id being attached to the wrong order.
    if (
      order.razorpay_order_id &&
      razorpayOrderId &&
      order.razorpay_order_id !== razorpayOrderId
    ) {
      const e = new Error("Order does not match payment");
      e.code = "ORDER_MISMATCH";
      throw e;
    }

    // Re-check and deduct stock atomically (row-locked) at payment time.
    const [itemRows] = await connection.query(
      "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
      [orderId]
    );

    for (const item of itemRows) {
      const [prodRows] = await connection.query(
        "SELECT id, name, stock FROM products WHERE id = ? FOR UPDATE",
        [item.product_id]
      );
      const product = prodRows[0];
      if (!product || product.stock < item.quantity) {
        const e = new Error(
          `Insufficient stock for ${product ? product.name : `product ${item.product_id}`}`
        );
        e.code = "INSUFFICIENT_STOCK";
        throw e;
      }
      await connection.query(
        "UPDATE products SET stock = stock - ? WHERE id = ?",
        [item.quantity, item.product_id]
      );
    }

    await connection.query(
      "UPDATE orders SET status = 'PAID', payment_status = 'PAID', razorpay_payment_id = ? WHERE id = ?",
      [razorpayPaymentId, orderId]
    );

    await connection.query(
      `INSERT INTO payments
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

    await connection.commit();
    return { alreadyPaid: false };
  } catch (err) {
    try {
      await connection.rollback();
    } catch {
      /* ignore rollback errors */
    }
    throw err;
  } finally {
    connection.release();
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   Create order — prices and total are computed server-side from the DB.
   The external Razorpay call is made AFTER the DB transaction commits, so a
   DB connection is never held open across a network round-trip.
─────────────────────────────────────────────────────────────────────────── */
router.post("/create-order", authRequired, createOrderValidation, async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({
      message:
        "Razorpay not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env (use test keys from Razorpay Dashboard → Test Mode).",
    });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { items, address } = req.body;
  const userId = req.user.id;

  const connection = await pool.getConnection();
  let orderId;
  let computedTotal = 0;

  try {
    await connection.beginTransaction();

    // Resolve authoritative price + availability for every item from the DB.
    const pricedItems = [];
    for (const item of items) {
      const [productRows] = await connection.query(
        "SELECT id, name, price, stock FROM products WHERE id = ? AND is_active = 1",
        [item.productId]
      );

      if (productRows.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }

      const product = productRows[0];
      if (product.stock < item.quantity) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
        });
      }

      const unitPrice = Number(product.price); // server price — client value ignored
      const lineTotal = unitPrice * item.quantity;
      computedTotal += lineTotal;
      pricedItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
      });
    }

    const [addressResult] = await connection.query(
      "INSERT INTO addresses (user_id, line1, line2, city, state, pincode, country, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, 1)",
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
    const addressId = addressResult.insertId;

    const [orderResult] = await connection.query(
      "INSERT INTO orders (user_id, address_id, status, payment_status, total_amount) VALUES (?, ?, 'PENDING', 'PENDING', ?)",
      [userId, addressId, computedTotal]
    );
    orderId = orderResult.insertId;

    // Record line items at server-resolved prices. Stock is NOT deducted here;
    // it is deducted on confirmed payment (see markOrderPaid).
    for (const item of pricedItems) {
      await connection.query(
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)",
        [orderId, item.productId, item.quantity, item.unitPrice, item.lineTotal]
      );
    }

    await connection.commit();
  } catch (err) {
    try {
      await connection.rollback();
    } catch {
      /* ignore */
    }
    connection.release();
    console.error("Create order error", err);
    return res.status(500).json({ message: "Failed to create order" });
  }
  connection.release();

  // ── External payment-gateway call, OUTSIDE the DB transaction ──
  let razorpayOrder;
  try {
    razorpayOrder = await razorpay.orders.create({
      amount: Math.round(computedTotal * 100), // paise
      currency: "INR",
      receipt: `order_${orderId}`,
      notes: { orderId: String(orderId), userId: String(userId) },
    });
  } catch (rzpErr) {
    console.error("Razorpay order create error", rzpErr);
    // Leave a clean trail: cancel the dangling PENDING order.
    try {
      await pool.query(
        "UPDATE orders SET status = 'CANCELLED', payment_status = 'FAILED' WHERE id = ?",
        [orderId]
      );
    } catch {
      /* ignore */
    }
    return res.status(502).json({ message: "Payment gateway error. Please try again." });
  }

  try {
    await pool.query("UPDATE orders SET razorpay_order_id = ? WHERE id = ?", [
      razorpayOrder.id,
      orderId,
    ]);
  } catch (err) {
    console.error("Failed to attach razorpay_order_id", err);
  }

  res.json({
    orderId,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount, // authoritative amount in paise
    currency: razorpayOrder.currency,
  });
});

/* ──────────────────────────────────────────────────────────────────────────
   Verify payment — client-driven confirmation after the Razorpay modal.
─────────────────────────────────────────────────────────────────────────── */
router.post("/verify-payment", authRequired, async (req, res) => {
  if (!keySecret) {
    return res.status(503).json({
      message:
        "Razorpay not configured. Add RAZORPAY_KEY_SECRET to backend/.env (use test key from Razorpay Dashboard → Test Mode).",
    });
  }

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ message: "Missing payment details" });
  }

  // Verify the signature before touching the DB.
  const text = `${razorpayOrderId}|${razorpayPaymentId}`;
  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(text)
    .digest("hex");

  if (generatedSignature !== razorpaySignature) {
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
    if (err.code === "ORDER_NOT_FOUND" || err.code === "ORDER_MISMATCH") {
      return res.status(404).json({ message: "Order not found" });
    }
    if (err.code === "INSUFFICIENT_STOCK") {
      return res.status(409).json({ message: err.message });
    }
    console.error("Verify payment error", err);
    res.status(500).json({ message: "Failed to verify payment" });
  }
});

/* ──────────────────────────────────────────────────────────────────────────
   Razorpay webhook — authoritative, server-to-server confirmation.
   Ensures an order completes even if the customer closes the tab right after
   paying. Requires RAZORPAY_WEBHOOK_SECRET and the raw request body (captured
   via express.json's `verify` hook in app.js → req.rawBody).
─────────────────────────────────────────────────────────────────────────── */
router.post("/webhook", async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // Not configured — acknowledge so Razorpay doesn't keep retrying.
    return res.status(200).json({ status: "ignored" });
  }

  const signature = req.headers["x-razorpay-signature"];
  const rawBody = req.rawBody;
  if (!rawBody || !signature) {
    return res.status(400).json({ message: "Missing webhook signature" });
  }

  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (expected !== signature) {
    return res.status(400).json({ message: "Invalid webhook signature" });
  }

  const event = req.body || {};

  try {
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload?.payment?.entity;
      const razorpayOrderId = payment?.order_id;
      const razorpayPaymentId = payment?.id;

      if (razorpayOrderId) {
        const [rows] = await pool.query(
          "SELECT id FROM orders WHERE razorpay_order_id = ?",
          [razorpayOrderId]
        );
        if (rows.length > 0) {
          await markOrderPaid({
            orderId: rows[0].id,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature: null,
          });
        }
      }
    }
    // Always 200 on a handled (or ignorable) event so Razorpay stops retrying.
    res.json({ status: "ok" });
  } catch (err) {
    // 5xx makes Razorpay retry later — desirable for transient failures.
    console.error("Webhook processing error", err);
    res.status(500).json({ status: "error" });
  }
});

export default router;
