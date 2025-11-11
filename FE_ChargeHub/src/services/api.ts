import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const api = axios.create({
    baseURL: apiBaseUrl,
});

api.interceptors.request.use((config) => {
    const accessToken = localStorage.getItem("token");
    if (accessToken) {
        config.headers = config.headers ?? {};
        (config.headers as Record<string, string>)["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Check if it's a 403 error with USER_BANNED reason
        if (error.response?.status === 403) {
            const errorData = error.response?.data;
            
            // Check for BANNED status
            if (errorData?.data?.reason === "USER_BANNED" || 
                errorData?.message?.includes("banned") ||
                errorData?.message?.includes("khóa")) {
                console.log("User is BANNED, redirecting to penalty payment");
                
                // Redirect to penalty payment page
                if (!window.location.pathname.includes('/penalty-payment')) {
                    window.location.href = "/penalty-payment";
                }
                return Promise.reject(error);
            }
            
            // Check for INACTIVE status
            if (errorData?.data?.reason === "USER_INACTIVE" || 
                errorData?.message?.includes("inactive") ||
                errorData?.message?.includes("chưa được kích hoạt")) {
                console.log("User is INACTIVE, limited access");
                // Don't redirect, just show error message
                return Promise.reject(error);
            }
        }

        // Check if it's a 401 error and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem("refreshToken");

            if (refreshToken) {
                try {
                    console.log("=== TOKEN REFRESH DEBUG ===");
                    console.log("Attempting to refresh token...");

                    // Call refresh token endpoint
                    const response = await axios.post(`${apiBaseUrl}/api/auth/refresh`, {
                        refreshToken: refreshToken
                    });

                    if (response.data?.success && response.data?.data?.accessToken) {
                        const newAccessToken = response.data.data.accessToken;
                        const newRefreshToken = response.data.data.refreshToken;

                        console.log("Token refresh successful");

                        // Update tokens in localStorage
                        localStorage.setItem("token", newAccessToken);
                        if (newRefreshToken) {
                            localStorage.setItem("refreshToken", newRefreshToken);
                        }

                        // Update the original request with new token
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                        // Retry the original request
                        return api(originalRequest);
                    }
                } catch (refreshError) {
                    console.error("=== TOKEN REFRESH FAILED ===");
                    console.error("Refresh error:", refreshError);

                    // Clear tokens and redirect to login
                    localStorage.removeItem("token");
                    localStorage.removeItem("refreshToken");
                    localStorage.removeItem("userId");
                    localStorage.removeItem("fullName");
                    localStorage.removeItem("email");

                    // Redirect to login page
                    window.location.href = "/";

                    return Promise.reject(refreshError);
                }
            } else {
                console.log("No refresh token available, redirecting to login");

                // Clear tokens and redirect to login
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("userId");
                localStorage.removeItem("fullName");
                localStorage.removeItem("email");

                // Redirect to login page
                window.location.href = "/";
            }
        }

        return Promise.reject(error);
    }
);

// ===== TOKEN UTILITIES =====

// Check if token is expired (with 5 minute buffer for 30-minute tokens)
export const isTokenExpired = (token: string): boolean => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3 || !parts[1]) {
            console.error("Invalid token format");
            return true;
        }
        const payload = JSON.parse(atob(parts[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        const bufferTime = 5 * 60; // 5 minutes buffer (for 30-minute tokens)
        return payload.exp < (currentTime + bufferTime);
    } catch (error) {
        console.error("Error parsing token:", error);
        return true; // Assume expired if can't parse
    }
};

// Check if token will expire soon (for 30-minute tokens)
export const isTokenExpiringSoon = (token: string): boolean => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3 || !parts[1]) {
            return false;
        }
        const payload = JSON.parse(atob(parts[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = payload.exp - currentTime;
        const warningTime = 5 * 60; // 5 minutes warning for 30-minute tokens
        return timeUntilExpiry <= warningTime && timeUntilExpiry > 0;
    } catch (error) {
        return false;
    }
};

// Proactively refresh token if it's about to expire
export const checkAndRefreshToken = async (): Promise<boolean> => {
    const accessToken = localStorage.getItem("token");
    const refreshToken = localStorage.getItem("refreshToken");

    if (!accessToken || !refreshToken) {
        return false;
    }

    if (isTokenExpired(accessToken)) {
        try {
            console.log("=== PROACTIVE TOKEN REFRESH ===");
            console.log("Token is expired, refreshing...");

            const response = await axios.post(`${apiBaseUrl}/api/auth/refresh`, {
                refreshToken: refreshToken
            });

            if (response.data?.success && response.data?.data?.accessToken) {
                const newAccessToken = response.data.data.accessToken;
                const newRefreshToken = response.data.data.refreshToken;

        console.log("Proactive token refresh successful");

        // Update tokens in localStorage
        localStorage.setItem("token", newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        return true;
      }
    } catch (error) {
      console.error("=== PROACTIVE TOKEN REFRESH FAILED ===");
      console.error("Refresh error:", error);

      // Clear tokens and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("fullName");
      localStorage.removeItem("email");

      // Redirect to login page
      window.location.href = "/";

      return false;
    }
  }

  return true; // Token is still valid
};

// ===== ORDER API TYPES =====

// Request DTOs
export interface OrderRequestDTO {
  userId: number;
  vehicleId: number;
  stationId: number;
  currentBattery: number;
  targetBattery: number;
}

export interface ConfirmOrderDTO {
  userId: number;
  vehicleId: number;
  stationId: number;
  chargingPointId: number;
  startTime: string; // ISO string format
  endTime: string; // ISO string format
  currentBattery: number;
  targetBattery: number;
  energyToCharge: number;
  estimatedCost: number;
  notes?: string;
  connectorTypeId: number;
  initialStatus?: string; // "BOOKED" for scheduled, "CHARGING" for immediate
  // IDs of slots selected by user (e.g. "FIXED_02:00_04:00", "MINI_09:30_10:45")
  slotIds?: string[];
}

export interface CancelOrderDTO {
  orderId: number;
  userId: number;
  reason?: string;
}

// Response DTOs
export interface AvailableTimeSlotDTO {
  // New slot fields returned by backend
  slotId?: string;
  slotStart?: string; // ISO string format
  slotEnd?: string;   // ISO string format
  slotDurationMinutes?: number;
  slotPrice?: number;

  // Backward-compatible fields
  freeFrom?: string; // ISO string format
  freeTo?: string; // ISO string format
  availableMinutes?: number;
  requiredMinutes?: number;
  estimatedCost?: number;
}

export interface ChargingPointAvailabilityDTO {
  chargingPointId: number;
  chargingPointName?: string;  // ✅ NEW - Tên charging point (e.g., "A1", "B2")
  connectorTypeName: string;
  chargingPower: number;
  pricePerKwh: number;
  requiredMinutes: number;
  availableSlots: AvailableTimeSlotDTO[];
  totalAvailableMinutes: number;
}

export interface VehicleInfo {
  vehicleId: number;
  brand: string;
  model: string;
  batteryCapacity: number;
  compatibleConnectors: string[];
}

export interface ChargingInfo {
  currentBattery: number;
  targetBattery: number;
  batteryToCharge: number;
  energyToCharge: number;
}

export interface AvailableSlotsResponseDTO {
  stationId: number;
  stationName: string;
  address: string;
  latitude: number;
  longitude: number;
  vehicleInfo: VehicleInfo;
  chargingInfo: ChargingInfo;
  chargingPoints: ChargingPointAvailabilityDTO[];
  availableSlots: AvailableTimeSlotDTO[];
}

export interface OrderResponseDTO {
  orderId: number;
  chargingPointId?: number;
  chargingPointName?: string;  // ✅ NEW - Tên charging point (e.g., "A1", "B2")
  stationName: string;
  stationAddress: string;
  connectorType: string;
  startTime: string; // ISO string format
  endTime: string; // ISO string format
  estimatedDuration: number;
  energyToCharge: number;
  chargingPower: number;
  pricePerKwh: number;
  estimatedCost: number;
  status: string;
  createdAt: string; // ISO string format
}

// Minimal order list item for staff views
export interface StationOrderItemDTO {
    orderId: number;
    userName?: string;
    vehiclePlate?: string;
    chargingPointId: number;
    chargingPointName?: string;  // ✅ NEW - Tên charging point (e.g., "A1", "B2")
    connectorType?: string;
    status: 'BOOKED' | 'CHARGING' | 'COMPLETED' | string;
    startTime: string;
    endTime: string;
}

export interface BatteryLevelDTO {
  vehicleId: number;
  currentBatteryPercent: number;
  batteryStatus: string;
  needsChargingSoon: boolean;
}

export interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// ===== TRANSACTION HISTORY =====
export interface TransactionHistoryParams {
  userId?: number;
  status?: string;
  paymentMethod?: string;
  fromDate?: string;
  toDate?: string;
  stationId?: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
  page?: number;
  size?: number;
}

export interface TransactionHistoryItem {
  transactionId: number;
  amount: number;
  paymentMethod?: string;
  status?: string;
  createdAt?: string;
  paymentTime?: string;
  userId?: number;
  userName?: string;
  userEmail?: string;
  sessionId?: number;
  sessionStartTime?: string;
  sessionEndTime?: string;
  powerConsumed?: number;
  stationName?: string;
  stationAddress?: string;
  vnpayTransactionNo?: string;
  vnpayBankCode?: string;
}

export interface TransactionHistoryApiResponse {
  success: boolean;
  message?: string;
  data: {
    transactions: TransactionHistoryItem[];
    totalElements?: number;
  };
}

export const getTransactionHistory = async (
  params: TransactionHistoryParams
): Promise<TransactionHistoryApiResponse> => {
  const response = await api.get("/api/transactions/history", {
    params: {
      ...params,
      status: params.status ? params.status.toUpperCase() : undefined,
      paymentMethod: params.paymentMethod ? params.paymentMethod.toUpperCase() : undefined,
      sortDirection: params.sortDirection ?? "DESC",
    },
  });
  return response.data as TransactionHistoryApiResponse;
};

// ===== STAFF: CHANGE CHARGING POINT TYPES =====
export interface ChargingPointDTO {
    chargingPointId: number;
    chargingPointName?: string;  // ✅ NEW - Tên charging point (e.g., "A1", "B2")
    status: string;
    stationId: number;
    connectorTypeId: number;
    typeName?: string;
    powerOutput?: number;
    pricePerKwh?: number;
}

export interface ChangeChargingPointRequestDTO {
    orderId: number;
    currentChargingPointId: number;
    newChargingPointId: number;
    reason?: string;
    staffId?: number;
}

export interface ChangeChargingPointResponseDTO {
    orderId: number;
    oldChargingPointId: number;
    oldChargingPointInfo?: string;
    chargingPointName?: string;  // ✅ NEW - Tên charging point mới (e.g., "A1", "B2")
    newChargingPointId: number;
    newChargingPointInfo?: string;
    driverName?: string;
    driverId?: number;
    reason?: string;
    changedAt?: string;
    changedByStaff?: string;
    notificationSent?: boolean;
    message?: string;
    stationName?: string;  // ✅ Tên trạm
}

// ===== ORDER API FUNCTIONS =====

// 1. Find available slots
export const findAvailableSlots = async (request: OrderRequestDTO): Promise<APIResponse<AvailableSlotsResponseDTO>> => {
  const response = await api.post<APIResponse<AvailableSlotsResponseDTO>>('/api/orders/find-available-slots', request);
  return response.data;
};

// 2. Confirm order
export const confirmOrder = async (request: ConfirmOrderDTO): Promise<APIResponse<OrderResponseDTO>> => {
  const response = await api.post<APIResponse<OrderResponseDTO>>('/api/orders/confirm', request);
  return response.data;
};

// 3. Get fake battery level
export const getFakeBatteryLevel = async (vehicleId: number): Promise<APIResponse<BatteryLevelDTO>> => {
  const response = await api.get<APIResponse<BatteryLevelDTO>>(`/api/orders/fake-battery/${vehicleId}`);
  return response.data;
};

// 4. Get user's orders
export const getMyOrders = async (userId: number, status?: string): Promise<APIResponse<OrderResponseDTO[]>> => {
  const params = new URLSearchParams();
  params.append('userId', userId.toString());
  if (status) {
    params.append('status', status);
  }
  
  const response = await api.get<APIResponse<OrderResponseDTO[]>>(`/api/orders/my-orders?${params.toString()}`);
  return response.data;
};

// 5. Cancel order
export const cancelOrder = async (request: CancelOrderDTO): Promise<APIResponse<OrderResponseDTO>> => {
  const response = await api.put<APIResponse<OrderResponseDTO>>('/api/orders/cancel', request);
  return response.data;
};

// ===== STAFF: CHANGE CHARGING POINT API FUNCTIONS =====
export const findAlternativeChargingPoints = async (
  orderId: number,
  currentChargingPointId: number
): Promise<APIResponse<ChargingPointDTO[]>> => {
  const params = new URLSearchParams();
  params.append('orderId', String(orderId));
  params.append('currentChargingPointId', String(currentChargingPointId));
  const response = await api.get<APIResponse<ChargingPointDTO[]>>(`/api/staff/find-alternative-points?${params.toString()}`);
  return response.data;
};

export const changeChargingPoint = async (
  payload: ChangeChargingPointRequestDTO
): Promise<APIResponse<ChangeChargingPointResponseDTO>> => {
  const response = await api.post<APIResponse<ChangeChargingPointResponseDTO>>('/api/staff/change-charging-point', payload);
  return response.data;
};

// ===== STATION SCOPED QUERIES =====
export const getStationById = async (stationId: number) => {
  const response = await api.get(`/api/stations/${stationId}`);
  return response.data;
};


// ===== SUBSCRIPTION API =====
export interface SubscriptionResponseDTO {
  subscriptionId: number;
  type: 'BASIC' | 'PLUS' | 'PRO' | string;
  startDate?: string;
  endDate?: string;
  // Optional fields if backend provides pricing/metadata
  price?: number;
  subscriptionName?: string;
  description?: string;
  durationDays?: number;
  isActive?: boolean;
  displayOrder?: number;
}

// Update subscription plan price (admin)
// Update subscription via controller's updateSubscription
export interface SubscriptionRequestDTO {
  userId?: number;
  type?: 'BASIC' | 'PLUS' | 'PRO' | 'PREMIUM' | string;
  startDate?: string;
  endDate?: string;
  subscriptionName?: string;
  description?: string;
  price?: number;
  durationDays?: number;
  isActive?: boolean;
  displayOrder?: number;
}

export const getOrdersByStation = async (
  stationId: number,
  statuses: Array<'BOOKED' | 'CHARGING' | 'COMPLETED'> = ['BOOKED', 'CHARGING']
): Promise<APIResponse<StationOrderItemDTO[]>> => {
  // Fixed: Use correct endpoint /api/orders/station/{stationId} instead of /api/orders/by-station
  const response = await api.get<APIResponse<StationOrderItemDTO[]>>(`/api/orders/station/${stationId}`);
  return response.data;
};

// ===== SUBSCRIPTION API =====
export interface SubscriptionResponseDTO {
  subscriptionId: number;
  type: 'BASIC' | 'PLUS' | 'PRO' | string;
  startDate?: string;
  endDate?: string;
  // Optional fields if backend provides pricing/metadata
  price?: number;
  subscriptionName?: string;
  description?: string;
  durationDays?: number;
  isActive?: boolean;
  displayOrder?: number;
}

export const getAllSubscriptions = async (): Promise<APIResponse<SubscriptionResponseDTO[]>> => {
  const response = await api.get<APIResponse<SubscriptionResponseDTO[]>>('/api/subscription');
  return response.data;
};

export const getUserSubscription = async (userId: number): Promise<APIResponse<SubscriptionResponseDTO>> => {
  const response = await api.get<APIResponse<SubscriptionResponseDTO>>(`/api/subscription/user/${userId}`);
  return response.data;
};

// Update subscription plan price (admin)
// Update subscription via controller's updateSubscription
export interface SubscriptionRequestDTO {
  userId?: number;
  type?: 'BASIC' | 'PLUS' | 'PRO' | 'PREMIUM' | string;
  startDate?: string;
  endDate?: string;
  subscriptionName?: string;
  description?: string;
  price?: number;
  durationDays?: number;
  isActive?: boolean;
  displayOrder?: number;
}

export const updateSubscription = async (
  subscriptionId: number | string,
  request: SubscriptionRequestDTO
): Promise<APIResponse<SubscriptionResponseDTO>> => {
  // Backend endpoint: PUT /api/subscription/updateSubscription/{subscriptionId}
  // Body: SubscriptionRequestDTO
  const response = await api.put<APIResponse<SubscriptionResponseDTO>>(
    `/api/subscription/updateSubscription/${subscriptionId}`,
    request
  );
  return response.data;
};

// ===== USER SUBSCRIPTION UPGRADE API =====
export const upgradeUserSubscription = async (
  userId: number,
  subscriptionType: 'BASIC' | 'PLUS' | 'PREMIUM'
): Promise<APIResponse<SubscriptionResponseDTO>> => {
  // Backend endpoint: PUT /api/subscription/update
  // Body: SubscriptionRequestDTO (userId và type)
  const response = await api.put<APIResponse<SubscriptionResponseDTO>>(
    `/api/subscription/update`,
    {
      userId: userId,
      type: subscriptionType,
      startDate: new Date().toISOString(),
      // endDate sẽ được BE tính tự động dựa vào durationDays của plan
    }
  );
  return response.data;
};

export interface SubscriptionPaymentRequest {
  userId: number;
  subscriptionId: number;
  returnUrl?: string;
  cancelUrl?: string;
  bankCode?: string;
}

export interface SubscriptionPaymentResult {
  paymentUrl?: string;
  [key: string]: unknown;
}

export const createSubscriptionPayment = async (
  payload: SubscriptionPaymentRequest
): Promise<APIResponse<SubscriptionPaymentResult>> => {
  const response = await api.post<APIResponse<SubscriptionPaymentResult>>(
    '/api/payment/subscription',
    payload
  );
  return response.data;
};


// ===== AUTH API FUNCTIONS =====

// Logout user
export const logoutUser = async (): Promise<APIResponse<string>> => {
    console.log("=== API LOGOUT DEBUG ===");
    console.log("Calling POST /api/auth/logout");
    console.log("Current token:", localStorage.getItem("token"));

    try {
        const response = await api.post<APIResponse<string>>('/api/auth/logout');
        console.log("Logout API response status:", response.status);
        console.log("Logout API response data:", response.data);
        console.log("Logout API response headers:", response.headers);
        return response.data;
    } catch (error) {
        console.error("=== API LOGOUT ERROR ===");
        console.error("API logout error:", error);
        console.error("Error type:", typeof error);
        console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
        if (error instanceof Error && 'response' in error) {
            console.error("Error response:", (error as any).response);
            console.error("Error response status:", (error as any).response?.status);
            console.error("Error response data:", (error as any).response?.data);
        }
        throw error;
    }
};

// Get current user ID
export const getCurrentUserId = async (): Promise<APIResponse<number>> => {
  const response = await api.post<APIResponse<number>>('/api/auth/me');
  return response.data;
};

// ===== NOTIFICATION API TYPES =====

export interface Notification {
  notificationId: number;
  title: string;
  content: string;
  sentTime: string;
  type: "BOOKING" | "PAYMENT" | "ISSUE" | "GENERAL" | "PENALTY";
  isRead: boolean;
  userId: number;
}

// ===== NOTIFICATION API FUNCTIONS =====

// Get all notifications for user
export const getNotifications = async (): Promise<Notification[]> => {
  const response = await api.get<Notification[]>('/api/notifications');
  return response.data;
};

// Get unread notification count
export const getUnreadNotificationCount = async (): Promise<number> => {
  console.log("=== API NOTIFICATION COUNT DEBUG ===");
  console.log("Calling GET /api/notifications/unread/count");
  console.log("Current token:", localStorage.getItem("token"));
  
  try {
    const response = await api.get<number>('/api/notifications/unread/count');
    console.log("Notification count API response status:", response.status);
    console.log("Notification count API response data:", response.data);
    return response.data;
  } catch (error) {
    console.error("=== API NOTIFICATION COUNT ERROR ===");
    console.error("API notification count error:", error);
    console.error("Error type:", typeof error);
    console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
    if (error instanceof Error && 'response' in error) {
      console.error("Error response:", (error as any).response);
      console.error("Error response status:", (error as any).response?.status);
      console.error("Error response data:", (error as any).response?.data);
    }
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: number): Promise<void> => {
  await api.put(`/api/notifications/${notificationId}/read`);
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (): Promise<void> => {
  await api.put('/api/notifications/mark-all-read');
};

// Create a new notification
export const createNotification = async (notificationData: {
  title: string;
  content: string;
  type: 'booking' | 'payment' | 'issue' | 'penalty' | 'general' | 'invoice' | 'late_arrival' | 'charging_complete' | 'overstay_warning' | 'report_success' | 'booking_confirmed';
}): Promise<Notification> => {
  const response = await api.post<Notification>('/api/notifications', notificationData);
  return response.data;
};

// ===== PRICE FACTOR API TYPES =====
export interface PriceFactorResponseDTO {
  priceFactorId: number;
  stationId: number;
  factor: number;
  startTime: string;
  endTime: string;
  description: string;
}

export interface PriceFactorRequestDTO {
  stationId: number;
  factor: number;
  startTime: string;
  endTime: string;
  description: string;
}

export interface PriceFactorUpdateDTO {
  factor: number;
  startTime: string;
  endTime: string;
  description: string;
}

// ===== PRICE FACTOR API FUNCTIONS =====
export const getPriceFactorsByStation = async (stationId: number): Promise<APIResponse<PriceFactorResponseDTO[]>> => {
  const response = await api.get<APIResponse<PriceFactorResponseDTO[]>>(`/api/price-factors/station/${stationId}`);
  return response.data;
};

export const getPriceFactorById = async (id: number): Promise<APIResponse<PriceFactorResponseDTO>> => {
  const response = await api.get<APIResponse<PriceFactorResponseDTO>>(`/api/price-factors/${id}`);
  return response.data;
};

export const createPriceFactor = async (request: PriceFactorRequestDTO): Promise<APIResponse<PriceFactorResponseDTO>> => {
  const response = await api.post<APIResponse<PriceFactorResponseDTO>>('/api/price-factors', request);
  return response.data;
};

export const updatePriceFactor = async (id: number, request: PriceFactorUpdateDTO): Promise<APIResponse<PriceFactorResponseDTO>> => {
  const response = await api.put<APIResponse<PriceFactorResponseDTO>>(`/api/price-factors/${id}`, request);
  return response.data;
};

export const deletePriceFactor = async (id: number): Promise<APIResponse<void>> => {
  const response = await api.delete<APIResponse<void>>(`/api/price-factors/${id}`);
  return response.data;
};

// ===== CHARGING STATION API TYPES =====
export interface ChargingStationDTO {
  stationId: number;
  stationName: string;
  address: string;
  status: string;
  latitude: number;
  longitude: number;
  chargingPointNumber: number;
  chargingPoints?: ChargingPointDTO[];
}

// ===== CHARGING STATION API FUNCTIONS =====
export const getAllChargingStations = async (): Promise<ChargingStationDTO[]> => {
  const response = await api.get<ChargingStationDTO[]>('/api/charging-stations');
  return response.data;
};

// ===== SUBSCRIPTION FEATURE API TYPES =====
export interface SubscriptionFeatureResponseDTO {
  featureId: number;
  subscriptionId: number;
  subscriptionName: string;
  featureKey: string;
  featureValue: string;
  featureType: 'NUMERIC' | 'BOOLEAN' | 'STRING' | 'PERCENTAGE' | string;
  displayName: string;
  description: string;
  createdAt: string;
}

export interface SubscriptionFeatureDTO {
  featureId?: number;
  subscriptionId: number;
  featureKey: string;
  featureValue: string;
  featureType: 'NUMERIC' | 'BOOLEAN' | 'STRING' | 'PERCENTAGE' | string;
  displayName?: string;
  description?: string;
}

// ===== SUBSCRIPTION FEATURE API FUNCTIONS =====
export const getAllSubscriptionFeatures = async (): Promise<APIResponse<SubscriptionFeatureResponseDTO[]>> => {
  const response = await api.get<APIResponse<SubscriptionFeatureResponseDTO[]>>('/api/subscription-features');
  return response.data;
};

export const getSubscriptionFeaturesBySubscription = async (subscriptionId: number): Promise<APIResponse<SubscriptionFeatureResponseDTO[]>> => {
  const response = await api.get<APIResponse<SubscriptionFeatureResponseDTO[]>>(`/api/subscription-features/subscription/${subscriptionId}`);
  return response.data;
};

export const createSubscriptionFeature = async (request: SubscriptionFeatureDTO): Promise<APIResponse<SubscriptionFeatureResponseDTO>> => {
  const response = await api.post<APIResponse<SubscriptionFeatureResponseDTO>>('/api/subscription-features', request);
  return response.data;
};

export const updateSubscriptionFeature = async (featureId: number, request: SubscriptionFeatureDTO): Promise<APIResponse<SubscriptionFeatureResponseDTO>> => {
  const response = await api.put<APIResponse<SubscriptionFeatureResponseDTO>>(`/api/subscription-features/${featureId}`, request);
  return response.data;
};

export const updateSubscriptionFeatureValue = async (featureId: number, value: string): Promise<APIResponse<SubscriptionFeatureResponseDTO>> => {
  const response = await api.patch<APIResponse<SubscriptionFeatureResponseDTO>>(`/api/subscription-features/${featureId}/value?value=${encodeURIComponent(value)}`);
  return response.data;
};

export const deleteSubscriptionFeature = async (featureId: number): Promise<APIResponse<void>> => {
  const response = await api.delete<APIResponse<void>>(`/api/subscription-features/${featureId}`);
  return response.data;
};

// ===== USER API TYPES =====
export interface UserDTO {
    userId: number;
    fullName: string;
    email?: string;
    phoneNumber?: string;
    dateOfBirth?: string;  //Added for DriverManagementView
    status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
    violations: number;
    avatarUrl?: string;
    avatar?: string;  //Alias for avatarUrl
    role: string;
    reasonReport?: string;  //Added for ban reason
    // Station info for STAFF
    stationId?: number;
    stationName?: string;
}

// ===== USER API FUNCTIONS =====
export const getUserProfile = async (userId: number): Promise<APIResponse<UserDTO>> => {
  const response = await api.get<APIResponse<UserDTO>>(`/api/user/profile/${userId}`);
  return response.data;
};

export const reportViolation = async (userId: number, reason: string): Promise<APIResponse<UserDTO>> => {
  const response = await api.post<APIResponse<UserDTO>>(`/api/user/reportViolation`, null, {
    params: { userId, reason }
  });
  return response.data;
};

// Get all users (for admin)
export const getAllUsers = async (): Promise<APIResponse<UserDTO[]>> => {
    const response = await api.get<APIResponse<UserDTO[]>>('/api/user/allDriver');
    return response.data;
};

// Update user status and role (for admin)
export const updateUserStatus = async (
    userId: number,
    status: 'ACTIVE' | 'INACTIVE' | 'BANNED',
    role?: 'DRIVER' | 'STAFF' | 'ADMIN'
): Promise<APIResponse<UserDTO>> => {
    const response = await api.put<APIResponse<UserDTO>>(
        `/api/user/profile/${userId}`,
        { status, role }
    );
    return response.data;
};

// ===== PEAK HOURS ANALYTICS API =====
export interface PeakHourDTO {
  hour: number;
  timeRange: string;
  sessionCount: number;
  totalEnergy: number;
  averageEnergy: number;
  totalRevenue: number;
  utilizationRate: number;
}

// Get peak hours analysis
export const getPeakHours = async (
  startDate?: string,
  endDate?: string,
  stationId?: number
): Promise<APIResponse<PeakHourDTO[]>> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (stationId) params.append('stationId', stationId.toString());

  const response = await api.get<APIResponse<PeakHourDTO[]>>(`/api/analytics/peak-hours?${params.toString()}`);
  return response.data;
};

// ===== STAFF MANAGEMENT API =====
export interface StaffDTO {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  role: 'DRIVER' | 'STAFF' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  stationId?: number;
  stationName?: string;
  stationAddress?: string;
}

// Get staff by station
export const getStaffByStation = async (stationId: number): Promise<APIResponse<StaffDTO[]>> => {
  const response = await api.get<APIResponse<StaffDTO[]>>(`/api/staff-management/stations/${stationId}/staff`);
  return response.data;
};

// Get all available staff (not assigned to any station)
export const getAvailableStaff = async (): Promise<APIResponse<StaffDTO[]>> => {
  const response = await api.get<APIResponse<StaffDTO[]>>('/api/staff-management/available');
  return response.data;
};

// Get staff by ID
export const getStaffById = async (userId: number): Promise<APIResponse<StaffDTO>> => {
  const response = await api.get<APIResponse<StaffDTO>>(`/api/staff-management/staff/${userId}`);
  return response.data;
};

// Assign staff to station
export const assignStaffToStation = async (userId: number, stationId: number): Promise<APIResponse<StaffDTO>> => {
  const response = await api.post<APIResponse<StaffDTO>>('/api/staff-management/assign', null, {
    params: { userId, stationId }
  });
  return response.data;
};

// Unassign staff from station
export const unassignStaffFromStation = async (userId: number): Promise<APIResponse<StaffDTO>> => {
  const response = await api.post<APIResponse<StaffDTO>>('/api/staff-management/unassign', null, {
    params: { userId }
  });
  return response.data;
};

// ===== ADMIN REVENUE API FUNCTIONS =====
export interface RevenueData {
  month: string;
  revenue: number;
  sessions: number;
  users: number;
}

export interface RevenueResponse {
  data: RevenueData[];
  totalRevenue?: number;
  totalSessions?: number;
  totalUsers?: number;
  avgRevenuePerSession?: number;
}

// New API Response Interface matching backend structure
export interface RevenueAPIResponse {
  success: boolean;
  message: string;
  data: {
    summary: {
      totalRevenue: number;
      totalSuccessRevenue: number;
      totalPendingRevenue: number;
      totalFailedRevenue: number;
      totalTransactions: number;
      successfulTransactions: number;
      pendingTransactions: number;
      failedTransactions: number;
      averageTransactionAmount: number;
      growthRate: number;
    };
    chartData: Array<{
      period: string;
      date: string;
      revenue: number;
      transactionCount: number;
    }>;
    revenueByStation?: Array<{
      stationId: number;
      stationName: string;
      stationAddress: string;
      revenue: number;
      transactionCount: number;
      averagePerTransaction: number;
    }>;
    revenueByPaymentMethod?: Record<string, number>;
  };
  timestamp: string | null;
}

export interface RevenueFilters {
  region?: string;
  station?: string;
  timeRange?: string;
  fromDate?: string;
  toDate?: string;
  stationId?: number;
  paymentMethod?: string;
  status?: string;
  groupBy?: string;
}

export const getRevenueData = async (filters?: RevenueFilters): Promise<RevenueAPIResponse> => {
  try {
    console.log('Fetching revenue data with filters:', filters);

    const params = new URLSearchParams();
    // Support both old and new filter formats
    if (filters?.region) params.append('region', filters.region);
    if (filters?.station) params.append('station', filters.station);
    if (filters?.timeRange) params.append('timeRange', filters.timeRange);
    // New filter parameters
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    if (filters?.stationId !== undefined) params.append('stationId', filters.stationId.toString());
    if (filters?.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.groupBy) params.append('groupBy', filters.groupBy);

    const queryString = params.toString();
    const url = `/api/admin/revenue${queryString ? `?${queryString}` : ''}`;

    console.log('Revenue API URL:', url);

    const response = await api.get<RevenueAPIResponse>(url);

    console.log('Revenue API response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching revenue data:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

export interface ExportRevenueFilters {
  fromDate?: string;
  toDate?: string;
  stationId?: number;
  paymentMethod?: string;
  status?: string;
  groupBy?: string;
}

export const exportRevenueToExcel = async (filters?: ExportRevenueFilters): Promise<Blob> => {
  try {
    console.log('Exporting revenue to Excel with filters:', filters);
    const params = new URLSearchParams();
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    if (filters?.stationId !== undefined) params.append('stationId', filters.stationId.toString());
    if (filters?.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.groupBy) params.append('groupBy', filters.groupBy);
    const queryString = params.toString();
    const url = `/api/admin/revenue/export/excel${queryString ? `?${queryString}` : ''}`;
    console.log('Export Revenue API URL:', url);
    const response = await api.get(url, {
      responseType: 'blob', // Important for file download
    });
    console.log('Export Revenue API response:', response);
    return response.data;
  } catch (error: any) {
    console.error('Error exporting revenue to Excel:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

export const exportRevenueToPDF = async (filters?: ExportRevenueFilters): Promise<Blob> => {
  try {
    console.log('Exporting revenue to PDF with filters:', filters);
    const params = new URLSearchParams();
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    if (filters?.stationId !== undefined) params.append('stationId', filters.stationId.toString());
    if (filters?.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.groupBy) params.append('groupBy', filters.groupBy);
    const queryString = params.toString();
    const url = `/api/admin/revenue/export/pdf${queryString ? `?${queryString}` : ''}`;
    console.log('Export Revenue PDF API URL:', url);
    const response = await api.get(url, {
      responseType: 'blob', // Important for file download
    });
    console.log('Export Revenue PDF API response:', response);
    return response.data;
  } catch (error: any) {
    console.error('Error exporting revenue to PDF:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

// Re-export Market Trends API from api folder for backward compatibility
export { getMarketTrends, type MarketTrendsData } from '../api/marketTrends';

// Re-export Connector Suggestions API from api folder for backward compatibility
export { getConnectorSuggestions, type ConnectorSuggestion, type ConnectorSuggestionsResponse } from '../api/connectorSuggestions';

// ===== PENALTY/FEE API TYPES =====
export interface FeeDTO {
  feeId: number;
  userId: number;
  sessionId?: number;
  orderId?: number;
  amount: number;
  feeType: 'CANCEL' | 'NO_SHOW' | 'OVERTIME';
  description: string;
  isPaid: boolean;
  createdAt: string;
}

export interface FeeDetailDTO {
  feeId: number;
  userId: number;
  sessionId?: number;
  orderId?: number;
  amount: number;
  feeType: string;
  description: string;
  isPaid: boolean;
  createdAt: string;
}

export interface PenaltyTransactionDTO {
  penaltyId?: number;
  feeId?: number;
  transactionId?: number;
  amount?: number;
  status?: string;
  description?: string;
  [key: string]: unknown;
}

export interface UnpaidFeesData {
  failedTransactionIds?: number[];
  totalFailedTransactions?: number;
  totalFailedAmount?: number;
  pendingTransactionIds?: number[];
  totalPendingTransactions?: number;
  totalPendingAmount?: number;
  penalties?: PenaltyTransactionDTO[];
  summary?: {
    failedTransactionIds?: number[];
    totalFailedTransactions?: number;
    totalFailedAmount?: number;
    pendingTransactionIds?: number[];
    totalPendingTransactions?: number;
    totalPendingAmount?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface UnpaidFeesResponse {
  success?: boolean;
  message?: string;
  data?:
    | UnpaidFeesData
    | PenaltyTransactionDTO[]
    | {
        summary?: UnpaidFeesData;
        penalties?: PenaltyTransactionDTO[];
        [key: string]: unknown;
      };
  timestamp?: string;
}

export interface PayPenaltyResponse {
  success: boolean;
  message: string;
  data: {
    unlocked: boolean;
    remainingFees: number;
  };
}

// ===== PENALTY/FEE API FUNCTIONS =====

/**
 * Lấy danh sách phí phạt chưa thanh toán của user
 */
export const getUnpaidFees = async (userId: number): Promise<UnpaidFeesResponse> => {
  try {
    const response = await api.get<UnpaidFeesResponse>(`/api/penalties/user/${userId}/unpaid`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching unpaid fees:', error);
    throw error;
  }
};

/**
 * Lấy lịch sử phí phạt của user
 */
export const getUserFeeHistory = async (userId: number): Promise<APIResponse<FeeDetailDTO[]>> => {
  try {
    const response = await api.get<APIResponse<FeeDetailDTO[]>>(`/api/penalties/user/${userId}/history`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching user fee history:', error);
    throw error;
  }
};

/**
 * Thanh toán phí phạt và mở khóa tài khoản
 * Gọi POST /api/penalties/pay-and-unlock
 */
export const payPenaltyAndUnlock = async (userId: number, paymentMethod: string): Promise<PayPenaltyResponse> => {
  try {
    console.log('🔵 Sending payment request:', { userId, paymentMethod });
    const response = await api.post<PayPenaltyResponse>('/api/penalties/pay-and-unlock', {
      userId,
      paymentMethod
    });
    console.log('✅ Payment response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('🔴 Error paying penalty:', error);
    console.error('🔴 Error response:', error.response?.data);
    console.error('🔴 Error status:', error.response?.status);
    throw error;
  }
};

/**
 * Kiểm tra xem user có thể mở khóa không
 */
export const canUnlockUser = async (userId: number): Promise<APIResponse<boolean>> => {
  try {
    const response = await api.get<APIResponse<boolean>>(`/api/penalties/user/${userId}/can-unlock`);
    return response.data;
  } catch (error: any) {
    console.error('Error checking unlock status:', error);
    throw error;
  }
};

export default api;

