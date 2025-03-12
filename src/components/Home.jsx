import React from "react";
import Products from "./Products";

function Home() {
  return (
    <div id="container" className="container">
      <div className="content-about">
        <div className="text-section animated fade-in-left">
          <h1>Welcome to <br /> Centre of Excellence</h1>
          <h2 className="text-section-h2">Handloom & Handicrafts</h2>
          <p>
            Explore our products and services. We are dedicated to providing the
            best experience for you.
          </p>
        </div>
        <div className="image-section animated fade-in-right">
          <img src="./assets/home-image.png" alt="home-image" />
        </div>
      </div>
      <div className="scroll-downs">
        <div className="mousey">
          <div className="scroller"></div>
        </div>
      </div>
      <Products />
    </div>
  );
}

export default Home;
