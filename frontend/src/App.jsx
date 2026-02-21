import React from "react";
import Home from "./components/Home";
import About from "./components/About";
import Contact from "./components/Contact";
import Products from "./components/Products";
import Society from "./components/Society";
import Shristi from "./components/Shristi";
import Prerana from "./components/Prerana";
import Gallery from "./components/Gallery";
import Order from "./components/Order";
import OIRDS from "./components/OIRDS";
import CoE from "./components/CoE";
import ProductDetails from "./components/ProductDetails";
import Login from "./components/Login";
import Register from "./components/Register";
import Profile from "./components/Profile";
import Cart from "./components/Cart";
import Checkout from "./components/Checkout";
import ProtectedRoute from "./components/ProtectedRoute";
import OrdersList, { OrderDetail } from "./components/Orders";
import StoreLayout from "./components/StoreLayout";
import AdminLogin from "./components/admin/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminOrders, { AdminOrderDetail } from "./components/admin/AdminOrders";
import AdminProducts from "./components/admin/AdminProducts";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

const App = () => {
  return (
    <div>
      <Router>
        <Routes>
          {/* Admin: login (no layout) */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin: dashboard + orders + products (admin layout) */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="products" element={<AdminProducts />} />
          </Route>

          {/* Store: all customer-facing routes with Navbar/Footer */}
          <Route path="/" element={<StoreLayout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            {/* ✅ FIXED: was product-details/:productId — navigation uses state, no param needed */}
            <Route path="product-details" element={<ProductDetails />} />
            <Route path="shristi-handicraft" element={<Shristi />} />
            <Route path="prerana-handloom" element={<Prerana />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="oirds" element={<OIRDS />} />
            <Route path="coe" element={<CoE />} />
            <Route path="contact" element={<Contact />} />
            <Route path="order" element={<Order />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route
              path="account"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="cart" element={<Cart />} />
            <Route
              path="checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders"
              element={
                <ProtectedRoute>
                  <OrdersList />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders/:id"
              element={
                <ProtectedRoute>
                  <OrderDetail />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
};

export default App;