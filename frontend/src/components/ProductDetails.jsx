import React, { useState, useEffect } from "react";
import "./productDetails.css";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingBag, faShoppingCart, faArrowLeft, faRuler, faLeaf, faMapMarkerAlt, faBroom, faCheck } from "@fortawesome/free-solid-svg-icons";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

/* ─── Fallback dimensions from product name ───────────────────────────── */
function getFallbackDimensions(name = "") {
  const n = name.toLowerCase();
  if (n.includes("hand bag") || n.includes("handbag") || n.includes("bag"))
    return { length: "30 cm", breadth: "20 cm", height: "10 cm" };
  if (n.includes("hat"))
    return { length: "58 cm", breadth: "58 cm", height: "12 cm" };
  if (n.includes("table mat") || n.includes("mat"))
    return { length: "45 cm", breadth: "30 cm", height: null };
  if (n.includes("basket"))
    return { length: "25 cm", breadth: "25 cm", height: "15 cm" };
  if (n.includes("runner"))
    return { length: "140 cm", breadth: "36 cm", height: null };
  if (n.includes("stole"))
    return { length: "200 cm", breadth: "70 cm", height: null };
  if (n.includes("cushion"))
    return { length: "45 cm", breadth: "45 cm", height: null };
  if (n.includes("tote"))
    return { length: "38 cm", breadth: "32 cm", height: "10 cm" };
  if (n.includes("pen stand"))
    return { length: "10 cm", breadth: "10 cm", height: "12 cm" };
  if (n.includes("tray"))
    return { length: "30 cm", breadth: "20 cm", height: "4 cm" };
  if (n.includes("napkin"))
    return { length: "20 cm", breadth: "10 cm", height: "8 cm" };
  if (n.includes("laundry"))
    return { length: "40 cm", breadth: "40 cm", height: "50 cm" };
  if (n.includes("storage"))
    return { length: "35 cm", breadth: "35 cm", height: "30 cm" };
  if (n.includes("lamp"))
    return { length: "20 cm", breadth: "20 cm", height: "45 cm" };
  if (n.includes("yoga mat"))
    return { length: "183 cm", breadth: "61 cm", height: null };
  if (n.includes("mekhela") || n.includes("saree") || n.includes("sador"))
    return { length: "500 cm", breadth: "120 cm", height: null };
  if (n.includes("kurta"))
    return { length: "70 cm", breadth: "50 cm", height: null };
  return { length: null, breadth: null, height: null };
}

/* ─── Resolve dimensions: DB first, fallback second ──────────────────── */
function resolveDimensions(product) {
  const hasDB =
    product.length_cm != null ||
    product.breadth_cm != null;

  if (hasDB) {
    return {
      length:  product.length_cm  ? `${product.length_cm} cm`  : null,
      breadth: product.breadth_cm ? `${product.breadth_cm} cm` : null,
      height:  product.height_cm  ? `${product.height_cm} cm`  : null,
      source: "admin",
    };
  }

  const fb = getFallbackDimensions(product.title || product.name || "");
  return { ...fb, source: "estimated" };
}

