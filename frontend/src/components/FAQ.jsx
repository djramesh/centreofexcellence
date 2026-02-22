import React, { useState } from "react";
import "./PolicyPages.css";

const FAQS = [
  {
    category: "Products",
    items: [
      {
        q: "Are all products genuinely handmade?",
        a: "Yes, every product sold by Shristi Handicraft and Prerana Handloom is entirely handcrafted by our skilled artisans using traditional techniques passed down through generations. No two pieces are exactly alike — slight variations in colour, texture, and pattern are a natural and celebrated characteristic of handmade goods.",
      },
      {
        q: "The product colour looks different from the website. Is that normal?",
        a: "Yes, this is completely normal for products made with natural dyes. Screen calibration differences and the nature of natural pigments mean actual colours may vary slightly from photographs. This is not considered a defect and is not grounds for return or exchange.",
      },
      {
        q: "How do I care for my handloom or water hyacinth product?",
        a: "Handloom textiles should be hand-washed in cold water with mild detergent and dried in shade — avoid machine washing and tumble drying. Water hyacinth and bamboo products should be kept away from excessive moisture and direct sunlight to maintain their shape and durability. Wipe with a dry cloth rather than soaking.",
      },
    ],
  },
  {
    category: "Orders & Payment",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "We accept all major payment methods via Razorpay — UPI (PhonePe, GPay, Paytm, BHIM), debit and credit cards (Visa, Mastercard, RuPay), and net banking from major Indian banks.",
      },
      {
        q: "Can I cancel my order after placing it?",
        a: "You may request a cancellation within 2 hours of placing your order by contacting us via email or WhatsApp with your order ID. After 2 hours, or once the order is shipped, cancellations are not possible. Please review your order carefully before payment.",
      },
      {
        q: "Do you take bulk or custom orders?",
        a: "Absolutely! We welcome bulk orders for corporate gifting, institutional procurement, weddings, and events. Custom dimensions or designs are also possible. Please contact us at contactuscoe@gmail.com or via WhatsApp before placing the order to discuss requirements, timelines, and pricing.",
      },
    ],
  },
  {
    category: "Returns & Refunds",
    items: [
      {
        q: "Can I return or exchange a product?",
        a: "We follow a strict No Return / No Refund policy as all products are handcrafted and often made to order. However, if you receive the wrong product (clearly different from what was ordered) or a product with a significant manufacturing defect, please contact us with photos within 48 hours of delivery and we will assess the situation.",
      },
      {
        q: "My order arrived damaged. What do I do?",
        a: "If the outer packaging is severely damaged at delivery, refuse the package and note it with the courier. If damage is discovered after opening, photograph both the packaging and the product immediately and email contactuscoe@gmail.com within 48 hours with your order ID and clear photos. We will file a claim with the courier and work towards a resolution.",
      },
      {
        q: "I received the wrong item. What should I do?",
        a: "Please email contactuscoe@gmail.com within 48 hours of delivery with your order ID, a photo of what you received, and a description of what you had ordered. We will arrange a replacement or resolution at no additional cost to you.",
      },
    ],
  },
  {
    category: "Shipping & Delivery",
    items: [
      {
        q: "How long does delivery take?",
        a: "After payment, orders are processed within 2–5 working days. Delivery within Assam takes about 3–5 days, Northeast India 4–7 days, and the rest of India 7–12 working days. Remote areas may take up to 18 working days.",
      },
      {
        q: "How do I track my order?",
        a: "Once dispatched, we send a shipping confirmation with a tracking number where available. You can also contact us via email or WhatsApp with your order ID for a real-time status update.",
      },
      {
        q: "Is my payment information secure?",
        a: "Absolutely. All payment processing is handled by Razorpay, which is PCI-DSS Level 1 certified — the highest security standard in the payments industry. We never see or store your card or UPI details on our servers.",
      },
    ],
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? " open" : ""}`}>
      <button className="faq-question" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {q}
        <span className="faq-chevron">▼</span>
      </button>
      <div className="faq-answer">{a}</div>
    </div>
  );
}

export default function FAQ() {
  return (
    <div className="policy-page">

      <div className="policy-hero">
        <div className="policy-hero-grid" aria-hidden="true" />
        <div className="policy-hero-orb policy-hero-orb--1" aria-hidden="true" />
        <div className="policy-hero-orb policy-hero-orb--2" aria-hidden="true" />
        <div className="policy-hero-inner">
          <span className="policy-eyebrow">Help Centre</span>
          <h1 className="policy-hero-title">Frequently Asked Questions</h1>
          <p className="policy-hero-sub">Quick answers to common questions about our products and orders</p>
        </div>
      </div>

      <div className="policy-content">

        {FAQS.map((group) => (
          <div key={group.category} className="policy-section">
            <h2 className="policy-section-title">{group.category}</h2>
            {group.items.map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        ))}

        <div className="policy-contact-card">
          <h3>Didn't find your answer?</h3>
          <p>We're here to help — reach out and we'll get back to you within 1 working day.</p>
          <div className="policy-contact-links">
            <a href="mailto:contactuscoe@gmail.com" className="policy-contact-btn policy-contact-btn--primary">✉️ Email Us</a>
            <a href="https://wa.me/916001773030" className="policy-contact-btn policy-contact-btn--ghost" target="_blank" rel="noopener noreferrer">💬 WhatsApp</a>
          </div>
        </div>

      </div>
    </div>
  );
}