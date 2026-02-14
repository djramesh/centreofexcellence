import React from "react";
import "../App.css";
import "./About.css";
import "./Home.css";

function About() {
  return (
    <div className="container">
      <div className="content">
        <div className="text-section-right animated fade-in-left">
          <h1 className="text-heading">About OIRDS</h1>
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
            OIRDS envisions equipping the rural areas with technological
            advancements. Focus has been two core areas namely- Agriculture
            advancement through Commercial and Integrated Farming & the
            promotion of Handlooms and Handicrafts in project area through
            Centre of Excellence (previously known as Handicraft Training and
            Production Centre). The main objective of the project was to create
            economic empowerment amongst the rural girls/women folk at the grass
            root level through generating self-employment avenues.
          </p>
        </div>
        <div className="animated-heading"></div>
        <div className="image-section animated fade-in-right">
          <img src="/assets/about-us-1.png" alt="about-image" />
        </div>
      </div>
      <br />
      <br />
      <div className="img-divider">
        <img src="./assets/divider.png" alt="" className="cloth-pattern-img" />
        <img
          src="./assets/divider.png"
          alt=""
          className="cloth-pattern-img-1"
        />
      </div>
    </div>
  );
}

export default About;
