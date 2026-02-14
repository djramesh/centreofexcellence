import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { HiHome, HiViewGrid, HiShoppingBag, HiShoppingCart, HiUser } from "react-icons/hi";
import "./BottomNav.css";

const BottomNav = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { getCartItemCount } = useCart();
  const cartCount = getCartItemCount();

  const navItems = [
    { path: "/", icon: HiHome, label: "Home" },
    { path: "/products", icon: HiViewGrid, label: "Category" },
    ...(isAuthenticated
      ? [
          { path: "/orders", icon: HiShoppingBag, label: "Orders" },
          { path: "/cart", icon: HiShoppingCart, label: "Cart" },
          { path: "/account", icon: HiUser, label: "Account" },
        ]
      : [
          { path: "/login", icon: HiUser, label: "Account" },
        ]),
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        const isCart = item.path === "/cart";
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`bottom-nav-item ${isActive ? "active" : ""}`}
          >
            <div className="bottom-nav-icon-wrapper">
              <Icon className="bottom-nav-icon" />
              {isCart && cartCount > 0 && (
                <span className="cart-badge">{cartCount}</span>
              )}
            </div>
            <span className="bottom-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
