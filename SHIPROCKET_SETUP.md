# ShipRocket Integration Guide

## Overview
ShipRocket is integrated to automate shipping label generation and tracking for orders. This system:
- ✅ Automatically generates shipping labels
- ✅ Gets real-time tracking IDs
- ✅ Tracks package status via webhook updates
- ✅ Supports multiple couriers (DTDC, Delhivery, India Post, etc.)

---

## Setup Instructions

### 1. Create ShipRocket Account
1. Go to https://www.shiprocket.in/
2. Sign up and create an account
3. Complete KYC verification
4. Add your pickup location/warehouse

### 2. Get API Credentials
1. Login to ShipRocket Dashboard
2. Go to **Settings → API Keys**
3. You'll see your **Email** and **Password**
4. Copy these credentials

### 3. Add to Backend .env
Edit `backend/.env` and add:
```env
SHIPROCKET_EMAIL=your_email@example.com
SHIPROCKET_PASSWORD=your_password
SHIPROCKET_API_KEY=your_api_key (optional, not always needed)
```

### 4. Run Database Migration
```bash
cd backend/db
C:\xampp\mysql\bin\mysql.exe -u root < migration_add_shipping.sql
```

This adds columns to track:
- `shiprocket_order_id`
- `shiprocket_shipment_id`
- `tracking_id`
- `courier_company`
- `tracking_url`
- `shipping_status`
- `shipped_at`
- `delivered_at`

---

## API Endpoints

### Create Shipment
**Endpoint:** `POST /api/shipping/orders/:orderId/create-shipment`

**Request Body:**
```json
{
  "courier_id": null  // null = auto-select cheapest, or specific courier ID
}
```

**Response:**
```json
{
  "success": true,
  "message": "Shipment created successfully",
  "tracking_id": "1234567890",
  "tracking_url": "https://shiprocket.in/tracking/...",
  "courier_company": "DTDC",
  "label_url": "https://shiprocket.in/label/..."
}
```

### Get Tracking Status
**Endpoint:** `GET /api/shipping/orders/:orderId/tracking`

**Response:**
```json
{
  "order_id": 5,
  "tracking_id": "1234567890",
  "courier_company": "DTDC",
  "tracking_url": "https://shiprocket.in/tracking/...",
  "status": "DELIVERED",
  "status_code": "delivered",
  "delivered_date": "2026-02-13",
  "events": [
    {
      "status": "Order picked up",
      "timestamp": "2026-02-11 10:30:00"
    },
    ...
  ]
}
```

### Update Tracking (Manual Sync)
**Endpoint:** `POST /api/shipping/orders/:orderId/update-tracking`

Fetches latest status from ShipRocket and updates the order in database.

### Get Available Couriers
**Endpoint:** `GET /api/shipping/couriers?pickup_pincode=400001&delivery_pincode=560001&weight=0.5`

Returns list of available couriers for a route.

---

## Admin UI Integration

### Display in AdminOrders Component
Add a "Create Shipment" section:

```jsx
import { shippingApi } from "../../api/admin.js";

// In AdminOrders component:
const handleCreateShipment = async (orderId) => {
  try {
    const result = await shippingApi.createShipment(orderId, {
      courier_id: null // auto-select
    });
    if (result.success) {
      alert(`Shipment created! Tracking: ${result.tracking_id}`);
      loadOrders(); // refresh
    }
  } catch (err) {
    alert("Failed: " + err.message);
  }
};

// In order details:
<button onClick={() => handleCreateShipment(order.id)}>
  Create Shipment
</button>

// Show tracking:
{order.tracking_id && (
  <div>
    <p>Tracking: {order.tracking_id}</p>
    <a href={order.tracking_url} target="_blank">
      View Tracking
    </a>
  </div>
)}
```

---

## Automatic Updates (Webhooks)

ShipRocket supports webhooks for real-time updates. To implement:

### 1. Add Webhook Handler
Create endpoint: `POST /api/shipping/webhooks/status-update`

```javascript
router.post("/webhooks/status-update", async (req, res) => {
  const { shipment_id, status, tracking_id } = req.body;
  
  // Update order status in database
  // Send email notification to customer
  
  res.json({ success: true });
});
```

### 2. Configure in ShipRocket Dashboard
1. Go to Settings → Webhooks
2. Add your endpoint URL: `https://yourdomain.com/api/shipping/webhooks/status-update`
3. Select events: "Shipment Status"
4. Enable webhooks

---

## Status Mapping

ShipRocket statuses map to system orders as:

| ShipRocket Status | Order Status | Notes |
|---|---|---|
| pre_transit | SHIPPED | Waiting for pickup |
| picked_up | SHIPPED | Picked from warehouse |
| in_transit | SHIPPED | In delivery |
| out_for_delivery | SHIPPED | Out for delivery today |
| delivered | DELIVERED | Successfully delivered |
| cancelled | CANCELLED | Shipment cancelled |
| undelivered | PENDING | Delivery failed |
| lost | CANCELLED | Package lost |
| returned | PENDING | Returned to sender |

---

## Bulk Operations

### Create Shipments for Multiple Orders
```bash
# Manual API calls in admin dashboard
```

### Get Tracking for All Orders
```javascript
// In backend service
async function syncAllTracking() {
  const [orders] = await pool.query(
    "SELECT id, tracking_id FROM orders WHERE tracking_id IS NOT NULL AND status != 'DELIVERED'"
  );
  
  for (const order of orders) {
    const tracking = await getTrackingStatus(order.tracking_id);
    // Update order status
  }
}

// Schedule daily: Every 6 hours
setInterval(syncAllTracking, 6 * 60 * 60 * 1000);
```

---

## Testing

### Test Credentials (ShipRocket Test Mode)
If setting up test environment:
1. Use ShipRocket's test account
2. Orders won't be actually shipped
3. Tracking won't update automatically

### Manual Testing
```bash
# Test API connection
curl -X POST https://apiv2.shiprocket.in/v1/external/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"your_password"}'
```

---

## Troubleshooting

### "Failed to authenticate with ShipRocket"
- Check credentials in .env
- Verify account login works on shiprocket.in
- Ensure KYC is complete

### "Order already exists on ShipRocket"
- Each order can only be created once
- Check `shiprocket_order_id` in database

### "No couriers available for this route"
- Delivery pincode may be in remote area
- Contact ShipRocket support for COD restrictions
- Use specific courier_id instead of auto-select

### Tracking not updating
- ShipRocket can take 4-6 hours for first update
- Manually call `update-tracking` endpoint if needed
- Check webhook configuration

---

## Future Enhancements

1. **Batch Label Generation** - Create labels for multiple orders at once
2. **Return Management** - Handle returns via ShipRocket
3. **Analytics Dashboard** - Track delivery rates, costs by courier
4. **Multi-warehouse** - Support shipping from multiple locations
5. **NDR Management** - Auto handle non-deliveries
6. **Customer Notifications** - Auto emails with tracking updates

---

## Support

- ShipRocket Docs: https://www.shiprocket.in/api-documentation
- API Support: support@shiprocket.in
- Community: https://community.shiprocket.in

