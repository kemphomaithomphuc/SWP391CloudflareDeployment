// src/services/poi.ts
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY as string;
if (!MAPTILER_KEY) {
  console.warn("Missing VITE_MAPTILER_API_KEY for MapTiler Geocoding API");
}

export type PoiCategory = "school" | "hospital" | "supermarket" | "market" | "other";

export interface Poi {
  id: string;
  name: string;
  category: PoiCategory;
  street?: string;
  ward?: string;
  district?: string;
  city?: string;
  country: "VN";
  latitude: number;
  longitude: number;
  addressFull: string;
}

/**
 * MapTiler geocoding endpoint (forward search):
 * https://api.maptiler.com/geocoding/{query}.json?key=...&country=VN&language=vi&limit=10
 * Có thể thêm bbox=minLon,minLat,maxLon,maxLat để gợi ý trong vùng.
 */
const GEOCODE_BASE = "https://api.maptiler.com/geocoding";

/** Heuristic: phân loại POI từ dữ liệu trả về của MapTiler */
function classifyCategory(feature: any): PoiCategory {
  // MapTiler đôi khi có properties.category / properties.type / layer/type tương tự Mapbox.
  const cat = (feature?.properties?.category || feature?.properties?.type || "")
    .toString()
    .toLowerCase();

  const name = (feature?.text || feature?.place_name || feature?.properties?.name || "")
    .toString()
    .toLowerCase();

  const combined = `${cat} ${name}`;

  if (/(school|university|college|trường|đại học|cao đẳng|tiểu học|mầm non)/.test(combined)) return "school";
  if (/(hospital|clinic|medical|bệnh viện|phòng khám|y tế)/.test(combined)) return "hospital";
  if (/(supermarket|grocery|mart|siêu thị|co.op|vinmart|winmart|big c|go!)/.test(combined)) return "supermarket";
  if (/(market|chợ\b)/.test(combined)) return "market";
  return "other";
}

function extractAddress(feature: any) {
  // MapTiler trả "place_name" dạng đầy đủ, và context gồm ward/district/city…
  const placeName = feature?.place_name || feature?.properties?.address || "";
  const context: Array<{ id: string; text: string }> = feature?.context || [];

  let street = feature?.properties?.street || "";
  // Từ context suy ra ward/district/city nếu có
  const findCtx = (prefix: string) =>
    context.find((c) => c.id?.startsWith(prefix))?.text || "";

  const ward = findCtx("neighbourhood") || findCtx("locality") || "";
  const district = findCtx("district") || "";
  const city = findCtx("place") || findCtx("city") || findCtx("region") || "";

  const addressFull = placeName.toString();

  return { street, ward, district, city, addressFull };
}

function toPoi(feature: any): Poi {
  // MapTiler geocoding thường có center [lon, lat]
  const [lon, lat] = feature?.center || feature?.geometry?.coordinates || [0, 0];
  const name = feature?.text || feature?.properties?.name || "";
  const { street, ward, district, city, addressFull } = extractAddress(feature);

  return {
    id: feature?.id || `${lon},${lat}`,
    name,
    category: classifyCategory(feature),
    street: street || undefined,
    ward: ward || undefined,
    district: district || undefined,
    city: city || undefined,
    country: "VN",
    latitude: lat,
    longitude: lon,
    addressFull,
  } as Poi;
}

/**
 * Search theo text (autocomplete).
 * @param query Chuỗi người dùng nhập.
 * @param limit Mặc định 10.
 */
export async function searchPoiByText(query: string, limit = 10): Promise<Poi[]> {
  if (!query?.trim()) return [];
  const url = new URL(`${GEOCODE_BASE}/${encodeURIComponent(query)}.json`);
  url.searchParams.set("key", MAPTILER_KEY);
  url.searchParams.set("country", "VN");
  url.searchParams.set("language", "vi");
  url.searchParams.set("limit", String(limit));
  // Có thể thêm types=poi,place,locality để ưu tiên POI
  url.searchParams.set("types", "poi,place,locality,address");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`MapTiler search error: ${res.status}`);
  const data = await res.json();

  const features: any[] = data?.features || [];
  return features.map(toPoi);
}

/**
 * Lấy POI trong một bbox (bounds): [minLng, minLat, maxLng, maxLat]
 * MapTiler không có "nearby" riêng, mình dùng forward search rỗng + bbox để gợi ý trong vùng,
 * hoặc có thể dùng một query chung như "a" để trả nhiều POI. Thực tế nên combine với client filter.
 */
export async function fetchPoiByBounds(
  bounds: [number, number, number, number],
  limit = 50
): Promise<Poi[]> {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  // Trick: dùng query * để lấy nhiều điểm trong bbox (MapTiler cho phép)
  const url = new URL(`${GEOCODE_BASE}/*.json`);
  url.searchParams.set("key", MAPTILER_KEY);
  url.searchParams.set("country", "VN");
  url.searchParams.set("language", "vi");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("bbox", `${minLng},${minLat},${maxLng},${maxLat}`);
  url.searchParams.set("types", "poi,place,locality,address");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`MapTiler bounds error: ${res.status}`);
  const data = await res.json();

  const features: any[] = data?.features || [];
  return features.map(toPoi);
}

/**
 * Reverse geocoding (kéo chi tiết từ tọa độ).
 */
export async function getPoiDetailsByReverse(
  lng: number,
  lat: number
): Promise<Poi | null> {
  const url = new URL(`${GEOCODE_BASE}/${lng},${lat}.json`);
  url.searchParams.set("key", MAPTILER_KEY);
  url.searchParams.set("country", "VN");
  url.searchParams.set("language", "vi");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.warn("MapTiler reverse error", res.status);
    return null;
  }
  const data = await res.json();
  const feature = data?.features?.[0];
  return feature ? toPoi(feature) : null;
}
