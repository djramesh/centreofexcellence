import React, { useEffect, useState, useCallback } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { adminApi } from "../../api/admin.js";
import { API_BASE_URL } from "../../api/client.js";
import OrderShippingSection from "../OrderShippingSection.jsx";
import "./AdminOrders.css";

const STATUS_OPTIONS = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function resolveImgUrl(url) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/assets/") || url.startsWith("assets/")) {
    return url.split("/").map((seg) => encodeURIComponent(seg)).join("/");
  }
  return url;
}

/* ─── Image Lightbox ─────────────────────────────────────────────────────── */
function ImageLightbox({ src, alt, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="lb-backdrop" onClick={onClose}>
      <button className="lb-close" onClick={onClose} aria-label="Close">✕</button>
      <img
        src={src}
        alt={alt || "Product"}
        className="lb-img"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

/* ─── Product thumbnail — clickable, opens lightbox ─────────────────────── */
function ProductThumb({ url, name, onExpand }) {
  const [err, setErr] = useState(false);
  const src = resolveImgUrl(url);

  if (!src || err) {
    return <div className="admin-thumb-placeholder">🧺</div>;
  }

  return (
    <div
      className="admin-thumb-wrap"
      onClick={() => onExpand(src, name)}
      title="Click to expand"
    >
      <img
        src={src}
        alt={name || "Product"}
        onError={() => setErr(true)}
        className="admin-thumb"
      />
      <div className="admin-thumb-overlay">🔍</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN ORDERS LIST
═══════════════════════════════════════════════════════════════════════════ */
export default function AdminOrders() {
  const [orders, setOrders]             = useState([]);
  const [pagination, setPagination]     = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get("status") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (statusFilter) params.status = statusFilter;
    adminApi.getOrders(params)
      .then((res) => { setOrders(res.orders); setPagination(res.pagination); })
      .catch((err) => setError(err?.data?.message || err?.message || "Failed to load orders"))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete("page");
    setSearchParams(next);
  };

  const setPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(p));
    setSearchParams(next);
  };

  return (
    <div className="admin-page admin-orders">
      <header className="admin-page-header">
        <h1>Orders</h1>
        <p>Manage and track all orders</p>
      </header>

      <div className="admin-filters">
        <label>
          Status
          <select value={statusFilter} onChange={(e) => setFilter("status", e.target.value)} className="admin-select">
            <option value="">All</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">Loading orders…</div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Product ID</th>
                  <th>Customer</th>
                  <th>Location</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link to={"/admin/orders/" + o.id} className="admin-link">#{o.id}</Link>
                    </td>

                    {/* ── Product ID column ─────────────────────────────────
                        Supports three shapes the API might return:
                        1. o.product_ids  → array  e.g. [3, 7]
                        2. o.product_id   → single number  e.g. 3
                        3. Neither        → show dash
                    ──────────────────────────────────────────────────────── */}
                    <td className="admin-product-ids">
                      {Array.isArray(o.product_ids) && o.product_ids.length > 0
                        ? o.product_ids.map((pid) => (
                            <span key={pid} className="admin-pid-pill">{pid}</span>
                          ))
                        : o.product_id
                          ? <span className="admin-pid-pill">{o.product_id}</span>
                          : <span className="admin-muted">—</span>
                      }
                    </td>

                    <td>
                      <div>{o.customer_name}</div>
                      <div className="admin-muted">{o.customer_email}</div>
                    </td>
                    <td>{o.city ? o.city + ", " + o.state : "—"}</td>
                    <td>₹{Number(o.total_amount).toLocaleString("en-IN")}</td>
                    <td><span className="admin-badge" data-status={o.status}>{o.status}</span></td>
                    <td>{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                    <td><Link to={"/admin/orders/" + o.id} className="admin-link">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.total > pagination.limit && (
            <div className="admin-pagination">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={pagination.page <= 1}
                onClick={() => setPage(pagination.page - 1)}
              >Previous</button>
              <span className="admin-pagination-info">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
              </span>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                onClick={() => setPage(pagination.page + 1)}
              >Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN ORDER DETAIL
═══════════════════════════════════════════════════════════════════════════ */
export function AdminOrderDetail() {
  const { id }                    = useParams();
  const [order, setOrder]         = useState(null);
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [updating, setUpdating]   = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [lightbox, setLightbox]   = useState(null); // { src, alt }

  const openLightbox  = useCallback((src, alt) => setLightbox({ src, alt }), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    if (!id) return;
    adminApi.getOrder(id)
      .then((res) => {
        setOrder(res.order);
        setItems(res.items || []);
        setNewStatus(res.order?.status || "");
      })
      .catch((err) => setError(err?.data?.message || err?.message || "Failed to load order"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdateStatus = () => {
    if (!order || newStatus === order.status) return;
    setUpdating(true);
    adminApi.updateOrderStatus(order.id, newStatus)
      .then(() => setOrder((o) => ({ ...o, status: newStatus })))
      .catch((err) => setError(err?.data?.message || err?.message || "Failed to update"))
      .finally(() => setUpdating(false));
  };

  const handleDownloadInvoice = async () => {
    const token = localStorage.getItem("authToken");
    if (!order || !token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${order.id}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `invoice-${order.id}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  };

  if (loading) return <div className="admin-loading">Loading order…</div>;
  if (error && !order) return <div className="admin-error">{error}</div>;
  if (!order) return null;

  return (
    <div className="admin-page admin-order-detail">

      {/* Lightbox */}
      {lightbox && (
        <ImageLightbox src={lightbox.src} alt={lightbox.alt} onClose={closeLightbox} />
      )}

      <header className="admin-page-header">
        <div>
          <Link to="/admin/orders" className="admin-link admin-back">← Orders</Link>
          <h1>Order #{order.id}</h1>
          <p>{new Date(order.created_at).toLocaleString("en-IN")}</p>
        </div>
        <button type="button" className="admin-btn admin-btn-secondary" onClick={handleDownloadInvoice}>
          Download invoice
        </button>
      </header>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-order-detail-grid">
        <div className="admin-order-card">
          <h3>Customer</h3>
          <p><strong>{order.customer_name}</strong></p>
          <p className="admin-muted">{order.customer_email}</p>
          {order.phone && <p className="admin-muted">{order.phone}</p>}
        </div>

        <div className="admin-order-card">
          <h3>Shipping address</h3>
          <p>{order.line1}</p>
          {order.line2 && <p>{order.line2}</p>}
          <p>{order.city}, {order.state} {order.pincode}</p>
          <p>{order.country}</p>
        </div>

        <div className="admin-order-card">
          <h3>Status</h3>
          <div className="admin-order-status-row">
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="admin-select">
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={newStatus === order.status || updating}
              onClick={handleUpdateStatus}
            >
              {updating ? "Updating…" : "Update"}
            </button>
          </div>
          <p className="admin-muted">Payment: {order.payment_status}</p>
        </div>
      </div>

      {/* Items — clickable product images + product ID badge */}
      <div className="admin-order-card admin-order-items">
        <h3>Items</h3>
        <div className="admin-items-list">
          {items.map((row, i) => (
            <div
              key={row.id}
              className="admin-item-row"
              style={{ borderBottom: i < items.length - 1 ? "1px solid #e2e8f0" : "none" }}
            >
              <ProductThumb
                url={row.thumbnail_url || row.product_thumbnail || null}
                name={row.product_name}
                onExpand={openLightbox}
              />

              <div className="admin-item-info">
                <p className="admin-item-name">{row.product_name}</p>
                <p className="admin-item-meta">
                  {row.product_id && (
                    <span className="admin-pid-pill" style={{ marginRight: 6 }}>
                      ID: {row.product_id}
                    </span>
                  )}
                  Qty: {row.quantity}
                </p>
              </div>

              <div className="admin-item-pricing">
                <p className="admin-item-unit">₹{Number(row.unit_price).toLocaleString("en-IN")} each</p>
                <p className="admin-item-total">₹{Number(row.line_total).toLocaleString("en-IN")}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="admin-order-total">
          <strong>Total: ₹{Number(order.total_amount).toLocaleString("en-IN")}</strong>
        </p>
      </div>

      <OrderShippingSection
        order={order}
        onStatusUpdate={() => {
          adminApi.getOrder(id)
            .then((res) => { setOrder(res.order); setItems(res.items || []); })
            .catch((err) => console.error("Failed to refresh order", err));
        }}
      />
    </div>
  );
}