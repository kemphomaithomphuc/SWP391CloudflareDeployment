import api from "../services/api";

export interface NearbyPlace {
  id?: number | string;
  name?: string;
  address?: string;
  description?: string;
  category?: string;
  type?: string;
  distanceMeters?: number;
  distanceKm?: number;
  distanceText?: string;
  travelTimeMinutes?: number;
  rating?: number;
  priceLevel?: string;
  openNow?: boolean;
  openingHours?: string;
  phone?: string;
  website?: string;
  highlights?: string[];
  tags?: string[];
  imageUrl?: string;
}

export interface ChargingStationDetail {
  stationId?: number;
  stationName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  description?: string;
  operator?: string;
  contactNumber?: string;
  totalPoints?: number;
  availablePoints?: number;
  connectorTypes?: string[];
  amenities?: string[];
  tags?: string[];
  rating?: number;
  totalReviews?: number;
  images?: string[];
  nearbyPlaces?: NearbyPlace[];
  nearbyAmenities?: NearbyPlace[];
  surroundingPlaces?: NearbyPlace[];
  neighborhoodHighlights?: NearbyPlace[];
  [key: string]: unknown;
}

export interface ChargingStationDetailResponse {
  success?: boolean;
  message?: string;
  data?: ChargingStationDetail;
  timestamp?: string;
  [key: string]: unknown;
}

const normalizeStationDetail = (payload: any): ChargingStationDetail => {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  if ("data" in payload && typeof payload.data === "object" && payload.data !== null) {
    return normalizeStationDetail(payload.data);
  }

  return payload as ChargingStationDetail;
};

export const getChargingStationDetail = async (stationId: number | string): Promise<ChargingStationDetail> => {
  const response = await api.get<ChargingStationDetailResponse | ChargingStationDetail>(
    `/api/charging-stations/${stationId}`
  );

  return normalizeStationDetail(response.data);
};

export default getChargingStationDetail;

