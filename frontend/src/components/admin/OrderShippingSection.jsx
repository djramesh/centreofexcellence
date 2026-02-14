/**
 * AdminOrderShipping.jsx
 * 
 * Shipping & Tracking UI Component for Admin Orders Page
 * Add this to AdminOrders component or use as reference
 */

import React, { useState } from "react";
import { shippingApi } from "../../api/admin.js";

export function OrderShippingSection({ order, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(null);
  const [error, setError] = useState("");

  const handleCreateShipment = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await shippingApi.createShipment(order.id, {
        courier_id: null, // auto-select cheapest
      });

      if (result.success) {
        alert(`✅ Shipment created!\n\nTracking ID: ${result.tracking_id}\nCourier: ${result.courier_company}`);
        if (onUpdate) onUpdate();
      } else {
        setError(`Failed: ${result.message}`);
      }
    } catch (err) {
      setError(err.message || "Failed to create shipment");
    } finally {
      setLoading(false);
    }
  };

  const handleGetTracking = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await shippingApi.getTracking(order.id);
      setTracking(result);
    } catch (err) {
      setError(err.message || "Failed to get tracking");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTracking = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await shippingApi.updateTracking(order.id);

      if (result.success) {
        alert("✅ Tracking updated from ShipRocket");
        if (onUpdate) onUpdate();
      } else {
        setError(`Failed: ${result.message}`);
      }
    } catch (err) {
      setError(err.message || "Failed to update tracking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-shipping-section">
      <h3>Shipping & Tracking</h3>

      {error && <div className="admin-error-small">{error}</div>}

      {/* No Shipment Yet */}
      {!order.tracking_id ? (
        <div className="shipping-empty">
          <p>No shipment created yet</p>
          <button
            className="admin-btn admin-btn-primary"
            onClick={handleCreateShipment}
            disabled={loading || order.payment_status !== "PAID"}
          >
            {loading ? "Creating..." : "Create Shipment"}
          </button>
          {order.payment_status !== "PAID" && (
            <p className="shipping-hint">
              ℹ️ Payment must be confirmed first
            </p>
          )}
        </div>
      ) : (
        /* Shipment Exists - Show Tracking */
        <div className="shipping-info">
          <div className="shipping-details">
            <div className="shipping-row">
              <span className="label">Tracking ID:</span>
              <span className="value">{order.tracking_id}</span>
            </div>

            <div className="shipping-row">
              <span className="label">Courier:</span>
              <span className="value">{order.courier_company || "—"}</span>
            </div>

            <div className="shipping-row">
              <span className="label">Status:</span>
              <span className={`value status-${order.shipping_status?.toLowerCase()}`}>
                {order.shipping_status || "Unknown"}
              </span>
            </div>

            {order.tracking_url && (
              <div className="shipping-row">
                <span className="label">Link:</span>
                <a href={order.tracking_url} target="_blank" rel="noopener noreferrer">
                  View on ShipRocket →
                </a>
              </div>
            )}

            {order.shipped_at && (
              <div className="shipping-row">
                <span className="label">Shipped:</span>
                <span className="value">
                  {new Date(order.shipped_at).toLocaleDateString()}
                </span>
              </div>
            )}

            {order.delivered_at && (
              <div className="shipping-row">
                <span className="label">Delivered:</span>
                <span className="value">
                  {new Date(order.delivered_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          <div className="shipping-actions">
            <button
              className="admin-btn admin-btn-secondary"
              onClick={handleGetTracking}
              disabled={loading}
            >
              {loading ? "Loading..." : "Check Tracking"}
            </button>

            <button
              className="admin-btn admin-btn-secondary"
              onClick={handleUpdateTracking}
              disabled={loading}
            >
              {loading ? "Syncing..." : "Sync Status"}
            </button>
          </div>
        </div>
      )}

      {/* Tracking Details Modal */}
      {tracking && (
        <div className="tracking-modal">
          <h4>Tracking Details</h4>
          <div className="tracking-status">
            <p>
              <strong>Status:</strong> {tracking.status}
            </p>
            <p>
              <strong>Current Location:</strong> {tracking.current_location || "—"}
            </p>
          </div>

          {tracking.events && tracking.events.length > 0 && (
            <div className="tracking-events">
              <h5>Updates</h5>
              <div className="events-list">
                {tracking.events.map((event, idx) => (
                  <div key={idx} className="event-item">
                    <span className="event-status">{event.status}</span>
                    <span className="event-time">{event.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => setTracking(null)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * CSS Styles (add to AdminOrders.css)
 */

export const shippingStyles = `
.admin-shipping-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.25rem;
  margin-top: 1.5rem;
}

.admin-shipping-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
}

.admin-error-small {
  background: #fee2e2;
  color: #991b1b;
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.shipping-empty {
  text-align: center;
  padding: 2rem 1rem;
}

.shipping-empty p {
  color: #64748b;
  margin: 0 0 1rem 0;
}

.shipping-info {
  display: grid;
  gap: 1.25rem;
}

.shipping-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.shipping-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 0.375rem;
  border-left: 3px solid #3b82f6;
}

.shipping-row .label {
  font-weight: 500;
  color: #475569;
  font-size: 0.875rem;
}

.shipping-row .value {
  font-weight: 600;
  color: #0f172a;
}

.shipping-row a {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}

.shipping-row a:hover {
  text-decoration: underline;
}

.status-shipped {
  color: #2563eb;
  background: #eff6ff;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
}

.status-delivered {
  color: #15803d;
  background: #f0fdf4;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
}

.status-pending,
.status-unknown {
  color: #92400e;
  background: #fefce8;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
}

.shipping-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.shipping-hint {
  font-size: 0.8125rem;
  color: #64748b;
  margin-top: 0.5rem;
}

.tracking-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 1rem;
}

.tracking-modal > div {
  background: white;
  border-radius: 0.875rem;
  padding: 1.75rem;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.tracking-modal h4 {
  margin: 0 0 1rem 0;
  color: #0f172a;
}

.tracking-status {
  background: #f0fdf4;
  border-left: 3px solid #15803d;
  padding: 1rem;
  border-radius: 0.375rem;
  margin-bottom: 1.25rem;
}

.tracking-status p {
  margin: 0.5rem 0;
  font-size: 0.9375rem;
}

.tracking-events {
  margin-bottom: 1.25rem;
}

.tracking-events h5 {
  margin: 0 0 0.75rem 0;
  color: #475569;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.event-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.375rem;
  border-left: 2px solid #3b82f6;
  font-size: 0.875rem;
}

.event-status {
  font-weight: 500;
  color: #0f172a;
}

.event-time {
  color: #64748b;
  font-size: 0.8125rem;
}
`;

export default OrderShippingSection;
