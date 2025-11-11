import { api } from "../services/api";

export interface CalculateRetryPaymentParams {
  transactionId: number;
  userId: number;
}

export interface CalculateRetryPaymentData {
  totalAmount?: number;
  penalties?: Array<{
    feeId: number;
    amount: number;
    type: string;
    description?: string;
  }>;
  [key: string]: unknown;
}

export interface CalculateRetryPaymentResponse {
  success: boolean;
  message?: string;
  data?: CalculateRetryPaymentData;
}

export const calculateRetryPayment = async ({
  transactionId,
  userId,
}: CalculateRetryPaymentParams): Promise<CalculateRetryPaymentResponse> => {
  const response = await api.get<CalculateRetryPaymentResponse>(
    "/api/payment/calculate-retry",
    {
      params: {
        transactionId,
        userId,
      },
    }
  );

  return response.data;
};

