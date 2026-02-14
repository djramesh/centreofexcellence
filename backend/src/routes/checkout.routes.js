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

const createOrderValidation = [
  body("items").isArray().notEmpty().withMessage("Items are required"),
  body("items.*.productId").isInt().withMessage("Valid product ID required"),
  body("items.*.quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  body("items.*.price").isFloat({ min: 0 }).withMessage("Valid price required"),
  body("address.line1").trim().notEmpty().withMessage("Address line 1 is required"),
  body("address.city").trim().notEmpty().withMessage("City is required"),
  body("address.state").trim().notEmpty().withMessage("State is required"),
  body("address.pincode").trim().notEmpty().withMessage("Pincode is required"),
  body("totalAmount").isFloat({ min: 0 }).withMessage("Valid total amount required"),
];

router.post(
  "/create-order",
  authRequired,
  createOrderValidation,
  async (req, res) => {
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

    const { items, address, totalAmount } = req.body;
    const userId = req.user.id;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Validate products and check stock
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
      }

      // Create address
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

      // Create order in DB
      const [orderResult] = await connection.query(
        "INSERT INTO orders (user_id, address_id, status, payment_status, total_amount) VALUES (?, ?, 'PENDING', 'PENDING', ?)",
        [userId, addressId, totalAmount]
      );

      const orderId = orderResult.insertId;

      // Create order items
      for (const item of items) {
        const lineTotal = item.price * item.quantity;
        await connection.query(
          "INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)",
          [orderId, item.productId, item.quantity, item.price, lineTotal]
        );

        // Update stock
        await connection.query(
          "UPDATE products SET stock = stock - ? WHERE id = ?",
          [item.quantity, item.productId]
        );
      }

      // Create Razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100), // Convert to paise
        currency: "INR",
        receipt: `order_${orderId}`,
        notes: {
          orderId: orderId.toString(),
          userId: userId.toString(),
        },
      });

      // Update order with Razorpay order ID
      await connection.query(
        "UPDATE orders SET razorpay_order_id = ? WHERE id = ?",
        [razorpayOrder.id, orderId]
      );

      await connection.commit();
      connection.release();

      res.json({
        orderId,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      });
    } catch (err) {
      await connection.rollback();
      connection.release();
      console.error("Create order error", err);
      res.status(500).json({ message: "Failed to create order", error: err.message });
    }
  }
);

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

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Verify order belongs to user
    const [orderRows] = await connection.query(
      "SELECT id, user_id, total_amount, razorpay_order_id FROM orders WHERE id = ? AND user_id = ?",
      [orderId, req.user.id]
    );

    if (orderRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orderRows[0];

    // Verify signature
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Update order status
    await connection.query(
      "UPDATE orders SET status = 'PAID', payment_status = 'PAID', razorpay_payment_id = ? WHERE id = ?",
      [razorpayPaymentId, orderId]
    );

    // Create payment record
    await connection.query(
      "INSERT INTO payments (order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, status, amount, currency) VALUES (?, ?, ?, ?, 'SUCCESS', ?, 'INR')",
      [
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        order.total_amount,
      ]
    );

    await connection.commit();
    connection.release();

    res.json({ success: true, message: "Payment verified successfully", orderId });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error("Verify payment error", err);
    res.status(500).json({ message: "Failed to verify payment", error: err.message });
  }
});

export default router;
