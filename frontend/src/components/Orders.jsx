import React, { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams, useParams, useNavigate } from "react-router-dom";
import ordersApi from "../api/orders.js";
import { API_BASE_URL } from "../api/client.js";

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const t = {
  bg:           "#f5f7ff",
  surface:      "#ffffff",
  surfaceHover: "#f8faff",
  border:       "#e8edf5",
  borderHover:  "#c7d6f5",
  blue:         "#2484ff",
  blueSoft:     "#e8f0ff",
  blueGrad:     "linear-gradient(90deg, #bbd2ff 0%, #2484ff 100%)",
  text1:        "#0f172a",
  text2:        "#475569",
  text3:        "#94a3b8",
  green:        "#16a34a",
  greenSoft:    "#dcfce7",
  orange:       "#d97706",
  orangeSoft:   "#fef3c7",
  red:          "#dc2626",
  redSoft:      "#fee2e2",
  purple:       "#7c3aed",
  purpleSoft:   "#ede9fe",
  radius:       "16px",
  radiusSm:     "10px",
  shadow:       "0 2px 16px rgba(36,132,255,0.07), 0 1px 4px rgba(0,0,0,0.05)",
  font:         "'Poppins', sans-serif",
};

const statusConfig = {
  PENDING:   { color: t.orange,  bg: t.orangeSoft,  dot: "#f59e0b", label: "Pending"   },
  PAID:      { color: t.blue,    bg: t.blueSoft,    dot: t.blue,    label: "Paid"      },
  SHIPPED:   { color: t.purple,  bg: t.purpleSoft,  dot: t.purple,  label: "Shipped"   },
  DELIVERED: { color: t.green,   bg: t.greenSoft,   dot: t.green,   label: "Delivered" },
  CANCELLED: { color: t.red,     bg: t.redSoft,     dot: t.red,     label: "Cancelled" },
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function resolveImgUrl(url) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/assets/") || url.startsWith("assets/")) {
    return url.split("/").map((seg) => encodeURIComponent(seg)).join("/");
  }
  return url;
}

function Fonts() {
  return <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');`}</style>;
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
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(10, 15, 30, 0.82)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "lbFadeIn 0.22s ease",
        padding: "1.5rem",
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 18, right: 18,
          width: 38, height: 38, borderRadius: "50%",
          border: "none", cursor: "pointer",
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(6px)",
          color: "#fff", fontSize: "1.2rem",
          display: "flex", alignItems: "center", justifyContent: "center",
          lineHeight: 1, transition: "background 0.18s",
          zIndex: 10000,
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.28)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
        aria-label="Close"
      >
        ✕
      </button>
      <img
        src={src}
        alt={alt || "Product"}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: "90vw", maxHeight: "85vh",
          borderRadius: 16,
          boxShadow: "0 32px 80px rgba(0,0,0,0.55)",
          objectFit: "contain",
          animation: "lbScaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          cursor: "default",
          userSelect: "none",
        }}
      />
    </div>
  );
}

/* ─── Badge ──────────────────────────────────────────────────────────────── */
function Badge({ status }) {
  const cfg = statusConfig[status] || { color: t.text2, bg: "#f1f5f9", dot: t.text3, label: status };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 999,
      fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.04em",
      textTransform: "uppercase", fontFamily: t.font,
      color: cfg.color, background: cfg.bg,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: t.surface, borderRadius: t.radius,
      border: `1px solid ${t.border}`, boxShadow: t.shadow,
      overflow: "hidden", ...style,
    }}>
      {children}
    </div>
  );
}

function Sk({ w = "100%", h = 14, r = 6, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: "linear-gradient(90deg,#eef2ff 25%,#dde6ff 50%,#eef2ff 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite",
      ...style,
    }} />
  );
}

