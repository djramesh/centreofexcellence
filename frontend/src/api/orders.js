import { apiClient } from "./client.js";

export const ordersApi = {
  list: (params) => {
    const sp = new URLSearchParams(params || {}).toString();
    return apiClient.get(`/api/orders${sp ? `?${sp}` : ""}`);
  },
  get: (id) => apiClient.get(`/api/orders/${id}`),
};

export default ordersApi;