/* ─── Other product metadata ──────────────────────────────────────────── */
function getProductMeta(name = "") {
  const n = name.toLowerCase();

  let material = "Natural Handcrafted Fibers";
  if (n.includes("bamboo"))          material = "100% Natural Bamboo";
  else if (n.includes("stole") || n.includes("runner") || n.includes("mekhela") || n.includes("sador") || n.includes("kurta"))
                                     material = "Natural Cotton / Eri Silk Fibers";
  else if (n.includes("cushion"))    material = "Cotton Fabric";
  else if (n.includes("bag") || n.includes("hat") || n.includes("basket") || n.includes("mat"))
                                     material = "Dried Water Hyacinth";

  let origin = "Prerana Handloom Co-operative Society";
  if (n.includes("bag") || n.includes("hat") || n.includes("basket") ||
      n.includes("tray") || n.includes("bamboo") || n.includes("pen stand") ||
      n.includes("napkin") || n.includes("storage") || n.includes("laundry") ||
      n.includes("tote") || n.includes("yoga mat") || n.includes("lamp"))
    origin = "Shristi Handicrafts Co-operative Society";

  let care = "Hand wash gently with mild soap. Air dry in shade.";
  if (n.includes("bamboo"))
    care = "Wipe with a dry cloth. Avoid prolonged water exposure.";
  else if (n.includes("bag") || n.includes("basket") || n.includes("mat") || n.includes("hat"))
    care = "Wipe with a damp cloth. Do not submerge in water.";

  return { material, origin, care };
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
  const [imgError, setImgError] = useState(false);
  const [added, setAdded]       = useState(false);
  const [visible, setVisible]   = useState(false);

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
          <button className="pd-btn pd-btn-primary" onClick={() => navigate("/products")}>Browse Products</button>
        </div>
      </div>
    );
  }

  const title      = product.title || product.name || "Product";
  const imgSrc     = encodeImagePath(product.imgSrc || product.thumbnail_url || "");
  const desc       = product.description || "A beautifully handcrafted product made by skilled artisans.";
  const price      = product.price || 800;
  const dims       = resolveDimensions(product);
  const meta       = getProductMeta(title);
  const hasDims    = dims.length || dims.breadth;

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
      <div className="pd-bg-grid"    aria-hidden="true" />
      <div className="pd-bg-orb pd-bg-orb--1" aria-hidden="true" />
      <div className="pd-bg-orb pd-bg-orb--2" aria-hidden="true" />

      <div className="pd-inner">

        {/* Breadcrumb */}
        <nav className="pd-breadcrumb">
          <button onClick={() => navigate("/products")} className="pd-back-link">
            <FontAwesomeIcon icon={faArrowLeft} /><span>Back to Products</span>
          </button>
          <span className="pd-breadcrumb-sep">›</span>
          <span className="pd-breadcrumb-current">{title}</span>
        </nav>

        {/* Main card */}
        <div className="pd-card">

          {/* LEFT — image */}
          <div className="pd-img-panel">
            <div className="pd-img-wrap">
              {imgError || !imgSrc ? (
                <div className="pd-img-placeholder"><span>🧺</span><p>Handcrafted</p></div>
              ) : (
                <img src={imgSrc} alt={title} className="pd-img" onError={() => setImgError(true)} />
              )}
              <div className="pd-handcrafted-badge">
                <FontAwesomeIcon icon={faLeaf} /> Handcrafted
              </div>
            </div>
            <div className="pd-origin-pill">
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              <span>{meta.origin}</span>
            </div>
          </div>

          {/* RIGHT — info */}
          <div className="pd-info-panel">

            {/* Title + price */}
            <div className="pd-title-row">
              <h1 className="pd-title">{title}</h1>
              <div className="pd-price-tag">
                <span className="pd-price-label">Price</span>
                <span className="pd-price">₹{Number(price).toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Description */}
            <p className="pd-desc">{desc}</p>

            {/* Dimensions */}
            {hasDims && (
              <div className="pd-dimensions-block">
                <div className="pd-dimensions-title">
                  <FontAwesomeIcon icon={faRuler} />
                  Dimensions
                  {dims.source === "estimated" && (
                    <span className="pd-dim-estimated">Approximate</span>
                  )}
                </div>
                <div className="pd-dimensions-grid">
                  {dims.length && (
                    <div className="pd-dim-card">
                      <span className="pd-dim-axis">L</span>
                      <span className="pd-dim-value">{dims.length}</span>
                      <span className="pd-dim-label">Length</span>
                    </div>
                  )}
                  {dims.length && dims.breadth && <div className="pd-dim-divider">×</div>}
                  {dims.breadth && (
                    <div className="pd-dim-card">
                      <span className="pd-dim-axis">B</span>
                      <span className="pd-dim-value">{dims.breadth}</span>
                      <span className="pd-dim-label">Breadth</span>
                    </div>
                  )}
                  {dims.height && (
                    <>
                      <div className="pd-dim-divider">×</div>
                      <div className="pd-dim-card">
                        <span className="pd-dim-axis">H</span>
                        <span className="pd-dim-value">{dims.height}</span>
                        <span className="pd-dim-label">Height</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Specs — Weight removed */}
            <div className="pd-specs">
              <div className="pd-spec-row">
                <div className="pd-spec-icon"><FontAwesomeIcon icon={faLeaf} /></div>
                <div className="pd-spec-content">
                  <span className="pd-spec-label">Material</span>
                  <span className="pd-spec-value">{meta.material}</span>
                </div>
              </div>
              <div className="pd-spec-row">
                <div className="pd-spec-icon"><FontAwesomeIcon icon={faBroom} /></div>
                <div className="pd-spec-content">
                  <span className="pd-spec-label">Care Instructions</span>
                  <span className="pd-spec-value">{meta.care}</span>
                </div>
              </div>
              <div className="pd-spec-row">
                <div className="pd-spec-icon"><FontAwesomeIcon icon={faMapMarkerAlt} /></div>
                <div className="pd-spec-content">
                  <span className="pd-spec-label">Made by</span>
                  <span className="pd-spec-value">{meta.origin}</span>
                </div>
              </div>
            </div>

            {/* Feature pills */}
            <div className="pd-features">
              {["Eco-Friendly", "Handmade", "Sustainable", "Natural Materials", "Supports Artisans"].map(f => (
                <span key={f} className="pd-feature-pill">
                  <FontAwesomeIcon icon={faCheck} /> {f}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="pd-actions">
              <button className={`pd-btn pd-btn-cart${added ? " pd-btn-added" : ""}`} onClick={handleAddToCart}>
                {added
                  ? <><FontAwesomeIcon icon={faCheck} /> Added!</>
                  : <><FontAwesomeIcon icon={faShoppingCart} /> Add to Cart</>
                }
              </button>
              <button className="pd-btn pd-btn-primary" onClick={handleOrderNow}>
                <FontAwesomeIcon icon={faShoppingBag} /> Order Now
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}