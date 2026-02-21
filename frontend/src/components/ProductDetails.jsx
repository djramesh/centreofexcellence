import React, { useState, useEffect } from "react";
import "./productDetails.css";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingBag, faShoppingCart, faArrowLeft, faRuler, faWeight, faLeaf, faMapMarkerAlt, faBroom, faCheck } from "@fortawesome/free-solid-svg-icons";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

/* ─── derive extra details from product name ──────────────────────────── */
function getProductDetails(name = "") {
  const n = name.toLowerCase();

  // Dimensions
  let dimensions = { length: "—", breadth: "—", height: null };
  if (n.includes("hand bag") || n.includes("handbag") || n.includes("bag"))
    dimensions = { length: "30 cm", breadth: "20 cm", height: "10 cm" };
  else if (n.includes("hat"))
    dimensions = { length: "58 cm", breadth: "58 cm", height: "12 cm" };
  else if (n.includes("table mat") || n.includes("mat"))
    dimensions = { length: "45 cm", breadth: "30 cm", height: null };
  else if (n.includes("basket"))
    dimensions = { length: "25 cm", breadth: "25 cm", height: "15 cm" };
  else if (n.includes("runner"))
    dimensions = { length: "140 cm", breadth: "36 cm", height: null };
  else if (n.includes("stole"))
    dimensions = { length: "200 cm", breadth: "70 cm", height: null };
  else if (n.includes("cushion"))
    dimensions = { length: "45 cm", breadth: "45 cm", height: null };
  else if (n.includes("tote"))
    dimensions = { length: "38 cm", breadth: "32 cm", height: "10 cm" };
  else if (n.includes("pen stand"))
    dimensions = { length: "10 cm", breadth: "10 cm", height: "12 cm" };
  else if (n.includes("tray"))
    dimensions = { length: "30 cm", breadth: "20 cm", height: "4 cm" };
  else if (n.includes("napkin"))
    dimensions = { length: "20 cm", breadth: "10 cm", height: "8 cm" };
  else if (n.includes("laundry"))
    dimensions = { length: "40 cm", breadth: "40 cm", height: "50 cm" };
  else if (n.includes("storage"))
    dimensions = { length: "35 cm", breadth: "35 cm", height: "30 cm" };
  else if (n.includes("lamp"))
    dimensions = { length: "20 cm", breadth: "20 cm", height: "45 cm" };
  else if (n.includes("yoga mat"))
    dimensions = { length: "183 cm", breadth: "61 cm", height: null };
  else if (n.includes("mekhela") || n.includes("saree") || n.includes("sador"))
    dimensions = { length: "500 cm", breadth: "120 cm", height: null };
  else if (n.includes("kurta"))
    dimensions = { length: "70 cm", breadth: "50 cm", height: null };

  // Material
  let material = "Natural Handcrafted Fibers";
  if (n.includes("bamboo"))          material = "100% Natural Bamboo";
  else if (n.includes("stole") || n.includes("runner") || n.includes("handloom") || n.includes("mekhela") || n.includes("sador") || n.includes("kurta"))
                                     material = "Natural Cotton / Eri Silk Fibers";
  else if (n.includes("cushion"))    material = "Cotton Fabric";
  else if (n.includes("hyacinth") || n.includes("basket") || n.includes("bag") || n.includes("hat") || n.includes("mat"))
                                     material = "Dried Water Hyacinth";

  // Weight
  let weight = "250g";
  if (n.includes("bag"))             weight = "400g";
  else if (n.includes("hat"))        weight = "150g";
  else if (n.includes("mat"))        weight = "200g";
  else if (n.includes("basket"))     weight = "350g";
  else if (n.includes("runner"))     weight = "300g";
  else if (n.includes("stole"))      weight = "180g";
  else if (n.includes("laundry"))    weight = "600g";
  else if (n.includes("yoga mat"))   weight = "1.2 kg";

  // Origin
  let origin = "Prerana Handloom Co-operative Society";
  if (
    n.includes("bag") || n.includes("hat") || n.includes("basket") ||
    n.includes("tray") || n.includes("bamboo") || n.includes("pen stand") ||
    n.includes("napkin") || n.includes("storage") || n.includes("laundry") ||
    n.includes("tote") || n.includes("yoga mat") || n.includes("lamp")
  ) origin = "Shristi Handicrafts Co-operative Society";

  // Care
  let care = "Hand wash gently with mild soap. Air dry in shade.";
  if (n.includes("bamboo"))          care = "Wipe with a dry cloth. Avoid prolonged water exposure.";
  else if (n.includes("bag") || n.includes("basket") || n.includes("mat") || n.includes("hat"))
                                     care = "Wipe with a damp cloth. Do not submerge in water.";

  return { dimensions, material, weight, origin, care };
}

function encodeImagePath(path = "") {
  if (!path) return path;
  if (path.includes("%") || path.startsWith("http")) return path;
  return path.split("/").map((seg) => encodeURIComponent(seg)).join("/");
}

