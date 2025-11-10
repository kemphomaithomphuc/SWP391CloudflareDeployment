import { api } from "../services/api";

export interface RetryPaymentRequest {
  transactionId: number;
  userId: number;
  paymentMethod: string;
}

export interface RetryPaymentData {
  paymentUrl?: string;
  [key: string]: unknown;
}

export interface RetryPaymentResponse {
  success: boolean;
  message?: string;
  data?: RetryPaymentData;
}

export const retryPayment = async (
  payload: RetryPaymentRequest
): Promise<RetryPaymentResponse> => {
  const response = await api.post<RetryPaymentResponse>("/api/payment/retry", payload);
  return response.data;
};
