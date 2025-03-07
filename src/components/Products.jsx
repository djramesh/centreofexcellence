import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import "./Products.css";
import "./Common.css";
import "./Order.jsx";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingBag, faEnvelope } from "@fortawesome/free-solid-svg-icons";

function Products() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      easing: "ease-in-out",
      once: true,
    });
  }, []);

  const navigate = useNavigate();

  const handleOrderClick = (product) => {
    navigate("/product-details", { state: { product } });
    window.scrollTo(0, 0);
  };

  const waterHyacinthProducts = [
    {
      id: 1,
      title: "Hand Bag",
      description:
        "Water hyacinth bags are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant.",
      imgSrc: "../assets/hand-bag-1.jpg",
    },
    {
      id: 2,
      title: "Hand Bag",
      description:
        "Water hyacinth bags are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant.",
      imgSrc: "../assets/hand-bag-2.jpg",
    },
    {
      id: 3,
      title: "Hand Bag",
      description:
        "Water hyacinth bags are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant.",
      imgSrc: "../assets/hand-bag-3.jpg",
    },
    {
      id: 4,
      title: "Hand Bag",
      description:
        "Water hyacinth bags are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant.",
      imgSrc: "../assets/hand-bag-4.jpg",
    },
    {
      id: 5,
      title: "Hand Bag",
      description:
        "Water hyacinth bags are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant.",
      imgSrc: "../assets/hand-bag-5.jpg",
    },
    {
      id: 6,
      title: "Hand Bag",
      description:
        "Water hyacinth bags are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant.",
      imgSrc: "../assets/hand-bag-6.jpg",
    },
    {
      id: 7,
      title: "Hat",
      description:
        "Water hyacinth Hats are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant.",
      imgSrc: "../assets/hat-1.jpg",
    },
    {
      id: 8,
      title: "Table Mat",
      description:
        "Water hyacinth table mats are a charming and sustainable addition to any dining space. Handcrafted from this resilient aquatic plant.",
      imgSrc: "../assets/table-mat-1.jpg",
    },
    {
      id: 9,
      title: "Table Mat",
      description:
        "Water hyacinth table mats are a charming and sustainable addition to any dining space. Handcrafted from this resilient aquatic plant.",
      imgSrc: "../assets/table-mat-2.jpg",
    },
    {
      id: 10,
      title: "Table Mat",
      description:
        "Water hyacinth table mats are a charming and sustainable addition to any dining space. Handcrafted from this resilient aquatic plant.",
      imgSrc: "../assets/tablemat-3.jpg",
    },
    {
      id: 11,
      title: "Basket",
      description:
        "Water hyacinth baskets are a beautiful and sustainable craft that showcases the versatility of this aquatic plant.",
      imgSrc: "../assets/basket-1.jpg",
    },
  ];

  const bambooProducts = [
    {
      id: 12,
      title: "Bamboo Bag",
      description:
        "Bamboo bags are eco-friendly, stylish accessories crafted from natural bamboo fibers.",
      imgSrc: "../assets/bamboo-bag-1.jpg",
    },
    {
      id: 13,
      title: "Bamboo Bag",
      description:
        "Bamboo bags are eco-friendly, stylish accessories crafted from natural bamboo fibers.",
      imgSrc: "../assets/bamboo-bag-2.jpg",
    },
  ];

  const handloomProducts = [
    {
      id: 14,
      title: "Stole",
      description:
        "Crafted from natural fibers, each piece is uniquely colored using plant-based dyes lending it a soft, earthy palette.",
      imgSrc: "../assets/handloom1.jpg",
    },
    {
      id: 15,
      title: "Stole",
      description:
        "Crafted from natural fibers, each piece is uniquely colored using plant-based dyes lending it a soft, earthy palette.",
      imgSrc: "../assets/handloom2.jpg",
    },
    {
      id: 16,
      title: "Stole",
      description:
        "Crafted from natural fibers, each piece is uniquely colored using plant-based dyes lending it a soft, earthy palette.",
      imgSrc: "../assets/handloom3.jpg",
    },
    {
      id: 17,
      title: "Runner set",
      description:
        "Handloom table runners are exquisite textile pieces that bring warmth and character to any dining or living space.",
      imgSrc: "../assets/handloom4.jpg",
    },
    {
      id: 18,
      title: "Runner Set",
      description:
        "Handloom table runners are exquisite textile pieces that bring warmth and character to any dining or living space.",
      imgSrc: "../assets/handloom5.jpg",
    },
    {
      id: 19,
      title: "Runner Set",
      description:
        "Handloom table runners are exquisite textile pieces that bring warmth and character to any dining or living space.",
      imgSrc: "../assets/handloom6.jpg",
    },
    {
      id: 20,
      title: "Runner Set",
      description:
        "Handloom table runners are exquisite textile pieces that bring warmth and character to any dining or living space.",
      imgSrc: "../assets/handloom7.jpg",
    },
    {
      id: 21,
      title: "Runner Set",
      description:
        "Handloom table runners are exquisite textile pieces that bring warmth and character to any dining or living space.",
      imgSrc: "../assets/handloom8.jpg",
    },
    {
      id: 22,
      title: "Runner Set",
      description:
        "Handloom table runners are exquisite textile pieces that bring warmth and character to any dining or living space.",
      imgSrc: "../assets/handloom10.jpg",
    },
  ];

  return (
    <div id="products" className="products-container">
      <h1 className="product-heading" data-aos="fade-up">
        Products
      </h1>
      <div className="link-container" data-aos="fade-up">
        <a href="#handicraft" className="scroll-link">
          Handicraft
        </a>
        <a href="#handloom" className="scroll-link">
          Handloom
        </a>
      </div>
      <br />
      <br />
      <br />
      <h3 id="#handicraft" className="animated-heading" data-aos="fade-up">
        Handicraft Products
        <img
          src="../assets/water-hyacinth-products2.png"
          alt="Decoration 1"
          className="floating-image img-1"
          data-aos="zoom-in"
        />
        <img
          src="../assets/water-hyacinth-products1.png"
          alt="Decoration 2"
          className="floating-image img-2"
          data-aos="zoom-in"
        />
        <img
          src="../assets/water-hyacinth-products.png"
          alt="Decoration 3"
          className="floating-image img-3"
          data-aos="zoom-in"
        />
      </h3>
      <div className="products-label" data-aos="fade-up">
        <p className="products-label-text">Water Hyacinth Products</p>
        <img
          src="../assets/water-hyacinth.png"
          alt="Products Icon"
          className="products-label-image"
        />
      </div>

      <div className="product-cards-container">
        {waterHyacinthProducts.map((product) => (
          <div className="product-card" data-aos="fade-up" key={product.id}>
            <img
              src={product.imgSrc}
              alt={product.title}
              className="product-card-img"
            />
            <div className="product-card-body">
              <h4 className="product-title">{product.title}</h4>
              <p className="product-description">{product.description}</p>
              <div className="product-buttons">
                <Link to ={`/product-details/${product.id}`} state={{product}}>
                  <button
                    className="button"
                    // onClick={() => handleOrderClick(product)}
                  >
                    Order Now &nbsp; <FontAwesomeIcon icon={faShoppingBag} />
                    
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="products-label" data-aos="fade-up">
        <p className="products-label-text">Bamboo Products</p>
        <img
          src="../assets/bamboo-image.png"
          alt="Products Icon"
          className="products-label-image"
        />
      </div>

      <div className="product-cards-container">
        {bambooProducts.map((product) => (
          <div className="product-card" data-aos="fade-up" key={product.id}>
            <img
              src={product.imgSrc}
              alt={product.title}
              className="product-card-img"
            />
            <div className="product-card-body">
              <h4 className="product-title">{product.title}</h4>
              <p className="product-description">{product.description}</p>
              <div className="product-buttons">
                <Link to ={`/product-details/${product.id}`} state={{product}}>
                  <button
                    className="button"
                    // onClick={() => handleOrderClick(product)}
                  >
                    Order Now
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <br />
      <br />
      <br />
      <h1 id="handloom" className="product-heading" data-aos="fade-up"></h1>
      <h3 className="animated-heading" data-aos="fade-up">
        Handloom Products
        <img
          src="../assets/handloom-img.png"
          alt="Decoration 1"
          className="floating-image img-1"
          data-aos="zoom-in"
        />
        <img
          src="../assets/handloom-img-1.png"
          alt="Decoration 2"
          className="floating-image img-2"
          data-aos="zoom-in"
        />
        <img
          src="../assets/handloom-img-3.png"
          alt="Decoration 3"
          className="floating-image img-3"
          data-aos="zoom-in"
        />
      </h3>
      <div className="product-cards-container">
        {handloomProducts.map((product) => (
          <div className="product-card" data-aos="fade-up" key={product.id}>
            <img
              src={product.imgSrc}
              alt={product.title}
              className="product-card-img"
            />
            <div className="product-card-body">
              <h4 className="product-title">{product.title}</h4>
              <p className="product-description">{product.description}</p>
              <div className="product-buttons">
                <Link to ={`/product-details/${product.id}`} state={{product}}>
                  <button
                    className="button"
                    // onClick={() => handleOrderClick(product)}
                  >
                    Order Now
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Products;
