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

export default api;




