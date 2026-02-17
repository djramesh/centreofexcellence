import React, { useEffect, useRef } from "react";
import "./Products.css";
import "./Common.css";
import "./Order.jsx";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingBag, faShoppingCart } from "@fortawesome/free-solid-svg-icons";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

/* ─── Product data (unchanged) ────────────────────────────────────────── */
const waterHyacinthProducts = [
  { id: 1,  title: "Hand Bag",   price: 1200, imgSrc: "../assets/hand-bag-1.jpg", description: "Water hyacinth bags are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant.", productDetails: "The use of water hyacinth helps in use of this abundantly available local resource and provides alternative use and provides an opportunity to prevent the negative impact of this plant, at the same time curtailing the use of plastic or other artificial covers." },
  { id: 2,  title: "Hand Bag",   price: 1100, imgSrc: "../assets/hand-bag-2.jpg", description: "Water hyacinth bags are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant.", productDetails: "The use of water hyacinth helps in use of this abundantly available local resource and provides alternative use." },
  { id: 3,  title: "Hand Bag",   price: 1150, imgSrc: "../assets/hand-bag-3.jpg", description: "Water hyacinth bags are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant.", productDetails: "The use of water hyacinth helps in use of this abundantly available local resource and provides alternative use." },
  { id: 4,  title: "Hand Bag",   price: 1050, imgSrc: "../assets/hand-bag-4.jpg", description: "Water hyacinth bags are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant.", productDetails: "The use of water hyacinth helps in use of this abundantly available local resource and provides alternative use." },
  { id: 5,  title: "Hand Bag",   price: 1300, imgSrc: "../assets/hand-bag-5.jpg", description: "Water hyacinth bags are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant.", productDetails: "The use of water hyacinth helps in use of this abundantly available local resource and provides alternative use." },
  { id: 6,  title: "Hand Bag",   price: 1250, imgSrc: "../assets/hand-bag-6.jpg", description: "Water hyacinth bags are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant.", productDetails: "The use of water hyacinth helps in use of this abundantly available local resource and provides alternative use." },
  { id: 7,  title: "Hat",        price: 650,  imgSrc: "../assets/hat-1.jpg",      description: "Water hyacinth Hats are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant.", productDetails: "Unique and eco-friendly headwear." },
  { id: 8,  title: "Table Mat",  price: 450,  imgSrc: "../assets/table-mat-1.jpg",description: "Water hyacinth table mats are a charming and sustainable addition to any dining space.", productDetails: "Sustainable dining table mats." },
  { id: 9,  title: "Table Mat",  price: 420,  imgSrc: "../assets/table-mat-2.jpg",description: "Water hyacinth table mats are a charming and sustainable addition to any dining space.", productDetails: "Sustainable dining table mats." },
  { id: 10, title: "Table Mat",  price: 480,  imgSrc: "../assets/tablemat-3.jpg", description: "Water hyacinth table mats are a charming and sustainable addition to any dining space.", productDetails: "Sustainable dining table mats." },
  { id: 11, title: "Basket",     price: 850,  imgSrc: "../assets/basket-1.jpg",   description: "Water hyacinth baskets are a beautiful and sustainable craft that showcases the versatility of this aquatic plant.", productDetails: "Handcrafted storage baskets." },
];

const bambooProducts = [
  { id: 12, title: "Bamboo Bag", price: 950, imgSrc: "../assets/bamboo-bag-1.jpg", description: "Bamboo bags are eco-friendly, stylish accessories crafted from natural bamboo fibers.", productDetails: "Lightweight yet durable, showcasing the versatility of bamboo as a sustainable material." },
  { id: 13, title: "Bamboo Bag", price: 900, imgSrc: "../assets/bamboo-bag-2.jpg", description: "Bamboo bags are eco-friendly, stylish accessories crafted from natural bamboo fibers.", productDetails: "Lightweight yet durable, showcasing the versatility of bamboo as a sustainable material." },
];

const preranaProducts = Array.from({ length: 31 }, (_, i) => ({
  id: i + 3,
  title: "Prerana Product",
  price: 600 + (i % 5) * 50,
  imgSrc: `../assets/IMG-20260129-WA${String(i + 1).padStart(4, "0")}.jpg`,
  description: "Beautiful handcrafted product from Prerana community",
  productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
}));

