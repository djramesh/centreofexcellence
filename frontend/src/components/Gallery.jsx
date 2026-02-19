import React, { useState, useEffect, useCallback } from "react";
import "./Gallery.css";

/* ─── Image catalogue ──────────────────────────────────────────── */
const ALL_ITEMS = [
  // Artisans
  { id: 1,  src: "./assets/gallery/hardworkingartisan.jpg", cat: "artisans", caption: "Skilled Artisan at Work" },
  { id: 2,  src: "./assets/gallery/matinmaking.jpg",        cat: "artisans", caption: "Mat Making Process" },
  { id: 3,  src: "./assets/gallery/pasting.jpg",            cat: "artisans", caption: "Crafting with Care" },
  { id: 4,  src: "./assets/gallery/sharpening2.jpg",        cat: "artisans", caption: "Tool Sharpening" },
  // Prerana
  { id: 5,  src: "./assets/gallery/prerana-glry-2.jpg",     cat: "prerana",  caption: "Prerana Handloom Collection" },
  { id: 6,  src: "./assets/gallery/prerana-glry-3.jpg",     cat: "prerana",  caption: "Prerana Weave Detail" },
  { id: 7,  src: "./assets/gallery/prerana-glry-5.jpg",     cat: "prerana",  caption: "Natural Dye Textile" },
  { id: 8,  src: "./assets/gallery/prerana-glry-6.jpg",     cat: "prerana",  caption: "Prerana Textile Art" },
  // Shristi
  { id: 9,  src: "./assets/gallery/shristi-1.jpg",          cat: "shristi",  caption: "Shristi Handicraft" },
  { id: 10, src: "./assets/gallery/shristi-2.jpg",          cat: "shristi",  caption: "Shristi Collective" },
  { id: 11, src: "./assets/gallery/shristi-4.jpg",          cat: "shristi",  caption: "Shristi Artisan Work" },
  // Events (was products — IMG_5xxx files)
  { id: 12, src: "./assets/gallery/img_5595.jpg",  cat: "events", caption: "Centre of Excellence Event" },
  { id: 13, src: "./assets/gallery/img_5683.jpg",  cat: "events", caption: "Community Gathering" },
  { id: 14, src: "./assets/gallery/img_5702.jpg",  cat: "events", caption: "Centre of Excellence Event" },
  { id: 15, src: "./assets/gallery/img_5730.jpg",  cat: "events", caption: "Skill Development Session" },
  { id: 16, src: "./assets/gallery/img_5736.jpg",  cat: "events", caption: "Women's Collective Meet" },
  { id: 17, src: "./assets/gallery/img_5760.jpg",  cat: "events", caption: "Craft Workshop" },
  { id: 18, src: "./assets/gallery/img_5764.jpg",  cat: "events", caption: "CoE Exhibition" },
  { id: 19, src: "./assets/gallery/img_5767.jpg",  cat: "events", caption: "Artisan Showcase" },
  { id: 20, src: "./assets/gallery/img_5771.jpg",  cat: "events", caption: "Community Celebration" },
  // Products (was events — IMG-2023/2024 WhatsApp files)
  { id: 21, src: "./assets/gallery/img-20230202-wa0032.jpg", cat: "products", caption: "Bamboo Craft Product" },
  { id: 22, src: "./assets/gallery/img-20230220-wa0049.jpg", cat: "products", caption: "Sustainable Home Decor" },
  { id: 23, src: "./assets/gallery/img-20240817-wa0121.jpg", cat: "products", caption: "Bamboo Craft Product" },
  { id: 24, src: "./assets/gallery/img-20240830-wa0122.jpg", cat: "products", caption: "Sustainable Home Decor" },
  { id: 25, src: "./assets/gallery/img-20240830-wa0125.jpg", cat: "products", caption: "Bamboo Craft Product" },
  { id: 26, src: "./assets/gallery/img-20240830-wa0130.jpg", cat: "products", caption: "Sustainable Home Decor" },
  { id: 27, src: "./assets/gallery/img-20240830-wa0138.jpg", cat: "products", caption: "Bamboo Craft Product" },
  { id: 28, src: "./assets/gallery/img-20240926-wa0199.jpg", cat: "products", caption: "Sustainable Home Decor" },
  { id: 29, src: "./assets/gallery/img-20240926-wa0235.jpg", cat: "products", caption: "Bamboo Craft Product" },
  { id: 30, src: "./assets/gallery/img-20240926-wa0298.jpg", cat: "products", caption: "Sustainable Home Decor" },
];

const FILTERS = [
  { id: "all",      label: "All",        emoji: "✦" },
  { id: "artisans", label: "Artisans",   emoji: "🤲" },
  { id: "prerana",  label: "Prerana",    emoji: "🧵" },
  { id: "shristi",  label: "Shristi",    emoji: "🌿" },
  { id: "events",   label: "Events",     emoji: "📸" },
  { id: "products", label: "Products",   emoji: "🛍" },
];

