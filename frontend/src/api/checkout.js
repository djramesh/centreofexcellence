import { apiClient } from "./client";

export function createOrder(orderData) {
  return apiClient.post("/api/checkout/create-order", orderData);
}

export function verifyPayment(paymentData) {
  return apiClient.post("/api/checkout/verify-payment", paymentData);
}