const shristiProducts = [
  { id: 34, imgSrc: "../assets/IMG_3865.jpeg" }, { id: 35, imgSrc: "../assets/IMG_3866.jpeg" },
  { id: 36, imgSrc: "../assets/IMG_3867.jpeg" }, { id: 37, imgSrc: "../assets/IMG_3868.jpeg" },
  { id: 38, imgSrc: "../assets/IMG_3869.jpeg" }, { id: 39, imgSrc: "../assets/IMG_3870.jpeg" },
  { id: 40, imgSrc: "../assets/IMG_3874.jpeg" }, { id: 41, imgSrc: "../assets/IMG_3875.jpeg" },
  { id: 42, imgSrc: "../assets/IMG_3876.jpeg" }, { id: 43, imgSrc: "../assets/IMG_3877.jpeg" },
  { id: 44, imgSrc: "../assets/IMG_3879.jpeg" }, { id: 45, imgSrc: "../assets/IMG_4338.jpeg" },
  { id: 46, imgSrc: "../assets/IMG_4339.jpeg" }, { id: 47, imgSrc: "../assets/IMG_4341.jpeg" },
  { id: 48, imgSrc: "../assets/IMG_4342.jpeg" }, { id: 49, imgSrc: "../assets/IMG_4394.jpeg" },
  { id: 50, imgSrc: "../assets/IMG_4397.jpeg" }, { id: 51, imgSrc: "../assets/IMG_4398.jpeg" },
  { id: 52, imgSrc: "../assets/IMG_4399.jpeg" }, { id: 53, imgSrc: "../assets/IMG_4401.jpeg" },
].map(p => ({ ...p, title: "Shristi Product", price: 700 + (p.id % 4) * 75, description: "Beautiful handcrafted product from Shristi community", productDetails: "Shristi is a women's collective that creates exquisite handcrafted products combining traditional techniques with modern aesthetics." }));

const handloomProducts = [
  { id: 14, title: "Stole",      price: 1400, imgSrc: "../assets/handloom1.jpg",  description: "Crafted from natural fibers, uniquely colored using plant-based dyes lending it a soft, earthy palette.", productDetails: "A hand woven stole dyed with natural pigments — a blend of elegance and sustainability." },
  { id: 15, title: "Stole",      price: 1350, imgSrc: "../assets/handloom2.jpg",  description: "Crafted from natural fibers, uniquely colored using plant-based dyes lending it a soft, earthy palette.", productDetails: "A hand woven stole dyed with natural pigments — a blend of elegance and sustainability." },
  { id: 16, title: "Stole",      price: 1500, imgSrc: "../assets/glry-6.jpg",     description: "Crafted from natural fibers, uniquely colored using plant-based dyes lending it a soft, earthy palette.", productDetails: "A hand woven stole dyed with natural pigments — a blend of elegance and sustainability." },
  { id: 17, title: "Runner Set", price: 1800, imgSrc: "../assets/handloom4.jpg",  description: "Exquisite textile pieces that bring warmth to any dining or living space.", productDetails: "Crafted using traditional weaving techniques featuring intricate patterns and rich textures." },
  { id: 18, title: "Runner Set", price: 1750, imgSrc: "../assets/handloom5.jpg",  description: "Exquisite textile pieces that bring warmth to any dining or living space.", productDetails: "Crafted using traditional weaving techniques featuring intricate patterns and rich textures." },
  { id: 19, title: "Runner Set", price: 1700, imgSrc: "../assets/handloom6.jpg",  description: "Exquisite textile pieces that bring warmth to any dining or living space.", productDetails: "Crafted using traditional weaving techniques featuring intricate patterns and rich textures." },
  { id: 20, title: "Runner Set", price: 1850, imgSrc: "../assets/handloom7.jpg",  description: "Exquisite textile pieces that bring warmth to any dining or living space.", productDetails: "Crafted using traditional weaving techniques featuring intricate patterns and rich textures." },
  { id: 21, title: "Runner Set", price: 1800, imgSrc: "../assets/handloom8.jpg",  description: "Exquisite textile pieces that bring warmth to any dining or living space.", productDetails: "Crafted using traditional weaving techniques featuring intricate patterns and rich textures." },
  { id: 22, title: "Runner Set", price: 1900, imgSrc: "../assets/handloom10.jpg", description: "Exquisite textile pieces that bring warmth to any dining or living space.", productDetails: "Crafted using traditional weaving techniques featuring intricate patterns and rich textures." },
];

/* ─── Section config ──────────────────────────────────────────────────── */
const SECTIONS = [
  { id: "hyacinth", label: "Water Hyacinth",  eyebrow: "Eco Crafts",        products: waterHyacinthProducts, decorImgs: ["../assets/water-hyacinth-products2.png","../assets/water-hyacinth-products1.png","../assets/water-hyacinth-products.png"], icon: "../assets/water-hyacinth.png", subLabel: "Water Hyacinth Products" },
  { id: "bamboo",   label: "Bamboo",          eyebrow: "Sustainable",       products: bambooProducts,         decorImgs: [], icon: "../assets/bamboo-image.png", subLabel: "Bamboo Products" },
  { id: "prerana",  label: "Prerana",         eyebrow: "Community Crafts",  products: preranaProducts,        decorImgs: [], subLabel: "Prerana Community Crafts" },
  { id: "shristi",  label: "Shristi",         eyebrow: "Women's Collective",products: shristiProducts,        decorImgs: [], subLabel: "Shristi Community Crafts" },
  { id: "handloom", label: "Handloom",        eyebrow: "Traditional Weave", products: handloomProducts,       decorImgs: ["../assets/handloom-img.png","../assets/handloom-img-1.png","../assets/handloom-img-3.png"], subLabel: "Handloom Products" },
];

