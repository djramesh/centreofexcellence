import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { FaUserCircle, FaSignOutAlt, FaShoppingCart, FaClipboardList } from "react-icons/fa";
import "./Navbar.css";
import "./Common.css";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { getCartItemCount } = useCart();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const navigate = useNavigate();

  const handleOrderClick = () => {
    navigate("/products");
    window.scrollTo(0, 0);
  };

  return (
    <nav className="navbar">
      <div className="logo">
        <li>
          <Link to="/">
            <img src="./assets/ph-logo.png" alt="CoE" className="ph-logo" />
          </Link>
        </li>
      </div>
      <ul className={`nav-links ${isMenuOpen ? "active" : ""}`}>
        <li>
          <Link to="/" onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>
        </li>

        <li className="dropdown">
          <Link
            to="/"
            onClick={(e) => {
              e.preventDefault();
              toggleDropdown();
              setIsMenuOpen(true);
            }}
          >
            About us <i className="bi bi-chevron-down ms-1"></i>
          </Link>
          <div
            className={`dropdown-content ${isDropdownOpen ? "show" : ""}`}
          >
            <div className="nested-dropdown">
              <span onClick={(e) => e.stopPropagation()}>Societies</span>
              <div className="nested-dropdown-content">
                <Link
                  to="/shristi-handicraft"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Srishti Handicraft
                </Link>
                <Link
                  to="/prerana-handloom"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Prerna Handloom
                </Link>
              </div>
            </div>
          </div>
        </li>

        <li>
          <Link to="/products" onClick={() => setIsMenuOpen(false)}>
            Products
          </Link>
        </li>
        <li>
          <Link to="/contact" onClick={() => setIsMenuOpen(false)}>
            Contact us
          </Link>
        </li>
        {isAuthenticated && (
          <>
            <li>
              <Link to="/orders" onClick={() => setIsMenuOpen(false)}>
                <FaClipboardList className="nav-inline-icon" />
                <span className="nav-inline-label">My orders</span>
              </Link>
            </li>
            <li>
              <Link
                to="/cart"
                onClick={() => setIsMenuOpen(false)}
                className="nav-cart-link"
              >
                <FaShoppingCart className="nav-cart-icon" /> Cart
                {getCartItemCount() > 0 && (
                  <span className="nav-cart-badge">
                    {getCartItemCount() > 9 ? "9+" : getCartItemCount()}
                  </span>
                )}
              </Link>
            </li>
          </>
        )}
        {user?.role === "admin" && (
          <li>
            <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
              Admin
            </Link>
          </li>
        )}
        {isAuthenticated ? (
          <li className="nav-user-menu">
            <div className="nav-user-dropdown">
              <button className="nav-user-button">
                <FaUserCircle className="nav-user-icon" />
                <span className="nav-user-name">{user?.name?.split(" ")[0] || "Account"}</span>
              </button>
              <div className="nav-user-dropdown-content">
                <Link to="/account" onClick={() => setIsMenuOpen(false)}>
                  <FaUserCircle /> Profile
                </Link>
                <button
                  className="nav-logout-button"
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                >
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            </div>
          </li>
        ) : (
          <li>
            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="nav-login-link">
              Login
            </Link>
          </li>
        )}
      </ul>
      <div className="logo">
        <li>
          <Link to="/">
            <div className="sh-logo-bg">
              <img src="./assets/logo-2.png" alt="CoE" className="sh-logo" />
            </div>
          </Link>
        </li>
      </div>
      <div className="hamburger" onClick={toggleMenu}>
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </div>
    </nav>
  );
};

export default Navbar;
