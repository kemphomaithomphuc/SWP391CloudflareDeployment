import { api } from '../services/api';

export interface VehicleChargingStatusResponse {
    success: boolean;
    message: string;
    data: {
        vehicleId: number;
        isCurrentlyCharging: boolean;
        canBookNow: boolean;
        message: string;
    };
}

/**
 * API call to check if vehicle is currently charging
 * @param vehicleId - Vehicle ID to check charging status
 * @param language - Language for error messages ('vi' | 'en')
 * @returns Promise with vehicle charging status or null if failed
 */
export const checkVehicleChargingStatus = async (
    vehicleId: number,
    language: string = 'vi'
): Promise<VehicleChargingStatusResponse | null> => {
    try {
        console.log("=== API CHECK VEHICLE CHARGING STATUS ===");
        console.log("Vehicle ID:", vehicleId);

        const res = await api.get(`/api/orders/vehicle/${vehicleId}/is-charging`);
        console.log("API response:", res.data);

        if (res.status === 200 && res.data?.success) {
            return res.data;
        }

        throw new Error(
            language === "vi" 
                ? "Không thể lấy trạng thái xe" 
                : "Failed to get vehicle status"
        );
    } catch (err: any) {
        console.error("=== API CHECK VEHICLE CHARGING STATUS ERROR ===");
        console.error("Error object:", err);
        console.error("Error response:", err?.response);
        console.error("Error response data:", err?.response?.data);
        console.error("Error response status:", err?.response?.status);

        // If 404 or no active order, vehicle is not charging
        if (err?.response?.status === 404) {
            console.log("Vehicle not found or no charging session - assuming not charging");
            return {
                success: true,
                message: language === "vi" 
                    ? "Xe không đang sạc" 
                    : "Vehicle is not charging",
                data: {
                    vehicleId: vehicleId,
                    isCurrentlyCharging: false,
                    canBookNow: true,
                    message: language === "vi"
                        ? "Xe không đang sạc. Có thể Book Now hoặc Schedule."
                        : "Vehicle is not charging. Can Book Now or Schedule."
                }
            };
        }

        // For other errors, return error response
        let msg = err?.response?.data?.message;

        if (!msg) {
            if (err?.response?.status === 500) {
                msg = language === "vi"
                    ? "Lỗi máy chủ. Vui lòng thử lại sau."
                    : "Server error. Please try again later.";
            } else if (err?.response?.status === 401) {
                msg = language === "vi"
                    ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
                    : "Session expired. Please login again.";
            } else {
                msg = language === "vi" 
                    ? "Không thể lấy trạng thái xe" 
                    : "Failed to get vehicle status";
            }
        }

        // For errors other than 404, assume vehicle can be used to allow user to proceed
        console.warn("API error, assuming vehicle is available:", msg);
        return {
            success: true,
            message: msg,
            data: {
                vehicleId: vehicleId,
                isCurrentlyCharging: false,
                canBookNow: true,
                message: language === "vi"
                    ? "Không thể xác minh trạng thái xe. Tiếp tục đặt lịch."
                    : "Cannot verify vehicle status. Proceed with booking."
            }
        };
    }
};

