import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { createOrder, verifyPayment } from "../api/checkout";
import { HiLocationMarker, HiPhone, HiMail, HiShoppingBag, HiCheckCircle, HiCreditCard } from "react-icons/hi";
import "./Checkout.css";

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user, isAuthenticated }              = useAuth();
  const navigate                               = useNavigate();

  const [address, setAddress] = useState({
    line1: "", line2: "", city: "", state: "", pincode: "", country: "India",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    if (cartItems.length === 0) { navigate("/cart"); return; }
    requestAnimationFrame(() => setMounted(true));
  }, [isAuthenticated, cartItems, navigate]);

  const handleAddressChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload  = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!address.line1 || !address.city || !address.state || !address.pincode) {
      setError("Please fill all required address fields");
      return;
    }

    setLoading(true); setError("");

    try {
      const orderResponse = await createOrder({
        items: cartItems.map(item => ({ productId: item.id, quantity: item.quantity, price: item.price || 0 })),
        address,
        totalAmount: getCartTotal(),
      });

      const { razorpayOrderId, orderId } = orderResponse;

      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded) { setError("Failed to load payment gateway"); setLoading(false); return; }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: getCartTotal() * 100,
        currency: "INR",
        name: "Shristi & Prerana Co-operative",
        description: `Order #${orderId}`,
        order_id: razorpayOrderId,
        handler: async function (response) {
          try {
            await verifyPayment({
              orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            clearCart();
            navigate(`/orders/${orderId}`, { state: { success: true, orderId } });
          } catch (err) {
            setError(err?.data?.message || "Payment verification failed. Please contact support.");
            setLoading(false);
          }
        },
        prefill: { name: user?.name || "", email: user?.email || "", contact: user?.phone || "" },
        theme: { color: "#2484ff" },
        modal: { ondismiss: () => setLoading(false) },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError(err?.data?.message || "Failed to create order. Please try again.");
      setLoading(false);
    }
  };

  if (!isAuthenticated || cartItems.length === 0) return null;

  return (
    <div className={`checkout-page${mounted ? " checkout-loaded" : ""}`}>

      {/* ── Header ── */}
      <div className="checkout-header">
        <div className="checkout-header-inner">
          <span className="checkout-eyebrow">Secure Checkout</span>
          <h1 className="checkout-title">Complete Your Order</h1>
          <p className="checkout-subtitle">{cartItems.length} item{cartItems.length !== 1 ? "s" : ""} · ₹{getCartTotal().toLocaleString("en-IN")}</p>
        </div>

        {/* Progress steps */}
        <div className="checkout-steps">
          <div className="step step-active">
            <div className="step-circle"><HiShoppingBag /></div>
            <span className="step-label">Cart</span>
          </div>
          <div className="step-line step-line-active" />
          <div className="step step-active">
            <div className="step-circle"><HiLocationMarker /></div>
            <span className="step-label">Address</span>
          </div>
          <div className="step-line" />
          <div className="step">
            <div className="step-circle"><HiCreditCard /></div>
            <span className="step-label">Payment</span>
          </div>
          <div className="step-line" />
          <div className="step">
            <div className="step-circle"><HiCheckCircle /></div>
            <span className="step-label">Done</span>
          </div>
        </div>
      </div>

      <div className="checkout-content">

        {/* ── Left: Address + Items ── */}
        <div className="checkout-left">

          {/* Address */}
          <div className="checkout-card" style={{ animationDelay: "0.1s" }}>
            <div className="card-header">
              <HiLocationMarker className="card-icon" />
              <h2 className="card-title">Delivery Address</h2>
            </div>
            <div className="address-form">
              <div className="form-group">
                <input
                  type="text"
                  name="line1"
                  placeholder="Address Line 1 *"
                  value={address.line1}
                  onChange={handleAddressChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  name="line2"
                  placeholder="Address Line 2 (Optional)"
                  value={address.line2}
                  onChange={handleAddressChange}
                  className="form-input"
                />
              </div>
              <div className="form-row">
                <input
                  type="text"
                  name="city"
                  placeholder="City *"
                  value={address.city}
                  onChange={handleAddressChange}
                  className="form-input"
                  required
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State *"
                  value={address.state}
                  onChange={handleAddressChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-row">
                <input
                  type="text"
                  name="pincode"
                  placeholder="Pincode *"
                  value={address.pincode}
                  onChange={handleAddressChange}
                  className="form-input"
                  required
                />
                <input
                  type="text"
                  name="country"
                  placeholder="Country"
                  value={address.country}
                  onChange={handleAddressChange}
                  className="form-input form-input-readonly"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="checkout-card" style={{ animationDelay: "0.2s" }}>
            <div className="card-header">
              <HiShoppingBag className="card-icon" />
              <h2 className="card-title">Order Summary</h2>
            </div>
            <div className="order-items-list">
              {cartItems.map((item, idx) => (
                <div key={item.id} className="order-item" style={{ animationDelay: `${0.25 + idx * 0.05}s` }}>
                  <div className="order-item-img-wrap">
                    <img
                      src={item.imgSrc || item.thumbnail_url || "/placeholder.jpg"}
                      alt={item.title || item.name}
                      className="order-item-img"
                    />
                  </div>
                  <div className="order-item-details">
                    <h4 className="order-item-title">{item.title || item.name}</h4>
                    <p className="order-item-meta">Quantity: {item.quantity}</p>
                  </div>
                  <div className="order-item-price">
                    ₹{((item.price || 0) * item.quantity).toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── Right: Price summary + Payment ── */}
        <div className="checkout-right">
          <div className="summary-card" style={{ animationDelay: "0.15s" }}>

            <div className="summary-header">
              <h2 className="summary-title">Price Details</h2>
            </div>

            <div className="summary-body">
              <div className="price-row">
                <span className="price-label">Price ({cartItems.length} item{cartItems.length !== 1 ? "s" : ""})</span>
                <span className="price-value">₹{getCartTotal().toLocaleString("en-IN")}</span>
              </div>
              <div className="price-row">
                <span className="price-label">Delivery Charges</span>
                <span className="price-value price-free">FREE</span>
              </div>
              <div className="price-row price-row-total">
                <span className="price-label">Total Amount</span>
                <span className="price-value price-total">₹{getCartTotal().toLocaleString("en-IN")}</span>
              </div>
            </div>

            {error && (
              <div className="checkout-error">
                <span>⚠</span>
                {error}
              </div>
            )}

            <button
              className="button payment-btn"
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner" />
                  Processing...
                </>
              ) : (
                <>
                  <HiCreditCard />
                  Pay ₹{getCartTotal().toLocaleString("en-IN")}
                </>
              )}
            </button>

            <div className="payment-security">
              <HiCheckCircle className="security-icon" />
              <p>Secure payment powered by Razorpay</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;