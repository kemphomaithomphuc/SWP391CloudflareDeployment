import { useEffect, useMemo, useRef, useState } from "react";

import {

    Activity,

    ArrowLeft,

    CheckCircle,

    Edit,

    MapPin,

    Plug,

    Plus,

    Power,

    RefreshCw,

    RotateCw,

    Search,

    Settings,

    Trash2,

    XCircle,

    Zap,

} from "lucide-react";

import { Button } from "./ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

import { Badge } from "./ui/badge";

import { Input } from "./ui/input";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

import { Label } from "./ui/label";

import { Textarea } from "./ui/textarea";

import { Separator } from "./ui/separator";

import { ScrollArea } from "./ui/scroll-area";

import axios, { AxiosError } from "axios";

import * as maptilersdk from "@maptiler/sdk";

import { toast, Toaster } from "sonner";

import "@maptiler/sdk/dist/maptiler-sdk.css";

import { useLanguage } from "../contexts/LanguageContext";

// ========= Types =========



type StationStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

type ChargingPointStatus = "AVAILABLE" | "OCCUPIED" | "OUT_OF_SERVICE" | "MAINTENANCE" | "RESERVED";



interface ConnectorType {

    type: string;

    available: number;

    total: number;

    power: string;

    connectorTypeId?: number;

    typeName?: string;

    powerOutput?: number;

    pricePerKwh?: number;

    vehicles?: any[];

}



interface ChargingPoint {
    chargingPointName: string;

    chargingPointId: number;

    status: string;

    connectorTypeId: number;

    stationId: number;

    powerOutput: number;

    pricePerKwh: number;

    typeName?: string; // Add typeName for backward compatibility

    connectorType?: {

        connectorTypeId: number;

        typeName: string;

        powerOutput: number;

        pricePerKwh: number;

    } | undefined;

    station?: {

        stationId: number;

        stationName: string;

        address: string;

        status: string;

        latitude: number;

        longitude: number;

        chargingPoint: any;

        chargingPointNumber: number;

    } | undefined;

}



interface ChargingStation {

    id: string;

    name: string;

    address: string;

    latitude: number;

    longitude: number;

    status: StationStatus;

    totalPoints: number;

    availablePoints: number;

    connectorTypes: ConnectorType[];

    chargingPoints?: ChargingPoint[];

    chargingPointNumber?: number;

    pricing: {

        standard: number;

        fast: number;

        rapid: number;

    };

    operatingHours: string;

    contactPhone: string;

    contactEmail: string;

    lastMAINTENANCE: string;

    nextMAINTENANCE: string;

    revenue: {

        daily: number;

        monthly: number;

    };

    // API fields

    stationId?: string;

    stationName?: string;

    numberOfPort?: number;

}



interface newPortType {

    connectorId: string,

    name: string,

    power: number,

    price: number

}



interface PortType {

    connectorId?: string,

    name: string,

    power: string,

    price: string

}



type POIItem = {

    id: string;

    name: string;

    address: string;

    longitude: number;

    latitude: number;

    properties: Record<string, any>;

    normalizedName: string;

    normalizedAddress: string;

    searchText: string;

};



interface AdminMapViewProps {

    onBack: () => void;

}



// Helper to ensure a station object is safe for rendering

function sanitizeStation(raw: any): ChargingStation {

    const safeConnectorTypes: ConnectorType[] = Array.isArray(raw.connectorTypes)

        ? raw.connectorTypes.map((c: any) => ({

            type: String(c?.type ?? "Unknown"),

            available: Number(c?.available ?? 0),

            total: Math.max(1, Number(c?.total ?? 1)), // avoid divide-by-zero

            power: String(c?.power ?? "")

        }))

        : [{ type: "Unknown", available: 0, total: 1, power: "0kW" }];



    // Process charging points if available

    const safeChargingPoints: ChargingPoint[] = Array.isArray(raw.chargingPoints)

        ? raw.chargingPoints.map((point: any, index: number) => {

            console.log(`Processing charging point ${index}:`, point);



            // Ưu tiên lấy từ connectorType trước

            const connectorType = point.connectorType || {};

            const typeName = connectorType.typeName || point.typeName || "Unknown";

            const powerOutput = connectorType.powerOutput || point.powerOutput || 0;

            const pricePerKwh = connectorType.pricePerKWh || point.pricePerKwh || 0;



            console.log(`Point ${index} extracted from connectorType:`, {

                typeName,

                powerOutput,

                pricePerKwh,

                status: point.status

            });



            return {

                chargingPointId: Number(point.chargingPointId ?? 0),

                chargingPointName: String(point.chargingPointName ?? point.name ?? ""),

                typeName: String(typeName),

                status: String(point.status ?? "OUT_OF_SERVICE"),

                powerOutput: Number(powerOutput),

                pricePerKwh: Number(pricePerKwh),

                station: point.station ? {

                    stationId: Number(point.station.stationId ?? 0),

                    stationName: String(point.station.stationName ?? ""),

                    address: String(point.station.address ?? ""),

                    status: String(point.station.status ?? "INACTIVE"),

                    latitude: Number(point.station.latitude ?? 0),

                    longitude: Number(point.station.longitude ?? 0),

                    chargingPoint: point.station.chargingPoint,

                    chargingPointNumber: Number(point.station.chargingPointNumber ?? 0)

                } : undefined

            };

        })

        : [];



    const totalPoints = Number(raw.numberOfPort ?? raw.totalPoints ?? raw.chargingPointNumber ?? 0);

    const availablePoints = Number(raw.availablePoints ?? totalPoints);



    const lat = Number(raw.latitude ?? 0);

    const lng = Number(raw.longitude ?? 0);



    return {

        id: String(raw.stationId ?? raw.id ?? `ST${Date.now()}`),

        name: String(raw.stationName ?? raw.name ?? "New Station"),

        address: String(raw.address ?? ""),

        latitude: isFinite(lat) ? lat : 0,

        longitude: isFinite(lng) ? lng : 0,

        status: (String(raw.status ?? "INACTIVE").toUpperCase() as StationStatus),

        totalPoints: isFinite(totalPoints) ? totalPoints : 0,

        availablePoints: isFinite(availablePoints) ? availablePoints : 0,

        connectorTypes: safeConnectorTypes,

        chargingPoints: safeChargingPoints,

        chargingPointNumber: Number(raw.chargingPointNumber ?? safeChargingPoints.length),

        pricing: {

            standard: Number(raw.pricing?.standard ?? 0),

            fast: Number(raw.pricing?.fast ?? 0),

            rapid: Number(raw.pricing?.rapid ?? 0)

        },

        operatingHours: String(raw.operatingHours ?? "24/7"),

        contactPhone: String(raw.contactPhone ?? ""),

        contactEmail: String(raw.contactEmail ?? ""),

        lastMAINTENANCE: String(raw.lastMAINTENANCE ?? new Date().toISOString().split("T")[0]),

        nextMAINTENANCE: String(raw.nextMAINTENANCE ?? new Date().toISOString().split("T")[0]),

        revenue: {

            daily: Number(raw.revenue?.daily ?? 0),

            monthly: Number(raw.revenue?.monthly ?? 0)

        }

    };

}



