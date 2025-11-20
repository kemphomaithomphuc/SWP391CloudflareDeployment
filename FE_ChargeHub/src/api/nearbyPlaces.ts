import { api } from "../services/api";

export interface NearbyPlaceInfo {
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

export interface NearbyPlacesResponse {
  success?: boolean;
  message?: string;
  data?: {
    stationId?: number;
    stationName?: string;
    nearbyPlaces?: NearbyPlaceInfo[];
    surroundingPlaces?: NearbyPlaceInfo[];
    nearbyAmenities?: NearbyPlaceInfo[];
    neighborhoodHighlights?: NearbyPlaceInfo[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

const extractPlacesFromPayload = (payload: any): NearbyPlaceInfo[] => {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  if ("data" in payload && typeof payload.data === "object" && payload.data !== null) {
    return extractPlacesFromPayload(payload.data);
  }

  const {
    nearbyPlaces,
    surroundingPlaces,
    nearbyAmenities,
    neighborhoodHighlights,
  } = payload as Record<string, unknown>;

  const normalizeList = (value: unknown): NearbyPlaceInfo[] => {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item) => item && typeof item === "object") as NearbyPlaceInfo[];
  };

  return [
    ...normalizeList(nearbyPlaces),
    ...normalizeList(surroundingPlaces),
    ...normalizeList(nearbyAmenities),
    ...normalizeList(neighborhoodHighlights),
  ];
};

const parseSimpleTextPlaces = (raw: string): NearbyPlaceInfo[] => {
  if (!raw || typeof raw !== "string") {
    return [];
  }

  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return [];
  }

  const results: NearbyPlaceInfo[] = [];

  const sectionRegex = /\*\s*\*\*(.+?)\*\*([\s\S]*?)(?=\n\s*\*\s*\*\*|$)/g;

  let match: RegExpExecArray | null;
  while ((match = sectionRegex.exec(normalized)) !== null) {
    const rawName = match[1]?.trim();
    const rawBody = match[2] ?? "";

    if (!rawName) {
      continue;
    }

    const place: NearbyPlaceInfo = {
      name: rawName,
    };

    const detailLines = rawBody
      .split(/\n+/)
      .map((line) => line.replace(/^\*\s*/, "").trim())
      .filter((line) => line.length > 0);

    detailLines.forEach((line) => {
      const labelMatch = line.match(/^\*\*(.+?)\*\*[:：]?\s*(.*)$/);
      if (labelMatch) {
        const rawLabel = labelMatch[1]?.trim();
        const label = rawLabel?.toLowerCase();
        const value = (labelMatch[2] ?? "").trim();

        if (!label || !rawLabel) {
          return;
        }

        if (label.includes("địa") || label.includes("dia") || label.includes("address")) {
          place.address = value;
          return;
        }

        if (label.includes("mô tả") || label.includes("mo ta") || label.includes("description")) {
          place.description = value;
          return;
        }

        if (label.includes("loại") || label.includes("category") || label.includes("type")) {
          place.category = value;
          return;
        }

        if (value) {
          place.highlights = [...(place.highlights ?? []), `${rawLabel}: ${value}`];
        }
        return;
      }

      if (line.length > 0) {
        place.description = place.description ? `${place.description}\n${line}` : line;
      }
    });

    results.push(place);
  }

  return results;
};

const collectPlacesFromValue = (value: unknown): NearbyPlaceInfo[] => {
  if (typeof value === "string") {
    return parseSimpleTextPlaces(value);
  }

  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter((item) => item && typeof item === "object") as NearbyPlaceInfo[];
  }

  if (typeof value === "object") {
    return Object.values(value)
      .flatMap((entry) => collectPlacesFromValue(entry))
      .filter((item, index, arr) => {
        if (!item || typeof item !== "object") {
          return false;
        }
        const ref = item as NearbyPlaceInfo;
        if (!ref.name) {
          return true;
        }
        return arr.findIndex(
          (inner) => typeof inner === "object" && (inner as NearbyPlaceInfo).name === ref.name
        ) === index;
      }) as NearbyPlaceInfo[];
  }

  return [];
};

const extractAmenitiesPayload = (payload: any): NearbyPlaceInfo[] => {
  if (typeof payload === "string") {
    return parseSimpleTextPlaces(payload);
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  if ("data" in payload && typeof payload.data === "object" && payload.data !== null) {
    return extractAmenitiesPayload(payload.data);
  }

  const directPlaces = extractPlacesFromPayload(payload);
  const amenitiesPlaces = collectPlacesFromValue(
    (payload as Record<string, unknown>).amenities ??
      (payload as Record<string, unknown>).amenityGroups ??
      (payload as Record<string, unknown>).categories
  );

  const combined = [...directPlaces, ...amenitiesPlaces];

  if (combined.length > 0) {
    return combined;
  }

  return collectPlacesFromValue(payload);
};

export const getNearbyPlacesByStation = async (
  stationId: number | string
): Promise<NearbyPlaceInfo[]> => {
  const normalizedStationId =
    typeof stationId === "string"
      ? stationId.trim().replace(/^\{\{|\}\}$/g, "")
      : stationId;

  const pathSegment =
    typeof normalizedStationId === "number" || normalizedStationId === ""
      ? normalizedStationId
      : Number.isFinite(Number(normalizedStationId))
        ? Number(normalizedStationId)
        : normalizedStationId;

  const url = `/api/charging-stations/${pathSegment}/amenities`;
  console.log("[nearbyPlaces] Fetching amenities from:", url);

  const response = await api.get<NearbyPlacesResponse | Record<string, unknown>>(
    url
  );

  console.log("[nearbyPlaces] Raw amenities response:", response.data);

  if (typeof response.data === "string") {
    return parseSimpleTextPlaces(response.data);
  }

  return extractAmenitiesPayload(response.data);
};

export default getNearbyPlacesByStation;
