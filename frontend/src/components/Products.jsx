import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import "./Products.css";
import "./Common.css";
import "./Order.jsx";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingBag, faShoppingCart } from "@fortawesome/free-solid-svg-icons";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function Products() {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({
      duration: 1000,
      easing: "ease-in-out",
      once: true,
    });
  }, []);

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    const productWithPrice = { ...product, price: product.price || 800 }; // Default price if not set
    addToCart(productWithPrice, 1);
  };

  const handleOrderNow = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    const productWithPrice = { ...product, price: product.price || 500 };
    addToCart(productWithPrice, 1);
    navigate("/checkout");
  };

  const waterHyacinthProducts = [
    {
      id: 1,
      title: "Hand Bag",
      price: 1200,
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

  const preranaProducts = [
    {
      id: 3,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0001.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 4,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0002.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 5,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0003.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 6,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0004.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 7,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0005.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 8,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0006.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 9,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0007.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 10,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0008.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 11,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0009.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 12,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0010.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 13,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0011.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 14,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0012.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 15,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0013.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 16,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0014.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 17,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0015.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 18,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0016.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 19,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0017.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 20,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0018.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 21,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0019.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 22,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0020.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 23,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0021.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 24,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0022.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 25,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0023.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 26,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0024.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 27,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0025.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 28,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0026.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 29,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0027.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 30,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0028.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 31,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0029.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 32,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0030.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
    {
      id: 33,
      title: "Prerana Product",
      description: "Beautiful handcrafted product from Prerana community",
      imgSrc: "../assets/IMG-20260129-WA0031.jpg",
      productDetails: "Prerana is a women's empowerment initiative that creates beautiful handcrafted products showcasing traditional artistry and contemporary design.",
    },
  ];

  const shristiProducts = [
    {
      id: 34,
      title: "Shristi Product",
      description: "Beautiful handcrafted product from Shristi community",
      imgSrc: "../assets/IMG_3865.jpeg",
      productDetails: "Shristi is a women's collective that creates exquisite handcrafted products combining traditional techniques with modern aesthetics.",
    },
    {
      id: 35,
      title: "Shristi Product",
      description: "Beautiful handcrafted product from Shristi community",
      imgSrc: "../assets/IMG_3866.jpeg",
      productDetails: "Shristi is a women's collective that creates exquisite handcrafted products combining traditional techniques with modern aesthetics.",
    },
    {
      id: 36,
      title: "Shristi Product",
      description: "Beautiful handcrafted product from Shristi community",
      imgSrc: "../assets/IMG_3867.jpeg",
      productDetails: "Shristi is a women's collective that creates exquisite handcrafted products combining traditional techniques with modern aesthetics.",
    },
    {
      id: 37,
      title: "Shristi Product",
      description: "Beautiful handcrafted product from Shristi community",
      imgSrc: "../assets/IMG_3868.jpeg",
      productDetails: "Shristi is a women's collective that creates exquisite handcrafted products combining traditional techniques with modern aesthetics.",
    },
    {
      id: 38,
      title: "Shristi Product",
      description: "Beautiful handcrafted product from Shristi community",
      imgSrc: "../assets/IMG_3869.jpeg",
      productDetails: "Shristi is a women's collective that creates exquisite handcrafted products combining traditional techniques with modern aesthetics.",
    },
    {
      id: 39,
      title: "Shristi Product",
      description: "Beautiful handcrafted product from Shristi community",
      imgSrc: "../assets/IMG_3870.jpeg",
      productDetails: "Shristi is a women's collective that creates exquisite handcrafted products combining traditional techniques with modern aesthetics.",
    },
    {
      id: 40,
      title: "Shristi Product",
      description: "Beautiful handcrafted product from Shristi community",
      imgSrc: "../assets/IMG_3874.jpeg",
      productDetails: "Shristi is a women's collective that creates exquisite handcrafted products combining traditional techniques with modern aesthetics.",
    },
    {
      id: 41,
      title: "Shristi Product",
      description: "Beautiful handcrafted product from Shristi community",
      imgSrc: "../assets/IMG_3875.jpeg",
      productDetails: "Shristi is a women's collective that creates exquisite handcrafted products combining traditional techniques with modern aesthetics.",
    },
    {
      id: 42,
      title: "Shristi Product",
      description: "Beautiful handcrafted product from Shristi community",
      imgSrc: "../assets/IMG_3876.jpeg",
      productDetails: "Shristi is a women's collective that creates exquisite handcrafted products combining traditional techniques with modern aesthetics.",
    },
    {
      id: 43,
      title: "Shristi Product",
      description: "Beautiful handcrafted product from Shristi community",
      imgSrc: "../assets/IMG_3877.jpeg",
      productDetails: "Shristi is a women's collective that creates exquisite handcrafted products combining traditional techniques with modern aesthetics.",
    },
    {
      id: 44,
      title: "Shristi Product",
      description: "Beautiful handcrafted product from Shristi community",
      imgSrc: "../assets/IMG_3879.jpeg",
      productDetails: "Shristi is a women's collective that creates exquisite handcrafted products combining traditional techniques with modern aesthetics.",
    },
    {
      id: 45,
      title: "Shristi Product",
      description: "Beautiful handcrafted product from Shristi community",
      imgSrc: "../assets/IMG_4338.jpeg",
      productDetails: "Shristi is a women's collective that creates exquisite handcrafted products combining traditional techniques with modern aesthetics.",
    },
    {
      id: 46,
      title: "Shristi Product",
      description: "Beautiful handcrafted product from Shristi community",
      imgSrc: "../assets/IMG_4339.jpeg",
      productDetails: "Shristi is a women's collective that creates exquisite handcrafted products combining traditional techniques with modern aesthetics.",
    },
    {
      id: 47,
      title: "Shristi Product",
      description: "Beautiful handcrafted product from Shristi community",
      imgSrc: "../assets/IMG_4341.jpeg",
      productDetails: "Shristi is a women's collective that creates exquisite handcrafted products combining traditional techniques with modern aesthetics.",
    },
    {
      id: 48,
      title: "Shristi Product",
      description: "Beautiful handcrafted product from Shristi community",
      imgSrc: "../assets/IMG_4342.jpeg",
      productDetails: "Shristi is a women's collective that creates exquisite handcrafted products combining traditional techniques with modern aesthetics.",
    },
    {
      id: 49,
      title: "Shristi Product",
      description: "Beautiful handcrafted product from Shristi community",
      imgSrc: "../assets/IMG_4394.jpeg",
      productDetails: "Shristi is a women's collective that creates exquisite handcrafted products combining traditional techniques with modern aesthetics.",
    },
    {
      id: 50,
      title: "Shristi Product",
      description: "Beautiful handcrafted product from Shristi community",
      imgSrc: "../assets/IMG_4397.jpeg",
      productDetails: "Shristi is a women's collective that creates exquisite handcrafted products combining traditional techniques with modern aesthetics.",
    },
    {
      id: 51,
      title: "Shristi Product",
      description: "Beautiful handcrafted product from Shristi community",
      imgSrc: "../assets/IMG_4398.jpeg",
      productDetails: "Shristi is a women's collective that creates exquisite handcrafted products combining traditional techniques with modern aesthetics.",
    },
    {
      id: 52,
      title: "Shristi Product",
      description: "Beautiful handcrafted product from Shristi community",
      imgSrc: "../assets/IMG_4399.jpeg",
      productDetails: "Shristi is a women's collective that creates exquisite handcrafted products combining traditional techniques with modern aesthetics.",
    },
    {
      id: 53,
      title: "Shristi Product",
      description: "Beautiful handcrafted product from Shristi community",
      imgSrc: "../assets/IMG_4401.jpeg",
      productDetails: "Shristi is a women's collective that creates exquisite handcrafted products combining traditional techniques with modern aesthetics.",
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
      id: 16,
      title: "Stole",
      description:
        "Crafted from natural fibers, each piece is uniquely colored using plant-based dyes lending it a soft, earthy palette.",
      imgSrc: "../assets/glry-6.jpg",
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
        <a href="#prerana" className="scroll-link">
          Prerana
        </a>
        <a href="#shristi" className="scroll-link">
          Shristi
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
                <button
                  className="button button-secondary"
                  onClick={(e) => handleAddToCart(e, product)}
                >
                  <FontAwesomeIcon icon={faShoppingCart} /> Add to Cart
                </button>
                <button
                  className="button"
                  onClick={(e) => handleOrderNow(e, product)}
                >
                  Order Now &nbsp; <FontAwesomeIcon icon={faShoppingBag} />
                </button>
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
                <button
                  className="button button-secondary"
                  onClick={(e) => handleAddToCart(e, product)}
                >
                  <FontAwesomeIcon icon={faShoppingCart} /> Add to Cart
                </button>
                <button
                  className="button"
                  onClick={(e) => handleOrderNow(e, product)}
                >
                  Order Now &nbsp; <FontAwesomeIcon icon={faShoppingBag} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <br />
      <br />
      <br />
      <h1 id="prerana" data-aos="fade-up"></h1>
      <h3 className="animated-heading-1" data-aos="fade-up">
        Prerana Products
      </h3>
      <div className="products-label" data-aos="fade-up">
        <p className="products-label-text">Prerana Community Crafts</p>
      </div>

      <div className="product-cards-container">
        {preranaProducts.map((product) => (
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
                <button
                  className="button button-secondary"
                  onClick={(e) => handleAddToCart(e, product)}
                >
                  <FontAwesomeIcon icon={faShoppingCart} /> Add to Cart
                </button>
                <button
                  className="button"
                  onClick={(e) => handleOrderNow(e, product)}
                >
                  Order Now &nbsp; <FontAwesomeIcon icon={faShoppingBag} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <br />
      <br />
      <br />
      <h1 id="shristi" data-aos="fade-up"></h1>
      <h3 className="animated-heading-1" data-aos="fade-up">
        Shristi Products
      </h3>
      <div className="products-label" data-aos="fade-up">
        <p className="products-label-text">Shristi Community Crafts</p>
      </div>

      <div className="product-cards-container">
        {shristiProducts.map((product) => (
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
                <button
                  className="button button-secondary"
                  onClick={(e) => handleAddToCart(e, product)}
                >
                  <FontAwesomeIcon icon={faShoppingCart} /> Add to Cart
                </button>
                <button
                  className="button"
                  onClick={(e) => handleOrderNow(e, product)}
                >
                  Order Now &nbsp; <FontAwesomeIcon icon={faShoppingBag} />
                </button>
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
                <button
                  className="button button-secondary"
                  onClick={(e) => handleAddToCart(e, product)}
                >
                  <FontAwesomeIcon icon={faShoppingCart} /> Add to Cart
                </button>
                <button
                  className="button"
                  onClick={(e) => handleOrderNow(e, product)}
                >
                  Order Now &nbsp; <FontAwesomeIcon icon={faShoppingBag} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Products;
