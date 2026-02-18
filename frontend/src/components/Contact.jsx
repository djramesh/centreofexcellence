import React, { useState, useEffect, useRef } from "react";
import {
  FaComment,
  FaEnvelope,
  FaHeadphones,
  FaMap,
  FaPen,
  FaPhone,
  FaMapMarkerAlt,
} from "react-icons/fa";
import "./Contact.css";
import emailjs from "emailjs-com";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);

    emailjs
      .send(
        "service_vbta2ys",
        "template_co602zs",
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
        },
        "745kqV2H7-v3BXm1L"
      )
      .then(
        () => {
          alert("Message sent successfully!");
          setFormData({ name: "", email: "", phone: "", message: "" });
          setSubmitting(false);
        },
        () => {
          alert("Failed to send message. Please try again.");
          setSubmitting(false);
        }
      );
  };

  /* Scroll-reveal */
  useEffect(() => {
    const targets = document.querySelectorAll(".c-reveal, .c-reveal-left, .c-reveal-right");
    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("c-revealed"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("c-revealed");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12 }
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="contact-page">

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="contact-hero">
        <div className="contact-hero-grid" aria-hidden="true" />

        <div className="contact-hero-content">
          <div className="contact-hero-eyebrow">
            <span className="contact-hero-dot" />
            Get In Touch
          </div>

          <h1 className="contact-hero-title">
            We'd love to <span>hear from you</span>
          </h1>

          <p className="contact-hero-sub">
            Reach out to us via email, phone, or fill in the form below.
            Our team is always ready to assist you.
          </p>

          <div className="contact-hero-chips">
            <a href="mailto:Rimpi.Bora@schoolnetindia.com" className="contact-chip">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555ZM0 4.697v7.104l5.803-3.558L0 4.697ZM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757Zm3.436-.586L16 11.801V4.697l-5.803 3.546Z"/>
              </svg>
              Rimpi.Bora@schoolnetindia.com
            </a>
            <a href="tel:7002301360" className="contact-chip">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"/>
              </svg>
              +91 70023 01360
            </a>
            <a href="tel:6901977654" className="contact-chip">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"/>
              </svg>
              +91 69019 77654
            </a>
          </div>
        </div>

        {/* Hero image */}
        <div className="contact-hero-img-wrap">
          <img src="./assets/contact-img.JPG" alt="Contact us" />
        </div>
      </section>


      {/* ── MAIN: FORM + INFO ───────────────────────────────── */}
      <section className="contact-main">

        {/* Contact Form */}
        <div className="contact-form-card c-reveal-left">
          <h2>Send us a message</h2>
          <p className="form-sub">You can reach us anytime — we'll get back to you shortly.</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  placeholder="+91 XXXXX XXXXX"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                placeholder="Tell us how we can help you…"
                value={formData.message}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="form-submit-btn" disabled={submitting}>
              {submitting ? "Sending…" : "Send Message →"}
            </button>

            <p className="form-privacy">
              By contacting us, you agree to our{" "}
              <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
            </p>
          </form>
        </div>

        {/* Info Panel */}
        <div className="contact-info-panel">

          <div className="info-card info-card--accent c-reveal delay-1">
            <div className="info-card-icon">
              <FaEnvelope />
            </div>
            <h3>Email Us</h3>
            <a href="mailto:Rimpi.Bora@schoolnetindia.com">Rimpi.Bora@schoolnetindia.com</a>
            <a href="mailto:manjit.thakuria@schoolnetindia.com" style={{ marginTop: "4px" }}>
              manjit.thakuria@schoolnetindia.com
            </a>
          </div>

          <div className="info-card c-reveal delay-2">
            <div className="info-card-icon">
              <FaPhone />
            </div>
            <h3>Call Us</h3>
            <a href="tel:7002301360">+91 70023 01360</a>
            <a href="tel:6901977654" style={{ marginTop: "4px" }}>+91 69019 77654</a>
          </div>

          <div className="info-card c-reveal delay-3">
            <div className="info-card-icon">
              <FaMapMarkerAlt />
            </div>
            <h3>Visit Us</h3>
            <p>
              Centre of Excellence, Tipling, Duliajan<br />
              Dibrugarh, Assam — 786602
            </p>
          </div>

        </div>
      </section>


      {/* ── SUPPORT PILLARS ─────────────────────────────────── */}
      <section className="support-section">
        <div className="support-section-header c-reveal">
          <span className="eyebrow">How We Help</span>
          <h2>Ways to Reach Us</h2>
        </div>

        <div className="support-grid">
          <div className="support-card c-reveal delay-1">
            <div className="support-card-icon">
              <FaHeadphones />
            </div>
            <h3>Customer Support</h3>
            <p>
              Our support team is available around the clock to address
              any concerns or queries you may have.
            </p>
          </div>

          <div className="support-card c-reveal delay-2">
            <div className="support-card-icon">
              <FaComment />
            </div>
            <h3>Feedback &amp; Suggestions</h3>
            <p>
              We welcome your ideas and suggestions. Feel free to reach
              out anytime — every voice matters to us.
            </p>
          </div>

          <div className="support-card c-reveal delay-3">
            <div className="support-card-icon">
              <FaPen />
            </div>
            <h3>Write to Us</h3>
            <p>
              Send your detailed queries or specific requests via email at{" "}
              <a
                href="mailto:manjit.thakuria@schoolnetindia.com"
                style={{ color: "#2484ff", fontWeight: 500 }}
              >
                manjit.thakuria@schoolnetindia.com
              </a>
            </p>
          </div>
        </div>
      </section>


      {/* ── LOCATION & MAP ──────────────────────────────────── */}
      <section className="location-section">
        <div className="location-info c-reveal-left">
          <span className="eyebrow">
            <FaMap style={{ verticalAlign: "middle", marginRight: "6px" }} />
            Our Location
          </span>
          <h2>Find us on the map</h2>

          <div className="location-address-card">
            <address>
              Centre of Excellence<br />
              Tipling, Duliajan<br />
              Dibrugarh, Assam<br />
              786602
            </address>
          </div>
        </div>

        <div className="location-map-wrap c-reveal-right">
          <iframe
            width="100%"
            height="380"
            src="https://maps.google.com/maps?width=100%25&amp;height=600&amp;hl=en&amp;q=SIRD,%20Duliajan,%20Sarupathar%20Bengali,%20Assam%20786602+(My%20Business%20Name)&amp;t=&amp;z=14&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
            title="Our Location"
          >
            <a href="https://www.gps.ie/">gps devices</a>
          </iframe>
        </div>
      </section>

    </div>
  );
}

export default Contact;