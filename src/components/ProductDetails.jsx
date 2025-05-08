import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import "./productDetails.css";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingBag, faArrowRight } from "@fortawesome/free-solid-svg-icons";

function ProductDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const {product} = location.state || {};

  useEffect(() => {
    AOS.init({
      duration: 1000,
      easing: "ease-in-out",
      once: true,
    });
    window.scrollTo(0, 0);
  }, []);

  const handleOrderClick = () => {
    navigate("/order");
    window.scrollTo(0, 0);
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
    careInstructions:
      "Clean with Care.",
    origin: product.title.material("Hand Bag")   || 
      ? "Shristi Handicrafts Co operative society"
      : product.title.material("Hat")
      ? "Shristi Handicrafts Co operative society"
      : product.title.material("Table Mat")
      ? "Shristi Handicrafts Co operative society"
      : product.title.material("Basket")
      ? "Shristi Handicrafts Co operative society"
      : product.title.material("Bamboo Bag") 
      ? "Shristi Handicrafts Co operative society"
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
              className="button order-now-btn"
              onClick={handleOrderClick}
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
