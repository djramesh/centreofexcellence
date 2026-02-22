import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  FaUserCircle,
  FaSignOutAlt,
  FaShoppingCart,
  FaClipboardList,
} from "react-icons/fa";
import "./Navbar.css";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { user, isAuthenticated, logout } = useAuth();
  const { getCartItemCount } = useCart();
  const navigate = useNavigate();

  /* scrolled class ──────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* close drawer on resize to desktop ───────────────── */
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setIsMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* lock body scroll when mobile menu is open ───────── */
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMenuOpen]);

  const closeAll = () => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
    setIsUserOpen(false);
  };

  return (
    <nav className={`navbar${scrolled ? " navbar--scrolled" : ""}`}>

      {/* Left logo */}
      <div className="logo">
        <li>
          <Link to="/" onClick={closeAll}>
            <img src="./assets/ph-logo.png" alt="CoE" className="ph-logo" />
          </Link>
        </li>
      </div>

      {/* Nav links / mobile drawer */}
      <ul className={`nav-links${isMenuOpen ? " active" : ""}`}>

        <li>
          <Link to="/" onClick={closeAll}>Home</Link>
        </li>

        {/* About us dropdown */}
        <li className="dropdown">
          <Link
            to="/"
            onClick={(e) => {
              e.preventDefault();
              setIsDropdownOpen((p) => !p);
            }}
          >
            About us &nbsp;
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transition: "transform 0.2s", transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0)" }}>
              <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <div className={`dropdown-content${isDropdownOpen ? " show" : ""}`}>
            <div className="nested-dropdown">
              <span onClick={(e) => e.stopPropagation()}>Societies</span>
              <div className="nested-dropdown-content">
                <Link to="/shristi-handicraft" onClick={closeAll}>
                  Srishti Handicraft
                </Link>
                <Link to="/prerana-handloom" onClick={closeAll}>
                  Prerna Handloom
                </Link>
              </div>
            </div>
          </div>
        </li>

        <li>
          <Link to="/gallery" onClick={closeAll}>Gallery</Link>
        </li>

        <li>
          <Link to="/products" onClick={closeAll}>Products</Link>
        </li>

        <li>
          <Link to="/contact" onClick={closeAll}>Contact us</Link>
        </li>

        {isAuthenticated && (
          <>
            <li>
              <Link to="/orders" onClick={closeAll}>
                <FaClipboardList className="nav-inline-icon" />
                <span className="nav-inline-label">My Orders</span>
              </Link>
            </li>

            <li>
              <Link to="/cart" onClick={closeAll} className="nav-cart-link">
                <FaShoppingCart className="nav-cart-icon" />
                &nbsp;Cart
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
            <Link to="/admin" onClick={closeAll}>Admin</Link>
          </li>
        )}

        {/* User menu */}
        {isAuthenticated ? (
          <>
            {/* Account pill */}
            <li className={`nav-user-menu${isUserOpen ? " open" : ""}`}>
              <div className={`nav-user-dropdown${isUserOpen ? " open" : ""}`}>
                <button
                  className="nav-user-button"
                  onClick={() => setIsUserOpen((p) => !p)}
                  aria-expanded={isUserOpen}
                >
                  <FaUserCircle className="nav-user-icon" />
                  <span className="nav-user-name">
                    {user?.name?.split(" ")[0] || "Account"}
                  </span>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transition: "transform 0.2s", transform: isUserOpen ? "rotate(180deg)" : "rotate(0)", marginLeft: "2px" }}>
                    <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <div className="nav-user-dropdown-content">
                  <Link to="/account" onClick={closeAll}>
                    <FaUserCircle /> Profile
                  </Link>
                  <button
                    className="nav-logout-button"
                    onClick={() => { logout(); closeAll(); }}
                  >
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              </div>
            </li>

            {/* Standalone Logout pill */}
            <li>
              <button
                className="nav-logout-pill"
                onClick={() => { logout(); closeAll(); }}
                aria-label="Logout"
              >
                <FaSignOutAlt className="nav-logout-pill-icon" />
                <span className="nav-logout-pill-label">Logout</span>
              </button>
            </li>
          </>
        ) : (
          <li>
            <Link to="/login" onClick={closeAll} className="nav-login-link">
              Login
            </Link>
          </li>
        )}
      </ul>

      {/* Right logo */}
      <div className="logo">
        <li>
          <Link to="/" onClick={closeAll}>
            <div className="sh-logo-bg">
              <img src="./assets/logo-2.png" alt="CoE" className="sh-logo" />
            </div>
          </Link>
        </li>
      </div>

      {/* Hamburger */}
      <button
        className={`hamburger${isMenuOpen ? " open" : ""}`}
        onClick={() => setIsMenuOpen((p) => !p)}
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={isMenuOpen}
      >
        <span className="bar" />
        <span className="bar" />
        <span className="bar" />
      </button>

    </nav>
  );
};

export default Navbar;