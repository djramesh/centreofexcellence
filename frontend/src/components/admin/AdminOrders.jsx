import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { adminApi } from "../../api/admin.js";
import ordersApi from "../../api/orders.js";
import SmartImage from "../common/SmartImage.jsx";
import ImageLightbox from "../common/ImageLightbox.jsx";
import OrderShippingSection from "../OrderShippingSection.jsx";
import "./AdminOrders.css";

const STATUS_OPTIONS = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

/* ─── Product thumbnail — click to open the shared lightbox ─────────────── */
function ProductThumb({ url, name, onExpand }) {
  return (
    <button type="button" className="admin-thumb-wrap" onClick={onExpand} title="Click to expand">
      <SmartImage src={url} alt={name || "Product"} wrapperClassName="admin-thumb-placeholder" />
      <span className="admin-thumb-overlay">🔍</span>
    </button>
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
  const search = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const [searchInput, setSearchInput] = useState(search);
  const searchTimer = useRef(null);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (statusFilter) params.status = statusFilter;
    if (search) params.search = search;
    adminApi.getOrders(params)
      .then((res) => { setOrders(res.orders); setPagination(res.pagination); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, statusFilter, search]);

  /* Keep the query in the URL so a filtered view can be bookmarked and shared
     with whoever else works the order queue. */
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      if (searchInput === search) return;
      const next = new URLSearchParams(searchParams);
      if (searchInput.trim()) next.set("q", searchInput.trim());
      else next.delete("q");
      next.delete("page");
      setSearchParams(next);
    }, 350);
    return () => clearTimeout(searchTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

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
        <label className="admin-filter-search">
          Search
          <input
            type="search"
            className="admin-select"
            placeholder="Order #, customer, email or tracking no."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
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
                  <th>Customer</th>
                  <th>Location</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Shipment</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="admin-empty-row">
                      No orders match these filters.
                    </td>
                  </tr>
                ) : orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link to={"/admin/orders/" + o.id} className="admin-link">#{o.id}</Link>
                    </td>
                    <td>
                      <div>{o.customer_name}</div>
                      <div className="admin-muted">{o.customer_email}</div>
                    </td>
                    <td>{o.city ? o.city + ", " + o.state : "—"}</td>
                    <td>₹{Number(o.total_amount).toLocaleString("en-IN")}</td>
                    <td><span className="admin-badge" data-status={o.status}>{o.status}</span></td>
                    <td>
                      {o.tracking ? (
                        <div className="admin-ship-cell">
                          <span className="admin-ship-carrier">{o.tracking.carrierName}</span>
                          <span className="admin-muted">{o.tracking.trackingNumber}</span>
                        </div>
                      ) : o.payment_status === "PAID" ? (
                        <span className="admin-ship-pending">Not dispatched</span>
                      ) : (
                        <span className="admin-muted">—</span>
                      )}
                    </td>
                    <td>{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                    <td><Link to={"/admin/orders/" + o.id} className="admin-link">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.total > pagination.limit && (
            <div className="admin-pagination">
              <button type="button" className="admin-btn admin-btn-secondary" disabled={pagination.page <= 1} onClick={() => setPage(pagination.page - 1)}>Previous</button>
              <span className="admin-pagination-info">Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}</span>
              <button type="button" className="admin-btn admin-btn-secondary" disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)} onClick={() => setPage(pagination.page + 1)}>Next</button>
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
  const { id }                        = useParams();
  const [order, setOrder]             = useState(null);
  const [items, setItems]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [updating, setUpdating]       = useState(false);
  const [newStatus, setNewStatus]     = useState("");
  const [lightbox, setLightbox]       = useState(null);

  const closeLightbox = useCallback(() => setLightbox(null), []);

  const reload = useCallback(() => {
    if (!id) return;
    adminApi.getOrder(id)
      .then((res) => { setOrder(res.order); setItems(res.items || []); setNewStatus(res.order?.status || ""); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  const handleUpdateStatus = () => {
    if (!order || newStatus === order.status) return;
    setUpdating(true);
    setError("");
    adminApi.updateOrderStatus(order.id, newStatus)
      .then(() => setOrder((o) => ({ ...o, status: newStatus })))
      .catch((err) => setError(err.message))
      .finally(() => setUpdating(false));
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;
    setError("");
    try {
      const blob = await ordersApi.downloadInvoice(order.id);
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `invoice-${order.id}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Could not download the invoice.");
    }
  };

  if (loading) return <div className="admin-loading">Loading order…</div>;
  if (error && !order) return <div className="admin-error">{error}</div>;
  if (!order) return null;

  const galleryImages = items
    .filter((row) => row.thumbnail_url)
    .map((row) => ({ url: row.thumbnail_url, alt: row.product_name }));

  return (
    <div className="admin-page admin-order-detail">

      {lightbox !== null && (
        <ImageLightbox images={galleryImages} startIndex={lightbox} onClose={closeLightbox} />
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

      {/* Items — with clickable product images */}
      <div className="admin-order-card admin-order-items">
        <h3>Items</h3>
        <div className="admin-items-list">
          {items.map((row, i) => {
            const galleryIndex = galleryImages.findIndex((img) => img.url === row.thumbnail_url);
            return (
            <div
              key={row.id}
              className="admin-item-row"
              style={{ borderBottom: i < items.length - 1 ? "1px solid #e2e8f0" : "none" }}
            >
              <ProductThumb
                url={row.thumbnail_url}
                name={row.product_name}
                onExpand={() => galleryIndex >= 0 && setLightbox(galleryIndex)}
              />
              <div className="admin-item-info">
                <p className="admin-item-name">{row.product_name}</p>
                <p className="admin-item-meta">
                  {row.product_id && (
                    <span className="admin-pid-pill" style={{ marginRight: 6 }}>ID: {row.product_id}</span>
                  )}
                  Qty: {row.quantity}
                </p>
              </div>
              <div className="admin-item-pricing">
                <p className="admin-item-unit">₹{Number(row.unit_price).toLocaleString("en-IN")} each</p>
                <p className="admin-item-total">₹{Number(row.line_total).toLocaleString("en-IN")}</p>
              </div>
            </div>
            );
          })}
        </div>
        <p className="admin-order-total">
          <strong>Total: ₹{Number(order.total_amount).toLocaleString("en-IN")}</strong>
        </p>
      </div>

      <OrderShippingSection order={order} onStatusUpdate={reload} />
    </div>
  );
}