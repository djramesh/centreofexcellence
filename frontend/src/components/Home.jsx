import React, { useState, useEffect } from "react";
import Products from "./Products";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import "../App.css"

function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const slides = [
    "./assets/BambooBanner.jpg",
    "./assets/handloomBanner.jpg",
    "./assets/HyacinthBanner.jpg",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const handleShristiClick = () => {
    navigate("/shristi-handicraft");
  };

  const handlePreranaClick = () => {
    navigate("/prerana-handloom");
  };

  return (
    <div id="container" className="container-fluid">
      <div className="banner-slider">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`slide ${index === currentSlide ? "active" : ""}`}
            style={{ backgroundImage: `url(${slide})` }}
          >
            <div className="overlay"></div>
            <div className="content-about-1">
              <div className="text-section">
                {/* <h2 className="text-section-h2">Welcome to</h2> */}
                <h1 className="text-heading">
                  Shristi & Prerana <br />
                  Co-operative Society
                </h1>
                <h2 className="text-section-h2">Handicrafts & Handloom</h2>
                <p>
                  Explore our products and services. We are dedicated to
                  providing the best experience for you.
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="explore-section">
        <div className="explore-img">
          <img src="./assets/explore-img.jpg" alt="" />
        </div>
        <div>
          <h1>Explore</h1>
        </div>
        <div className="explore-img">
          <img src="./assets/explore-img-1.jpg" alt="" />
        </div>
      </div>
      <div className="banner-container">
        <div className="banner-image" onClick={handleShristiClick}>
          <div
            className="banner-img"
            style={{ backgroundImage: `url(./assets/Banner.jpg)` }}
          >
            <div className="overlay"></div>
            <div className="banner-text">
              <h2>Shristi Handicratf</h2>
              <p>
                Explore{" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  class="bi bi-arrow-right"
                  viewBox="0 0 16 16"
                >
                  <path
                    fill-rule="evenodd"
                    d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"
                  />
                </svg>
              </p>
            </div>
          </div>
        </div>
        <div className="img-divider">
        <img src="./assets/divider.png" alt="" className="cloth-pattern-img" />
        <img
          src="./assets/divider.png"
          alt=""
          className="cloth-pattern-img-1"
        />
      </div>
        <div className="banner-image" onClick={handlePreranaClick}>
          <div
            className="banner-img"
            style={{ backgroundImage: `url(./assets/Banner-handloom.jpg)` }}
          >
            <div className="overlay"></div>
            <div className="banner-text">
              <h2>Prerana Handloom</h2>
              <p>
                Explore{" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  class="bi bi-arrow-right"
                  viewBox="0 0 16 16"
                >
                  <path
                    fill-rule="evenodd"
                    d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"
                  />
                </svg>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Products />
    </div>
  );
}

export default Home;
