import express from "express";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { getDbPool } from "../config/db.js";
import { authRequired } from "../middleware/auth.js";
import { fail, parseId, parsePagination } from "../utils/http.js";
import { logger } from "../utils/logger.js";
import {
  razorpay,
  razorpayKeyId,
  isRazorpayConfigured,
  RAZORPAY_NOT_CONFIGURED,
  markOrderPaid,
  paymentErrorStatus,
  verifyPaymentSignature,
  attachGatewayOrder,
} from "../services/payments.js";
import {
  CUSTOMER_ORDER_COLUMNS,
  presentOrder,
  buildTracking,
  expireStalePendingOrders,
} from "../services/orders.js";

const router = express.Router();
const pool = getDbPool();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* Opportunistic housekeeping: self-throttled to at most one sweep every 15
   minutes, and fire-and-forget, so it never delays the response. */
router.use((req, res, next) => {
  expireStalePendingOrders();
  next();
});

// ─── Colour palette ───────────────────────────────────────────────────────────
const DARK = "#1a1a2e";
const ACCENT = "#c8a951";
const LIGHT = "#f5f5f5";
const MID = "#9ca3af";
const TEXT = "#111827";
const TMID = "#374151";

/**
 * Load an order plus its items, enforcing ownership.
 *
 * Admins may read any order; everyone else only their own. Returns an `error`
 * shape rather than throwing so callers can map it straight onto a response.
 */
async function loadOrderWithItems(orderId, user) {
  const id = parseId(orderId);
  if (!id) return { error: { status: 404, message: "Order not found" } };

  const [orderRows] = await pool.query(
    `SELECT ${CUSTOMER_ORDER_COLUMNS},
            u.name AS customer_name, u.email AS customer_email, u.phone,
            a.line1, a.line2, a.city, a.state, a.pincode, a.country
       FROM orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN addresses a ON a.id = o.address_id
      WHERE o.id = ?
      LIMIT 1`,
    [id]
  );

  if (orderRows.length === 0) {
    return { error: { status: 404, message: "Order not found" } };
  }

  const order = orderRows[0];

  if (user.role !== "admin" && order.user_id !== user.id) {
    // 404 rather than 403: a 403 confirms the order exists, which lets someone
    // enumerate order ids.
    return { error: { status: 404, message: "Order not found" } };
  }

  const [itemRows] = await pool.query(
    `SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price, oi.line_total,
            p.name AS product_name, p.slug AS product_slug, p.thumbnail_url
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?`,
    [id]
  );

  return { order, items: itemRows };
}

