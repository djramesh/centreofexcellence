import React from "react";
import "./PolicyPages.css";

export default function PrivacyPolicy() {
  return (
    <div className="policy-page">

      <div className="policy-hero">
        <div className="policy-hero-grid" aria-hidden="true" />
        <div className="policy-hero-orb policy-hero-orb--1" aria-hidden="true" />
        <div className="policy-hero-orb policy-hero-orb--2" aria-hidden="true" />
        <div className="policy-hero-inner">
          <span className="policy-eyebrow">Your Privacy</span>
          <h1 className="policy-hero-title">Privacy Policy</h1>
          <p className="policy-hero-sub">How we collect, use, and protect your personal information</p>
        </div>
      </div>

      <div className="policy-content">
        <div className="policy-updated">📅 Last updated: February 2026</div>

        <div className="policy-callout policy-callout--blue">
          <span className="policy-callout-icon">🔒</span>
          <span>
            We respect your privacy. This policy explains what personal information we collect when you use
            our website or place an order, how we use it, and how we protect it.
            <strong> We do not sell your data to third parties.</strong>
          </span>
        </div>

        {/* 1. What We Collect */}
        <div className="policy-section">
          <h2 className="policy-section-title"><span className="ps-icon">📋</span> 1. Information We Collect</h2>
          <p>We collect the following when you create an account or place an order:</p>
          <ul className="policy-list">
            <li><strong>Personal details:</strong> Name, email address, phone number</li>
            <li><strong>Delivery address:</strong> Street address, city, state, PIN code, country</li>
            <li><strong>Order information:</strong> Products ordered, quantity, price, order and payment status</li>
            <li><strong>Payment information:</strong> We do not store any card or UPI details — all payment data is processed entirely by Razorpay's secure infrastructure</li>
          </ul>
        </div>

        {/* 2. How We Use It */}
        <div className="policy-section">
          <h2 className="policy-section-title"><span className="ps-icon">🎯</span> 2. How We Use Your Information</h2>
          <ul className="policy-list">
            <li>To process and fulfil your orders</li>
            <li>To send order confirmation, shipping updates, and delivery notifications via email or WhatsApp</li>
            <li>To respond to your enquiries and support requests</li>
            <li>To improve our website, product listings, and overall customer experience</li>
            <li>To comply with applicable legal and regulatory obligations</li>
          </ul>
          <p>We will not use your contact details for unsolicited marketing without your consent.</p>
        </div>

        {/* 3. Data Sharing */}
        <div className="policy-section">
          <h2 className="policy-section-title"><span className="ps-icon">🤝</span> 3. Data Sharing</h2>
          <p>We share your information only with the following parties and only as necessary:</p>
          <ul className="policy-list">
            <li><strong>Razorpay</strong> — to process payments securely (they are PCI-DSS Level 1 certified)</li>
            <li><strong>Courier partners</strong> — your name, phone number, and delivery address, to ship your order</li>
            <li><strong>Government authorities</strong> — only when required by law or court order</li>
          </ul>
          <p>We do not sell, rent, or trade your personal data to any third party for advertising or any other purpose.</p>
        </div>

        {/* 4. Data Security */}
        <div className="policy-section">
          <h2 className="policy-section-title"><span className="ps-icon">🛡️</span> 4. Data Security</h2>
          <p>
            We take reasonable technical and organisational measures to protect your personal information from
            unauthorised access, disclosure, alteration, or loss. Account passwords are stored in hashed form.
            All payment processing is handled entirely by Razorpay's PCI-DSS compliant infrastructure.
          </p>
          <div className="policy-callout policy-callout--orange">
            <span className="policy-callout-icon">💡</span>
            <span>
              Please keep your account password confidential. We will <strong>never</strong> ask for your
              password via email, phone, or any other channel.
            </span>
          </div>
        </div>

        {/* 5. Cookies */}
        <div className="policy-section">
          <h2 className="policy-section-title"><span className="ps-icon">🍪</span> 5. Cookies</h2>
          <p>
            Our website uses essential session cookies to keep you logged in and maintain your shopping
            session. We do not use tracking, advertising, or third-party analytics cookies. You may disable
            cookies in your browser settings, though some functionality (such as staying logged in) may
            be affected.
          </p>
        </div>

        {/* 6. Your Rights */}
        <div className="policy-section">
          <h2 className="policy-section-title"><span className="ps-icon">✅</span> 6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="policy-list">
            <li><strong>Access</strong> the personal data we hold about you</li>
            <li><strong>Correct</strong> any inaccurate information in your account</li>
            <li><strong>Delete</strong> your account and associated personal data (subject to any outstanding orders or legal obligations)</li>
          </ul>
          <p>To exercise any of these rights, contact us at <strong>contactuscoe@gmail.com</strong> with your registered email address.</p>
        </div>

        {/* 7. Data Retention */}
        <div className="policy-section">
          <h2 className="policy-section-title"><span className="ps-icon">🗄️</span> 7. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as needed to provide
            services. Order records may be retained for up to 7 years for accounting and legal compliance
            purposes, even after account deletion.
          </p>
        </div>

        {/* 8. Changes */}
        <div className="policy-section">
          <h2 className="policy-section-title"><span className="ps-icon">🔄</span> 8. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. Material changes will be communicated via
            email or a notice on the website. Continued use of the website after changes are published
            constitutes acceptance of the updated policy.
          </p>
        </div>

        <div className="policy-contact-card">
          <h3>Privacy concerns or data requests?</h3>
          <p>Reach out and we'll respond within 3 working days.</p>
          <div className="policy-contact-links">
            <a href="mailto:contactuscoe@gmail.com" className="policy-contact-btn policy-contact-btn--primary">✉️ Email Us</a>
          </div>
        </div>
      </div>
    </div>
  );
}