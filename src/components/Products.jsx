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
      productDetails:
        "The use of water hyacinth helps in use of this abundantly available local resource and provides alternative use and provides an opportunity to prevent the negative impact of this plant, at the same time curtailing the the use of plastic or other artificial covers. These artisans have traditional skills and have undergone formal training at the Handicraft Training & Production Centre.",
    },
    {
      id: 2,
      title: "Hand Bag",
      description:
        "Water hyacinth bags are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant.",
      imgSrc: "../assets/hand-bag-2.jpg",
      productDetails:
        "The use of water hyacinth helps in use of this abundantly available local resource and provides alternative use and provides an opportunity to prevent the negative impact of this plant, at the same time curtailing the the use of plastic or other artificial covers. These artisans have traditional skills and have undergone formal training at the Handicraft Training & Production Centre.",
    },
    {
      id: 3,
      title: "Hand Bag",
      description:
        "Water hyacinth bags are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant.",
      imgSrc: "../assets/hand-bag-3.jpg",
      productDetails:
        "The use of water hyacinth helps in use of this abundantly available local resource and provides alternative use and provides an opportunity to prevent the negative impact of this plant, at the same time curtailing the the use of plastic or other artificial covers. These artisans have traditional skills and have undergone formal training at the Handicraft Training & Production Centre.",
    },
    {
      id: 4,
      title: "Hand Bag",
      description:
        "Water hyacinth bags are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant.",
      imgSrc: "../assets/hand-bag-4.jpg",
      productDetails:
        "The use of water hyacinth helps in use of this abundantly available local resource and provides alternative use and provides an opportunity to prevent the negative impact of this plant, at the same time curtailing the the use of plastic or other artificial covers. These artisans have traditional skills and have undergone formal training at the Handicraft Training & Production Centre.",
    },
    {
      id: 5,
      title: "Hand Bag",
      description:
        "Water hyacinth bags are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant.",
      imgSrc: "../assets/hand-bag-5.jpg",
      productDetails:
        "The use of water hyacinth helps in use of this abundantly available local resource and provides alternative use and provides an opportunity to prevent the negative impact of this plant, at the same time curtailing the the use of plastic or other artificial covers. These artisans have traditional skills and have undergone formal training at the Handicraft Training & Production Centre.",
    },
    {
      id: 6,
      title: "Hand Bag",
      description:
        "Water hyacinth bags are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant.",
      imgSrc: "../assets/hand-bag-6.jpg",
      productDetails:
        "The use of water hyacinth helps in use of this abundantly available local resource and provides alternative use and provides an opportunity to prevent the negative impact of this plant, at the same time curtailing the the use of plastic or other artificial covers. These artisans have traditional skills and have undergone formal training at the Handicraft Training & Production Centre.",
    },
    {
      id: 7,
      title: "Hat",
      description:
        "Water hyacinth Hats are a stylish and eco-conscious accessory, crafted from the fast-growing aquatic plant.",
      imgSrc: "../assets/hat-1.jpg",
      productDetails:
        "The use of water hyacinth helps in use of this abundantly available local resource and provides alternative use and provides an opportunity to prevent the negative impact of this plant, at the same time curtailing the the use of plastic or other artificial covers. These artisans have traditional skills and have undergone formal training at the Handicraft Training & Production Centre.",
    },
    {
      id: 8,
      title: "Table Mat",
      description:
        "Water hyacinth table mats are a charming and sustainable addition to any dining space.",
      imgSrc: "../assets/table-mat-1.jpg",
      productDetails:
        "The use of water hyacinth helps in use of this abundantly available local resource and provides alternative use and provides an opportunity to prevent the negative impact of this plant, at the same time curtailing the the use of plastic or other artificial covers. These artisans have traditional skills and have undergone formal training at the Handicraft Training & Production Centre.",
    },
    {
      id: 9,
      title: "Table Mat",
      description:
        "Water hyacinth table mats are a charming and sustainable addition to any dining space.",
      imgSrc: "../assets/table-mat-2.jpg",
      productDetails:
        "The use of water hyacinth helps in use of this abundantly available local resource and provides alternative use and provides an opportunity to prevent the negative impact of this plant, at the same time curtailing the the use of plastic or other artificial covers. These artisans have traditional skills and have undergone formal training at the Handicraft Training & Production Centre.",
    },
    {
      id: 10,
      title: "Table Mat",
      description:
        "Water hyacinth table mats are a charming and sustainable addition to any dining space.",
      imgSrc: "../assets/tablemat-3.jpg",
      productDetails:
        "The use of water hyacinth helps in use of this abundantly available local resource and provides alternative use and provides an opportunity to prevent the negative impact of this plant, at the same time curtailing the the use of plastic or other artificial covers. These artisans have traditional skills and have undergone formal training at the Handicraft Training & Production Centre.",
    },
    {
      id: 11,
      title: "Basket",
      description:
        "Water hyacinth baskets are a beautiful and sustainable craft that showcases the versatility of this aquatic plant.",
      imgSrc: "../assets/basket-1.jpg",
      productDetails:
        "The use of water hyacinth helps in use of this abundantly available local resource and provides alternative use and provides an opportunity to prevent the negative impact of this plant, at the same time curtailing the the use of plastic or other artificial covers. These artisans have traditional skills and have undergone formal training at the Handicraft Training & Production Centre.",
    },
  ];

  const bambooProducts = [
    {
      id: 12,
      title: "Bamboo Bag",
      description:
        "Bamboo bags are eco-friendly, stylish accessories crafted from natural bamboo fibers.",
      imgSrc: "../assets/bamboo-bag-1.jpg",
      productDetails:
        "Bamboo bags are eco-friendly, stylish accessories crafted from natural bamboo fibers. They’re lightweight yet durable, showcasing the versatility of bamboo as a sustainable material. Artisans create these bags by weaving thin bamboo strips into intricate patterns, resulting in unique textures and designs that celebrate traditional craftsmanship. Bamboo bags often feature minimalistic designs, but can also be adorned with elements like fabric linings, leather straps, or colorful accents.",
    },
    {
      id: 13,
      title: "Bamboo Bag",
      description:
        "Bamboo bags are eco-friendly, stylish accessories crafted from natural bamboo fibers.",
      imgSrc: "../assets/bamboo-bag-2.jpg",
      productDetails : "Bamboo bags are eco-friendly, stylish accessories crafted from natural bamboo fibers. They’re lightweight yet durable, showcasing the versatility of bamboo as a sustainable material. Artisans create these bags by weaving thin bamboo strips into intricate patterns, resulting in unique textures and designs that celebrate traditional craftsmanship. Bamboo bags often feature minimalistic designs, but can also be adorned with elements like fabric linings, leather straps, or colorful accents."
    },
  ];

  const handloomProducts = [
    {
      id: 14,
      title: "Stole",
      description:
        "Crafted from natural fibers, each piece is uniquely colored using plant-based dyes lending it a soft, earthy palette.",
      imgSrc: "../assets/handloom1.jpg",
      productDetails:
        "A hand woven stole dyed with natural pigments is a blend of elegance and sustainability. Crafted from natural fibers, each piece is uniquely colored using plant-based dyes like indigo, turmeric, or madder root, lending it a soft, earthy palette. This eco-friendly stole not only showcases traditional artistry but also embodies a gentle footprint, making it a timeless, conscious choice for any wardrobe.",
    },
    {
      id: 15,
      title: "Stole",
      description:
        "Crafted from natural fibers, each piece is uniquely colored using plant-based dyes lending it a soft, earthy palette.",
      imgSrc: "../assets/handloom2.jpg",
      productDetails:
        "A hand woven stole dyed with natural pigments is a blend of elegance and sustainability. Crafted from natural fibers, each piece is uniquely colored using plant-based dyes like indigo, turmeric, or madder root, lending it a soft, earthy palette. This eco-friendly stole not only showcases traditional artistry but also embodies a gentle footprint, making it a timeless, conscious choice for any wardrobe.",
    },

    {
      id: 17,
      title: "Runner set",
      description:
        "The Handloom table runners are exquisite textile pieces that bring warmth to any dining or living space.",
      imgSrc: "../assets/handloom4.jpg",
      productDetails:
        "The Handloom table runners are exquisite textile pieces that bring warmth to any dining or living space. Crafted using traditional weaving techniques, these runners often feature intricate patterns and rich textures that reflect the artistry of skilled artisans.Each handloom table runner is unique, showcasing the subtle variations in color and weave that come from the manual process. Made from natural fibers they are not only beautiful but also durable and eco-friendly.",
    },
    {
      id: 18,
      title: "Runner Set",
      description:
        "The Handloom table runners are exquisite textile pieces that bring warmth to any dining or living space.",
      imgSrc: "../assets/handloom5.jpg",
      productDetails:
        "The Handloom table runners are exquisite textile pieces that bring warmth to any dining or living space. Crafted using traditional weaving techniques, these runners often feature intricate patterns and rich textures that reflect the artistry of skilled artisans.Each handloom table runner is unique, showcasing the subtle variations in color and weave that come from the manual process. Made from natural fibers they are not only beautiful but also durable and eco-friendly.",
    },
    {
      id: 19,
      title: "Runner Set",
      description:
        "The Handloom table runners are exquisite textile pieces that bring warmth to any dining or living space.",
      imgSrc: "../assets/handloom6.jpg",
      productDetails:
        "The Handloom table runners are exquisite textile pieces that bring warmth to any dining or living space. Crafted using traditional weaving techniques, these runners often feature intricate patterns and rich textures that reflect the artistry of skilled artisans.Each handloom table runner is unique, showcasing the subtle variations in color and weave that come from the manual process. Made from natural fibers they are not only beautiful but also durable and eco-friendly.",
    },
    {
      id: 20,
      title: "Runner Set",
      description:
        "The Handloom table runners are exquisite textile pieces that bring warmth to any dining or living space.",
      imgSrc: "../assets/handloom7.jpg",
      productDetails:
        "The Handloom table runners are exquisite textile pieces that bring warmth to any dining or living space. Crafted using traditional weaving techniques, these runners often feature intricate patterns and rich textures that reflect the artistry of skilled artisans.Each handloom table runner is unique, showcasing the subtle variations in color and weave that come from the manual process. Made from natural fibers they are not only beautiful but also durable and eco-friendly.",
    },
    {
      id: 21,
      title: "Runner Set",
      description:
        "The Handloom table runners are exquisite textile pieces that bring warmth to any dining or living space.",
      imgSrc: "../assets/handloom8.jpg",
      productDetails:
        "The Handloom table runners are exquisite textile pieces that bring warmth to any dining or living space. Crafted using traditional weaving techniques, these runners often feature intricate patterns and rich textures that reflect the artistry of skilled artisans.Each handloom table runner is unique, showcasing the subtle variations in color and weave that come from the manual process. Made from natural fibers they are not only beautiful but also durable and eco-friendly.",
    },
    {
      id: 22,
      title: "Runner Set",
      description:
        "The Handloom table runners are exquisite textile pieces that bring warmth to any dining or living space.",
      imgSrc: "../assets/handloom10.jpg",
      productDetails:
        "The Handloom table runners are exquisite textile pieces that bring warmth to any dining or living space. Crafted using traditional weaving techniques, these runners often feature intricate patterns and rich textures that reflect the artistry of skilled artisans.Each handloom table runner is unique, showcasing the subtle variations in color and weave that come from the manual process. Made from natural fibers they are not only beautiful but also durable and eco-friendly.",
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
                <Link to={`/product-details/${product.id}`} state={{ product }}>
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
                <Link to={`/product-details/${product.id}`} state={{ product }}>
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

      <br />
      <br />
      <br />
      <h1 id="handloom" data-aos="fade-up"></h1>
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
                <Link to={`/product-details/${product.id}`} state={{ product }}>
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
    </div>
  );
}

export default Products;
