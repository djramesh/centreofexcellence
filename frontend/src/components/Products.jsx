import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import "./Products.css";
import "./Common.css";
import "./Order.jsx";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingBag, faShoppingCart } from "@fortawesome/free-solid-svg-icons";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

/* ─── Static product data ─────────────────────────────────────────────── */
const waterHyacinthProducts = [
  { id: 1,  title: "Hand Bag",   price: 1200, imgSrc: "../assets/hand-bag-1.jpg",   description: "Water hyacinth bags are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant." },
  { id: 2,  title: "Hand Bag",   price: 1100, imgSrc: "../assets/hand-bag-2.jpg",   description: "Water hyacinth bags are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant." },
  { id: 3,  title: "Hand Bag",   price: 1150, imgSrc: "../assets/hand-bag-3.jpg",   description: "Water hyacinth bags are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant." },
  { id: 4,  title: "Hand Bag",   price: 1050, imgSrc: "../assets/hand-bag-4.jpg",   description: "Water hyacinth bags are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant." },
  { id: 5,  title: "Hand Bag",   price: 1300, imgSrc: "../assets/hand-bag-5.jpg",   description: "Water hyacinth bags are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant." },
  { id: 6,  title: "Hand Bag",   price: 1250, imgSrc: "../assets/hand-bag-6.jpg",   description: "Water hyacinth bags are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant." },
  { id: 7,  title: "Hat",        price: 650,  imgSrc: "../assets/hat-1.jpg",         description: "Water hyacinth Hats are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant." },
  { id: 8,  title: "Table Mat",  price: 450,  imgSrc: "../assets/table-mat-1.jpg",   description: "Water hyacinth table mats are a charming and sustainable addition to any dining space." },
  { id: 9,  title: "Table Mat",  price: 420,  imgSrc: "../assets/table-mat-2.jpg",   description: "Water hyacinth table mats are a charming and sustainable addition to any dining space." },
  { id: 10, title: "Table Mat",  price: 480,  imgSrc: "../assets/tablemat-3.jpg",    description: "Water hyacinth table mats are a charming and sustainable addition to any dining space." },
  { id: 11, title: "Basket",     price: 850,  imgSrc: "../assets/basket-1.jpg",      description: "Water hyacinth baskets are a beautiful and sustainable craft." },
];

const bambooProducts = [
  { id: 12, title: "Bamboo Bag", price: 950, imgSrc: "../assets/bamboo-bag-1.jpg", description: "Bamboo bags are eco-friendly, stylish accessories crafted from natural bamboo fibers." },
  { id: 13, title: "Bamboo Bag", price: 900, imgSrc: "../assets/bamboo-bag-2.jpg", description: "Bamboo bags are eco-friendly, stylish accessories crafted from natural bamboo fibers." },
];

const handloomProducts = [
  { id: 14, title: "Stole",      price: 1400, imgSrc: "../assets/handloom1.jpg",   description: "Crafted from natural fibers, uniquely colored using plant-based dyes lending it a soft, earthy palette." },
  { id: 15, title: "Stole",      price: 1350, imgSrc: "../assets/handloom2.jpg",   description: "Crafted from natural fibers, uniquely colored using plant-based dyes lending it a soft, earthy palette." },
  { id: 16, title: "Stole",      price: 1500, imgSrc: "../assets/glry-6.jpg",      description: "Crafted from natural fibers, uniquely colored using plant-based dyes lending it a soft, earthy palette." },
  { id: 17, title: "Runner Set", price: 1800, imgSrc: "../assets/handloom4.jpg",   description: "Exquisite textile pieces that bring warmth to any dining or living space." },
  { id: 18, title: "Runner Set", price: 1750, imgSrc: "../assets/handloom5.jpg",   description: "Exquisite textile pieces that bring warmth to any dining or living space." },
  { id: 19, title: "Runner Set", price: 1700, imgSrc: "../assets/handloom6.jpg",   description: "Exquisite textile pieces that bring warmth to any dining or living space." },
  { id: 20, title: "Runner Set", price: 1850, imgSrc: "../assets/handloom7.jpg",   description: "Exquisite textile pieces that bring warmth to any dining or living space." },
  { id: 21, title: "Runner Set", price: 1800, imgSrc: "../assets/handloom8.jpg",   description: "Exquisite textile pieces that bring warmth to any dining or living space." },
  { id: 22, title: "Runner Set", price: 1900, imgSrc: "../assets/handloom10.jpg",  description: "Exquisite textile pieces that bring warmth to any dining or living space." },
];

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function encodeImagePath(path = "") {
  if (!path) return path;
  if (path.includes("%") || path.startsWith("http")) return path;
  return path.split("/").map((seg) => encodeURIComponent(seg)).join("/");
}

