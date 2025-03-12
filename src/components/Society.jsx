import React from "react";
import "../App.css";
import "./About.css";

function Society() {
  return (
    <div className="container">
      <div className="content">
        <div className="text-section animated fade-in-left">
          <h1>
            Shristi Handicraft
            <br />
            Co-operative Society
          </h1>
          <p>
            Shristi Handicraft Co-operative Society society focuses
            on empowering artisans by promoting sustainable livelihoods through
            handcrafted products made from water hyacinth. <br /> <br /> Water
            hyacinth, often considered an invasive plant, is skilfully
            transformed into eco-friendly products such as{" "}
            <strong>
              baskets, handbags, mats, home décor items, and utility accessories.
            </strong>
            <br /><br />
            Through training, capacity building, and market linkages
            facilitated by CoE, Shristi Handicraft enhances rural
            entrepreneurship while promoting sustainable craft practices. Their
            work not only provides economic opportunities to local artisans,
            especially women, but also contributes to environmental conservation
            by utilizing an otherwise problematic aquatic weed.
          </p>
        </div>
        <div className="image-section animated animated-heading-1 fade-in-right">
          <img src="/assets/society-img-1.png" alt="about-image" className="about-img"/>
        </div>
      </div>
      <div className="content-about">
        <div className="text-section-right animated fade-in-right animated-heading-1 product-heading">
          <h1>
            Prerana Handloom
            <br />
            Co-operative Society
          </h1>
          <p>
            Prerana Handloom Co-operative Society is dedicated to preserving
            and promoting traditional handloom weaving while empowering local
            artisans, especially women. <br /><br /> Specializing in <strong>handwoven textiles,
            Prerana Handloom produces mekhela chadors, gamusas, stoles, cushion
            covers, and other woven home furnishing products</strong> that reflect
            Assam’s rich cultural heritage. <br /><br />
            With training, modern techniques,
            and market support provided by CoE, the society enhances artisans'
            skills, improves product quality, and creates sustainable livelihood
            opportunities. Through its efforts, Prerana Handloom not only
            sustains traditional weaving practices but also helps artisans gain
            better market access, ensuring the growth of Assam’s handloom
            industry.
          </p>
        </div>
        <div className="image-section animated fade-in-left">
          <img
            src="./assets/society-img-2.png"
            alt="about-image"
            className="about-img-2"
          />
        </div>
      </div>
    </div>
  );
}

export default Society;
