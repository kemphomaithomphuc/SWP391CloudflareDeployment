import { api } from "../services/api";

export interface RetryPaymentRequest {
  transactionId: number;
  userId: number;
  paymentMethod: string;
}

export interface RetryPaymentData {
  transactionId?: number;
  sessionId?: number;
  amount?: number;
  paymentMethod?: string;
  status?: string;
  message?: string;
  paymentUrl?: string;
  createdAt?: string;
  paymentDetail?: unknown;
}

export interface RetryPaymentResponse {
  success: boolean;
  message?: string;
  data?: RetryPaymentData;
  timestamp?: string;
}

export const retryPayment = async (
  payload: RetryPaymentRequest
): Promise<RetryPaymentResponse> => {
  const response = await api.post<RetryPaymentResponse>("/api/payment/retry", payload);
  return response.data;
};

export default retryPayment;

