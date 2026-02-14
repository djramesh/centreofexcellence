import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  HiOutlineChartBar,
  HiOutlineShoppingBag,
  HiOutlineCube,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineHome,
} from "react-icons/hi";
import "./AdminLayout.css";

const navItems = [
  { to: "/admin", end: true, icon: HiOutlineChartBar, label: "Dashboard" },
  { to: "/admin/orders", end: false, icon: HiOutlineShoppingBag, label: "Orders" },
  { to: "/admin/products", end: false, icon: HiOutlineCube, label: "Products" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-sidebar-header">
          <span className="admin-logo">COE Admin</span>
          <button
            type="button"
            className="admin-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <HiOutlineX />
          </button>
        </div>
        <nav className="admin-nav">
          {navItems.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="admin-nav-icon" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <a href="/" className="admin-nav-link" target="_blank" rel="noopener noreferrer">
            <HiOutlineHome className="admin-nav-icon" />
            <span>View Store</span>
          </a>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <button
            type="button"
            className="admin-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <HiOutlineMenu />
          </button>
          <div className="admin-header-right">
            <span className="admin-user-name">{user?.name || "Admin"}</span>
            <button type="button" className="admin-logout-btn" onClick={handleLogout}>
              <HiOutlineLogout />
              <span>Logout</span>
            </button>
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="admin-overlay"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Close overlay"
        />
      )}
    </div>
  );
}
