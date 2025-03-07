import React from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import About from './components/About';
import Contact from './components/Contact';
import Products from './components/Products';
import Society from './components/Society';
import Gallery from './components/Gallery';
import Order from './components/Order'
import ProductDetails from './components/ProductDetails';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';
import Footer from './components/Footer';


const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route
            path="/product-details/:productId"
            element={<ProductDetails />}
          />
        <Route path="/societies" element={<Society/>} />
        <Route path="/gallery" element={<Gallery/>} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/order" element={<Order />} />
      </Routes>
      <Footer />
    </Router>

  );
};

export default App;
