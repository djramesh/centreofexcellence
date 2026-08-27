import { apiClient } from "./client.js";

const prefix = "/api/admin";
const shippingPrefix = "/api/shipping";

const query = (params) => {
  const clean = Object.fromEntries(
    Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== "")
  );
  const sp = new URLSearchParams(clean).toString();
  return sp ? `?${sp}` : "";
};

export const adminApi = {
  getDashboard: () => apiClient.get(`${prefix}/dashboard`),

  getOrders: (params) => apiClient.get(`${prefix}/orders${query(params)}`),
  getOrder: (id) => apiClient.get(`${prefix}/orders/${id}`),
  updateOrderStatus: (id, status) => apiClient.patch(`${prefix}/orders/${id}/status`, { status }),

  getProducts: (params) => apiClient.get(`${prefix}/products${query(params)}`),
  getProduct: (id) => apiClient.get(`${prefix}/products/${id}`),
  createProduct: (body) => apiClient.post(`${prefix}/products`, body),
  updateProduct: (id, body) => apiClient.put(`${prefix}/products/${id}`, body),
  updateProductStatus: (id, is_active) =>
    apiClient.patch(`${prefix}/products/${id}/status`, { is_active }),
  updateProductStock: (id, stock) => apiClient.patch(`${prefix}/products/${id}/stock`, { stock }),
  deleteProduct: (id) => apiClient.delete(`${prefix}/products/${id}`),

  // ── Product gallery ──────────────────────────────────────────────────────
  getProductImages: (id) => apiClient.get(`${prefix}/products/${id}/images`),
  /** `files` is a FileList or array; uploads them all in one request. */
  uploadProductImages: (id, files) => {
    const form = new FormData();
    Array.from(files).forEach((file) => form.append("images", file));
    return apiClient.post(`${prefix}/products/${id}/images`, form);
  },
  reorderProductImages: (id, { order, primaryId }) =>
    apiClient.patch(`${prefix}/products/${id}/images`, { order, primaryId }),
  deleteProductImage: (id, imageId) =>
    apiClient.delete(`${prefix}/products/${id}/images/${imageId}`),

  getCategories: () => apiClient.get(`${prefix}/categories`),
  getSocietyRevenue: () => apiClient.get(`${prefix}/revenue/by-society`),
};

export const shippingApi = {
  /** Courier list backing the manual-tracking dropdown. */
  getCarriers: () => apiClient.get(`${shippingPrefix}/carriers`),

  getTracking: (orderId) => apiClient.get(`${shippingPrefix}/orders/${orderId}/tracking`),

  /** Record a shipment handed to any third-party courier. */
  saveTracking: (orderId, body) =>
    apiClient.put(`${shippingPrefix}/orders/${orderId}/tracking`, body),
  clearTracking: (orderId) => apiClient.delete(`${shippingPrefix}/orders/${orderId}/tracking`),

  // ShipRocket-specific
  createShipment: (orderId, body) =>
    apiClient.post(`${shippingPrefix}/orders/${orderId}/create-shipment`, body),
  updateTracking: (orderId) =>
    apiClient.post(`${shippingPrefix}/orders/${orderId}/update-tracking`, {}),
  getAvailableCouriers: (params) => apiClient.get(`${shippingPrefix}/couriers${query(params)}`),
};

export default adminApi;
