import { api } from "../services/api";

export interface ParkingMonitoringData {
  sessionId: string;
  parkingStartTime?: string;
  durationSeconds?: number;
  currentFee?: number;
  chargingCost?: number;
  totalCost?: number;
  parkingRatePerMinute?: number; // Giá phí đỗ xe mỗi phút từ BE (VNĐ/phút)
  lastUpdated?: string;
}

const normalizeParkingMonitoring = (raw: any, fallbackSessionId: string): ParkingMonitoringData => {
  if (!raw || typeof raw !== "object") {
    return { sessionId: fallbackSessionId };
  }

  const safeNumber = (value: unknown): number | undefined =>
    typeof value === "number" && !Number.isNaN(value) ? value : undefined;

  const payload = "data" in raw ? raw.data : raw;

  const result: ParkingMonitoringData = {
    sessionId: String(payload?.sessionId ?? fallbackSessionId),
  };

  const parkingStartTime = payload?.parkingStartTime ?? payload?.startTime;
  if (parkingStartTime) {
    result.parkingStartTime = parkingStartTime;
  }

  const durationSeconds = safeNumber(
    payload?.durationSeconds ?? payload?.parkingDurationSeconds ?? payload?.totalParkingSeconds,
  );
  if (durationSeconds !== undefined) {
    result.durationSeconds = durationSeconds;
  }

  const currentFee = safeNumber(payload?.currentFee ?? payload?.parkingFee ?? payload?.estimatedParkingFee);
  if (currentFee !== undefined) {
    result.currentFee = currentFee;
  }

  const chargingCost = safeNumber(payload?.chargingCost ?? payload?.baseCost);
  if (chargingCost !== undefined) {
    result.chargingCost = chargingCost;
  }

  const totalCost = safeNumber(payload?.totalCost);
  if (totalCost !== undefined) {
    result.totalCost = totalCost;
  }

  const parkingRatePerMinute = safeNumber(payload?.parkingRatePerMinute);
  if (parkingRatePerMinute !== undefined) {
    result.parkingRatePerMinute = parkingRatePerMinute;
  }

  const lastUpdated = payload?.lastUpdated ?? payload?.timestamp;
  if (lastUpdated) {
    result.lastUpdated = lastUpdated;
  }

  return result;
};

export const fetchParkingMonitoring = async (sessionId: string): Promise<ParkingMonitoringData> => {
  if (!sessionId) {
    throw new Error("sessionId is required to monitor parking");
  }

  const response = await api.get(`/api/parking/monitor/${sessionId}`);
  return normalizeParkingMonitoring(response.data, sessionId);
};

export default fetchParkingMonitoring;


