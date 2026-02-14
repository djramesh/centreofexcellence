import express from "express";
import { getDbPool } from "../config/db.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import {
  createShipRocketOrder,
  generateShippingLabel,
  getTrackingStatus,
  getAvailableCouriers,
} from "../services/shiprocket.js";

const router = express.Router();
const pool = getDbPool();

const adminGuard = [authRequired, requireRole("admin")];

/**
 * GET /api/shipping/orders/:id/tracking
 * Get tracking status for an order
 */
router.get("/orders/:orderId/tracking", adminGuard, async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, u.name, u.email, u.phone, a.line1, a.line2, a.city, a.state, a.pincode, a.country
       FROM orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN addresses a ON a.id = o.address_id
       WHERE o.id = ?`,
      [req.params.orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orders[0];

    if (!order.tracking_id) {
      return res.status(400).json({ message: "No tracking ID for this order" });
    }

    const trackingData = await getTrackingStatus(order.tracking_id);

    res.json({
      order_id: order.id,
      tracking_id: order.tracking_id,
      courier_company: order.courier_company,
      tracking_url: order.tracking_url,
      status: order.shipping_status,
      ...trackingData,
    });
  } catch (err) {
    console.error("Get tracking error", err);
    res.status(500).json({ message: "Failed to get tracking status", error: err.message });
  }
});

/**
 * POST /api/shipping/orders/:id/create-shipment
 * Create shipment on ShipRocket for an order
 */
router.post("/orders/:orderId/create-shipment", adminGuard, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { courier_id } = req.body;

    // Get order details
    const [orders] = await pool.query(
      `SELECT o.*, u.name, u.email, u.phone, a.line1, a.line2, a.city, a.state, a.pincode, a.country
       FROM orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN addresses a ON a.id = o.address_id
       WHERE o.id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orders[0];

    // Get order items
    const [items] = await pool.query(
      `SELECT oi.*, p.name as product_name
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    // Check if order payment is confirmed
    if (order.payment_status !== "PAID") {
      return res.status(400).json({ message: "Order payment not confirmed yet" });
    }

    // Check if already has ShipRocket order
    if (order.shiprocket_shipment_id) {
      return res.status(400).json({ message: "Shipment already created for this order" });
    }

    // Step 1: Create order on ShipRocket
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
      return res.status(400).json({
        message: "Failed to create ShipRocket order",
        details: orderResult.message,
      });
    }

    // Step 2: Generate shipping label
    const labelResult = await generateShippingLabel({
      shiprocket_order_id: orderResult.shiprocket_order_id,
      courier_id: courier_id || null,
    });

    if (!labelResult.success) {
      return res.status(400).json({
        message: "Failed to generate shipping label",
        details: labelResult.message,
      });
    }

    // Step 3: Update order with shipping details
    const [updateResult] = await pool.query(
      `UPDATE orders SET 
       shiprocket_order_id = ?, 
       shiprocket_shipment_id = ?, 
       tracking_id = ?, 
       courier_company = ?, 
       tracking_url = ?, 
       status = 'SHIPPED',
       shipped_at = NOW()
       WHERE id = ?`,
      [
        orderResult.shiprocket_order_id,
        labelResult.shiprocket_shipment_id,
        labelResult.tracking_id,
        labelResult.courier_company,
        labelResult.tracking_url,
        orderId,
      ]
    );

    res.json({
      success: true,
      message: "Shipment created successfully",
      tracking_id: labelResult.tracking_id,
      tracking_url: labelResult.tracking_url,
      courier_company: labelResult.courier_company,
      label_url: labelResult.label_url,
    });
  } catch (err) {
    console.error("Create shipment error", err);
    res.status(500).json({ message: "Failed to create shipment", error: err.message });
  }
});

/**
 * POST /api/shipping/orders/:id/update-tracking
 * Update order tracking status from ShipRocket
 */
router.post("/orders/:orderId/update-tracking", adminGuard, async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Get order
    const [orders] = await pool.query(
      "SELECT id, tracking_id FROM orders WHERE id = ?",
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orders[0];

    if (!order.tracking_id) {
      return res.status(400).json({ message: "No tracking ID for this order" });
    }

    // Get tracking from ShipRocket
    const trackingData = await getTrackingStatus(order.tracking_id);

    if (!trackingData.success) {
      return res.status(400).json({
        message: "Failed to fetch tracking data",
        details: trackingData.message,
      });
    }

    // Map ShipRocket status to our status
    let orderStatus = "SHIPPED";
    let deliveredAt = null;

    if (
      trackingData.status_code === "pre_transit" ||
      trackingData.status_code === "picked_up"
    ) {
      orderStatus = "SHIPPED";
    } else if (
      trackingData.status_code === "in_transit" ||
      trackingData.status_code === "out_for_delivery"
    ) {
      orderStatus = "SHIPPED";
    } else if (trackingData.status_code === "delivered") {
      orderStatus = "DELIVERED";
      deliveredAt = trackingData.delivered_date || new Date();
    }

    // Update order
    await pool.query(
      `UPDATE orders SET 
       status = ?, 
       shipping_status = ?, 
       delivered_at = ?
       WHERE id = ?`,
      [orderStatus, trackingData.status || "UNKNOWN", deliveredAt, orderId]
    );

    res.json({
      success: true,
      message: "Tracking status updated",
      status: orderStatus,
      shipping_status: trackingData.status,
      delivered_at: deliveredAt,
      tracking_events: trackingData.events,
    });
  } catch (err) {
    console.error("Update tracking error", err);
    res.status(500).json({ message: "Failed to update tracking", error: err.message });
  }
});

/**
 * GET /api/shipping/couriers
 * Get available couriers for a route
 * Query params: pickup_pincode, delivery_pincode, weight (optional)
 */
router.get("/couriers", adminGuard, async (req, res) => {
  try {
    let { pickup_pincode, delivery_pincode, weight } = req.query;

    console.log("=== COURIERS REQUEST ===");
    console.log("Params received:", { pickup_pincode, delivery_pincode, weight });

    // Validate required params
    if (!pickup_pincode || !delivery_pincode) {
      console.log("Missing params - sending 400");
      return res.status(400).json({
        success: false,
        message: "pickup_pincode and delivery_pincode required in query params",
        couriers: [],
      });
    }

    // Check if ShipRocket credentials are configured
    if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
      console.log("ShipRocket credentials missing");
      return res.status(400).json({
        success: false,
        message: "ShipRocket credentials not configured in .env",
        couriers: [],
      });
    }

    // Call the service
    const result = await getAvailableCouriers(
      pickup_pincode,
      delivery_pincode,
      parseFloat(weight) || 0.5
    );

    console.log("ShipRocket result:", { success: result.success, couriers_count: result.couriers?.length, message: result.message });

    // Send response
    res.json({
      success: result.success,
      couriers: result.couriers || [],
      data: result.data || [],
      message: result.message,
    });
  } catch (err) {
    console.error("=== COURIERS ERROR ===", err);
    res.status(500).json({
      success: false,
      message: "Failed to get couriers",
      error: err.message,
      couriers: [],
    });
  }
});

export default router;
