import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShoppingBag,
  faShoppingCart,
  faArrowLeft,
  faRuler,
  faLeaf,
  faMapMarkerAlt,
  faBroom,
  faCheck,
  faShareNodes,
  faMagnifyingGlassPlus,
  faMinus,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { productsApi } from "../api/products";
import SmartImage from "./common/SmartImage";
import ImageLightbox from "./common/ImageLightbox";
import "./productDetails.css";

/* ─── Typical sizes by product type ───────────────────────────────────────
   Only ever used when the admin has not entered real dimensions, and always
   labelled as a guide in the UI — these are category norms, not measurements
   of the item in front of the customer.
─────────────────────────────────────────────────────────────────────────── */
const TYPICAL_SIZES = [
  [/hand ?bag|tote/, { length: "30 cm", breadth: "20 cm", height: "10 cm" }],
  [/\bhat\b/, { length: "58 cm", breadth: "58 cm", height: "12 cm" }],
  [/table mat|yoga mat|\bmat\b/, { length: "45 cm", breadth: "30 cm", height: null }],
  [/basket/, { length: "25 cm", breadth: "25 cm", height: "15 cm" }],
  [/runner/, { length: "140 cm", breadth: "36 cm", height: null }],
  [/stole/, { length: "200 cm", breadth: "70 cm", height: null }],
  [/cushion/, { length: "45 cm", breadth: "45 cm", height: null }],
  [/pen stand/, { length: "10 cm", breadth: "10 cm", height: "12 cm" }],
  [/tray/, { length: "30 cm", breadth: "20 cm", height: "4 cm" }],
  [/napkin/, { length: "20 cm", breadth: "10 cm", height: "8 cm" }],
  [/laundry/, { length: "40 cm", breadth: "40 cm", height: "50 cm" }],
  [/storage/, { length: "35 cm", breadth: "35 cm", height: "30 cm" }],
  [/lamp/, { length: "20 cm", breadth: "20 cm", height: "45 cm" }],
  [/mekhela|saree|sador/, { length: "500 cm", breadth: "120 cm", height: null }],
  [/kurta/, { length: "70 cm", breadth: "50 cm", height: null }],
  [/\bbag\b/, { length: "30 cm", breadth: "20 cm", height: "10 cm" }],
];

function resolveDimensions(product) {
  const cm = (value) => (value != null && value !== "" ? `${Number(value)} cm` : null);

  if (product.length_cm != null || product.breadth_cm != null) {
    return {
      length: cm(product.length_cm),
      breadth: cm(product.breadth_cm),
      height: cm(product.height_cm),
      exact: true,
    };
  }

  const name = (product.name || product.title || "").toLowerCase();
  const match = TYPICAL_SIZES.find(([pattern]) => pattern.test(name));
  return match ? { ...match[1], exact: false } : { length: null, breadth: null, height: null, exact: false };
}

function getProductMeta(product) {
  const name = (product.name || product.title || "").toLowerCase();

  let material = "Natural handcrafted fibres";
  if (name.includes("bamboo")) material = "100% natural bamboo";
  else if (/stole|runner|mekhela|sador|kurta/.test(name)) material = "Natural cotton / eri silk";
  else if (name.includes("cushion")) material = "Cotton fabric";
  else if (/bag|hat|basket|mat/.test(name)) material = "Dried water hyacinth";

  /* Origin comes from category_id, which is authoritative.
     3 = Prerana Handloom · 4 = Shristi · 14 = Bamboo (under Shristi) */
  const categoryId = Number(product.category_id);
  const categoryName = (product.category_name || "").toLowerCase();

  let origin;
  if (categoryId === 4 || categoryId === 14 || /shristi|handicraft/.test(categoryName)) {
    origin = "Shristi Handicrafts Co-operative Society";
  } else if (categoryId === 3 || /prerana|handloom/.test(categoryName)) {
    origin = "Prerana Handloom Co-operative Society";
  } else {
    origin = "Shristi & Prerana Co-operative Society";
  }

  let care = "Hand wash gently with mild soap. Air dry in shade.";
  if (name.includes("bamboo")) care = "Wipe with a dry cloth. Avoid prolonged water exposure.";
  else if (/bag|basket|mat|hat/.test(name)) care = "Wipe with a damp cloth. Do not submerge in water.";

  return { material, origin, care };
}

