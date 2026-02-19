import { useState, useEffect } from "react";
import React from "react";
import "../App.css";
import "./Shristi.css";

function Shristi() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPopupOpen, setIsPopupOpen]   = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loaded, setLoaded] = useState(false);

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

  useEffect(() => {
    requestAnimationFrame(() => setLoaded(true));

    // Scroll reveal observer
    const revealEls = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
    if (!revealEls.length) return;

    if (!('IntersectionObserver' in window)) {
      revealEls.forEach(el => el.classList.add('revealed'));
      return;
    }

    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.1 }
    );

    revealEls.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  const handleNext = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const handlePrev = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setSelectedImage(null);
  };

  const startIndex = currentSlide * imagesPerPage;
  const visibleImages = galleryImages.slice(startIndex, startIndex + imagesPerPage);

  return (
    <div className={`shristi-page${loaded ? " shristi-loaded" : ""}`}>

      {/* ══════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════ */}
      <section className="shristi-hero">
        <div className="shristi-hero-content">
          
          {/* Text side */}
          <div className="shristi-hero-text reveal-left">
            <span className="shristi-eyebrow">Handicraft Excellence</span>
            <h1 className="shristi-title">
              Shristi Handicraft<br />
              <span className="shristi-title-accent">Co-operative Society</span>
            </h1>
            <div className="shristi-body">
              <p>
                Shristi Handicraft Co-operative Society focuses on empowering artisans by promoting sustainable livelihoods through handcrafted products made from water hyacinth.
              </p>
              <p>
                Water hyacinth, often considered an invasive plant, is skilfully transformed into eco-friendly products such as <strong>baskets, handbags, mats, home décor items, and utility accessories.</strong>
              </p>
              <p>
                Through training, capacity building, and market linkages facilitated by CoE, Shristi Handicraft enhances rural entrepreneurship while promoting sustainable craft practices. Their work not only provides economic opportunities to local artisans, especially women, but also contributes to environmental conservation by utilizing an otherwise problematic aquatic weed.
              </p>
              <p className="shristi-support">
                <strong>Shristi Handicraft Co-operative Society is promoted &amp; supported under Oil CSR Initaitive.</strong>
              </p>
            </div>
          </div>

          {/* Image side */}
          <div className="shristi-hero-img-wrap reveal-right">
            <div className="shristi-hero-img-glow" />
            <img
              src="/assets/shristi-page-banner.png"
              alt="Shristi Handicraft"
              className="shristi-hero-img"
            />
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          DIVIDER PATTERN
      ══════════════════════════════════════════ */}
      <div className="pattern-divider" aria-hidden="true">
        <img src="./assets/divider.png" alt="" className="cloth-pattern-img" />
        <img src="./assets/divider.png" alt="" className="cloth-pattern-img cloth-pattern-img--flip" />
      </div>

      {/* ══════════════════════════════════════════
          GALLERY
      ══════════════════════════════════════════ */}
      <section className="shristi-gallery-section">
        <div className="gallery-header reveal-up">
          <span className="gallery-eyebrow">Our Work</span>
          <h2 className="gallery-title">Gallery</h2>
        </div>

        <div className="gallery-carousel">
          {/* Left arrow */}
          <button
            className="gallery-arrow gallery-arrow-left"
            onClick={handlePrev}
            aria-label="Previous images"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Gallery grid */}
          <div className="gallery-grid">
            {visibleImages.map((image, index) => (
              <div
                key={startIndex + index}
                className="gallery-card reveal-up"
                style={{ animationDelay: `${index * 0.08}s` }}
                onClick={() => handleImageClick(image)}
              >
                <div className="gallery-card-inner">
                  <img src={image} alt={`Gallery ${startIndex + index + 1}`} className="gallery-img" loading="lazy" />
                  <div className="gallery-overlay">
                    <svg className="gallery-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right arrow */}
          <button
            className="gallery-arrow gallery-arrow-right"
            onClick={handleNext}
            aria-label="Next images"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Dots indicator */}
        <div className="gallery-dots">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={idx}
              className={`gallery-dot${idx === currentSlide ? " gallery-dot-active" : ""}`}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          POPUP MODAL
      ══════════════════════════════════════════ */}
      {isPopupOpen && (
        <div className="popup-overlay" onClick={handleClosePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="Gallery fullscreen" className="popup-image" />
            <button className="popup-close" onClick={handleClosePopup} aria-label="Close">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default Shristi;