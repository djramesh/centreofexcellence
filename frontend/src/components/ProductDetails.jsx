import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import "./productDetails.css";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingBag, faShoppingCart, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function ProductDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const { product } = location.state || {};
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    AOS.init({
      duration: 1000,
      easing: "ease-in-out",
      once: true,
    });
    window.scrollTo(0, 0);
  }, []);

  const handleAddToCart = () => {
    const productWithPrice = { ...product, price: product.price || 500 };
    addToCart(productWithPrice, 1);
  };

  const handleOrderNow = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    const productWithPrice = { ...product, price: product.price || 500 };
    addToCart(productWithPrice, 1);
    navigate("/checkout");
  };

  if (!product) {
    return (
      <div className="product-details-container">
        <h2>No Product Selected</h2>
        <p>Please select a product from the products page.</p>
        <button className="button" onClick={() => navigate("/products")}>
          Back to Products
        </button>
      </div>
    );
  }

  const additionalDetails = {
    material: product.title.includes("Bamboo")
      ? "Natural Bamboo Fibers"
      : product.title.includes("Stole")
      ? "Natural Cotton Fibers"
      : product.title.includes("Runner Set")
      ? "Natural Cotton Fibers"
      : "Dried Water Hyacinth",
    dimensions: product.title.includes("Bag")
      ? "12 x 8 x 4 inches"
      : product.title.includes("Hat")
      ? "One Size (Adjustable)"
      : product.title.includes("Mat")
      ? "18 x 12 inches"
      : product.title.includes("Basket")
      ? "10 x 10 x 6 inches"
      : "Varies by design",
    weight: product.title.includes("Bag")
      ? "400g"
      : product.title.includes("Hat")
      ? "150g"
      : product.title.includes("Mat")
      ? "200g"
      : product.title.includes("Basket")
      ? "350g"
      : "250g",
    careInstructions: "Clean with Care.",
    origin: ["Hand Bag", "Hat", "Table Mat", "Basket", "Bamboo Bag"].some(keyword => product.title.includes(keyword))
      ? "Shristi Handicrafts Co-operative Society"
      : "Prerana Handloom Co-operative Society",
};

  return (
    <div className="product-details-container" data-aos="fade-up">
      <h1 className="product-details-title" data-aos="fade-down">
        {product.title}
      </h1>

      <div className="product-details-content" data-aos="fade-up">
        <div className="product-image-container">
          <img
            src={product.imgSrc}
            alt={product.title}
            className="product-details-image"
            data-aos="zoom-in"
          />
        </div>

        <div className="product-info-container">
          <p className="product-description">{product.productDetails}</p>

          <div className="additional-details">
            <h3>Product Details</h3>
            <ul>
              <li>
                <strong>Material:</strong> {additionalDetails.material}
              </li>
              <li>
                <strong>Dimensions:</strong> {additionalDetails.dimensions}
              </li>
              {/* <li>
                <strong>Weight:</strong> {additionalDetails.weight}
              </li> */}
              <li>
                <strong>Care Instructions:</strong>{" "}
                {additionalDetails.careInstructions}
              </li>
              <li>
                <strong>Origin:</strong> {additionalDetails.origin}
              </li>
            </ul>
          </div>

          <div className="action-buttons">
            <button
              className="button button-secondary order-now-btn"
              onClick={handleAddToCart}
              data-aos="fade-up"
            >
              <FontAwesomeIcon icon={faShoppingCart} /> Add to Cart
            </button>
            <button
              className="button order-now-btn"
              onClick={handleOrderNow}
              data-aos="fade-up"
            >
              Order Now &nbsp; <FontAwesomeIcon icon={faShoppingBag} />
              <div className="hoverEffect">
                <div></div>
              </div>
            </button>
            <button
              className="button back-btn"
              onClick={() => navigate("/products")}
              data-aos="fade-up"
            >
              Back to Products &nbsp; <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
