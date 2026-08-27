import express from "express";
import { body, validationResult } from "express-validator";

import { getDbPool } from "../config/db.js";
import { adminGuard } from "../middleware/auth.js";
import { fail, parseId } from "../utils/http.js";
import { logger } from "../utils/logger.js";
import { listCarriers, resolveTracking, isHttpUrl } from "../services/carriers.js";
import { buildTracking } from "../services/orders.js";
import {
  createShipRocketOrder,
  generateShippingLabel,
  getTrackingStatus,
  getAvailableCouriers,
} from "../services/shiprocket.js";

const router = express.Router();
const pool = getDbPool();

const DEFAULT_PICKUP_PINCODE = process.env.SHIPROCKET_PICKUP_PINCODE || "781001";

async function findOrder(orderId) {
  const id = parseId(orderId);
  if (!id) return null;

  const [rows] = await pool.query(
    `SELECT o.*, u.name, u.email, u.phone,
            a.line1, a.line2, a.city, a.state, a.pincode, a.country
       FROM orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN addresses a ON a.id = o.address_id
      WHERE o.id = ?
      LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

/**
 * GET /api/shipping/carriers
 * The courier list that backs the admin dropdown, plus the tracking-URL
 * templates the storefront will use.
 */
router.get("/carriers", adminGuard, (req, res) => {
  res.json({ carriers: listCarriers() });
});

/**
 * PUT /api/shipping/orders/:orderId/tracking
 * Record a shipment handed to any third-party courier by hand.
 *
 * This is the path for shipping outside ShipRocket: the admin picks the courier
 * and types the consignment number, and the customer immediately gets a working
 * link to that courier's own tracking page.
 */
router.put(
  "/orders/:orderId/tracking",
  adminGuard,
  [
    body("courier").trim().notEmpty().withMessage("Courier is required").isLength({ max: 100 }),
    body("trackingNumber")
      .trim()
      .notEmpty()
      .withMessage("Tracking number is required")
      .matches(/^[A-Za-z0-9\-_/]{4,60}$/)
      .withMessage("Tracking number contains unexpected characters"),
    body("trackingUrl")
      .optional({ values: "falsy" })
      .trim()
      .custom((value) => isHttpUrl(value))
      .withMessage("Tracking URL must be a valid http(s) address"),
    body("markShipped").optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const orderId = parseId(req.params.orderId);
    if (!orderId) return res.status(404).json({ message: "Order not found" });

    const { courier, trackingNumber, trackingUrl, markShipped = true } = req.body;

    try {
      const [orderRows] = await pool.query(
        "SELECT id, status, payment_status FROM orders WHERE id = ? LIMIT 1",
        [orderId]
      );
      if (orderRows.length === 0) return res.status(404).json({ message: "Order not found" });

      const order = orderRows[0];
      if (order.payment_status !== "PAID") {
        return res.status(409).json({ message: "Order payment is not confirmed yet" });
      }
      if (order.status === "CANCELLED") {
        return res.status(409).json({ message: "This order was cancelled" });
      }

      const resolved = resolveTracking({
        courier,
        trackingNumber,
        explicitUrl: trackingUrl || null,
      });

      // Persist the resolved carrier name so ShipRocket's service-level strings
      // ("Delhivery Surface 500gm") normalise to something a customer reads as
      // a courier, and the URL so it survives future registry edits.
      const shouldShip = markShipped !== false && order.status !== "DELIVERED";

      await pool.query(
        `UPDATE orders
            SET tracking_id = ?,
                courier_company = ?,
                tracking_url = ?,
                tracking_provider = 'MANUAL',
                shipping_status = ?,
                status = ${shouldShip ? "'SHIPPED'" : "status"},
                shipped_at = COALESCE(shipped_at, ${shouldShip ? "NOW()" : "shipped_at"}),
                updated_at = NOW()
          WHERE id = ?`,
        [
          resolved.trackingNumber,
          resolved.carrierName,
          resolved.trackingUrl,
          "Shipped",
          orderId,
        ]
      );

      logger.info({
        message: "Manual tracking recorded",
        orderId,
        carrier: resolved.carrierName,
        adminId: req.user.id,
      });

      const updated = await findOrder(orderId);
      res.json({ success: true, message: "Tracking details saved", tracking: buildTracking(updated) });
    } catch (err) {
      fail(res, 500, "Failed to save tracking details", err, { orderId });
    }
  }
);

/** DELETE /api/shipping/orders/:orderId/tracking — clear a mistyped shipment. */
router.delete("/orders/:orderId/tracking", adminGuard, async (req, res) => {
  const orderId = parseId(req.params.orderId);
  if (!orderId) return res.status(404).json({ message: "Order not found" });

  try {
    const [result] = await pool.query(
      `UPDATE orders
          SET tracking_id = NULL, courier_company = NULL, tracking_url = NULL,
              tracking_provider = NULL, shipping_status = NULL, shipped_at = NULL,
              status = CASE WHEN status = 'SHIPPED' THEN 'PAID' ELSE status END,
              updated_at = NOW()
        WHERE id = ?`,
      [orderId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Order not found" });

    logger.info({ message: "Tracking cleared", orderId, adminId: req.user.id });
    res.json({ success: true, message: "Tracking details cleared" });
  } catch (err) {
    fail(res, 500, "Failed to clear tracking details", err, { orderId });
  }
});

/**
 * GET /api/shipping/orders/:orderId/tracking
 * Stored tracking, enriched with live ShipRocket events when that is the source.
 */
router.get("/orders/:orderId/tracking", adminGuard, async (req, res) => {
  try {
    const order = await findOrder(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!order.tracking_id) {
      return res.status(404).json({ message: "This order has no tracking details yet" });
    }

    const tracking = buildTracking(order);

    // Manual shipments have no upstream to poll — return what we stored.
    if (order.tracking_provider !== "SHIPROCKET") {
      return res.json({ order_id: order.id, provider: "MANUAL", ...tracking, events: [] });
    }

    const live = await getTrackingStatus(order.tracking_id);
    res.json({
      order_id: order.id,
      provider: "SHIPROCKET",
      ...tracking,
      ...live,
      tracking_url: tracking?.trackingUrl ?? null,
    });
  } catch (err) {
    fail(res, 500, "Failed to get tracking status", err);
  }
});

/**
 * POST /api/shipping/orders/:orderId/create-shipment
 * Book the shipment through ShipRocket.
 */
router.post("/orders/:orderId/create-shipment", adminGuard, async (req, res) => {
  const orderId = parseId(req.params.orderId);
  if (!orderId) return res.status(404).json({ message: "Order not found" });

  try {
    const order = await findOrder(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.payment_status !== "PAID") {
      return res.status(409).json({ message: "Order payment not confirmed yet" });
    }
    if (order.shiprocket_shipment_id) {
      return res.status(409).json({ message: "A shipment already exists for this order" });
    }
    if (order.tracking_id) {
      return res.status(409).json({
        message: "This order already has tracking details. Clear them before booking a shipment.",
      });
    }

    const [items] = await pool.query(
      `SELECT oi.*, p.name AS product_name
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?`,
      [orderId]
    );

    const orderResult = await createShipRocketOrder({
      order_id: `ORDER-${orderId}-${Date.now()}`,
      customer_name: order.name,
      customer_phone: order.phone,
      customer_email: order.email,
      address: {
        line1: order.line1,
        line2: order.line2,
        city: order.city,
        state: order.state,
        pincode: order.pincode,
        country: order.country,
      },
      items: items.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.unit_price,
      })),
      total_amount: order.total_amount,
    });

    if (!orderResult.success) {
      return res
        .status(502)
        .json({ message: "ShipRocket rejected the order", details: orderResult.message });
    }

    const labelResult = await generateShippingLabel({
      shiprocket_order_id: orderResult.shiprocket_order_id,
      courier_id: req.body?.courier_id || null,
    });

    if (!labelResult.success) {
      return res
        .status(502)
        .json({ message: "Failed to generate shipping label", details: labelResult.message });
    }

    const resolved = resolveTracking({
      courier: labelResult.courier_company,
      trackingNumber: labelResult.tracking_id,
      explicitUrl: labelResult.tracking_url,
    });

    await pool.query(
      `UPDATE orders
          SET shiprocket_order_id = ?, shiprocket_shipment_id = ?,
              tracking_id = ?, courier_company = ?, tracking_url = ?,
              tracking_provider = 'SHIPROCKET', shipping_status = 'Shipped',
              status = 'SHIPPED', shipped_at = NOW(), updated_at = NOW()
        WHERE id = ?`,
      [
        orderResult.shiprocket_order_id,
        labelResult.shiprocket_shipment_id,
        resolved?.trackingNumber ?? labelResult.tracking_id,
        resolved?.carrierName ?? labelResult.courier_company,
        resolved?.trackingUrl ?? null,
        orderId,
      ]
    );

    logger.info({ message: "ShipRocket shipment created", orderId, adminId: req.user.id });

    res.json({
      success: true,
      message: "Shipment created successfully",
      tracking: resolved,
      label_url: labelResult.label_url,
    });
  } catch (err) {
    fail(res, 500, "Failed to create shipment", err, { orderId });
  }
});

/** POST /api/shipping/orders/:orderId/update-tracking — pull the latest from ShipRocket. */
router.post("/orders/:orderId/update-tracking", adminGuard, async (req, res) => {
  const orderId = parseId(req.params.orderId);
  if (!orderId) return res.status(404).json({ message: "Order not found" });

  try {
    const [rows] = await pool.query(
      "SELECT id, tracking_id, tracking_provider FROM orders WHERE id = ? LIMIT 1",
      [orderId]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Order not found" });

    const order = rows[0];
    if (!order.tracking_id) {
      return res.status(409).json({ message: "This order has no tracking details yet" });
    }
    if (order.tracking_provider !== "SHIPROCKET") {
      return res.status(409).json({
        message: "This shipment was entered manually — update its status by hand.",
      });
    }

    const trackingData = await getTrackingStatus(order.tracking_id);
    if (!trackingData.success) {
      return res
        .status(502)
        .json({ message: "Failed to fetch tracking data", details: trackingData.message });
    }

    const delivered = trackingData.status_code === "delivered";
    const orderStatus = delivered ? "DELIVERED" : "SHIPPED";
    const deliveredAt = delivered ? trackingData.delivered_date || new Date() : null;

    await pool.query(
      `UPDATE orders
          SET status = ?, shipping_status = ?, delivered_at = ?, updated_at = NOW()
        WHERE id = ?`,
      [orderStatus, trackingData.status || "In transit", deliveredAt, orderId]
    );

    res.json({
      success: true,
      message: "Tracking status updated",
      status: orderStatus,
      shipping_status: trackingData.status,
      delivered_at: deliveredAt,
      events: trackingData.events,
    });
  } catch (err) {
    fail(res, 500, "Failed to update tracking", err, { orderId });
  }
});

/**
 * GET /api/shipping/couriers
 * ShipRocket serviceability for a route. `pickup_pincode` defaults to the
 * warehouse configured in SHIPROCKET_PICKUP_PINCODE rather than being
 * hardcoded in the browser.
 */
router.get("/couriers", adminGuard, async (req, res) => {
  try {
    const pickup = String(req.query.pickup_pincode || DEFAULT_PICKUP_PINCODE).trim();
    const delivery = String(req.query.delivery_pincode || "").trim();

    if (!/^[1-9][0-9]{5}$/.test(delivery)) {
      return res
        .status(400)
        .json({ success: false, message: "A valid 6-digit delivery_pincode is required", couriers: [] });
    }

    if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
      return res.status(503).json({
        success: false,
        message: "ShipRocket is not configured. You can still enter tracking details manually.",
        couriers: [],
      });
    }

    const result = await getAvailableCouriers(pickup, delivery, parseFloat(req.query.weight) || 0.5);

    res.json({
      success: result.success,
      couriers: result.couriers || [],
      message: result.message,
    });
  } catch (err) {
    fail(res, 500, "Failed to get couriers", err);
  }
});

export default router;
