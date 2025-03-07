import React from "react";
import "../App.css";
import "./About.css";

function About() {
  return (
    <div className="container">
      <div className="content">
        <div className="text-section animated fade-in-left">
          <h1>About us</h1>
          <p>
            <strong>Oil India Rural Development Society (OIRDS)</strong> aims to
            empower rural areas through technological advancements, focusing on
            agriculture and the promotion of handlooms and handicrafts. <br />
            <br />
            <strong>The Centre of Excellence (CoE)</strong>, formerly the
            Handicraft Training and Production Centre, has long supported rural
            women by fostering self-employment through traditional skills
            training.
            <br />
            <br />
            To meet evolving market demands, the CoE now seeks to modernize,
            adopting a blended learning model and advanced techniques to enhance
            skills, streamline production, and adapt to changing consumer
            preferences. This upgrade aims to drive greater impact and economic
            empowerment for future generations in the handloom and handicraft
            sectors.
          </p>
        </div>
        <div className="animated-heading"></div>
        <div className="image-section animated fade-in-right">
          <img src="/assets/about-us-1.png" alt="about-image" />
        </div>
      </div>
      <div className="content-about">
        <div className="text-section-right animated fade-in-right animated-heading-1 product-heading">
          <h1>The Vision</h1>
          <p>
            Transform the proposed center as a Centre of Excellence for
            Handlooms and Handicrafts unlocking the untapped potential of
            traditional skills through Capacity Development and Entrepreneurship
            to enhance incomes and livelihoods of traditional artisans.
          </p>
        </div>
        <div className="image-section animated fade-in-left">
          <img src="./assets/about-img-2.png" alt="about-image" className="about-img-2" />
        </div>
      </div>
      <div className="content">
        <div className="text-section animated fade-in-left">
          <h1>Objectives</h1>
          <p>
            The project aims to enhance artisan livelihoods by creating a
            sustainable handloom/handicraft value chain linked to diverse
            markets. Key steps include: <br /><br />
            i. Conducting market and skill assessments
            to identify high-demand products. <br /><br />
            ii. Training local entrepreneurs to
            establish market linkages for artisanal products. <br /><br />
            iii. Training artisans
            to produce market-driven products, building a strong supply base. <br /><br />
            iv. Upgrading the Centre of Excellence (CoE) as a hub for product
            design, development, branding, training, and marketing. <br /><br />
            v. Establishing
            backward and forward linkages, supported by government schemes, to
            create a sustainable local ecosystem.
          </p>
        </div>
        <div className="image-section animated fade-in-right">
          <img src="./assets/about-img-3.png" alt="about-image" className="about-img-3"/>
        </div>
      </div>
    </div>
  );
}

export default About;
