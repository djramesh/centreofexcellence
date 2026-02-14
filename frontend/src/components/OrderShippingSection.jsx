import React, { useState, useEffect } from "react";
import { shippingApi } from "../api/admin.js";
import "./OrderShippingSection.css";

export default function OrderShippingSection({ order, onStatusUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tracking, setTracking] = useState(null);
  const [couriers, setCouriers] = useState([]);
  const [selectedCourier, setSelectedCourier] = useState("");
  const [showTracking, setShowTracking] = useState(false);

  // Fetch available couriers
  useEffect(() => {
    if (order?.payment_status !== "PAID") return;
    if (!order?.pincode) return; // Skip if no pincode

    const fetchCouriers = async () => {
      try {
        // Use order's pincode for delivery
        const params = {
          pickup_pincode: "110001", // Default pickup from India
          delivery_pincode: order.pincode,
          weight: 0.5,
        };
        console.log("Fetching couriers with params:", params);
        const res = await shippingApi.getAvailableCouriers(params);
        console.log("Couriers response:", res);
        
        // Backend returns { success, couriers: [...] }
        if (res.couriers && Array.isArray(res.couriers)) {
          setCouriers(res.couriers);
        } else if (res.data && Array.isArray(res.data)) {
          setCouriers(res.data);
        } else {
          setCouriers([]);
        }
      } catch (err) {
        console.error("Failed to fetch couriers:", err);
        // Show error message if available
        const errorMsg = err?.data?.message || err?.response?.data?.message || err?.message;
        if (errorMsg) {
          console.warn("Courier fetch warning:", errorMsg);
        }
        setCouriers([]);
      }
    };

    fetchCouriers();
  }, [order?.pincode, order?.payment_status]);

  // Fetch tracking status if tracking ID exists
  useEffect(() => {
    if (!order?.tracking_id) return;

    const fetchTracking = async () => {
      try {
        const res = await shippingApi.getTracking(order.id);
        setTracking(res);
      } catch (err) {
        console.error("Failed to fetch tracking:", err);
      }
    };

    fetchTracking();
  }, [order?.tracking_id, order?.id]);

  const handleCreateShipment = async () => {
    if (!order) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await shippingApi.createShipment(order.id, {
        courier_id: selectedCourier || null,
      });

      setSuccess(`Shipment created! Tracking ID: ${res.tracking_id}`);
      setTracking(res);
      
      // Trigger parent refresh
      if (onStatusUpdate) onStatusUpdate();

      // Clear form
      setSelectedCourier("");
    } catch (err) {
      setError(
        err?.data?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create shipment"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTracking = async () => {
    if (!order?.tracking_id) return;
    setLoading(true);
    setError("");

    try {
      const res = await shippingApi.updateTracking(order.id);
      setSuccess("Tracking status updated!");
      setTracking(res);
      
      if (onStatusUpdate) onStatusUpdate();
    } catch (err) {
      setError(
        err?.data?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to sync tracking"
      );
    } finally {
      setLoading(false);
    }
  };

  // Only show if order is PAID
  if (order?.payment_status !== "PAID") {
    return null;
  }

  return (
    <div className="order-shipping-section">
      <h3>Shipping & Delivery</h3>

      {error && <div className="order-shipping-error">{error}</div>}
      {success && <div className="order-shipping-success">{success}</div>}

      {!order?.tracking_id ? (
        <div className="order-shipping-create">
          <p className="order-shipping-info">Create shipment on ShipRocket to generate tracking label</p>

          {couriers.length > 0 && (
            <div className="order-shipping-courier">
              <label>
                Select Courier (Optional)
                <select
                  value={selectedCourier}
                  onChange={(e) => setSelectedCourier(e.target.value)}
                  className="order-shipping-select"
                  disabled={loading}
                >
                  <option value="">Auto-select best option</option>
                  {couriers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} - ₹{c.rate || 0}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <button
            type="button"
            className="order-shipping-btn order-shipping-btn-primary"
            onClick={handleCreateShipment}
            disabled={loading}
          >
            {loading ? "Creating shipment…" : "Create Shipment"}
          </button>
        </div>
      ) : (
        <div className="order-shipping-status">
          <div className="order-shipping-info-row">
            <strong>Tracking ID:</strong>
            <span>{order.tracking_id}</span>
          </div>

          {order.courier_company && (
            <div className="order-shipping-info-row">
              <strong>Courier:</strong>
              <span>{order.courier_company}</span>
            </div>
          )}

          {order.shipping_status && (
            <div className="order-shipping-info-row">
              <strong>Status:</strong>
              <span className="order-shipping-status-badge">{order.shipping_status}</span>
            </div>
          )}

          {tracking?.tracking_url && (
            <div className="order-shipping-link">
              <a
                href={tracking.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="order-shipping-track-link"
              >
                → Track on {order.courier_company || "Courier"} website
              </a>
            </div>
          )}

          <div className="order-shipping-actions">
            <button
              type="button"
              className="order-shipping-btn order-shipping-btn-secondary"
              onClick={handleSyncTracking}
              disabled={loading}
            >
              {loading ? "Syncing…" : "Sync Status"}
            </button>

            {tracking?.events && tracking.events.length > 0 && (
              <button
                type="button"
                className="order-shipping-btn order-shipping-btn-secondary"
                onClick={() => setShowTracking(!showTracking)}
              >
                {showTracking ? "Hide Events" : "View Events"}
              </button>
            )}
          </div>

          {showTracking && tracking?.events && (
            <div className="order-shipping-events">
              <h4>Tracking Events</h4>
              <ul>
                {tracking.events.map((event, idx) => (
                  <li key={idx} className="order-shipping-event">
                    <strong>{event.status}</strong>
                    <span className="order-shipping-event-date">
                      {new Date(event.timestamp).toLocaleString("en-IN")}
                    </span>
                    {event.location && (
                      <span className="order-shipping-event-location">{event.location}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
