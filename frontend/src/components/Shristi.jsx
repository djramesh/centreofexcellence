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
    "./assets/shristi-1.jpg",
    "./assets/shristi-2.jpg",
    "./assets/shristi-4.JPG",
    "./assets/shristi-5.jpg",
    "./assets/shristi-6.jpg",
    "./assets/shristi-7.JPG",
    "./assets/shristi-11.JPG",
    "./assets/shristi-13.jpg",
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
        <div className="text-section-right animated fade-in-left">
          <h1 className="text-heading">
            Shristi Handicraft
            <br />
            Co-operative Society
          </h1>
          <p>
            Shristi Handicraft Co-operative Society focuses on empowering
            artisans by promoting sustainable livelihoods through handcrafted
            products made from water hyacinth. <br /> <br /> Water hyacinth,
            often considered an invasive plant, is skilfully transformed into
            eco-friendly products such as{" "}
            <strong>
              baskets, handbags, mats, home décor items, and utility
              accessories.
            </strong>
            <br />
            <br />
            Through training, capacity building, and market linkages facilitated
            by CoE, Shristi Handicraft enhances rural entrepreneurship while
            promoting sustainable craft practices. Their work not only provides
            economic opportunities to local artisans, especially women, but also
            contributes to environmental conservation by utilizing an otherwise
            problematic aquatic weed.
            <br />
            <br />
            <strong>Shristi Handicraft Co-operative Society is promoted & supported by Oil India Rural Developement Society (OIRDS).</strong>
          </p>
        </div>
        <div className="image-section animated animated-heading-1 fade-in-right">
          <img
            src="/assets/shristi-page-banner.png"
            alt="about-image"
            className="about-img"
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
