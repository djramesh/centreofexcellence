import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { HiTrash, HiMinus, HiPlus, HiShoppingCart, HiRefresh } from "react-icons/hi";
import SmartImage from "./common/SmartImage";
import "./Cart.css";

/** Explain, in plain language, what the server changed about a cart line. */
function noticeText(notice) {
  switch (notice.type) {
    case "removed":
      return `${notice.name} was removed — it is ${notice.reason}.`;
    case "price":
      return `The price of ${notice.name} changed from ₹${notice.from.toLocaleString(
        "en-IN"
      )} to ₹${notice.to.toLocaleString("en-IN")}.`;
    case "quantity":
      return `Only ${notice.to} of ${notice.name} left, so your quantity was reduced from ${notice.from}.`;
    default:
      return "";
  }
}

const Cart = () => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    cartTotal,
    notices,
    dismissNotices,
    syncing,
    syncWithServer,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setLoaded(true));
  }, []);

  const hasUnavailable = cartItems.some((item) => item.stock != null && item.stock <= 0);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      // Return here after signing in rather than dropping them on the home page.
      navigate("/login", { state: { from: "/cart" } });
      return;
    }
    navigate("/checkout");
  };

  if (cartItems.length === 0) {
    return (
      <div className={`cart-page${loaded ? " cart-loaded" : ""}`}>
        <div className="cart-wrap">
          <div className="cart-header">
            <div>
              <span className="cart-eyebrow">Shopping</span>
              <h1 className="cart-title">Your Cart</h1>
              <p className="cart-subtitle">Review and manage your items</p>
            </div>
          </div>

          {notices.length > 0 && (
            <div className="cart-notices">
              <div className="cart-notices-head">
                <strong>Your cart was updated</strong>
                <button type="button" onClick={dismissNotices} aria-label="Dismiss">✕</button>
              </div>
              <ul>
                {notices.map((notice, i) => (
                  <li key={i}>{noticeText(notice)}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="cart-card">
            <div className="cart-empty">
              <div className="cart-empty-icon">🛒</div>
              <h2 className="cart-empty-title">Your cart is empty</h2>
              <p className="cart-empty-sub">Start shopping to add items to your cart</p>
              <button className="button cart-empty-btn" onClick={() => navigate("/products")}>
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
        <div className="cart-header">
          <div>
            <span className="cart-eyebrow">Shopping</span>
            <h1 className="cart-title">Your Cart</h1>
            <p className="cart-subtitle">
              {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} · ₹
              {cartTotal.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="cart-count-pill">
            {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
          </div>
        </div>

        {/* Prices and stock live in localStorage and can be stale; the context
            re-checks them against the server and reports what moved. */}
        {notices.length > 0 && (
          <div className="cart-notices">
            <div className="cart-notices-head">
              <strong>Your cart was updated</strong>
              <button type="button" onClick={dismissNotices} aria-label="Dismiss">✕</button>
            </div>
            <ul>
              {notices.map((notice, i) => (
                <li key={i}>{noticeText(notice)}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="cart-content">
          <div className="cart-items-section">
            {cartItems.map((item, idx) => {
              const soldOut = item.stock != null && item.stock <= 0;
              const atMax = item.stock != null && item.quantity >= item.stock;

              return (
                <div
                  key={item.id}
                  className={`cart-item${soldOut ? " cart-item-out" : ""}`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="cart-item-img-wrap">
                    <SmartImage
                      src={item.thumbnail_url}
                      alt={item.name}
                      className="cart-item-img"
                      wrapperClassName="cart-item-img-ph"
                    />
                  </div>

                  <div className="cart-item-details">
                    <h3 className="cart-item-name">
                      {item.slug ? (
                        <Link to={`/products/${item.slug}`}>{item.name}</Link>
                      ) : (
                        item.name
                      )}
                    </h3>
                    <p className="cart-item-price">
                      ₹{(item.price || 0).toLocaleString("en-IN")} each
                    </p>

                    {soldOut ? (
                      <p className="cart-item-warn">Out of stock — remove it to continue.</p>
                    ) : atMax ? (
                      <p className="cart-item-note">Only {item.stock} available</p>
                    ) : null}

                    <div className="cart-item-actions">
                      <div className="qty-controls">
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          <HiMinus />
                        </button>
                        <span className="qty-value">{item.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={atMax || soldOut}
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          <HiPlus />
                        </button>
                      </div>

                      <button
                        className="remove-btn"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <HiTrash />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>

                  <div className="cart-item-total">
                    ₹{((item.price || 0) * item.quantity).toLocaleString("en-IN")}
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              className="cart-refresh"
              onClick={syncWithServer}
              disabled={syncing}
            >
              <HiRefresh /> {syncing ? "Checking availability…" : "Re-check prices & stock"}
            </button>
          </div>

          <div className="cart-summary-wrap">
            <div className="cart-summary-card">
              <div className="summary-header">
                <h2 className="summary-title">Order Summary</h2>
              </div>

              <div className="summary-body">
                <div className="summary-row">
                  <span className="summary-label">
                    Subtotal ({cartItems.length} item{cartItems.length !== 1 ? "s" : ""})
                  </span>
                  <span className="summary-value">₹{cartTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Shipping</span>
                  <span className="summary-value summary-free">FREE</span>
                </div>
                <div className="summary-row summary-row-total">
                  <span className="summary-label">Total</span>
                  <span className="summary-total">₹{cartTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {hasUnavailable && (
                <p className="cart-blocked">
                  Remove the out-of-stock items above to continue to checkout.
                </p>
              )}

              <div className="summary-actions">
                <button
                  className="button cart-checkout-btn"
                  onClick={handleCheckout}
                  disabled={hasUnavailable}
                >
                  <HiShoppingCart />
                  Proceed to Checkout
                </button>
                <button className="button-1 cart-continue-btn" onClick={() => navigate("/products")}>
                  Continue Shopping
                </button>
              </div>

              <div className="summary-security">
                <svg
                  className="security-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
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