// ─── List the signed-in user's orders ────────────────────────────────────────
router.get("/", authRequired, async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query, { maxLimit: 50 });

    const [rows] = await pool.query(
      `SELECT o.id, o.total_amount, o.status, o.payment_status, o.created_at,
              o.tracking_id, o.courier_company, o.tracking_url, o.shipping_status,
              o.shipped_at, o.delivered_at,
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

    res.json({
      orders: rows.map(presentOrder),
      pagination: { page, limit, total: countResult.total },
    });
  } catch (err) {
    fail(res, 500, "Failed to load orders", err);
  }
});

// ─── Single order ────────────────────────────────────────────────────────────
router.get("/:id", authRequired, async (req, res) => {
  try {
    const { order, items, error } = await loadOrderWithItems(req.params.id, req.user);
    if (error) return res.status(error.status).json({ message: error.message });
    res.json({ order: presentOrder(order), items });
  } catch (err) {
    fail(res, 500, "Failed to load order", err);
  }
});

// ─── Start payment for a PENDING order (retry / "Pay Now" flow) ──────────────
router.post("/:id/initiate-payment", authRequired, async (req, res) => {
  if (!isRazorpayConfigured()) {
    return res.status(503).json({ message: RAZORPAY_NOT_CONFIGURED });
  }

  const orderId = parseId(req.params.id);
  if (!orderId) return res.status(404).json({ message: "Order not found" });

  try {
    const [orderRows] = await pool.query(
      "SELECT id, user_id, total_amount, status, payment_status FROM orders WHERE id = ? AND user_id = ? LIMIT 1",
      [orderId, req.user.id]
    );

    if (orderRows.length === 0) return res.status(404).json({ message: "Order not found" });

    const order = orderRows[0];

    if (order.payment_status === "PAID") {
      return res.status(409).json({ message: "This order is already paid" });
    }
    if (order.status !== "PENDING") {
      return res.status(409).json({
        message: `Only pending orders can be paid. This order is ${order.status}.`,
      });
    }

    const amount = Math.round(Number(order.total_amount) * 100); // paise

    const rzpOrder = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `retry_${order.id}_${Date.now()}`,
      notes: { orderId: String(order.id), userId: String(req.user.id), retry: "true" },
    });

    /* Record the attempt before returning. markOrderPaid binds the eventual
       confirmation to a gateway order that was issued for THIS order, and this
       row is what keeps earlier attempts valid after a later retry overwrites
       orders.razorpay_order_id. */
    await attachGatewayOrder({
      orderId: order.id,
      razorpayOrderId: rzpOrder.id,
      amount: Number(order.total_amount),
    });

    await pool.query("UPDATE orders SET razorpay_order_id = ? WHERE id = ?", [
      rzpOrder.id,
      order.id,
    ]);

    res.json({
      key_id: razorpayKeyId,
      keyId: razorpayKeyId,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      razorpay_order_id: rzpOrder.id,
    });
  } catch (err) {
    fail(res, 500, "Failed to start payment", err, { orderId });
  }
});

// ─── Confirm payment for a PENDING order (retry / "Pay Now" flow) ────────────
router.post("/:id/verify-payment", authRequired, async (req, res) => {
  if (!isRazorpayConfigured()) {
    return res.status(503).json({ message: RAZORPAY_NOT_CONFIGURED });
  }

  const orderId = parseId(req.params.id);
  if (!orderId) return res.status(404).json({ message: "Order not found" });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: "Missing payment details" });
  }

  if (
    !verifyPaymentSignature({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      signature: razorpay_signature,
    })
  ) {
    logger.warn({ message: "Rejected payment: bad signature", orderId, userId: req.user.id });
    return res.status(400).json({ message: "Invalid payment signature" });
  }

  /* Everything below — binding the gateway order to THIS order, the idempotency
     check, the row lock and the stock deduction — lives in markOrderPaid, the
     same routine the main checkout and the webhook use. This route previously
     reimplemented it and omitted all four. */
  try {
    const result = await markOrderPaid({
      orderId,
      userId: req.user.id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    res.json({
      success: true,
      message: result.alreadyPaid ? "Payment already confirmed" : "Payment verified successfully",
      orderId,
    });
  } catch (err) {
    const status = paymentErrorStatus(err);
    if (status) {
      logger.warn({ message: `Payment rejected: ${err.code}`, orderId, userId: req.user.id });
      return res.status(status).json({ message: err.message });
    }
    fail(res, 500, "Failed to verify payment", err, { orderId });
  }
});

// ─── PDF invoice ─────────────────────────────────────────────────────────────
router.get("/:id/invoice", authRequired, async (req, res) => {
  try {
    const { order, items, error } = await loadOrderWithItems(req.params.id, req.user);
    if (error) return res.status(error.status).json({ message: error.message });

    const tracking = buildTracking(order);
    const doc = new PDFDocument({ size: "A4", margin: 0 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="invoice-${order.id}.pdf"`);
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
      .text("GST INCLUSIVE", 46, 127, { width: 120 });

    const metaRows = [
      ["Invoice No.", `#${order.id}`],
      ["Order ID", `#${order.id}`],
      ["Date", new Date(order.created_at).toLocaleString("en-IN")],
      ["Status", (order.payment_status || "").toUpperCase()],
    ];
    let metaY = 160;
    for (const [label, val] of metaRows) {
      doc.fillColor(MID).font("Helvetica").fontSize(8)
        .text(label, W - 220, metaY, { width: 80, align: "right" });
      doc.fillColor(TEXT).font("Helvetica-Bold").fontSize(8)
        .text(val, W - 130, metaY, { width: 90, align: "right" });
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
      order.line1,
      order.line2,
      [order.city, order.state, order.pincode].filter(Boolean).join(", "),
      order.country || "India",
    ].filter(Boolean);

    doc.font("Helvetica").fontSize(9).fillColor(TMID);
    billLines.forEach((line, i) => doc.text(line, 40, infoY + 14 * (i + 1)));
    shipLines.forEach((line, i) => doc.text(line, 280, infoY + 14 * (i + 1)));

    // ── QR CODE ───────────────────────────────────────────────────────────
    try {
      const qrData = JSON.stringify({
        orderId: order.id,
        amount: Number(order.total_amount),
        status: order.status,
        payment: order.payment_status,
      });
      const qrUrl = await QRCode.toDataURL(qrData, { margin: 1, scale: 4 });
      const qrBuffer = Buffer.from(qrUrl.replace(/^data:image\/png;base64,/, ""), "base64");
      doc.image(qrBuffer, W - 140, secY, { width: 100 });
      doc.fillColor(MID).font("Helvetica").fontSize(7)
        .text("Scan for order lookup", W - 140, secY + 104, { width: 100, align: "center" });
    } catch {
      /* skip QR on error */
    }

    // ── SHIPMENT (only once dispatched) ───────────────────────────────────
    let tableTop = 330;
    if (tracking) {
      const shipY = 312;
      doc.rect(40, shipY, W - 80, 16).fill(DARK);
      doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(8)
        .text("SHIPMENT", 46, shipY + 4);

      doc.fillColor(TMID).font("Helvetica").fontSize(9)
        .text(`Courier: ${tracking.carrierName}`, 46, shipY + 24)
        .text(`Tracking No.: ${tracking.trackingNumber}`, 300, shipY + 24);

      if (tracking.trackingUrl) {
        doc.fillColor("#2563eb").fontSize(8)
          .text(tracking.trackingUrl, 46, shipY + 38, {
            width: W - 100,
            link: tracking.trackingUrl,
            underline: true,
          });
        tableTop = shipY + 60;
      } else {
        tableTop = shipY + 48;
      }
    }

    // ── ITEMS TABLE ───────────────────────────────────────────────────────
    doc.rect(40, tableTop, W - 80, 22).fill(DARK);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
    doc.text("PRODUCT / DESCRIPTION", 50, tableTop + 7);
    doc.text("QTY", 330, tableTop + 7, { width: 40, align: "right" });
    doc.text("UNIT PRICE", 380, tableTop + 7, { width: 80, align: "right" });
    doc.text("TOTAL", 470, tableTop + 7, { width: 85, align: "right" });

    let rowY = tableTop + 22;
    items.forEach((item, i) => {
      const bg = i % 2 === 0 ? LIGHT : "#ffffff";
      doc.rect(40, rowY, W - 80, 22).fill(bg);
      doc.fillColor(TEXT).font("Helvetica").fontSize(9);
      doc.text(item.product_name || "", 50, rowY + 7, { width: 270 });
      doc.text(String(item.quantity), 330, rowY + 7, { width: 40, align: "right" });
      doc.text(`Rs.${Number(item.unit_price).toLocaleString("en-IN")}`, 380, rowY + 7, {
        width: 80,
        align: "right",
      });
      doc.font("Helvetica-Bold")
        .text(`Rs.${Number(item.line_total).toLocaleString("en-IN")}`, 470, rowY + 7, {
          width: 85,
          align: "right",
        });
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
      .text("GST", 380, totY, { width: 80, align: "right" })
      .text("Inclusive", 470, totY, { width: 85, align: "right" });

    totY += 16;
    doc.roundedRect(330, totY - 4, W - 370, 24, 4).fill(DARK);
    doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(10)
      .text("GRAND TOTAL", 338, totY + 3, { width: 120 })
      .text(`Rs.${subtotal.toLocaleString("en-IN")}`, 470, totY + 3, { width: 85, align: "right" });

    const isPaid = (order.payment_status || "").toLowerCase() === "paid";
    doc.roundedRect(40, totY - 4, 70, 24, 4).fill(isPaid ? "#16a34a" : "#dc2626");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9)
      .text((order.payment_status || "").toUpperCase(), 40, totY + 3, {
        width: 70,
        align: "center",
      });

    // ── FOOTER ────────────────────────────────────────────────────────────
    doc.rect(0, H - 50, W, 3).fill(ACCENT);
    doc.rect(0, H - 47, W, 47).fill(DARK);
    doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(8)
      .text("COE E-Commerce  |  Shristi & Prerana Co-operative Society", 0, H - 35, {
        align: "center",
        width: W,
      });
    doc.fillColor(MID).font("Helvetica").fontSize(7.5)
      .text(
        "This is a computer-generated invoice. No signature required.  |  All prices are GST inclusive.",
        0,
        H - 20,
        { align: "center", width: W }
      );

    doc.end();
  } catch (err) {
    // Headers may already be sent once piping starts — never try to write JSON then.
    if (res.headersSent) {
      logger.error({ message: "Invoice generation failed mid-stream", error: err.message });
      return res.end();
    }
    fail(res, 500, "Failed to generate invoice", err);
  }
});

export default router;
