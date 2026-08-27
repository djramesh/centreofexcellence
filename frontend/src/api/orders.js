import { apiClient, API_BASE_URL, getToken } from "./client.js";

export const ordersApi = {
  list: (params) => {
    const sp = new URLSearchParams(params || {}).toString();
    return apiClient.get(`/api/orders${sp ? `?${sp}` : ""}`);
  },
  get: (id) => apiClient.get(`/api/orders/${id}`),
  initiatePayment: (id) => apiClient.post(`/api/orders/${id}/initiate-payment`, {}),
  verifyPayment: (id, body) => apiClient.post(`/api/orders/${id}/verify-payment`, body),

  /**
   * Fetch the invoice PDF as a Blob.
   * Kept out of apiClient because the response is binary, not JSON, but it
   * still needs the bearer token — so it cannot be a plain link.
   */
  async downloadInvoice(id) {
    const res = await fetch(`${API_BASE_URL}/api/orders/${id}/invoice`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message || "Could not generate the invoice.");
    }
    return res.blob();
  },
};

export default ordersApi;
