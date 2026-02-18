import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { adminApi } from "../../api/admin.js";
import "./AdminDashboard.css";

const STATUS_COLORS = {
  PENDING:   "#f59e0b",
  PAID:      "#2484ff",
  SHIPPED:   "#8b5cf6",
  DELIVERED: "#22c55e",
  CANCELLED: "#ef4444",
};

/* ── tiny SVG icons ─────────────────────────────────────────── */
const IconOrders = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
  </svg>
);
const IconRevenue = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
const IconProducts = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);
const IconCustomers = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </svg>
);

/* ── Custom tooltip ─────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label, prefix = "" }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: "#0f172a",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "10px",
        padding: "10px 14px",
        fontSize: "0.82rem",
        color: "#fff",
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
      }}>
        <p style={{ margin: "0 0 4px", color: "#94a3b8", fontSize: "0.72rem" }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ margin: 0, fontWeight: 600, color: "#fff" }}>
            {prefix}{typeof p.value === "number" ? p.value.toLocaleString("en-IN") : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    adminApi
      .getDashboard()
      .then(setData)
      .catch((err) => setError(err?.data?.message || err?.message || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="admin-page admin-dashboard">
      <div className="admin-loading">Loading dashboard…</div>
    </div>
  );
  if (error) return (
    <div className="admin-page admin-dashboard">
      <div className="admin-error">{error}</div>
    </div>
  );
  if (!data) return null;

  const { stats, ordersByStatus, ordersLast7Days, revenueByMonth, lowStock, recentOrders } = data;

  const pieData = ordersByStatus?.map((o) => ({
    name: o.status,
    value: o.count,
    color: STATUS_COLORS[o.status] || "#64748b",
  })) || [];

  const barData = revenueByMonth?.map((r) => ({
    month: r.month,
    revenue: Number(r.revenue),
  })) || [];

  return (
    <div className="admin-page admin-dashboard">

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="admin-page-header">
        <div className="admin-page-header-text">
          <h1>Dashboard</h1>
          <p>Welcome back — here's what's happening today</p>
        </div>
      </header>

      {/* ── Stat cards ──────────────────────────────────────── */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon"><IconOrders /></div>
          <span className="admin-stat-label">Total Orders</span>
          <span className="admin-stat-value">{stats.totalOrders}</span>
        </div>
        <div className="admin-stat-card highlight">
          <div className="admin-stat-icon"><IconRevenue /></div>
          <span className="admin-stat-label">Revenue (Paid)</span>
          <span className="admin-stat-value">₹{Number(stats.totalRevenue).toLocaleString("en-IN")}</span>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon"><IconProducts /></div>
          <span className="admin-stat-label">Products</span>
          <span className="admin-stat-value">{stats.totalProducts}</span>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon"><IconCustomers /></div>
          <span className="admin-stat-label">Customers</span>
          <span className="admin-stat-value">{stats.totalUsers}</span>
        </div>
      </div>

      {/* ── Charts row 1 ────────────────────────────────────── */}
      <div className="admin-charts-row">
        <div className="admin-chart-card">
          <h3>Orders by Status</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={68} outerRadius={108}
                  paddingAngle={3}
                  dataKey="value" nameKey="name"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div style={{
                        background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "10px", padding: "10px 14px",
                        fontSize: "0.82rem", color: "#fff",
                      }}>
                        <p style={{ margin: 0, fontWeight: 600 }}>{payload[0].name}: {payload[0].value}</p>
                      </div>
                    ) : null
                  }
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => (
                    <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 500 }}>{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="admin-chart-empty">No orders yet</p>
          )}
        </div>

        <div className="admin-chart-card">
          <h3>Revenue by Month</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#2484ff" stopOpacity={1} />
                    <stop offset="100%" stopColor="#00d4ff" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => "₹" + (v / 1000) + "k"} />
                <Tooltip content={<CustomTooltip prefix="₹" />} cursor={{ fill: "rgba(36,132,255,0.05)" }} />
                <Bar dataKey="revenue" fill="url(#barGrad)" radius={[6, 6, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="admin-chart-empty">No revenue data yet</p>
          )}
        </div>
      </div>

      {/* ── Charts row 2 ────────────────────────────────────── */}
      <div className="admin-charts-row">
        <div className="admin-chart-card full">
          <h3>Orders — Last 7 Days</h3>
          {ordersLast7Days?.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={ordersLast7Days} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2484ff" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2484ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="areaLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor="#00d4ff" />
                    <stop offset="100%" stopColor="#2484ff" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(36,132,255,0.2)", strokeWidth: 1 }} />
                <Area
                  type="monotone" dataKey="count"
                  stroke="url(#areaLine)" strokeWidth={2.5}
                  fill="url(#areaGrad)" name="Orders"
                  dot={{ r: 4, fill: "#2484ff", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, fill: "#2484ff", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="admin-chart-empty">No orders in last 7 days</p>
          )}
        </div>
      </div>

      {/* ── Tables row ──────────────────────────────────────── */}
      <div className="admin-tables-row">
        <div className="admin-table-card">
          <div className="admin-table-header">
            <h3>Low Stock ≤ 10</h3>
            <Link to="/admin/products" className="admin-link">View all →</Link>
          </div>
          {lowStock?.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>
                      <span className={p.stock === 0 ? "out-of-stock" : ""}>
                        {p.stock === 0 ? "Out of stock" : p.stock}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="admin-table-empty">✓ All products are well-stocked</p>
          )}
        </div>

        <div className="admin-table-card">
          <div className="admin-table-header">
            <h3>Recent Orders</h3>
            <Link to="/admin/orders" className="admin-link">View all →</Link>
          </div>
          {recentOrders?.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link to={"/admin/orders/" + o.id} className="admin-link">#{o.id}</Link>
                    </td>
                    <td>{o.customer_name}</td>
                    <td>₹{Number(o.total_amount).toLocaleString("en-IN")}</td>
                    <td>
                      <span className="admin-badge" data-status={o.status}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="admin-table-empty">No orders yet</p>
          )}
        </div>
      </div>

    </div>
  );
}