export default function AdminMapView({ onBack }: AdminMapViewProps) {

    const { language, t } = useLanguage();
    const backToDashboardLabel = language === 'vi' ? 'Quay lại trang chính' : 'Back to Dashboard';

    const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);



    // Helper function to translate dynamic API data

    const translateStatus = (status: string): string => {

        switch (status?.toUpperCase()) {

            case 'ACTIVE':

                return t('active');

            case 'INACTIVE':

                return t('inactive');

            case 'MAINTENANCE':

                return t('maintenance');

            default:

                return t('unknown');

        }

    };

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const [isDeleteConnectorDialogOpen, setIsDeleteConnectorDialogOpen] = useState(false);

    const [connectorToDelete, setConnectorToDelete] = useState<{ id: string; name: string } | null>(null);

    const [isAddChargingPointDialogOpen, setIsAddChargingPointDialogOpen] = useState(false);

    const [newChargingPoint, setNewChargingPoint] = useState({
        chargingPointName: "",
        typeName: "",
        status: "AVAILABLE" as ChargingPointStatus,
        connectorTypeId: 0,
        stationId: 0
    });

    const [carModels, setCarModels] = useState<Array<{ carModelId: number; brand: string; model: string; connectorTypeId: number }>>([]);

    const [isCarModelsLoading, setIsCarModelsLoading] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");

    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5); // 5 stations per page

    const [mapCenter, setMapCenter] = useState({ lat: 10.7769, lng: 106.7009 });

    const [mapZoom, setMapZoom] = useState(13);

    const [selectedStationPopup, setSelectedStationPopup] = useState<ChargingStation | null>(null);



    // Form state

    const [address, setAddress] = useState("");

    const [stationName, setStationName] = useState("");

    const [status, setStatus] = useState<StationStatus>("INACTIVE");

    const [latitude, setLatitude] = useState<number | null>(null);

    const [longitude, setLongitude] = useState<number | null>(null);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);



    // Charging posts management

    const [chargingPosts, setChargingPosts] = useState<Array<{

        id: string;

        chargingPointName: string;

        connectorType: string;

        power: string;

        price: string;

        status: string;

    }>>([]);

    const [poiList, setPoiList] = useState<Array<{ id: string; name: string; address: string; longitude: number; latitude: number }>>([]);

    const poiListRef = useRef<Array<{ id: string; name: string; address: string; longitude: number; latitude: number }>>([]);

    useEffect(() => { poiListRef.current = poiList; }, [poiList]);



    // Debug address state changes

    useEffect(() => {

        console.log("Address state changed:", address);

    }, [address]);

    const [stations, setStations] = useState<ChargingStation[]>([]);

    const [newPortTypes, setNewPortTypes] = useState<newPortType[]>([]);

    const [allChargingPoints, setAllChargingPoints] = useState<ChargingPoint[]>([]);

    const [isAllChargingPointsDialogOpen, setIsAllChargingPointsDialogOpen] = useState(false);

    const [selectedStationForAllPoints, setSelectedStationForAllPoints] = useState<ChargingStation | null>(null);




    // Helper function to get auth headers
    const getAuthHeaders = () => {
        const token = localStorage.getItem("token");
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    // Gắn token thủ công cho mọi request axios trong file này
    useEffect(() => {
        try {
            const token = localStorage.getItem("token");
            if (token) {
                axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            }
            axios.defaults.headers.post["Content-Type"] = "application/json";
            axios.defaults.headers.put["Content-Type"] = "application/json";
            axios.defaults.headers.patch["Content-Type"] = "application/json";
        } catch {}
    }, []);


    // Search state

    const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; address: string; longitude: number; latitude: number }>>([]);

    const [showSearchResults, setShowSearchResults] = useState(false);

    const [searchInput, setSearchInput] = useState("");



    // Address search state for edit form

    const [addressSearchResults, setAddressSearchResults] = useState<Array<{ id: string; name: string; address: string; longitude: number; latitude: number }>>([]);

    const [showAddressSearchResults, setShowAddressSearchResults] = useState(false);

    const [addressSearchInput, setAddressSearchInput] = useState("");

    const [isAddressFieldTouched, setIsAddressFieldTouched] = useState(false);

    const [selectedPOI, setSelectedPOI] = useState<{ id: string; name: string; address: string; longitude: number; latitude: number } | null>(null);

    const [tempMarker, setTempMarker] = useState<maptilersdk.Marker | null>(null);



    // Charging port types management

    const [showPortTypesPopup, setShowPortTypesPopup] = useState(false);

    const [showAddPortTypePopup, setShowAddPortTypePopup] = useState(false);

    const [newPortType, setNewPortType] = useState({

        name: "",

        power: "",

        price: ""

    });



    const [portTypes, setPortTypes] = useState<PortType[]>([]);



    // Map to track markers by station ID

    const markerMapRef = useRef<Map<string, maptilersdk.Marker>>(new Map());



    // ========= API =========



    const handleStationAdding = async (): Promise<ChargingStation | null> => {

        setLoading(true);

        setError(null);



        try {

            const payload = {

                stationName: stationName.trim(),

                address: address.trim(),

                status: (status || "INACTIVE").toUpperCase() as StationStatus,

                latitude: Number(latitude),

                longitude: Number(longitude),

                chargingPointNumber: chargingPosts.length,
                chargingPoints: chargingPosts.map(post => ({

                    chargingPointName: post.chargingPointName?.trim() || "",

                    status: post.status,

                    typeName: post.connectorType

                }))

            };



            const res = await axios.post(

                "http://localhost:8080/api/charging-stations",

                payload,

                { headers: getAuthHeaders() }

            );



            if (res.status === 200 || res.status === 201) {

                toast.success("Tạo trạm thành công");

                return sanitizeStation({

                    ...res.data,

                    stationId: res.data?.stationId ?? undefined,

                    stationName: res.data?.stationName ?? payload.stationName,

                    address: res.data?.address ?? payload.address,

                    latitude: res.data?.latitude ?? payload.latitude,

                    longitude: res.data?.longitude ?? payload.longitude,

                    numberOfPort: res.data?.numberOfPort ?? chargingPosts.length,

                    status: res.data?.status ?? payload.status,

                });

            }



            throw new Error("Tạo trạm thất bại");

        } catch (err: any) {

            const msg = err?.response?.data?.message || "Tạo trạm thất bại. Vui lòng thử lại.";

            setError(msg);

            toast.error(msg);

            return null;

        } finally {

            setLoading(false);

        }

    };



    const fetchChargingStations = async (): Promise<ChargingStation[] | null> => {

        try {

            const res = await axios.get("http://localhost:8080/api/charging-stations", { headers: getAuthHeaders() });



            if (res.status === 200) {

                console.log("API Response:", res.data);

                return (res.data as any[]).map(station => sanitizeStation({

                    id: station.stationId,

                    stationName: station.stationName,

                    address: station.address,

                    latitude: station.latitude,

                    longitude: station.longitude,

                    numberOfPort: station.numberOfPort,

                    status: station.status,

                    chargingPoints: station.chargingPoints,

                    chargingPointNumber: station.chargingPointNumber,

                })) as ChargingStation[];

            }



            throw new Error("Không thể lấy danh sách trạm sạc");

        } catch (err: any) {

            const msg =

                err?.response?.data?.message || "Lấy danh sách trạm thất bại. Vui lòng thử lại.";

            toast.error(msg);

            return null;

        }

    };



    const fetchChargingPoints = async (): Promise<ChargingPoint[] | null> => {

        try {

            const res = await axios.get("http://localhost:8080/api/charging-points", { headers: getAuthHeaders() });



            if (res.status === 200) {

                console.log("Charging Points API Response:", res.data);

                return res.data as ChargingPoint[];

            }



            throw new Error("Không thể lấy danh sách trụ sạc");

        } catch (err: any) {

            const msg =

                err?.response?.data?.message || "Lấy danh sách trụ sạc thất bại. Vui lòng thử lại.";

            toast.error(msg);

            return null;

        }

    };

    const handleGetStationList = async () => {

        try {

            const list = await fetchChargingStations();

            if (list) {

                // Fetch complete station details using fetchChargingPointsByStationId for each station

                const stationsWithCompleteDetails = await Promise.all(

                    list.map(async (station) => {

                        try {

                            // Use fetchChargingPointsByStationId to get complete station data with connector types

                            const detailedStation = await fetchChargingPointsByStationId(station.id);

                            if (detailedStation) {

                                return detailedStation;

                            }

                            // Fallback to original station if detailed fetch fails

                            return station;

                        } catch (error) {

                            console.error(`Error fetching details for station ${station.id}:`, error);

                            return station;

                        }

                    })

                );



                setStations(stationsWithCompleteDetails);

                console.log("Station List with Complete Details: ", stationsWithCompleteDetails);

            } else {

                console.warn("Can not receive the station list");

            }

        } catch (err) {

            console.error("Error for calling API: ", err);

        }

    };



    const fetchConnectorTypes = async (): Promise<newPortType[] | null> => {

        try {

            const res = await axios.get("http://localhost:8080/api/connector-types", { headers: getAuthHeaders() });



            if (res.status === 200) {

                console.log("Connector Types API Response:", res.data);

                return (res.data as any[]).map(connector => ({

                    connectorId: connector.connectorTypeId || connector.connectorId,

                    name: connector.typeName || connector.name,

                    power: connector.powerOutput || connector.power,

                    price: connector.pricePerKwh || connector.price

                })) as newPortType[];

            }



            throw new Error("Không thể lấy danh sách loại cổng sạc");

        } catch (err: any) {

            console.error("Error fetching connector types:", err);

            const msg =

                err?.response?.data?.message || "Lấy danh sách loại cổng sạc thất bại. Vui lòng thử lại.";

            toast.error(msg);

            return null;

        }

    };



    const fetchCarModels = async (): Promise<Array<{ carModelId: number; brand: string; model: string; connectorTypeId: number }> | null> => {

        if (isCarModelsLoading) return null;



        setIsCarModelsLoading(true);

        try {

            const res = await axios.get("http://localhost:8080/api/carModel", { headers: getAuthHeaders() });



            if (res.status === 200 && res.data.success) {

                console.log("Car Models API Response:", res.data);

                // Filter out invalid entries (where brand or model is null)

                const validModels = res.data.data.filter((model: any) =>

                    model.brand && model.model && model.brand !== null && model.model !== null

                );



                const carModelsData = validModels.map((model: any) => ({

                    carModelId: model.carModelId,

                    brand: model.brand,

                    model: model.model,

                    connectorTypeId: model.connectorTypeIds?.[0] || 0 // Take first connector type ID

                }));



                setCarModels(carModelsData);

                return carModelsData;

            }



            return null;

        } catch (err: any) {

            console.error("Error fetching car models:", err);

            return null;

        } finally {

            setIsCarModelsLoading(false);

        }

    };



    // Function to fetch specific connector type details by ID

    const fetchConnectorTypeById = async (connectorTypeId: number): Promise<any | null> => {

        try {

            const res = await axios.get(`http://localhost:8080/api/connector-types/${connectorTypeId}`, { headers: getAuthHeaders() });



            if (res.status === 200) {

                console.log("Connector Type Details API Response:", res.data);

                return {

                    connectorTypeId: res.data.connectorTypeId,

                    typeName: res.data.typeName,

                    powerOutput: res.data.powerOutput,

                    pricePerKwh: res.data.pricePerKwh,

                    vehicles: res.data.vehicles || []

                };

            }



            throw new Error("Không thể lấy thông tin chi tiết loại cổng sạc");

        } catch (err: any) {

            console.error("Error fetching connector type details:", err);

            const msg =

                err?.response?.data?.message || "Lấy thông tin chi tiết loại cổng sạc thất bại. Vui lòng thử lại.";

            toast.error(msg);

            return null;

        }

    };

    // Function to fetch specific charging point details by ID
    const fetchChargingPointById = async (chargingPointId: number): Promise<ChargingPoint | null> => {
        try {
            const res = await axios.get(`http://localhost:8080/api/charging-points/${chargingPointId}`, { headers: getAuthHeaders() });

            if (res.status === 200) {
                console.log("Charging Point Details API Response:", res.data);
                return {
                    chargingPointId: res.data.chargingPointId,
                    chargingPointName: res.data.chargingPointName || res.data.name || "",
                    status: res.data.status,
                    connectorTypeId: res.data.connectorTypeId,
                    stationId: res.data.stationId,
                    powerOutput: res.data.powerOutput || res.data.connectorType?.powerOutput || 0,
                    pricePerKwh: res.data.pricePerKwh || res.data.connectorType?.pricePerKWh || 0,
                    typeName: res.data.connectorType?.typeName,
                    connectorType: res.data.connectorType ? {
                        connectorTypeId: res.data.connectorType.connectorTypeId,
                        typeName: res.data.connectorType.typeName,
                        powerOutput: res.data.connectorType.powerOutput,
                        pricePerKwh: res.data.connectorType.pricePerKWh
                    } : undefined,
                    station: res.data.station ? {
                        stationId: res.data.station.stationId,
                        stationName: res.data.station.stationName,
                        address: res.data.station.address,
                        status: res.data.station.status,
                        latitude: res.data.station.latitude,
                        longitude: res.data.station.longitude,
                        chargingPoint: res.data.station.chargingPoint,
                        chargingPointNumber: res.data.station.chargingPointNumber
                    } : undefined
                };
            }

            throw new Error("Không thể lấy thông tin chi tiết trụ sạc");
        } catch (err: any) {
            console.error("Error fetching charging point details:", err);
            const msg =
                err?.response?.data?.message || "Lấy thông tin chi tiết trụ sạc thất bại. Vui lòng thử lại.";
            toast.error(msg);
            return null;
        }
    };

    const handleGetConnectorList = async () => {

        try {

            const list = await fetchConnectorTypes();

            if (list) {

                setPortTypes(list.map(connector => ({

                    connectorId: connector.connectorId,

                    name: connector.name,

                    power: connector.power.toString(),

                    price: connector.price.toString()

                })));

                console.log("Connector type List: ", list);

            } else {

                console.warn("Can not receive the connector type list");

            }

        } catch (err) {

            console.error("Error for calling API: ", err);

        }

    };





    // Fetch stations on component mount

    useEffect(() => {

        handleGetStationList();

        fetchMapTilerPOIs();

        handleGetConnectorList();

        fetchCarModels();

    }, []);



    // Đảm bảo search control hiển thị sau khi map load

    useEffect(() => {

        if (__mapRef.current && __mapRef.current.loaded()) {

            // Kiểm tra và đảm bảo search control hiển thị

            setTimeout(() => {

                const geocoderElement = document.querySelector('.maplibregl-ctrl-geocoder') as HTMLElement;

                const customSearchElement = document.querySelector('.custom-search-control') as HTMLElement;



                if (geocoderElement) {

                    geocoderElement.style.display = 'block';

                    geocoderElement.style.visibility = 'visible';

                    geocoderElement.style.opacity = '1';

                    geocoderElement.style.zIndex = '1000';

                    console.log("GeocodingControl đã được đảm bảo hiển thị");

                } else if (customSearchElement) {

                    customSearchElement.style.display = 'block';

                    customSearchElement.style.visibility = 'visible';

                    customSearchElement.style.opacity = '1';

                    customSearchElement.style.zIndex = '1000';

                    console.log("Custom search control đã được đảm bảo hiển thị");

                } else {

                    console.warn("Không tìm thấy search control nào");

                }

            }, 1000);

        }

    }, [stations, poiList]);



    const callApiForStationUpdating = async (stationId: string): Promise<ChargingStation | null> => {

        setLoading(true);

        setError(null);



        try {

            const payload = {

                stationId: Number(stationId),

                stationName: stationName.trim(),

                address: address.trim(),

                status: (status || "INACTIVE").toUpperCase(),

                latitude: Number(latitude),

                longitude: Number(longitude),

                chargingPointNumber: chargingPosts.length,

                chargingPoints: chargingPosts.map(post => {

                    // Find the connector type ID from newPortTypes

                    const connectorType = newPortTypes.find(type => type.name === post.connectorType);
                    const numericId = Number(String(post.id).replace(/[^\d]/g, ""));

                    return {

                        ...(Number.isFinite(numericId) && numericId > 0 ? { chargingPointId: numericId } : {}),

                        chargingPointName: post.chargingPointName?.trim() || "",

                        chargingPointName: post.chargingPointName?.trim() || "",

                        status: post.status,

                        connector_type_id: connectorType?.connectorId || 1, // Use actual connector type ID

                        kWh: Number(post.power)

                    };

                })

            };



            const res = await axios.put(

                `http://localhost:8080/api/charging-stations/${stationId}`,

                payload,

                { headers: getAuthHeaders() }

            );



            if (res.status === 200 || res.status === 201) {

                toast.success(t('success'));

                return sanitizeStation({

                    ...res.data,

                    stationId: res.data?.stationId ?? undefined,

                    stationName: res.data?.stationName ?? payload.stationName,

                    address: res.data?.address ?? payload.address,

                    latitude: res.data?.latitude ?? payload.latitude,

                    longitude: res.data?.longitude ?? payload.longitude,

                });

            }



            throw new Error(t('error_loading_data'));

        } catch (err: any) {

            const msg = err?.response?.data?.message || t('error_loading_data');

            setError(msg);

            toast.error(msg);

            return null;

        } finally {

            setLoading(false);

        }

    };



    const callApiForStationDeleting = async (stationId: string): Promise<boolean> => {

        setLoading(true);

        setError(null);



        try {

            const res = await axios.delete(

                `http://localhost:8080/api/charging-stations/${stationId}`,

                { headers: getAuthHeaders() }

            );



            if (res.status === 200 || res.status === 204) {

                toast.success(t('success'));

                return true;

            }



            throw new Error(t('error_loading_data'));

        } catch (err: unknown) {

            const msg =

                err instanceof AxiosError && err.response?.data?.message

                    ? err.response.data.message

                    : t('error_loading_data');

            setError(msg);

            toast.error(msg);

            return false;

        } finally {

            setLoading(false);

        }

    };

    const callApiForChargingPointDeleting = async (chargingPointId: number): Promise<boolean> => {

        setLoading(true);

        setError(null);



        try {

            const res = await axios.delete(

                `http://localhost:8080/api/charging-points/${chargingPointId}`,

                { headers: getAuthHeaders() }

            );



            if (res.status === 200 || res.status === 204) {

                toast.success(t('success'));

                return true;

            }



            throw new Error(t('error_loading_data'));

        } catch (err: unknown) {

            const msg =

                err instanceof AxiosError && err.response?.data?.message

                    ? err.response.data.message

                    : t('error_loading_data');

            setError(msg);

            toast.error(msg);

            return false;

        } finally {

            setLoading(false);

        }

    };

    const callApiForChargingPointAdding = async (pointData?: typeof newChargingPoint): Promise<ChargingPoint | null> => {

        setLoading(true);

        setError(null);

        try {

            const sourcePoint = pointData ?? newChargingPoint;

            const payload = {

                chargingPointName: sourcePoint.chargingPointName.trim(),

                typeName: sourcePoint.typeName.trim(),

                status: sourcePoint.status,

                connectorTypeId: Number(sourcePoint.connectorTypeId),

                stationId: Number(sourcePoint.stationId)

            };

            console.log("Adding charging point with payload:", payload);

            const res = await axios.post(

                "http://localhost:8080/api/charging-points",

                payload,

                { headers: getAuthHeaders() }

            );



            if (res.status === 200 || res.status === 201) {

                toast.success(language === 'vi' ? 'Thêm trụ sạc thành công!' : 'Charging point added successfully!');

                return {

                    chargingPointId: res.data.chargingPointId ?? res.data.id,

                    chargingPointName: res.data.chargingPointName || payload.chargingPointName || "",

                    status: res.data.status ?? payload.status,

                    connectorTypeId: res.data.connectorTypeId ?? payload.connectorTypeId,

                    stationId: res.data.stationId ?? payload.stationId,

                    powerOutput: res.data.powerOutput ?? 0,

                    pricePerKwh: res.data.pricePerKwh ?? 0,

                    typeName: res.data.typeName ?? payload.typeName,

                    connectorType: res.data.connectorType

                };

            }



            throw new Error(t('error_loading_data'));

        } catch (err: unknown) {

            const msg =

                err instanceof AxiosError && err.response?.data?.message

                    ? err.response.data.message

                    : t('error_loading_data');

            setError(msg);

            toast.error(msg);

            return null;

        } finally {

            setLoading(false);

        }

    };




    // ========= HẾT API =========



    // ========= SEARCH FUNCTIONS =========



    const handleSearchPOI = (query: string) => {

        if (!query.trim()) {

            setSearchResults([]);

            setShowSearchResults(false);

            return;

        }



        const searchTerm = query.toLowerCase().trim();



        // Tìm kiếm thông minh với scoring

        const results = poiList

            .map(poi => {

                const name = poi.name.toLowerCase();

                const address = poi.address.toLowerCase();

                let score = 0;



                // Exact match trong tên (score cao nhất)

                if (name === searchTerm) score += 100;

                else if (name.startsWith(searchTerm)) score += 80;

                else if (name.includes(searchTerm)) score += 60;



                // Exact match trong địa chỉ

                if (address === searchTerm) score += 50;

                else if (address.startsWith(searchTerm)) score += 40;

                else if (address.includes(searchTerm)) score += 30;



                // Tìm kiếm từng từ riêng lẻ

                const searchWords = searchTerm.split(' ').filter(word => word.length > 0);

                const nameWords = name.split(' ');

                const addressWords = address.split(' ');



                searchWords.forEach(word => {

                    if (nameWords.some(nw => nw.startsWith(word))) score += 20;

                    if (addressWords.some(aw => aw.startsWith(word))) score += 15;

                });



                return { ...poi, score };

            })

            .filter(poi => poi.score > 0)

            .sort((a, b) => b.score - a.score)

            .slice(0, 8); // Giới hạn 8 kết quả tốt nhất



        setSearchResults(results);

        setShowSearchResults(true);

    };



    const handleSelectPOI = async (poi: { id: string; name: string; address: string; longitude: number; latitude: number }) => {

        console.log("🎯 Zoom to POI:", poi.name, "at", poi.longitude, poi.latitude);



        // Xóa marker tạm cũ nếu có

        if (tempMarker) {

            tempMarker.remove();

        }



        // Di chuyển bản đồ đến vị trí POI với animation mượt mà

        if (__mapRef.current) {

            __mapRef.current.flyTo({

                center: [poi.longitude, poi.latitude],

                zoom: 16,

                duration: 1500,

                essential: true

            });



            // Tạo marker tạm tại vị trí POI

            const markerElement = document.createElement("div");

            markerElement.className = "relative";

            markerElement.innerHTML = `

                <div class="w-8 h-8 rounded-full border-4 border-white shadow-2xl flex items-center justify-center animate-pulse" style="background-color:#3b82f6">

                    <div class="w-3 h-3 bg-white rounded-full"></div>

                </div>

                <div class="absolute top-10 left-1/2 -translate-x-1/2 bg-black border border-border rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap shadow-xl text-white">

                    ${poi.name}

                </div>

            `;

            markerElement.style.cursor = "pointer";



            const newTempMarker = new maptilersdk.Marker({ element: markerElement, anchor: "bottom" })

                .setLngLat([poi.longitude, poi.latitude])

                .addTo(__mapRef.current);



            setTempMarker(newTempMarker);

        }



        // Thử lấy địa chỉ chi tiết từ bản đồ cho POI được chọn

        let enhancedPOI = { ...poi };

        try {

            console.log("🔍 Đang lấy địa chỉ chi tiết cho POI:", poi.name);

            const detailedAddress = await getDetailedAddress(poi.longitude, poi.latitude, { name: poi.name });



            if (detailedAddress && detailedAddress.length > poi.address.length) {

                enhancedPOI = { ...poi, address: detailedAddress };

                console.log("✅ Địa chỉ đã được cải thiện:", detailedAddress);

            } else {

                console.log("ℹ️ Giữ nguyên địa chỉ hiện tại:", poi.address);

            }

        } catch (error) {

            console.warn("⚠️ Không thể lấy địa chỉ chi tiết:", error);

        }



        // Lưu POI được chọn (có thể đã được cải thiện địa chỉ)

        setSelectedPOI(enhancedPOI);



        // Đóng kết quả tìm kiếm với animation

        setTimeout(() => {

            setShowSearchResults(false);

            setSearchInput("");

        }, 200);



        // Toast notification với thông tin chi tiết

        toast.success("Đã tìm thấy vị trí", {

            description: `${enhancedPOI.name}`,

            duration: 3000,

        });

    };



    // Debounce search để tối ưu hiệu suất

    const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);



    const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {

        const value = e.target.value;

        setSearchInput(value);



        // Clear timeout cũ

        if (searchTimeout) {

            clearTimeout(searchTimeout);

        }



        // Debounce search với 300ms

        const newTimeout = setTimeout(() => {

            handleSearchPOI(value);

        }, 300);



        setSearchTimeout(newTimeout);

    };



    // Đóng dropdown khi click bên ngoài

    useEffect(() => {

        const handleClickOutside = (event: MouseEvent) => {

            const target = event.target as Element;

            if (!target.closest('.group')) {

                setShowSearchResults(false);

            }

        };



        document.addEventListener('mousedown', handleClickOutside);

        return () => {

            document.removeEventListener('mousedown', handleClickOutside);

        };

    }, []);



    // Cleanup timeout khi component unmount

    useEffect(() => {

        return () => {

            if (searchTimeout) {

                clearTimeout(searchTimeout);

            }

        };

    }, [searchTimeout]);



    // Đóng address search dropdown khi click bên ngoài

    useEffect(() => {

        const handleClickOutside = (event: MouseEvent) => {

            const target = event.target as Element;

            if (!target.closest('.address-search-results-container') && !target.closest('#editAddress')) {

                setShowAddressSearchResults(false);

            }

            if (!target.closest('.port-types-popup-container')) {

                setShowPortTypesPopup(false);

            }

            if (!target.closest('.add-port-type-popup-container')) {

                setShowAddPortTypePopup(false);

            }

        };



        if (showAddressSearchResults || showPortTypesPopup || showAddPortTypePopup) {

            document.addEventListener('mousedown', handleClickOutside);

        }



        return () => {

            document.removeEventListener('mousedown', handleClickOutside);

        };

    }, [showAddressSearchResults, showPortTypesPopup, showAddPortTypePopup]);



    // ========= STATION STATUS UPDATE FUNCTION =========



    const updateStationStatus = async (stationId: string, status: "ACTIVE" | "INACTIVE"): Promise<boolean> => {

        setLoading(true);

        setError(null);



        try {

            const res = await axios.patch(

                `http://localhost:8080/api/charging-stations/${stationId}/status`,

                status,

                { headers: getAuthHeaders() }

            );



            if (res.status === 200 || res.status === 201) {

                const statusText = status === "ACTIVE" ? "kích hoạt" : "vô hiệu hóa";

                toast.success(`${t('success')} - ${statusText}`);

                return true;

            }



            throw new Error(t('error_loading_data'));

        } catch (err: unknown) {

            const msg =

                err instanceof AxiosError && err.response?.data?.message

                    ? err.response.data.message

                    : t('error_loading_data');

            setError(msg);

            toast.error(msg);

            return false;

        } finally {

            setLoading(false);

        }

    };



    // ========= CHARGING POSTS MANAGEMENT FUNCTIONS =========



    const addChargingPost = () => {

        const newPost = {

            id: `post-${Date.now()}`,

            chargingPointName: "",

            chargingPointName: "",

            connectorType: "",

            power: "",

            price: "",

            status: "AVAILABLE"

        };

        setChargingPosts(prev => [...prev, newPost]);

    };



    const removeChargingPost = (id: string) => {

        setChargingPosts(prev => prev.filter(post => post.id !== id));

    };



    const updateChargingPost = (id: string, field: string, value: string) => {

        setChargingPosts(prev => prev.map(post =>

            post.id === id ? { ...post, [field]: value } : post

        ));

    };





    const fetchChargingPointsByStationId = async (stationId: string): Promise<ChargingStation | null> => {

        try {

            const res = await axios.get(`http://localhost:8080/api/charging-points/station/${stationId}`, { headers: getAuthHeaders() });



            if (res.status === 200 && Array.isArray(res.data) && res.data.length > 0) {

                console.log("Charging Points by Station ID API Response:", res.data);



                // Get station info from the first charging point's station data

                const firstPoint = res.data[0];

                const stationData = firstPoint.station;



                // Calculate available and total points

                const totalPoints = res.data.length;

                const availablePoints = res.data.filter(point => point.status === 'AVAILABLE').length;



                // Process connector types from charging points

                const connectorTypesMap = new Map<string, ConnectorType>();



                res.data.forEach((point: any) => {

                    const connectorType = point.connectorType;

                    const typeName = connectorType?.typeName || 'Unknown';

                    const existing = connectorTypesMap.get(typeName);



                    if (existing) {

                        existing.total += 1;

                        if (point.status === 'AVAILABLE') {

                            existing.available += 1;

                        }

                    } else {

                        connectorTypesMap.set(typeName, {

                            type: typeName,

                            available: point.status === 'AVAILABLE' ? 1 : 0,

                            total: 1,

                            power: `${connectorType?.powerOutput || 0}kW`,

                            connectorTypeId: connectorType?.connectorTypeId,

                            typeName: typeName,

                            powerOutput: connectorType?.powerOutput,

                            pricePerKwh: connectorType?.pricePerKwh

                        });

                    }

                });



                const connectorTypes = Array.from(connectorTypesMap.values());



                // Map charging points to the expected format

                const chargingPoints: ChargingPoint[] = res.data.map((point: any) => ({

                    chargingPointId: point.chargingPointId,

                    chargingPointName: point.chargingPointName || point.name || "",

                    status: point.status,

                    connectorTypeId: point.connectorTypeId,

                    stationId: point.stationId,

                    powerOutput: point.connectorType?.powerOutput || point.powerOutput || 0,

                    pricePerKwh: point.connectorType?.pricePerKWh || point.pricePerKwh || 0,

                    typeName: point.connectorType?.typeName,

                    connectorType: point.connectorType ? {

                        connectorTypeId: point.connectorType.connectorTypeId,

                        typeName: point.connectorType.typeName,

                        powerOutput: point.connectorType.powerOutput,

                        pricePerKwh: point.connectorType.pricePerKwh

                    } : undefined,

                    station: point.station ? {

                        stationId: point.station.stationId,

                        stationName: point.station.stationName,

                        address: point.station.address,

                        status: point.station.status,

                        latitude: point.station.latitude,

                        longitude: point.station.longitude,

                        chargingPoint: point.station.chargingPoint,

                        chargingPointNumber: point.station.chargingPointNumber

                    } : undefined

                }));



                // Create the station object with all details

                const station: ChargingStation = {

                    id: String(stationData.stationId || stationId),

                    name: stationData.stationName || 'Unknown Station',

                    address: stationData.address || '',

                    latitude: stationData.latitude || 0,

                    longitude: stationData.longitude || 0,

                    status: stationData.status || 'INACTIVE',

                    totalPoints: totalPoints,

                    availablePoints: availablePoints,

                    connectorTypes: connectorTypes,

                    chargingPoints: chargingPoints,

                    chargingPointNumber: stationData.chargingPointNumber || totalPoints,

                    pricing: {

                        standard: 0,

                        fast: 0,

                        rapid: 0

                    },

                    operatingHours: '24/7',

                    contactPhone: '',

                    contactEmail: '',

                    lastMAINTENANCE: '',

                    nextMAINTENANCE: '',

                    revenue: {

                        daily: 0,

                        monthly: 0

                    }

                };



                return station;

            }



            throw new Error("Không thể lấy thông tin trạm sạc");

        } catch (err: any) {

            const msg = err?.response?.data?.message || "Lấy thông tin trạm sạc thất bại. Vui lòng thử lại.";

            console.error("Error fetching charging points by station ID:", err);

            toast.error(msg);

            return null;

        }

    }



    // ========= PORT TYPE MANAGEMENT FUNCTIONS =========






    const handleCancelAddPortType = () => {

        setNewPortType({ name: "", power: "", price: "" });

        setShowAddPortTypePopup(false);

    };

    const handleAddChargingPoint = async () => {

        if (!newChargingPoint.chargingPointName.trim()) {

            toast.error(language === 'vi' ? "Vui lòng nhập tên trụ sạc" : "Please enter charging point name");

            return;

        }



        if (!newChargingPoint.typeName.trim()) {

            toast.error(language === 'vi' ? "Vui lòng chọn loại connector" : "Please select connector type");

            return;

        }



        if (!selectedStation) {

            toast.error(language === 'vi' ? "Vui lòng chọn trạm sạc" : "Please select a station");

            return;

        }



        if (!newChargingPoint.connectorTypeId || newChargingPoint.connectorTypeId === 0) {

            toast.error(language === 'vi' ? "Vui lòng chọn loại connector hợp lệ" : "Please select valid connector type");

            return;

        }



        try {

            // Set station ID from selected station

            const updatedPoint = {

                ...newChargingPoint,

                chargingPointName: newChargingPoint.chargingPointName.trim(),

                stationId: Number(selectedStation.id)

            };



            setNewChargingPoint(updatedPoint);



            const result = await callApiForChargingPointAdding(updatedPoint);

            if (result) {

                // Reset form

                setNewChargingPoint({

                    chargingPointName: "",

                    typeName: "",

                    status: "AVAILABLE",

                    connectorTypeId: 0,

                    stationId: 0

                });

                setIsAddChargingPointDialogOpen(false);



                // Refresh station list to show new charging point

                await handleGetStationList();



                toast.success(language === 'vi' ? 'Đã thêm trụ sạc thành công!' : 'Charging point added successfully!');

            }

        } catch (error) {

            console.error("Error adding charging point:", error);

        }

    };



    // ========= ADDRESS SEARCH FUNCTIONS FOR EDIT FORM =========



    const handleAddressSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {

        const value = e.target.value;

        setAddressSearchInput(value);

        setIsAddressFieldTouched(true); // Đánh dấu đã tương tác với field



        // Clear timeout if exists

        if (addressSearchTimeout) {

            clearTimeout(addressSearchTimeout);

        }



        // Set new timeout

        const timeout = setTimeout(async () => {

            if (value.trim().length > 0) {

                handleAddressSearchPOI(value.trim());



                // Auto-geocode the address and update coordinates

                const coordinates = await geocodeAddress(value.trim());

                if (coordinates) {

                    setLatitude(coordinates.lat);

                    setLongitude(coordinates.lng);

                    setAddress(value.trim());



                    // Update marker position in real-time with new coordinates

                    if (selectedStation) {

                        const updatedStation = {

                            ...selectedStation,

                            latitude: coordinates.lat,

                            longitude: coordinates.lng,

                            address: value.trim()

                        };

                        console.log("Updating marker in real-time with geocoded coordinates:", coordinates.lat, coordinates.lng);

                        updateStationMarker(updatedStation);

                    }

                }

            } else {

                setAddressSearchResults([]);

                setShowAddressSearchResults(false);

            }

        }, 500); // Increased timeout for geocoding



        setAddressSearchTimeout(timeout);

    };



    const [addressSearchTimeout, setAddressSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);



    const handleAddressSearchPOI = async (query: string) => {

        try {

            console.log("🔍 Searching addresses for:", query);



            // Tìm kiếm trong POI list hiện có

            const results = poiList

                .filter(poi =>

                    poi.name.toLowerCase().includes(query.toLowerCase()) ||

                    poi.address.toLowerCase().includes(query.toLowerCase())

                )

                .slice(0, 8); // Giới hạn 8 kết quả



            setAddressSearchResults(results);

            setShowAddressSearchResults(true);



            console.log(`✅ Found ${results.length} address results`);

        } catch (error) {

            console.error("❌ Address search error:", error);

            setAddressSearchResults([]);

            setShowAddressSearchResults(false);

        }

    };



    const handleSelectAddressPOI = async (poi: { id: string; name: string; address: string; longitude: number; latitude: number }) => {

        console.log("🎯 Selected address POI:", poi);



        // Cập nhật địa chỉ và tọa độ

        setAddress(poi.address);

        setLatitude(poi.latitude);

        setLongitude(poi.longitude);



        // Đóng dropdown

        setShowAddressSearchResults(false);

        setAddressSearchInput(poi.address);



        // Update marker position in real-time

        if (selectedStation) {

            const updatedStation = {

                ...selectedStation,

                latitude: poi.latitude,

                longitude: poi.longitude,

                address: poi.address

            };

            console.log("Updating marker with selected POI coordinates:", poi.latitude, poi.longitude);

            updateStationMarker(updatedStation);

        }



        // Toast notification

        toast.success("Đã cập nhật địa chỉ và tọa độ", {

            description: `${poi.name}`,

            duration: 3000,

        });

    };



    // ========= HẾT SEARCH FUNCTIONS =========



    const RAW_MAPTILER_API_KEY = (import.meta.env.VITE_MAPTILER_API_KEY ?? "").toString().trim();



    const MAPTILER_API_KEY =

        RAW_MAPTILER_API_KEY && RAW_MAPTILER_API_KEY !== "get_your_free_key_from_maptiler_cloud"

            ? RAW_MAPTILER_API_KEY

            : "Hx1e4dmbVOmTN9A5LuRd";



    const MAPTILER_POI_URL =

        `https://api.maptiler.com/data/0199acb6-5ff7-7e19-8995-ec24562f08ef/features.json?key=${MAPTILER_API_KEY}`;



    // BBOX Việt Nam (xấp xỉ) để lọc điểm ngoài lãnh thổ

    const VN_BBOX = { minLng: 102.0, maxLng: 110.0, minLat: 8.0, maxLat: 24.5 };



    // helper: kiểm tra điểm có nằm trong bbox không

    const inBBox = (lng: number, lat: number, box = VN_BBOX) =>

        lng >= box.minLng && lng <= box.maxLng && lat >= box.minLat && lat <= box.maxLat;



    // helper: giá trị gần 0

    const nearZero = (v: number) => Math.abs(v) < 1e-4;



    // Helper: Reverse geocoding để lấy địa chỉ chi tiết từ bản đồ

    const getDetailedAddress = async (lng: number, lat: number, props: any) => {

        try {

            const apiKey = MAPTILER_API_KEY;

            if (!apiKey) return null;



            // Sử dụng MapTiler Geocoding API để reverse geocoding với thông tin chi tiết

            const response = await axios.get(

                `https://api.maptiler.com/geocoding/reverse/${lng},${lat}.json?key=${apiKey}&language=vi&limit=5&types=street,locality,district,region`

            );



            const features = response.data?.features || [];

            if (features.length > 0) {

                // Tìm feature có thông tin đường phố chi tiết nhất

                const streetFeature = features.find((f: any) => f.properties?.street) || (features[0] as any);

                const context = streetFeature.context || {};



                // Lấy thông tin chi tiết từ context

                const street = streetFeature.properties?.street || "";

                const housenumber = streetFeature.properties?.housenumber || "";

                const locality = context.locality?.[0] || context.place?.[0] || "";

                const district = context.district?.[0] || context.county?.[0] || "";

                const city = context.region?.[0] || context.city?.[0] || "";

                const country = context.country?.[0] || "";



                // Tạo địa chỉ chi tiết theo format Việt Nam

                let detailedAddress = "";



                // Phần 1: Số nhà + Tên đường

                if (housenumber && street) {

                    detailedAddress = `${housenumber} ${street}`;

                } else if (street) {

                    detailedAddress = street;

                } else {

                    detailedAddress = streetFeature.properties?.name || streetFeature.properties?.label || "";

                }



                // Phường/Xã

                if (locality) {

                    detailedAddress += `, ${locality}`;

                }



                // Quận/Huyện

                if (district) {

                    detailedAddress += `, ${district}`;

                }



                // Thành phố/Tỉnh

                if (city) {

                    detailedAddress += `, ${city}`;

                }



                // Quốc gia (nếu cần)

                if (country && country !== "Việt Nam") {

                    detailedAddress += `, ${country}`;

                }



                console.log("Reverse geocoding result:", {

                    original: props.name,

                    street,

                    housenumber,

                    locality,

                    district,

                    city,

                    result: detailedAddress.trim()

                });



                return detailedAddress.trim();

            }

        } catch (error) {

            console.warn("Reverse geocoding failed:", error);

        }

        return null;

    };



    const fetchMapTilerPOIs = async () => {

        try {

            const apiKey = MAPTILER_API_KEY;

            if (!apiKey) {

                console.warn("MapTiler API key not found, using mock data");

                const mockPOI = [

                    { id: "poi-1", name: "Siêu Thị Bình Hòa", address: "123 Nguyễn Huệ, Quận 1, TP.HCM", longitude: 106.6981, latitude: 10.8163 },

                    { id: "poi-2", name: "Co.opmart Nguyễn Đình Chiểu", address: "168 Nguyễn Đình Chiểu, Quận 3, TP.HCM", longitude: 106.6928, latitude: 10.7815 },

                    { id: "poi-3", name: "Mega Market An Phú", address: "Khu B, Phường An Phú, Thủ Đức, TP.HCM", longitude: 106.7422, latitude: 10.8008 }

                ];

                setPoiList(mockPOI);

                return;

            }


            console.log("🔄 Fetching POIs from MapTiler API...");
            console.log("API Key:", apiKey.substring(0, 10) + "...");

            const res = await axios.get(`https://api.maptiler.com/data/0199acb6-5ff7-7e19-8995-ec24562f08ef/features.json?key=${apiKey}`);

            console.log("✅ MapTiler API Response:", res.status);
            console.log("Response data structure:", {
                hasData: !!res.data,
                hasFeatures: !!res.data?.features,
                featuresType: typeof res.data?.features,
                isArray: Array.isArray(res.data?.features),
                featuresLength: res.data?.features?.length
            });

            const features = Array.isArray(res.data?.features) ? res.data.features : [];
            console.log(`📍 Total features from API: ${features.length}`);



            let skippedInvalid = 0;

            let skippedOutOfVN = 0;

            let swappedLatLng = 0;



            // lọc & chuẩn hoá toạ độ như bạn đang làm

            const candidates = features

                .filter((f: any) => {

                    // Hỗ trợ cả Point và Polygon

                    return (f?.geometry?.type === "Point" || f?.geometry?.type === "Polygon") &&

                        Array.isArray(f?.geometry?.coordinates);

                })

                .map((f: any, idx: number) => {

                    let lng, lat;



                    if (f.geometry.type === "Point") {

                        [lng, lat] = f.geometry.coordinates as [number, number];

                    } else if (f.geometry.type === "Polygon" && f.geometry.coordinates[0] && f.geometry.coordinates[0][0]) {

                        // Lấy tọa độ trung tâm của polygon

                        const coords = f.geometry.coordinates[0];

                        const center = coords.reduce((acc: number[], coord: number[]) => {

                            return [(acc[0] || 0) + (coord[0] || 0), (acc[1] || 0) + (coord[1] || 0)];

                        }, [0, 0]);

                        lng = (center[0] || 0) / coords.length;

                        lat = (center[1] || 0) / coords.length;

                    } else {

                        return null;

                    }



                    if ((lng === 0 && lat === 0) || (nearZero(lng) && nearZero(lat))) {

                        skippedInvalid++;

                        if (idx < 5) console.log(`⚠️ Skipped invalid coords [${lng}, ${lat}] for feature ${idx}`);

                        return null;

                    }

                    if (lng >= 8 && lng <= 24.8 && lat >= 102 && lat <= 110) {

                        [lng, lat] = [lat, lng];

                        swappedLatLng++;

                        if (idx < 5) console.log(`🔄 Swapped coords for feature ${idx}: [${lat}, ${lng}]`);

                    }



                    const lngNum = Number(lng);

                    const latNum = Number(lat);

                    if (!inBBox(lngNum, latNum)) {

                        skippedOutOfVN++;

                        if (idx < 5) console.log(`🌍 Skipped out of VN [${lngNum}, ${latNum}] for feature ${idx}`);

                        return null;

                    }



                    const props = f?.properties ?? {};



                    // Tạo địa chỉ chi tiết từ nhiều nguồn dữ liệu

                    let address = "";



                    // Phương pháp 1: Sử dụng các trường addr: chi tiết

                    if (props["addr:street"] && props["addr:housenumber"]) {

                        address = `${props["addr:housenumber"]} ${props["addr:street"]}`;

                        if (props["addr:subdistrict"]) address += `, ${props["addr:subdistrict"]}`;

                        if (props["addr:district"]) address += `, ${props["addr:district"]}`;

                        if (props["addr:city"]) address += `, ${props["addr:city"]}`;

                    }

                    // Phương pháp 2: Chỉ có tên đường

                    else if (props["addr:street"]) {

                        address = props["addr:street"];

                        if (props["addr:city"]) address += `, ${props["addr:city"]}`;

                    }

                    // Phương pháp 3: Sử dụng các trường khác

                    else if (props.address || props.addr) {

                        address = (props.address || props.addr) as string;

                    }

                    // Phương pháp 4: Sử dụng tên và mô tả

                    else if (props.name && props.description) {

                        address = `${props.name} - ${props.description}`;

                    }

                    // Phương pháp 5: Sử dụng tên và các thông tin khác

                    else if (props.name) {

                        const additionalInfo = [];

                        if (props["addr:city"]) additionalInfo.push(props["addr:city"]);

                        if (props["addr:district"]) additionalInfo.push(props["addr:district"]);

                        if (props.brand) additionalInfo.push(props.brand);

                        if (props.operator) additionalInfo.push(props.operator);



                        address = props.name;

                        if (additionalInfo.length > 0) {

                            address += ` (${additionalInfo.join(", ")})`;

                        }

                    }

                    // Phương pháp 6: Fallback cuối cùng

                    else {

                        address = props.description || "Địa chỉ chưa xác định";

                    }



                    // Làm sạch địa chỉ

                    address = address.trim().replace(/,\s*,/g, ',').replace(/,\s*$/, '');



                    // Đánh dấu POI cần reverse geocoding

                    const needsReverseGeocoding = address === "Địa chỉ chưa xác định" || address.length < 10;



                    const poi = {

                        id: String(f.id ?? props["@id"] ?? props.id ?? props.stationId ?? props._id ?? `poi-${idx}`),

                        name: String(props.name ?? props.title ?? "POI (chưa có trạm)"),

                        address: address,

                        longitude: lngNum,

                        latitude: latNum,

                    };

                    console.log(`POI ${idx + 1}:`, poi.name, `at [${poi.longitude}, ${poi.latitude}]`);

                    return poi;

                })

                .filter(Boolean) as Array<{

                id: string; name: string; address: string; longitude: number; latitude: number;

            }>;


            console.log(`✅ Processed ${candidates.length} valid POIs`);
            console.log(`⚠️ Skipped: ${skippedInvalid} invalid, ${skippedOutOfVN} outside VN, ${swappedLatLng} swapped coords`);

            // Không vẽ POI markers nữa - đã tắt hoàn toàn

            const map = __mapRef.current;

            const drawPOIs = () => {

                // Xóa tất cả POI markers hiện có

                poiMarkersRef.current.forEach(m => m.remove());

                poiMarkersRef.current = [];

                console.log("Đã xóa tất cả POI markers");

            };



            if (map) {

                if (map.loaded()) {

                    drawPOIs();

                } else {

                    map.once("load", drawPOIs);

                }

            }

            setPoiList(candidates);



            // Xử lý reverse geocoding để lấy địa chỉ chi tiết từ bản đồ

            const improveAddresses = async () => {

                console.log("Bắt đầu cải thiện địa chỉ cho", candidates.length, "POI...");



                const improvedCandidates = await Promise.all(

                    candidates.map(async (poi, index) => {

                        try {

                            // Luôn thử reverse geocoding để lấy địa chỉ chi tiết từ bản đồ

                            const detailedAddress = await getDetailedAddress(poi.longitude, poi.latitude, { name: poi.name });



                            if (detailedAddress && detailedAddress.length > poi.address.length) {

                                console.log(`POI ${index + 1}: "${poi.name}" - Địa chỉ mới: "${detailedAddress}"`);

                                return { ...poi, address: detailedAddress };

                            } else {

                                console.log(`POI ${index + 1}: "${poi.name}" - Giữ nguyên địa chỉ: "${poi.address}"`);

                                return poi;

                            }

                        } catch (error) {

                            console.warn(`Reverse geocoding failed for POI ${index + 1}:`, poi.name, error);

                            return poi;

                        }

                    })

                );



                setPoiList(improvedCandidates);

                console.log("✅ Đã hoàn thành cải thiện địa chỉ cho tất cả POI");

            };



            // Chạy reverse geocoding trong background

            improveAddresses();



            toast.success(

                `Đã tải ${candidates.length} địa điểm từ MapTiler API. Bỏ ${skippedInvalid} vô hiệu, ${skippedOutOfVN} ngoài VN` +

                (swappedLatLng ? `, sửa ${swappedLatLng} điểm đảo lat/lng.` : ".")

            );

        } catch (err: any) {

            console.error("❌ Lỗi khi fetch POI từ MapTiler API:", err);
            console.error("Error details:", {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });

            // Try to load from local export.geojson file as fallback
            try {
                console.log("🔄 Trying to load from local export.geojson file...");

                const localRes = await axios.get('/export.geojson');
                const localFeatures = Array.isArray(localRes.data?.features) ? localRes.data.features : [];

                console.log(`📂 Loaded ${localFeatures.length} features from local file`);

                if (localFeatures.length > 0) {
                    // Process local features the same way
                    let skippedInvalid = 0;
                    let skippedOutOfVN = 0;
                    let swappedLatLng = 0;

                    const candidates = localFeatures
                        .filter((f: any) => {
                            return (f?.geometry?.type === "Point" || f?.geometry?.type === "Polygon") &&
                                Array.isArray(f?.geometry?.coordinates);
                        })
                        .map((f: any, idx: number) => {
                            let lng, lat;

                            if (f.geometry.type === "Point") {
                                [lng, lat] = f.geometry.coordinates as [number, number];
                            } else if (f.geometry.type === "Polygon" && f.geometry.coordinates[0] && f.geometry.coordinates[0][0]) {
                                const coords = f.geometry.coordinates[0];
                                const center = coords.reduce((acc: number[], coord: number[]) => {
                                    return [(acc[0] || 0) + (coord[0] || 0), (acc[1] || 0) + (coord[1] || 0)];
                                }, [0, 0]);
                                lng = (center[0] || 0) / coords.length;
                                lat = (center[1] || 0) / coords.length;
                            } else {
                                return null;
                            }

                            if ((lng === 0 && lat === 0) || (nearZero(lng) && nearZero(lat))) {
                                skippedInvalid++;
                                return null;
                            }

                            if (lng >= 8 && lng <= 24.8 && lat >= 102 && lat <= 110) {
                                [lng, lat] = [lat, lng];
                                swappedLatLng++;
                            }

                            const lngNum = Number(lng);
                            const latNum = Number(lat);

                            if (!inBBox(lngNum, latNum)) {
                                skippedOutOfVN++;
                                return null;
                            }

                            const props = f?.properties ?? {};

                            // Build address from properties
                            let address = "";

                            if (props["addr:street"] && props["addr:housenumber"]) {
                                address = `${props["addr:housenumber"]} ${props["addr:street"]}`;
                                if (props["addr:subdistrict"]) address += `, ${props["addr:subdistrict"]}`;
                                if (props["addr:district"]) address += `, ${props["addr:district"]}`;
                                if (props["addr:city"]) address += `, ${props["addr:city"]}`;
                                if (props["addr:province"]) address += `, ${props["addr:province"]}`;
                            } else if (props["addr:street"]) {
                                address = props["addr:street"];
                                if (props["addr:city"]) address += `, ${props["addr:city"]}`;
                                if (props["addr:province"]) address += `, ${props["addr:province"]}`;
                            } else if (props.description) {
                                address = props.description;
                            } else if (props.name) {
                                const additionalInfo = [];
                                if (props["addr:city"]) additionalInfo.push(props["addr:city"]);
                                if (props["addr:district"]) additionalInfo.push(props["addr:district"]);
                                if (props["addr:province"]) additionalInfo.push(props["addr:province"]);

                                address = props.name;
                                if (additionalInfo.length > 0) {
                                    address += ` (${additionalInfo.join(", ")})`;
                                }
                            } else {
                                address = "Địa chỉ chưa xác định";
                            }

                            address = address.trim().replace(/,\s*,/g, ',').replace(/,\s*$/, '');

                            return {
                                id: String(f.id ?? props["@id"] ?? props.id ?? `poi-local-${idx}`),
                                name: String(props.name ?? props.title ?? "POI (chưa có trạm)"),
                                address: address,
                                longitude: lngNum,
                                latitude: latNum,
                            };
                        })
                        .filter(Boolean) as Array<{
                        id: string; name: string; address: string; longitude: number; latitude: number;
                    }>;

                    setPoiList(candidates);
                    console.log(`✅ Loaded ${candidates.length} POIs from local file`);

                    toast.success(
                        `Đã tải ${candidates.length} địa điểm từ file local. Bỏ ${skippedInvalid} vô hiệu, ${skippedOutOfVN} ngoài VN` +
                        (swappedLatLng ? `, sửa ${swappedLatLng} điểm đảo lat/lng.` : ".")
                    );

                    return;
                }
            } catch (localErr) {
                console.error("❌ Cannot load from local file either:", localErr);
            }

            // Final fallback to mock data
            toast.error("Không thể lấy POI từ MapTiler API", {
                description: "Đang sử dụng dữ liệu mẫu"
            });

        }



    };







    const handleAddingStation = async (e: React.FormEvent) => {

        e.preventDefault();



        // Validation

        if (!stationName.trim()) {

            const msg = "Tên trạm sạc không được để trống";

            setError(msg);

            toast.error(msg);

            return;

        }

        if (!address.trim()) {

            const msg = "Địa chỉ không được để trống";

            setError(msg);

            toast.error(msg);

            return;

        }



        if (latitude === null || Number(latitude) < -90 || Number(latitude) > 90) {

            const msg = "Vĩ độ không hợp lệ (phải nằm trong khoảng -90 đến 90)";

            setError(msg);

            toast.error(msg);

            return;

        }



        if (longitude === null || Number(longitude) < -180 || Number(longitude) > 180) {

            const msg = "Kinh độ không hợp lệ (phải nằm trong khoảng -180 đến 180)";

            setError(msg);

            toast.error(msg);

            return;

        }





        try {

            const created = await handleStationAdding();

            if (!created) return;



            // Ensure we never insert an unsafe object into state

            const safe = sanitizeStation(created);

            setStations((prev) => [safe, ...prev]);





            // Reset form

            setStationName("");

            setAddress("");

            setStatus("INACTIVE");

            setLatitude(null);

            setLongitude(null);

            setChargingPosts([]);

            setError(null);

            setIsAddDialogOpen(false);

        } catch (err) {

            console.error("Error adding station:", err);

            toast.error(t('error_loading_data'));

        }

    };



    const handleUpdatingStation = async (e: React.FormEvent, stationId: string) => {

        e.preventDefault();



        // Validation

        if (!stationName.trim()) {

            const msg = "Tên trạm sạc không được để trống";

            setError(msg);

            toast.error(msg);

            return;

        }

        if (!address.trim()) {

            const msg = "Địa chỉ không được để trống";

            setError(msg);

            toast.error(msg);

            return;

        }

        // Kiểm tra vĩ độ

        if (latitude === null || Number(latitude) < -90 || Number(latitude) > 90) {

            const msg = "Vĩ độ không hợp lệ (phải nằm trong khoảng -90 đến 90)";

            setError(msg);

            toast.error(msg);

            return;

        }



        // Kiểm tra kinh độ

        if (longitude === null || Number(longitude) < -180 || Number(longitude) > 180) {

            const msg = "Kinh độ không hợp lệ (phải nằm trong khoảng -180 đến 180)";

            setError(msg);

            toast.error(msg);

            return;

        }





        // Update marker position immediately with form coordinates (before API call)

        if (selectedStation) {

            const stationWithNewCoords = {

                ...selectedStation,

                latitude: Number(latitude),

                longitude: Number(longitude),

                address: address.trim()

            };

            console.log("Updating marker immediately with form coordinates:", stationWithNewCoords.latitude, stationWithNewCoords.longitude);

            updateStationMarker(stationWithNewCoords);

        }



        try {

            const updated = await callApiForStationUpdating(stationId);

            if (!updated) return;



            // Ensure we never insert an unsafe object into state

            const safe = sanitizeStation(updated);

            setStations((prev) =>

                prev.map((station) => (station.id === safe.id ? safe : station))

            );



            // Update selected station

            setSelectedStation(safe);

            setSelectedStationPopup(safe);



            // Reset form

            setStationName("");

            setAddress("");

            setLatitude(null);

            setLongitude(null);

            setError(null);

            setIsEditDialogOpen(false);

        } catch (err) {

            console.error("Error updating station:", err);

            toast.error(t('error_loading_data'));

        }

    };



    const handleDeletingStation = async (e: React.FormEvent, stationId: string) => {

        e.preventDefault();

        console.log("Starting deletion for station:", stationId);

        // Check if station has any charging points that are OCCUPIED or RESERVED
        const station = stations.find((s) => s.id === stationId);

        if (station && station.chargingPoints && station.chargingPoints.length > 0) {
            const busyPoints = station.chargingPoints.filter(
                point => point.status === 'OCCUPIED' || point.status === 'RESERVED'
            );

            if (busyPoints.length > 0) {
                const busyPointIds = busyPoints.map(p => `#${p.chargingPointId}`).join(', ');
                const statusList = busyPoints.map(p =>
                    p.status === 'OCCUPIED' ? t('occupied') : t('reserved')
                ).join(', ');

                toast.error(
                    t('cannot_delete_station'),
                    {
                        description: `${t('station_has_busy_points')}: ${busyPointIds} (${statusList}). ${t('cannot_delete_or_modify')}`
                    }
                );
                return;
            }
        }



        try {

            const success = await callApiForStationDeleting(stationId);

            console.log("Deletion success:", success);

            if (!success) return;



            // Update state to remove the station

            console.log("Removing station from state...");

            setStations((prev) => prev.filter((s) => s.id !== stationId));



            // Clear selected station and popup if the deleted station was selected

            if (selectedStation?.id === stationId) {

                console.log("Clearing selected station and popup...");

                setSelectedStation(null);

                setSelectedStationPopup(null);

            }



            // Remove the corresponding marker

            const marker = markerMapRef.current.get(stationId);

            if (marker) {

                console.log("Removing marker for station:", stationId);

                try {

                    marker.remove();

                } catch (err) {

                    console.error("Error removing marker:", err);

                }

                markerMapRef.current.delete(stationId);

            } else {

                console.warn("No marker found for station:", stationId);

            }



            // Close the delete dialog

            console.log("Closing delete dialog...");

            setIsDeleteDialogOpen(false);

        } catch (err) {

            console.error("Error deleting station:", err);

            toast.error(t('error_loading_data'));

        }

    };

    // ========= UI helpers =========
    const getStatusIcon = (s: StationStatus) => {

        switch (s) {

            case "ACTIVE":

                return <CheckCircle className="w-4 h-4 text-green-500" />;

            case "INACTIVE":

                return <XCircle className="w-4 h-4 text-gray-500" />;

            case "MAINTENANCE":

                return <Settings className="w-4 h-4 text-yellow-500" />;

            default:

                return <XCircle className="w-4 h-4 text-red-500" />;

        }

    };



    const getStatusBadge = (s: StationStatus) => {

        const statusConfig: Record<StationStatus, { label: string; class: string }> = {

            ACTIVE: { label: t('active'), class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200" },

            INACTIVE: { label: t('inactive'), class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200" },

            MAINTENANCE: {

                label: t('maintenance'),

                class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"

            },

        };



        return (

            <Badge variant="secondary" className={statusConfig[s]?.class}>

                {statusConfig[s]?.label}

            </Badge>

        );

    };



    const getStatusColor = (s: StationStatus) => {

        switch (s) {

            case "ACTIVE":

                return "#22c55e"; // Green-500 - đậm và soft hơn

            case "INACTIVE":

                return "#ef4444"; // Red-500 - đậm và soft hơn

            case "MAINTENANCE":

                return "#f59e0b"; // Amber-500 - đậm và soft hơn

            default:

                return "#64748b"; // Slate-500 - soft hơn

        }

    };



    const filteredStations = stations.filter((station) => {

        const q = searchQuery.toLowerCase();

        const matchesSearch = station.name.toLowerCase().includes(q) || station.address.toLowerCase().includes(q);

        const matchesStatus = statusFilter === "all" || station.status === (statusFilter as StationStatus);

        return matchesSearch && matchesStatus;

    });

    // Pagination logic
    const totalPages = Math.ceil(filteredStations.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedStations = filteredStations.slice(startIndex, endIndex);

    // Reset to first page when search/filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);



    const handleEditStation = async () => {

        if (selectedStation) {

            // First set basic info for immediate UI response

            setStationName(selectedStation.name);

            setAddress(selectedStation.address);

            setLatitude(selectedStation.latitude);

            setLongitude(selectedStation.longitude);

            setStatus(selectedStation.status);



            // Fetch complete station details using the new method

            try {

                const detailedStation = await fetchChargingPointsByStationId(selectedStation.id);

                if (detailedStation) {

                    // Update the selected station with complete details

                    setSelectedStation(detailedStation);



                    // Use the detailed station data for form fields

                    setStationName(detailedStation.name);

                    setAddress(detailedStation.address);

                    setLatitude(detailedStation.latitude);

                    setLongitude(detailedStation.longitude);

                    setStatus(detailedStation.status);



                    // Load charging points from the detailed station data

                    if (detailedStation.chargingPoints && detailedStation.chargingPoints.length > 0) {

                        const existingPosts = detailedStation.chargingPoints.map((point: ChargingPoint) => ({

                            id: `post-${point.chargingPointId}`,

                            chargingPointName: point.chargingPointName || "",

                            connectorType: point.typeName || point.connectorType?.typeName || "Unknown",

                            power: point.powerOutput?.toString() || "0",

                            price: point.pricePerKwh?.toString() || "0",

                            status: point.status

                        }));



                        setChargingPosts(existingPosts);

                    } else {

                        setChargingPosts([]);

                    }

                } else {

                    // If detailed fetch fails, keep original station data

                    setChargingPosts([]);

                }

            } catch (error) {

                console.error("Error fetching detailed station information:", error);

                setChargingPosts([]);

            }



            // Load port types for connector selection

            try {

                const types = await fetchConnectorTypes();

                if (types) {

                    setNewPortTypes(types);

                }

            } catch (err) {

                console.error("Error loading connector types:", err);

            }



            // Reset address field state

            setAddressSearchInput("");

            setIsAddressFieldTouched(false);

            setShowAddressSearchResults(false);

            setIsEditDialogOpen(true);

        }

    };



    const confirmDeleteStation = () => {

        if (selectedStation) {

            console.log("Confirming deletion for station:", selectedStation.id);

            handleDeletingStation({ preventDefault: () => { } } as React.FormEvent, selectedStation.id);

        }

    };





    const refreshStations = async () => {

        try {

            toast.info("Đang cập nhật dữ liệu...");

            await handleGetStationList();

            toast.success("Đã cập nhật dữ liệu trạm sạc");

        } catch (err) {

            console.error("Error refreshing stations:", err);

            toast.error(t('error_loading_data'));

        }

    };



    const handleStationClick = async (station: ChargingStation) => {

        // First set the basic station info for immediate UI response

        setSelectedStation(station);

        setSelectedStationPopup(station);



        // Then fetch complete station details using the new method

        try {

            const detailedStation = await fetchChargingPointsByStationId(station.id);

            if (detailedStation) {

                // Update the selected station with complete details

                setSelectedStation(detailedStation);

                setSelectedStationPopup(detailedStation);



                // Also update the station in the stations list

                setStations(prev => prev.map(s =>

                    s.id === station.id ? detailedStation : s

                ));



                console.log("Station details updated with complete information:", detailedStation);

            }

        } catch (error) {

            console.error("Error fetching detailed station information:", error);

            // Keep the original station data if fetching fails

        }

    };



    const handleViewAllChargingPoints = async (station: ChargingStation) => {

        setSelectedStationForAllPoints(station);



        // Use the already loaded charging points from the station data (no API call needed)

        if (station.chargingPoints && station.chargingPoints.length > 0) {

            setAllChargingPoints(station.chargingPoints);

            setIsAllChargingPointsDialogOpen(true);

            return;

        }



        // Fallback: If no charging points in station data, try to fetch them

        try {

            const detailedStation = await fetchChargingPointsByStationId(station.id);

            if (detailedStation && detailedStation.chargingPoints) {

                setAllChargingPoints(detailedStation.chargingPoints);

                setIsAllChargingPointsDialogOpen(true);

                return;

            }



            // Final fallback to original method

            const points = await fetchChargingPoints();

            if (!points) {

                setAllChargingPoints([]);

                setIsAllChargingPointsDialogOpen(true);

                return;

            }



            const stationIdNum = Number(station.id);



            // Lọc trụ thuộc đúng station

            const stationPointsFromAll = points.filter((p: any) => {

                const sid = p.stationId ?? p.station?.stationId ?? p.station_id;

                return Number(sid) === stationIdNum;

            });



            // Ưu tiên dùng station.chargingPoints nếu có id hợp lệ, ngược lại dùng danh sách đã lọc

            const sourcePoints: any[] =

                Array.isArray(station.chargingPoints) &&

                station.chargingPoints.some((p: any) => p?.chargingPointId ?? p?.id)

                    ? station.chargingPoints

                    : stationPointsFromAll;



            if (sourcePoints.length === 0) {

                console.log("No charging points found for this station");

                setAllChargingPoints([]);

                setIsAllChargingPointsDialogOpen(true);

                return;

            }



            // Các hàm tiện ích NỘI BỘ (đều khai báo trong chính hàm này):

            const getConnectorTypeId = (p: any): number | undefined => {

                return (

                    p.connectorTypeId ??

                    p.connector_type_id ??

                    p.connectorType?.connectorTypeId ??

                    p.station?.chargingPoint?.[0]?.connectorType?.connectorTypeId

                );

            };



            const extractConnectorDetail = (p: any) => {

                // 1) Ưu tiên lấy từ connectorType trực tiếp trên point (theo cấu trúc API mới)

                if (p.connectorType && (p.connectorType.typeName || p.connectorType.powerOutput)) {

                    console.log("Using direct connectorType:", p.connectorType);

                    return p.connectorType;

                }

                // 2) Fallback: Tìm trong station.chargingPoint khớp chargingPointId

                const cpId = p.chargingPointId ?? p.id;

                const nest = p.station?.chargingPoint;

                if (Array.isArray(nest)) {

                    const found = nest.find((x: any) => (x.chargingPointId ?? x.id) === cpId);

                    if (found?.connectorType) {

                        console.log("Using nested connectorType:", found.connectorType);

                        return found.connectorType;

                    }

                }

                return undefined;

            };



            const pickPrice = (obj: any): number | null => {

                if (!obj) return null;

                if (typeof obj.pricePerKWh === "number") return obj.pricePerKWh; // dạng chuẩn trong mẫu JSON

                if (typeof obj.pricePerKwh === "number") return obj.pricePerKwh; // một số API trả khác hoa/thường

                return null;

            };



            const pickStatus = (p: any): string => {

                if (p.status) return p.status; // ưu tiên ngay trên point

                const cpId = p.chargingPointId ?? p.id;

                const found = p.station?.chargingPoint?.find((x: any) => (x.chargingPointId ?? x.id) === cpId);

                if (found?.status) return found.status;

                return "UNKNOWN";

            };



            // Cache fetch connectorType theo id để tránh gọi trùng

            const connectorTypeCache = new Map<number, any>();

            const uniqueConnectorTypeIds = Array.from(

                new Set(

                    sourcePoints

                        .map(getConnectorTypeId)

                        .filter((id): id is number => typeof id === "number")

                )

            );



            await Promise.all(

                uniqueConnectorTypeIds.map(async (id) => {

                    if (connectorTypeCache.has(id)) return;

                    try {

                        const det = await fetchConnectorTypeById(id);

                        if (det) connectorTypeCache.set(id, det);

                    } catch (e) {

                        console.warn("fetchConnectorTypeById failed for id=", id, e);

                    }

                })

            );



            // Chuẩn hoá từng trụ: lấy đúng powerOutput, pricePerKWh/pricePerKwh và status

            const enriched = await Promise.all(

                sourcePoints.map(async (p: any) => {

                    const chargingPointId = p.chargingPointId ?? p.id;

                    const status = pickStatus(p);



                    const inlineConn = extractConnectorDetail(p);

                    const connectorTypeId =

                        getConnectorTypeId(p) ??

                        inlineConn?.connectorTypeId ??

                        inlineConn?.id;



                    const fetchedConn =

                        typeof connectorTypeId === "number"

                            ? connectorTypeCache.get(connectorTypeId)

                            : undefined;



                    const typeName =

                        p.typeName ??

                        inlineConn?.typeName ??

                        fetchedConn?.typeName ??

                        "N/A";



                    // Ưu tiên lấy từ connectorType trước, sau đó mới đến point level

                    const powerOutput =

                        (typeof inlineConn?.powerOutput === "number" ? inlineConn.powerOutput : null) ??

                        (typeof fetchedConn?.powerOutput === "number" ? fetchedConn.powerOutput : null) ??

                        (typeof p.powerOutput === "number" && p.powerOutput > 0 ? p.powerOutput : null) ??

                        null;



                    const pricePerKwh =

                        pickPrice(inlineConn) ??

                        pickPrice(fetchedConn) ??

                        (typeof p.pricePerKwh === "number" ? p.pricePerKwh : null) ??

                        null;



                    return {

                        ...p,

                        chargingPointId,

                        connectorTypeId,

                        typeName,

                        powerOutput,

                        pricePerKwh,

                        status,

                    };

                })

            );



            // Sắp xếp cho dễ đọc

            enriched.sort((a, b) => (Number(a.chargingPointId) || 0) - (Number(b.chargingPointId) || 0));



            console.log("Enriched station points:", enriched);

            setAllChargingPoints(enriched);

            setIsAllChargingPointsDialogOpen(true);

        } catch (err) {

            console.error("Error fetching charging points:", err);

            toast.error(t('error_loading_data'));

        }

    };







    const updateStationMarker = (station: ChargingStation) => {

        const map = __mapRef.current;

        if (!map || !map.loaded()) {

            console.log("Map not loaded, cannot update marker");

            return;

        }



        console.log("Updating marker for station:", station.id, "with coordinates:", station.longitude, station.latitude);



        try {

            // Find existing marker for this station

            const existingMarker = markerMapRef.current.get(station.id);

            console.log("Found existing marker:", !!existingMarker);



            if (existingMarker) {

                // Update existing marker position

                existingMarker.setLngLat([station.longitude, station.latitude]);

                console.log(`Updated marker position for station ${station.id} to [${station.longitude}, ${station.latitude}]`);

            } else {

                // Create new marker if it doesn't exist

                const el = document.createElement("div");

                el.className = "relative";

                el.innerHTML = `

                    <div class="w-10 h-10 rounded-full border-4 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform" style="background-color: ${getStatusColor(station.status)};">

                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">

                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>

                        </svg>

                    </div>

                `;



                const marker = new maptilersdk.Marker({ element: el, anchor: "bottom" })

                    .setLngLat([station.longitude, station.latitude])

                    .addTo(map);



                markersRef.current.push(marker);

                markerMapRef.current.set(station.id, marker);

                console.log(`Created new marker for station ${station.id} at [${station.longitude}, ${station.latitude}]`);

            }

        } catch (err) {

            console.error("Error updating station marker:", err);

        }

    };



    const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {

        try {

            const response = await fetch(

                `https://api.maptiler.com/geocoding/${address}.json?key=${MAPTILER_API_KEY}`

            );

            const data = await response.json();



            if (data.features && data.features.length > 0) {

                const [lng, lat] = data.features[0].geometry.coordinates;

                return { lat, lng };

            }

            return null;

        } catch (err) {

            console.error("Error geocoding address:", err);

            return null;

        }

    };



    // ========= Map setup =========



    const __mapRef = useRef<maptilersdk.Map | null>(null);

    const mapContainerRef = useRef<HTMLDivElement | null>(null);

    const markersRef = useRef<maptilersdk.Marker[]>([]);

    const poiMarkersRef = useRef<maptilersdk.Marker[]>([]);

    const defaultCenterLngLat: [number, number] = useMemo(() => [106.7009, 10.7769], []);





    const handleChargerActivate = async (stationId: string) => {

        const success = await updateStationStatus(stationId, "ACTIVE");

        if (success) {

            setStations((prev) =>

                prev.map((station) => (station.id === stationId ? {

                    ...station,

                    status: "ACTIVE" as StationStatus

                } : station))

            );



            const station = stations.find((s) => s.id === stationId);

            if (station) {

                setSelectedStation({ ...station, status: "ACTIVE" });

            }

        }

    };



    const handleChargerDeactivate = async (stationId: string) => {
        // Check if station has any charging points that are OCCUPIED or RESERVED
        const station = stations.find((s) => s.id === stationId);

        if (station && station.chargingPoints && station.chargingPoints.length > 0) {
            const busyPoints = station.chargingPoints.filter(
                point => point.status === 'OCCUPIED' || point.status === 'RESERVED'
            );

            if (busyPoints.length > 0) {
                const busyPointIds = busyPoints.map(p => `#${p.chargingPointId}`).join(', ');
                const statusList = busyPoints.map(p =>
                    p.status === 'OCCUPIED' ? t('occupied') : t('reserved')
                ).join(', ');

                toast.error(
                    t('cannot_deactivate_station'),
                    {
                        description: `${t('station_has_busy_points')}: ${busyPointIds} (${statusList}). ${t('cannot_delete_or_modify')}`
                    }
                );
                return;
            }
        }

        const success = await updateStationStatus(stationId, "INACTIVE");

        if (success) {

            setStations((prev) =>

                prev.map((station) =>

                    station.id === stationId

                        ? { ...station, status: "INACTIVE" as StationStatus, availablePoints: station.totalPoints }

                        : station

                )

            );



            if (station) {

                setSelectedStation({ ...station, status: "INACTIVE", availablePoints: station.totalPoints });

            }

        }

    };



    const handleChargerRestart = (stationId: string) => {

        const station = stations.find((s) => s.id === stationId);

        // Check if station has any charging points that are OCCUPIED
        if (station && station.chargingPoints && station.chargingPoints.length > 0) {
            const occupiedPoints = station.chargingPoints.filter(
                point => point.status === 'OCCUPIED'
            );

            if (occupiedPoints.length > 0) {
                const occupiedPointIds = occupiedPoints.map(p => `#${p.chargingPointId}`).join(', ');

                toast.error(
                    t('cannot_restart_station'),
                    {
                        description: `${t('station_has_occupied_points')}: ${occupiedPointIds}. ${t('cannot_restart_while_in_use')}`
                    }
                );
                return;
            }
        }

        if (station) {

            setStations((prev) => prev.map((s) => (s.id === stationId ? {

                ...s,

                status: "MAINTENANCE" as StationStatus

            } : s)));

            setSelectedStation({ ...station, status: "MAINTENANCE" });



            toast.info(t('restarting_station'), {

                description: `${t('restarting')} ${station.name}...`,

            });



            setTimeout(() => {

                setStations((prev) => prev.map((s) => (s.id === stationId ? {

                    ...s,

                    status: "ACTIVE" as StationStatus

                } : s)));

                setSelectedStation({ ...station, status: "ACTIVE" });



                toast.success(t('restart_complete'), {

                    description: `${station.name} ${t('back_to_normal')}`,

                });

            }, 3000);

        }

    };



    useEffect(() => {

        if (!mapContainerRef.current || __mapRef.current) return;



        try {

            // Check for API key

            const apiKey = MAPTILER_API_KEY;

            if (!apiKey) {

                console.warn("MAPTILER_API_KEY not configured, using basic map fallback");



                // Use OpenStreetMap as fallback

                const map = new maptilersdk.Map({

                    container: mapContainerRef.current,

                    style: {

                        version: 8,

                        sources: {

                            'osm': {

                                type: 'raster',

                                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],

                                tileSize: 256,

                                attribution: '© OpenStreetMap contributors'

                            }

                        },

                        layers: [{

                            id: 'osm',

                            type: 'raster',

                            source: 'osm'

                        }]

                    },

                    center: defaultCenterLngLat,

                    zoom: mapZoom,

                    hash: false,

                });



                __mapRef.current = map;



                // Add basic event handlers

                map.on('load', () => {

                    console.log("Admin map loaded with fallback style");

                });



                return;

            }



            // Use configured API key

            const customStyleUrl = `https://api.maptiler.com/maps/019983ed-809a-7bba-8d9b-f5f42a71219e/style.json?key=${apiKey}`;

            const map = new maptilersdk.Map({

                container: mapContainerRef.current,

                style: customStyleUrl,

                center: defaultCenterLngLat,

                zoom: mapZoom,

                hash: false,

            });



            __mapRef.current = map;



            // Map đã load - không cần thêm GeocodingControl nữa

            map.on('load', () => {

                console.log("Map đã load thành công");

            });





            map.on("moveend", () => {

                const z = Math.max(1, Math.min(22, map.getZoom()));

                setMapZoom(Number(z.toFixed(0)));

                const c = map.getCenter();

                setMapCenter({ lat: c.lat, lng: c.lng });



                // Không cập nhật POI markers nữa - đã tắt hoàn toàn

                // Chỉ xóa POI markers nếu có

                if (poiMarkersRef.current.length > 0) {

                    poiMarkersRef.current.forEach(m => m.remove());

                    poiMarkersRef.current = [];

                }

            });





            return () => {

                try {

                    markersRef.current.forEach((m) => m.remove());

                    poiMarkersRef.current.forEach((m) => m.remove());

                    if (tempMarker) {

                        tempMarker.remove();

                    }

                    markerMapRef.current.clear();

                    map.remove();

                    __mapRef.current = null;

                } catch (err) {

                    console.error("Error cleaning up map:", err);

                }

            };



        } catch (e) {

            console.error("Map init error:", e);

            toast.error("Không thể khởi tạo bản đồ");

        }

    }, []);



    useEffect(() => {

        const map = __mapRef.current;

        if (!map || !map.loaded()) return;



        try {

            // Clear existing markers

            markersRef.current.forEach((m) => m.remove());

            markersRef.current = [];

            markerMapRef.current.clear();



            filteredStations.forEach((station) => {

                const el = document.createElement("div");

                el.className = "relative";

                el.innerHTML = `

        <div class="w-10 h-10 rounded-full border-4 border-white shadow-lg flex items-center justify-center" style="background-color:${getStatusColor(

                    station.status

                )}">

          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">

            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>

          </svg>

        </div>

        <div class="absolute top-10 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm border border-border/50 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap shadow-lg">

          ${(station.name.split(" - ")[1] || station.name).replace(/</g, "&lt;")}

        </div>

      `;

                el.style.cursor = "pointer";

                el.addEventListener("click", () => handleStationClick(station));



                const marker = new maptilersdk.Marker({ element: el, anchor: "bottom" })

                    .setLngLat([station.longitude, station.latitude])

                    .addTo(map);



                markersRef.current.push(marker);

                markerMapRef.current.set(station.id, marker);

            });

        } catch (err) {

            console.error("Error updating markers:", err);

            toast.error(t('error_loading_data'));

        }

    }, [filteredStations]);



    useEffect(() => {

        if (!selectedStation || !__mapRef.current) return;

        try {

            __mapRef.current.easeTo({

                center: [selectedStation.longitude, selectedStation.latitude],

                zoom: Math.max(mapZoom, 14),

                duration: 600,

            });

        } catch (err) {

            console.error("Error centering map:", err);

        }

    }, [selectedStation]);



    // ========= Render =========



    return (

        <>

            <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30">

                {/* Enhanced Header */}

                <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border shadow-sm">

                    <div className="container mx-auto px-4 py-4">

                        <div className="flex items-center justify-between">

                            <div className="flex items-center space-x-4">

                                <Button

                                    variant="ghost"

                                    onClick={onBack}

                                    className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"

                                >

                                    <ArrowLeft className="w-4 h-4" />

                                    <span>{backToDashboardLabel}</span>

                                </Button>

                                <div>

                                    <h1 className="text-3xl font-semibold bg-gradient-to-r from-primary to-secondary-foreground bg-clip-text text-transparent">

                                        {t('charging_station_map_management')}

                                    </h1>

                                    <p className="text-muted-foreground mt-2">

                                        {t('monitor_manage_stations')}

                                    </p>

                                </div>

                            </div>



                            <div className="flex items-center space-x-2">

                                <Button variant="outline" onClick={refreshStations} className="flex items-center space-x-2">

                                    <RefreshCw className="w-4 h-4" />

                                    <span className="hidden sm:inline">{t('refresh')}</span>

                                </Button>









                                <Dialog

                                    open={isAddDialogOpen}

                                    onOpenChange={(open: boolean) => {

                                        setIsAddDialogOpen(open);

                                        if (open) {

                                            // Load connector types when opening dialog

                                            handleGetConnectorList();

                                        } else {

                                            // Clear form and markers when dialog closes

                                            setStationName("");

                                            setAddress("");

                                            setStatus("INACTIVE");

                                            setLatitude(null);

                                            setLongitude(null);

                                            setChargingPosts([]);

                                            setError(null);

                                            try {

                                            } catch (err) {

                                                console.error("Error clearing click markers:", err);

                                            }

                                        }

                                    }}

                                >

                                    <DialogTrigger asChild>



                                    </DialogTrigger>

                                    <DialogContent className="max-w-4xl max-h-[85vh] bg-card/95 backdrop-blur-xl border-border/50">

                                        <DialogHeader className="pb-4 px-1">

                                            <DialogTitle className="text-foreground">{t('add_station')}</DialogTitle>

                                            <DialogDescription className="text-muted-foreground">{t('add_station_description')}</DialogDescription>

                                        </DialogHeader>



                                        <form onSubmit={handleAddingStation} className="space-y-5">

                                            <div className="space-y-4 max-h-[calc(85vh-180px)] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent">

                                                {error &&

                                                    <div className="text-red-600 text-sm p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">{error}</div>}

                                                <div>

                                                    <Label htmlFor="name">{t('station_name')}</Label>

                                                    <Input

                                                        id="name"

                                                        placeholder="ChargeHub Premium - Q1"

                                                        value={stationName}

                                                        onChange={(e) => setStationName(e.target.value)}

                                                        disabled={loading}

                                                    />

                                                </div>



                                                <div>

                                                    <Label htmlFor="address">{t('station_address')}</Label>

                                                    <Textarea

                                                        id="address"

                                                        placeholder="123 Nguyễn Huệ, Quận 1, TP.HCM"

                                                        value={address}

                                                        onChange={(e) => {

                                                            console.log("Address input changed:", e.target.value);

                                                            setAddress(e.target.value);

                                                        }}

                                                        disabled={loading}

                                                    />

                                                </div>



                                                <div>

                                                    <Label htmlFor="status">{t('status')}</Label>

                                                    <Select value={status} onValueChange={(v: string) => setStatus(v as StationStatus)}

                                                            disabled={loading}>

                                                        <SelectTrigger id="status">

                                                            <SelectValue placeholder={t('select_status')} />

                                                        </SelectTrigger>

                                                        <SelectContent>

                                                            <SelectItem value="ACTIVE">ACTIVE</SelectItem>

                                                            <SelectItem value="INACTIVE">INACTIVE</SelectItem>

                                                            <SelectItem value="MAINTENANCE">MAINTENANCE</SelectItem>

                                                        </SelectContent>

                                                    </Select>

                                                </div>



                                                <div className="grid grid-cols-2 gap-4">

                                                    <div>

                                                        <Label htmlFor="latitude">{t('latitude')}</Label>

                                                        <Input

                                                            id="latitude"

                                                            type="number"

                                                            step="any"

                                                            placeholder="10.7769"

                                                            value={latitude ?? ""}

                                                            onChange={(e) => {

                                                                const val = e.target.value;

                                                                setLatitude(val === "" ? null : parseFloat(val));

                                                            }}

                                                            disabled={true}

                                                            className="bg-gray-100 cursor-not-allowed"

                                                        />

                                                    </div>

                                                    <div>

                                                        <Label htmlFor="longitude">{t('longitude')}</Label>

                                                        <Input

                                                            id="longitude"

                                                            type="number"

                                                            step="any"

                                                            placeholder="106.7009"

                                                            value={longitude ?? ""}

                                                            onChange={(e) => {

                                                                const val = e.target.value;

                                                                setLongitude(val === "" ? null : parseFloat(val));

                                                            }}

                                                            disabled={true}

                                                            className="bg-gray-100 cursor-not-allowed"

                                                        />

                                                    </div>

                                                </div>



                                                {/* Charging Posts Management */}

                                                <div className="space-y-3 border-t border-border/30 pt-4">

                                                    <div className="flex items-center justify-between px-1">

                                                        <Label className="text-foreground font-medium">{t('charging_points')} ({chargingPosts.length})</Label>

                                                        <Button

                                                            type="button"

                                                            onClick={addChargingPost}

                                                            className="h-8 w-8 p-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-sm"

                                                        >

                                                            <Plus className="w-4 h-4" />

                                                        </Button>

                                                    </div>



                                                    {chargingPosts.length === 0 && (

                                                        <div className="text-center py-8 px-4 bg-muted/30 border border-border/30 rounded-xl">

                                                            <Plug className="w-10 h-10 mx-auto mb-3 opacity-40 text-muted-foreground" />

                                                            <p className="text-sm text-muted-foreground font-medium">Chưa có trụ sạc nào</p>

                                                            <p className="text-xs text-muted-foreground mt-1">Nhấn nút + để thêm trụ sạc</p>

                                                        </div>

                                                    )}



                                                    {chargingPosts.length > 0 && (

                                                        <div className="max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent">

                                                            <div className="space-y-3">

                                                                {chargingPosts.map((post, index) => (

                                                                    <div key={post.id} className="p-3 border border-border/40 rounded-xl bg-muted/50 shadow-sm">

                                                                        <div className="flex items-center justify-between mb-3">

                                                                            <h4 className="text-sm font-medium text-foreground">#{index + 1}</h4>

                                                                            <Button

                                                                                type="button"

                                                                                onClick={() => removeChargingPost(post.id)}

                                                                                className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-md"

                                                                            >

                                                                                <XCircle className="w-3.5 h-3.5" />

                                                                            </Button>

                                                                        </div>



                                                                        <div className="space-y-3">

                                                                            <div>

                                                                                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">{t('charging_point_name')}</label>

                                                                                <Input

                                                                                    value={post.chargingPointName}

                                                                                    onChange={(e) => updateChargingPost(post.id, 'chargingPointName', e.target.value)}

                                                                                    placeholder={t('charging_point_name_placeholder')}

                                                                                    className="w-full h-9 text-sm bg-background border border-border/50 rounded-lg px-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"

                                                                                />

                                                                            </div>

                                                                            <div>

                                                                                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">{t('charging_point_name')}</label>

                                                                                <Input

                                                                                    value={post.chargingPointName}

                                                                                    onChange={(e) => updateChargingPost(post.id, 'chargingPointName', e.target.value)}

                                                                                    placeholder={t('charging_point_name_placeholder')}

                                                                                    className="w-full h-9 text-sm bg-background border border-border/50 rounded-lg px-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"

                                                                                />

                                                                            </div>

                                                                            <div>

                                                                                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">{t('connector_type')}</label>

                                                                                <select

                                                                                    value={post.connectorType}

                                                                                    onChange={(e) => {

                                                                                        const selectedType = portTypes.find(type => type.name === e.target.value);

                                                                                        updateChargingPost(post.id, 'connectorType', e.target.value);

                                                                                        if (selectedType) {

                                                                                            updateChargingPost(post.id, 'power', selectedType.power);

                                                                                            updateChargingPost(post.id, 'price', selectedType.price);

                                                                                        }

                                                                                    }}

                                                                                    className="w-full h-9 text-sm bg-background border border-border/50 rounded-lg px-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"

                                                                                    aria-label="Connector type"

                                                                                >

                                                                                    <option value="">{t('select_connector_type')}</option>

                                                                                    {portTypes.map((type, idx) => (

                                                                                        <option key={idx} value={type.name}>

                                                                                            {type.name} ({type.power} kWh - ₫{type.price}/kWh)

                                                                                        </option>

                                                                                    ))}

                                                                                </select>

                                                                            </div>



                                                                            <div>

                                                                                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">{t('status')}</label>

                                                                                <select

                                                                                    value={post.status}

                                                                                    onChange={(e) => updateChargingPost(post.id, 'status', e.target.value)}

                                                                                    className="w-full h-9 text-sm bg-background border border-border/50 rounded-lg px-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"

                                                                                    aria-label="Charging post status"

                                                                                >

                                                                                    <option value="AVAILABLE">🟢 {t('available')}</option>

                                                                                    <option value="OCCUPIED">🔴 {t('occupied')}</option>

                                                                                    <option value="RESERVED">🟠 {t('reserved')}</option>

                                                                                    <option value="OUT_OF_SERVICE">⚫ {t('out_of_service')}</option>

                                                                                    <option value="MAINTENANCE">🔧 {t('maintenance')}</option>

                                                                                </select>

                                                                            </div>

                                                                        </div>

                                                                    </div>

                                                                ))}

                                                            </div>

                                                        </div>

                                                    )}

                                                </div>

                                            </div>



                                            <div className="pt-4 border-t border-border/30 px-1">

                                                <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">

                                                    {loading ? t('loading') : t('add_station')}

                                                </Button>

                                            </div>

                                        </form>

                                    </DialogContent>

                                </Dialog>

                            </div>

                        </div>

                    </div>

                </div>



                {/* Main Content */}

                <div className="container mx-auto px-4 py-6">

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        <div className="lg:col-span-2">

                            <Card className="bg-card/80 backdrop-blur-xl border border-border overflow-hidden">

                                <CardHeader className="pb-4">

                                    <div className="flex items-center">

                                        <div className="flex items-center space-x-2 w-full">

                                            {/* Thanh tìm kiếm tùy chỉnh với UI đẹp */}

                                            <div className="relative group flex-1">

                                                <div className="relative">

                                                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />

                                                    <Input

                                                        placeholder={t('search_locations')}

                                                        value={searchInput}

                                                        onChange={handleSearchInputChange}

                                                        className="pl-10 pr-10 w-full h-10 bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 shadow-sm hover:shadow-md"

                                                        onFocus={() => setShowSearchResults(true)}

                                                    />

                                                    {searchInput && (

                                                        <button

                                                            onClick={() => {

                                                                setSearchInput("");

                                                                setShowSearchResults(false);

                                                                setSearchResults([]);

                                                            }}

                                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"

                                                            aria-label="Clear search"

                                                        >

                                                            <XCircle className="w-4 h-4" />

                                                        </button>

                                                    )}

                                                </div>



                                                {/* Dropdown kết quả tìm kiếm với animation */}

                                                {showSearchResults && (

                                                    <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-xl z-50 max-h-96 overflow-hidden animate-in slide-in-from-top-2 duration-200">

                                                        {searchResults.length > 0 ? (

                                                            <>

                                                                {/* Header */}

                                                                <div className="bg-card/90 backdrop-blur-sm px-4 py-3 border-b border-border/30">

                                                                    <div className="flex items-center space-x-3">

                                                                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">

                                                                            <MapPin className="w-4 h-4 text-primary" />

                                                                        </div>

                                                                        <div>

                                                                            <span className="text-sm font-medium text-foreground">

                                                                                {searchResults.length} {t('search_results_found')}

                                                                            </span>

                                                                            <div className="text-xs text-muted-foreground mt-0.5">

                                                                                {t('select_to_view_on_map')}

                                                                            </div>

                                                                        </div>

                                                                    </div>

                                                                </div>



                                                                {/* Results list với scroll */}

                                                                <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent">

                                                                    {searchResults.map((poi, index) => (

                                                                        <div

                                                                            key={poi.id}

                                                                            className="group/item px-4 py-3 hover:bg-accent/5 cursor-pointer border-b border-border/20 last:border-b-0 transition-all duration-150"

                                                                            onClick={() => handleSelectPOI(poi)}

                                                                        >

                                                                            <div className="flex items-start gap-3">

                                                                                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover/item:bg-primary/20 transition-colors">

                                                                                    <MapPin className="w-4 h-4 text-primary" />

                                                                                </div>

                                                                                <div className="flex-1 min-w-0">

                                                                                    <div className="font-medium text-sm text-foreground group-hover/item:text-primary transition-colors line-clamp-1 mb-1.5">

                                                                                        {poi.name}

                                                                                    </div>

                                                                                    <div className="text-xs text-muted-foreground mb-2 line-clamp-1">

                                                                                        {poi.address}

                                                                                    </div>

                                                                                    <div className="flex items-center gap-2 flex-wrap">

                                                                                        <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-mono text-muted-foreground bg-muted/50 border border-border/30">

                                                                                            <MapPin className="w-3 h-3 mr-1 text-muted-foreground/70" />

                                                                                            {poi.latitude.toFixed(4)}, {poi.longitude.toFixed(4)}

                                                                                        </div>

                                                                                        <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">

                                                                                            <div className="w-1.5 h-1.5 bg-primary rounded-full mr-1.5"></div>

                                                                                            POI

                                                                                        </div>

                                                                                    </div>

                                                                                </div>

                                                                                <div className="flex-shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-150">

                                                                                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">

                                                                                        <ArrowLeft className="w-3.5 h-3.5 text-primary-foreground rotate-180" />

                                                                                    </div>

                                                                                </div>

                                                                            </div>

                                                                        </div>

                                                                    ))}

                                                                </div>

                                                            </>

                                                        ) : searchInput.trim() ? (

                                                            <div className="p-8 text-center">

                                                                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">

                                                                    <Search className="w-6 h-6 text-muted-foreground" />

                                                                </div>

                                                                <div className="text-sm font-medium text-foreground mb-1">

                                                                    Không tìm thấy địa điểm nào

                                                                </div>

                                                                <div className="text-xs text-muted-foreground">

                                                                    Thử tìm kiếm với từ khóa khác

                                                                </div>

                                                            </div>

                                                        ) : null}

                                                    </div>

                                                )}

                                            </div>

                                        </div>

                                    </div>

                                </CardHeader>



                                <CardContent className="p-0 h-[520px] relative">

                                    <div ref={mapContainerRef} className="absolute inset-0 w-full h-full rounded-b-lg z-20" />

                                    {/* Background gradient removed - using consistent dark theme */}



                                    {/* Thêm CSS cho search control */}

                                    <style dangerouslySetInnerHTML={{

                                        __html: `

                                        .custom-search-control {

                                            position: absolute !important;

                                            top: 10px !important;

                                            left: 10px !important;

                                            z-index: 1000 !important;

                                            background: white !important;

                                            border-radius: 8px !important;

                                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;

                                            padding: 12px !important;

                                            min-width: 300px !important;

                                            border: 1px solid #e5e7eb !important;

                                        }

                                        
                                        
                                        .custom-search-control input {

                                            width: 100% !important;

                                            padding: 10px 12px !important;

                                            border: 1px solid #d1d5db !important;

                                            border-radius: 6px !important;

                                            font-size: 14px !important;

                                            outline: none !important;

                                            background: white !important;

                                            transition: border-color 0.2s !important;

                                        }

                                        
                                        
                                        .custom-search-control input:focus {

                                            border-color: #3b82f6 !important;

                                            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;

                                        }

                                        
                                        
                                        .search-results {

                                            position: absolute !important;

                                            top: 100% !important;

                                            left: 0 !important;

                                            right: 0 !important;

                                            background: white !important;

                                            border: 1px solid #d1d5db !important;

                                            border-top: none !important;

                                            border-radius: 0 0 6px 6px !important;

                                            max-height: 250px !important;

                                            overflow-y: auto !important;

                                            display: none !important;

                                            z-index: 1001 !important;

                                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;

                                        }

                                        
                                        
                                        .search-result-item:hover {

                                            background-color: #f9fafb !important;

                                        }

                                        
                                        
                                        /* Đảm bảo GeocodingControl hiển thị */

                                        .maplibregl-ctrl-geocoder {

                                            display: block !important;

                                            visibility: visible !important;

                                            opacity: 1 !important;

                                            z-index: 1000 !important;

                                        }

                                        
                                        
                                        .maplibregl-ctrl-geocoder input {

                                            width: 300px !important;

                                            padding: 8px 12px !important;

                                            border-radius: 6px !important;

                                            border: 1px solid #d1d5db !important;

                                            font-size: 14px !important;

                                            background: white !important;

                                            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;

                                        }

                                        `

                                    }} />



                                    {selectedStationPopup && (

                                        <div

                                            className="absolute top-4 left-4 z-30 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl p-5 shadow-xl max-w-xs pointer-events-auto">

                                            <div className="flex items-start justify-between gap-3 mb-4">

                                                <h4 className="font-medium text-sm text-foreground pr-2">{selectedStationPopup.name}</h4>

                                                <Button

                                                    size="sm"

                                                    variant="ghost"

                                                    onClick={() => setSelectedStationPopup(null)}

                                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground flex-shrink-0"

                                                >

                                                    <XCircle className="w-4 h-4" />

                                                </Button>

                                            </div>

                                            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{selectedStationPopup.address}</p>

                                            <div className="flex items-center justify-between gap-4 mb-4">

                                                {getStatusBadge(selectedStationPopup.status)}

                                                <span className="text-xs text-muted-foreground whitespace-nowrap">

                                                    {selectedStationPopup.availablePoints}/{selectedStationPopup.totalPoints} {t('charging_points')}

                                                </span>

                                            </div>

                                            <div className="space-y-2.5">

                                                {(selectedStationPopup.connectorTypes ?? []).map((connector, idx) => (

                                                    <div key={idx} className="bg-muted/50 border border-border/30 rounded-lg p-3">

                                                        <div className="flex justify-between items-center text-xs mb-2.5">

                                                            <span className="font-medium text-foreground">

                                                                {connector.typeName || connector.type}

                                                            </span>

                                                            <Badge variant="outline" className="text-xs h-5 px-2 border-border/50 text-muted-foreground">

                                                                {connector.powerOutput || connector.power} kW

                                                            </Badge>

                                                        </div>

                                                        <div className="flex justify-between text-xs mb-1.5">

                                                            <span className="text-muted-foreground">{t('available')}:</span>

                                                            <span

                                                                className={connector.available > 0 ? "text-green-500 font-medium" : "text-red-500 font-medium"}>

                                                                {connector.available}/{connector.total}

                                                            </span>

                                                        </div>

                                                        {connector.pricePerKwh && (

                                                            <div className="flex justify-between text-xs">

                                                                <span className="text-muted-foreground">{t('price_per_kwh')}:</span>

                                                                <span className="text-amber-500 font-medium">

                                                                    {connector.pricePerKwh.toLocaleString()} VND/kWh

                                                                </span>

                                                            </div>

                                                        )}

                                                    </div>

                                                ))}

                                            </div>

                                        </div>

                                    )}



                                    {/* Popup cho POI được chọn */}

                                    {selectedPOI && (

                                        <div className="absolute top-4 right-4 z-30 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl p-4 shadow-xl max-w-sm pointer-events-auto">

                                            <div className="flex items-start justify-between mb-3">

                                                <div className="flex items-center space-x-2">

                                                    <MapPin className="w-5 h-5 text-primary" />

                                                    <h4 className="font-medium text-foreground text-sm">{selectedPOI.name}</h4>

                                                </div>

                                                <Button

                                                    size="sm"

                                                    variant="ghost"

                                                    onClick={() => {

                                                        setSelectedPOI(null);

                                                        if (tempMarker) {

                                                            tempMarker.remove();

                                                            setTempMarker(null);

                                                        }

                                                    }}

                                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"

                                                >

                                                    <XCircle className="w-4 h-4" />

                                                </Button>

                                            </div>



                                            <div className="mb-3">

                                                <div className="text-xs text-muted-foreground mb-1.5">{t('station_address')}:</div>

                                                <div className="text-xs text-foreground bg-muted/50 border border-border/30 px-2.5 py-1.5 rounded-md mb-2.5">

                                                    {selectedPOI.address}

                                                </div>

                                                <div className="text-xs text-muted-foreground mb-1.5">{t('coordinates')}:</div>

                                                <div className="text-xs font-mono text-foreground bg-muted/50 border border-border/30 px-2.5 py-1.5 rounded-md">

                                                    {selectedPOI.latitude.toFixed(4)}, {selectedPOI.longitude.toFixed(4)}

                                                </div>

                                            </div>



                                            {/* Kiểm tra xem đã có trạm sạc ở vị trí này chưa */}

                                            {(() => {

                                                const nearbyStation = stations.find(station => {

                                                    const distance = Math.sqrt(

                                                        Math.pow(station.latitude - selectedPOI.latitude, 2) +

                                                        Math.pow(station.longitude - selectedPOI.longitude, 2)

                                                    );

                                                    return distance < 0.001; // Khoảng 100m

                                                });



                                                if (nearbyStation) {

                                                    return (

                                                        <div className="space-y-2">

                                                            <div className="flex items-center gap-1.5 text-xs text-green-500 font-medium">

                                                                <CheckCircle className="w-3.5 h-3.5" />

                                                                {t('nearby_station_found')}

                                                            </div>

                                                            <div className="bg-muted/50 border border-border/30 rounded-lg p-2.5">

                                                                <div className="text-xs text-foreground font-medium">{nearbyStation.name}</div>

                                                                <div className="text-xs text-muted-foreground mt-1">

                                                                    {nearbyStation.availablePoints}/{nearbyStation.totalPoints} {t('charging_points')}

                                                                </div>

                                                                <div className="flex items-center mt-2">

                                                                    {getStatusBadge(nearbyStation.status)}

                                                                </div>

                                                            </div>

                                                        </div>

                                                    );

                                                } else {

                                                    return (

                                                        <div className="space-y-3">

                                                            <div className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">

                                                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center">

                                                                    <span className="text-yellow-500 text-xs">⚠</span>

                                                                </div>

                                                                <span className="text-xs text-yellow-600 dark:text-yellow-500 font-medium">

                                                                    Chưa có trạm sạc tại vị trí này

                                                                </span>

                                                            </div>

                                                            <Button

                                                                onClick={() => {

                                                                    console.log("Setting POI data to form:", {

                                                                        name: selectedPOI.name,

                                                                        address: selectedPOI.address,

                                                                        lat: selectedPOI.latitude,

                                                                        lng: selectedPOI.longitude

                                                                    });

                                                                    setLatitude(selectedPOI.latitude);

                                                                    setLongitude(selectedPOI.longitude);

                                                                    setStationName(selectedPOI.name);

                                                                    setAddress(selectedPOI.address);

                                                                    setIsAddDialogOpen(true);

                                                                    setSelectedPOI(null);

                                                                    if (tempMarker) {

                                                                        tempMarker.remove();

                                                                        setTempMarker(null);

                                                                    }

                                                                }}

                                                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs py-2.5 shadow-sm"

                                                            >

                                                                <Plus className="w-4 h-4 mr-2" />

                                                                {t('add_station_here')}

                                                            </Button>

                                                        </div>

                                                    );

                                                }

                                            })()}

                                        </div>

                                    )}

                                </CardContent>

                            </Card>



                            {selectedStation && (

                                <Card className="mt-4 bg-card/80 backdrop-blur-xl border border-border">

                                    <CardHeader>

                                        <CardTitle>{t('station_control')}</CardTitle>

                                    </CardHeader>

                                    <CardContent>

                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">

                                            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>

                                                <DialogTrigger asChild>

                                                    <Button variant="outline" className="flex items-center space-x-2"

                                                            onClick={handleEditStation}>

                                                        <Edit className="w-4 h-4" />

                                                        <span>{t('edit')}</span>

                                                    </Button>

                                                </DialogTrigger>

                                                <DialogContent className="max-w-4xl max-h-[85vh] bg-card/95 backdrop-blur-xl border-border/50">

                                                    <DialogHeader className="px-1 pb-4">

                                                        <DialogTitle className="text-foreground">{t('edit')} {selectedStation.name}</DialogTitle>

                                                        <DialogDescription className="text-muted-foreground">{t('update_station_info')}</DialogDescription>

                                                    </DialogHeader>

                                                    <form

                                                        onSubmit={(e) => handleUpdatingStation(e, selectedStation.id)}>

                                                        <div className="space-y-4 max-h-[calc(85vh-180px)] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent">

                                                            {error && <div

                                                                className="text-red-600 text-sm p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">{error}</div>}

                                                            <div>

                                                                <Label htmlFor="editStationId">{t('station_code')}</Label>

                                                                <Input

                                                                    id="editStationId"

                                                                    defaultValue={selectedStation.id}

                                                                    disabled

                                                                />

                                                            </div>



                                                            <div>

                                                                <Label htmlFor="editName">{t('station_name')}</Label>

                                                                <Input

                                                                    id="editName"

                                                                    name="stationName"

                                                                    value={stationName}

                                                                    onChange={(e) => setStationName(e.target.value)}

                                                                    disabled={loading}

                                                                />

                                                            </div>



                                                            <div className="relative">

                                                                <Label htmlFor="editAddress">{t('station_address')}</Label>

                                                                <div className="relative">

                                                                    <Input

                                                                        id="editAddress"

                                                                        name="address"

                                                                        value={isAddressFieldTouched ? addressSearchInput : (addressSearchInput || address)}

                                                                        onChange={handleAddressSearchInputChange}

                                                                        onFocus={() => {

                                                                            setShowAddressSearchResults(true);

                                                                            if (!isAddressFieldTouched) {

                                                                                setAddressSearchInput(address);

                                                                                setIsAddressFieldTouched(true);

                                                                            }

                                                                        }}

                                                                        placeholder={t('search_locations')}

                                                                        disabled={loading}

                                                                        className="w-full"

                                                                    />



                                                                    {/* Address search results dropdown */}

                                                                    {showAddressSearchResults && (

                                                                        <div className="address-search-results-container absolute top-full left-0 right-0 mt-1 bg-black border border-border rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">

                                                                            <div className="p-3 border-b border-gray-700">

                                                                                <div className="flex items-center space-x-2">

                                                                                    <MapPin className="w-4 h-4 text-blue-400" />

                                                                                    <div>

                                                                                        <span className="text-sm font-semibold text-white">

                                                                                            {addressSearchResults.length} {t('search_results_found')}

                                                                                        </span>

                                                                                        <div className="text-xs text-gray-300 mt-0.5">

                                                                                            {t('select_to_update_address')}

                                                                                        </div>

                                                                                    </div>

                                                                                </div>

                                                                            </div>



                                                                            <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">

                                                                                {addressSearchResults.length > 0 ? (

                                                                                    addressSearchResults.map((poi, index) => (

                                                                                        <div

                                                                                            key={poi.id}

                                                                                            className="group/item px-4 py-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0 transition-all duration-200 hover:shadow-sm"

                                                                                            onClick={() => handleSelectAddressPOI(poi)}

                                                                                        >

                                                                                            <div className="flex items-start space-x-3">

                                                                                                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center group-hover/item:from-gray-600 group-hover/item:to-gray-500 transition-all duration-200">

                                                                                                    <MapPin className="w-5 h-5 text-blue-400" />

                                                                                                </div>

                                                                                                <div className="flex-1 min-w-0">

                                                                                                    <div className="font-semibold text-sm text-white group-hover/item:text-blue-300 transition-colors line-clamp-1 mb-1">

                                                                                                        {poi.name}

                                                                                                    </div>

                                                                                                    <div className="text-xs text-gray-400 mb-2 line-clamp-1">

                                                                                                        📍 {poi.address}

                                                                                                    </div>

                                                                                                    <div className="flex items-center space-x-2">

                                                                                                        <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-mono text-gray-300 bg-muted border border-border">

                                                                                                            <span className="text-gray-500 mr-1">📍</span>

                                                                                                            {poi.latitude.toFixed(4)}, {poi.longitude.toFixed(4)}

                                                                                                        </div>

                                                                                                        <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-900/30 text-emerald-300 border border-emerald-700/50">

                                                                                                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5"></div>

                                                                                                            POI Dataset

                                                                                                        </div>

                                                                                                    </div>

                                                                                                </div>

                                                                                            </div>

                                                                                        </div>

                                                                                    ))

                                                                                ) : addressSearchInput.trim() ? (

                                                                                    <div className="px-4 py-6 text-center text-gray-400">

                                                                                        <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-600" />

                                                                                        <p className="text-sm">Không tìm thấy địa điểm nào</p>

                                                                                        <p className="text-xs mt-1">Thử từ khóa khác</p>

                                                                                    </div>

                                                                                ) : null}

                                                                            </div>

                                                                        </div>

                                                                    )}

                                                                </div>

                                                            </div>



                                                            <div className="grid grid-cols-2 gap-4">

                                                                <div>

                                                                    <Label htmlFor="editLatitude">{t('latitude')}</Label>

                                                                    <Input

                                                                        id="editLatitude"

                                                                        name="latitude"

                                                                        type="number"

                                                                        step="any"

                                                                        value={latitude ?? ""}

                                                                        onChange={(e) => {

                                                                            const val = e.target.value;

                                                                            setLatitude(val === "" ? null : parseFloat(val));

                                                                        }}

                                                                        disabled={true}

                                                                        className="bg-gray-100 cursor-not-allowed"

                                                                    />

                                                                </div>

                                                                <div>

                                                                    <Label htmlFor="editLongitude">{t('longitude')}</Label>

                                                                    <Input

                                                                        id="editLongitude"

                                                                        name="longitude"

                                                                        type="number"

                                                                        step="any"

                                                                        value={longitude ?? ""}

                                                                        onChange={(e) => {

                                                                            const val = e.target.value;

                                                                            setLongitude(val === "" ? null : parseFloat(val));

                                                                        }}

                                                                        disabled={true}

                                                                        className="bg-gray-100 cursor-not-allowed"

                                                                    />

                                                                </div>

                                                            </div>



                                                            {/* Charging Points Management for Edit - Editable */}

                                                            <div className="space-y-3 border-t border-border/30 pt-4">

                                                                <div className="flex items-center justify-between px-1">

                                                                    <Label className="text-foreground font-medium">{t('charging_points')} ({chargingPosts.length})</Label>

                                                                </div>



                                                                {chargingPosts.length === 0 && (

                                                                    <div className="text-center py-8 px-4 bg-muted/30 border border-border/30 rounded-xl">

                                                                        <Plug className="w-10 h-10 mx-auto mb-3 opacity-40 text-muted-foreground" />

                                                                        <p className="text-sm text-muted-foreground font-medium">Chưa có trụ sạc nào</p>

                                                                    </div>

                                                                )}



                                                                {chargingPosts.length > 0 && (

                                                                    <div className="max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent">

                                                                        <div className="space-y-3">

                                                                            {chargingPosts.map((post, index) => (

                                                                                <div key={post.id} className="p-3 border border-border/40 rounded-xl bg-muted/50 shadow-sm">

                                                                                    <div className="flex items-center justify-between mb-3">

                                                                                        <h4 className="text-sm font-medium text-foreground">{t('charging_points')} #{index + 1}</h4>

                                                                                        <Button

                                                                                            type="button"

                                                                                            variant="ghost"

                                                                                            size="sm"

                                                                                            onClick={() => removeChargingPost(post.id)}

                                                                                            className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-md"

                                                                                        >

                                                                                            <XCircle className="w-3.5 h-3.5" />

                                                                                        </Button>

                                                                                    </div>



                                                                                    <div className="space-y-3">

                                                                                        <div>

                                                                                            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">{t('charging_point_name')}</label>

                                                                                            <Input

                                                                                                value={post.chargingPointName}

                                                                                                onChange={(e) => updateChargingPost(post.id, 'chargingPointName', e.target.value)}

                                                                                                placeholder={t('charging_point_name_placeholder')}

                                                                                                className="w-full h-9 text-sm bg-background border border-border/50 rounded-lg px-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"

                                                                                            />

                                                                                        </div>

                                                                                        <div>

                                                                                            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">{t('charging_point_name')}</label>

                                                                                            <Input

                                                                                                value={post.chargingPointName}

                                                                                                onChange={(e) => updateChargingPost(post.id, 'chargingPointName', e.target.value)}

                                                                                                placeholder={t('charging_point_name_placeholder')}

                                                                                                className="w-full h-9 text-sm bg-background border border-border/50 rounded-lg px-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"

                                                                                            />

                                                                                        </div>

                                                                                        <div>

                                                                                            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">{t('connector_type')}</label>

                                                                                            <select

                                                                                                value={post.connectorType}

                                                                                                onChange={(e) => {

                                                                                                    const selectedType = newPortTypes.find(type => type.name === e.target.value);

                                                                                                    updateChargingPost(post.id, 'connectorType', e.target.value);

                                                                                                    if (selectedType) {

                                                                                                        updateChargingPost(post.id, 'power', selectedType.power.toString());

                                                                                                        updateChargingPost(post.id, 'price', selectedType.price.toString());

                                                                                                    }

                                                                                                }}

                                                                                                className="w-full h-9 text-sm bg-background border border-border/50 rounded-lg px-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"

                                                                                                aria-label="Connector type"

                                                                                            >

                                                                                                <option value="">{t('select_connector_type')}</option>

                                                                                                {newPortTypes.map((type, idx) => (

                                                                                                    <option key={idx} value={type.name}>

                                                                                                        {type.name} ({type.power} kWh - ₫{type.price}/kWh)

                                                                                                    </option>

                                                                                                ))}

                                                                                            </select>

                                                                                        </div>



                                                                                        <div>

                                                                                            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">{t('status')}</label>

                                                                                            <select

                                                                                                value={post.status}

                                                                                                onChange={(e) => updateChargingPost(post.id, 'status', e.target.value)}

                                                                                                className="w-full h-9 text-sm bg-background border border-border/50 rounded-lg px-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"

                                                                                                aria-label="Connector status"

                                                                                            >

                                                                                                <option value="AVAILABLE">🟢 {t('available')}</option>

                                                                                                <option value="OCCUPIED">🔴 {t('occupied')}</option>

                                                                                                <option value="RESERVED">🟠 {t('reserved')}</option>

                                                                                                <option value="OUT_OF_SERVICE">⚫ {t('out_of_service')}</option>

                                                                                                <option value="MAINTENANCE">🔧 {t('maintenance')}</option>

                                                                                            </select>

                                                                                        </div>

                                                                                    </div>

                                                                                </div>

                                                                            ))}

                                                                        </div>

                                                                    </div>

                                                                )}

                                                            </div>

                                                        </div>



                                                        <div className="pt-4 border-t border-border/30 px-1">

                                                            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">

                                                                {loading ? t('loading') : t('update')}

                                                            </Button>

                                                        </div>

                                                    </form>

                                                </DialogContent>

                                            </Dialog>



                                            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>

                                                <DialogTrigger asChild>

                                                    <Button variant="destructive"

                                                            className="flex items-center space-x-2">

                                                        <Trash2 className="w-4 h-4" />

                                                        <span>{t('delete')}</span>

                                                    </Button>

                                                </DialogTrigger>

                                                <DialogContent

                                                    className="bg-card/95 backdrop-blur-xl border-border/50">

                                                    <DialogHeader className="px-1">

                                                        <DialogTitle>{t('confirm_delete')} {t('charging_stations')}</DialogTitle>

                                                        <DialogDescription>

                                                            {t('are_you_sure_delete')} {t('charging_stations')}? {t('warning')}: {t('cannot_delete_in_use')}

                                                        </DialogDescription>

                                                    </DialogHeader>

                                                    <form onSubmit={(e) => handleDeletingStation(e, selectedStation.id)}>

                                                        {selectedStation && (

                                                            <div className="space-y-4">

                                                                <div>

                                                                    <h4 className="font-medium">{selectedStation.name}</h4>

                                                                    <p className="text-sm text-muted-foreground">Mã

                                                                        trạm: {selectedStation.id}</p>

                                                                    <p className="text-sm text-muted-foreground">{selectedStation.address}</p>

                                                                </div>

                                                                <div className="flex items-center justify-between">

                                                                    <span>{t('status')}:</span>

                                                                    {getStatusBadge(selectedStation.status)}

                                                                </div>

                                                                <div className="flex items-center justify-between">

                                                                    <span>{t('charging_points')}:</span>

                                                                    <span className="font-medium">

                                                                        {selectedStation.availablePoints}/{selectedStation.totalPoints}

                                                                    </span>

                                                                </div>

                                                                <Separator />

                                                                <div>

                                                                    <h5 className="font-medium mb-2">Loại Connector:</h5>

                                                                    <div className="space-y-2">

                                                                        {(selectedStation.connectorTypes ?? []).map((connector, idx) => (

                                                                            <div key={idx}

                                                                                 className="flex justify-between text-sm">

                                                                                <span>

                                                                                    {connector.typeName || connector.type} ({connector.powerOutput || connector.power} kW)

                                                                                </span>

                                                                                <span

                                                                                    className={connector.available > 0 ? "text-green-600" : "text-red-600"}>

                                                                                    {connector.available}/{connector.total}

                                                                                </span>

                                                                            </div>

                                                                        ))}

                                                                    </div>

                                                                </div>

                                                                <Separator />

                                                                <div className="grid grid-cols-2 gap-4 text-sm">

                                                                    <div>

                                                                        <span className="text-muted-foreground">{t('operating_hours')}:</span>

                                                                        <p className="font-medium">{selectedStation.operatingHours}</p>

                                                                    </div>

                                                                    <div>

                                                                        <span

                                                                            className="text-muted-foreground">{t('contact_phone')}:</span>

                                                                        <p className="font-medium">{selectedStation.contactPhone}</p>

                                                                    </div>

                                                                </div>

                                                                <Separator />

                                                                <div className="grid grid-cols-2 gap-4 text-sm">

                                                                    <div>

                                                                        <span className="text-muted-foreground">{t('daily_revenue')}:</span>

                                                                        <p className="font-medium text-green-600">{Number(selectedStation.revenue.daily || 0).toLocaleString()} VND</p>

                                                                    </div>

                                                                    <div>

                                                                        <span className="text-muted-foreground">{t('monthly_revenue')}:</span>

                                                                        <p className="font-medium text-blue-600">{Number(selectedStation.revenue.monthly || 0).toLocaleString()} VND</p>

                                                                    </div>

                                                                </div>

                                                            </div>

                                                        )}

                                                        <div className="flex justify-end space-x-2 mt-4">

                                                            <Button variant="outline" type="button"

                                                                    onClick={() => setIsDeleteDialogOpen(false)}>

                                                                {t('cancel')}

                                                            </Button>

                                                            <Button variant="destructive" type="submit">

                                                                {t('confirm_delete')}

                                                            </Button>

                                                        </div>

                                                    </form>

                                                </DialogContent>

                                            </Dialog>

                                            {/* Add Charging Point Dialog */}
                                            <Dialog open={isAddChargingPointDialogOpen} onOpenChange={setIsAddChargingPointDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="default"
                                                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
                                                        onClick={async () => {
                                                            // Load connector types when opening dialog
                                                            try {
                                                                const types = await fetchConnectorTypes();
                                                                if (types) {
                                                                    setNewPortTypes(types);
                                                                }
                                                            } catch (err) {
                                                                console.error("Error loading connector types:", err);
                                                            }
                                                        }}
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        <span>{t('add_charging_point')}</span>
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-border/50">
                                                    <DialogHeader>
                                                        <DialogTitle className="text-foreground">
                                                            {t('add_new_charging_point')}
                                                        </DialogTitle>
                                                        <DialogDescription className="text-muted-foreground">
                                                            {language === 'vi'
                                                                ? `Thêm trụ sạc vào trạm ${selectedStation?.name}`
                                                                : `Add charging point to station ${selectedStation?.name}`
                                                            }
                                                        </DialogDescription>
                                                    </DialogHeader>

                                                    <div className="space-y-6 py-4">
                                                        {error && (
                                                            <div className="text-red-600 text-sm p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                                                                {error}
                                                            </div>
                                                        )}

                                                        {/* Charging Point Name */}
                                                        <div className="space-y-2">
                                                            <Label htmlFor="chargingPointName" className="text-sm font-medium">
                                                                {language === 'vi' ? 'Tên trụ sạc' : 'Charging Point Name'} <span className="text-red-500">*</span>
                                                            </Label>
                                                            <Input
                                                                id="chargingPointName"
                                                                placeholder={language === 'vi' ? 'Nhập tên trụ sạc' : 'Enter charging point name'}
                                                                value={newChargingPoint.chargingPointName}
                                                                onChange={(event) => {
                                                                    const value = event.target.value;
                                                                    setNewChargingPoint((prev) => ({
                                                                        ...prev,
                                                                        chargingPointName: value
                                                                    }));
                                                                }}
                                                                className="mt-1.5"
                                                            />
                                                        </div>

                                                        {/* Connector Type Selection */}
                                                        <div className="space-y-2">
                                                            <Label htmlFor="chargingPointConnectorType" className="text-sm font-medium">
                                                                {language === 'vi' ? 'Loại Connector' : 'Connector Type'} <span className="text-red-500">*</span>
                                                            </Label>
                                                            <Select
                                                                value={newChargingPoint.connectorTypeId ? newChargingPoint.connectorTypeId.toString() : ""}
                                                                onValueChange={(value: string) => {
                                                                    const connectorType = newPortTypes.find(type => type.connectorId === value);
                                                                    if (connectorType) {
                                                                        console.log("Selected connector:", connectorType);
                                                                        setNewChargingPoint(prev => ({
                                                                            ...prev,
                                                                            typeName: connectorType.name,
                                                                            connectorTypeId: Number(connectorType.connectorId)
                                                                        }));
                                                                    }
                                                                }}
                                                            >
                                                                <SelectTrigger id="chargingPointConnectorType" className="mt-1.5">
                                                                    <SelectValue placeholder={language === 'vi' ? 'Chọn loại connector' : 'Select connector type'}>
                                                                        {newChargingPoint.typeName ? (
                                                                            <div className="flex items-center gap-2">
                                                                                <Zap className="w-4 h-4 text-yellow-500" />
                                                                                <span className="font-medium">{newChargingPoint.typeName}</span>
                                                                                {(() => {
                                                                                    const selectedType = newPortTypes.find(t => t.connectorId === newChargingPoint.connectorTypeId.toString());
                                                                                    return selectedType ? (
                                                                                        <span className="text-xs text-muted-foreground">
                                                                                            ({selectedType.power}kW - ₫{Number(selectedType.price).toLocaleString()}/kWh)
                                                                                        </span>
                                                                                    ) : null;
                                                                                })()}
                                                                            </div>
                                                                        ) : (
                                                                            <span>{language === 'vi' ? 'Chọn loại connector' : 'Select connector type'}</span>
                                                                        )}
                                                                    </SelectValue>
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {newPortTypes.length > 0 ? (
                                                                        newPortTypes.map((type) => (
                                                                            <SelectItem key={type.connectorId} value={type.connectorId}>
                                                                                <div className="flex items-center gap-2">
                                                                                    <Zap className="w-4 h-4 text-yellow-500" />
                                                                                    <span className="font-medium">{type.name}</span>
                                                                                    <span className="text-xs text-muted-foreground">
                                                                                        ({type.power}kW - ₫{Number(type.price).toLocaleString()}/kWh)
                                                                                    </span>
                                                                                </div>
                                                                            </SelectItem>
                                                                        ))
                                                                    ) : (
                                                                        <SelectItem value="0" disabled>
                                                                            {language === 'vi' ? 'Đang tải...' : 'Loading...'}
                                                                        </SelectItem>
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        {/* Status Selection */}
                                                        <div className="space-y-2">
                                                            <Label htmlFor="chargingPointStatus" className="text-sm font-medium">
                                                                {language === 'vi' ? 'Trạng thái' : 'Status'} <span className="text-red-500">*</span>
                                                            </Label>
                                                            <Select
                                                                value={newChargingPoint.status}
                                                                onValueChange={(value: string) => {
                                                                    setNewChargingPoint(prev => ({ ...prev, status: value as ChargingPointStatus }));
                                                                }}
                                                            >
                                                                <SelectTrigger id="chargingPointStatus" className="mt-1.5">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="AVAILABLE">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                                            <span>{t('available')}</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="OCCUPIED">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                                            <span>{t('occupied')}</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="RESERVED">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                                                            <span>{t('reserved')}</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="OUT_OF_SERVICE">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                                                            <span>{t('out_of_service')}</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="MAINTENANCE">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                                            <span>{t('maintenance')}</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        {/* Station Info (Read-only) */}
                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-medium">{language === 'vi' ? 'Trạm sạc' : 'Station'}</Label>
                                                            <Input
                                                                value={selectedStation?.name || ''}
                                                                disabled
                                                                className="mt-1.5 bg-muted/50 cursor-not-allowed"
                                                            />
                                                            <p className="text-xs text-muted-foreground">
                                                                ID: {selectedStation?.id}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end space-x-2 pt-4 border-t border-border/30">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => {
                                                                setIsAddChargingPointDialogOpen(false);
                                                                // Reset form
                                                                setNewChargingPoint({
                                                                    chargingPointName: "",
                                                                    typeName: "",
                                                                    status: "AVAILABLE",
                                                                    connectorTypeId: 0,
                                                                    stationId: 0
                                                                });
                                                                setError(null);
                                                            }}
                                                            disabled={loading}
                                                        >
                                                            {t('cancel')}
                                                        </Button>
                                                        <Button
                                                            onClick={handleAddChargingPoint}
                                                            disabled={
                                                                loading ||
                                                                !newChargingPoint.connectorTypeId ||
                                                                !newChargingPoint.chargingPointName.trim()
                                                            }
                                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                                        >
                                                            {loading ? t('loading') : t('add_charging_point')}
                                                        </Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>



                                            {/* All Charging Points Dialog */}

                                            <Dialog open={isAllChargingPointsDialogOpen} onOpenChange={setIsAllChargingPointsDialogOpen}>

                                                <DialogContent className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl max-w-6xl max-h-[80vh] overflow-hidden">

                                                    <DialogHeader>

                                                        <DialogTitle className="flex items-center space-x-2">

                                                            <Plug className="w-5 h-5 text-primary" />

                                                            <span>{t('view_all_charging_points')} - {selectedStationForAllPoints?.name}</span>

                                                        </DialogTitle>

                                                        <DialogDescription>

                                                            {t('charging_point_details')}

                                                        </DialogDescription>

                                                    </DialogHeader>



                                                    {selectedStationForAllPoints && (

                                                        <div className="space-y-4 flex flex-col h-full">

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 border border-border/30 rounded-xl">

                                                                <div>

                                                                    <h4 className="font-medium text-foreground">{selectedStationForAllPoints.name}</h4>

                                                                    <p className="text-sm text-muted-foreground">{selectedStationForAllPoints.address}</p>

                                                                </div>

                                                                <div className="flex items-center justify-between">

                                                                    <span className="text-sm text-muted-foreground">{t('total_points')}:</span>

                                                                    <span className="font-medium text-foreground">

                                                                        {allChargingPoints.length}

                                                                    </span>

                                                                </div>

                                                            </div>



                                                            <div className="space-y-3 flex-1 overflow-hidden">

                                                                <h5 className="font-medium text-foreground">{t('all_charging_points_list')}</h5>

                                                                {allChargingPoints.length > 0 ? (

                                                                    <ScrollArea className="h-96 w-full">

                                                                        <div className="space-y-3 pr-4">

                                                                            {allChargingPoints.map((point, index) => (

                                                                                <Card key={`${point.chargingPointId}-${index}-${selectedStationForAllPoints?.id}`} className="bg-muted/50 border border-border/40 rounded-xl shadow-sm hover:shadow-md transition-shadow">

                                                                                    <CardContent className="p-4">

                                                                                        <div className="flex items-start justify-between mb-3">

                                                                                            <div className="flex items-center space-x-2">

                                                                                                <Plug className="w-4 h-4 text-primary" />

                                                                                                <h6 className="font-medium text-foreground">{t('charging_points')} #{point.chargingPointId}</h6>

                                                                                            </div>

                                                                                            <div className="flex items-center space-x-2">

                                                                                                <div className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                                                                                                    point.status === 'AVAILABLE' ? 'bg-green-500/15 text-green-600 dark:text-green-400' :
                                                                                                        point.status === 'OCCUPIED' ? 'bg-red-500/15 text-red-600 dark:text-red-400' :
                                                                                                            point.status === 'RESERVED' ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400' :
                                                                                                                point.status === 'OUT_OF_SERVICE' ? 'bg-gray-500/15 text-gray-600 dark:text-gray-400' :
                                                                                                                    'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400'
                                                                                                }`}>

                                                                                                    {point.status === 'AVAILABLE' ? `🟢 ${t('available')}` :
                                                                                                        point.status === 'OCCUPIED' ? `🔴 ${t('occupied')}` :
                                                                                                            point.status === 'RESERVED' ? `🟠 ${t('reserved')}` :
                                                                                                                point.status === 'OUT_OF_SERVICE' ? `⚫ ${t('out_of_service')}` :
                                                                                                                    `🔧 ${t('maintenance')}`}

                                                                                                </div>

                                                                                                <Button

                                                                                                    size="sm"

                                                                                                    variant="outline"

                                                                                                    onClick={async () => {
                                                                                                        // Validate charging point status before deleting
                                                                                                        if (point.status === 'OCCUPIED' || point.status === 'RESERVED') {
                                                                                                            const statusText = point.status === 'OCCUPIED' ? t('occupied') : t('reserved');
                                                                                                            toast.error(
                                                                                                                t('cannot_delete_charging_point'),
                                                                                                                {
                                                                                                                    description: `${t('charging_points')} #${point.chargingPointId} ${t('is_currently')} ${statusText}. ${t('cannot_delete_or_modify')}`
                                                                                                                }
                                                                                                            );
                                                                                                            return;
                                                                                                        }

                                                                                                        // Fetch latest status to double-check
                                                                                                        const latestPoint = await fetchChargingPointById(point.chargingPointId);
                                                                                                        if (latestPoint && (latestPoint.status === 'OCCUPIED' || latestPoint.status === 'RESERVED')) {
                                                                                                            const statusText = latestPoint.status === 'OCCUPIED' ? t('occupied') : t('reserved');
                                                                                                            toast.error(
                                                                                                                t('cannot_delete_charging_point'),
                                                                                                                {
                                                                                                                    description: `${t('charging_points')} #${point.chargingPointId} ${t('is_currently')} ${statusText}. ${t('cannot_delete_or_modify')}`
                                                                                                                }
                                                                                                            );
                                                                                                            return;
                                                                                                        }

                                                                                                        // Call API to delete charging point
                                                                                                        const success = await callApiForChargingPointDeleting(point.chargingPointId);

                                                                                                        if (success) {
                                                                                                            // Remove from local state
                                                                                                            setAllChargingPoints(prev => prev.filter(p => p.chargingPointId !== point.chargingPointId));

                                                                                                            // Refresh station list to update counts
                                                                                                            await handleGetStationList();

                                                                                                            toast.success(t('charging_point_deleted'));
                                                                                                        }
                                                                                                    }}

                                                                                                    disabled={point.status === 'OCCUPIED' || point.status === 'RESERVED'}

                                                                                                    className={`h-7 px-2 rounded-md ${
                                                                                                        point.status === 'OCCUPIED' || point.status === 'RESERVED'
                                                                                                            ? 'opacity-50 cursor-not-allowed text-muted-foreground border-border/50'
                                                                                                            : 'text-red-500 border-red-500/50 hover:bg-red-500/10 hover:border-red-500'
                                                                                                    }`}

                                                                                                    title={
                                                                                                        point.status === 'OCCUPIED' || point.status === 'RESERVED'
                                                                                                            ? `Không thể xóa trụ đang ${point.status === 'OCCUPIED' ? 'sử dụng' : 'được đặt chỗ'}`
                                                                                                            : 'Xóa trụ sạc'
                                                                                                    }

                                                                                                >

                                                                                                    <Trash2 className="w-3 h-3" />

                                                                                                </Button>

                                                                                            </div>

                                                                                        </div>



                                                                                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">

                                                                                            <div>

                                                                                                <span className="text-muted-foreground text-xs">{t('status')}:</span>

                                                                                                <p className="font-medium text-foreground">{point.status || "Unknown"}</p>

                                                                                            </div>

                                                                                            <div>

                                                                                                <span className="text-muted-foreground text-xs">{t('type')}:</span>

                                                                                                <p className="font-medium text-foreground">{point.typeName || "Unknown"}</p>

                                                                                            </div>

                                                                                            <div>

                                                                                                <span className="text-muted-foreground text-xs">{t('capacity')}:</span>

                                                                                                <p className="font-medium text-foreground">{point.powerOutput || 0} kW</p>

                                                                                            </div>

                                                                                            <div>

                                                                                                <span className="text-muted-foreground text-xs">{t('price_per_kwh')}:</span>

                                                                                                <p className="font-medium text-foreground">₫{(point.pricePerKwh || 0).toLocaleString()}/kWh</p>

                                                                                            </div>

                                                                                            <div>

                                                                                                <span className="text-muted-foreground text-xs">ID:</span>

                                                                                                <p className="font-medium text-foreground">#{point.chargingPointId}</p>

                                                                                            </div>

                                                                                            <div>

                                                                                                <span className="text-muted-foreground text-xs">{t('station')}:</span>

                                                                                                <p className="font-medium text-foreground">{selectedStationForAllPoints?.name || "Unknown Station"}</p>

                                                                                            </div>

                                                                                        </div>

                                                                                    </CardContent>

                                                                                </Card>

                                                                            ))}

                                                                        </div>

                                                                    </ScrollArea>

                                                                ) : (

                                                                    <div className="text-center py-8 text-muted-foreground">

                                                                        <Plug className="w-12 h-12 mx-auto mb-4 opacity-50" />

                                                                        <p className="text-lg font-medium">Chưa có trụ sạc nào</p>

                                                                        <p className="text-sm">Trạm này chưa được cấu hình trụ sạc</p>

                                                                    </div>

                                                                )}

                                                            </div>

                                                        </div>

                                                    )}



                                                    <div className="flex justify-end pt-4 border-t border-border/30">

                                                        <Button

                                                            variant="outline"

                                                            onClick={() => setIsAllChargingPointsDialogOpen(false)}

                                                            className="hover:bg-accent"

                                                        >

                                                            {t('close')}

                                                        </Button>

                                                    </div>

                                                </DialogContent>

                                            </Dialog>



                                        </div>



                                        <Separator className="my-4" />

                                        <div>

                                            <h4 className="font-medium mb-3 flex items-center">

                                                <Activity className="w-4 h-4 mr-2 text-primary" />

                                                Charger Post Activating

                                            </h4>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                                                <form onSubmit={(e) => {

                                                    e.preventDefault();

                                                    handleChargerActivate(selectedStation.id);

                                                }} className="w-full">

                                                    <Button

                                                        type="submit"

                                                        variant={selectedStation.status === "ACTIVE" ? "outline" : "default"}

                                                        className="w-full flex items-center justify-center space-x-2"

                                                        disabled={selectedStation.status === "ACTIVE"}

                                                    >

                                                        <Power className="w-4 h-4" />

                                                        <span>{t('activate')}</span>

                                                    </Button>

                                                </form>



                                                <form onSubmit={(e) => {

                                                    e.preventDefault();

                                                    handleChargerDeactivate(selectedStation.id);

                                                }} className="w-full">

                                                    <Button

                                                        type="submit"

                                                        variant={selectedStation.status === "INACTIVE" ? "outline" : "secondary"}

                                                        className="w-full flex items-center justify-center space-x-2"

                                                        disabled={selectedStation.status === "INACTIVE"}

                                                    >

                                                        <XCircle className="w-4 h-4" />

                                                        <span>{t('deactivate')}</span>

                                                    </Button>

                                                </form>



                                                <Button variant="outline"

                                                        onClick={() => handleChargerRestart(selectedStation.id)}

                                                        className="flex items-center space-x-2">

                                                    <RotateCw className="w-4 h-4" />

                                                    <span>{t('restart')}</span>

                                                </Button>

                                            </div>



                                            <div className="mt-3 p-3 bg-muted/30 rounded-lg">

                                                <div className="text-xs text-muted-foreground mb-2">{t('current_status')}:

                                                </div>

                                                <div className="flex items-center justify-between">

                                                    {getStatusBadge(selectedStation.status)}

                                                    <span

                                                        className="text-xs text-muted-foreground">{t('update')}: {new Date().toLocaleString("vi-VN")}</span>

                                                </div>

                                            </div>

                                        </div>

                                    </CardContent>

                                </Card>

                            )}

                        </div>



                        <div className="space-y-4">

                            <Card className="bg-card/80 backdrop-blur-xl border border-border">

                                <CardHeader>

                                    <CardTitle>{t('station_list')}</CardTitle>

                                    <p className="text-sm text-muted-foreground mb-4">{filteredStations.length} {t('charging_stations')}</p>

                                    {/* Search and Filter for Station List */}
                                    <div className="flex items-center gap-2 w-full">
                                        <div className="relative flex-1">
                                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                placeholder={t('search_stations')}
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-10 w-full"
                                            />
                                        </div>
                                        <div className="w-32">
                                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">{t('all')}</SelectItem>
                                                    <SelectItem value="ACTIVE">{t('active')}</SelectItem>
                                                    <SelectItem value="INACTIVE">{t('inactive')}</SelectItem>
                                                    <SelectItem value="MAINTENANCE">{t('maintenance')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                </CardHeader>

                                <CardContent className="p-0">

                                    <ScrollArea className="h-[500px]">

                                        <div className="space-y-2 p-4">

                                            {paginatedStations.map((station) => (

                                                <Card

                                                    key={station.id}

                                                    className={`cursor-pointer transition-all hover:shadow-md ${selectedStation?.id === station.id ? "border-primary bg-primary/5" : "border-border/50"

                                                    }`}

                                                    onClick={() => handleStationClick(station)}

                                                >

                                                    <CardContent className="p-4">

                                                        <div className="flex items-start justify-between mb-2">

                                                            <div className="flex items-center space-x-2">

                                                                {getStatusIcon(station.status)}

                                                                <h4 className="font-medium text-sm">{station.name}</h4>

                                                            </div>

                                                            {getStatusBadge(station.status)}

                                                        </div>

                                                        <p className="text-xs text-muted-foreground mb-1">{t('station_code')}: {station.id}</p>

                                                        <p className="text-xs text-muted-foreground mb-3">{station.address}</p>



                                                        <div className="grid grid-cols-2 gap-2 text-xs">

                                                            <div className="flex items-center space-x-1">

                                                                <Plug className="w-3 h-3 text-primary" />

                                                                <span>

                                                                    {station.availablePoints}/{station.totalPoints}

                                                                </span>

                                                            </div>

                                                            <div className="flex items-center space-x-1">

                                                                <Zap className="w-3 h-3 text-yellow-500" />

                                                                <span>{(station.connectorTypes ?? []).length} {t('type')}</span>

                                                            </div>

                                                        </div>



                                                        <Separator className="my-2" />



                                                        <div className="space-y-1">

                                                            {(station.connectorTypes ?? []).map((connector, idx) => (

                                                                <div key={idx} className="flex justify-between text-xs">

                                                                    <span

                                                                        className="text-muted-foreground">

                                                                        {connector.typeName || connector.type} ({connector.powerOutput || connector.power} kW):

                                                                    </span>

                                                                    <span

                                                                        className={connector.available > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>

                                                                        {connector.available}/{connector.total}

                                                                    </span>

                                                                </div>

                                                            ))}

                                                        </div>



                                                        <div className="mt-3 pt-2 border-t border-border">

                                                            <Button

                                                                type="button"

                                                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {

                                                                    e.stopPropagation();

                                                                    handleViewAllChargingPoints(station);

                                                                }}

                                                                className="w-full h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white"

                                                            >

                                                                <Plug className="w-3 h-3 mr-1" />

                                                                {t('show_charging_points')}

                                                            </Button>

                                                        </div>

                                                    </CardContent>

                                                </Card>

                                            ))}

                                        </div>

                                    </ScrollArea>

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="border-t border-border p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-muted-foreground">
                                                    {language === 'vi'
                                                        ? `Hiển thị ${startIndex + 1}-${Math.min(endIndex, filteredStations.length)} trong ${filteredStations.length} trạm`
                                                        : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredStations.length)} of ${filteredStations.length} stations`
                                                    }
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                        disabled={currentPage === 1}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <ArrowLeft className="w-4 h-4" />
                                                    </Button>

                                                    <div className="flex items-center gap-1">
                                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                            let pageNum;
                                                            if (totalPages <= 5) {
                                                                pageNum = i + 1;
                                                            } else if (currentPage <= 3) {
                                                                pageNum = i + 1;
                                                            } else if (currentPage >= totalPages - 2) {
                                                                pageNum = totalPages - 4 + i;
                                                            } else {
                                                                pageNum = currentPage - 2 + i;
                                                            }

                                                            return (
                                                                <Button
                                                                    key={i}
                                                                    variant={currentPage === pageNum ? "default" : "outline"}
                                                                    size="sm"
                                                                    onClick={() => setCurrentPage(pageNum)}
                                                                    className="h-8 w-8 p-0"
                                                                >
                                                                    {pageNum}
                                                                </Button>
                                                            );
                                                        })}
                                                    </div>

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                        disabled={currentPage === totalPages}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <ArrowLeft className="w-4 h-4 rotate-180" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                </CardContent>

                            </Card>



                        </div>

                    </div>

                </div>

            </div>

            <Toaster />

        </>

    );

}