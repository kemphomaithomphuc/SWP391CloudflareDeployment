import {
  api,
  type APIResponse,
  type PayPenaltyResponse,
  type UserDTO,
} from "../services/api";

export type PenaltyUserDTO = UserDTO;
export type PenaltyUserProfileResponse = APIResponse<UserDTO>;

export const fetchPenaltyUserProfile = async (
  userId: number
): Promise<PenaltyUserProfileResponse> => {
  try {
    const response = await api.get<PenaltyUserProfileResponse>(
      `/api/user/profile/${userId}`
    );
    return response.data;
  } catch (error) {
    console.error("[PenaltyPaymentAPI] fetchPenaltyUserProfile error:", error);
    throw error;
  }
};

export interface UnlockPenaltyPayload {
  userId: number;
  paymentMethod: string;
}

export const unlockBannedUser = async ({
  userId,
  paymentMethod,
}: UnlockPenaltyPayload): Promise<PayPenaltyResponse> => {
  try {
    const response = await api.post<PayPenaltyResponse>(
      "/api/penalties/pay-and-unlock",
      {
        userId,
        paymentMethod,
      }
    );
    return response.data;
  } catch (error) {
    console.error("[PenaltyPaymentAPI] unlockBannedUser error:", error);
    throw error;
  }
};

