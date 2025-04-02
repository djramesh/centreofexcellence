import React from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import About from './components/About';
import Contact from './components/Contact';
import Products from './components/Products';
import Society from './components/Society';
import Shristi from './components/Shristi';
import Prerana from './components/Prerana';
import Gallery from './components/Gallery';
import Order from './components/Order';
import OIRDS from './components/OIRDS';
import CoE from './components/CoE';
import ScrollToTop from './components/ScrollToTop';
import ProductDetails from './components/ProductDetails';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';
import Footer from './components/Footer';

const App = () => {
  return (
    <div>
<Router>
      <Navbar />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route
            path="/product-details/:productId"
            element={<ProductDetails />}
          />
        {/* <Route path="/shristi" element={<Society/>} /> */}
        <Route path="/shristi-handicraft" element={<Shristi/>} />
        <Route path="/prerana-handloom" element={<Prerana/>} />
        <Route path="/gallery" element={<Gallery/>} />
        <Route path="/oirds" element={<OIRDS/>} />
        <Route path="/coe" element={<CoE/>} />
        {/* <Route path="/about" element={<About />} /> */}
        <Route path="/contact" element={<Contact />} />
        <Route path="/order" element={<Order />} />
      </Routes>
      <Footer />
    </Router>
    </div>
    

  );
};

export default App;
