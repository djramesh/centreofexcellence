import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { createOrder, verifyPayment } from "../api/checkout";
import { HiLocationMarker, HiPhone, HiMail } from "react-icons/hi";
import "./Checkout.css";

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (cartItems.length === 0) {
      navigate("/cart");
      return;
    }
  }, [isAuthenticated, cartItems, navigate]);

  const handleAddressChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!address.line1 || !address.city || !address.state || !address.pincode) {
      setError("Please fill all required address fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create order on backend
      const orderResponse = await createOrder({
        items: cartItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price || 0,
        })),
        address,
        totalAmount: getCartTotal(),
      });

      const { razorpayOrderId, orderId } = orderResponse;

      // Load Razorpay script
      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded) {
        setError("Failed to load payment gateway");
        setLoading(false);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: getCartTotal() * 100, // Amount in paise
        currency: "INR",
        name: "COE E-commerce",
        description: `Order #${orderId}`,
        order_id: razorpayOrderId,
        handler: async function (response) {
          try {
            // Verify payment on backend
            await verifyPayment({
              orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            clearCart();
            navigate(`/orders/${orderId}`, {
              state: { success: true, orderId },
            });
          } catch (err) {
            setError(
              err?.data?.message || "Payment verification failed. Please contact support."
            );
            setLoading(false);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError(
        err?.data?.message || "Failed to create order. Please try again."
      );
      setLoading(false);
    }
  };

  if (!isAuthenticated || cartItems.length === 0) {
    return null;
  }

  return (
    <div className="checkout-container">
      <h1 className="checkout-title">Checkout</h1>
      <div className="checkout-content">
        <div className="checkout-left">
          {/* Delivery Address */}
          <div className="checkout-section">
            <h2>
              <HiLocationMarker /> Delivery Address
            </h2>
            <div className="address-form">
              <div className="form-row">
                <input
                  type="text"
                  name="line1"
                  placeholder="Address Line 1 *"
                  value={address.line1}
                  onChange={handleAddressChange}
                  required
                />
              </div>
              <div className="form-row">
                <input
                  type="text"
                  name="line2"
                  placeholder="Address Line 2"
                  value={address.line2}
                  onChange={handleAddressChange}
                />
              </div>
              <div className="form-row">
                <input
                  type="text"
                  name="city"
                  placeholder="City *"
                  value={address.city}
                  onChange={handleAddressChange}
                  required
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State *"
                  value={address.state}
                  onChange={handleAddressChange}
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
                  required
                />
                <input
                  type="text"
                  name="country"
                  placeholder="Country"
                  value={address.country}
                  onChange={handleAddressChange}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="checkout-section">
            <h2>Order Items</h2>
            <div className="order-items">
              {cartItems.map((item) => (
                <div key={item.id} className="order-item">
                  <img
                    src={item.imgSrc || item.thumbnail_url || "/placeholder.jpg"}
                    alt={item.title || item.name}
                  />
                  <div className="order-item-details">
                    <h4>{item.title || item.name}</h4>
                    <p>Qty: {item.quantity}</p>
                  </div>
                  <div className="order-item-price">
                    ₹{((item.price || 0) * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="checkout-right">
          <div className="order-summary-card">
            <h2>Price Details</h2>
            <div className="price-row">
              <span>Price ({cartItems.length} items)</span>
              <span>₹{getCartTotal().toLocaleString()}</span>
            </div>
            <div className="price-row">
              <span>Delivery Charges</span>
              <span className="free">FREE</span>
            </div>
            <div className="price-row total">
              <span>Total Amount</span>
              <span>₹{getCartTotal().toLocaleString()}</span>
            </div>
            {error && <div className="checkout-error">{error}</div>}
            <button
              className="button payment-btn"
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? "Processing..." : `Pay ₹${getCartTotal().toLocaleString()}`}
            </button>
            <div className="payment-security">
              <p>
                <HiPhone /> Secure payment powered by Razorpay
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
