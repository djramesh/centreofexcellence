import React from "react";
import "./PolicyPages.css";

export default function TermsAndConditions() {
  return (
    <div className="policy-page">

      <div className="policy-hero">
        <div className="policy-hero-grid" aria-hidden="true" />
        <div className="policy-hero-orb policy-hero-orb--1" aria-hidden="true" />
        <div className="policy-hero-orb policy-hero-orb--2" aria-hidden="true" />
        <div className="policy-hero-inner">
          <span className="policy-eyebrow">Legal</span>
          <h1 className="policy-hero-title">Terms &amp; Conditions</h1>
          <p className="policy-hero-sub">Please read carefully before placing an order</p>
        </div>
      </div>

      <div className="policy-content">
        <div className="policy-updated">📅 Last updated: February 2026</div>

        <div className="policy-callout policy-callout--blue">
          <span className="policy-callout-icon">ℹ️</span>
          <span>
            By placing an order with Shristi Handicraft or Prerana Handloom Co-operative Societies —
            operated under the Centre of Excellence, Duliajan — you agree to the following terms.
            These apply to all purchases made through our website or by direct contact.
          </span>
        </div>

        {/* 1. Products */}
        <div className="policy-section">
          <h2 className="policy-section-title"><span className="ps-icon">🧺</span> 1. Our Products</h2>
          <p>
            All products sold by Shristi Handicraft and Prerana Handloom are handcrafted by skilled artisans
            using natural and traditional materials. As each item is made by hand, slight variations in colour,
            texture, weave, or dimensions are inherent to the craft and are not considered defects.
          </p>
          <p>
            Product images on our website are representative. Due to different monitor calibrations and the
            nature of natural dyes and fibres, actual colours may vary slightly from what is shown online.
          </p>
          <div className="policy-callout policy-callout--orange">
            <span className="policy-callout-icon">🎨</span>
            <span>
              <strong>Handmade variation:</strong> No two handcrafted pieces are identical. Minor differences
              in pattern, weave density, or dimension (±5%) are part of what makes each product unique and are
              not grounds for return or refund.
            </span>
          </div>
        </div>

        {/* 2. Pricing & Payment */}
        <div className="policy-section">
          <h2 className="policy-section-title"><span className="ps-icon">💰</span> 2. Pricing &amp; Payment</h2>
          <p>
            All prices are listed in Indian Rupees (₹) inclusive of applicable taxes. Shipping charges are
            calculated separately at checkout.
          </p>
          <ul className="policy-list">
            <li>Payments are processed securely via Razorpay — we accept UPI, debit/credit cards, and net banking.</li>
            <li>Your order is confirmed only after successful payment. Unpaid orders are automatically cancelled after 24 hours.</li>
            <li>We reserve the right to change prices without prior notice. The price at the time of order placement applies.</li>
            <li>In the event of a pricing error, we reserve the right to cancel the order and issue a full refund.</li>
          </ul>
        </div>

        {/* 3. No Return / No Refund Policy */}
        <div className="policy-section">
          <h2 className="policy-section-title"><span className="ps-icon">🚫</span> 3. No Return &amp; No Refund Policy</h2>

          <div className="policy-callout policy-callout--red">
            <span className="policy-callout-icon">⚠️</span>
            <span>
              As all our products are handcrafted and often made to order by artisans, we maintain a strict
              <strong> No Return and No Refund</strong> policy once an order is confirmed and payment is received.
            </span>
          </div>

          <p>We do not accept returns or exchanges for:</p>
          <ul className="policy-list">
            <li>Change of mind after purchase</li>
            <li>Natural variations in colour, texture, or pattern inherent to handcrafted goods</li>
            <li>Minor dimensional differences within ±5% of listed measurements</li>
            <li>Damage caused after delivery due to improper use or care</li>
            <li>Delivery delays caused by courier or logistics partners beyond our control</li>
          </ul>

          <p style={{ marginTop: "1rem" }}><strong>Exceptions — we will consider a replacement only if:</strong></p>
          <ul className="policy-list">
            <li>The product received is significantly and clearly different from what was ordered (wrong item shipped)</li>
            <li>
              The product arrives with a major manufacturing defect — not natural variation — reported with clear
              photographic evidence within <strong>48 hours of delivery</strong>
            </li>
          </ul>

          <div className="policy-callout policy-callout--orange">
            <span className="policy-callout-icon">📸</span>
            <span>
              To report a defect or wrong item, email <strong>contactuscoe@gmail.com</strong> within 48 hours
              of delivery, with your order number, clear photographs, and a description of the issue. Claims
              made after 48 hours will not be entertained.
            </span>
          </div>
        </div>

        {/* 4. Order Cancellation */}
        <div className="policy-section">
          <h2 className="policy-section-title"><span className="ps-icon">❌</span> 4. Order Cancellation</h2>
          <p>
            Once an order is confirmed and payment received, cancellations are generally not permitted as
            production may begin immediately. You may submit a cancellation request within <strong>2 hours</strong> of
            placing the order, subject to our discretion.
          </p>
          <ul className="policy-list">
            <li>Cancellation requests must include your order ID, submitted via email or WhatsApp.</li>
            <li>We reserve the right to cancel any order due to stock unavailability, pricing errors, or suspicious activity — a full refund will be issued in such cases.</li>
            <li>Once an order is shipped, it cannot be cancelled under any circumstances.</li>
          </ul>
        </div>

        {/* 5. Intellectual Property */}
        <div className="policy-section">
          <h2 className="policy-section-title"><span className="ps-icon">©️</span> 5. Intellectual Property</h2>
          <p>
            All content on this website — including product photographs, descriptions, logos, and design — is the
            property of Shristi &amp; Prerana Co-operative Societies / Centre of Excellence, Duliajan. Reproduction
            or commercial use without prior written permission is strictly prohibited.
          </p>
        </div>

        {/* 6. Governing Law */}
        <div className="policy-section">
          <h2 className="policy-section-title"><span className="ps-icon">⚖️</span> 6. Governing Law</h2>
          <p>
            These terms are governed by the laws of India. Any disputes arising from purchases made through
            this website shall be subject to the jurisdiction of courts in Dibrugarh, Assam.
          </p>
        </div>

        {/* 7. Changes */}
        <div className="policy-section">
          <h2 className="policy-section-title"><span className="ps-icon">🔄</span> 7. Changes to These Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the website after changes are published
            constitutes your acceptance of the updated terms. We encourage you to review this page periodically.
          </p>
        </div>

        <div className="policy-contact-card">
          <h3>Questions about our terms?</h3>
          <p>We're happy to clarify anything before you place your order.</p>
          <div className="policy-contact-links">
            <a href="mailto:contactuscoe@gmail.com" className="policy-contact-btn policy-contact-btn--primary">✉️ Email Us</a>
            <a href="https://wa.me/916001773030" className="policy-contact-btn policy-contact-btn--ghost" target="_blank" rel="noopener noreferrer">💬 WhatsApp</a>
          </div>
        </div>

      </div>
    </div>
  );
}