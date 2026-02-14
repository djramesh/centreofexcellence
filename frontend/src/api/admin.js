import { apiClient } from "./client.js";

const prefix = "/api/admin";
const shippingPrefix = "/api/shipping";

export const adminApi = {
  getDashboard: () => apiClient.get(`${prefix}/dashboard`),
  getOrders: (params) => {
    const sp = new URLSearchParams(params).toString();
    return apiClient.get(`${prefix}/orders${sp ? `?${sp}` : ""}`);
  },
  getOrder: (id) => apiClient.get(`${prefix}/orders/${id}`),
  updateOrderStatus: (id, status) =>
    apiClient.patch(`${prefix}/orders/${id}/status`, { status }),

  getProducts: (params) => {
    const sp = new URLSearchParams(params).toString();
    return apiClient.get(`${prefix}/products${sp ? `?${sp}` : ""}`);
  },
  getProduct: (id) => apiClient.get(`${prefix}/products/${id}`),
  createProduct: (body) => apiClient.post(`${prefix}/products`, body),
  updateProduct: (id, body) => apiClient.put(`${prefix}/products/${id}`, body),
  updateProductStatus: (id, is_active) =>
    apiClient.patch(`${prefix}/products/${id}/status`, { is_active }),
  updateProductStock: (id, stock) =>
    apiClient.patch(`${prefix}/products/${id}/stock`, { stock }),
  deleteProduct: (id) => apiClient.delete(`${prefix}/products/${id}`),

  getCategories: () => apiClient.get(`${prefix}/categories`),
};

// Shipping API
export const shippingApi = {
  getTracking: (orderId) => 
    apiClient.get(`${shippingPrefix}/orders/${orderId}/tracking`),
  createShipment: (orderId, body) => 
    apiClient.post(`${shippingPrefix}/orders/${orderId}/create-shipment`, body),
  updateTracking: (orderId) => 
    apiClient.post(`${shippingPrefix}/orders/${orderId}/update-tracking`, {}),
  getAvailableCouriers: (params) => {
    const sp = new URLSearchParams(params).toString();
    return apiClient.get(`${shippingPrefix}/couriers${sp ? `?${sp}` : ""}`);
  },
};