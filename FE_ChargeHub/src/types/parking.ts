export interface ParkingSessionSummary {
  sessionId: string;
  bookingId: string;
  stationName: string;
  stationAddress: string;
  startTime: string;
  endTime: string;
  energyConsumed: number;
  totalCost: number;
  parkingStartTime: string;
  userName?: string;
  chargerType?: string;
  power?: number;
  chargingPointName?: string;
  initialBattery?: number;
  targetBattery?: number;
}


