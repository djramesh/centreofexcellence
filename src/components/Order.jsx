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
    product: "",
    quantity: "",
    ship_address: "",
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
        "template_5l601df", //template id
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          product: formData.product,
          quantity: formData.quantity,
          ship_address: formData.ship_address,
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
        <div className="text-section animated fade-in-left">
          <h1>Order now</h1>
          <p>
            Email, call or complete the form to place an order. You can also
            contact for any kind of enquiry or Bulk order.
          </p>
          <p>
            <FaEnvelope className="icon" />
            <strong>manjit.thakuria@schoolnetindia.com</strong>
          </p>
          <p>
            <FaPhone className="icon" />
            <strong>86380-15540</strong>
          </p>
        </div>

        <div className="image-section animated fade-in-right">
          <img src="./assets/deliver-img.jpg" alt="about-image" />
        </div>
      </div>
      <div className="get-in-touch product-heading">
        <h2>Fill the details</h2>
        <p>Details for delivery.</p>
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
          <input
            type="text"
            name="product"
            placeholder="Product name"
            value={formData.product}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="quantity"
            placeholder="Quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
          />
          <textarea
            name="ship_address"
            placeholder="Your address"
            value={formData.ship_address}
            onChange={handleChange}
            required
          ></textarea>

          <textarea
            name="message"
            placeholder="Your message"
            value={formData.message}
            onChange={handleChange}
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
            Take your time and send us an email at example@gmail.com with your
            specific questions or specific requests.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Contact;
