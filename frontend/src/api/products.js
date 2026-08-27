import { apiClient } from "./client.js";

const query = (params) => {
  const clean = Object.fromEntries(
    Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== "")
  );
  const sp = new URLSearchParams(clean).toString();
  return sp ? `?${sp}` : "";
};

export const productsApi = {
  list: (params) => apiClient.get(`/api/products${query(params)}`),
  byCategory: (categoryId, params) =>
    apiClient.get(`/api/products/category/${categoryId}${query(params)}`),
  bySlug: (slug) => apiClient.get(`/api/products/slug/${encodeURIComponent(slug)}`),
  byId: (id) => apiClient.get(`/api/products/${id}`),
  related: (id, limit = 4) => apiClient.get(`/api/products/${id}/related${query({ limit })}`),
};

export const categoriesApi = {
  list: () => apiClient.get("/api/categories"),
  get: (id) => apiClient.get(`/api/categories/${id}`),
};

export default productsApi;
