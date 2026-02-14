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
  PENDING: "#94a3b8",
  PAID: "#3b82f6",
  SHIPPED: "#8b5cf6",
  DELIVERED: "#22c55e",
  CANCELLED: "#ef4444",
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .getDashboard()
      .then(setData)
      .catch((err) => setError(err?.data?.message || err?.message || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="admin-page admin-dashboard">
        <div className="admin-loading">Loading dashboard…</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="admin-page admin-dashboard">
        <div className="admin-error">{error}</div>
      </div>
    );
  }
  if (!data) return null;

  const { stats, ordersByStatus, ordersLast7Days, revenueByMonth, lowStock, recentOrders } = data;
  const pieData = ordersByStatus?.map((o) => ({ name: o.status, value: o.count, color: STATUS_COLORS[o.status] || "#64748b" })) || [];
  const barData = revenueByMonth?.map((r) => ({ month: r.month, revenue: Number(r.revenue) })) || [];

  return (
    <div className="admin-page admin-dashboard">
      <header className="admin-page-header">
        <h1>Dashboard</h1>
        <p>Overview of your store</p>
      </header>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-label">Total Orders</span>
          <span className="admin-stat-value">{stats.totalOrders}</span>
        </div>
        <div className="admin-stat-card highlight">
          <span className="admin-stat-label">Revenue (Paid)</span>
          <span className="admin-stat-value">₹{Number(stats.totalRevenue).toLocaleString("en-IN")}</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Products</span>
          <span className="admin-stat-value">{stats.totalProducts}</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Customers</span>
          <span className="admin-stat-value">{stats.totalUsers}</span>
        </div>
      </div>

      <div className="admin-charts-row">
        <div className="admin-chart-card">
          <h3>Orders by status</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => name + ": " + value}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v, "Orders"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="admin-chart-empty">No orders yet</p>
          )}
        </div>
        <div className="admin-chart-card">
          <h3>Revenue by month</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => "₹" + (v / 1000) + "k"} />
                <Tooltip formatter={(v) => ["₹" + Number(v).toLocaleString("en-IN"), "Revenue"]} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="admin-chart-empty">No revenue data yet</p>
          )}
        </div>
      </div>

      <div className="admin-charts-row">
        <div className="admin-chart-card full">
          <h3>Orders (last 7 days)</h3>
          {ordersLast7Days?.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={ordersLast7Days} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOrders)" name="Orders" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="admin-chart-empty">No orders in last 7 days</p>
          )}
        </div>
      </div>

      <div className="admin-tables-row">
        <div className="admin-table-card">
          <div className="admin-table-header">
            <h3>Low stock (≤10)</h3>
            <Link to="/admin/products" className="admin-link">View all</Link>
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
                    <td><span className={p.stock === 0 ? "out-of-stock" : ""}>{p.stock}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="admin-table-empty">No low stock items</p>
          )}
        </div>
        <div className="admin-table-card">
          <div className="admin-table-header">
            <h3>Recent orders</h3>
            <Link to="/admin/orders" className="admin-link">View all</Link>
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
                    <td><Link to={"/admin/orders/" + o.id} className="admin-link">#{o.id}</Link></td>
                    <td>{o.customer_name}</td>
                    <td>₹{Number(o.total_amount).toLocaleString("en-IN")}</td>
                    <td><span className="admin-badge" data-status={o.status}>{o.status}</span></td>
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