/* ─── Product thumbnail — clickable, opens lightbox ─────────────────────── */
function ProductThumb({ url, name, onExpand }) {
  const [err, setErr] = useState(false);
  const src = resolveImgUrl(url);

  if (!src || err) {
    return (
      <div style={{
        width: 72, height: 72, borderRadius: 12, flexShrink: 0,
        background: "linear-gradient(135deg,#e8f0ff,#f0f4ff)",
        border: `1px solid ${t.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.6rem",
      }}>
        🧺
      </div>
    );
  }

  return (
    <div
      onClick={() => onExpand(src, name)}
      style={{
        position: "relative", width: 72, height: 72,
        borderRadius: 12, flexShrink: 0, cursor: "zoom-in",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(36,132,255,0.13)",
        border: `1.5px solid ${t.border}`,
        transition: "transform 0.18s, box-shadow 0.18s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "scale(1.06)";
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(36,132,255,0.22)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(36,132,255,0.13)";
      }}
      title="Click to expand"
    >
      <img
        src={src}
        alt={name || "Product"}
        onError={() => setErr(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", userSelect: "none" }}
      />
    </div>
  );
}

/* ─── Stylesheet ─────────────────────────────────────────────────────────── */
const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes shimmer   { to { background-position: -200% 0; } }
  @keyframes fadeUp    { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes stepPop   { from { transform:scale(0.6); opacity:0; } to { transform:scale(1); opacity:1; } }
  @keyframes lbFadeIn  { from { opacity:0; } to { opacity:1; } }
  @keyframes lbScaleIn { from { opacity:0; transform:scale(0.82); } to { opacity:1; transform:scale(1); } }

  .ol-page {
    min-height: 100vh; background: ${t.bg};
    padding: 2.5rem 1.25rem 5rem;
    font-family: ${t.font}; color: ${t.text1};
    animation: fadeUp 0.38s ease both;
  }
  .ol-wrap { max-width: 960px; margin: 0 auto; }

  .ol-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem; }
  .ol-eyebrow { display: block; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: ${t.blue}; margin-bottom: 0.3rem; }
  .ol-title { font-size: clamp(1.6rem,4vw,2.2rem); font-weight: 700; line-height: 1.15; color: ${t.text1}; }
  .ol-sub   { color: ${t.text2}; font-size: 0.875rem; margin-top: 0.3rem; }
  .ol-count-pill { background: ${t.blueSoft}; color: ${t.blue}; padding: 0.35rem 0.9rem; border-radius: 999px; font-size: 0.78rem; font-weight: 600; white-space: nowrap; align-self: flex-start; margin-top: 0.4rem; }

  .ol-error { background: ${t.redSoft}; color: ${t.red}; border-radius: ${t.radiusSm}; padding: 0.8rem 1.1rem; font-size: 0.875rem; margin-bottom: 1.25rem; }
  .ol-empty { text-align: center; padding: 4rem 2rem; }
  .ol-empty-icon  { font-size: 2.8rem; margin-bottom: 0.9rem; }
  .ol-empty-title { font-weight: 600; font-size: 1rem; color: ${t.text1}; margin-bottom: 0.35rem; }
  .ol-empty-sub   { color: ${t.text2}; font-size: 0.875rem; }

  .sk-row { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.4rem; border-bottom: 1px solid ${t.border}; }
  .sk-row:last-child { border-bottom: none; }

  .dt-table-wrap { overflow-x: auto; }
  .dt-table { width: 100%; border-collapse: collapse; font-family: ${t.font}; }
  .dt-table thead th { padding: 0.8rem 1.4rem; text-align: left; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: ${t.text3}; border-bottom: 1px solid ${t.border}; white-space: nowrap; background: ${t.surfaceHover}; }
  .dt-row { transition: background 0.15s; }
  .dt-row:hover { background: ${t.surfaceHover}; }
  .dt-table tbody td { padding: 0.95rem 1.4rem; font-size: 0.875rem; vertical-align: middle; }
  .dt-id     { font-weight: 700; color: ${t.blue}; }
  .dt-muted  { color: ${t.text2}; }
  .dt-amount { font-weight: 600; color: ${t.text1}; }
  .nowrap    { white-space: nowrap; }
  .dt-link   { color: ${t.blue}; text-decoration: none; font-size: 0.8rem; font-weight: 600; transition: opacity 0.15s; }
  .dt-link:hover { opacity: 0.7; }

  .mb-list { display: none; }
  .mb-row  { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1.1rem 1.25rem; transition: background 0.15s; }
  .mb-row:hover { background: ${t.surfaceHover}; }
  .mb-top  { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.3rem; }
  .mb-meta   { font-size: 0.78rem; color: ${t.text2}; }
  .mb-amount { font-size: 1rem; font-weight: 700; color: ${t.text1}; margin-bottom: 0.3rem; }

  .pg-footer { padding: 1rem 1.4rem; border-top: 1px solid ${t.border}; background: ${t.surfaceHover}; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
  .pg-info    { font-size: 0.78rem; color: ${t.text2}; }
  .pg-btns    { display: flex; align-items: center; gap: 0.35rem; }
  .pg-current { padding: 0 0.4rem; font-size: 0.8rem; color: ${t.text2}; }

  .button { font-family: "Poppins", sans-serif; display: inline-flex; align-items: center; justify-content: center; padding: 10px 25px; border: 0; border-radius: 10rem; transition: all 0.15s; font-size: 16px; font-weight: 500; cursor: pointer; background: linear-gradient(90deg, rgba(187,210,255,1) 0%, rgba(36,132,255,1) 100%); color: #fff; box-shadow: 0 0px 7px -5px rgba(0,0,0,0.5); }
  .button:disabled { opacity: 0.55; cursor: not-allowed; }
  .button:hover:not(:disabled) { box-shadow: 0 4px 18px rgba(36,132,255,0.3); transform: translateY(-1px); }

  .button-1 { font-family: "Poppins", sans-serif; display: inline-flex; align-items: center; justify-content: center; padding: 10px 25px; border: 1px solid ${t.border}; border-radius: 10rem; transition: all 0.15s; font-size: 16px; font-weight: 500; cursor: pointer; background: ${t.surface}; color: ${t.text2}; box-shadow: 0 0px 7px -5px rgba(0,0,0,0.5); }
  .button-1:hover:not(:disabled) { border-color: ${t.blue}; color: ${t.blue}; background: ${t.blueSoft}; }
  .button-1:disabled { opacity: 0.38; cursor: not-allowed; }
  .pg-btn { font-size: 0.82rem !important; padding: 6px 14px !important; }

  .back-link { display: inline-flex; align-items: center; gap: 5px; color: ${t.text2}; text-decoration: none; font-size: 0.82rem; font-weight: 500; transition: color 0.15s; margin-bottom: 1.5rem; }
  .back-link:hover { color: ${t.blue}; }
  .od-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.75rem; }
  .od-title { font-size: clamp(1.4rem,4vw,2.1rem); font-weight: 700; line-height: 1.15; }
  .od-id    { color: ${t.blue}; }
  .od-grid  { display: grid; grid-template-columns: repeat(auto-fit,minmax(210px,1fr)); gap: 1rem; margin-bottom: 1.25rem; }
  .section-label { font-size: 0.67rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: ${t.text3}; margin-bottom: 0.55rem; }

  .track-row    { display: flex; align-items: center; overflow-x: auto; padding: 0.6rem 0 0.3rem; }
  .track-node   { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; min-width: 64px; }
  .track-circle { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.05rem; font-weight: 700; transition: all 0.3s; flex-shrink: 0; }
  .track-active { background: linear-gradient(90deg, #bbd2ff 0%, #2484ff 100%); color: #fff; box-shadow: 0 4px 16px rgba(36,132,255,0.35); animation: stepPop 0.35s ease both; }
  .track-done   { background: ${t.blueSoft}; color: ${t.blue}; border: 2px solid ${t.borderHover}; animation: stepPop 0.3s ease both; }
  .track-idle   { background: #f1f5f9; color: ${t.text3}; border: 2px solid ${t.border}; }
  .track-label  { font-size: 0.7rem; font-weight: 500; text-align: center; white-space: nowrap; }
  .tl-done { color: ${t.text1}; font-weight: 600; }
  .tl-idle { color: ${t.text3}; }
  .track-line { flex: 1; min-width: 28px; max-width: 72px; height: 3px; margin: 0 0.25rem; margin-bottom: 1.4rem; border-radius: 2px; }
  .tl-filled { background: linear-gradient(90deg, #bbd2ff 0%, #2484ff 100%); }
  .tl-empty  { background: ${t.border}; }

  .items-head { padding: 1.1rem 1.4rem; border-bottom: 1px solid ${t.border}; background: ${t.surfaceHover}; display: flex; align-items: center; gap: 0.75rem; }
  .items-count { background: ${t.blueSoft}; color: ${t.blue}; font-size: 0.72rem; font-weight: 600; padding: 2px 9px; border-radius: 999px; }
  .total-bar { padding: 1rem 1.4rem; border-top: 1px solid ${t.border}; background: ${t.surfaceHover}; display: flex; justify-content: flex-end; align-items: center; gap: 1.5rem; }
  .total-amount { font-size: 1.2rem; font-weight: 700; color: ${t.blue}; }

  .item-row { display: flex; align-items: center; gap: 1.1rem; padding: 1.1rem 1.4rem; transition: background 0.15s; }
  .item-row:hover { background: ${t.surfaceHover}; }
  .item-info  { flex: 1; min-width: 0; }
  .item-name  { font-weight: 500; font-size: 0.9rem; color: ${t.text1}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .item-meta  { font-size: 0.78rem; color: ${t.text2}; margin-top: 2px; }
  .item-price { text-align: right; flex-shrink: 0; }
  .item-unit  { font-size: 0.75rem; color: ${t.text3}; }
  .item-total { font-weight: 600; font-size: 0.95rem; color: ${t.text1}; }

  /* Pending payment warning */
  .pending-warning {
    display: flex; align-items: flex-start; gap: 0.85rem;
    background: linear-gradient(135deg, #fffbeb, #fef3c7);
    border: 1.5px solid #fcd34d; border-radius: 16px;
    padding: 1.1rem 1.3rem; margin-bottom: 1.25rem;
    animation: fadeUp 0.35s ease both;
  }
  .pending-warning-icon  { font-size: 1.4rem; flex-shrink: 0; line-height: 1; margin-top: 1px; }
  .pending-warning-body  { flex: 1; min-width: 0; }
  .pending-warning-title { font-size: 0.88rem; font-weight: 700; color: #92400e; margin-bottom: 0.2rem; }
  .pending-warning-text  { font-size: 0.8rem; color: #a16207; line-height: 1.55; }

  .pay-now-btn {
    font-family: "Poppins", sans-serif; display: inline-flex; align-items: center;
    justify-content: center; gap: 0.45rem; padding: 10px 25px; border: 0;
    border-radius: 10rem; font-size: 16px; font-weight: 500; cursor: pointer;
    background: linear-gradient(90deg, #f59e0b 0%, #f97316 100%); color: #fff;
    box-shadow: 0 4px 18px rgba(245,158,11,0.35);
    transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s; white-space: nowrap;
  }
  .pay-now-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(245,158,11,0.45); }
  .pay-now-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  @media (max-width: 680px) {
    .ol-page { padding: 1.5rem 0.875rem 4rem; }
    .dt-table-wrap { display: none; }
    .mb-list { display: block; }
    .hide-sm { display: none !important; }
    .od-header { flex-direction: column; }
    .button { width: 100%; font-size: 14px; padding: 10px 18px; }
    .pay-now-btn { width: 100%; font-size: 14px; }
    .track-node { min-width: 54px; }
    .track-circle { width: 38px; height: 38px; font-size: 0.9rem; }
    .item-row { gap: 0.75rem; padding: 0.9rem 1rem; }
  }
`;

/* ═══════════════════════════════════════════════════════════════════════════
   ORDERS LIST
═══════════════════════════════════════════════════════════════════════════ */
export function OrdersList() {
  const [orders, setOrders]             = useState([]);
  const [pagination, setPagination]     = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);

  useEffect(() => {
    setLoading(true);
    ordersApi.list({ page, limit: 20 })
      .then(res => { setOrders(res.orders); setPagination(res.pagination); })
      .catch(err => setError(err?.data?.message || err?.message || "Failed to load orders"))
      .finally(() => setLoading(false));
  }, [page]);

  const setPage = p => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(p));
    setSearchParams(next);
  };
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <>
      <Fonts />
      <style>{css}</style>
      <div className="ol-page">
        <div className="ol-wrap">
          <div className="ol-header">
            <div>
              <span className="ol-eyebrow">Account</span>
              <h1 className="ol-title">My Orders</h1>
              <p className="ol-sub">Track purchases and download invoices</p>
            </div>
            {!loading && orders.length > 0 && (
              <div className="ol-count-pill">{pagination.total} order{pagination.total !== 1 ? "s" : ""}</div>
            )}
          </div>

          {error && <div className="ol-error">⚠ {error}</div>}

          {loading ? (
            <Card>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="sk-row">
                  <Sk w={48} h={13} /><Sk w={90} h={13} /><Sk w={110} h={13} style={{ flex: 1 }} />
                  <Sk w={72} h={22} r={999} /><Sk w={76} h={13} /><Sk w={80} h={13} r={8} />
                </div>
              ))}
            </Card>
          ) : orders.length === 0 ? (
            <Card>
              <div className="ol-empty">
                <div className="ol-empty-icon">📦</div>
                <p className="ol-empty-title">No orders yet</p>
                <p className="ol-empty-sub">Your purchases will appear here once you place an order.</p>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="dt-table-wrap">
                <table className="dt-table">
                  <thead>
                    <tr><th>Order</th><th>Date</th><th>Location</th><th>Status</th><th>Amount</th><th></th></tr>
                  </thead>
                  <tbody>
                    {orders.map((o, i) => (
                      <tr key={o.id} className="dt-row" style={{ borderBottom: i < orders.length - 1 ? `1px solid ${t.border}` : "none" }}>
                        <td className="dt-id">#{o.id}</td>
                        <td className="dt-muted nowrap">{new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                        <td className="dt-muted">{o.city ? `${o.city}${o.state ? ", " + o.state : ""}` : "—"}</td>
                        <td><Badge status={o.status} /></td>
                        <td className="dt-amount nowrap">Rs.{Number(o.total_amount).toLocaleString("en-IN")}</td>
                        <td><Link to={`/orders/${o.id}`} className="dt-link">View details →</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mb-list">
                {orders.map((o, i) => (
                  <div key={o.id} className="mb-row" style={{ borderBottom: i < orders.length - 1 ? `1px solid ${t.border}` : "none" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="mb-top"><span className="dt-id">#{o.id}</span><Badge status={o.status} /></div>
                      <p className="mb-meta">
                        {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        {o.city && <> · {o.city}{o.state ? `, ${o.state}` : ""}</>}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p className="mb-amount">Rs.{Number(o.total_amount).toLocaleString("en-IN")}</p>
                      <Link to={`/orders/${o.id}`} className="dt-link">View →</Link>
                    </div>
                  </div>
                ))}
              </div>
              {pagination.total > pagination.limit && (
                <div className="pg-footer">
                  <span className="pg-info">Page {pagination.page} of {totalPages} · {pagination.total} orders</span>
                  <div className="pg-btns">
                    <button className="button-1 pg-btn" disabled={pagination.page <= 1} onClick={() => setPage(1)}>«</button>
                    <button className="button-1 pg-btn" disabled={pagination.page <= 1} onClick={() => setPage(pagination.page - 1)}>Prev</button>
                    <span className="pg-current">{pagination.page} / {totalPages}</span>
                    <button className="button-1 pg-btn" disabled={pagination.page >= totalPages} onClick={() => setPage(pagination.page + 1)}>Next</button>
                    <button className="button-1 pg-btn" disabled={pagination.page >= totalPages} onClick={() => setPage(totalPages)}>»</button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ORDER DETAIL
═══════════════════════════════════════════════════════════════════════════ */
export function OrderDetail() {
  const { id }                        = useParams();
  const [order, setOrder]             = useState(null);
  const [items, setItems]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [dlLoading, setDlLoading]     = useState(false);
  const [payLoading, setPayLoading]   = useState(false);   // ← fixed: was missing
  const [lightbox, setLightbox]       = useState(null);

  const openLightbox  = useCallback((src, alt) => setLightbox({ src, alt }), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    if (!id) return;
    ordersApi.get(id)
      .then(res => { setOrder(res.order); setItems(res.items || []); })
      .catch(err => setError(err?.data?.message || err?.message || "Failed to load order"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownloadInvoice = async () => {
    const token = localStorage.getItem("authToken");
    if (!id || !token) return;
    setDlLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${id}/invoice`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `invoice-${id}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch { /* ignore */ }
    finally { setDlLoading(false); }
  };

  const handlePayNow = async () => {
    const token = localStorage.getItem("authToken");
    if (!order || !token) return;
    setPayLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${order.id}/initiate-payment`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to initiate payment");
      const data = await res.json();
      const options = {
        key:         data.key_id,
        amount:      data.amount,
        currency:    data.currency || "INR",
        name:        "COE Handicrafts",
        description: `Order #${order.id}`,
        order_id:    data.razorpay_order_id,
        handler: async (response) => {
          await fetch(`${API_BASE_URL}/api/orders/${order.id}/verify-payment`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            }),
          });
          const updated = await ordersApi.get(order.id);
          setOrder(updated.order);
          setItems(updated.items || []);
        },
        prefill: {
          name:    order.customer_name  || "",
          email:   order.customer_email || "",
          contact: order.phone          || "",
        },
        theme: { color: "#2484ff" },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Pay now failed:", err);
    } finally {
      setPayLoading(false);
    }
  };

  const STEPS   = [{ label: "Placed", emoji: "📋" }, { label: "Paid", emoji: "💳" }, { label: "Shipped", emoji: "🚚" }, { label: "Delivered", emoji: "🎉" }];
  const stepMap = { PENDING: 0, PAID: 1, SHIPPED: 2, DELIVERED: 3, CANCELLED: -1 };
  const curStep   = order ? (stepMap[order.status] ?? 0) : 0;
  const cancelled = order?.status === "CANCELLED";

  if (loading) return (
    <><Fonts /><style>{css}</style>
    <div className="ol-page"><div className="ol-wrap" style={{ maxWidth: 1000 }}>
      <Sk w={100} h={13} style={{ marginBottom: "1.5rem" }} />
      <Sk w={220} h={36} r={10} style={{ marginBottom: "0.5rem" }} />
      <Sk w={160} h={13} style={{ marginBottom: "2rem" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "1rem", marginBottom: "1rem" }}>
        {[...Array(3)].map((_, i) => <Sk key={i} h={110} r={16} />)}
      </div>
      <Sk h={200} r={16} />
    </div></div></>
  );

  if (error && !order) return (
    <><Fonts /><style>{css}</style>
    <div className="ol-page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="ol-error">{error}</div>
    </div></>
  );

  if (!order) return null;

  return (
    <>
      <Fonts />
      <style>{css}</style>

      {lightbox && <ImageLightbox src={lightbox.src} alt={lightbox.alt} onClose={closeLightbox} />}

      <div className="ol-page">
        <div className="ol-wrap" style={{ maxWidth: 1000 }}>
          <Link to="/orders" className="back-link">← Back to orders</Link>

          {/* Pending payment warning */}
          {order.status === "PENDING" && (
            <div className="pending-warning">
              <span className="pending-warning-icon">⚠️</span>
              <div className="pending-warning-body">
                <p className="pending-warning-title">Payment Pending — Action Required</p>
                <p className="pending-warning-text">
                  This order has not been paid yet. Please complete your payment within{" "}
                  <strong>2 days</strong> of placing the order — unpaid orders are
                  automatically cancelled after that.
                </p>
              </div>
            </div>
          )}

          <div className="od-header">
            <div>
              <h1 className="od-title">Order <span className="od-id">#{order.id}</span></h1>
              <p className="ol-sub">
                Placed on {new Date(order.created_at).toLocaleString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {order.status === "PENDING" && (
                <button className="pay-now-btn" onClick={handlePayNow} disabled={payLoading}>
                  {payLoading ? "Opening..." : "💳 Pay Now"}
                </button>
              )}
              <button className="button" onClick={handleDownloadInvoice} disabled={dlLoading}>
                {dlLoading ? "Preparing..." : "⬇ Download Invoice"}
              </button>
            </div>
          </div>

          {/* Tracking */}
          <Card style={{ marginBottom: "1.25rem", padding: "1.5rem 1.75rem" }}>
            <p className="section-label">Delivery Status</p>
            {cancelled ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0" }}>
                <span style={{ fontSize: "1.3rem" }}>🚫</span>
                <span style={{ color: t.red, fontWeight: 600, fontSize: "0.9rem" }}>This order was cancelled.</span>
              </div>
            ) : (
              <div className="track-row">
                {STEPS.map((step, idx) => {
                  const done = idx <= curStep, active = idx === curStep, isLast = idx === STEPS.length - 1;
                  return (
                    <React.Fragment key={step.label}>
                      <div className="track-node">
                        <div className={`track-circle ${active ? "track-active" : done ? "track-done" : "track-idle"}`} style={{ animationDelay: `${idx * 0.09}s` }}>
                          {done ? (active ? step.emoji : "✓") : <span style={{ fontSize: "0.7rem", color: t.text3 }}>{idx + 1}</span>}
                        </div>
                        <span className={`track-label ${done ? "tl-done" : "tl-idle"}`}>{step.label}</span>
                      </div>
                      {!isLast && <div className={`track-line ${idx < curStep ? "tl-filled" : "tl-empty"}`} />}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Info grid */}
          <div className="od-grid">
            <Card style={{ padding: "1.4rem" }}>
              <p className="section-label">Customer</p>
              <p style={{ fontWeight: 600, marginBottom: "0.2rem" }}>{order.customer_name}</p>
              <p style={{ color: t.text2, fontSize: "0.82rem", wordBreak: "break-word" }}>{order.customer_email}</p>
              {order.phone && <p style={{ color: t.text2, fontSize: "0.82rem", marginTop: "0.15rem" }}>{order.phone}</p>}
            </Card>
            <Card style={{ padding: "1.4rem" }}>
              <p className="section-label">Shipping Address</p>
              <p style={{ fontSize: "0.84rem", lineHeight: 1.75, color: t.text1 }}>
                {order.line1}<br />
                {order.line2 && <>{order.line2}<br /></>}
                {order.city}, {order.state} {order.pincode}<br />
                {order.country}
              </p>
            </Card>
            <Card style={{ padding: "1.4rem" }}>
              <p className="section-label">Summary</p>
              <Badge status={order.status} />
              <p style={{ fontSize: "0.82rem", color: t.text2, marginTop: "0.6rem" }}>
                Payment: <strong style={{ color: t.text1, fontWeight: 500 }}>{order.payment_status}</strong>
              </p>
              <p style={{ fontSize: "1.15rem", fontWeight: 700, color: t.blue, marginTop: "0.5rem" }}>
                Rs.{Number(order.total_amount).toLocaleString("en-IN")}
              </p>
            </Card>
          </div>

          {/* Items */}
          <Card>
            <div className="items-head">
              <p className="section-label" style={{ margin: 0 }}>Order Items</p>
              <span className="items-count">{items.length} item{items.length !== 1 ? "s" : ""}</span>
            </div>
            {items.map((row, i) => (
              <div key={row.id} className="item-row" style={{ borderBottom: i < items.length - 1 ? `1px solid ${t.border}` : "none" }}>
                <ProductThumb
                  url={row.thumbnail_url || row.product_thumbnail || null}
                  name={row.product_name}
                  onExpand={openLightbox}
                />
                <div className="item-info">
                  <p className="item-name">{row.product_name}</p>
                  <p className="item-meta">Qty: {row.quantity}</p>
                </div>
                <div className="item-price">
                  <p className="item-unit">Rs.{Number(row.unit_price).toLocaleString("en-IN")} each</p>
                  <p className="item-total">Rs.{Number(row.line_total).toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))}
            <div className="total-bar">
              <span style={{ color: t.text2, fontSize: "0.85rem" }}>Order Total</span>
              <span className="total-amount">Rs.{Number(order.total_amount).toLocaleString("en-IN")}</span>
            </div>
          </Card>

        </div>
      </div>
    </>
  );
}

export default OrdersList;