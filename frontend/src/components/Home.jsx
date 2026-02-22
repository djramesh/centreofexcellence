import React, { useState, useEffect, useRef } from "react";
import Products from "./Products";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import "../App.css";

function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded]             = useState(false);
  const [scrollY, setScrollY]           = useState(0);
  const navigate = useNavigate();

  const slides = [
    { img: "./assets/BambooBanner.jpg",    label: "Bamboo Craft" },
    { img: "./assets/handloomBanner.jpg",  label: "Handloom" },
    { img: "./assets/HyacinthBanner.jpg",  label: "Hyacinth" },
  ];

  /* auto-advance */
  useEffect(() => {
    const t = setInterval(() => {
      setCurrentSlide(p => (p + 1) % slides.length);
    }, 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  /* entrance animation */
  useEffect(() => {
    const id = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(id);
  }, []);

  /* subtle parallax on hero text */
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* scroll-reveal via IntersectionObserver */
  useEffect(() => {
    const targets = document.querySelectorAll(".reveal-up, .reveal-left, .reveal-right");
    if (!("IntersectionObserver" in window)) {
      targets.forEach(el => el.classList.add("revealed"));
      return;
    }
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("revealed"); io.unobserve(e.target); } }),
      { threshold: 0.15 }
    );
    targets.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div id="container" className={`container-fluid${loaded ? " page-loaded" : ""}`}>

      {/* ══════════════════════════════════════════
          HERO SLIDER
      ══════════════════════════════════════════ */}
      <section className="hero-slider" aria-label="Hero banner">

        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`hero-slide${idx === currentSlide ? " hero-slide--active" : ""}`}
            style={{ backgroundImage: `url(${slide.img})` }}
            aria-hidden={idx !== currentSlide}
          >
            <div className="hero-overlay" />
            {/* ken-burns zoom layer */}
            <div
              className="hero-zoom-bg"
              style={{ backgroundImage: `url(${slide.img})` }}
            />
          </div>
        ))}

        {/* hero content */}
        <div
          className="hero-content"
          style={{ transform: `translateY(${scrollY * 0.25}px)` }}
        >
          {/* slide label pill */}
          <div className="hero-pill">
            <span className="hero-pill-dot" />
            {slides[currentSlide].label}
          </div>

          <h1 className="hero-heading">
            Shristi &amp; Prerana<br />
            <span className="hero-heading-accent">Co-operative Society</span>
          </h1>

          <h2 className="hero-subheading">Handicrafts &amp; Handloom</h2>

          <p className="hero-body">
            Explore our products and services. We are dedicated to<br className="br-hide" />
            providing the best experience for you.
          </p>

          <div className="hero-ctas">
            <button className="button hero-cta-primary" onClick={() => navigate("/shristi-handicraft")}>
              Shristi Handicraft
            </button>
            <button className="button-1 hero-cta-ghost" onClick={() => navigate("/prerana-handloom")}>
              Prerana Handloom
            </button>
          </div>
        </div>

        {/* dot indicators */}
        <div className="hero-dots" role="tablist" aria-label="Slide indicators">
          {slides.map((_, idx) => (
            <button
              key={idx}
              role="tab"
              aria-selected={idx === currentSlide}
              className={`hero-dot${idx === currentSlide ? " hero-dot--active" : ""}`}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* scroll cue */}
        <div className="scroll-cue" aria-hidden="true">
          <div className="scroll-cue-line" />
          <span className="scroll-cue-label">Scroll</span>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          EXPLORE STRIP
      ══════════════════════════════════════════ */}
      <section className="explore-strip">
        <div className="explore-img-wrap reveal-left">
          <img src="./assets/explore-img.jpg" alt="Explore our crafts" />
          <div className="explore-img-glow" />
        </div>

        <div className="explore-center reveal-up">
          <span className="explore-eyebrow">Discover</span>
          <h2 className="explore-title">Explore</h2>
          <p className="explore-body">
            Handcrafted with love, each piece tells a story of tradition and artistry.
          </p>
        </div>

        <div className="explore-img-wrap reveal-right">
          <img src="./assets/explore-img.jpg" alt="Explore our handloom" />
          <div className="explore-img-glow explore-img-glow--right" />
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
          BRAND BANNERS
      ══════════════════════════════════════════ */}
      <section className="brand-section">

        {/* Shristi */}
        <article
          className="brand-card reveal-left"
          onClick={() => navigate("/shristi-handicraft")}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === "Enter" && navigate("/shristi-handicraft")}
          aria-label="Go to Shristi Handicraft"
        >
          <div
            className="brand-card-bg"
            style={{ backgroundImage: `url(./assets/Banner.jpg)` }}
          />
          <div className="brand-card-overlay" />
          <div className="brand-card-content">
            <span className="brand-card-eyebrow">Handcrafted</span>
            <h2 className="brand-card-title">Shristi<br />Handicraft</h2>
            <div className="brand-card-cta">
              Know more
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/>
              </svg>
            </div>
          </div>
          <div className="brand-card-shine" />
        </article>

        {/* Prerana */}
        <article
          className="brand-card reveal-right"
          onClick={() => navigate("/prerana-handloom")}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === "Enter" && navigate("/prerana-handloom")}
          aria-label="Go to Prerana Handloom"
        >
          <div
            className="brand-card-bg"
            style={{ backgroundImage: `url(./assets/Banner-handloom.jpg)` }}
          />
          <div className="brand-card-overlay" />
          <div className="brand-card-content">
            <span className="brand-card-eyebrow">Woven with care</span>
            <h2 className="brand-card-title">Prerana<br />Handloom</h2>
            <div className="brand-card-cta">
              Know more
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/>
              </svg>
            </div>
          </div>
          <div className="brand-card-shine" />
        </article>

      </section>
      <Products />

    </div>
  );
}

export default Home;