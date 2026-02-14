import React, { useEffect, useState } from "react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import ordersApi from "../api/orders.js";
import { API_BASE_URL } from "../api/client.js";
import "./Login.css";
import "./Common.css";

export function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get("page") || "1", 10);

  useEffect(() => {
    setLoading(true);
    ordersApi
      .list({ page, limit: 20 })
      .then((res) => {
        setOrders(res.orders);
        setPagination(res.pagination);
      })
      .catch((err) =>
        setError(err?.data?.message || err?.message || "Failed to load orders")
      )
      .finally(() => setLoading(false));
  }, [page]);

  const setPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(p));
    setSearchParams(next);
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: "960px", width: "100%" }}>
        <h2 className="auth-title">My Orders</h2>
        <p className="auth-subtitle">Track your recent purchases and download invoices.</p>

        {error && <div className="auth-error">{error}</div>}
        {loading ? (
          <div style={{ padding: "1.5rem", textAlign: "center" }}>Loading orders…</div>
        ) : orders.length === 0 ? (
          <p style={{ padding: "1rem 0", textAlign: "center", color: "#64748b" }}>
            You don&apos;t have any orders yet.
          </p>
        ) : (
          <div className="admin-table-wrap" style={{ marginTop: "1rem" }}>
            <table className="admin-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td>{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                    <td>
                      {o.city
                        ? `${o.city}${o.state ? ", " + o.state : ""}`
                        : "—"}
                    </td>
                    <td>
                      <span className="admin-badge" data-status={o.status}>
                        {o.status}
                      </span>
                    </td>
                    <td>₹{Number(o.total_amount).toLocaleString("en-IN")}</td>
                    <td>
                      <Link to={`/orders/${o.id}`} className="admin-link">
                        View / Invoice
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.total > pagination.limit && (
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="button"
              disabled={pagination.page <= 1}
              onClick={() => setPage(pagination.page - 1)}
            >
              Previous
            </button>
            <span style={{ fontSize: "0.875rem", color: "#64748b" }}>
              Page {pagination.page} of{" "}
              {Math.ceil(pagination.total / pagination.limit)}
            </span>
            <button
              type="button"
              className="button"
              disabled={
                pagination.page >=
                Math.ceil(pagination.total / pagination.limit)
              }
              onClick={() => setPage(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    ordersApi
      .get(id)
      .then((res) => {
        setOrder(res.order);
        setItems(res.items || []);
      })
      .catch((err) =>
        setError(err?.data?.message || err?.message || "Failed to load order")
      )
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownloadInvoice = async () => {
    if (!id) return;
    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${id}/invoice`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // ignore for now
    }
  };

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div style={{ padding: "1.5rem", textAlign: "center" }}>Loading order…</div>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-error">{error}</div>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const TRACKING_STEPS = ["Placed", "Paid", "Shipped", "Delivered"];
  const statusIndexMap = {
    PENDING: 0,
    PAID: 1,
    SHIPPED: 2,
    DELIVERED: 3,
    CANCELLED: 0,
  };

  const currentStep =
    statusIndexMap[order.status] !== undefined ? statusIndexMap[order.status] : 0;

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: "960px", width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            alignItems: "center",
            marginBottom: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <Link to="/orders" className="admin-link">
              ← Orders
            </Link>
            <h2 className="auth-title" style={{ marginTop: "0.5rem" }}>
              Order #{order.id}
            </h2>
            <p className="auth-subtitle">
              {new Date(order.created_at).toLocaleString("en-IN")}
            </p>
          </div>
          <button
            type="button"
            className="button"
            onClick={handleDownloadInvoice}
          >
            Download invoice
          </button>
        </div>

        {/* Simple delivery tracking steps */}
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "1rem 1.25rem",
            borderRadius: "0.75rem",
            border: "1px solid #e5e7eb",
            background: "#f9fafb",
          }}
        >
          <p
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "#374151",
              marginBottom: "0.75rem",
            }}
          >
            Delivery status
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            {TRACKING_STEPS.map((label, index) => {
              const isActive = index <= currentStep;
              const isLast = index === TRACKING_STEPS.length - 1;
              return (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    minWidth: "0",
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "999px",
                      border: isActive
                        ? "none"
                        : "2px solid #d1d5db",
                      background: isActive ? "#22c55e" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {isActive ? "✓" : index + 1}
                  </div>
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "#111827" : "#9ca3af",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </span>
                  {!isLast && (
                    <div
                      style={{
                        flex: 1,
                        minWidth: 32,
                        maxWidth: 80,
                        height: 2,
                        background:
                          index < currentStep ? "#22c55e" : "#e5e7eb",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {order.status === "CANCELLED" && (
            <p
              style={{
                marginTop: "0.75rem",
                fontSize: "0.8rem",
                color: "#b91c1c",
                fontWeight: 500,
              }}
            >
              This order was cancelled.
            </p>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div className="admin-order-card">
            <h3>Customer</h3>
            <p>
              <strong>{order.customer_name}</strong>
            </p>
            <p className="admin-muted">{order.customer_email}</p>
            {order.phone && <p className="admin-muted">{order.phone}</p>}
          </div>
          <div className="admin-order-card">
            <h3>Shipping address</h3>
            <p>{order.line1}</p>
            {order.line2 && <p>{order.line2}</p>}
            <p>
              {order.city}, {order.state} {order.pincode}
            </p>
            <p>{order.country}</p>
          </div>
          <div className="admin-order-card">
            <h3>Status</h3>
            <p>
              <span className="admin-badge" data-status={order.status}>
                {order.status}
              </span>
            </p>
            <p className="admin-muted">Payment: {order.payment_status}</p>
          </div>
        </div>

        <div className="admin-order-card admin-order-items">
          <h3>Items</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>{row.product_name}</td>
                  <td>{row.quantity}</td>
                  <td>₹{Number(row.unit_price).toLocaleString("en-IN")}</td>
                  <td>₹{Number(row.line_total).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="admin-order-total">
            <strong>
              Total: ₹{Number(order.total_amount).toLocaleString("en-IN")}
            </strong>
          </p>
        </div>
      </div>
    </div>
  );
}

export default OrdersList;

