import React, { useState } from "react";
import {
  FaComment,
  FaEnvelope,
  FaHeadphones,
  FaMap,
  FaPen,
  FaPhone,
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

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
        (response) => {
          alert("Message sent successfully!");
          setFormData({ name: "", email: "", phone: "", message: "" });
        },
        (err) => {
          alert("Failed to send message. Please try again.");
        }
      );
  };

  return (
    <div className="container">
      <div className="content">
        <div className="text-section-contact animated fade-in-left">
          <h1>Contact us</h1>
          <p>
            Email, call or complete the form to learn how we can solve your
            queries.
          </p>
          <p>
            <FaEnvelope className="icon" />
            <a href="mailto:Rimpi.Bora@schoolnetindia.com" className="order-links">Rimpi.Bora@schoolnetindia.com</a>
          </p>
          <p>
            <FaPhone className="icon" />
            <a href="tel:7002301360" className="order-links">+91 70023 01360</a>
            {" "}
            <FaPhone className="icon" />
            <a href="tel:6901977654" className="order-links">+91 69019 77654</a>
          </p>
        </div>

        <div className="image-section animated fade-in-right">
          <img src="./assets/contact-img.JPG" alt="about-image" className="contact-img" />
        </div>
      </div>
      <div className="get-in-touch product-heading">
        <h2>Get in Touch</h2>
        <p>You can reach us anytime</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Your name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone number"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <textarea
            name="message"
            placeholder="Your message"
            value={formData.message}
            onChange={handleChange}
            required
          ></textarea>
          <button type="submit">Submit</button>
        </form>
        <p>
          By contacting us, you agree to our <a href="#">Terms of Service</a>{" "}
          and <a href="#">Privacy Policy</a>.
        </p>
      </div>

      <div className="location animated-heading">
        <div>
          <h2>
            <FaMap className="icon" />
            Our Location
          </h2>
          <h3>Locate us through map</h3>
          <address>
            Centre of Excellence
            <br />
            Tipling, Duliajan
            <br />
            Dibrugarh, Assam
            <br />
            786602
          </address>
        </div>

        <div className="map-container">
            <iframe
              width="98%"
              height="300"
              src="https://maps.google.com/maps?width=100%25&amp;height=600&amp;hl=en&amp;q=SIRD,%20Duliajan,%20Sarupathar%20Bengali,%20Assam%20786602+(My%20Business%20Name)&amp;t=&amp;z=14&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
            >
              <a href="https://www.gps.ie/">gps devices</a>
            </iframe>
        </div>
      </div>
      <div className="contact-details">
        <div>
          <h3>
            Customer Support &nbsp;
            <FaHeadphones className="icon" />
          </h3>
          <p>
            Our support team is available around the clock to address any
            concerns or queries you may have.
          </p>
        </div>
        <div>
          <h3>
            Feedback & Suggestion &nbsp;
            <FaComment className="icon" />
          </h3>
          <p>
            We welcome your ideas and suggestions. Feel free to reach out
            anytime.
          </p>
        </div>
        <div>
          <h3>
            Write to us &nbsp;
            <FaPen className="icon" />
          </h3>
          <p>
            Take your time and send us an email at manjit.thakuria@schoolnetindia.com with your
            specific questions or specific requests.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Contact;
