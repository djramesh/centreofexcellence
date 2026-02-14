import express from "express";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { getDbPool } from "../config/db.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();
const pool = getDbPool();

// Helper: fetch order + items with ownership / admin check
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

    // Only admin or owner can access
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

// List current user's orders
router.get("/", authRequired, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
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

    res.json({
      orders: rows,
      pagination: { page, limit, total: countResult.total },
    });
  } catch (err) {
    console.error("User orders list error", err);
    res.status(500).json({ message: "Failed to load orders", error: err.message });
  }
});

// Get single order for current user
router.get("/:id", authRequired, async (req, res) => {
  try {
    const { order, items, error } = await loadOrderWithItems(req.params.id, req.user);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }
    res.json({ order, items });
  } catch (err) {
    console.error("User order detail error", err);
    res.status(500).json({ message: "Failed to load order", error: err.message });
  }
});

// Generate PDF invoice (for user + admin)
router.get("/:id/invoice"
  , authRequired, async (req, res) => {
  try {
    const { order, items, error } = await loadOrderWithItems(req.params.id, req.user);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    // Set headers for download
    const filename = `invoice-${order.id}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);

    doc.pipe(res);

    // Header
    doc
      .fontSize(20)
      .text("COE E‑Commerce", { align: "left" })
      .moveDown(0.2);
    doc
      .fontSize(10)
      .fillColor("#555555")
      .text("Shristi & Prerana Co‑operative Society", { align: "left" })
      .text("Assam, India")
      .moveDown(1);

    doc
      .fontSize(18)
      .fillColor("#000000")
      .text("Invoice", { align: "right" });

    doc
      .fontSize(10)
      .fillColor("#555555")
      .text(`Invoice #: ${order.id}`, { align: "right" })
      .text(`Order ID: ${order.id}`, { align: "right" })
      .text(`Date: ${new Date(order.created_at).toLocaleString("en-IN")}`, { align: "right" })
      .moveDown(1.2);

    // Customer & shipping
    const top = doc.y;
    doc
      .fontSize(11)
      .fillColor("#000000")
      .text("Bill to:", 50, top)
      .moveDown(0.3)
      .fontSize(10)
      .fillColor("#333333")
      .text(order.customer_name || "", { continued: false })
      .text(order.customer_email || "")
      .text(order.phone || "");

    doc
      .fontSize(11)
      .fillColor("#000000")
      .text("Ship to:", 320, top)
      .moveDown(0.3)
      .fontSize(10)
      .fillColor("#333333")
      .text(order.line1 || "")
      .text(order.line2 || "")
      .text(
        [order.city, order.state, order.pincode].filter(Boolean).join(", ") ||
          ""
      )
      .text(order.country || "India");

    doc.moveDown(1.5);

    // QR code with order summary URL/data
    const qrData = JSON.stringify({
      orderId: order.id,
      amount: Number(order.total_amount),
      status: order.status,
      payment_status: order.payment_status,
    });

    const qrX = 430;
    const qrY = top;

    try {
      const qrUrl = await QRCode.toDataURL(qrData, { margin: 1, scale: 4 });
      const qrBase64 = qrUrl.replace(/^data:image\/png;base64,/, "");
      const qrBuffer = Buffer.from(qrBase64, "base64");
      doc.image(qrBuffer, qrX, qrY, { width: 100 });
      doc
        .fontSize(8)
        .fillColor("#6b7280")
        .text("Scan for quick order lookup", qrX, qrY + 105, {
          width: 110,
          align: "center",
        });
    } catch (e) {
      // If QR fails, just skip it
    }

    doc.moveDown(2);

    // Items table header
    const tableTop = doc.y + 10;
    const colProduct = 50;
    const colQty = 260;
    const colPrice = 320;
    const colTotal = 410;

    doc
      .fontSize(10)
      .fillColor("#6b7280")
      .text("Product", colProduct, tableTop)
      .text("Qty", colQty, tableTop, { width: 40, align: "right" })
      .text("Unit price", colPrice, tableTop, { width: 80, align: "right" })
      .text("Total", colTotal, tableTop, { width: 80, align: "right" });

    doc
      .moveTo(50, tableTop + 14)
      .lineTo(545, tableTop + 14)
      .strokeColor("#e5e7eb")
      .stroke();

    // Items rows
    let position = tableTop + 20;
    doc.fontSize(10).fillColor("#111827");

    items.forEach((item) => {
      doc
        .text(item.product_name || "", colProduct, position, { width: 200 })
        .text(String(item.quantity), colQty, position, {
          width: 40,
          align: "right",
        })
        .text(
          `₹${Number(item.unit_price).toLocaleString("en-IN")}`,
          colPrice,
          position,
          { width: 80, align: "right" }
        )
        .text(
          `₹${Number(item.line_total).toLocaleString("en-IN")}`,
          colTotal,
          position,
          { width: 80, align: "right" }
        );
      position += 18;
    });

    // Totals
    doc
      .moveTo(50, position + 4)
      .lineTo(545, position + 4)
      .strokeColor("#e5e7eb")
      .stroke();

    position += 12;

    doc
      .fontSize(10)
      .fillColor("#374151")
      .text("Subtotal", colPrice, position, { width: 80, align: "right" })
      .text(
        `₹${Number(order.total_amount).toLocaleString("en-IN")}`,
        colTotal,
        position,
        { width: 80, align: "right" }
      );

    position += 18;

    doc
      .fontSize(11)
      .fillColor("#111827")
      .text("Total", colPrice, position, { width: 80, align: "right" })
      .text(
        `₹${Number(order.total_amount).toLocaleString("en-IN")}`,
        colTotal,
        position,
        { width: 80, align: "right" }
      );

    position += 24;

    doc
      .fontSize(9)
      .fillColor("#6b7280")
      .text(`Payment status: ${order.payment_status}`, 50, position)
      .moveDown(2)
      .text(
        "This is a computer generated invoice. No signature required.",
        50,
        doc.y,
        { width: 495 }
      );

    doc.end();
  } catch (err) {
    console.error("Invoice generation error", err);
    res.status(500).json({ message: "Failed to generate invoice", error: err.message });
  }
});

export default router;