/* ─── Main Component ──────────────────────────────────────────────────── */
export default function ProductDetails() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { addToCart }       = useCart();
  const { isAuthenticated } = useAuth();

  const { product } = location.state || {};
  const [imgError, setImgError]   = useState(false);
  const [added, setAdded]         = useState(false);
  const [visible, setVisible]     = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setTimeout(() => setVisible(true), 60);
  }, []);

  if (!product) {
    return (
      <div className="pd-empty">
        <div className="pd-empty-inner">
          <span className="pd-empty-icon">🧺</span>
          <h2>No Product Selected</h2>
          <p>Please select a product from the products page.</p>
          <button className="pd-btn pd-btn-primary" onClick={() => navigate("/products")}>
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  const title   = product.title || product.name || "Product";
  const imgSrc  = encodeImagePath(product.imgSrc || product.thumbnail_url || "");
  const desc    = product.description || "A beautifully handcrafted product made by skilled artisans.";
  const price   = product.price || 800;
  const details = getProductDetails(title);

  const handleAddToCart = () => {
    addToCart({ ...product, price }, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleOrderNow = () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    addToCart({ ...product, price }, 1);
    navigate("/checkout");
  };

  return (
    <div className={`pd-page${visible ? " pd-visible" : ""}`}>

      {/* ── decorative bg ── */}
      <div className="pd-bg-grid"    aria-hidden="true" />
      <div className="pd-bg-orb pd-bg-orb--1" aria-hidden="true" />
      <div className="pd-bg-orb pd-bg-orb--2" aria-hidden="true" />

      <div className="pd-inner">

        {/* ── Breadcrumb ── */}
        <nav className="pd-breadcrumb">
          <button onClick={() => navigate("/products")} className="pd-back-link">
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to Products</span>
          </button>
          <span className="pd-breadcrumb-sep">›</span>
          <span className="pd-breadcrumb-current">{title}</span>
        </nav>

        {/* ── Main card ── */}
        <div className="pd-card">

          {/* LEFT — image panel */}
          <div className="pd-img-panel">
            <div className="pd-img-wrap">
              {imgError || !imgSrc ? (
                <div className="pd-img-placeholder">
                  <span>🧺</span>
                  <p>Handcrafted</p>
                </div>
              ) : (
                <img
                  src={imgSrc}
                  alt={title}
                  className="pd-img"
                  onError={() => setImgError(true)}
                />
              )}
              {/* floating badge */}
              <div className="pd-handcrafted-badge">
                <FontAwesomeIcon icon={faLeaf} />
                Handcrafted
              </div>
            </div>

            {/* origin pill */}
            <div className="pd-origin-pill">
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              <span>{details.origin}</span>
            </div>
          </div>

          {/* RIGHT — info panel */}
          <div className="pd-info-panel">

            {/* title + price */}
            <div className="pd-title-row">
              <h1 className="pd-title">{title}</h1>
              <div className="pd-price-tag">
                <span className="pd-price-label">Price</span>
                <span className="pd-price">₹{Number(price).toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* description */}
            <p className="pd-desc">{desc}</p>

            {/* ── Dimensions — HERO section ── */}
            <div className="pd-dimensions-block">
              <div className="pd-dimensions-title">
                <FontAwesomeIcon icon={faRuler} />
                Dimensions
              </div>
              <div className="pd-dimensions-grid">
                <div className="pd-dim-card">
                  <span className="pd-dim-axis">L</span>
                  <span className="pd-dim-value">{details.dimensions.length}</span>
                  <span className="pd-dim-label">Length</span>
                </div>
                <div className="pd-dim-divider">×</div>
                <div className="pd-dim-card">
                  <span className="pd-dim-axis">B</span>
                  <span className="pd-dim-value">{details.dimensions.breadth}</span>
                  <span className="pd-dim-label">Breadth</span>
                </div>
                {details.dimensions.height && (
                  <>
                    <div className="pd-dim-divider">×</div>
                    <div className="pd-dim-card">
                      <span className="pd-dim-axis">H</span>
                      <span className="pd-dim-value">{details.dimensions.height}</span>
                      <span className="pd-dim-label">Height</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Specs grid ── */}
            <div className="pd-specs">
              <div className="pd-spec-row">
                <div className="pd-spec-icon"><FontAwesomeIcon icon={faLeaf} /></div>
                <div className="pd-spec-content">
                  <span className="pd-spec-label">Material</span>
                  <span className="pd-spec-value">{details.material}</span>
                </div>
              </div>
              <div className="pd-spec-row">
                <div className="pd-spec-icon"><FontAwesomeIcon icon={faWeight} /></div>
                <div className="pd-spec-content">
                  <span className="pd-spec-label">Weight</span>
                  <span className="pd-spec-value">{details.weight}</span>
                </div>
              </div>
              <div className="pd-spec-row">
                <div className="pd-spec-icon"><FontAwesomeIcon icon={faBroom} /></div>
                <div className="pd-spec-content">
                  <span className="pd-spec-label">Care Instructions</span>
                  <span className="pd-spec-value">{details.care}</span>
                </div>
              </div>
              <div className="pd-spec-row">
                <div className="pd-spec-icon"><FontAwesomeIcon icon={faMapMarkerAlt} /></div>
                <div className="pd-spec-content">
                  <span className="pd-spec-label">Made by</span>
                  <span className="pd-spec-value">{details.origin}</span>
                </div>
              </div>
            </div>

            {/* ── Features pills ── */}
            <div className="pd-features">
              {["Eco-Friendly", "Handmade", "Sustainable", "Natural Materials", "Supports Artisans"].map(f => (
                <span key={f} className="pd-feature-pill">
                  <FontAwesomeIcon icon={faCheck} /> {f}
                </span>
              ))}
            </div>

            {/* ── Action buttons ── */}
            <div className="pd-actions">
              <button
                className={`pd-btn pd-btn-cart${added ? " pd-btn-added" : ""}`}
                onClick={handleAddToCart}
              >
                {added
                  ? <><FontAwesomeIcon icon={faCheck} /> Added!</>
                  : <><FontAwesomeIcon icon={faShoppingCart} /> Add to Cart</>
                }
              </button>
              <button className="pd-btn pd-btn-primary" onClick={handleOrderNow}>
                <FontAwesomeIcon icon={faShoppingBag} />
                Order Now
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}