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
}

// Response DTOs
export interface AvailableTimeSlotDTO {
  freeFrom: string; // ISO string format
  freeTo: string; // ISO string format
  availableMinutes: number;
  requiredMinutes: number;
  estimatedCost: number;
}

export interface ChargingPointAvailabilityDTO {
  chargingPointId: number;
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

// 5. Get transactions history (paginated)
export interface TransactionHistoryParams {
  userId: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  content?: T[];
  totalElements?: number;
  totalPages?: number;
  pageNumber?: number;
  pageSize?: number;
}

export const getTransactionHistory = async ({ userId, page = 0, size = 10, sortBy = 'createdAt', sortDirection = 'DESC' }: TransactionHistoryParams): Promise<APIResponse<PaginatedResponse<any> | any[]>> => {
  const params = new URLSearchParams();
  params.append('userId', userId.toString());
  params.append('page', String(page));
  params.append('size', String(size));
  params.append('sortBy', sortBy);
  params.append('sortDirection', sortDirection);
  const url = `/api/transactions/history?${params.toString()}`;
  console.log('[API] getTransactionHistory →', url);
  const response = await api.get<APIResponse<PaginatedResponse<any> | any[]>>(url);
  console.log('[API] getTransactionHistory status:', response.status);
  try {
    const payload: any = response.data?.data;
    const list = Array.isArray(payload) ? payload : (payload?.content ?? []);
    console.log('[API] getTransactionHistory items:', list?.length ?? 0, 'totalPages:', payload?.totalPages ?? 'n/a');
  } catch {}
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

export default api;




