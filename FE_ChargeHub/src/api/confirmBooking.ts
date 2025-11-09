import { api } from '../services/api';

export interface ConfirmBookingRequest {
    userId: number;
    vehicleId: number;
    stationId: number;
    chargingPointId: number;
    connectorTypeId: number;
    currentBattery?: number;
    targetBattery?: number;
    initialBatteryLevel?: number;
    targetBatteryLevel?: number;
    startTime: string;
    endTime: string;
    energyToCharge?: number;
    estimatedCost?: number;
    initialStatus?: string;  // ✅ "BOOKED" for scheduled, "CHARGING" for immediate
    bookingMode?: string;
    slotIds?: string[];  // ✅ IDs of slots selected by user
    [key: string]: any; // Allow for flexible request structure
}

export interface ConfirmBookingResponse {
    orderId?: number;
    data?: any;
    [key: string]: any; // Allow for flexible API response structure
}

/**
 * API call to confirm booking
 * @param bookingData - Booking data to send to the server
 * @param language - Language for error messages ('vi' | 'en')
 * @returns Promise with booking confirmation result or null if failed
 */
export const confirmBooking = async (
    bookingData: ConfirmBookingRequest,
    language: string = 'vi'
): Promise<ConfirmBookingResponse | null> => {
    try {
        console.log("=== API CONFIRM BOOKING DEBUG ===");
        console.log("Sending booking data:", JSON.stringify(bookingData, null, 2));

        const res = await api.post("/api/orders/confirm", bookingData);
        console.log("API response:", res);

        if (res.status === 200) {
            console.log("Booking confirmed successfully");
            return res.data?.data || res.data;
        }
        throw new Error(language === "vi" ? "Xác nhận đặt chỗ thất bại" : "Booking confirmation failed");
    } catch (err: any) {
        console.error("=== API CONFIRM BOOKING ERROR ===");
        console.error("Error object:", err);
        console.error("Error response:", err?.response);
        console.error("Error response data:", err?.response?.data);
        console.error("Error response status:", err?.response?.status);

        // Always prioritize backend error message
        let msg = err?.response?.data?.message;

        // If no backend message, use generic messages based on status
        if (!msg) {
            if (err?.response?.status === 500) {
                msg = language === "vi"
                    ? "Lỗi máy chủ. Vui lòng thử lại sau."
                    : "Server error. Please try again later.";
            } else if (err?.response?.status === 400) {
                msg = language === "vi"
                    ? "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại."
                    : "Invalid data. Please check your input.";
            } else if (err?.response?.status === 401) {
                msg = language === "vi"
                    ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
                    : "Session expired. Please login again.";
            } else {
                msg = language === "vi" ? "Xác nhận đặt chỗ thất bại" : "Booking confirmation failed";
            }
        }

        // Return error object instead of showing toast here
        // Let the caller handle the toast display
        throw {
            message: msg,
            status: err?.response?.status,
            data: err?.response?.data
        };
    }
};

