import React from "react";
import "../footer.css";

const Footer = () => {
  return (
    <div className="container">
      <footer>
        <div className="logo-section">
          <div className="footer-logo">
            <img src="./assets/coe-logo.png" alt="Logo" />
          </div>
          <div className="footer-location">
            <h4>Location</h4>
            <p>
              Centre of Excellence Tipling, Duliajan Dibrugarh, Assam 786602
            </p>
          </div>
          <div className="footer-email">
            <h4>Email</h4>
            <p>
              <a href="mailto:manjit.thakuria@schoolnetindia.com">
                manjit.thakuria@schoolnetindia.com
              </a>
            </p>
          </div>
        </div>
        <hr />
        <div className="about-section">
          <div className="footer-about">
            <h4>About Us</h4>
            <p>
              The Centre of Excellence (CoE), formerly the Handicraft Training
              and Production Centre, has long supported rural women by fostering
              self-employment through traditional skills training.
            </p>
          </div>
          <div className="footer-quick-links">
            <h4>Quick Links</h4>
            <ul>
              <li>
                <a href="/about">About</a>
              </li>
              <li>
                <a href="/products">Products</a>
              </li>
              <li>
                <a href="/contact">Contact</a>
              </li>
              <li>
                <a href="/order">Order</a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
