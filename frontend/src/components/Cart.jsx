import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { HiTrash, HiMinus, HiPlus, HiShoppingCart } from "react-icons/hi";
import "./Cart.css";

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setLoaded(true));
  }, []);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    navigate("/checkout");
  };

  if (cartItems.length === 0) {
    return (
      <div className={`cart-page${loaded ? " cart-loaded" : ""}`}>
        <div className="cart-wrap">
          
          {/* Header */}
          <div className="cart-header">
            <div>
              <span className="cart-eyebrow">Shopping</span>
              <h1 className="cart-title">Your Cart</h1>
              <p className="cart-subtitle">Review and manage your items</p>
            </div>
          </div>

          {/* Empty state */}
          <div className="cart-card">
            <div className="cart-empty">
              <div className="cart-empty-icon">🛒</div>
              <h2 className="cart-empty-title">Your cart is empty</h2>
              <p className="cart-empty-sub">Start shopping to add items to your cart</p>
              <button
                className="button cart-empty-btn"
                onClick={() => navigate("/products")}
              >
                Browse Products
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className={`cart-page${loaded ? " cart-loaded" : ""}`}>
      <div className="cart-wrap">

        {/* Header */}
        <div className="cart-header">
          <div>
            <span className="cart-eyebrow">Shopping</span>
            <h1 className="cart-title">Your Cart</h1>
            <p className="cart-subtitle">{cartItems.length} item{cartItems.length !== 1 ? "s" : ""} · ₹{getCartTotal().toLocaleString("en-IN")}</p>
          </div>
          <div className="cart-count-pill">
            {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
          </div>
        </div>

        <div className="cart-content">

          {/* Left: Cart items */}
          <div className="cart-items-section">
            {cartItems.map((item, idx) => (
              <div key={item.id} className="cart-item" style={{ animationDelay: `${idx * 0.05}s` }}>
                
                {/* Image */}
                <div className="cart-item-img-wrap">
                  <img
                    src={item.imgSrc || item.thumbnail_url || "/placeholder.jpg"}
                    alt={item.title || item.name}
                    className="cart-item-img"
                  />
                </div>

                {/* Details */}
                <div className="cart-item-details">
                  <h3 className="cart-item-name">{item.title || item.name}</h3>
                  <p className="cart-item-price">₹{(item.price || 0).toLocaleString("en-IN")} each</p>

                  {/* Actions row */}
                  <div className="cart-item-actions">
                    {/* Quantity controls */}
                    <div className="qty-controls">
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        aria-label="Decrease quantity"
                      >
                        <HiMinus />
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <HiPlus />
                      </button>
                    </div>

                    {/* Remove button */}
                    <button
                      className="remove-btn"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <HiTrash />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>

                {/* Total price */}
                <div className="cart-item-total">
                  ₹{((item.price || 0) * item.quantity).toLocaleString("en-IN")}
                </div>

              </div>
            ))}
          </div>

          {/* Right: Summary card */}
          <div className="cart-summary-wrap">
            <div className="cart-summary-card">
              
              <div className="summary-header">
                <h2 className="summary-title">Order Summary</h2>
              </div>

              <div className="summary-body">
                <div className="summary-row">
                  <span className="summary-label">Subtotal ({cartItems.length} item{cartItems.length !== 1 ? "s" : ""})</span>
                  <span className="summary-value">₹{getCartTotal().toLocaleString("en-IN")}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Shipping</span>
                  <span className="summary-value summary-free">FREE</span>
                </div>
                <div className="summary-row summary-row-total">
                  <span className="summary-label">Total</span>
                  <span className="summary-total">₹{getCartTotal().toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="summary-actions">
                <button className="button cart-checkout-btn" onClick={handleCheckout}>
                  <HiShoppingCart />
                  Proceed to Checkout
                </button>
                <button className="button-1 cart-continue-btn" onClick={() => navigate("/products")}>
                  Continue Shopping
                </button>
              </div>

              <div className="summary-security">
                <svg className="security-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p>Secure checkout powered by Razorpay</p>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Cart;