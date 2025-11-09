import { api } from '../services/api';

export interface ChargingStation {
  stationId: string;
  stationName: string;
  address: string;
  latitude: number;
  longitude: number;
  status: string;
}

export interface ChargingSession {
  sessionId: string;
  userId: string;
  userName: string;
  vehicleId: string;
  vehicleModel: string;
  stationId: string;
  stationName: string;
  chargingPointId: string;
  connectorTypeId: string;
  connectorType: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  energyConsumed?: number;
  cost?: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'PAID' | 'UNPAID';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  initialBattery?: number;
  currentBattery?: number;
  targetBattery?: number;
}

export interface OnsitePaymentRequest {
  sessionId: string;
}

export interface OnsitePaymentResponse {
  success: boolean;
  message: string;
  sessionId: string;
  paymentTime: string;
}

/**
 * Lấy danh sách trạm sạc của staff
 * @param language - Ngôn ngữ cho thông báo lỗi
 * @returns Promise với danh sách trạm sạc hoặc null nếu thất bại
 */
export const getMyStations = async (
  language: string = 'vi'
): Promise<ChargingStation[] | null> => {
  try {
    const res = await api.get("/api/staff/my-stations");
    console.log("My stations API response:", res);

    if (res.status === 200) {
      return res.data?.data || res.data || [];
    }
    throw new Error(language === "vi" ? "Lấy danh sách trạm thất bại" : "Failed to get stations");
  } catch (err: any) {
    console.error("Get my stations error:", err);
    let msg = err?.response?.data?.message;
    if (!msg) {
      msg = language === "vi" ? "Lấy danh sách trạm thất bại" : "Failed to get stations";
    }
    throw {
      message: msg,
      status: err?.response?.status,
      data: err?.response?.data
    };
  }
};

/**
 * Lấy danh sách phiên sạc của một trạm
 * @param stationId - ID của trạm sạc
 * @param language - Ngôn ngữ cho thông báo lỗi
 * @returns Promise với danh sách phiên sạc hoặc null nếu thất bại
 */
export const getStationSessions = async (
  stationId: string,
  language: string = 'vi'
): Promise<ChargingSession[] | null> => {
  try {
    const res = await api.get(`/api/staff/station/${stationId}/sessions`);
    console.log("Station sessions API response:", res);

    if (res.status === 200) {
      const sessions = res.data?.data || res.data || [];
      return sessions.map((session: any) => ({
        sessionId: session.sessionId || session.id,
        userId: session.userId,
        userName: session.userName || session.user?.fullName || 'Unknown User',
        vehicleId: session.vehicleId,
        vehicleModel: session.vehicleModel || session.vehicle?.model || 'Unknown Vehicle',
        stationId: session.stationId,
        stationName: session.stationName,
        chargingPointId: session.chargingPointId,
        connectorTypeId: session.connectorTypeId,
        connectorType: session.connectorType || session.connector?.type || 'Unknown',
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        energyConsumed: session.energyConsumed,
        cost: session.cost,
        status: session.status || 'ACTIVE',
        paymentStatus: session.paymentStatus || 'PENDING',
        initialBattery: session.initialBattery,
        currentBattery: session.currentBattery,
        targetBattery: session.targetBattery,
      }));
    }
    throw new Error(language === "vi" ? "Lấy danh sách phiên sạc thất bại" : "Failed to get sessions");
  } catch (err: any) {
    console.error("Get station sessions error:", err);
    let msg = err?.response?.data?.message;
    if (!msg) {
      msg = language === "vi" ? "Lấy danh sách phiên sạc thất bại" : "Failed to get sessions";
    }
    throw {
      message: msg,
      status: err?.response?.status,
      data: err?.response?.data
    };
  }
};

/**
 * Thực hiện thanh toán tại chỗ cho một phiên sạc
 * @param sessionId - ID của phiên sạc
 * @param language - Ngôn ngữ cho thông báo lỗi
 * @returns Promise với kết quả thanh toán hoặc null nếu thất bại
 */
export const processOnsitePayment = async (
  sessionId: string,
  language: string = 'vi'
): Promise<OnsitePaymentResponse | null> => {
  try {
    const res = await api.post(`/api/staff/onsite-payment/${sessionId}`);
    console.log("Onsite payment API response:", res);

    if (res.status === 200) {
      return {
        success: true,
        message: res.data?.message || (language === "vi" ? "Thanh toán thành công" : "Payment successful"),
        sessionId: sessionId,
        paymentTime: new Date().toISOString(),
        ...res.data
      };
    }
    throw new Error(language === "vi" ? "Thanh toán thất bại" : "Payment failed");
  } catch (err: any) {
    console.error("Onsite payment error:", err);
    let msg = err?.response?.data?.message;
    if (!msg) {
      msg = language === "vi" ? "Thanh toán thất bại" : "Payment failed";
    }
    throw {
      message: msg,
      status: err?.response?.status,
      data: err?.response?.data
    };
  }
};
