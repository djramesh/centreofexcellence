import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingBag, faShoppingCart, faSearch, faXmark } from "@fortawesome/free-solid-svg-icons";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { productsApi } from "../api/products";
import SmartImage from "./common/SmartImage";
import "./Products.css";
import "./Common.css";

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function getProductType(name = "") {
  return name.replace(/\s*\(.*?\)\s*/g, "").trim();
}

function buildCategories(products) {
  const seen = new Set();
  const cats = [{ id: "all", label: "All" }];
  products.forEach((product) => {
    const type = getProductType(product.name || "");
    if (type && !seen.has(type)) {
      seen.add(type);
      cats.push({ id: type, label: type });
    }
  });
  return cats;
}

/** Where a product's own page lives. Falls back to the id when there is no slug. */
const productPath = (product) => `/products/${product.slug || product.id}`;

/* ─── Reveal-on-scroll ────────────────────────────────────────────────── */
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
    return () => {
      clearTimeout(fallback);
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* ─── CategoryFilter ──────────────────────────────────────────────────── */
function CategoryFilter({ categories, active, onChange }) {
  return (
    <div className="category-filter" role="group" aria-label="Filter by product type">
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          className={`category-filter-btn${active === cat.id ? " active" : ""}`}
          aria-pressed={active === cat.id}
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
  const price = Number(product.price) || 0;
  const stock = product.stock ?? null;
  const soldOut = stock != null && stock <= 0;
  const lowStock = !soldOut && stock != null && stock <= 5;

  /* The whole card is a link, so the page is reachable by keyboard, opens in a
     new tab with ctrl-click, and is crawlable — the old card was a div with an
     onClick that navigated via router state only. */
  return (
    <Link
      to={productPath(product)}
      state={{ product }}
      className={`pc-card${soldOut ? " pc-card-out" : ""}`}
      style={{ animationDelay: `${(index % 4) * 0.07}s` }}
    >
      <div className="pc-img-wrap">
        <SmartImage
          src={product.thumbnail_url || product.images?.[0]?.url}
          alt={product.name}
          className="pc-img"
          wrapperClassName="pc-img-placeholder"
          placeholderLabel="Handcrafted"
        />
        <div className="pc-img-overlay" />

        <div className="pc-hover-actions">
          <button
            type="button"
            className="pc-action-btn pc-cart-btn"
            onClick={(e) => onAddToCart(e, product)}
            disabled={soldOut}
            aria-label={`Add ${product.name} to cart`}
          >
            <FontAwesomeIcon icon={faShoppingCart} />
            <span>Add to cart</span>
          </button>
          <button
            type="button"
            className="pc-action-btn pc-order-btn"
            onClick={(e) => onOrderNow(e, product)}
            disabled={soldOut}
            aria-label={`Buy ${product.name} now`}
          >
            <FontAwesomeIcon icon={faShoppingBag} />
            <span>Buy now</span>
          </button>
        </div>

        {soldOut ? (
          <div className="pc-badge pc-badge-out">Sold out</div>
        ) : lowStock ? (
          <div className="pc-badge pc-badge-low">Only {stock} left</div>
        ) : (
          <div className="pc-badge">Handcrafted</div>
        )}
      </div>

      <div className="pc-body">
        <h4 className="pc-title">{product.name}</h4>
        {product.description && <p className="pc-desc">{product.description}</p>}
        <div className="pc-footer">
          <span className="pc-price">₹{price.toLocaleString("en-IN")}</span>
          <div className="pc-footer-btns">
            <button
              type="button"
              className="pc-btn-ghost"
              onClick={(e) => onAddToCart(e, product)}
              disabled={soldOut}
              aria-label={`Add ${product.name} to cart`}
            >
              <FontAwesomeIcon icon={faShoppingCart} />
            </button>
            <button
              type="button"
              className="pc-btn-primary"
              onClick={(e) => onOrderNow(e, product)}
              disabled={soldOut}
            >
              {soldOut ? "Sold out" : "Buy now"}
            </button>
          </div>
        </div>
      </div>
    </Link>
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

/* ─── Society banner ──────────────────────────────────────────────────── */
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
          {society.tags.map((tag) => (
            <span key={tag} className="society-tag">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Category section ────────────────────────────────────────────────── */
function DBSection({ section, si, categoryId, onAddToCart, onOrderNow }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const sectionRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setActiveFilter("all");

    productsApi
      .byCategory(categoryId, { limit: 100 })
      .then((data) => !cancelled && setProducts(data.products || []))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  const categories = useMemo(() => buildCategories(products), [products]);
  const filtered = useMemo(
    () =>
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

      {loading && (
        <div className="pc-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="pc-skeleton" />
          ))}
        </div>
      )}

      {error && <div className="products-error">Could not load products: {error}</div>}

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
                  product={product}
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

/* ─── Search ──────────────────────────────────────────────────────────── */
function ProductSearch({ onAddToCart, onOrderNow }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);
  const requestId = useRef(0);

  /* Searches the catalogue on the server. The previous version eagerly
     downloaded every product in every category on mount just to filter them in
     the browser — three full requests before the visitor typed anything. */
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const id = ++requestId.current;
    const timer = setTimeout(() => {
      productsApi
        .list({ search: trimmed, limit: 40 })
        .then((data) => {
          // Ignore a slow response that a newer keystroke has superseded.
          if (id !== requestId.current) return;
          setResults(data.products || []);
          setSearched(true);
        })
        .catch(() => id === requestId.current && setResults([]))
        .finally(() => id === requestId.current && setLoading(false));
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  const clearSearch = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className="ps-wrap">
      <div className="ps-inner">
        <div className="ps-bar">
          <span className="ps-icon"><FontAwesomeIcon icon={faSearch} /></span>
          <input
            ref={inputRef}
            className="ps-input"
            type="search"
            placeholder="Search products — e.g. hand bag, bamboo tray, stole…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-label="Search products"
          />
          {query && (
            <button type="button" className="ps-clear" onClick={clearSearch} aria-label="Clear search">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>

        <div aria-live="polite">
          {loading && <div className="ps-status">Searching…</div>}
          {!loading && searched && results.length === 0 && (
            <div className="ps-status">
              No products found for "<strong>{query}</strong>"
            </div>
          )}
          {!loading && results.length > 0 && (
            <>
              <p className="ps-count">
                {results.length} product{results.length !== 1 ? "s" : ""} found
              </p>
              <div className="pc-grid ps-grid">
                {results.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
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
    </div>
  );
}

/* ─── Society + section config ────────────────────────────────────────── */
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
        id: "hyacinth",
        label: "Water Hyacinth",
        eyebrow: "Natural Craft",
        categoryId: 4,
        decorImgs: [
          "../assets/water-hyacinth-products2.png",
          "../assets/water-hyacinth-products1.png",
          "../assets/water-hyacinth-products.png",
        ],
        icon: "../assets/water-hyacinth.png",
        subLabel: "Water Hyacinth Products",
      },
      {
        id: "bamboo",
        label: "Bamboo",
        eyebrow: "Sustainable",
        categoryId: 14,
        decorImgs: [],
        icon: "../assets/bamboo-image.png",
        subLabel: "Bamboo Products",
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
        id: "handloom",
        label: "Handloom",
        eyebrow: "Traditional Weave",
        categoryId: 3,
        decorImgs: [
          "../assets/handloom-img.png",
          "../assets/handloom-img-1.png",
          "../assets/handloom-img-3.png",
        ],
        subLabel: "Handloom & Textile Products",
      },
    ],
  },
];

/* ─── Page ────────────────────────────────────────────────────────────── */
function Products() {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState("");

  const handleAddToCart = useCallback(
    (e, product) => {
      // The card itself is a link; the buttons inside it must not navigate.
      e.preventDefault();
      e.stopPropagation();
      if (product.stock != null && product.stock <= 0) return;
      addToCart(product, 1);
      setToast(`${product.name} added to cart`);
      setTimeout(() => setToast(""), 2200);
    },
    [addToCart]
  );

  const handleOrderNow = useCallback(
    (e, product) => {
      e.preventDefault();
      e.stopPropagation();
      if (product.stock != null && product.stock <= 0) return;
      if (!isAuthenticated) {
        navigate("/login", { state: { from: "/products" } });
        return;
      }
      // Buy Now bypasses the persistent cart entirely.
      navigate("/checkout", { state: { buyNowItem: { ...product, quantity: 1 } } });
    },
    [isAuthenticated, navigate]
  );

  return (
    <div id="products" className="products-wrap">
      {toast && (
        <div className="pc-toast" role="status">
          ✓ {toast}
        </div>
      )}

      <div className="products-page-hero">
        <span className="products-page-eyebrow">Our Collection</span>
        <h1 className="products-page-title">Products</h1>
        <p className="products-page-sub">Handcrafted with tradition. Designed for today.</p>
        <nav className="section-nav" aria-label="Jump to section">
          {SOCIETIES.map((society) => (
            <a
              key={society.id}
              href={`#${society.id}`}
              className={`section-nav-link section-nav-link--${society.theme}`}
            >
              {society.pill}
            </a>
          ))}
        </nav>
      </div>

      <ProductSearch onAddToCart={handleAddToCart} onOrderNow={handleOrderNow} />

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