/* ─── ProductCard ─────────────────────────────────────────────────────── */
function ProductCard({ product, onAddToCart, onOrderNow, index }) {
  const price = product.price || 800;
  return (
    <div
      className="pc-card"
      style={{ animationDelay: `${(index % 4) * 0.07}s` }}
    >
      {/* image */}
      <div className="pc-img-wrap">
        <img src={product.imgSrc} alt={product.title} className="pc-img" loading="lazy" />
        <div className="pc-img-overlay" />
        {/* quick-action buttons on hover */}
        <div className="pc-hover-actions">
          <button
            className="pc-action-btn pc-cart-btn"
            onClick={(e) => onAddToCart(e, product)}
            aria-label="Add to cart"
          >
            <FontAwesomeIcon icon={faShoppingCart} />
            <span>Add to Cart</span>
          </button>
          <button
            className="pc-action-btn pc-order-btn"
            onClick={(e) => onOrderNow(e, product)}
            aria-label="Order now"
          >
            <FontAwesomeIcon icon={faShoppingBag} />
            <span>Order Now</span>
          </button>
        </div>
        {/* eco badge */}
        <div className="pc-badge">Handcrafted</div>
      </div>

      {/* body */}
      <div className="pc-body">
        <h4 className="pc-title">{product.title}</h4>
        <p className="pc-desc">{product.description}</p>
        <div className="pc-footer">
          <span className="pc-price">₹{price.toLocaleString("en-IN")}</span>
          <div className="pc-footer-btns">
            <button
              className="pc-btn-ghost"
              onClick={(e) => onAddToCart(e, product)}
            >
              <FontAwesomeIcon icon={faShoppingCart} />
            </button>
            <button
              className="pc-btn-primary"
              onClick={(e) => onOrderNow(e, product)}
            >
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
      {/* floating decor images */}
      {section.decorImgs?.map((src, i) => (
        <img key={i} src={src} alt="" className={`section-decor section-decor--${i}`} aria-hidden="true" />
      ))}
    </div>
  );
}

/* ─── Products ────────────────────────────────────────────────────────── */
function Products() {
  const { addToCart }      = useCart();
  const { isAuthenticated }= useAuth();
  const navigate           = useNavigate();
  const containerRef       = useRef(null);

  /* scroll-reveal */
  useEffect(() => {
    const els = containerRef.current?.querySelectorAll(".reveal");
    if (!els?.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach(el => el.classList.add("revealed"));
      return;
    }
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("revealed"); io.unobserve(e.target); } }),
      { threshold: 0.08 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  const handleAddToCart = (e, product) => {
    e.preventDefault(); e.stopPropagation();
    addToCart({ ...product, price: product.price || 800 }, 1);
  };

  const handleOrderNow = (e, product) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { navigate("/login"); return; }
    addToCart({ ...product, price: product.price || 500 }, 1);
    navigate("/checkout");
  };

  return (
    <div id="products" className="products-wrap" ref={containerRef}>

      {/* ── Page heading ── */}
      <div className="products-page-hero reveal">
        <span className="products-page-eyebrow">Our Collection</span>
        <h1 className="products-page-title">Products</h1>
        <p className="products-page-sub">Handcrafted with tradition. Designed for today.</p>

        {/* sticky-style section nav */}
        <nav className="section-nav" aria-label="Jump to section">
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`} className="section-nav-link">
              {s.label}
            </a>
          ))}
        </nav>
      </div>

      {/* ── Sections ── */}
      {SECTIONS.map((section, si) => (
        <section key={section.id} id={section.id} className="product-section">

          <div className="reveal">
            <SectionHeader section={section} gradient={si % 2 === 0 ? "a" : "b"} />
          </div>

          <div className="pc-grid">
            {section.products.map((product, idx) => (
              <div className="reveal" key={product.id} style={{ animationDelay: `${(idx % 4) * 0.06}s` }}>
                <ProductCard
                  product={product}
                  onAddToCart={handleAddToCart}
                  onOrderNow={handleOrderNow}
                  index={idx}
                />
              </div>
            ))}
          </div>
        </section>
      ))}

    </div>
  );
}

export default Products;