import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import "./Products.css";
import "./Common.css";
import "./Order.jsx";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingBag, faShoppingCart, faSearch, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

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

/* ─── Reveal hook ─────────────────────────────────────────────────────── */
function useReveal(containerRef, deps = []) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const els = Array.from(container.querySelectorAll(".reveal:not(.revealed)"));
    if (!els.length) return;
    const fallback = setTimeout(() => els.forEach((el) => el.classList.add("revealed")), 600);
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
      { threshold: 0, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => { clearTimeout(fallback); io.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* ─── API ─────────────────────────────────────────────────────────────── */
const API_BASE = import.meta.env.VITE_API_URL || "";

async function fetchCategoryProducts(categoryId, page = 1, limit = 100) {
  const res = await fetch(`${API_BASE}/api/products/category/${categoryId}?page=${page}&limit=${limit}`);
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
  const price    = product.price || 800;
  const title    = product.title || product.name;
  const desc     = product.description || "";
  const imgSrc   = encodeImagePath(product.imgSrc || product.thumbnail_url || "");
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const goToDetails = () => {
    navigate("/product-details", { state: { product: { ...product, title } } });
  };

  return (
    <div
      className="pc-card"
      style={{ animationDelay: `${(index % 4) * 0.07}s`, cursor: "pointer" }}
      onClick={goToDetails}
    >
      <div className="pc-img-wrap">
        {imgError || !imgSrc ? (
          <div className="pc-img-placeholder">
            <span className="pc-img-placeholder-icon">🧺</span>
            <span className="pc-img-placeholder-text">Handcrafted</span>
          </div>
        ) : (
          <img src={imgSrc} alt={title} className="pc-img" loading="lazy" onError={() => setImgError(true)} />
        )}
        <div className="pc-img-overlay" />
        <div className="pc-hover-actions">
          <button className="pc-action-btn pc-cart-btn"
            onClick={(e) => { e.stopPropagation(); onAddToCart(e, product); }} aria-label="Add to cart">
            <FontAwesomeIcon icon={faShoppingCart} /><span>Add to Cart</span>
          </button>
          <button className="pc-action-btn pc-order-btn"
            onClick={(e) => { e.stopPropagation(); onOrderNow(e, product); }} aria-label="Order now">
            <FontAwesomeIcon icon={faShoppingBag} /><span>Order Now</span>
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
            <button className="pc-btn-ghost"
              onClick={(e) => { e.stopPropagation(); onAddToCart(e, product); }}>
              <FontAwesomeIcon icon={faShoppingCart} />
            </button>
            <button className="pc-btn-primary"
              onClick={(e) => { e.stopPropagation(); onOrderNow(e, product); }}>
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

/* ─── Society Banner ──────────────────────────────────────────────────── */
function SocietyBanner({ society }) {
  return (
    <div className={`society-banner society-banner--${society.theme}`} id={society.id}>
      <div className="society-banner-inner">
        <div className="society-banner-left">
          <span className="society-banner-pill">{society.pill}</span>
          <h2 className="society-banner-title">{society.name}</h2>
          <p className="society-banner-desc">{society.desc}</p>
        </div>
        <div className="society-banner-tags">
          {society.tags.map(t => (
            <span key={t} className="society-tag">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── DBSection ───────────────────────────────────────────────────────── */
function DBSection({ section, si, categoryId, onAddToCart, onOrderNow }) {
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const sectionRef = useRef(null);

  useEffect(() => {
    setLoading(true); setError(null); setActiveFilter("all");
    fetchCategoryProducts(categoryId)
      .then((data) => setProducts(data.products || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [categoryId]);

  const categories = useMemo(() => buildCategories(products, "name"), [products]);
  const filtered   = useMemo(() =>
    activeFilter === "all"
      ? products
      : products.filter((p) => getProductType(p.name) === activeFilter),
    [activeFilter, products]
  );

  useReveal(sectionRef, [loading, filtered]);

  return (
    <section id={section.id} className="product-section" ref={sectionRef}>
      <div className="reveal">
        <SectionHeader section={section} gradient={si % 2 === 0 ? "a" : "b"} />
      </div>
      {loading && <div className="products-loading">Loading {section.label} products…</div>}
      {error   && <div className="products-error">Could not load products: {error}</div>}
      {!loading && !error && products.length > 0 && (
        <>
          {categories.length > 2 && (
            <div className="reveal">
              <CategoryFilter categories={categories} active={activeFilter} onChange={setActiveFilter} />
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

/* ─── ProductSearch ───────────────────────────────────────────────────── */
function ProductSearch({ onAddToCart, onOrderNow }) {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);

  // Collect all products from all category IDs on mount
  const ALL_CATEGORY_IDS = SOCIETIES.flatMap(s => s.sections.map(sec => sec.categoryId));
  const allProductsRef = useRef(null);

  useEffect(() => {
    // Pre-fetch all products for instant client-side search
    Promise.all(ALL_CATEGORY_IDS.map(id => fetchCategoryProducts(id)))
      .then(responses => {
        allProductsRef.current = responses.flatMap(r => r.products || []);
      })
      .catch(() => { allProductsRef.current = []; });
  }, []);

  const handleSearch = useCallback((value) => {
    const q = value.trim().toLowerCase();
    setQuery(value);
    if (!q) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    // Small debounce feel
    setTimeout(() => {
      const pool = allProductsRef.current || [];
      const found = pool.filter(p =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
      );
      setResults(found);
      setLoading(false);
    }, 150);
  }, []);

  const clearSearch = () => { setQuery(""); setResults([]); setSearched(false); inputRef.current?.focus(); };

  return (
    <div className="ps-wrap">
      <div className="ps-inner">
        {/* Search bar */}
        <div className="ps-bar">
          <span className="ps-icon"><FontAwesomeIcon icon={faSearch} /></span>
          <input
            ref={inputRef}
            className="ps-input"
            type="text"
            placeholder="Search products — e.g. hand bag, bamboo tray, stole…"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button className="ps-clear" onClick={clearSearch} aria-label="Clear search">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>

        {/* Results */}
        {loading && (
          <div className="ps-status">Searching…</div>
        )}
        {!loading && searched && results.length === 0 && (
          <div className="ps-status">No products found for "<strong>{query}</strong>"</div>
        )}
        {!loading && results.length > 0 && (
          <>
            <p className="ps-count">{results.length} product{results.length !== 1 ? "s" : ""} found</p>
            <div className="pc-grid ps-grid">
              {results.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={{ ...product, title: product.name, imgSrc: product.thumbnail_url }}
                  onAddToCart={onAddToCart}
                  onOrderNow={onOrderNow}
                  index={idx}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Society + Section config ────────────────────────────────────────── */
const SOCIETIES = [
  {
    id: "shristi",
    name: "Shristi Handicraft Co-operative Society",
    pill: "Handicrafts",
    desc: "Empowering rural women through sustainable craft traditions — weaving natural materials into beautiful, eco-friendly products.",
    theme: "teal",
    tags: ["Water Hyacinth", "Bamboo Craft", "Eco-Friendly", "Women-Led"],
    sections: [
      {
        id: "hyacinth", label: "Water Hyacinth", eyebrow: "Natural Craft",
        categoryId: 4,
        decorImgs: ["../assets/water-hyacinth-products2.png","../assets/water-hyacinth-products1.png","../assets/water-hyacinth-products.png"],
        icon: "../assets/water-hyacinth.png", subLabel: "Water Hyacinth Products",
      },
      {
        id: "bamboo", label: "Bamboo", eyebrow: "Sustainable",
        categoryId: 14,
        decorImgs: [], icon: "../assets/bamboo-image.png", subLabel: "Bamboo Products",
      },
    ],
  },
  {
    id: "prerana",
    name: "Prerana Handloom Co-operative Society",
    pill: "Handloom",
    desc: "Preserving the rich textile heritage of Assam — each thread tells a story of artistry, culture, and timeless community craft.",
    theme: "amber",
    tags: ["Handloom Weave", "Natural Dyes", "Traditional Craft", "Assam Heritage"],
    sections: [
      {
        id: "handloom", label: "Handloom", eyebrow: "Traditional Weave",
        categoryId: 3,
        decorImgs: ["../assets/handloom-img.png","../assets/handloom-img-1.png","../assets/handloom-img-3.png"],
        subLabel: "Handloom & Textile Products",
      },
    ],
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

      {/* ── Hero ── */}
      <div className="products-page-hero">
        <span className="products-page-eyebrow">Our Collection</span>
        <h1 className="products-page-title">Products</h1>
        <p className="products-page-sub">Handcrafted with tradition. Designed for today.</p>
        <nav className="section-nav" aria-label="Jump to section">
          {SOCIETIES.map((s) => (
            <a key={s.id} href={`#${s.id}`} className={`section-nav-link section-nav-link--${s.theme}`}>
              {s.pill}
            </a>
          ))}
        </nav>
      </div>

      {/* ── Search ── */}
      <ProductSearch onAddToCart={handleAddToCart} onOrderNow={handleOrderNow} />

      {/* ── Society groups ── */}
      {SOCIETIES.map((society, si) => (
        <div key={society.id} className="society-group">
          <SocietyBanner society={society} />
          {society.sections.map((section, idx) => (
            <DBSection
              key={section.id}
              section={section}
              si={si * 10 + idx}
              categoryId={section.categoryId}
              onAddToCart={handleAddToCart}
              onOrderNow={handleOrderNow}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default Products;