export default function Gallery() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [lightbox, setLightbox]         = useState(null);
  const [loaded, setLoaded]             = useState({});

  const filtered = activeFilter === "all"
    ? ALL_ITEMS
    : ALL_ITEMS.filter(i => i.cat === activeFilter);

  /* ── Scroll reveal ── */
  useEffect(() => {
    const els = document.querySelectorAll(".g-reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach(el => el.classList.add("g-revealed"));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("g-revealed"); io.unobserve(e.target); }
      });
    }, { threshold: 0.06 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [activeFilter]);

  /* ── Keyboard nav ── */
  const handleKey = useCallback(e => {
    if (lightbox === null) return;
    if (e.key === "Escape")     setLightbox(null);
    if (e.key === "ArrowRight") setLightbox(i => (i + 1) % filtered.length);
    if (e.key === "ArrowLeft")  setLightbox(i => (i - 1 + filtered.length) % filtered.length);
  }, [lightbox, filtered.length]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  /* ── Body scroll lock ── */
  useEffect(() => {
    document.body.style.overflow = lightbox !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

  return (
    <div className="gallery-page">

      {/* ══ HERO ═══════════════════════════════════════════════ */}
      <section className="g-hero">
        <div className="g-hero-grid" aria-hidden="true" />
        <div className="g-hero-orb g-hero-orb--1" aria-hidden="true" />
        <div className="g-hero-orb g-hero-orb--2" aria-hidden="true" />

        <div className="g-hero-content">
          <div className="g-eyebrow-pill">
            <span className="g-eyebrow-dot" />
            Visual Stories
          </div>

          <h1 className="g-hero-title">
            Our <span className="g-gradient-text">Gallery</span>
          </h1>

          <p className="g-hero-sub">
            A window into the heart of our artisan communities — the hands,
            the craft, and the culture that define every product we make.
          </p>

          <div className="g-hero-stats">
            <div className="g-stat">
              <span className="g-stat-num">30+</span>
              <span className="g-stat-label">Moments</span>
            </div>
            <div className="g-stat-divider" />
            <div className="g-stat">
              <span className="g-stat-num">2</span>
              <span className="g-stat-label">Societies</span>
            </div>
            <div className="g-stat-divider" />
            <div className="g-stat">
              <span className="g-stat-num">5</span>
              <span className="g-stat-label">Categories</span>
            </div>
          </div>
        </div>

        {/* Floating preview strip */}
        <div className="g-hero-strip" aria-hidden="true">
          {ALL_ITEMS.slice(0, 6).map((item, i) => (
            <div key={item.id} className="g-strip-frame" style={{ animationDelay: `${i * 0.1}s` }}>
              <img src={item.src} alt="" />
            </div>
          ))}
        </div>
      </section>

      {/* ══ FILTER BAR ════════════════════════════════════════ */}
      <section className="g-filter-bar">
        <div className="g-filter-inner">
          {FILTERS.map(f => {
            const count = f.id === "all" ? ALL_ITEMS.length : ALL_ITEMS.filter(i => i.cat === f.id).length;
            return (
              <button
                key={f.id}
                className={`g-filter-btn${activeFilter === f.id ? " active" : ""}`}
                onClick={() => setActiveFilter(f.id)}
              >
                <span className="g-filter-emoji">{f.emoji}</span>
                {f.label}
                <span className="g-filter-count">{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ══ MASONRY GRID ══════════════════════════════════════ */}
      <section className="g-grid-section">
        <div className="g-masonry">
          {filtered.map((item, idx) => (
            <div
              key={item.id}
              className="g-card g-reveal"
              style={{ animationDelay: `${(idx % 5) * 0.06}s` }}
              onClick={() => setLightbox(idx)}
              tabIndex={0}
              role="button"
              aria-label={`Open ${item.caption}`}
              onKeyDown={e => e.key === "Enter" && setLightbox(idx)}
            >
              <div className="g-card-inner">
                {!loaded[item.id] && <div className="g-card-skeleton" />}
                <img
                  src={item.src}
                  alt={item.caption}
                  loading="lazy"
                  className={`g-card-img${loaded[item.id] ? " loaded" : ""}`}
                  onLoad={() => setLoaded(p => ({ ...p, [item.id]: true }))}
                />
                <div className="g-card-overlay">
                  <span className="g-card-caption">{item.caption}</span>
                  <span className="g-card-badge">{item.cat}</span>
                  <div className="g-card-zoom-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35M11 8v6M8 11h6"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ LIGHTBOX ══════════════════════════════════════════ */}
      {lightbox !== null && (
        <div
          className="g-lightbox"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          <div className="g-lb-inner" onClick={e => e.stopPropagation()}>

            {/* Close */}
            <button className="g-lb-close" onClick={() => setLightbox(null)} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>

            {/* Prev */}
            <button
              className="g-lb-arrow g-lb-arrow--prev"
              onClick={() => setLightbox(i => (i - 1 + filtered.length) % filtered.length)}
              aria-label="Previous image"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>

            {/* Image */}
            <div className="g-lb-img-wrap">
              <img
                key={filtered[lightbox].id}
                src={filtered[lightbox].src}
                alt={filtered[lightbox].caption}
                className="g-lb-img"
              />
            </div>

            {/* Next */}
            <button
              className="g-lb-arrow g-lb-arrow--next"
              onClick={() => setLightbox(i => (i + 1) % filtered.length)}
              aria-label="Next image"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>

            {/* Footer */}
            <div className="g-lb-footer">
              <div className="g-lb-footer-left">
                <span className="g-lb-caption">{filtered[lightbox].caption}</span>
                <span className="g-lb-cat-tag">{filtered[lightbox].cat}</span>
              </div>
              <span className="g-lb-counter">{lightbox + 1} / {filtered.length}</span>
            </div>
          </div>

          {/* Thumbnail strip at bottom */}
          <div className="g-lb-thumbs" onClick={e => e.stopPropagation()}>
            {filtered.map((item, idx) => (
              <button
                key={item.id}
                className={`g-lb-thumb${idx === lightbox ? " active" : ""}`}
                onClick={() => setLightbox(idx)}
                aria-label={item.caption}
              >
                <img src={item.src} alt={item.caption} loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}