/** Normalise whatever the API returned into a gallery the viewer can page through. */
function buildGallery(product) {
  const seen = new Set();
  const images = [];
  const push = (url, alt) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    images.push({ url, alt: alt || product?.name || "Product image" });
  };

  (product?.images || []).forEach((image) =>
    push(typeof image === "string" ? image : image.url, typeof image === "object" ? image.alt : null)
  );
  push(product?.thumbnail_url);
  return images;
}

function stockState(stock) {
  if (stock == null) return { label: "Available", tone: "ok" };
  if (stock <= 0) return { label: "Out of stock", tone: "out" };
  if (stock <= 5) return { label: `Only ${stock} left`, tone: "low" };
  return { label: "In stock", tone: "ok" };
}

/* ─── Main component ──────────────────────────────────────────────────── */
export default function ProductDetails() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart, getItemQuantity } = useCart();
  const { isAuthenticated } = useAuth();

  /* Paint immediately from the product the grid already had, then replace it
     with authoritative data. Previously this router state was the ONLY source,
     so a refresh or a shared link showed "No product selected". */
  const seeded = location.state?.product;
  const [product, setProduct] = useState(seeded?.slug === slug ? seeded : null);
  const [loading, setLoading] = useState(!product);
  const [error, setError] = useState("");
  const [related, setRelated] = useState([]);

  const [activeImage, setActiveImage] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [copied, setCopied] = useState(false);
  const addedTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    window.scrollTo(0, 0);
    setError("");
    setActiveImage(0);
    setQuantity(1);

    productsApi
      .bySlug(slug)
      .then((data) => {
        if (cancelled) return;
        setProduct(data);
        return productsApi
          .related(data.id, 4)
          .then((res) => !cancelled && setRelated(res.products || []))
          .catch(() => {});
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => () => clearTimeout(addedTimer.current), []);

  const gallery = useMemo(() => buildGallery(product), [product]);
  const dims = useMemo(() => (product ? resolveDimensions(product) : null), [product]);
  const meta = useMemo(() => (product ? getProductMeta(product) : null), [product]);

  const stock = product?.stock ?? null;
  const availability = stockState(stock);
  const soldOut = stock != null && stock <= 0;
  const inCart = product ? getItemQuantity(product.id) : 0;
  const maxAddable = stock != null ? Math.max(0, stock - inCart) : 99;

  const handleAddToCart = useCallback(() => {
    if (!product || soldOut) return;
    addToCart(product, quantity);
    setAdded(true);
    clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 2200);
  }, [addToCart, product, quantity, soldOut]);

  const handleBuyNow = useCallback(() => {
    if (!product || soldOut) return;
    if (!isAuthenticated) {
      // Come back here after signing in instead of dumping them on the home page.
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    navigate("/checkout", {
      state: { buyNowItem: { ...product, quantity } },
    });
  }, [isAuthenticated, location.pathname, navigate, product, quantity, soldOut]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product?.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* the user dismissed the share sheet */
    }
  }, [product?.name]);

  if (loading && !product) {
    return (
      <div className="pd-page">
        <div className="pd-inner">
          <div className="pd-card pd-skeleton-card">
            <div className="pd-sk pd-sk-image" />
            <div className="pd-sk-col">
              <div className="pd-sk pd-sk-line pd-sk-lg" />
              <div className="pd-sk pd-sk-line pd-sk-md" />
              <div className="pd-sk pd-sk-line" />
              <div className="pd-sk pd-sk-line" />
              <div className="pd-sk pd-sk-line pd-sk-sm" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="pd-empty">
        <div className="pd-empty-inner">
          <span className="pd-empty-icon">🧺</span>
          <h2>{error ? "Product unavailable" : "Product not found"}</h2>
          <p>{error || "This product may have been removed or is no longer for sale."}</p>
          <button className="pd-btn pd-btn-primary" onClick={() => navigate("/products")}>
            Browse products
          </button>
        </div>
      </div>
    );
  }

  const price = Number(product.price) || 0;
  const hasDims = dims?.length || dims?.breadth;

  return (
    <div className="pd-page pd-visible">
      <div className="pd-bg-grid" aria-hidden="true" />
      <div className="pd-bg-orb pd-bg-orb--1" aria-hidden="true" />
      <div className="pd-bg-orb pd-bg-orb--2" aria-hidden="true" />

      {lightbox !== null && (
        <ImageLightbox images={gallery} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}

      <div className="pd-inner">
        {/* Breadcrumb */}
        <nav className="pd-breadcrumb" aria-label="Breadcrumb">
          <Link to="/products" className="pd-back-link">
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to products</span>
          </Link>
          {product.category_name && (
            <>
              <span className="pd-breadcrumb-sep">›</span>
              <span className="pd-breadcrumb-cat">{product.category_name}</span>
            </>
          )}
          <span className="pd-breadcrumb-sep">›</span>
          <span className="pd-breadcrumb-current">{product.name}</span>
        </nav>

        <div className="pd-card">
          {/* ── LEFT: gallery ── */}
          <div className="pd-img-panel">
            <div className="pd-img-wrap">
              <button
                type="button"
                className="pd-img-button"
                onClick={() => gallery.length && setLightbox(activeImage)}
                aria-label="View larger image"
                disabled={!gallery.length}
              >
                <SmartImage
                  src={gallery[activeImage]?.url}
                  alt={gallery[activeImage]?.alt || product.name}
                  eager
                  className="pd-img"
                  wrapperClassName="pd-img-placeholder"
                  placeholderLabel="Handcrafted"
                />
                <span className="pd-zoom-hint">
                  <FontAwesomeIcon icon={faMagnifyingGlassPlus} /> Tap to enlarge
                </span>
              </button>

              <div className="pd-handcrafted-badge">
                <FontAwesomeIcon icon={faLeaf} /> Handcrafted
              </div>

              {soldOut && <div className="pd-soldout-ribbon">Sold out</div>}
            </div>

            {/* Thumbnail strip — only worth showing for a real gallery */}
            {gallery.length > 1 && (
              <div className="pd-thumbs" role="tablist" aria-label="Product images">
                {gallery.map((image, index) => (
                  <button
                    key={image.url}
                    type="button"
                    role="tab"
                    aria-selected={index === activeImage}
                    aria-label={`Show image ${index + 1} of ${gallery.length}`}
                    className={`pd-thumb${index === activeImage ? " pd-thumb-active" : ""}`}
                    onClick={() => setActiveImage(index)}
                    onDoubleClick={() => setLightbox(index)}
                  >
                    <SmartImage src={image.url} alt="" wrapperClassName="pd-thumb-placeholder" />
                  </button>
                ))}
              </div>
            )}

            <div className="pd-origin-pill">
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              <span>{meta.origin}</span>
            </div>
          </div>

          {/* ── RIGHT: details ── */}
          <div className="pd-info-panel">
            <div className="pd-title-row">
              <div>
                <h1 className="pd-title">{product.name}</h1>
                <div className={`pd-stock pd-stock--${availability.tone}`}>
                  <span className="pd-stock-dot" aria-hidden="true" />
                  {availability.label}
                </div>
              </div>
              <div className="pd-price-tag">
                <span className="pd-price-label">Price</span>
                <span className="pd-price">₹{price.toLocaleString("en-IN")}</span>
                <span className="pd-price-note">Inclusive of GST</span>
              </div>
            </div>

            {product.description && <p className="pd-desc">{product.description}</p>}

            {/* Dimensions */}
            {hasDims && (
              <div className="pd-dimensions-block">
                <div className="pd-dimensions-title">
                  <FontAwesomeIcon icon={faRuler} />
                  Dimensions
                  {!dims.exact && (
                    <span className="pd-dim-estimated" title="Typical for this type of product">
                      Typical size
                    </span>
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
                  {dims.breadth && (
                    <div className="pd-dim-card">
                      <span className="pd-dim-axis">B</span>
                      <span className="pd-dim-value">{dims.breadth}</span>
                      <span className="pd-dim-label">Breadth</span>
                    </div>
                  )}
                  {dims.height && (
                    <div className="pd-dim-card">
                      <span className="pd-dim-axis">H</span>
                      <span className="pd-dim-value">{dims.height}</span>
                      <span className="pd-dim-label">Height</span>
                    </div>
                  )}
                </div>
                {!dims.exact && (
                  <p className="pd-dim-disclaimer">
                    Each piece is handmade, so sizes vary slightly. Get in touch if you need exact
                    measurements before ordering.
                  </p>
                )}
              </div>
            )}

            {/* Specs */}
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
                  <span className="pd-spec-label">Care instructions</span>
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

            <div className="pd-features">
              {["Eco-friendly", "Handmade", "Sustainable", "Supports artisans"].map((feature) => (
                <span key={feature} className="pd-feature-pill">
                  <FontAwesomeIcon icon={faCheck} /> {feature}
                </span>
              ))}
            </div>

            {/* Quantity + actions */}
            {!soldOut && (
              <div className="pd-qty-row">
                <span className="pd-qty-label">Quantity</span>
                <div className="pd-qty-control">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <FontAwesomeIcon icon={faMinus} />
                  </button>
                  <span className="pd-qty-value" aria-live="polite">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(maxAddable || 1, q + 1))}
                    disabled={quantity >= maxAddable}
                    aria-label="Increase quantity"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                </div>
                {inCart > 0 && (
                  <span className="pd-qty-incart">{inCart} already in your cart</span>
                )}
              </div>
            )}

            <div className="pd-actions">
              <button
                className={`pd-btn pd-btn-cart${added ? " pd-btn-added" : ""}`}
                onClick={handleAddToCart}
                disabled={soldOut || maxAddable <= 0}
              >
                {added ? (
                  <><FontAwesomeIcon icon={faCheck} /> Added to cart</>
                ) : (
                  <><FontAwesomeIcon icon={faShoppingCart} /> Add to cart</>
                )}
              </button>
              <button className="pd-btn pd-btn-primary" onClick={handleBuyNow} disabled={soldOut}>
                <FontAwesomeIcon icon={faShoppingBag} /> {soldOut ? "Sold out" : "Buy now"}
              </button>
              <button className="pd-btn pd-btn-ghost" onClick={handleShare} aria-label="Share this product">
                <FontAwesomeIcon icon={faShareNodes} /> {copied ? "Link copied" : "Share"}
              </button>
            </div>

            {soldOut && (
              <p className="pd-soldout-note">
                This piece is currently sold out. Everything here is handmade in small batches —
                check back soon or <Link to="/contact">contact us</Link> to ask about a new one.
              </p>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="pd-related">
            <h2 className="pd-related-title">You may also like</h2>
            <div className="pd-related-grid">
              {related.map((item) => (
                <Link
                  key={item.id}
                  to={`/products/${item.slug}`}
                  state={{ product: item }}
                  className="pd-related-card"
                >
                  <div className="pd-related-img">
                    <SmartImage
                      src={item.thumbnail_url || item.images?.[0]?.url}
                      alt={item.name}
                      wrapperClassName="pd-related-placeholder"
                    />
                    {item.stock <= 0 && <span className="pd-related-out">Sold out</span>}
                  </div>
                  <h3 className="pd-related-name">{item.name}</h3>
                  <span className="pd-related-price">
                    ₹{Number(item.price).toLocaleString("en-IN")}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
