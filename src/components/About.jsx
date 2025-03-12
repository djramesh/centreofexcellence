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
            <strong>Oil India Rural Development Society (OIRDS)</strong> is set
            up mainly for development of the rural areas. As part of our vision
            for the socio-economic development of the area, OIRDS considers
            non-farm activities also as an important part, as they provide
            additional livelihood opportunities. It is in this context the
            Handicraft Training and Production Centre was set up by us few years
            ago. This Centre has been providing training on handloom and
            handicrafts since several years.
            <br />
            <br />
            Schoolnet is appointed as the professional Project Management Agency
            to operate the Centre, and also revamp and upgrade the facilities
            and training programs.
            <br />
            <br />
            <strong>The Centre of Excellence (CoE)</strong>, at Duliajan
            formerly the Handicraft Training and Production Centre, has long
            supported rural women by fostering self-employment through
            traditional skills training.
            <br />
            <br />
            It is extremely heartening to note that so far, the COE has already
            trained candidates in bamboo and water hyacinth handicrafts. A
            heartening feature of the program is inclusion of value added
            modules in digital literacy, financial literacy, English and soft
            skills, apart from entrepreneurship modules.
            <br />
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
            <br />
            <br />
            In recent years, we had observed that the Centre needs to move to
            the next level by promoting entrepreneurship amongst the local youth
            and supporting value chain development so that the products made in
            the Centre and the cluster are linked to a wider market. For this,
            we felt that it is necessary to provide entrepreneurship development
            training to the youth so that they are able to appreciate the
            nuances of running a small business and have exposure to different
            market opportunities.
          </p>
        </div>
        <div className="image-section animated fade-in-left">
          <img
            src="./assets/about-img-2.png"
            alt="about-image"
            className="about-img-2"
          />
        </div>
      </div>
      <div className="content">
        <div className="text-section animated fade-in-left">
          <h1>Objectives</h1>
          <p>
            The project aims to enhance artisan livelihoods by creating a
            sustainable handloom/handicraft value chain linked to diverse
            markets. Key steps include: <br />
            <br />
            i. Conducting market and skill assessments to identify high-demand
            products. <br />
            <br />
            ii. Training local entrepreneurs to establish market linkages for
            artisanal products. <br />
            <br />
            iii. Training artisans to produce market-driven products, building a
            strong supply base. <br />
            <br />
            iv. Upgrading the Centre of Excellence (CoE) as a hub for product
            design, development, branding, training, and marketing. <br />
            <br />
            v. Establishing backward and forward linkages, supported by
            government schemes, to create a sustainable local ecosystem.
          </p>
        </div>
        <div className="image-section animated fade-in-right">
          <img
            src="./assets/about-img-3.png"
            alt="about-image"
            className="about-img-3"
          />
        </div>
      </div>
    </div>
  );
}

export default About;