function getProductType(name = "") {
  return name.replace(/\s*\(.*?\)\s*/g, "").trim();
}

function buildCategories(products, nameKey = "title") {
  const seen = new Set();
  const cats = [{ id: "all", label: "All" }];
  products.forEach((p) => {
    const type = getProductType(p[nameKey] || "");
    if (type && !seen.has(type)) {
      seen.add(type);
      cats.push({ id: type, label: type });
    }
  });
  return cats;
}

/* ─── Custom hook: observe + reveal elements in a container ───────────── */
/**
 * Re-runs the observer whenever `deps` change (e.g. after DB products load).
 * Also sets a 600ms fallback that reveals everything in case the observer
 * never fires (elements already in viewport, or browser quirk).
 */
function useReveal(containerRef, deps = []) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Collect all un-revealed elements
    const els = Array.from(container.querySelectorAll(".reveal:not(.revealed)"));
    if (!els.length) return;

    // Fallback: reveal all after 600ms regardless
    const fallback = setTimeout(() => {
      els.forEach((el) => el.classList.add("revealed"));
    }, 600);

    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("revealed"));
      clearTimeout(fallback);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            io.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0,          // trigger as soon as 1px is visible
        rootMargin: "0px 0px -40px 0px", // reveal slightly before bottom edge
      }
    );

    els.forEach((el) => io.observe(el));

    return () => {
      clearTimeout(fallback);
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* ─── API helper ──────────────────────────────────────────────────────── */
const API_BASE = import.meta.env.VITE_API_URL || "";

async function fetchCategoryProducts(categoryId, page = 1, limit = 50) {
  const res = await fetch(
    `${API_BASE}/api/products/category/${categoryId}?page=${page}&limit=${limit}`
  );
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  return res.json();
}

/* ─── CategoryFilter ──────────────────────────────────────────────────── */
function CategoryFilter({ categories, active, onChange }) {
  return (
    <div className="category-filter">
      {categories.map((cat) => (
        <button
          key={cat.id}
          className={`category-filter-btn${active === cat.id ? " active" : ""}`}
          onClick={() => onChange(cat.id)}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

/* ─── ProductCard ─────────────────────────────────────────────────────── */
function ProductCard({ product, onAddToCart, onOrderNow, index }) {
  const price  = product.price || 800;
  const title  = product.title || product.name;
  const desc   = product.description || "";
  const imgSrc = encodeImagePath(product.imgSrc || product.thumbnail_url || "");
  const [imgError, setImgError] = useState(false);

  return (
    <div className="pc-card" style={{ animationDelay: `${(index % 4) * 0.07}s` }}>
      <div className="pc-img-wrap">
        {imgError || !imgSrc ? (
          <div className="pc-img-placeholder">
            <span className="pc-img-placeholder-icon">🧺</span>
            <span className="pc-img-placeholder-text">Handcrafted</span>
          </div>
        ) : (
          <img
            src={imgSrc}
            alt={title}
            className="pc-img"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}
        <div className="pc-img-overlay" />
        <div className="pc-hover-actions">
          <button className="pc-action-btn pc-cart-btn" onClick={(e) => onAddToCart(e, product)} aria-label="Add to cart">
            <FontAwesomeIcon icon={faShoppingCart} />
            <span>Add to Cart</span>
          </button>
          <button className="pc-action-btn pc-order-btn" onClick={(e) => onOrderNow(e, product)} aria-label="Order now">
            <FontAwesomeIcon icon={faShoppingBag} />
            <span>Order Now</span>
          </button>
        </div>
        <div className="pc-badge">Handcrafted</div>
      </div>
      <div className="pc-body">
        <h4 className="pc-title">{title}</h4>
        <p className="pc-desc">{desc}</p>
        <div className="pc-footer">
          <span className="pc-price">₹{Number(price).toLocaleString("en-IN")}</span>
          <div className="pc-footer-btns">
            <button className="pc-btn-ghost" onClick={(e) => onAddToCart(e, product)}>
              <FontAwesomeIcon icon={faShoppingCart} />
            </button>
            <button className="pc-btn-primary" onClick={(e) => onOrderNow(e, product)}>
              Order Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── SectionHeader ───────────────────────────────────────────────────── */
function SectionHeader({ section, gradient }) {
  return (
    <div className={`section-header section-header--${gradient}`}>
      <div className="section-header-inner">
        <span className="section-eyebrow">{section.eyebrow}</span>
        <h2 className="section-title">{section.label} Products</h2>
        {section.subLabel && (
          <p className="section-sublabel">
            {section.icon && <img src={section.icon} alt="" className="section-icon" />}
            {section.subLabel}
          </p>
        )}
      </div>
      {section.decorImgs?.map((src, i) => (
        <img key={i} src={src} alt="" className={`section-decor section-decor--${i}`} aria-hidden="true" />
      ))}
    </div>
  );
}

/* ─── StaticSection ───────────────────────────────────────────────────── */
function StaticSection({ section, si, onAddToCart, onOrderNow }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const sectionRef = useRef(null);

  const categories = useMemo(() => buildCategories(section.products, "title"), [section.products]);

  const filtered = useMemo(() =>
    activeFilter === "all"
      ? section.products
      : section.products.filter((p) => getProductType(p.title) === activeFilter),
    [activeFilter, section.products]
  );

  // Re-run reveal when filter changes (new cards mount)
  useReveal(sectionRef, [filtered]);

  return (
    <section id={section.id} className="product-section" ref={sectionRef}>
      <div className="reveal">
        <SectionHeader section={section} gradient={si % 2 === 0 ? "a" : "b"} />
      </div>
      {categories.length > 2 && (
        <div className="reveal">
          <CategoryFilter categories={categories} active={activeFilter} onChange={setActiveFilter} />
        </div>
      )}
      <div className="pc-grid">
        {filtered.map((product, idx) => (
          <div className="reveal" key={product.id} style={{ animationDelay: `${(idx % 4) * 0.06}s` }}>
            <ProductCard product={product} onAddToCart={onAddToCart} onOrderNow={onOrderNow} index={idx} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── DBSection — fetches Prerana / Shristi from API ─────────────────── */
function DBSection({ section, si, categoryId, onAddToCart, onOrderNow }) {
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const sectionRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setActiveFilter("all");
    fetchCategoryProducts(categoryId)
      .then((data) => setProducts(data.products || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [categoryId]);

  const categories = useMemo(() => buildCategories(products, "name"), [products]);

  const filtered = useMemo(() =>
    activeFilter === "all"
      ? products
      : products.filter((p) => getProductType(p.name) === activeFilter),
    [activeFilter, products]
  );

  // Re-run reveal after products load AND after filter changes
  useReveal(sectionRef, [loading, filtered]);

  return (
    <section id={section.id} className="product-section" ref={sectionRef}>
      <div className="reveal">
        <SectionHeader section={section} gradient={si % 2 === 0 ? "a" : "b"} />
      </div>

      {loading && (
        <div className="products-loading">Loading {section.label} products…</div>
      )}
      {error && (
        <div className="products-error">Could not load products: {error}</div>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          {categories.length > 2 && (
            <div className="reveal">
              <CategoryFilter
                categories={categories}
                active={activeFilter}
                onChange={setActiveFilter}
              />
            </div>
          )}
          <div className="pc-grid">
            {filtered.map((product, idx) => (
              <div className="reveal" key={product.id} style={{ animationDelay: `${(idx % 4) * 0.06}s` }}>
                <ProductCard
                  product={{ ...product, title: product.name, imgSrc: product.thumbnail_url }}
                  onAddToCart={onAddToCart}
                  onOrderNow={onOrderNow}
                  index={idx}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="products-empty">No products available yet.</div>
      )}
    </section>
  );
}

/* ─── Section config ──────────────────────────────────────────────────── */
const SECTIONS = [
  {
    id: "hyacinth", label: "Water Hyacinth", eyebrow: "Eco Crafts", fromDB: false,
    products: waterHyacinthProducts,
    decorImgs: ["../assets/water-hyacinth-products2.png","../assets/water-hyacinth-products1.png","../assets/water-hyacinth-products.png"],
    icon: "../assets/water-hyacinth.png", subLabel: "Water Hyacinth Products",
  },
  {
    id: "bamboo", label: "Bamboo", eyebrow: "Sustainable", fromDB: false,
    products: bambooProducts,
    decorImgs: [], icon: "../assets/bamboo-image.png", subLabel: "Bamboo Products",
  },
  {
    id: "prerana", label: "Prerana", eyebrow: "Community Crafts", fromDB: true, categoryId: 3,
    decorImgs: [], subLabel: "Prerana Community Crafts",
  },
  {
    id: "shristi", label: "Shristi", eyebrow: "Women's Collective", fromDB: true, categoryId: 4,
    decorImgs: [], subLabel: "Shristi Community Crafts",
  },
  {
    id: "handloom", label: "Handloom", eyebrow: "Traditional Weave", fromDB: false,
    products: handloomProducts,
    decorImgs: ["../assets/handloom-img.png","../assets/handloom-img-1.png","../assets/handloom-img-3.png"],
    subLabel: "Handloom Products",
  },
];

/* ─── Products (main component) ──────────────────────────────────────── */
function Products() {
  const { addToCart }       = useCart();
  const { isAuthenticated } = useAuth();
  const navigate            = useNavigate();

  const handleAddToCart = useCallback((e, product) => {
    e.preventDefault(); e.stopPropagation();
    addToCart({ ...product, price: product.price || 800 }, 1);
  }, [addToCart]);

  const handleOrderNow = useCallback((e, product) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { navigate("/login"); return; }
    addToCart({ ...product, price: product.price || 500 }, 1);
    navigate("/checkout");
  }, [isAuthenticated, addToCart, navigate]);

  return (
    <div id="products" className="products-wrap">
      <div className="products-page-hero">
        <span className="products-page-eyebrow">Our Collection</span>
        <h1 className="products-page-title">Products</h1>
        <p className="products-page-sub">Handcrafted with tradition. Designed for today.</p>

        <nav className="section-nav" aria-label="Jump to section">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="section-nav-link">
              {s.label}
            </a>
          ))}
        </nav>
      </div>

      {SECTIONS.map((section, si) =>
        section.fromDB ? (
          <DBSection
            key={section.id}
            section={section}
            si={si}
            categoryId={section.categoryId}
            onAddToCart={handleAddToCart}
            onOrderNow={handleOrderNow}
          />
        ) : (
          <StaticSection
            key={section.id}
            section={section}
            si={si}
            onAddToCart={handleAddToCart}
            onOrderNow={handleOrderNow}
          />
        )
      )}
    </div>
  );
}

export default Products;