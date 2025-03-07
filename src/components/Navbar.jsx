import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingBag, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import "./Navbar.css";
import "./Common.css";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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
          {" "}
          <Link to="/">
            <img src="./assets/coe-logo.png" alt="CoE>" />
          </Link>
        </li>
      </div>
      <ul className={`nav-links ${isMenuOpen ? "active" : ""}`}>
        <li>
          <Link to="/" onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>
        </li>
        <li>
          <Link to="/products" onClick={() => setIsMenuOpen(false)}>
            Products
          </Link>
        </li>
        <li>
          <Link to="/societies" onClick={() => setIsMenuOpen(false)}>
            Societies
          </Link>
        </li>
        <li>
          <Link to="/gallery" onClick={() => setIsMenuOpen(false)}>
            Gallery
          </Link>
        </li>
        <li>
          <Link to="/about" onClick={() => setIsMenuOpen(false)}>
            About us
          </Link>
        </li>
        <li>
          <Link to="/contact" onClick={() => setIsMenuOpen(false)}>
            Contact us
          </Link>
        </li>
      </ul>
      <button className="button" onClick={handleOrderClick}>
        Shop Now &nbsp; <FontAwesomeIcon icon={faShoppingBag} />
        <div className="hoverEffect">
          <div></div>
        </div>
      </button>
      <div className="hamburger" onClick={toggleMenu}>
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </div>
    </nav>
  );
};

export default Navbar;
