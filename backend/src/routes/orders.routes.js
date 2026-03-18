import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getDbPool } from "../config/db.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();
const pool = getDbPool();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Razorpay instance (same pattern as checkout.routes.js) ──────────────────
const keyId     = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

const razorpay =
  keyId && keySecret
    ? new Razorpay({ key_id: keyId, key_secret: keySecret })
    : null;

// ─── Color palette ────────────────────────────────────────────────────────────
const DARK   = "#1a1a2e";
const ACCENT = "#c8a951";
const LIGHT  = "#f5f5f5";
const MID    = "#9ca3af";
const TEXT   = "#111827";
const TMID   = "#374151";

// ─── Helper: fetch order + items ──────────────────────────────────────────────
async function loadOrderWithItems(orderId, user) {
  const connection = await pool.getConnection();
  try {
    const [orderRows] = await connection.query(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email, u.phone,
              a.line1, a.line2, a.city, a.state, a.pincode, a.country
       FROM orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN addresses a ON a.id = o.address_id
       WHERE o.id = ?`,
      [orderId]
    );

    if (orderRows.length === 0) {
      connection.release();
      return { error: { status: 404, message: "Order not found" } };
    }

    const order = orderRows[0];

    if (user.role !== "admin" && order.user_id !== user.id) {
      connection.release();
      return { error: { status: 403, message: "Forbidden" } };
    }

    const [itemRows] = await connection.query(
      `SELECT oi.*, p.name AS product_name, p.thumbnail_url
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    connection.release();
    return { order, items: itemRows };
  } catch (err) {
    connection.release();
    throw err;
  }
}

// ─── List current user's orders ───────────────────────────────────────────────
router.get("/", authRequired, async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `SELECT o.id, o.total_amount, o.status, o.payment_status, o.created_at,
              a.city, a.state, a.pincode
       FROM orders o
       LEFT JOIN addresses a ON a.id = o.address_id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, limit, offset]
    );

    const [[countResult]] = await pool.query(
      "SELECT COUNT(*) AS total FROM orders WHERE user_id = ?",
      [req.user.id]
    );

    res.json({ orders: rows, pagination: { page, limit, total: countResult.total } });
  } catch (err) {
    console.error("User orders list error", err);
    res.status(500).json({ message: "Failed to load orders", error: err.message });
  }
});

// ─── Get single order ─────────────────────────────────────────────────────────
router.get("/:id", authRequired, async (req, res) => {
  try {
    const { order, items, error } = await loadOrderWithItems(req.params.id, req.user);
    if (error) return res.status(error.status).json({ message: error.message });
    res.json({ order, items });
  } catch (err) {
    console.error("User order detail error", err);
    res.status(500).json({ message: "Failed to load order", error: err.message });
  }
});

// ─── Initiate payment for a PENDING order (retry flow) ───────────────────────
router.post("/:id/initiate-payment", authRequired, async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({
      message:
        "Razorpay not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env.",
    });
  }

  try {
    const [orderRows] = await pool.query(
      "SELECT id, user_id, total_amount, status FROM orders WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orderRows[0];

    if (order.status !== "PENDING") {
      return res.status(400).json({
        message: `Only PENDING orders can be paid. This order is ${order.status}.`,
      });
    }

    // Create a fresh Razorpay order against the existing DB order
    const rzpOrder = await razorpay.orders.create({
      amount:   Math.round(Number(order.total_amount) * 100), // paise
      currency: "INR",
      receipt:  `retry_${order.id}_${Date.now()}`,
      notes: {
        orderId: order.id.toString(),
        userId:  req.user.id.toString(),
        retry:   "true",
      },
    });

    // Store the new razorpay_order_id so verify-payment can look it up
    await pool.query(
      "UPDATE orders SET razorpay_order_id = ? WHERE id = ?",
      [rzpOrder.id, order.id]
    );

    res.json({
      key_id:            keyId,
      amount:            rzpOrder.amount,
      currency:          rzpOrder.currency,
      razorpay_order_id: rzpOrder.id,
    });
  } catch (err) {
    console.error("initiate-payment error", err);
    res.status(500).json({ message: "Failed to initiate payment", error: err.message });
  }
});

// ─── Verify payment for a PENDING order (retry flow) ─────────────────────────
router.post("/:id/verify-payment", authRequired, async (req, res) => {
  if (!keySecret) {
    return res.status(503).json({
      message: "Razorpay not configured. Add RAZORPAY_KEY_SECRET to backend/.env.",
    });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: "Missing payment details" });
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Confirm order belongs to this user and is still PENDING
    const [orderRows] = await connection.query(
      "SELECT id, user_id, total_amount FROM orders WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    if (orderRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orderRows[0];

    // Verify Razorpay signature — identical logic to checkout.routes.js
    const generated = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated !== razorpay_signature) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Update order — same fields as checkout verify route
    await connection.query(
      "UPDATE orders SET status = 'PAID', payment_status = 'PAID', razorpay_payment_id = ? WHERE id = ?",
      [razorpay_payment_id, order.id]
    );

    // Insert payments record — same as checkout verify route
    await connection.query(
      `INSERT INTO payments
         (order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, status, amount, currency)
       VALUES (?, ?, ?, ?, 'SUCCESS', ?, 'INR')`,
      [order.id, razorpay_order_id, razorpay_payment_id, razorpay_signature, order.total_amount]
    );

    await connection.commit();
    connection.release();

    res.json({ success: true, message: "Payment verified successfully", orderId: order.id });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error("verify-payment error", err);
    res.status(500).json({ message: "Failed to verify payment", error: err.message });
  }
});

// ─── PDF Invoice ──────────────────────────────────────────────────────────────
router.get("/:id/invoice", authRequired, async (req, res) => {
  try {
    const { order, items, error } = await loadOrderWithItems(req.params.id, req.user);
    if (error) return res.status(error.status).json({ message: error.message });

    const doc = new PDFDocument({ size: "A4", margin: 0 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-${order.id}.pdf"`
    );
    doc.pipe(res);

    const W = 595.28;
    const H = 841.89;

    // ── HEADER BANNER ──────────────────────────────────────────────────────
    doc.rect(0, 0, W, 100).fill(DARK);

    const phLogoPath = path.join(__dirname, "../assets/ph-logo.png");
    if (fs.existsSync(phLogoPath)) doc.image(phLogoPath, 20, 15, { width: 70, height: 70 });

    const shLogoPath = path.join(__dirname, "../assets/sh-logo.png");
    if (fs.existsSync(shLogoPath)) doc.image(shLogoPath, W - 95, 10, { width: 80, height: 80 });

    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(18)
      .text("COE E-COMMERCE", 0, 30, { align: "center", width: W });
    doc.fillColor(ACCENT).font("Helvetica").fontSize(9)
      .text("Shristi & Prerana Co-operative Society", 0, 54, { align: "center", width: W });
    doc.fillColor(MID).fontSize(8)
      .text("Assam, India  |  GST Inclusive", 0, 67, { align: "center", width: W });

    doc.rect(0, 100, W, 5).fill(ACCENT);

    // ── INVOICE TITLE + META ───────────────────────────────────────────────
    doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(28)
      .text("INVOICE", W - 220, 118, { width: 180, align: "right" });

    doc.roundedRect(40, 120, 130, 22, 4).fill(ACCENT);
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(9)
      .text("✓  GST INCLUSIVE", 46, 127, { width: 120 });

    const metaRows = [
      ["Invoice No.", `#${order.id}`],
      ["Order ID",    `#${order.id}`],
      ["Date",        new Date(order.created_at).toLocaleString("en-IN")],
      ["Status",      (order.payment_status || "").toUpperCase()],
    ];
    let metaY = 160;
    for (const [label, val] of metaRows) {
      doc.fillColor(MID).font("Helvetica").fontSize(8).text(label, W - 220, metaY, { width: 80, align: "right" });
      doc.fillColor(TEXT).font("Helvetica-Bold").fontSize(8).text(val, W - 130, metaY, { width: 90, align: "right" });
      metaY += 15;
    }

    doc.moveTo(40, 190).lineTo(W - 40, 190).lineWidth(0.8).strokeColor(ACCENT).stroke();

    // ── BILL TO / SHIP TO ─────────────────────────────────────────────────
    const secY = 202;
    doc.rect(40, secY, 120, 16).fill(DARK);
    doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(8).text("BILL TO", 46, secY + 4);
    doc.rect(280, secY, 120, 16).fill(DARK);
    doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(8).text("SHIP TO", 286, secY + 4);

    const infoY = secY + 22;
    doc.fillColor(TEXT).font("Helvetica-Bold").fontSize(10)
      .text(order.customer_name || "", 40, infoY)
      .text(order.customer_name || "", 280, infoY);

    const billLines = [order.customer_email, order.phone].filter(Boolean);
    const shipLines = [
      order.line1, order.line2,
      [order.city, order.state, order.pincode].filter(Boolean).join(", "),
      order.country || "India",
    ].filter(Boolean);

    doc.font("Helvetica").fontSize(9).fillColor(TMID);
    billLines.forEach((line, i) => doc.text(line, 40,  infoY + 14 * (i + 1)));
    shipLines.forEach((line, i) => doc.text(line, 280, infoY + 14 * (i + 1)));

    // ── QR CODE ───────────────────────────────────────────────────────────
    try {
      const qrData   = JSON.stringify({ orderId: order.id, amount: Number(order.total_amount), status: order.status, payment: order.payment_status });
      const qrUrl    = await QRCode.toDataURL(qrData, { margin: 1, scale: 4 });
      const qrBuffer = Buffer.from(qrUrl.replace(/^data:image\/png;base64,/, ""), "base64");
      doc.image(qrBuffer, W - 140, secY, { width: 100 });
      doc.fillColor(MID).font("Helvetica").fontSize(7)
        .text("Scan for order lookup", W - 140, secY + 104, { width: 100, align: "center" });
    } catch (_) { /* skip QR on error */ }

    // ── ITEMS TABLE ───────────────────────────────────────────────────────
    const tableTop = 330;
    doc.rect(40, tableTop, W - 80, 22).fill(DARK);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
    doc.text("PRODUCT / DESCRIPTION", 50,  tableTop + 7);
    doc.text("QTY",        330, tableTop + 7, { width: 40,  align: "right" });
    doc.text("UNIT PRICE", 380, tableTop + 7, { width: 80,  align: "right" });
    doc.text("TOTAL",      470, tableTop + 7, { width: 85,  align: "right" });

    let rowY = tableTop + 22;
    items.forEach((item, i) => {
      const bg = i % 2 === 0 ? LIGHT : "#ffffff";
      doc.rect(40, rowY, W - 80, 22).fill(bg);
      doc.fillColor(TEXT).font("Helvetica").fontSize(9);
      doc.text(item.product_name || "", 50, rowY + 7, { width: 270 });
      doc.text(String(item.quantity), 330, rowY + 7, { width: 40,  align: "right" });
      doc.text(`Rs.${Number(item.unit_price).toLocaleString("en-IN")}`, 380, rowY + 7, { width: 80,  align: "right" });
      doc.font("Helvetica-Bold")
         .text(`Rs.${Number(item.line_total).toLocaleString("en-IN")}`, 470, rowY + 7, { width: 85, align: "right" });
      rowY += 22;
    });

    // ── TOTALS ────────────────────────────────────────────────────────────
    let totY = rowY + 10;
    doc.moveTo(340, totY).lineTo(W - 40, totY).lineWidth(0.5).strokeColor(ACCENT).stroke();

    const subtotal = Number(order.total_amount);

    totY += 12;
    doc.fillColor(TMID).font("Helvetica").fontSize(9)
       .text("Subtotal", 380, totY, { width: 80, align: "right" })
       .text(`Rs.${subtotal.toLocaleString("en-IN")}`, 470, totY, { width: 85, align: "right" });

    totY += 16;
    doc.fillColor(TMID).font("Helvetica").fontSize(9)
       .text("GST",       380, totY, { width: 80, align: "right" })
       .text("Inclusive", 470, totY, { width: 85, align: "right" });

    totY += 16;
    doc.roundedRect(330, totY - 4, W - 370, 24, 4).fill(DARK);
    doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(10)
       .text("GRAND TOTAL", 338, totY + 3, { width: 120 })
       .text(`Rs.${subtotal.toLocaleString("en-IN")}`, 470, totY + 3, { width: 85, align: "right" });

    const isPaid = (order.payment_status || "").toLowerCase() === "paid";
    doc.roundedRect(40, totY - 4, 70, 24, 4).fill(isPaid ? "#16a34a" : "#dc2626");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9)
       .text((order.payment_status || "").toUpperCase(), 40, totY + 3, { width: 70, align: "center" });

    // ── FOOTER ────────────────────────────────────────────────────────────
    doc.rect(0, H - 50, W, 3).fill(ACCENT);
    doc.rect(0, H - 47, W, 47).fill(DARK);
    doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(8)
       .text("COE E-Commerce  |  Shristi & Prerana Co-operative Society", 0, H - 35, { align: "center", width: W });
    doc.fillColor(MID).font("Helvetica").fontSize(7.5)
       .text("This is a computer-generated invoice. No signature required.  |  All prices are GST inclusive.", 0, H - 20, { align: "center", width: W });

    doc.end();
  } catch (err) {
    console.error("Invoice generation error", err);
    res.status(500).json({ message: "Failed to generate invoice", error: err.message });
  }
});

export default router;