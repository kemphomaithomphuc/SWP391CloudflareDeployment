import { api } from "../services/api";

export interface ParkingMonitoringData {
  sessionId: string;
  parkingStartTime?: string;
  durationSeconds?: number;
  currentFee?: number;
  chargingCost?: number;
  totalCost?: number;
  lastUpdated?: string;
}

const normalizeParkingMonitoring = (raw: any, fallbackSessionId: string): ParkingMonitoringData => {
  if (!raw || typeof raw !== "object") {
    return { sessionId: fallbackSessionId };
  }

  const safeNumber = (value: unknown): number | undefined =>
    typeof value === "number" && !Number.isNaN(value) ? value : undefined;

  const payload = "data" in raw ? raw.data : raw;

  return {
    sessionId: String(payload?.sessionId ?? fallbackSessionId),
    parkingStartTime: payload?.parkingStartTime ?? payload?.startTime,
    durationSeconds: safeNumber(payload?.durationSeconds ?? payload?.parkingDurationSeconds),
    currentFee: safeNumber(payload?.currentFee ?? payload?.parkingFee),
    chargingCost: safeNumber(payload?.chargingCost ?? payload?.baseCost),
    totalCost: safeNumber(payload?.totalCost),
    lastUpdated: payload?.lastUpdated ?? payload?.timestamp,
  };
};

export const fetchParkingMonitoring = async (sessionId: string): Promise<ParkingMonitoringData> => {
  if (!sessionId) {
    throw new Error("sessionId is required to monitor parking");
  }

  const response = await api.get(`/api/parking/monitor/${sessionId}`);
  return normalizeParkingMonitoring(response.data, sessionId);
};

export default fetchParkingMonitoring;


