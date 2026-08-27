import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  Link,
} from "react-router-dom";

import Home from "./components/Home";
import Contact from "./components/Contact";
import Products from "./components/Products";
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
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import TermsAndConditions from "./components/TermsAndConditions";
import PrivacyPolicy from "./components/PrivacyPolicy";
import FAQ from "./components/FAQ";
import "./App.css";

/* The admin panel pulls in Recharts and the whole dashboard, none of which a
   shopper ever needs. Splitting it out keeps that weight off the storefront's
   first load; it arrives only when an admin actually navigates to /admin. */
const AdminLogin = lazy(() => import("./components/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./components/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./components/admin/AdminProducts"));
const AdminOrders = lazy(() => import("./components/admin/AdminOrders"));
const AdminOrderDetail = lazy(() =>
  import("./components/admin/AdminOrders").then((m) => ({ default: m.AdminOrderDetail }))
);

function RouteFallback() {
  return (
    <div className="route-fallback" role="status" aria-live="polite">
      <span className="route-spinner" aria-hidden="true" />
      <span>Loading…</span>
    </div>
  );
}

/**
 * Old product links pointed at /product-details and carried the product in
 * router state, so they broke on refresh and could not be shared. Keep the path
 * working by forwarding to the product's own URL.
 */
function LegacyProductRedirect() {
  const { state } = useLocation();
  const product = state?.product;
  const target = product?.slug || product?.id;
  return <Navigate to={target ? `/products/${target}` : "/products"} replace state={state} />;
}

/* A mistyped URL used to be silently redirected to the home page, which reads
   as "the site is broken" rather than "that page does not exist". */
function NotFound() {
  return (
    <div className="notfound-page">
      <div className="notfound-inner">
        <span className="notfound-icon" aria-hidden="true">🧭</span>
        <h1>Page not found</h1>
        <p>The page you were looking for doesn&apos;t exist or has moved.</p>
        <div className="notfound-actions">
          <Link to="/" className="notfound-btn notfound-btn-primary">Go home</Link>
          <Link to="/products" className="notfound-btn">Browse products</Link>
        </div>
      </div>
    </div>
  );
}

const App = () => (
  <Router>
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Admin: login (no layout) */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin: dashboard + orders + products */}
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

        {/* Store: customer-facing routes with Navbar/Footer */}
        <Route path="/" element={<StoreLayout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          {/* Product pages have a real, shareable, refreshable URL. */}
          <Route path="products/:slug" element={<ProductDetails />} />
          <Route path="product-details" element={<LegacyProductRedirect />} />
          <Route path="shristi-handicraft" element={<Shristi />} />
          <Route path="prerana-handloom" element={<Prerana />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="oirds" element={<OIRDS />} />
          <Route path="coe" element={<CoE />} />
          <Route path="contact" element={<Contact />} />
          <Route path="order" element={<Order />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="cart" element={<Cart />} />
          <Route path="terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="faq" element={<FAQ />} />

          <Route
            path="account"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
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

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  </Router>
);

export default App;
