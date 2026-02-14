import { useState } from "react";
import React from "react";
import "../App.css";
import "./About.css";
import "./Home.css";
import "./Shristi.css";

function Shristi() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const galleryImages = [
    "./assets/prerana-glry-1.JPG",
    "./assets/prerana-glry-2.JPG",
    "./assets/prerana-glry-3.JPG",
    "./assets/prerana-glry-4.JPG",
    "./assets/prerana-glry-5.JPG",
    "./assets/prerana-glry-6.JPG",
    "./assets/Banner-handloom.jpg",
    "./assets/prerana-glry-8.JPG",
  ];

  const imagesPerPage = 4;
  const totalSlides = Math.ceil(galleryImages.length / imagesPerPage);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setSelectedImage(null);
  };

  const startIndex = currentSlide * imagesPerPage;
  const visibleImages = galleryImages.slice(
    startIndex,
    startIndex + imagesPerPage
  );

  return (
    <div className="container">
      <div className="content">
        <div className="text-section-right animated fade-in-right animated-heading-1 product-heading">
          <h1 className="text-heading">
            Prerana Handloom
            <br />
            Co-operative Society
          </h1>
          <p>
            Prerana Handloom Co-operative Society is dedicated to preserving and
            promoting traditional handloom weaving while empowering local
            artisans, especially women. <br />
            <br /> Specializing in{" "}
            <strong>
              handwoven textiles, Prerana Handloom produces mekhela chadors,
              gamusas, stoles, cushion covers, and other woven home furnishing
              products
            </strong>{" "}
            that reflect Assam’s rich cultural heritage. <br />
            <br />
            With training, modern techniques, and market support provided by
            CoE, the society enhances artisans' skills, improves product
            quality, and creates sustainable livelihood opportunities. Through
            its efforts, Prerana Handloom not only sustains traditional weaving
            practices but also helps artisans gain better market access,
            ensuring the growth of Assam’s handloom industry.
            <br />
            <br />
            <strong>Prerana Handloom Co-operative Society is promoted & supported by Oil India Rural Developement Society (OIRDS).</strong>
          </p>
        </div>
        <div className="image-section animated fade-in-left">
          <img
            src="./assets/prerana-page-banner.png"
            alt="about-image"
            className="about-img-2"
          />
        </div>
      </div>
      <br />
      <div className="img-divider">
        <img src="./assets/divider.png" alt="" className="cloth-pattern-img" />
        <img
          src="./assets/divider.png"
          alt=""
          className="cloth-pattern-img-1"
        />
      </div>
      <h1 className="gallery-text">Gallery</h1>
      <div className="gallery-wrapper">
        <button className="arrow left-arrow" onClick={handlePrev}>
          &#8249;
        </button>
        <div className="gallery-container">
          {visibleImages.map((image, index) => (
            <div
              key={index}
              className="gallery-item"
              onClick={() => handleImageClick(image)}
            >
              <img src={image} alt={`gallery-${index}`} />
            </div>
          ))}
        </div>
        <button className="arrow right-arrow" onClick={handleNext}>
          &#8250;
        </button>
      </div>

      {/* Popup */}
      {isPopupOpen && (
        <div className="popup-overlay" onClick={handleClosePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="popup" className="popup-image" />
            <button className="close-btn" onClick={handleClosePopup}>
              &#10005;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Shristi;
