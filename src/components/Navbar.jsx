import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingBag, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import "./Navbar.css";
import "./Common.css";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
              e.preventDefault(); // Prevent navigation
              toggleDropdown(); // Toggle dropdown
              setIsMenuOpen(true); // Keep menu open
            }}
          >
            About us <i className="bi bi-chevron-down ms-1"></i>
          </Link>
          <div
            className={`dropdown-content ${isDropdownOpen ? "show" : ""}`} // Add show class conditionally
          >
            <Link to="/oirds" onClick={() => setIsMenuOpen(false)}>
              OIRDS
            </Link>
            <Link to="/coe" onClick={() => setIsMenuOpen(false)}>
              CoE
            </Link>
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
      </ul>
      <div className="logo">
        <li>
          <Link to="/">
            <div>
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
