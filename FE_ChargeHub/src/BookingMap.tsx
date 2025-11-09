import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "./contexts/ThemeContext";

import { useLanguage } from "./contexts/LanguageContext";

import { useBooking } from "./contexts/BookingContext";

import { calculateDiscountedPrice, getCurrentUserSubscription, getSubscriptionPlan } from "./data/subscriptionData";

import { Button } from "./components/ui/button";

import { Input } from "./components/ui/input";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";

import { Badge } from "./components/ui/badge";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";

import { Slider } from "./components/ui/slider";

import { Switch } from "./components/ui/switch";

import { Separator } from "./components/ui/separator";

import { motion, AnimatePresence } from "motion/react";

import QRCodeGenerator from "./components/QRCodeGenerator";

import ChargingInvoiceView from "./components/ChargingInvoiceView";
import { toast} from "sonner";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { api } from "./services/api";
import { confirmBooking } from "./api/confirmBooking";
import { checkVehicleChargingStatus as checkVehicleChargingStatusAPI } from "./api/vehicleChargingStatus";


import {

    Search,

    MapPin,

    Zap,

    Clock,

    Battery,

    Navigation,

    ArrowLeft,

    Filter,

    Calendar,

    DollarSign,

    Wifi,

    Car,

    Coffee,

    Shield,

    Route,

    Layers,

    Target,

    Wind,

    Sun,

    Cloud,

    CloudRain,

    Thermometer,

    Camera,

    MessageSquare,

    ChevronDown,

    ChevronUp,

    Info,

    Loader2,

    MapIcon,

    Satellite,

    ZoomIn,

    ZoomOut,

    Settings,

    X,

    Pause,

    Square,

    CheckCircle,
    RefreshCw
} from "lucide-react";



interface ChargingStation {

    stationId?: number;
    stationName?: string;
    address?: string;
    status?: string;
    latitude?: number;
    longitude?: number;
    chargingPointNumber?: number;

}
interface ConnectorType {
    ConnectorTypeId?: number;
    TypeName: string;
    PowerOutput: number;
    PricePerKWh: number;
    typeName?: string; // Add lowercase version for API compatibility
}

interface ChargingPoint {
    chargingPointId?: number;
    chargingPointName?: string;  // NEW - Tên charging point (e.g., "A1", "B2")
    status: string;
    connectorTypeId?: number;
    stationId?: number;
    connectorType: ConnectorType;
    powerOutput?: number;
    pricePerKwh?: number;
}

interface StoredStationContext {
    stationId?: number;
    stationName?: string;
    stationAddress?: string;
    connectorType?: string;
    chargingPower?: number;
    pricePerKwh?: number;
    timestamp?: string;
    chargingPointName?: string;
}
interface Vehicle {
    plateNumber: string;
    brand: string;
    carModel?: CarModel;
    capacity?: number;
    productYear?: number;
    connectorTypeName?: string;
    VehicleId?: number;
}
interface CarModel {
    carModelId: number;
    brand: string;
    model: string;
    capacity: number;
    productYear: number;
    imageUrl?: string;
    carModelImage?: string;
    connectorTypeId?: string;
}

interface BookingMapProps {

    onBack: () => void;

    currentBatteryLevel?: number;

    setCurrentBatteryLevel?: (level: number) => void;

    onStartCharging?: (bookingId: string) => void;

}

// Helper function to extract slot information with comprehensive fallbacks
const extractSlotInfo = (slot: any) => {
    console.log("=== Extracting slot info ===");
    console.log("Slot object:", slot);
    console.log("Charging point info:", slot.chargingPointInfo);

    // Try to extract connector type name from multiple sources
    const connectorTypeName =
        slot.connectorType?.TypeName ||
        slot.connectorType?.typeName ||
        slot.connectorTypeName ||
        slot.ConnectorTypeName ||
        slot.typeName ||
        slot.TypeName ||
        slot.chargingPointInfo?.connectorType?.TypeName ||
        slot.chargingPointInfo?.connectorType?.typeName ||
        slot.chargingPointInfo?.connectorType ||
        'Standard';

    // Try to extract power output from multiple sources and coerce to number
    const rawPowerOutput =
        slot.powerOutput ??
        slot.PowerOutput ??
        slot.connectorType?.powerOutput ??
        slot.connectorType?.PowerOutput ??
        slot.chargingPointInfo?.powerOutput ??
        slot.chargingPointInfo?.connectorType?.powerOutput ??
        null;
    const powerOutput = typeof rawPowerOutput === 'number'
        ? rawPowerOutput
        : (rawPowerOutput != null && !isNaN(Number(rawPowerOutput)) ? Number(rawPowerOutput) : null);

    // Try to extract price per kWh from multiple sources
    const pricePerKwh =
        slot.pricePerKwh ||
        slot.PricePerKwh ||
        slot.connectorType?.PricePerKwh ||
        slot.connectorType?.pricePerKwh ||
        slot.chargingPointInfo?.pricePerKwh ||
        slot.chargingPointInfo?.connectorType?.PricePerKwh ||
        slot.chargingPointInfo?.connectorType?.pricePerKwh ||
        'N/A';

    console.log("Extracted values:", { connectorTypeName, powerOutput, pricePerKwh });

    return { connectorTypeName, powerOutput, pricePerKwh };
};

export default function BookingMap({ onBack, currentBatteryLevel = 75, setCurrentBatteryLevel, onStartCharging }: BookingMapProps) {

    const { theme } = useTheme();

    const { addBooking } = useBooking();

    const { language, t } = useLanguage();

    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);

    const [mapCenter, setMapCenter] = useState({ lat: 10.8231, lng: 106.6297 }); // Ho Chi Minh City

    const [bookingStep, setBookingStep] = useState<"select" | "confirm" | "success" | "qr" | "charging" | "invoice">("select");

    const [selectedTimeSlot, setSelectedTimeSlot] = useState("");

    const [targetBatteryLevel, setTargetBatteryLevel] = useState(80);

    const [mapZoom, setMapZoom] = useState(12);

    const [mapType, setMapType] = useState<"road" | "satellite">("road");

    const [showHeatMap, setShowHeatMap] = useState(false);

    const [showRoute, setShowRoute] = useState(false);

    const [isLoadingRoute, setIsLoadingRoute] = useState(false);

    const [routeDetails, setRouteDetails] = useState<{

        distance: string;

        duration: string;

        steps: { instruction: string; distance: string; direction: string }[];

    } | null>(null);

    const [filtersOpen, setFiltersOpen] = useState(false);

    const [showFilters, setShowFilters] = useState(false);

    const markersRef = useRef<maptilersdk.Marker[]>([]);

    const [lastUpdateTime, setLastUpdateTime] = useState(new Date());


    //Khởi tạo biến map
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const __mapRef = useRef<maptilersdk.Map | null>(null);
    const poiMarkersRef = useRef<maptilersdk.Marker[]>([]);
    const defaultCenterLngLat: [number, number] = useMemo(() => [106.7009, 10.7769], []);
    const [tempMarker, setTempMarker] = useState<maptilersdk.Marker | null>(null);
    const markerMapRef = useRef<Map<string, maptilersdk.Marker>>(new Map());
    const hasAutoSelectedRef = useRef(false);


    // Charging session states

    const [chargingProgress, setChargingProgress] = useState(0);

    const [chargingStartTimeSession, setChargingStartTimeSession] = useState<Date | null>(null);

    const [currentChargingBattery, setCurrentChargingBattery] = useState(0);

    const [chargingCost, setChargingCost] = useState(0);

    const [remainingTime, setRemainingTime] = useState(0);

    const [chargingPower, setChargingPower] = useState(0);

    const [chargingIntervalRef, setChargingIntervalRef] = useState<NodeJS.Timeout | null>(null);

    const [completedSession, setCompletedSession] = useState<any>(null);

    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

    const [detailsStation, setDetailsStation] = useState<ChargingStation | null>(null);

    // Charging configuration states
    const [isChargingConfigOpen, setIsChargingConfigOpen] = useState(false);
    const [configStation, setConfigStation] = useState<ChargingStation | null>(null);
    const [initialBatteryLevel, setInitialBatteryLevel] = useState(20);
    const [targetBatteryLevelConfig, setTargetBatteryLevelConfig] = useState(80);
    const [chargingStartTimeInput, setChargingStartTimeInput] = useState("");
    const todayIsoDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const [scheduledDate, setScheduledDate] = useState<string>(todayIsoDate);
    const [scheduledTime, setScheduledTime] = useState<string>("");
    const minScheduledDate = todayIsoDate;
    const [chargingEndTime, setChargingEndTime] = useState("");
    const [bookingMode, setBookingMode] = useState<"now" | "scheduled">("now");
    const [activeBatteryControl, setActiveBatteryControl] = useState<"current" | "target">("target");

    // Vehicle selection states
    const [isVehicleSelectionOpen, setIsVehicleSelectionOpen] = useState(false);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
    const [loadingVehicles, setLoadingVehicles] = useState(false);

    // Use ref to persist selected vehicle
    const selectedVehicleRef = useRef<any>(null);
    
    // Vehicle charging status
    const [isVehicleCurrentlyCharging, setIsVehicleCurrentlyCharging] = useState(false);
    const [loadingVehicleStatus, setLoadingVehicleStatus] = useState(false);

    // Available slots states
    const [availableSlots, setAvailableSlots] = useState<any[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<any>(null);
    const [selectedSlots, setSelectedSlots] = useState<any[]>([]); // For multiple slot selection
    const [chargingPointsData, setChargingPointsData] = useState<any[]>([]);
    const [expandedChargingPoints, setExpandedChargingPoints] = useState<Set<number>>(new Set());
    const [showAvailableSlots, setShowAvailableSlots] = useState(false);

    // Available slots popup states
    const [isSlotsPopupOpen, setIsSlotsPopupOpen] = useState(false);
    const [filteredSlots, setFilteredSlots] = useState<any[]>([]);
    const [loadingFilteredSlots, setLoadingFilteredSlots] = useState(false);

    const clearScheduledResults = () => {
        setChargingStartTimeInput("");
        setAvailableSlots([]);
        setFilteredSlots([]);
        setSelectedSlot(null);
        setSelectedSlots([]);
        setShowAvailableSlots(false);
        setIsSlotsPopupOpen(false);
        setLoadingFilteredSlots(false);
    };


    //Charging Station states
    const [stations, setStations] = useState<ChargingStation[]>([]);
    const [stationId, setStationId] = useState("");
    const [stationName, setStationName] = useState("");
    const [address, setAddress] = useState("");
    const [status, setStatus] = useState("");
    const [latitude, setLatitude] = useState(0);
    const [longitude, setLongtitude] = useState(0);

    // Sorting
    const [sortByDistance, setSortByDistance] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<String | null>(null);

    //Cập nhật trạng thái
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    //Đếm trạm dựa trên trạng thái:
    const [numberOfActiveStation, setNumberOfActiveStation] = useState(0);
    const [numberOfInactiveStation, setNumberOfInactiveStation] = useState(0);
    const [numberOfMaintainedStation, setNumberOfMaintainedStation] = useState(0)

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [totalPages, setTotalPages] = useState(0);

    // Charging points states
    const [chargingPoints, setChargingPoints] = useState<ChargingPoint[]>([]);
    const [loadingPoints, setLoadingPoints] = useState(false);
    const [expandedStationId, setExpandedStationId] = useState<string | null>(null);

    // Available charging points by type for each station
    const [stationChargingPoints, setStationChargingPoints] = useState<{ [stationId: string]: { [typeName: string]: { total: number, available: number } } }>({});

    // Total charging points count for each station
    const [stationTotalPoints, setStationTotalPoints] = useState<{ [stationId: string]: number }>({});
    const userId = localStorage.getItem("userId");

    //View page


    //Get Vehicle List Of User
    const getVehicleOfDriver = async (userId: string): Promise<Vehicle[] | null> => {
        setLoading(true);
        setError(null);
        try {
            console.log("=== getVehicleOfDriver Debug ===");
            console.log("userId:", userId);
            const res = await api.get(`/api/user/${userId}/vehicles`);
            console.log("API response:", res.data);

            if (res.data.success && res.data.data) {
                const vehiclesData = res.data.data;
                console.log("vehiclesData:", vehiclesData);

                // Fetch connector type names for each vehicle that has carModel
                const vehiclesWithConnectorTypes = await Promise.all(
                    vehiclesData.map(async (vehicle: any) => {
                        console.log("Processing vehicle:", vehicle);
                        if (vehicle.carModel?.connectorTypeIds?.[0]) {
                            console.log("=== Processing vehicle with connector type ===");
                            console.log("Vehicle plateNumber:", vehicle.plateNumber);
                            console.log("ConnectorTypeIds:", vehicle.carModel.connectorTypeIds);

                            const connectorType = await fetchConnectorTypeById(vehicle.carModel.connectorTypeIds[0].toString());
                            console.log("Fetched connector type:", connectorType);

                            const result = {
                                plateNumber: vehicle.plateNumber,
                                brand: vehicle.carModel?.brand || "Unknown",
                                carModel: vehicle.carModel ? {
                                    carModelId: vehicle.carModel.carModelId,
                                    brand: vehicle.carModel.brand,
                                    model: vehicle.carModel.model,
                                    capacity: vehicle.carModel.capacity,
                                    productYear: vehicle.carModel.productYear,
                                    carModelImage: vehicle.carModel.carModelImage,
                                    imageUrl: vehicle.carModel.carModelImage,
                                    connectorTypeId: vehicle.carModel.connectorTypeIds[0].toString()
                                } : undefined,
                                capacity: vehicle.carModel?.capacity,
                                productYear: vehicle.carModel?.productYear,
                                connectorTypeName: connectorType?.TypeName || "Unknown",
                                VehicleId: vehicle?.vehicleId
                            };

                            console.log("Final vehicle result:", result);
                            return result;
                        }
                        console.log("=== Processing vehicle without connector type ===");
                        console.log("Vehicle plateNumber:", vehicle.plateNumber);
                        console.log("No connectorTypeIds found");

                        return {
                            plateNumber: vehicle.plateNumber,
                            brand: vehicle.carModel?.brand || "Unknown",
                            carModel: vehicle.carModel ? {
                                carModelId: vehicle.carModel.carModelId,
                                brand: vehicle.carModel.brand,
                                model: vehicle.carModel.model,
                                capacity: vehicle.carModel.capacity,
                                productYear: vehicle.carModel.productYear,
                                carModelImage: vehicle.carModel.carModelImage,
                                imageUrl: vehicle.carModel.carModelImage,
                                connectorTypeId: vehicle.carModel.connectorTypeIds?.[0]?.toString()
                            } : undefined,
                            capacity: vehicle.carModel?.capacity,
                            productYear: vehicle.carModel?.productYear,
                            connectorTypeName: "Unknown",
                            VehicleId: vehicle?.vehicleId
                        };
                    })
                );

                console.log("vehiclesWithConnectorTypes:", vehiclesWithConnectorTypes);
                return vehiclesWithConnectorTypes;
            } else {
                console.log("No vehicles found or API response format unexpected");
                return [];
            }
        } catch (err) {
            console.error("Error fetching vehicles:", err);
            setError("Failed to load vehicles.");
            return null;
        } finally {
            setLoading(false);
        }
    }
    const fetchConnectorTypeById = async (connectorTypeId: string): Promise<ConnectorType | null> => {
        try {
            const res = await api.get(`/api/connector-types/${connectorTypeId}`);
            if (res.status === 200) {
                const connector = res.data;
                console.log("=== fetchConnectorTypeById Debug ===");
                console.log("ConnectorTypeId:", connectorTypeId);
                console.log("API Response:", connector);

                return {
                    TypeName: connector.typeName || connector.TypeName || "Unknown",
                    ConnectorTypeId: connector.connectorTypeId || connector.ConnectorTypeId,
                    PowerOutput: connector.powerOutput || connector.PowerOutput || 0,
                    PricePerKWh: connector.pricePerKwh || connector.PricePerKWh || 0,
                } as ConnectorType;
            }
        } catch (err) {
            console.error("Error fetching connector type:", err);
            return null;
        }
        return null;
    }

    // Calculate available charging points by type for a station
    const calculateStationChargingPoints = async (stationId: string) => {
        try {
            const points = await callApiForGetPointsForEachStation(stationId);
            console.log("=== calculateStationChargingPoints Debug ===");
            console.log("Station ID:", stationId);
            console.log("Points:", points);

            if (points && points.length > 0) {
                const typeStats: { [typeName: string]: { total: number, available: number } } = {};

                points.forEach(point => {
                    console.log("Processing point:", point);
                    console.log("ConnectorType:", point.connectorType);
                    const typeName = (point.connectorType as any)?.typeName || (point.connectorType as any)?.TypeName || 'Unknown';
                    console.log("TypeName:", typeName);

                    if (!typeStats[typeName]) {
                        typeStats[typeName] = { total: 0, available: 0 };
                    }
                    typeStats[typeName].total++;
                    if (point.status === 'AVAILABLE') {
                        typeStats[typeName].available++;
                    }
                });

                console.log("Final typeStats:", typeStats);

                setStationChargingPoints(prev => ({
                    ...prev,
                    [stationId]: typeStats
                }));

                // Update total charging points count
                setStationTotalPoints(prev => ({
                    ...prev,
                    [stationId]: points.length
                }));
            }
        } catch (error) {
            console.error('Error calculating station charging points:', error);
        }
    };

    // Search states
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<ChargingStation[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);


    // Auto-load charging points for all stations
    useEffect(() => {
        const loadAllStationChargingPoints = async () => {
            for (const station of stations) {
                if (station.stationId) {
                    await calculateStationChargingPoints(station.stationId.toString());
                }
            }
        };

        if (stations.length > 0) {
            loadAllStationChargingPoints();
        }
    }, [stations]);

    // Search function with scoring mechanism
    const searchStations = (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        const results = stations.map(station => {
            let score = 0;
            const queryLower = query.toLowerCase().trim();

            // Address matching (higher priority)
            if (station.address?.toLowerCase().includes(queryLower)) {
                score += 100; // High score for address match
                // Bonus for exact match
                if (station.address.toLowerCase() === queryLower) {
                    score += 50;
                }
                // Bonus for starts with
                if (station.address.toLowerCase().startsWith(queryLower)) {
                    score += 30;
                }
            }

            // Station name matching (lower priority)
            if (station.stationName?.toLowerCase().includes(queryLower)) {
                score += 50; // Lower score for name match
                // Bonus for exact match
                if (station.stationName.toLowerCase() === queryLower) {
                    score += 25;
                }
                // Bonus for starts with
                if (station.stationName.toLowerCase().startsWith(queryLower)) {
                    score += 15;
                }
            }

            return { station, score };
        })
            .filter(result => result.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(result => result.station);

        setSearchResults(results);
        setShowSearchResults(true);
    };

    // Handle search input change
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        searchStations(value);
    };

    // Handle search result click with smooth transition
    const handleSearchResultClick = (station: ChargingStation) => {
        if (__mapRef.current && station.latitude && station.longitude) {
            setIsNavigating(true);

            // Smooth transition to station
            __mapRef.current.flyTo({
                center: [station.longitude, station.latitude],
                zoom: 15,
                duration: 2000, // 2 seconds smooth transition
                essential: true // This animation is considered essential with respect to prefers-reduced-motion
            });

            // Close search results and reset navigation state
            setTimeout(() => {
                setShowSearchResults(false);
                setSearchQuery("");
                setIsNavigating(false);
            }, 2000); // Match the flyTo duration
        }
    };

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.search-container')) {
                setShowSearchResults(false);
            }
        };

        if (showSearchResults) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showSearchResults]);


    //Start Calling Api
    const callApiForGetStationList = async (): Promise<ChargingStation[] | null> => {
        try {
            const res = await api.get("/api/charging-stations");
            if (res.status == 200) {
                console.log(res.data);
                return (res.data as any[]).map(station => ({
                    stationId: station.stationId,
                    stationName: station.stationName,
                    address: station.address,
                    status: station.status,
                    latitude: station.latitude,
                    longitude: station.longitude,
                    chargingPointNumber: station.chargingPointNumber
                }));
            }
            throw new Error(language === "vi" ? "Không lấy được trạm sạc" : "Unable to fetch station list");

        } catch (err: any) {
            const msg =
                err?.response?.data?.message || language === "vi" ? "Không lấy được trạm sạc" : "Unable to fetch station list";
            toast.error(msg);
            return null;
        }
    }

    const callApiForGetPointsForEachStation = async (stationId: string): Promise<ChargingPoint[] | null> => {
        try {

            const res = await api.get(`api/charging-points/station/${stationId}`);
            if (res.status == 200 && Array.isArray(res.data)) {
                console.log('Fetched charging points for station', stationId, ':', res.data);
                return res.data.map((chargingPoint: any) => ({
                    chargingPointId: chargingPoint.chargingPointId,
                    status: chargingPoint.status,
                    connectorTypeId: chargingPoint.connectorTypeId,
                    stationId: chargingPoint.stationId,
                    connectorType: {
                        ConnectorTypeId: chargingPoint.connectorType.connectorTypeId,
                        TypeName: chargingPoint.connectorType.typeName,
                        PowerOutput: chargingPoint.connectorType.powerOutput,
                        PricePerKWh: chargingPoint.connectorType.pricePerKWh
                    },
                    powerOutput: chargingPoint.powerOutput,
                    pricePerKwh: chargingPoint.pricePerKwh
                } as ChargingPoint))
            }
        } catch (err: any) {
            console.error('Error fetching charging points:', err);
            return null;
        }
        return null;
    }



    // API call to find available slots
    const callApiForFindAvailableSlots = async (
        stationId: string,
        currentBattery?: number,
        targetBattery?: number
    ): Promise<any[] | null> => {
        try {
            const userId = localStorage.getItem("userId");
            if (!userId) {
                throw new Error("User ID not found");
            }

            // Get the actual vehicle ID from the selected vehicle
            const currentVehicle = selectedVehicle || selectedVehicleRef.current;
            if (!currentVehicle) {
                throw new Error("No vehicle selected");
            }

            // Use provided battery levels or defaults
            const batteryLevel = currentBattery ?? initialBatteryLevel;
            const targetLevel = targetBattery ?? targetBatteryLevelConfig;

            console.log("=== Vehicle Object Debug ===");
            console.log("currentVehicle:", currentVehicle);
            console.log("currentVehicle.vehicleId:", currentVehicle.vehicleId);
            console.log("currentVehicle.VehicleId:", currentVehicle.VehicleId);
            console.log("currentVehicle.id:", currentVehicle.id);
            console.log("currentVehicle keys:", Object.keys(currentVehicle));

            // Try to get vehicleId from various possible fields
            const actualVehicleId = currentVehicle.vehicleId || currentVehicle.VehicleId || currentVehicle.id || currentVehicle.vehicle_id;

            if (!actualVehicleId) {
                console.error("Vehicle object structure:", currentVehicle);
                console.log("Available fields:", Object.keys(currentVehicle));

                // If no vehicleId found, we need to find the vehicle by plateNumber
                // and get its ID from the vehicles list
                const plateNumber = currentVehicle.plateNumber;
                console.log("=== Fallback Logic Debug ===");
                console.log("plateNumber:", plateNumber);
                console.log("vehicles.length:", vehicles.length);
                console.log("vehicles:", vehicles);

                if (plateNumber && vehicles.length > 0) {
                    console.log("Searching for vehicle with plateNumber:", plateNumber);
                    // Case-insensitive search
                    const fullVehicle = vehicles.find(v =>
                        v.plateNumber && v.plateNumber.toLowerCase() === plateNumber.toLowerCase()
                    );
                    console.log("Found fullVehicle:", fullVehicle);

                    if (fullVehicle) {
                        console.log("Found full vehicle by plateNumber:", fullVehicle);
                        const foundVehicleId = fullVehicle.vehicleId || fullVehicle.VehicleId || fullVehicle.id || fullVehicle.vehicle_id;
                        console.log("foundVehicleId:", foundVehicleId);

                        if (foundVehicleId) {
                            console.log("Using vehicleId from vehicles list:", foundVehicleId);
                            console.log("foundVehicleId type:", typeof foundVehicleId);

                            // Ensure vehicleId is a valid number
                            const numericVehicleId = typeof foundVehicleId === 'number' ? foundVehicleId : parseInt(foundVehicleId);
                            console.log("numericVehicleId:", numericVehicleId);

                            if (isNaN(numericVehicleId)) {
                                console.error("Invalid vehicleId - not a number:", foundVehicleId);
                                throw new Error("Invalid vehicleId - not a valid number");
                            }

                            // Update the request body to use the found vehicleId
                            const requestBody = {
                                userId: parseInt(userId),
                                vehicleId: numericVehicleId,
                                stationId: parseInt(stationId),
                                currentBattery: batteryLevel, // Double
                                targetBattery: targetLevel   // Double
                            };

                            console.log("=== Find Available Slots Request ===");
                            console.log("Request body:", requestBody);

                            const res = await api.post(`/api/orders/find-available-slots`, requestBody);
                            if (res.status == 200) {
                                return res.data?.data || res.data;
                            }
                            throw new Error(language === "vi" ? "Không tìm thấy slot khả dụng" : "No available slots found");
                        } else {
                            console.log("Found vehicle but no vehicleId in it:", fullVehicle);
                        }
                    } else {
                        console.log("No vehicle found with plateNumber:", plateNumber);
                        console.log("Available plateNumbers:", vehicles.map(v => v.plateNumber));
                        console.log("Searching for:", plateNumber.toLowerCase());
                        console.log("Available (lowercase):", vehicles.map(v => v.plateNumber?.toLowerCase()));
                    }
                } else {
                    console.log("Cannot search - plateNumber:", plateNumber, "vehicles.length:", vehicles.length);
                }

                throw new Error("Vehicle ID not found in selected vehicle and could not find in vehicles list");
            }

            // Ensure vehicleId is a valid number
            const numericVehicleId = typeof actualVehicleId === 'number' ? actualVehicleId : parseInt(actualVehicleId);
            console.log("actualVehicleId:", actualVehicleId, "type:", typeof actualVehicleId);
            console.log("numericVehicleId:", numericVehicleId);

            if (isNaN(numericVehicleId)) {
                console.error("Invalid vehicleId - not a number:", actualVehicleId);
                throw new Error("Invalid vehicleId - not a valid number");
            }

            const requestBody = {
                userId: parseInt(userId),
                vehicleId: numericVehicleId, // Use validated numeric vehicle ID
                stationId: parseInt(stationId),
                currentBattery: batteryLevel, // Current battery % - Double
                targetBattery: targetLevel   // Target battery % - Double
            };

            console.log("=== Find Available Slots Request ===");
            console.log("Request body:", requestBody);

            const res = await api.post(`/api/orders/find-available-slots`, requestBody);
            if (res.status == 200) {
                console.log("=== API Response Debug ===");
                console.log("Raw API response:", res.data);

                const payload: any = res.data?.data || res.data;
                console.log("Response payload:", payload);
                console.log("Available slots:", payload?.availableSlots);
                console.log("Charging points:", payload?.chargingPoints);

                // Backend returns an object (AvailableSlotsResponseDTO), not an array.
                // Normalize to a flat array of available slots for the UI logic.
                const directSlots: any[] = Array.isArray(payload?.availableSlots) ? payload.availableSlots : [];
                const slotsFromPoints: any[] = Array.isArray(payload?.chargingPoints)
                    ? payload.chargingPoints.flatMap((cp: any) => {
                        console.log("=== Processing charging point ===");
                        console.log("Full charging point object:", cp);
                        console.log("Charging point keys:", Object.keys(cp));
                        console.log("Charging point connectorType:", cp.connectorType);
                        console.log("Charging point powerOutput:", cp.powerOutput);
                        console.log("Charging point pricePerKwh:", cp.pricePerKwh);
                        console.log("Charging point connectorTypeId:", cp.connectorTypeId);

                        if (Array.isArray(cp?.availableSlots)) {
                            console.log("Available slots in charging point:", cp.availableSlots.length);
                            // Merge charging point data with each slot
                            return cp.availableSlots.map((slot: any) => {
                                console.log("Processing slot:", slot);
                                const mergedSlot = {
                                    ...slot,
                                    // If slot doesn't have these at top level, try to get from charging point or connector type
                                    connectorType: slot.connectorType || cp.connectorType || cp.connectorTypeName,
                                    powerOutput: slot.powerOutput
                                        || cp.powerOutput
                                        || cp.connectorType?.powerOutput
                                        || slot.connectorType?.powerOutput,
                                    pricePerKwh: slot.pricePerKwh
                                        || cp.pricePerKwh
                                        || cp.connectorType?.pricePerKwh
                                        || slot.connectorType?.pricePerKwh,
                                    chargingPointId: slot.chargingPointId || cp.chargingPointId || cp.id,
                                    chargingPointName: slot.chargingPointName || cp.chargingPointName,  // ✅ NEW
                                    // Add charging point info for reference
                                    chargingPointInfo: {
                                        id: cp.id || cp.chargingPointId,
                                        chargingPointName: cp.chargingPointName,  // ✅ NEW
                                        connectorType: cp.connectorType || slot.connectorType || cp.connectorTypeName,
                                        connectorTypeId: cp.connectorTypeId
                                            || cp.connectorType?.connectorTypeId
                                            || cp.connectorType?.id
                                            || slot.connectorTypeId,
                                        powerOutput: cp.powerOutput
                                            || cp.connectorType?.powerOutput
                                            || slot.powerOutput
                                            || slot.connectorType?.powerOutput
                                            || null,
                                        pricePerKwh: cp.pricePerKwh
                                            || cp.connectorType?.pricePerKwh
                                            || slot.pricePerKwh
                                            || slot.connectorType?.pricePerKwh
                                            || null,
                                        status: cp.status
                                    }
                                };
                                console.log("Merged slot:", mergedSlot);
                                return mergedSlot;
                            });
                        }
                        return [];
                    })
                    : [];
                const mergedSlots: any[] = [...directSlots, ...slotsFromPoints];

                console.log("Direct slots:", directSlots);
                console.log("Slots from charging points:", slotsFromPoints);
                console.log("Final merged slots:", mergedSlots);

                // If slots are missing connector type info, try to fetch it
                const slotsWithConnectorInfo = await Promise.all(
                    mergedSlots.map(async (slot) => {
                        if (!slot.connectorType && slot.chargingPointInfo?.connectorTypeId) {
                            try {
                                // Try to fetch connector type info using the connector type ID
                                const connectorResponse = await fetchConnectorTypeById(slot.chargingPointInfo.connectorTypeId.toString());
                                if (connectorResponse) {
                                    return {
                                        ...slot,
                                        connectorType: connectorResponse,
                                        powerOutput: slot.powerOutput || connectorResponse.PowerOutput,
                                        pricePerKwh: slot.pricePerKwh || connectorResponse.PricePerKWh,
                                        chargingPointInfo: {
                                            ...slot.chargingPointInfo,
                                            connectorType: connectorResponse,
                                            powerOutput: connectorResponse.PowerOutput,
                                            pricePerKwh: connectorResponse.PricePerKWh
                                        }
                                    };
                                }
                            } catch (error) {
                                console.warn("Failed to fetch connector type for charging point:", slot.chargingPointInfo.id);
                            }
                        }
                        return slot;
                    })
                );

                // Log first slot structure for inspection
                if (slotsWithConnectorInfo.length > 0) {
                    console.log("First slot structure:", slotsWithConnectorInfo[0]);
                    console.log("First slot keys:", Object.keys(slotsWithConnectorInfo[0]));
                }

                // Log each slot structure for debugging
                slotsWithConnectorInfo.forEach((slot, index) => {
                    console.log(`Slot ${index}:`, slot);
                    console.log(`  - connectorType:`, slot.connectorType);
                    console.log(`  - powerOutput:`, slot.powerOutput);
                    console.log(`  - pricePerKwh:`, slot.pricePerKwh);
                    console.log(`  - chargingPointId:`, slot.chargingPointId);
                    console.log(`  - freeFrom:`, slot.freeFrom);
                    console.log(`  - freeTo:`, slot.freeTo);
                    console.log(`  - availableMinutes:`, slot.availableMinutes);
                    if (slot.connectorType) {
                        console.log(`  - connectorType.typeName:`, slot.connectorType.typeName);
                        console.log(`  - connectorType.TypeName:`, slot.connectorType.TypeName);
                        console.log(`  - connectorType.powerOutput:`, slot.connectorType.powerOutput);
                        console.log(`  - connectorType.pricePerKwh:`, slot.connectorType.pricePerKwh);
                    }
                });

                return slotsWithConnectorInfo;
            }
            throw new Error(language === "vi" ? "Không tìm thấy slot khả dụng" : "No available slots found");
        } catch (err: any) {
            console.error("Find available slots error:", err);
            console.error("Error response:", err?.response);
            console.error("Error response data:", err?.response?.data);
            console.error("Error response status:", err?.response?.status);
            console.error("Error response headers:", err?.response?.headers);

            // Check if it's the specific "no slots available" error
            const errorMessage = err?.response?.data?.message || "";
            const isNoSlotsError = errorMessage.includes("Không tìm thấy khoảng thời gian") ||
                errorMessage.includes("No available slots");

            if (isNoSlotsError) {
                // Display user-friendly message
                const userMsg = language === "vi"
                    ? "Hiện tại không có khung giờ trống phù hợp. Vui lòng thử lại sau hoặc chọn trạm khác."
                    : "No available time slots at the moment. Please try again later or select another station.";
                toast(userMsg, { icon: "⚠️" });
            } else {
                // Display the actual error message
                const msg = errorMessage || (language === "vi" ? "Đã xảy ra lỗi khi tìm kiếm slot" : "Error finding slots");
                toast.error(msg);
            }
            return null;
        }
    }

    // API call to find available slots and filter by start time on frontend
    const callApiForFindAvailableSlotsWithTime = async (stationId: string, startTime: string, searchDate?: string): Promise<any[] | null> => {
        try {
            const userId = localStorage.getItem("userId");
            if (!userId) {
                throw new Error("User ID not found");
            }

            // Get the actual vehicle ID from the selected vehicle
            const currentVehicle = selectedVehicle || selectedVehicleRef.current;
            if (!currentVehicle) {
                throw new Error("No vehicle selected");
            }

            const actualVehicleId = currentVehicle.vehicleId || currentVehicle.VehicleId || currentVehicle.id || currentVehicle.vehicle_id;

            if (!actualVehicleId) {
                const plateNumber = currentVehicle.plateNumber;
                if (plateNumber && vehicles.length > 0) {
                    const fullVehicle = vehicles.find(v =>
                        v.plateNumber && v.plateNumber.toLowerCase() === plateNumber.toLowerCase()
                    );
                    if (fullVehicle) {
                        const foundVehicleId = fullVehicle.vehicleId || fullVehicle.VehicleId || fullVehicle.id || fullVehicle.vehicle_id;
                        if (foundVehicleId) {
                            console.log("Using found vehicle ID:", foundVehicleId);
                        } else {
                            throw new Error("Vehicle ID not found");
                        }
                    } else {
                        throw new Error("Vehicle not found in vehicles list");
                    }
                } else {
                    throw new Error("No vehicle selected");
                }
            }

            const requestData: any = {
                userId: parseInt(userId),
                vehicleId: actualVehicleId,
                stationId: parseInt(stationId),
                currentBattery: parseFloat(initialBatteryLevel.toString()), // Convert to Double
                targetBattery: parseFloat(targetBatteryLevelConfig.toString()) // Convert to Double
            };

            // Add searchDate if provided (for future date searches)
            if (searchDate) {
                requestData.searchDate = searchDate;
                console.log("=== Searching slots for specific date ===");
                console.log("Search date:", searchDate);
            } else {
                console.log("=== Searching slots for today ===");
            }

            console.log("=== Requesting available slots ===");
            console.log("Request data:", requestData);

            const response = await api.post("/api/orders/find-available-slots", requestData);
            console.log("API response:", response.data);

            if (response.data?.success && response.data?.data) {
                const payload = response.data.data;
                console.log("Response payload:", payload);

                // Process the response similar to the original function
                const directSlots: any[] = Array.isArray(payload?.availableSlots) ? payload.availableSlots : [];
                const slotsFromPoints: any[] = Array.isArray(payload?.chargingPoints)
                    ? payload.chargingPoints.flatMap((cp: any) => {
                        if (Array.isArray(cp?.availableSlots)) {
                            return cp.availableSlots.map((slot: any) => ({
                                ...slot,
                                chargingPointInfo: {
                                    id: cp.chargingPointId,
                                    chargingPointName: cp.chargingPointName,  // ✅ NEW
                                    connectorType: cp.connectorTypeName,
                                    powerOutput: cp.chargingPower,
                                    pricePerKwh: cp.pricePerKwh
                                }
                            }));
                        }
                        return [];
                    })
                    : [];

                const allSlots = [...directSlots, ...slotsFromPoints];
                console.log("All slots found:", allSlots.length);

                // Filter slots that start at or after the preferred start time
                const filteredSlots = allSlots.filter(slot => {
                    if (slot.freeFrom) {
                        const slotStartTime = new Date(slot.freeFrom);
                        const preferredTime = new Date(startTime);

                        // Only include slots that start AT or AFTER the preferred time
                        const isValid = slotStartTime >= preferredTime;
                        
                        console.log("=== Time Filtering Debug ===");
                        console.log("Slot start time:", slotStartTime.toISOString());
                        console.log("Preferred time:", preferredTime.toISOString());
                        console.log("Slot start >= preferred:", isValid);

                        return isValid;
                    }
                    return false; // Exclude slots without time info when filtering by time
                });

                console.log("Filtered slots by start time:", filteredSlots.length);
                console.log("Total slots before filter:", allSlots.length);

                return filteredSlots;
            }
            throw new Error(language === "vi" ? "Không tìm thấy slot khả dụng" : "No available slots found");
        } catch (err: any) {
            console.error("Find available slots with time error:", err);
            console.error("Error response:", err?.response);
            console.error("Error response data:", err?.response?.data);
            console.error("Error response status:", err?.response?.status);
            console.error("Error response headers:", err?.response?.headers);

            // Check if it's the specific "no slots available" error
            const errorMessage = err?.response?.data?.message || "";
            const isNoSlotsError = errorMessage.includes("Không tìm thấy khoảng thời gian") ||
                errorMessage.includes("No available slots");

            if (isNoSlotsError) {
                // Display user-friendly message
                const userMsg = language === "vi"
                    ? "Hiện tại không có khung giờ trống phù hợp. Vui lòng thử lại sau hoặc chọn trạm khác."
                    : "No available time slots at the moment. Please try again later or select another station.";
                toast(userMsg, { icon: "⚠️" });
            } else {
                // Display the actual error message
                const msg = errorMessage || (language === "vi" ? "Đã xảy ra lỗi khi tìm kiếm slot" : "Error finding slots");
                toast.error(msg);
            }
            return null;
        }
    }

    // Handle start time selection and show available slots popup
    const handleStartTimeSelection = async (selectedDate?: string, selectedStartTime?: string) => {
        if (!configStation) return;

        if (!selectedDate) {
            toast(language === 'vi' ? 'Vui lòng chọn ngày sạc' : 'Please select a charging date', { icon: "⚠️" });
            return;
        }

        if (!selectedStartTime) {
            toast(language === 'vi' ? 'Vui lòng chọn giờ bắt đầu' : 'Please select a start time', { icon: "⚠️" });
            return;
        }

        clearScheduledResults();
        setLoadingSlots(true);
        setExpandedChargingPoints(new Set()); // Reset expanded points when time changes
        setShowAvailableSlots(false); // Reset show available slots when time changes
        setSelectedSlots([]); // Reset selected slots when time changes
        try {
            const [year, month, day] = selectedDate.split('-').map(Number);
            const [hours, minutes] = selectedStartTime.split(':').map(Number);
            const selectedDateTime = new Date(
                year ?? 0,
                (month ?? 1) - 1,
                day ?? 1,
                hours ?? 0,
                minutes ?? 0
            );

            if (isNaN(selectedDateTime.getTime())) {
                toast.error(language === 'vi' ? 'Ngày hoặc giờ không hợp lệ' : 'Invalid date or time');
                setLoadingSlots(false);
                return;
            }

            setScheduledDate(selectedDate);
            setScheduledTime(selectedStartTime);

            const displayLabel = selectedDateTime.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            setChargingStartTimeInput(displayLabel);

            console.log("=== Start Time Selection Debug ===");
            console.log("Input date:", selectedDate);
            console.log("Input time:", selectedStartTime);
            console.log("Combined datetime:", selectedDateTime.toISOString());
            console.log("Station ID:", configStation.stationId);

            // Check if search date is different from today
            const today = new Date();
            const todayDateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
            const isSearchingFutureDate = selectedDate !== todayDateStr;

            console.log("Today:", todayDateStr);
            console.log("Selected date:", selectedDate);
            console.log("Is searching future date:", isSearchingFutureDate);

            const slots = await callApiForFindAvailableSlotsWithTime(
                configStation.stationId?.toString() || '',
                selectedDateTime.toISOString(),
                isSearchingFutureDate ? selectedDate : undefined // Only pass searchDate if not today
            );

            if (slots && slots.length > 0) {
                setAvailableSlots(slots);
                setFilteredSlots(slots);
                setSelectedSlot(null); // Reset selected slot when time changes
                setSelectedSlots([]); // Reset selected slots when time changes
            } else {
                setAvailableSlots([]);
                setFilteredSlots([]);
                setSelectedSlot(null);
                setSelectedSlots([]);
                toast(
                    language === 'vi'
                        ? 'Không có slot khả dụng cho thời gian đã chọn'
                        : 'No available slots for the selected time'
                );
            }
        } catch (error) {
            console.error("Error fetching filtered slots:", error);
            setAvailableSlots([]);
            setFilteredSlots([]);
            setSelectedSlot(null);
            setSelectedSlots([]);
            toast.error(
                language === 'vi'
                    ? 'Lỗi khi tải slot khả dụng'
                    : 'Error loading available slots'
            );
        } finally {
            setLoadingSlots(false);
        }
    };

    // API call to check if vehicle is currently charging
    const checkVehicleChargingStatus = async (vehicleId: number): Promise<boolean> => {
        try {
            setLoadingVehicleStatus(true);
            console.log("=== Checking vehicle charging status ===");
            console.log("Vehicle ID:", vehicleId);
            
            const response = await checkVehicleChargingStatusAPI(vehicleId, language);
            console.log("Vehicle charging status response:", response);
            
            if (response?.success && response?.data) {
                const { isCurrentlyCharging, canBookNow, message } = response.data;
                console.log("Vehicle is currently charging:", isCurrentlyCharging);
                console.log("Can book now:", canBookNow);
                console.log("Message:", message);
                return isCurrentlyCharging;
            }
            
            // If no valid response, assume not charging
            return false;
        } catch (err: any) {
            console.error("Error checking vehicle charging status:", err);
            // For errors, assume not charging to allow user to proceed
            return false;
        } finally {
            setLoadingVehicleStatus(false);
        }
    };

    // API call to confirm booking - using function from api/confirmBooking.ts
    const callApiForConfirmBooking = async (bookingData: any): Promise<any | null> => {
        try {
            const result = await confirmBooking(bookingData, language);
            return result;
        } catch (err: any) {
            console.error("=== API CONFIRM BOOKING ERROR ===");
            console.error("Error:", err);
            
            // Show toast with error message from API function
            toast.error(err?.message || (language === "vi" ? "Xác nhận đặt chỗ thất bại" : "Booking confirmation failed"));
            return null;
        }
    }

    const normalizeOrderResponse = (orderResponse: any) => {
        if (!orderResponse) return null;
        return orderResponse.data ?? orderResponse;
    };

    const storeCurrentStationContext = (orderData: any, fallbackStation?: ChargingStation | null, slotContext?: any) => {
        const info: StoredStationContext = {
            stationId: orderData?.stationId ?? fallbackStation?.stationId ?? undefined,
            stationName: orderData?.stationName ?? fallbackStation?.stationName ?? undefined,
            stationAddress: orderData?.stationAddress ?? fallbackStation?.address ?? (fallbackStation as any)?.stationAddress ?? undefined,
            connectorType: orderData?.connectorType ?? slotContext?.connectorTypeName ?? slotContext?.connectorType ?? undefined,
            chargingPower: typeof orderData?.chargingPower === "number"
                ? orderData.chargingPower
                : (slotContext?.powerOutput != null && !isNaN(Number(slotContext.powerOutput))
                    ? Number(slotContext.powerOutput)
                    : undefined),
            pricePerKwh: typeof orderData?.pricePerKwh === "number"
                ? orderData.pricePerKwh
                : (slotContext?.pricePerKwh != null && !isNaN(Number(slotContext.pricePerKwh))
                    ? Number(slotContext.pricePerKwh)
                    : undefined),
        chargingPointName: orderData?.chargingPointName
            ?? slotContext?.chargingPointName
            ?? slotContext?.chargingPointInfo?.chargingPointName
            ?? slotContext?.chargingPointInfo?.name,
            timestamp: new Date().toISOString(),
        };

        try {
            localStorage.setItem("currentStationInfo", JSON.stringify(info));
            if (info.stationId !== undefined) {
                localStorage.setItem("currentStationId", info.stationId.toString());
            }
        } catch (storageError) {
            console.error("Unable to persist station context:", storageError);
        }
    };

    const fetchSessionByOrderId = async (orderId: number | string) => {
        try {
            const response = await api.get(`/api/sessions/by-order/${orderId}`);
            if (response.status === 200 && response.data?.success && response.data?.data) {
                return response.data.data;
            }
        } catch (error) {
            console.error("Error fetching session by orderId:", error);
        }
        return null;
    };

    const tryRecoverExistingSession = async (
        error: any,
        orderId: number | string
    ): Promise<boolean> => {
        const message: string | undefined = error?.response?.data?.message || error?.message;
        if (error?.response?.status === 400 && message) {
            const normalizedMessage = message.toLowerCase();
            if (normalizedMessage.includes("order not in booked status") ||
                normalizedMessage.includes("already") ||
                normalizedMessage.includes("charging")) {
                const existingSession = await fetchSessionByOrderId(orderId);
                if (existingSession?.sessionId) {
                    localStorage.setItem("currentSessionId", existingSession.sessionId.toString());
                    localStorage.setItem("currentOrderId", orderId.toString());
                    toast.success(
                        language === "vi"
                            ? "Phiên sạc đã được khôi phục."
                            : "Charging session restored."
                    );
                    onStartCharging?.(orderId.toString());
                    return true;
                }
            }
        }

        // Nếu API trả về 404 mà vẫn có order CHARGING, thử khôi phục thủ công
        if (error?.response?.status === 404) {
            const existingSession = await fetchSessionByOrderId(orderId);
            if (existingSession?.sessionId) {
                localStorage.setItem("currentSessionId", existingSession.sessionId.toString());
                localStorage.setItem("currentOrderId", orderId.toString());
                toast.success(
                    language === "vi"
                        ? "Phiên sạc đã được khôi phục."
                        : "Charging session restored."
                );
                onStartCharging?.(orderId.toString());
                return true;
            }
        }

        return false;
    };

    // Handle loading charging points for a station
    const handleLoadChargingPoints = async (stationId: string) => {
        console.log('handleLoadChargingPoints called with stationId:', stationId);
        console.log('Current expandedStationId:', expandedStationId);

        // If already expanded, collapse it
        if (expandedStationId === stationId) {
            console.log('Collapsing expanded station');
            setExpandedStationId(null);
            setChargingPoints([]);
            return;
        }

        console.log('Loading charging points for station:', stationId);
        setLoadingPoints(true);

        try {
            const points = await callApiForGetPointsForEachStation(stationId);
            console.log('API response:', points);
            console.log('Points length:', points?.length);

            if (points && points.length > 0) {
                console.log('Setting charging points and expanded station');
                setChargingPoints(points);
                setExpandedStationId(stationId);
                console.log('Charging points loaded successfully:', points.length);
            } else {
                console.log('No charging points found');
                setChargingPoints([]);
                setExpandedStationId(stationId); // Still expand to show empty state
                toast(language === 'vi' ? 'Không tìm thấy trụ sạc nào' : 'No charging points found', { icon: "⚠️" });
            }
        } catch (error) {
            console.error('Error loading charging points:', error);
            toast.error(language === 'vi' ? 'Lỗi khi tải danh sách trụ sạc' : 'Error loading charging points');
        } finally {
            setLoadingPoints(false);
        }
    }


    //End calling api

    //Xử lý api trung gian

    const handleGetStationList = async () => {
        try {
            const list = await callApiForGetStationList();
            if (list && list.length > 0) {
                console.log("Stations loaded:", list);
                setStations(list);
            } else {
                console.log("No stations found");
                setStations([]);
                toast("No stations found", { icon: "⚠️" });
            }
            return list;
        } catch (err: any) {
            console.error("Error loading stations:", err);
            setStations([]);
            toast.error("Failed to load stations");
        }
    }



    useEffect(() => { handleGetStationList() }, [refreshTrigger]);

    // Auto-get user location on component mount
    useEffect(() => {
        getUserLocation();
    }, []);

    // Auto-select nearest station when user location and stations are available
    useEffect(() => {
        if (userLocation && stations.length > 0 && !selectedStation && !hasAutoSelectedRef.current) {
            // Enable distance sorting
            setSortByDistance(true);
            
            // Calculate distances and find nearest station
            const stationsWithDistance = stations
                .filter(station => station.latitude && station.longitude && station.status === "ACTIVE")
                .map(station => ({
                    station,
                    distance: calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        station.latitude || 0,
                        station.longitude || 0
                    )
                }))
                .sort((a, b) => a.distance - b.distance);

            if (stationsWithDistance.length > 0) {
                const firstStation = stationsWithDistance[0]!;
                if (firstStation.station) {
                    const nearestStation = firstStation.station;
                    setSelectedStation(nearestStation);
                    hasAutoSelectedRef.current = true;
                    
                    // Center map on nearest station
                    if (nearestStation.latitude && nearestStation.longitude) {
                        setMapCenter({ lat: nearestStation.latitude, lng: nearestStation.longitude });
                    }
                }
            }
        }
    }, [userLocation, stations, selectedStation]);

    // Load vehicles on component mount
    useEffect(() => {
        const loadVehicles = async () => {
            setLoadingVehicles(true);
            try {
                if (userId) {
                    const vehiclesList = await getVehicleOfDriver(userId);
                    console.log("=== loadVehicles Debug ===");
                    console.log("vehiclesList:", vehiclesList);
                    console.log("vehiclesList.length:", vehiclesList?.length);

                    if (vehiclesList && vehiclesList.length > 0) {
                        setVehicles(vehiclesList);
                        console.log("Set vehicles to:", vehiclesList);
                    } else {
                        console.log("No vehicles found or empty list");
                    }
                    // Only show popup if no vehicle is selected
                    if (!selectedVehicle) {
                        setIsVehicleSelectionOpen(true);
                    }
                } else {
                    console.error("No userId found");
                    if (!selectedVehicle) {
                        setIsVehicleSelectionOpen(true);
                    }
                }
            } catch (error) {
                console.error("Error loading vehicles:", error);
                // Even if API fails, show popup if no vehicle selected
                if (!selectedVehicle) {
                    setIsVehicleSelectionOpen(true);
                }
            } finally {
                setLoadingVehicles(false);
            }
        };

        loadVehicles();
    }, [userId]); // Run when userId changes

    // Close popup when vehicle is selected
    useEffect(() => {
        console.log("=== selectedVehicle useEffect ===");
        console.log("selectedVehicle changed to:", selectedVehicle);
        if (selectedVehicle) {
            console.log("Vehicle selected, closing popup");
            selectedVehicleRef.current = selectedVehicle;
            setIsVehicleSelectionOpen(false);
        }
    }, [selectedVehicle]);

    //Kết thúc api trung gian

    // Function to calculate distance between two points (current vs target)
    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in kilometers
    };

    // Function to get user's current location
    const getUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setUserLocation({ lat, lng });
                },
                (error) => {
                    console.error("Error getting location:", error);
                }
            );
        } else {
            toast.error("Geolocation is not supported by this browser");
        }
    };

    //Không gây re-render mỗi lần có sự thay đổi trong list trạm
    const refreshStations = async () => {
        setLoading(true);
        toast.info(language === "vi" ? "Đang cập nhật dữ liệu..." : "Updating data...");

        try {
            await handleGetStationList();
            toast.success(language === "vi" ? "Cập nhật thành công!" : "Data updated successfully!");
        } catch (error) {
            toast.error(language === "vi" ? "Cập nhật thất bại!" : "Update failed!");
        } finally {
            setLoading(false);
        }
    };

    //Sửa mấy cái phụ


    // Advanced Filters State

    // const [filters, setFilters] = useState<FilterState>({
    //   priceRange: [0, 10000],
    //   powerLevels: [],
    //   amenities: [],
    //   operators: [],
    //   availableOnly: false,
    //   fastChargingOnly: false,
    //   open24h: false
    // });


    // Mock current user ID (in real app, get from auth context)

    const currentUserId = "user-001"; // Has premium subscription

    const userSubscription = getCurrentUserSubscription(currentUserId);

    const subscriptionPlan = userSubscription ? getSubscriptionPlan(userSubscription.planId) : null;



    // Handler for opening station details

    const handleViewDetails = async (station: ChargingStation) => {
        // Check if station is ACTIVE
        if (station.status !== "ACTIVE") {
            toast(
                language === 'vi'
                    ? 'Trạm này không hoạt động, không thể đặt lịch sạc'
                    : 'This station is not active, cannot book charging'
            );
            return;
        }

        // Load charging points data if not already loaded
        if (!stationTotalPoints[station.stationId?.toString() || '']) {
            await calculateStationChargingPoints(station.stationId?.toString() || '');
        }

        // Check if station has available charging points
        const stationPoints = stationChargingPoints[station.stationId?.toString() || ''];
        if (stationPoints) {
            const hasAvailablePoints = Object.values(stationPoints).some(stats => stats.available > 0);
            if (!hasAvailablePoints) {
                toast(
                    language === 'vi'
                        ? 'Trạm này không còn trụ sạc trống, không thể đặt lịch'
                        : 'This station has no available charging points, cannot book'
                );
                return;
            }
        } else {
            // If we don't have charging points data yet, show warning but still allow booking
            toast.info(
                language === 'vi'
                    ? 'Đang kiểm tra trạng thái trụ sạc...'
                    : 'Checking charging points status...'
            );
        }

        setDetailsStation(station);
        setIsDetailsDialogOpen(true);
    };

    // Handler for dialog open change
    const handleChargingConfigOpenChange = (open: boolean) => {
        setIsChargingConfigOpen(open);
        if (!open) {
            setExpandedChargingPoints(new Set());
            setSelectedSlot(null);
            setSelectedSlots([]);
            setShowAvailableSlots(false);
        }
    };

    // Handler for opening charging configuration
    const handleOpenChargingConfig = async (station: ChargingStation) => {
        console.log("=== handleOpenChargingConfig called ===");
        console.log("Station:", station);
        console.log("selectedVehicle state:", selectedVehicle);
        console.log("selectedVehicleRef.current:", selectedVehicleRef.current);

        // Use ref value if state is null but ref has value
        const currentVehicle = selectedVehicle || selectedVehicleRef.current;
        console.log("currentVehicle:", currentVehicle);

        // Check if vehicle is selected
        if (!currentVehicle) {
            console.log("No vehicle selected, showing popup");
            toast(
                language === 'vi'
                    ? 'Vui lòng chọn xe trước khi đặt lịch sạc'
                    : 'Please select a vehicle before booking'
            );
            setIsVehicleSelectionOpen(true);
            return;
        }

        console.log("Vehicle is selected, proceeding with booking");

        // Check if vehicle is currently charging (re-check before opening dialog)
        const vehicleId = currentVehicle.vehicleId || currentVehicle.VehicleId || currentVehicle.id;
        if (vehicleId) {
            const isCharging = await checkVehicleChargingStatus(vehicleId);
            setIsVehicleCurrentlyCharging(isCharging);
            
            if (isCharging) {
                console.log("Vehicle is currently charging, showing warning");
                toast(
                    language === 'vi'
                        ? 'Xe này đang trong quá trình sạc. Bạn chỉ có thể đặt lịch sạc tiếp theo.'
                        : 'This vehicle is currently charging. You can only schedule the next charging session.',
                    { duration: 5000 }
                );
                // Still open dialog but with Book Now disabled
            }
        }

        // Check if station is ACTIVE
        if (station.status !== "ACTIVE") {
            toast(
                language === 'vi'
                    ? 'Trạm này không hoạt động, không thể đặt lịch sạc'
                    : 'This station is not active, cannot book charging'
            );
            return;
        }

        // Call find-available-slots API
        setLoadingSlots(true);
        try {
            const slots = await callApiForFindAvailableSlots(
                station.stationId?.toString() || ''
            );

            console.log("=== Slots received ===");
            console.log("Slots count:", slots?.length || 0);
            console.log("Slots data:", slots);

            if (slots && slots.length > 0) {
                setAvailableSlots(slots);
                setConfigStation(station);
                setIsChargingConfigOpen(true);
            } else {
                console.warn("No slots returned from API");
                toast(
                    language === 'vi'
                        ? 'Không có slot khả dụng phù hợp với xe của bạn'
                        : 'No available slots suitable for your vehicle'
                );
                // Still open dialog to show "no slots" message
                setAvailableSlots([]);
                setConfigStation(station);
                setIsChargingConfigOpen(true);
            }
        } catch (error) {
            console.error("Error checking available slots:", error);
            toast.error(
                language === 'vi'
                    ? 'Lỗi khi kiểm tra slot khả dụng'
                    : 'Error checking available slots'
            );
        } finally {
            setLoadingSlots(false);
        }
    };

    // Cleanup charging interval on unmount

    //useEffect
    useEffect(() => {

        return () => {

            if (chargingIntervalRef) {

                clearInterval(chargingIntervalRef);

            }

        };

    }, [chargingIntervalRef]);

    // Add function to window for popup onclick
    useEffect(() => {
        (window as any).handleOpenChargingConfig = (station: any) => {
            console.log('Button clicked, station:', station);
            handleOpenChargingConfig(station);
        };
        return () => {
            delete (window as any).handleOpenChargingConfig;
        };
    }, [handleOpenChargingConfig]);

    //Mount bản đồ
    useEffect(() => {
        if (!mapContainerRef.current || __mapRef.current) {
            console.log("Skipping map init - container not ready or map already exists");
            return;
        }

        // Kiểm tra API key
        const RAW_MAPTILER_API_KEY = (import.meta.env.VITE_MAPTILER_API_KEY ?? "").toString().trim();
        const MAPTILER_API_KEY =
            RAW_MAPTILER_API_KEY && RAW_MAPTILER_API_KEY !== "get_your_free_key_from_maptiler_cloud" && RAW_MAPTILER_API_KEY !== ""
                ? RAW_MAPTILER_API_KEY
                : null;

        try {
            console.log("Initializing map...");
            let map: maptilersdk.Map;

            if (!MAPTILER_API_KEY) {
                console.warn("MAPTILER_API_KEY not configured, using basic map fallback");
                
                // Use OpenStreetMap as fallback
                map = new maptilersdk.Map({
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
            } else {
                // Use configured API key
                const customStyleUrl = `https://api.maptiler.com/maps/019983ed-809a-7bba-8d9b-f5f42a71219e/style.json?key=${MAPTILER_API_KEY}`;
                map = new maptilersdk.Map({
                    container: mapContainerRef.current,
                    style: customStyleUrl,
                    center: defaultCenterLngLat,
                    zoom: mapZoom,
                    hash: false,
                });
            }

            __mapRef.current = map;

            map.on('load', () => {
                console.log("Map đã load thành công");
            });

            map.on('error', (e: any) => {
                console.error("Map error:", e);
                toast.error("Lỗi khi tải bản đồ");
            });

            map.on("moveend", () => {
                const z = Math.max(1, Math.min(22, map.getZoom()));
                setMapZoom(Number(z.toFixed(0)));
                const c = map.getCenter();
                setMapCenter({ lat: c.lat, lng: c.lng });
            });

            return () => {
                try {
                    markersRef.current.forEach((m) => m.remove());
                    poiMarkersRef.current.forEach((m) => m.remove());
                    if (tempMarker) {
                        tempMarker.remove();
                    }
                    markerMapRef.current.clear();
                    if (__mapRef.current) {
                        __mapRef.current.remove();
                    }
                    __mapRef.current = null;
                    console.log("Map cleaned up");
                } catch (err) {
                    console.error("Error cleaning up map:", err);
                }
            };

        } catch (e) {
            console.error("Map init error:", e);
            toast.error("Không thể khởi tạo bản đồ");
        }
    }, []);

    //Add marker
    useEffect(() => {
        if (!__mapRef.current || stations.length === 0) {
            console.log("Map not ready or no stations");
            return;
        }

        const map = __mapRef.current;

        // Xóa marker cũ
        markerMapRef.current.forEach((marker) => marker.remove());
        markerMapRef.current.clear();
        markersRef.current = []; // Reset array ref nếu dùng

        // Hiển thị stations theo bộ lọc (bao gồm lọc theo connector của xe đã chọn nếu có)
        const requiredConnectorTypeName = (selectedVehicle || selectedVehicleRef.current)?.connectorTypeName;
        const allStations = stations.filter(station => {
            const baseValid = station.latitude && station.longitude && station.stationId;
            if (!baseValid) return false;
            if (!requiredConnectorTypeName) return true;
            const stationIdKey = station.stationId?.toString() || '';
            const typeStatsForStation = stationChargingPoints[stationIdKey];
            return !!(typeStatsForStation && typeStatsForStation[requiredConnectorTypeName] && typeStatsForStation[requiredConnectorTypeName].total > 0);
        });
        const activeCount = stations.filter(s => (s.status || '').toUpperCase().trim() === 'ACTIVE').length;
        setNumberOfActiveStation(activeCount);

        const inactiveCount = stations.filter(s => (s.status || '').toUpperCase().trim() === 'INACTIVE').length;
        setNumberOfInactiveStation(inactiveCount);

        const maintainCount = stations.filter(s => (s.status || '').toUpperCase().trim() === 'MAINTENANCE').length;
        setNumberOfMaintainedStation(maintainCount);

        allStations.forEach((station) => {
            // Tạo element cho marker (tùy chỉnh icon)
            const markerElement = document.createElement("div");
            markerElement.className = "relative";

            // Định nghĩa màu sắc và icon theo trạng thái
            let backgroundColor = "#6b7280"; // Màu mặc định (xám)
            let iconColor = "#ffffff";

            switch (station.status) {
                case "ACTIVE":
                    backgroundColor = "#10b981"; // Xanh lá - Trạm hoạt động
                    break;
                case "INACTIVE":
                    backgroundColor = "#f59e0b"; // Vàng cam - Trạm không hoạt động
                    break;
                case "MAINTENANCE":
                    backgroundColor = "#ef4444"; // Đỏ - Trạm bảo trì
                    break;
                default:
                    backgroundColor = "#6b7280"; // Xám - Trạng thái không xác định
            }

            markerElement.innerHTML = `
        <div class="w-10 h-10 rounded-full border-4 border-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110" 
             style="background-color: ${backgroundColor};">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </div>
    `;

            markerElement.style.cursor = "pointer";

            // Tạo marker
            const marker = new maptilersdk.Marker({
                element: markerElement,
                anchor: "bottom"
            })
                .setLngLat([station.longitude!, station.latitude!])
                .addTo(map);

            // Thêm popup khi click với màu sắc tương ứng
            const statusColor = backgroundColor;
            const statusText = station.status === "ACTIVE" ? "Hoạt động" :
                station.status === "INACTIVE" ? "Không hoạt động" :
                    station.status === "MAINTENANCE" ? "Bảo trì" : "Không xác định";

            const popup = new maptilersdk.Popup({ offset: 25 })
                .setHTML(`
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-gray-900 text-base">${station.stationName || "Unknown"}</h3>
          </div>
          
          <div class="space-y-2 mb-4">
            <div class="flex items-center space-x-2">
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <p class="text-sm text-gray-600">${station.address || "No address"}</p>
            </div>
            
            <div class="flex items-center space-x-2">
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              <p class="text-sm text-gray-600">${station.chargingPointNumber || 0} điểm sạc</p>
            </div>
            
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 rounded-full" style="background-color: ${statusColor};"></div>
              <p class="text-sm text-gray-600">Trạng thái: <span class="font-medium" style="color: ${statusColor};">${statusText}</span></p>
            </div>
          </div>
          
          <button id="booking-btn-${station.stationId}" class="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-200 flex items-center justify-center space-x-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            <span>Đặt lịch sạc</span>
          </button>
        </div>
      `);

            marker.setPopup(popup);

            // Add event listener after popup is created
            popup.on('open', () => {
                setTimeout(() => {
                    const button = document.getElementById(`booking-btn-${station.stationId}`);
                    if (button) {
                        button.addEventListener('click', (e) => {
                            e.stopPropagation();
                            console.log('Button clicked via event listener!');
                            handleOpenChargingConfig(station);
                        });
                    }
                }, 100);
            });

            // Lưu marker vào ref
            markerMapRef.current.set(station.stationId!.toString(), marker);
            markersRef.current.push(marker);
        });

        console.log(`Added ${allStations.length} station markers with color coding`);

    }, [stations, stationChargingPoints, selectedVehicle]); // Theo dõi stations & vehicle & chargingPoints thay đổi


    //hết useEffect
    // Enhanced charging stations data



    // Filtered stations based on search and filters
    console.log("All stations:", stations);
    console.log("Stations length:", stations.length);

    // Determine required connector type name from selected vehicle, if any
    const requiredConnectorTypeName = (selectedVehicle || selectedVehicleRef.current)?.connectorTypeName;

    const filteredStations = stations.filter(station => {
        console.log("Filtering station:", station);
        const matchesSearch = station.stationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            station.address?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesAvailable = station.status === "ACTIVE" || "INACTIVE" || "MAINTENANCE";
        const matchesFastCharging = true;
        const matches24h = true;

        // Filter by connector type of selected vehicle (if present)
        let matchesConnector = true;
        if (requiredConnectorTypeName) {
            const stationIdKey = station.stationId?.toString() || '';
            const typeStatsForStation = stationChargingPoints[stationIdKey];
            matchesConnector = !!(typeStatsForStation && typeStatsForStation[requiredConnectorTypeName] && typeStatsForStation[requiredConnectorTypeName].total > 0);
        }

        console.log("Station matches:", {
            stationName: station.stationName,
            status: station.status,
            matchesSearch,
            matchesAvailable,
            matchesFastCharging,
            matches24h,
            requiredConnectorTypeName,
            matchesConnector
        });

        return matchesSearch && matchesAvailable && matchesFastCharging && matches24h && matchesConnector;

    }).sort((a, b) => {
        if (sortByDistance && userLocation) {
            const distanceA = calculateDistance(
                userLocation.lat,
                userLocation.lng,
                a.latitude || 0,
                a.longitude || 0
            );
            const distanceB = calculateDistance(
                userLocation.lat,
                userLocation.lng,
                b.latitude || 0,
                b.longitude || 0
            );
            return distanceA - distanceB;
        }
        return 0;
    });

    // Pagination logic
    const totalFilteredStations = filteredStations.length;
    const totalPagesCalculated = Math.ceil(totalFilteredStations / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedStations = filteredStations.slice(startIndex, endIndex);

    // Update total pages when filtered stations change
    useEffect(() => {
        setTotalPages(totalPagesCalculated);
        // Reset to first page if current page is beyond available pages
        if (currentPage > totalPagesCalculated && totalPagesCalculated > 0) {
            setCurrentPage(1);
        }
    }, [filteredStations.length, currentPage, totalPagesCalculated]);

    console.log("Filtered stations:", filteredStations);
    console.log("Filtered stations length:", filteredStations.length);

    const calculateEstimatedCost = () => {

        if (!selectedStation) return { originalPrice: 0, discountedPrice: 0, discount: 0, discountAmount: 0, chargingTime: 0, kwhNeeded: 0 };



        // Calculate kWh needed based on battery levels

        const batteryDifference = Math.max(0, targetBatteryLevel - currentBatteryLevel);

        const kwhNeeded = (batteryDifference / 100) * 75; // Assume 75kWh battery capacity for Tesla Model 3



        if (kwhNeeded <= 0) {

            return { originalPrice: 0, discountedPrice: 0, discount: 0, discountAmount: 0, chargingTime: 0, kwhNeeded: 0 };

        }



        // Get price per kWh from station (default price)
        const pricePerKwh = 3500;


        // Calculate base price based on kWh needed

        const basePrice = Math.round(kwhNeeded * pricePerKwh);



        // Calculate estimated charging time based on charger power

        let chargingPowerKw = 22; // Default AC charging



        const chargingTimeHours = kwhNeeded / chargingPowerKw;

        const chargingTime = Math.ceil(chargingTimeHours * 60); // Convert to minutes



        // Apply subscription discount

        const pricingInfo = calculateDiscountedPrice(basePrice, userSubscription);

        return {

            ...pricingInfo,

            chargingTime,

            kwhNeeded: Math.round(kwhNeeded * 10) / 10 // Round to 1 decimal

        };

    };



    // Calculate route details when station is selected

    const calculateRouteDetails = (station: ChargingStation) => {

        const baseDistance = 2.5; // Default distance
        const steps = [

            {

                instruction: "Head north on current street",

                distance: `${Math.round(baseDistance * 0.2 * 100) / 100} km`,

                direction: "north"

            },

            {

                instruction: "Turn right onto main road",

                distance: `${Math.round(baseDistance * 0.3 * 100) / 100} km`,

                direction: "right"

            },

            {

                instruction: "Continue straight for 2.1 km",

                distance: `${Math.round(baseDistance * 0.35 * 100) / 100} km`,

                direction: "straight"

            },

            {

                instruction: `Turn left into ${station.stationName}`,
                distance: `${Math.round(baseDistance * 0.15 * 100) / 100} km`,

                direction: "left"

            }

        ];



        const durationMinutes = Math.max(5, Math.round(baseDistance * 2.5)); // Estimate 2.5 min per km in city traffic

        const durationHours = Math.floor(durationMinutes / 60);

        const remainingMinutes = durationMinutes % 60;



        let durationString;

        if (durationHours > 0) {

            durationString = `${durationHours}h ${remainingMinutes}m`;

        } else {

            durationString = `${remainingMinutes} min`;

        }



        return {

            distance: `${baseDistance} km`,

            duration: durationString,

            steps

        };

    };

    const handleBooking = () => {

        if (!selectedStation || !selectedTimeSlot || targetBatteryLevel <= currentBatteryLevel) return;



        // Create booking data


        const costInfo = calculateEstimatedCost();



        // Check if booking is for "Now" or future time

        const isImmediateBooking = selectedTimeSlot === "now";



        // Parse time data for future bookings

        let bookingDate, bookingTime;

        if (isImmediateBooking) {

            bookingDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format

            bookingTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); // HH:MM format

        } else {

            // Parse future time slot

            const now = new Date();

            if (selectedTimeSlot.includes('h') && !selectedTimeSlot.includes('tomorrow') && !selectedTimeSlot.includes('nextweek')) {

                // Today's booking (1h, 2h, etc.)

                const hoursFromNow = parseInt(selectedTimeSlot.replace('h', ''));

                const futureTime = new Date(now.getTime() + hoursFromNow * 60 * 60 * 1000);

                bookingDate = futureTime.toLocaleDateString('en-CA');

                bookingTime = futureTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

            } else if (selectedTimeSlot.includes('tomorrow')) {

                // Tomorrow's booking

                const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

                const hour = parseInt(selectedTimeSlot.split('-')[1] || '0');
                tomorrow.setHours(hour, 0, 0, 0);

                bookingDate = tomorrow.toLocaleDateString('en-CA');

                bookingTime = tomorrow.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

            } else if (selectedTimeSlot.includes('nextweek')) {

                // Next week booking

                const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

                const dayOfWeek = parseInt(selectedTimeSlot.split('-')[1] || '0');
                const targetDay = new Date(nextWeek);

                targetDay.setDate(targetDay.getDate() + (dayOfWeek - targetDay.getDay()));

                targetDay.setHours(9, 0, 0, 0);

                bookingDate = targetDay.toLocaleDateString('en-CA');

                bookingTime = targetDay.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

            } else {

                // Fallback

                bookingDate = new Date().toLocaleDateString('en-CA');

                bookingTime = '09:00';

            }


        }



        // Create booking

        addBooking({

            stationName: selectedStation.stationName || '',
            stationAddress: selectedStation.address || '',
            date: bookingDate,

            time: bookingTime,

            duration: costInfo.chargingTime,

            status: isImmediateBooking ? 'confirmed' : 'confirmed',

            estimatedCost: costInfo.discountedPrice,

            chargerType: 'AC_FAST',
            power: 50,
            targetBattery: targetBatteryLevel,

            currentBattery: currentBatteryLevel

        });



        // Show QR code only for immediate bookings, otherwise show success

        if (isImmediateBooking) {
            setBookingStep("qr");
        } else {

            setBookingStep("success");

        }

    };

    const handleStartCharging = () => {

        setBookingStep("charging");



        // Initialize charging session

        const startTime = new Date();

        setChargingStartTimeSession(startTime);

        setCurrentChargingBattery(currentBatteryLevel);

        setChargingProgress(0);

        setChargingCost(0);



        // Calculate initial values

        const energyNeeded = targetBatteryLevel - currentBatteryLevel;

        const kwhNeeded = (energyNeeded / 100) * 75; // Assuming 75kWh battery

        const estimatedTimeMinutes = Math.round((kwhNeeded / 22) * 60); // 22kW charger

        setRemainingTime(estimatedTimeMinutes);

        setChargingPower(22); // kW



        // Simulate real-time charging progress

        const progressInterval = setInterval(() => {

            setChargingProgress(prev => {

                const newProgress = Math.min(prev + 0.5, 100); // Slower progression for realism



                // Update battery level based on progress

                const newBattery = currentBatteryLevel + (energyNeeded * newProgress / 100);

                setCurrentChargingBattery(Math.round(newBattery * 10) / 10);



                // Update remaining time

                const timeElapsed = Math.round(newProgress * estimatedTimeMinutes / 100);

                setRemainingTime(Math.max(0, estimatedTimeMinutes - timeElapsed));



                // Update cost (VND per kWh rate)

                const costPerKwh = 3500; // VND

                const currentKwh = (kwhNeeded * newProgress / 100);

                setChargingCost(Math.round(currentKwh * costPerKwh));



                // Simulate power fluctuation (more realistic)

                setChargingPower(20 + Math.random() * 4 + Math.sin(Date.now() / 1000) * 1);



                // Stop when complete

                if (newProgress >= 100) {

                    clearInterval(progressInterval);

                    setChargingIntervalRef(null);



                    // Create completed session data

                    const sessionData = {

                        sessionId: `CS-${Date.now()}`,

                        stationName: selectedStation?.stationName || '',
                        startTime: startTime,

                        endTime: new Date(),

                        startBattery: currentBatteryLevel,

                        endBattery: Math.round(newBattery),

                        energyConsumed: Number((kwhNeeded * newProgress / 100).toFixed(2)),

                        duration: Math.round(newProgress * estimatedTimeMinutes / 100),

                        subscriptionPlan: userSubscription?.planId || 'free'

                    };



                    setCompletedSession(sessionData);



                    // Update actual battery level

                    setCurrentBatteryLevel?.(Math.round(newBattery));


                    // Show invoice after brief delay

                    setTimeout(() => {

                        setBookingStep("invoice");

                    }, 1000);

                }



                return newProgress;

            });

        }, 500); // Update every 500ms for more realistic updates



        // Store interval reference

        setChargingIntervalRef(progressInterval);

    };



    const formatCurrency = (amount: number) => {

        return new Intl.NumberFormat('vi-VN', {

            style: 'currency',

            currency: 'VND'

        }).format(amount);

    };



    const formatTime = (minutes: number) => {

        if (minutes < 60) {

            return `${minutes} min`;

        }

        const hours = Math.floor(minutes / 60);

        const remainingMinutes = minutes % 60;

        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;

    };



    // Generate extended time slot options

    const generateTimeSlots = () => {

        const now = new Date();

        const slots = [];



        // Add "Now" option

        slots.push({

            value: "now",

            label: language === 'vi' ? 'Ngay bây giờ' : 'Now',

            category: 'immediate'

        });



        // Add hourly slots for today (next 8 hours)

        for (let i = 1; i <= 8; i++) {

            const futureTime = new Date(now.getTime() + i * 60 * 60 * 1000);

            const timeString = futureTime.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {

                hour: '2-digit',

                minute: '2-digit',

                hour12: false

            });



            slots.push({

                value: `${i}h`,

                label: language === 'vi' ? `Trong ${i} giờ (${timeString})` : `In ${i} hour${i > 1 ? 's' : ''} (${timeString})`,

                category: 'today'

            });

        }



        // Add specific times for tomorrow

        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const tomorrowTimes = [

            { hour: 6, minute: 0, label: language === 'vi' ? 'Sáng sớm' : 'Early Morning' },

            { hour: 8, minute: 0, label: language === 'vi' ? 'Buổi sáng' : 'Morning' },

            { hour: 9, minute: 0, label: language === 'vi' ? 'Giờ hành chính' : 'Business Hours' },

            { hour: 12, minute: 0, label: language === 'vi' ? 'Trưa' : 'Lunch Time' },

            { hour: 14, minute: 0, label: language === 'vi' ? 'Chiều' : 'Afternoon' },

            { hour: 17, minute: 0, label: language === 'vi' ? 'Giờ tan làm' : 'After Work' },

            { hour: 19, minute: 0, label: language === 'vi' ? 'Tối' : 'Evening' },

            { hour: 21, minute: 0, label: language === 'vi' ? 'Tối muộn' : 'Late Evening' }

        ];



        tomorrowTimes.forEach(time => {

            const tomorrowDate = new Date(tomorrow);

            tomorrowDate.setHours(time.hour, time.minute, 0, 0);



            const timeString = tomorrowDate.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {

                hour: '2-digit',

                minute: '2-digit',

                hour12: false

            });



            slots.push({

                value: `tomorrow-${time.hour}`,

                label: language === 'vi'

                    ? `Ngày mai ${timeString} (${time.label})`

                    : `Tomorrow ${timeString} (${time.label})`,

                category: 'tomorrow'

            });

        });



        // Add some next week options

        const nextWeekDays = [

            { day: 2, name: language === 'vi' ? 'Thứ Hai' : 'Monday' },

            { day: 3, name: language === 'vi' ? 'Thứ Ba' : 'Tuesday' },

            { day: 4, name: language === 'vi' ? 'Thứ Tư' : 'Wednesday' },

            { day: 5, name: language === 'vi' ? 'Thứ Năm' : 'Thursday' },

            { day: 6, name: language === 'vi' ? 'Thứ Sáu' : 'Friday' }

        ];



        nextWeekDays.forEach(weekDay => {

            const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

            const targetDay = new Date(nextWeek);

            targetDay.setDate(targetDay.getDate() + (weekDay.day - targetDay.getDay()));

            targetDay.setHours(9, 0, 0, 0);



            const dateString = targetDay.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {

                month: 'short',

                day: 'numeric'

            });



            slots.push({

                value: `nextweek-${weekDay.day}`,

                label: `${weekDay.name} ${dateString} 09:00`,

                category: 'nextweek'

            });

        });



        return slots;

    };



    // Format selected time slot for display

    const formatSelectedTimeSlot = (value: string) => {

        const timeSlots = generateTimeSlots();

        const selectedSlot = timeSlots.find(slot => slot.value === value);

        return selectedSlot ? selectedSlot.label : value;

    };



    // Success screen for future bookings (non-immediate)

    if (bookingStep === "success" && selectedStation) {

        return (

            <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-green-950 dark:to-blue-950 flex items-center justify-center p-4">

                <motion.div

                    initial={{ opacity: 0, scale: 0.95 }}

                    animate={{ opacity: 1, scale: 1 }}

                    transition={{ duration: 0.3 }}

                >

                    <Card className="w-full max-w-md shadow-xl">

                        <CardHeader className="text-center pb-6">

                            <motion.div

                                initial={{ scale: 0 }}

                                animate={{ scale: 1 }}

                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}

                                className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg"

                            >

                                <motion.div

                                    initial={{ opacity: 0 }}

                                    animate={{ opacity: 1 }}

                                    transition={{ delay: 0.4 }}

                                >

                                    <CheckCircle className="w-10 h-10 text-white" />

                                </motion.div>

                            </motion.div>

                            <CardTitle className="text-xl text-green-600 dark:text-green-400">

                                {language === 'vi' ? 'Đặt chỗ thành công!' : 'Booking Confirmed!'}

                            </CardTitle>

                            <CardDescription className="text-base">

                                {language === 'vi'

                                    ? 'Đặt chỗ của bạn đã được xác nhận và lưu vào My Bookings'

                                    : 'Your booking has been confirmed and saved to My Bookings'

                                }

                            </CardDescription>

                        </CardHeader>



                        <CardContent className="space-y-6">

                            {/* Booking Summary */}

                            <div className="bg-muted/50 rounded-lg p-4 space-y-3">

                                <h4 className="font-medium flex items-center gap-2">

                                    <MapPin className="w-4 h-4 text-primary" />

                                    {selectedStation.stationName}
                                </h4>

                                <p className="text-sm text-muted-foreground">{selectedStation.address}</p>



                                <div className="grid grid-cols-2 gap-3 text-sm">

                                    <div className="flex justify-between">

                                        <span>{language === 'vi' ? 'Ngày giờ:' : 'Date & Time:'}</span>

                                        <span className="font-medium">{formatSelectedTimeSlot(selectedTimeSlot)}</span>

                                    </div>

                                    <div className="flex justify-between">

                                        <span>{language === 'vi' ? 'Thời lượng:' : 'Duration:'}</span>

                                        <span className="font-medium">{formatTime(calculateEstimatedCost().chargingTime)}</span>

                                    </div>

                                    <div className="flex justify-between">

                                        <span>{language === 'vi' ? 'Pin hiện tại:' : 'Current:'}</span>

                                        <span className="font-medium">{currentBatteryLevel}%</span>

                                    </div>

                                    <div className="flex justify-between">

                                        <span>{language === 'vi' ? 'Pin mục tiêu:' : 'Target:'}</span>

                                        <span className="font-medium text-green-600 dark:text-green-400">{targetBatteryLevel}%</span>

                                    </div>

                                </div>



                                <Separator />



                                <div className="flex justify-between text-sm font-semibold">

                                    <span>{language === 'vi' ? 'Chi phí ước tính:' : 'Estimated Cost:'}</span>

                                    <span className="text-primary">{formatCurrency(calculateEstimatedCost().discountedPrice)}</span>

                                </div>

                            </div>



                            {/* Important Notice */}

                            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">

                                <div className="flex items-start gap-3">

                                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />

                                    <div className="text-sm">

                                        <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">

                                            {language === 'vi' ? 'Lưu ý quan trọng:' : 'Important Notice:'}

                                        </p>

                                        <p className="text-blue-600 dark:text-blue-400">

                                            {language === 'vi'

                                                ? 'Vui lòng đến trạm đúng giờ đã đặt. Bạn có thể xem chi tiết trong My Bookings và nhận thông báo nhắc nhở.'

                                                : 'Please arrive at the station on time. You can view details in My Bookings and receive reminder notifications.'

                                            }

                                        </p>

                                    </div>

                                </div>

                            </div>



                            {/* Action Buttons */}

                            <div className="flex gap-3">

                                <Button

                                    onClick={() => {

                                        // Navigate to My Bookings

                                        onBack(); // This will take them back to dashboard, then they can access My Bookings

                                    }}

                                    className="flex-1"

                                >

                                    <Calendar className="w-4 h-4 mr-2" />

                                    {language === 'vi' ? 'Xem đặt chỗ' : 'View Bookings'}

                                </Button>

                                <Button

                                    variant="outline"

                                    onClick={() => {

                                        setBookingStep("select");

                                        setSelectedStation(null);

                                        setSelectedTimeSlot("");

                                        setTargetBatteryLevel(80);

                                    }}

                                    className="flex-1"

                                >

                                    {language === 'vi' ? 'Đặt thêm' : 'Book Another'}

                                </Button>

                            </div>

                        </CardContent>

                    </Card>

                </motion.div>

            </div>

        );

    }



    // QR Code Screen for starting charging session

    if (bookingStep === "qr" && selectedStation) {

        return (

            <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30 flex items-center justify-center p-4">

                <Card className="w-full max-w-md">

                    <CardHeader className="text-center pb-3">

                        <CardTitle className="flex items-center justify-center space-x-2">

                            <Zap className="w-6 h-6 text-primary" />

                            <span>{language === 'vi' ? 'Bắt đầu sạc' : 'Start Charging'}</span>

                        </CardTitle>

                        <CardDescription>

                            {language === 'vi'

                                ? 'Quét mã QR hoặc nhấn Start để bắt đầu phiên sạc'

                                : 'Scan QR code or press Start to begin charging session'

                            }

                        </CardDescription>

                    </CardHeader>



                    <CardContent className="space-y-6">

                        {/* Station Info */}

                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">

                            <h4 className="font-medium">{selectedStation.stationName}</h4>
                            <p className="text-sm text-muted-foreground">{selectedStation.address}</p>

                            <div className="grid grid-cols-2 gap-3 text-sm">

                                <div className="flex justify-between">

                                    <span>Current:</span>

                                    <span className="font-medium">{currentBatteryLevel}%</span>

                                </div>

                                <div className="flex justify-between">

                                    <span>Target:</span>

                                    <span className="font-medium text-green-600 dark:text-green-400">{targetBatteryLevel}%</span>

                                </div>

                            </div>

                        </div>



                        {/* QR Code */}

                        <div className="flex justify-center">

                            <QRCodeGenerator

                                value={`ChargeHub-${selectedStation.stationId}-${Date.now()}`}
                                size={200}

                                className="mx-auto"

                            />

                        </div>



                        {/* Instructions */}

                        <div className="text-center space-y-2">

                            <p className="text-sm text-muted-foreground">

                                {language === 'vi'

                                    ? 'Quét mã QR bằng máy sạc hoặc'

                                    : 'Scan QR code with the charger or'

                                }

                            </p>



                            {/* Start Button */}

                            <Button

                                onClick={handleStartCharging}

                                className="w-full"

                                size="lg"

                            >

                                <Zap className="w-5 h-5 mr-2" />

                                {language === 'vi' ? 'Bắt đầu sạc' : 'Start Charging'}

                            </Button>

                        </div>



                        {/* Cost Summary */}

                        {(() => {

                            const costInfo = calculateEstimatedCost();

                            return (

                                <div className="bg-primary/10 rounded-lg p-3">

                                    <div className="grid grid-cols-2 gap-2 text-sm">

                                        <div className="flex justify-between">

                                            <span>Energy:</span>

                                            <span className="font-medium">{costInfo.kwhNeeded} kWh</span>

                                        </div>

                                        <div className="flex justify-between">

                                            <span>Time:</span>

                                            <span className="font-medium">{formatTime(costInfo.chargingTime)}</span>

                                        </div>

                                    </div>

                                    <div className="flex justify-between text-sm font-semibold mt-2 pt-2 border-t border-primary/20">

                                        <span>Total Cost:</span>

                                        <span className="text-primary">{formatCurrency(costInfo.discountedPrice)}</span>

                                    </div>

                                </div>

                            );

                        })()}



                        {/* Cancel Button */}

                        <Button

                            variant="outline"

                            className="w-full"

                            onClick={() => {

                                setBookingStep("select");

                                setSelectedStation(null);

                                setSelectedTimeSlot("");

                                setTargetBatteryLevel(80);

                            }}

                        >

                            {language === 'vi' ? 'Hủy' : 'Cancel'}

                        </Button>

                    </CardContent>

                </Card>

            </div>

        );

    }



    // Enhanced Charging Session Screen

    if (bookingStep === "charging" && selectedStation) {

        const elapsedTime = chargingStartTimeSession ? Math.floor((Date.now() - chargingStartTimeSession.getTime()) / 1000) : 0;

        const elapsedMinutes = Math.floor(elapsedTime / 60);

        const elapsedSeconds = elapsedTime % 60;



        return (

            <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/20 flex items-center justify-center p-4">

                <Card className="w-full max-w-lg">

                    <CardHeader className="text-center pb-3">

                        <motion.div

                            animate={{ rotate: 360 }}

                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}

                            className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary to-green-500 rounded-full flex items-center justify-center shadow-lg"

                        >

                            <Zap className="w-10 h-10 text-primary-foreground" />

                        </motion.div>

                        <CardTitle className="text-xl text-green-600 dark:text-green-400">

                            {language === 'vi' ? 'Đang sạc điện' : 'Charging in Progress'}

                        </CardTitle>

                        <CardDescription className="text-base">

                            {selectedStation.stationName}
                        </CardDescription>

                    </CardHeader>



                    <CardContent className="space-y-6">

                        {/* Main Battery Display */}

                        <div className="bg-gradient-to-br from-primary/10 to-green-500/10 rounded-xl p-6 text-center space-y-4">

                            <div className="text-5xl font-bold text-primary">

                                {currentChargingBattery.toFixed(1)}%

                            </div>

                            <div className="text-sm text-muted-foreground">

                                {language === 'vi' ? 'Mức pin hiện tại' : 'Current Battery Level'}

                            </div>



                            {/* Progress Bar */}

                            <div className="space-y-2">

                                <div className="flex justify-between text-sm">

                                    <span>{language === 'vi' ? 'Tiến độ' : 'Progress'}</span>

                                    <span className="font-bold text-primary">{chargingProgress.toFixed(1)}%</span>

                                </div>

                                <div className="w-full h-4 bg-muted rounded-full overflow-hidden">

                                    <motion.div

                                        className="h-full bg-gradient-to-r from-primary via-green-500 to-green-400"

                                        style={{ width: `${chargingProgress}%` }}

                                        transition={{ duration: 0.3 }}

                                    />

                                </div>

                            </div>

                        </div>



                        {/* Real-time Stats Grid */}

                        <div className="grid grid-cols-2 gap-4">

                            {/* Current vs Target */}

                            <div className="bg-muted/50 rounded-lg p-4 text-center">

                                <div className="text-sm text-muted-foreground mb-1">

                                    {language === 'vi' ? 'Mục tiêu' : 'Target'}

                                </div>

                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">

                                    {targetBatteryLevel}%

                                </div>

                            </div>



                            {/* Charging Power */}

                            <div className="bg-muted/50 rounded-lg p-4 text-center">

                                <div className="text-sm text-muted-foreground mb-1">

                                    {language === 'vi' ? 'Công suất' : 'Power'}

                                </div>

                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">

                                    {chargingPower.toFixed(1)} kW

                                </div>

                            </div>

                        </div>



                        {/* Time and Cost Info */}

                        <div className="bg-card border border-border rounded-lg p-4 space-y-3">

                            <div className="flex justify-between items-center">

                <span className="text-sm text-muted-foreground">

                  {language === 'vi' ? 'Đã trôi qua:' : 'Elapsed Time:'}

                </span>

                                <span className="font-semibold text-orange-600 dark:text-orange-400">

                  {elapsedMinutes}:{elapsedSeconds.toString().padStart(2, '0')}

                </span>

                            </div>



                            <div className="flex justify-between items-center">

                <span className="text-sm text-muted-foreground">

                  {language === 'vi' ? 'Thời gian còn lại:' : 'Time Remaining:'}

                </span>

                                <span className="font-semibold text-blue-600 dark:text-blue-400">

                  ~{Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}

                </span>

                            </div>



                            <Separator />



                            <div className="flex justify-between items-center">

                <span className="text-sm text-muted-foreground">

                  {language === 'vi' ? 'Chi phí hiện tại:' : 'Current Cost:'}

                </span>

                                <span className="font-bold text-lg text-primary">

                  {formatCurrency(chargingCost)}

                </span>

                            </div>

                        </div>



                        {/* Live Connection Status */}

                        <div className="flex items-center justify-center space-x-3">

                            <motion.div

                                className="w-3 h-3 bg-green-500 rounded-full"

                                animate={{ scale: [1, 1.2, 1] }}

                                transition={{ duration: 1, repeat: Infinity }}

                            />

                            <span className="text-sm font-medium text-green-600 dark:text-green-400">

                {language === 'vi' ? 'Kết nối ổn định • Đang sạc' : 'Connected • Charging'}

              </span>

                            <motion.div

                                className="w-2 h-2 bg-green-400 rounded-full"

                                animate={{ opacity: [0.3, 1, 0.3] }}

                                transition={{ duration: 1.5, repeat: Infinity }}

                            />

                        </div>



                        {/* Action Buttons */}

                        <div className="grid grid-cols-2 gap-3">

                            <Button

                                variant="outline"

                                onClick={() => {

                                    // Pause charging functionality

                                    alert(language === 'vi' ? 'Tạm dừng sạc' : 'Charging Paused');

                                }}

                            >

                                <Pause className="w-4 h-4 mr-2" />

                                {language === 'vi' ? 'Tạm dừng' : 'Pause'}

                            </Button>



                            <Button

                                variant="destructive"

                                onClick={() => {

                                    // Cleanup charging interval

                                    if (chargingIntervalRef) {

                                        clearInterval(chargingIntervalRef);

                                        setChargingIntervalRef(null);

                                    }



                                    // Reset states

                                    setBookingStep("select");

                                    setSelectedStation(null);

                                    setSelectedTimeSlot("");

                                    setTargetBatteryLevel(80);

                                    setChargingProgress(0);

                                    setCurrentChargingBattery(0);

                                    setChargingCost(0);

                                    setChargingStartTimeSession(null);

                                    setRemainingTime(0);

                                    setChargingPower(0);



                                    // Update battery level to current charging level

                                    if (currentChargingBattery > currentBatteryLevel) {

                                        setCurrentBatteryLevel?.(Math.round(currentChargingBattery));
                                    }

                                }}

                            >

                                <Square className="w-4 h-4 mr-2" />

                                {language === 'vi' ? 'Dừng sạc' : 'Stop'}

                            </Button>

                        </div>

                    </CardContent>

                </Card>

            </div>

        );

    }



    // Charging Invoice Screen

    if (bookingStep === "invoice" && completedSession) {

        return (

            <ChargingInvoiceView

                session={completedSession}

                onClose={() => {

                    setBookingStep("select");

                    setSelectedStation(null);

                    setSelectedTimeSlot("");

                    setTargetBatteryLevel(80);

                    setRouteDetails(null);

                    setShowRoute(false);

                    setCompletedSession(null);

                    setChargingProgress(0);

                    setCurrentChargingBattery(0);

                    setChargingCost(0);

                    setChargingStartTimeSession(null);

                    setRemainingTime(0);

                    setChargingPower(0);

                }}

                onPaymentComplete={() => {

                    setBookingStep("select");

                    setSelectedStation(null);

                    setSelectedTimeSlot("");

                    setTargetBatteryLevel(80);

                    setRouteDetails(null);

                    setShowRoute(false);

                    setCompletedSession(null);

                    setChargingProgress(0);

                    setCurrentChargingBattery(0);

                    setChargingCost(0);

                    setChargingStartTimeSession(null);

                    setRemainingTime(0);

                    setChargingPower(0);

                }}

            />

        );

    }



    return (

        <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30">

            {/* Enhanced Header */}

            <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border shadow-sm">

                <div className="container mx-auto px-4 py-4">

                    <div className="flex items-center justify-between">

                        <div className="flex items-center space-x-4">

                            <Button

                                variant="ghost"

                                size="sm"

                                onClick={onBack}

                                className="text-muted-foreground hover:text-foreground"

                            >

                                <ArrowLeft className="w-4 h-4 mr-2" />

                                {t('back_to_dashboard')}

                            </Button>

                            <div className="flex items-center space-x-3">

                                <div className="relative group">

                                    <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 transform group-hover:scale-110 transition-transform duration-300">

                                        <Zap className="w-6 h-6 text-primary-foreground" />

                                    </div>

                                </div>

                                <div>

                                    <h1 className="font-semibold text-foreground">{t('chargehub')}</h1>

                                    <p className="text-sm text-muted-foreground">{t('book_charging_station')}</p>

                                </div>

                            </div>

                            {/* Vehicle Selection Button */}
                            {(selectedVehicle || selectedVehicleRef.current) && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsVehicleSelectionOpen(true)}
                                    className="flex items-center space-x-2"
                                >
                                    <Car className="w-4 h-4" />
                                    <span className="hidden sm:inline">
                                        {(selectedVehicle || selectedVehicleRef.current)?.model || (selectedVehicle || selectedVehicleRef.current)?.carModel?.model || 'Selected Vehicle'}
                                    </span>
                                </Button>
                            )}

                        </div>



                    </div>

                </div>

            </div>


            {/* Main Content */}

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header with Refresh Button */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {language === 'vi' ? 'Tìm Trạm Sạc' : 'Find Charging Stations'}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {language === 'vi' ? 'Tìm và đặt chỗ tại các trạm sạc gần bạn' : 'Find and book charging stations near you'}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={refreshStations}
                        disabled={loading}
                        className="flex items-center space-x-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>{language === 'vi' ? 'Làm mới' : 'Refresh'}</span>
                    </Button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 lg:gap-6">
                    {/* Interactive Map Section */}
                    <div className="xl:col-span-3 space-y-6 order-1 xl:order-1">
                        {/* Map Controls */}
                        <Card className="overflow-hidden">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center space-x-2 text-base">
                                            <MapPin className="w-5 h-5 text-primary" />
                                            <span>Station Map</span>
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">Interactive charging station map</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="relative">
                                    {/* Search Bar */}
                                    <div className="absolute top-4 left-4 z-10 search-container">
                                        <div className="relative w-80">
                                            <div className="relative">
                                                <Search
                                                    className="absolute left-3 top-1/2 transform -translate-y-1/2
                              w-4 h-4
                              text-white/90
                              bg-black/80 backdrop-blur-md
                              p-1.5 rounded-full
                              shadow-[0_0_8px_rgba(0,0,0,0.8)]
                              ring-1 ring-white/10 hover:ring-blue-400/40
                              transition-all duration-300"
                                                />
                                                <Input
                                                    type="text"
                                                    placeholder={language === 'vi' ? 'Tìm kiếm trạm sạc...' : 'Search stations...'}
                                                    value={searchQuery}
                                                    onChange={(e) => handleSearchChange(e.target.value)}
                                                    className="pl-10 pr-10 bg-black/90 backdrop-blur-sm border-2 border-white/30 shadow-xl focus:ring-2 focus:ring-white/30 focus:border-white/60 text-white placeholder:text-white/60 h-10 rounded-lg"
                                                />
                                                {searchQuery && (
                                                    <button
                                                        aria-label={language === 'vi' ? 'Xóa tìm kiếm' : 'Clear search'}
                                                        onClick={() => {
                                                            setSearchQuery("");
                                                            setSearchResults([]);
                                                            setShowSearchResults(false);
                                                        }}
                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/70 hover:text-white transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Search Results Dropdown */}
                                            <AnimatePresence>
                                                {showSearchResults && searchResults.length > 0 && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="absolute top-full left-0 right-0 mt-2 bg-black border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto z-20"
                                                    >
                                                        {searchResults.slice(0, 5).map((station, index) => (
                                                            <motion.div
                                                                key={station.stationId}
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                                                onClick={() => handleSearchResultClick(station)}
                                                                className={`p-3 hover:bg-gray-800 cursor-pointer border-b border-gray-700 last:border-b-0 transition-colors duration-200 ${isNavigating ? 'opacity-50 pointer-events-none' : ''
                                                                }`}
                                                            >
                                                                <div className="flex items-start space-x-3">
                                                                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                        <MapPin className="w-4 h-4 text-white" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="font-medium text-white truncate">
                                                                            {station.stationName}
                                                                        </h4>
                                                                        <p className="text-sm text-white/70 truncate">
                                                                            {station.address}
                                                                        </p>
                                                                        <div className="flex items-center space-x-2 mt-1">
                                                                            <Badge
                                                                                variant="outline"
                                                                                className={`text-xs ${station.status === 'ACTIVE' ? 'bg-green-500/20 text-green-300 border-green-400/30' :
                                                                                    station.status === 'INACTIVE' ? 'bg-amber-500/20 text-amber-300 border-amber-400/30' :
                                                                                        station.status === 'MAINTENANCE' ? 'bg-red-500/20 text-red-300 border-red-400/30' :
                                                                                            'bg-gray-500/20 text-gray-300 border-gray-400/30'
                                                                                }`}
                                                                            >
                                                                                {station.status === 'ACTIVE' ? (language === 'vi' ? 'Hoạt động' : 'Active') :
                                                                                    station.status === 'INACTIVE' ? (language === 'vi' ? 'Không hoạt động' : 'Inactive') :
                                                                                        station.status === 'MAINTENANCE' ? (language === 'vi' ? 'Bảo trì' : 'Maintenance') :
                                                                                            (language === 'vi' ? 'Không xác định' : 'Unknown')}
                                                                            </Badge>
                                                                            <div className="flex flex-wrap gap-1">
                                                                                {stationChargingPoints[station.stationId?.toString() || ''] ? (
                                                                                    Object.entries(stationChargingPoints[station.stationId?.toString() || ''] || {}).map(([typeName, stats]) => (
                                                                                        <div key={typeName} className="flex items-center space-x-1 bg-white/10 rounded px-2 py-1">
                                                                                            <Zap className="w-3 h-3 text-white" />
                                                                                            <span className="text-xs font-medium text-white">
                                                                                                {typeName}: {stats.available}/{stats.total}
                                                                                            </span>
                                                                                        </div>
                                                                                    ))
                                                                                ) : (
                                                                                    <span className="text-xs text-white/60">
                                                                                        {stationTotalPoints[station.stationId?.toString() || ''] || station.chargingPointNumber || 0} {language === 'vi' ? 'trụ sạc' : 'charging points'}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                        {/* Navigation Loading Indicator */}
                                                        {isNavigating && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className="p-3 text-center text-sm text-blue-400 border-t border-gray-700 bg-blue-500/10"
                                                            >
                                                                <div className="flex items-center justify-center space-x-2">
                                                                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                                                    <span>
                                    {language === 'vi' ? 'Đang di chuyển đến trạm...' : 'Navigating to station...'}
                                  </span>
                                                                </div>
                                                            </motion.div>
                                                        )}

                                                        {searchResults.length > 5 && !isNavigating && (
                                                            <div className="p-3 text-center text-sm text-gray-400 border-t border-gray-700">
                                                                {language === 'vi'
                                                                    ? `Hiển thị 5 trong ${searchResults.length} kết quả`
                                                                    : `Showing 5 of ${searchResults.length} results`}
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* Map Container */}
                                    <div
                                        ref={mapContainerRef}
                                        className="h-[500px] xl:h-[700px] w-full rounded-lg relative overflow-hidden bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border border-border/50 shadow-sm"
                                    >
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Map Legend */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="space-y-1">
                                    <CardTitle className="text-sm flex items-center space-x-2">
                                        <Layers className="w-4 h-4 text-primary" />
                                        <span>Map Legend</span>
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">Station Status indicators</p>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">

                                <div className="grid grid-cols-1 gap-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-4 h-4 bg-green-500 rounded-full shadow-sm" />
                                            <span className="font-medium">Active</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Badge variant="secondary" className="text-xs">
                                                {filteredStations.filter(s => s.status === "ACTIVE").length}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-4 h-4 bg-yellow-500 rounded-full shadow-sm" />
                                            <span className="font-medium">Inactive</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Badge variant="secondary" className="text-xs">
                                                {filteredStations.filter(s => s.status === "INACTIVE").length}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-4 h-4 bg-red-500 rounded-full shadow-sm" />
                                            <span className="font-medium">Maintenance</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Badge variant="secondary" className="text-xs">
                                                {filteredStations.filter(s => s.status === "MAINTENANCE").length}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm" />
                                            <span className="font-medium">Your Location</span>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            Current
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Stations List */}

                    <div className="xl:col-span-1 space-y-6 order-2 xl:order-2">
                        <div className="space-y-4">

                            <div className="flex items-center justify-between">
                                {/* Tổng quan về danh sách trạm */}

                                <h2 className="text-foreground">{t('find_charging_stations')}</h2>

                                <div className="flex items-center space-x-2">

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={refreshStations}
                                        disabled={loading}
                                        className="flex items-center space-x-2"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                        <span>{language === 'vi' ? 'Làm mới' : 'Refresh'}</span>
                                    </Button>

                                    <Button
                                        variant={sortByDistance ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => {
                                            if (!userLocation) {
                                                getUserLocation();
                                            }
                                            setSortByDistance(!sortByDistance);
                                        }}
                                        className="flex items-center space-x-2"
                                    >
                                        <Navigation className="w-4 h-4" />
                                        <span>{language === 'vi' ? 'Gần nhất' : 'Nearest'}</span>
                                    </Button>

                                    <span className="text-sm text-muted-foreground">

                    {filteredStations.length} stations found

                  </span>

                                </div>

                            </div>



                            {/* Search */}

                            <div className="relative">

                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                                <Input

                                    placeholder={t('search_stations_placeholder')}

                                    value={searchQuery}

                                    onChange={(e) => setSearchQuery(e.target.value)}

                                    className="pl-10 bg-card/80 backdrop-blur-sm border-border/60 rounded-xl"

                                />

                            </div>

                        </div>



                        {/* Stations Grid */}
                        {/* Loading Station */}
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="text-center space-y-4">
                                    <div className="w-8 h-8 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-sm text-muted-foreground">Loading stations...</p>
                                </div>
                            </div>
                        ) : filteredStations.length === 0 ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                                        <MapPin className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-medium text-muted-foreground">
                                            {language === 'vi' ? 'Không có trạm nào' : 'No stations found'}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {language === 'vi' ? 'Vui lòng thử lại sau' : 'Please try again later'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            //Hiển thị card trạm sạc
                            <div className="space-y-2">
                                {paginatedStations.map((station) => (

                                    <motion.div

                                        key={station.stationId}
                                        initial={{ opacity: 0, y: 20 }}

                                        animate={{ opacity: 1, y: 0 }}

                                        className={`bg-card rounded-lg p-3 shadow-sm border border-border cursor-pointer transition-all duration-200 hover:shadow-md ${selectedStation?.stationId === station.stationId ? 'ring-2 ring-primary border-primary' : ''
                                        }`}

                                        onClick={() => setSelectedStation(station)}

                                    >

                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">

                                                <div className="flex items-center space-x-2 mb-1">
                                                    {/* Station Name */}
                                                    <h3 className="font-semibold text-card-foreground text-sm">{station.stationName}</h3>
                                                    <Badge

                                                        variant={station.status === "Available" ? "default" : "secondary"}

                                                        className={`${station.status === "Available" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : ""

                                                        }`}
                                                    >
                                                        {station.status}

                                                    </Badge>

                                                </div>
                                                {/* Station Address */}
                                                <p className="text-xs text-muted-foreground mb-2">{station.address}</p>

                                                {/* Charging Points by Type */}
                                                <div className="mb-2">
                                                    {stationChargingPoints[station.stationId?.toString() || ''] ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {Object.entries(stationChargingPoints[station.stationId?.toString() || ''] || {}).map(([typeName, stats]) => (
                                                                <div key={typeName} className="flex items-center space-x-1 bg-primary/10 rounded px-2 py-1">
                                                                    <Zap className="w-3 h-3 text-primary" />
                                                                    <span className="text-xs font-medium text-primary">
                                    {typeName}: {stats.available}/{stats.total}
                          </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                                            <Zap className="w-3 h-3" />
                                                            <span>{station.chargingPointNumber} charging points</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{station.latitude?.toFixed(4) || '0.0000'}, {station.longitude?.toFixed(4) || '0.0000'}</span>
                          </span>
                                                </div>

                                            </div>

                                            <div className="text-right">

                                                <div className="text-sm font-semibold text-primary">ID: {station.stationId}</div>
                                                {userLocation && sortByDistance && (
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {calculateDistance(
                                                            userLocation.lat,
                                                            userLocation.lng,
                                                            station.latitude || 0,
                                                            station.longitude || 0
                                                        ).toFixed(2)} km
                                                    </div>
                                                )}
                                            </div>

                                        </div>



                                        {/* View Details Button */}

                                        <div className="flex justify-center mt-3 mb-3 space-x-2">
                                            <Button

                                                variant="outline"

                                                size="sm"

                                                onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();

                                                    handleOpenChargingConfig(station);

                                                }}

                                                className="flex items-center space-x-2 text-xs px-3 py-1"
                                            >

                                                <Navigation className="w-3 h-3" />
                                                <span>{language === 'vi' ? 'Xem Chi tiết' : 'View Details'}</span>

                                            </Button>


                                        </div>


                                        {/* Enhanced Booking Section */}

                                        {selectedStation && selectedStation.stationId === station.stationId && station.status === "Available" && (
                                            <div className="pt-4 border-t border-border space-y-4">

                                                <div className="flex items-center justify-between">

                                                    <h4 className="font-medium">Book This Station</h4>

                                                </div>



                                                <div className="space-y-4">

                                                    {/* Enhanced Battery Configuration */}

                                                    <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 space-y-4">

                                                        <div className="flex items-center space-x-2 mb-2">

                                                            <Battery className="w-4 h-4 text-primary" />

                                                            <span className="font-medium text-sm">Battery Configuration</span>

                                                        </div>



                                                        {/* Current Battery Section */}

                                                        <div className="space-y-3">

                                                            <div className="flex items-center justify-between">

                                                                <span className="text-sm text-muted-foreground">Current Battery</span>

                                                                <span className="text-xs text-muted-foreground">Enter 0-100%</span>

                                                            </div>



                                                            {/* Current Battery Input Controls */}

                                                            <div className="flex items-center justify-center space-x-4">

                                                                <button

                                                                    onClick={() => setCurrentBatteryLevel?.(Math.max(0, currentBatteryLevel - 1))}

                                                                    className="w-10 h-10 bg-muted hover:bg-muted/80 rounded-lg flex items-center justify-center transition-colors"

                                                                >

                                                                    −

                                                                </button>



                                                                <div className="flex flex-col items-center">

                                                                    <input

                                                                        type="number"

                                                                        value={currentBatteryLevel}

                                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                                            const value = parseInt(e.target.value) || 0;

                                                                            const clampedValue = Math.max(0, Math.min(100, value));

                                                                            setCurrentBatteryLevel?.(clampedValue);

                                                                        }}

                                                                        aria-label={language === 'vi' ? 'Mức pin hiện tại' : 'Current battery level'}

                                                                        className="w-16 h-12 text-center text-xl font-bold bg-transparent border-none outline-none text-primary"

                                                                        min="0"

                                                                        max="100"

                                                                    />

                                                                    <div className="text-xs text-muted-foreground">Enter 0-100%</div>

                                                                </div>



                                                                <button

                                                                    onClick={() => setCurrentBatteryLevel?.(Math.min(100, currentBatteryLevel + 1))}

                                                                    className="w-10 h-10 bg-muted hover:bg-muted/80 rounded-lg flex items-center justify-center transition-colors"

                                                                >

                                                                    +

                                                                </button>

                                                            </div>



                                                            {/* Battery Level Visual Bar */}

                                                            <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">

                                                                <div

                                                                    className={`h-full transition-all duration-300 ${currentBatteryLevel <= 20 ? 'bg-destructive' :

                                                                        currentBatteryLevel <= 50 ? 'bg-yellow-500' : 'bg-primary'

                                                                    }`}

                                                                    style={{ width: `${currentBatteryLevel}%` }}

                                                                />

                                                            </div>



                                                            <div className="flex justify-between text-xs text-muted-foreground">

                                                                <span>0%</span>

                                                                <span>50%</span>

                                                                <span>100%</span>

                                                            </div>



                                                            {/* Current Battery Level Display */}

                                                            <div className="text-center">

                                                                <div className={`text-3xl font-bold ${currentBatteryLevel <= 20 ? 'text-destructive' :

                                                                    currentBatteryLevel <= 50 ? 'text-yellow-600' : 'text-primary'

                                                                }`}>

                                                                    {currentBatteryLevel}%

                                                                </div>

                                                                <div className="text-sm text-muted-foreground">Current Battery Level</div>

                                                            </div>



                                                            {/* Quick Set Options for Current Battery */}

                                                            <div>

                                                                <div className="text-xs text-muted-foreground mb-2">Quick Set Options:</div>

                                                                <div className="grid grid-cols-4 gap-2">

                                                                    {[25, 50, 75, 100].map(level => (

                                                                        <button

                                                                            key={level}

                                                                            onClick={() => setCurrentBatteryLevel?.(level)}

                                                                            className={`p-2 rounded-lg text-sm font-medium transition-all hover:scale-105 ${currentBatteryLevel === level

                                                                                ? level === 25 ? 'bg-orange-500 text-white' :

                                                                                    level === 50 ? 'bg-yellow-500 text-white' :

                                                                                        level === 75 ? 'bg-green-500 text-white' :

                                                                                            'bg-primary text-primary-foreground'

                                                                                : 'bg-muted hover:bg-muted/80 text-muted-foreground'

                                                                            }`}

                                                                        >

                                                                            {level}%

                                                                        </button>

                                                                    ))}

                                                                </div>

                                                            </div>



                                                            {/* Battery Status and Range */}

                                                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">

                                                                <div className="text-center">

                                                                    <div className="text-sm font-medium">Estimated range</div>

                                                                    <div className="text-xl font-bold text-foreground">

                                                                        {Math.round(currentBatteryLevel * 2.3)} km

                                                                    </div>

                                                                </div>

                                                                <div className="text-center">

                                                                    <div className="text-sm font-medium">Status</div>

                                                                    <div className={`text-lg font-bold ${currentBatteryLevel <= 20 ? 'text-destructive' :

                                                                        currentBatteryLevel <= 50 ? 'text-yellow-600' : 'text-primary'

                                                                    }`}>

                                                                        {currentBatteryLevel <= 20 ? 'Low' :

                                                                            currentBatteryLevel <= 50 ? 'Medium' : 'Good'}

                                                                    </div>

                                                                </div>

                                                            </div>

                                                        </div>



                                                        {/* Target Battery Section */}

                                                        <div className="pt-4 border-t border-border/50 space-y-3">

                                                            <div className="text-center">

                                                                <div className="text-xs text-muted-foreground mb-1">Target</div>

                                                                <div className="font-bold text-green-600 dark:text-green-400">

                                                                    {targetBatteryLevel}%

                                                                </div>

                                                            </div>



                                                            <div className="space-y-2">

                                                                <Slider

                                                                    value={[targetBatteryLevel]}

                                                                    onValueChange={(value: number[]) => setTargetBatteryLevel(value[0] || 80)}
                                                                    max={100}

                                                                    min={Math.max(currentBatteryLevel + 5, 20)}

                                                                    step={5}

                                                                    className="w-full"

                                                                />

                                                                <div className="flex justify-between text-xs text-muted-foreground">

                                                                    <span>{Math.max(currentBatteryLevel + 5, 20)}%</span>

                                                                    <span>100%</span>

                                                                </div>

                                                            </div>



                                                            <div className="grid grid-cols-4 gap-1">

                                                                {[80, 90, 95, 100].map(level => (

                                                                    <button

                                                                        key={level}

                                                                        onClick={() => setTargetBatteryLevel(level)}

                                                                        disabled={level <= currentBatteryLevel}

                                                                        className={`p-1.5 rounded text-xs font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${targetBatteryLevel === level

                                                                            ? 'bg-primary text-primary-foreground'

                                                                            : 'bg-muted hover:bg-muted/80'

                                                                        }`}

                                                                    >

                                                                        {level}%

                                                                    </button>

                                                                ))}

                                                            </div>

                                                        </div>

                                                    </div>



                                                    <div>

                                                        <label className="text-sm text-muted-foreground mb-1 block">Time Slot</label>

                                                        <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>

                                                            <SelectTrigger className="w-full">

                                                                <SelectValue placeholder={language === 'vi' ? 'Chọn thời gian' : 'Select time'} />

                                                            </SelectTrigger>

                                                            <SelectContent>

                                                                {(() => {

                                                                    const timeSlots = generateTimeSlots();

                                                                    const groupedSlots = {

                                                                        immediate: timeSlots.filter(slot => slot.category === 'immediate'),

                                                                        today: timeSlots.filter(slot => slot.category === 'today'),

                                                                        tomorrow: timeSlots.filter(slot => slot.category === 'tomorrow'),

                                                                        nextweek: timeSlots.filter(slot => slot.category === 'nextweek')

                                                                    };



                                                                    return (

                                                                        <>

                                                                            {/* Immediate options */}

                                                                            {groupedSlots.immediate.map(slot => (

                                                                                <SelectItem key={slot.value} value={slot.value}>

                                                                                    <div className="flex items-center space-x-2">

                                                                                        <Clock className="w-4 h-4 text-primary" />

                                                                                        <span className="font-medium">{slot.label}</span>

                                                                                    </div>

                                                                                </SelectItem>

                                                                            ))}



                                                                            {/* Today options */}

                                                                            {groupedSlots.today.length > 0 && (

                                                                                <>

                                                                                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 -mx-1 sticky top-0">

                                                                                        {language === 'vi' ? 'Hôm nay' : 'Today'}

                                                                                    </div>

                                                                                    {groupedSlots.today.map(slot => (

                                                                                        <SelectItem key={slot.value} value={slot.value}>

                                                                                            <div className="flex items-center space-x-2">

                                                                                                <div className="w-2 h-2 bg-blue-500 rounded-full" />

                                                                                                <span>{slot.label}</span>

                                                                                            </div>

                                                                                        </SelectItem>

                                                                                    ))}

                                                                                </>

                                                                            )}



                                                                            {/* Tomorrow options */}

                                                                            {groupedSlots.tomorrow.length > 0 && (

                                                                                <>

                                                                                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 -mx-1 sticky top-0 mt-1">

                                                                                        {language === 'vi' ? 'Ngày mai' : 'Tomorrow'}

                                                                                    </div>

                                                                                    {groupedSlots.tomorrow.map(slot => (

                                                                                        <SelectItem key={slot.value} value={slot.value}>

                                                                                            <div className="flex items-center space-x-2">

                                                                                                <div className="w-2 h-2 bg-green-500 rounded-full" />

                                                                                                <span>{slot.label}</span>

                                                                                            </div>

                                                                                        </SelectItem>

                                                                                    ))}

                                                                                </>

                                                                            )}



                                                                            {/* Next week options */}

                                                                            {groupedSlots.nextweek.length > 0 && (

                                                                                <>

                                                                                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 -mx-1 sticky top-0 mt-1">

                                                                                        {language === 'vi' ? 'Tuần tới' : 'Next Week'}

                                                                                    </div>

                                                                                    {groupedSlots.nextweek.map(slot => (

                                                                                        <SelectItem key={slot.value} value={slot.value}>

                                                                                            <div className="flex items-center space-x-2">

                                                                                                <div className="w-2 h-2 bg-purple-500 rounded-full" />

                                                                                                <span>{slot.label}</span>

                                                                                            </div>

                                                                                        </SelectItem>

                                                                                    ))}

                                                                                </>

                                                                            )}

                                                                        </>

                                                                    );

                                                                })()}

                                                            </SelectContent>

                                                        </Select>

                                                    </div>

                                                </div>



                                                {/* Enhanced Cost Preview */}

                                                {targetBatteryLevel > currentBatteryLevel && (

                                                    <div className="bg-muted/30 rounded-lg p-3 space-y-2">

                                                        {(() => {

                                                            const costInfo = calculateEstimatedCost();

                                                            return (

                                                                <>

                                                                    <div className="flex items-center justify-between text-sm">

                                                                        <span>kWh needed:</span>

                                                                        <span className="font-medium">{costInfo.kwhNeeded} kWh</span>

                                                                    </div>

                                                                    <div className="flex items-center justify-between text-sm">

                                                                        <span>Estimated time:</span>

                                                                        <span className="font-medium">{formatTime(costInfo.chargingTime)}</span>

                                                                    </div>

                                                                    <div className="flex items-center justify-between text-sm">

                                                                        <span>Estimated Cost:</span>

                                                                        <span className="font-medium text-primary">

                                      {formatCurrency(costInfo.discountedPrice)}

                                    </span>

                                                                    </div>

                                                                    {subscriptionPlan && costInfo.discount > 0 && (

                                                                        <div className="text-xs text-green-600 dark:text-green-400">

                                                                            {subscriptionPlan.chargingDiscount}% discount applied (-{formatCurrency(costInfo.discountAmount)})

                                                                        </div>

                                                                    )}

                                                                </>

                                                            );

                                                        })()}

                                                    </div>

                                                )}



                                                <Dialog>

                                                    <DialogTrigger asChild>

                                                        <Button

                                                            className="w-full"

                                                            disabled={!selectedTimeSlot || targetBatteryLevel <= currentBatteryLevel}

                                                        >

                                                            <Calendar className="w-4 h-4 mr-2" />

                                                            Book Station

                                                        </Button>

                                                    </DialogTrigger>

                                                    <DialogContent className="max-w-md">

                                                        <DialogHeader>

                                                            <DialogTitle>

                                                                {language === 'vi' ? 'Xác nhận đặt chỗ' : 'Confirm Booking'}

                                                            </DialogTitle>

                                                            <DialogDescription>

                                                                {language === 'vi'

                                                                    ? 'Vui lòng xem xét chi tiết đặt chỗ của bạn'

                                                                    : 'Please review your booking details'

                                                                }

                                                            </DialogDescription>

                                                        </DialogHeader>



                                                        <div className="space-y-4">

                                                            {(() => {

                                                                const pricingInfo = calculateEstimatedCost();

                                                                return (

                                                                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">

                                                                        <h4 className="font-medium">{selectedStation?.stationName || ''}</h4>
                                                                        <p className="text-sm text-muted-foreground">{selectedStation?.address || ''}</p>


                                                                        {/* Battery Info */}

                                                                        <div className="grid grid-cols-2 gap-3 text-sm">

                                                                            <div className="flex justify-between">

                                                                                <span>Current Battery:</span>

                                                                                <span className="font-medium">{currentBatteryLevel}%</span>

                                                                            </div>

                                                                            <div className="flex justify-between">

                                                                                <span>Target Battery:</span>

                                                                                <span className="font-medium text-green-600 dark:text-green-400">{targetBatteryLevel}%</span>

                                                                            </div>

                                                                        </div>



                                                                        <div className="flex items-center justify-between text-sm">

                                                                            <span>{language === 'vi' ? 'Thời gian:' : 'Time:'}</span>

                                                                            <span className="font-medium">{formatSelectedTimeSlot(selectedTimeSlot)}</span>

                                                                        </div>



                                                                        <div className="flex items-center justify-between text-sm">

                                                                            <span>{language === 'vi' ? 'Thời lượng sạc:' : 'Charging Time:'}</span>

                                                                            <span className="font-medium">{formatTime(pricingInfo.chargingTime)}</span>

                                                                        </div>



                                                                        <div className="flex items-center justify-between text-sm">

                                                                            <span>{language === 'vi' ? 'Lượng điện:' : 'Energy Needed:'}</span>

                                                                            <span className="font-medium">{pricingInfo.kwhNeeded} kWh</span>

                                                                        </div>



                                                                        {/* User Subscription Info */}

                                                                        {subscriptionPlan && (

                                                                            <div className="bg-primary/10 rounded-lg p-3">

                                                                                <div className="flex items-center justify-between text-xs">

                                          <span className="text-primary font-medium">

                                            {language === 'vi' ? 'Gói đăng ký:' : 'Subscription:'}

                                          </span>

                                                                                    <span className="text-primary font-medium">{subscriptionPlan.name}</span>

                                                                                </div>

                                                                                <div className="text-xs text-primary/80 mt-1">

                                                                                    {language === 'vi'

                                                                                        ? `Giảm ${pricingInfo.discount}% cho phiên sạc`

                                                                                        : `${pricingInfo.discount}% discount on charging`

                                                                                    }

                                                                                </div>

                                                                            </div>

                                                                        )}



                                                                        {pricingInfo.discount > 0 && (

                                                                            <>

                                                                                <div className="flex items-center justify-between text-sm text-muted-foreground">

                                          <span>

                                            {language === 'vi' ? 'Giá gốc:' : 'Original Price:'}

                                          </span>

                                                                                    <span className="line-through">{formatCurrency(pricingInfo.originalPrice)}</span>

                                                                                </div>

                                                                                <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-400">

                                          <span>

                                            {language === 'vi' ? `Giảm giá (${pricingInfo.discount}%):` : `Discount (${pricingInfo.discount}%):`}

                                          </span>

                                                                                    <span>-{formatCurrency(pricingInfo.discountAmount)}</span>

                                                                                </div>

                                                                            </>

                                                                        )}



                                                                        <div className="flex items-center justify-between text-sm font-semibold border-t pt-2">

                                      <span>

                                        {language === 'vi' ? 'Tổng thanh toán:' : 'Total Cost:'}

                                      </span>

                                                                            <span className="text-primary">{formatCurrency(pricingInfo.discountedPrice)}</span>

                                                                        </div>



                                                                        {pricingInfo.discount > 0 && (

                                                                            <div className="text-xs text-green-600 dark:text-green-400 text-center bg-green-50 dark:bg-green-900/20 rounded-lg p-2">

                                                                                {language === 'vi'

                                                                                    ? `🎉 Bạn tiết kiệm được ${formatCurrency(pricingInfo.discountAmount)}!`

                                                                                    : `🎉 You save ${formatCurrency(pricingInfo.discountAmount)}!`

                                                                                }

                                                                            </div>

                                                                        )}

                                                                    </div>

                                                                );

                                                            })()}



                                                            <Button

                                                                onClick={handleBooking}

                                                                className="w-full"

                                                            >

                                                                {language === 'vi' ? 'Xác nhận đặt chỗ' : 'Confirm Booking'}

                                                            </Button>

                                                        </div>

                                                    </DialogContent>

                                                </Dialog>

                                            </div>

                                        )}

                                    </motion.div>

                                ))}

                            </div>
                        )}

                        {/* Pagination Controls */}
                        {!loading && filteredStations.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-6 space-y-4"
                            >
                                {/* Pagination Info */}
                                <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
                  <span>
                    {language === 'vi'
                        ? `Hiển thị ${startIndex + 1}-${Math.min(endIndex, totalFilteredStations)} của ${totalFilteredStations} trạm`
                        : `Showing ${startIndex + 1}-${Math.min(endIndex, totalFilteredStations)} of ${totalFilteredStations} stations`
                    }
                  </span>
                                    <span className="font-medium">
                    {language === 'vi' ? `Trang ${currentPage}/${totalPages}` : `Page ${currentPage}/${totalPages}`}
                  </span>
                                </div>

                                {/* Pagination Buttons */}
                                <div className="flex items-center justify-center space-x-2">
                                    {/* First Page Button */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                        className="h-9 w-9 p-0"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                        </svg>
                                    </Button>

                                    {/* Previous Page Button */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="h-9 px-3"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        {language === 'vi' ? 'Trước' : 'Prev'}
                                    </Button>

                                    {/* Page Numbers */}
                                    <div className="flex items-center space-x-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                                            // Show first page, last page, current page, and pages around current
                                            const showPage =
                                                pageNum === 1 ||
                                                pageNum === totalPages ||
                                                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);

                                            const showEllipsisBefore = pageNum === currentPage - 2 && currentPage > 3;
                                            const showEllipsisAfter = pageNum === currentPage + 2 && currentPage < totalPages - 2;

                                            if (showEllipsisBefore || showEllipsisAfter) {
                                                return (
                                                    <span key={pageNum} className="px-2 text-muted-foreground">
                            ...
                          </span>
                                                );
                                            }

                                            if (!showPage) return null;

                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={currentPage === pageNum ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`h-9 w-9 p-0 ${currentPage === pageNum
                                                        ? "bg-primary text-primary-foreground shadow-md"
                                                        : "hover:bg-accent"
                                                    }`}
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                    </div>

                                    {/* Next Page Button */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="h-9 px-3"
                                    >
                                        {language === 'vi' ? 'Sau' : 'Next'}
                                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Button>

                                    {/* Last Page Button */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="h-9 w-9 p-0"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                        </svg>
                                    </Button>
                                </div>

                                {/* Quick Jump */}
                                <div className="flex items-center justify-center space-x-2 text-sm">
                  <span className="text-muted-foreground">
                    {language === 'vi' ? 'Nhảy đến trang:' : 'Jump to page:'}
                  </span>
                                    <input
                                        type="number"
                                        min="1"
                                        max={totalPages}
                                        value={currentPage}
                                        onChange={(e) => {
                                            const page = parseInt(e.target.value);
                                            if (page >= 1 && page <= totalPages) {
                                                setCurrentPage(page);
                                            }
                                        }}
                                        aria-label={language === 'vi' ? 'Đi tới trang' : 'Jump to page'}
                                        className="w-16 h-8 px-2 text-center border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    <span className="text-muted-foreground">/ {totalPages}</span>
                                </div>
                            </motion.div>
                        )}
                    </div>



                    {/* Interactive Map Section */}

                    <div className="xl:col-span-3 space-y-6 order-1 xl:order-1">
                        {/* Map Controls */}





                    </div>

                </div>

            </div>



            {/* Station Details Dialog */}

            <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>

                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">

                    <DialogHeader>

                        <DialogTitle className="flex items-center space-x-2">

                            <Zap className="w-5 h-5 text-primary" />

                            <span>{detailsStation?.stationName}</span>
                        </DialogTitle>

                        <DialogDescription>

                            {language === 'vi' ? 'Thông tin chi tiết về trạm sạc' : 'Detailed charging station information'}

                        </DialogDescription>

                    </DialogHeader>



                    {detailsStation && (

                        <div className="space-y-6">

                            {/* Station Overview */}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <div className="space-y-3">

                                    <div>

                                        <h4 className="font-medium text-sm text-muted-foreground mb-1">

                                            {language === 'vi' ? 'Địa chỉ' : 'Address'}

                                        </h4>

                                        <p className="text-sm">{detailsStation.address}</p>

                                    </div>

                                    <div>

                                        <h4 className="font-medium text-sm text-muted-foreground mb-1">

                                            {language === 'vi' ? 'Tọa độ' : 'Coordinates'}
                                        </h4>

                                        <div className="flex items-center space-x-1">

                                            <MapPin className="w-4 h-4 text-primary" />

                                            <span className="text-sm">{detailsStation.latitude?.toFixed(4) || '0.0000'}, {detailsStation.longitude?.toFixed(4) || '0.0000'}</span>
                                        </div>

                                    </div>


                                </div>

                                <div className="space-y-3">

                                    <div>

                                        <h4 className="font-medium text-sm text-muted-foreground mb-1">

                                            {language === 'vi' ? 'Trạng thái' : 'Status'}

                                        </h4>

                                        <Badge

                                            variant={detailsStation.status === "Available" ? "default" : "secondary"}

                                            className={detailsStation.status === "Available" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : ""}

                                        >

                                            {detailsStation.status}

                                        </Badge>

                                    </div>

                                </div>

                            </div>



                            {/* Charging Information */}

                            <div>

                                <h4 className="font-medium mb-3">

                                    {language === 'vi' ? 'Thông tin sạc' : 'Charging Information'}

                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    <div className="bg-muted/30 rounded-lg p-3">

                                        <div className="flex items-center justify-between mb-2">

                      <span className="text-sm text-muted-foreground">

                        {language === 'vi' ? 'Cổng khả dụng' : 'Available Ports'}

                      </span>

                                            <Zap className="w-4 h-4 text-primary" />

                                        </div>

                                        <div className="space-y-2">
                                            {stationChargingPoints[detailsStation.stationId?.toString() || ''] ? (
                                                Object.entries(stationChargingPoints[detailsStation.stationId?.toString() || ''] || {}).map(([typeName, stats]) => (
                                                    <div key={typeName} className="flex items-center justify-between">
                                                        <span className="text-sm font-medium">{typeName}</span>
                                                        <span className="text-sm text-muted-foreground">
                                                            {stats.available}/{stats.total}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">
                                                        {stationTotalPoints[detailsStation.stationId?.toString() || ''] || detailsStation.chargingPointNumber || 0}
                                                        {language === 'vi' ? ' trụ sạc' : ' charging points'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-muted/30 rounded-lg p-3">

                                        <div className="flex items-center justify-between mb-2">

                      <span className="text-sm text-muted-foreground">

                        {language === 'vi' ? 'Giá mỗi kWh' : 'Price per kWh'}

                      </span>

                                            <DollarSign className="w-4 h-4 text-primary" />

                                        </div>

                                        <p className="text-lg font-semibold text-primary">ID: {detailsStation.stationId}</p>
                                    </div>

                                </div>

                            </div>







                            {/* Action Buttons */}

                            <div className="flex space-x-3 pt-4 border-t">

                                <Button

                                    onClick={() => {

                                        setSelectedStation(detailsStation);

                                        setIsDetailsDialogOpen(false);

                                    }}

                                    className="flex-1"

                                    disabled={detailsStation.status !== "Available"}

                                >

                                    <Calendar className="w-4 h-4 mr-2" />

                                    {language === 'vi' ? 'Đặt chỗ' : 'Book Station'}

                                </Button>

                                <Button

                                    variant="outline"

                                    onClick={() => {

                                        alert(`Opening navigation to ${detailsStation.stationName}`);
                                    }}

                                >

                                    <Navigation className="w-4 h-4 mr-2" />

                                    {language === 'vi' ? 'Dẫn đường' : 'Navigate'}

                                </Button>

                            </div>

                        </div>

                    )}

                </DialogContent>

            </Dialog>

            {/* Charging Configuration Dialog */}
            <Dialog open={isChargingConfigOpen} onOpenChange={handleChargingConfigOpenChange}>
                <style>{`
                    .charging-config-content::-webkit-scrollbar {
                        display: none;
                    }
                    .available-slots-list::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
                <DialogContent className="max-w-[66.666667%] max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader className="flex-shrink-0 text-center">
                        <DialogTitle className="flex items-center justify-center space-x-2">
                            <Zap className="w-5 h-5 text-primary" />
                            <span>{language === 'vi' ? 'Cấu hình sạc xe' : 'Charging Configuration'}</span>
                        </DialogTitle>
                        <DialogDescription className="text-center">
                            {language === 'vi' ? 'Cấu hình mức pin và thời gian sạc cho trạm' : 'Configure battery level and charging time for station'}
                        </DialogDescription>
                    </DialogHeader>

                    {configStation && (
                        <div 
                            className="flex-1 overflow-y-auto px-6 py-4 space-y-6 charging-config-content"
                            style={{
                                scrollbarWidth: 'none', /* Firefox */
                                msOverflowStyle: 'none', /* IE and Edge */
                            }}
                        >
                            {/* Station Info */}
                            <div className="bg-muted/50 rounded-lg p-4 text-center">
                                <h4 className="font-medium mb-2">{configStation.stationName}</h4>
                                <p className="text-sm text-muted-foreground">{configStation.address}</p>
                                <div className="mt-2 text-sm">
                                    {stationChargingPoints[configStation.stationId?.toString() || ''] ? (
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {Object.entries(stationChargingPoints[configStation.stationId?.toString() || ''] || {}).map(([typeName, stats]) => (
                                                <div key={typeName} className="flex items-center space-x-1 bg-primary/10 rounded px-2 py-1">
                                                    <Zap className="w-3 h-3 text-primary" />
                                                    <span className="text-xs font-medium text-primary">
                                                        {typeName}: {stats.available}/{stats.total}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="flex items-center space-x-1 justify-center">
                                            <Zap className="w-4 h-4 text-primary" />
                                            <span>{stationTotalPoints[configStation.stationId?.toString() || ''] || configStation.chargingPointNumber || 0} {language === 'vi' ? 'trụ sạc' : 'charging points'}</span>
                                        </span>
                                    )}
                                </div>
                                <Badge variant="outline" className="bg-green-100 text-green-800 mt-2">
                                    {language === 'vi' ? 'Hoạt động' : 'Active'}
                                </Badge>
                            </div>

                            {/* Selected Vehicle Info */}
                            {(selectedVehicle || selectedVehicleRef.current) && (
                                <div className={`rounded-lg p-4 ${isVehicleCurrentlyCharging ? 'bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-500' : 'bg-primary/10'}`}>
                                    <h4 className="font-medium flex items-center space-x-2 mb-2">
                                        <Car className="w-4 h-4 text-primary" />
                                        <span>{language === 'vi' ? 'Xe đã chọn' : 'Selected Vehicle'}</span>
                                        {isVehicleCurrentlyCharging && (
                                            <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-500">
                                                <Zap className="w-3 h-3 mr-1 animate-pulse" />
                                                {language === 'vi' ? 'Đang sạc' : 'Charging'}
                                            </Badge>
                                        )}
                                    </h4>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                                            <Car className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{(selectedVehicle || selectedVehicleRef.current)?.model || (selectedVehicle || selectedVehicleRef.current)?.carModel?.model || 'Unknown Model'}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {(selectedVehicle || selectedVehicleRef.current)?.licensePlate || (selectedVehicle || selectedVehicleRef.current)?.licenseNumber || (selectedVehicle || selectedVehicleRef.current)?.plateNumber || 'No License Plate'}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsVehicleSelectionOpen(true)}
                                        >
                                            {language === 'vi' ? 'Đổi xe' : 'Change'}
                                        </Button>
                                    </div>
                                    {isVehicleCurrentlyCharging && (
                                        <div className="mt-3 p-2 bg-amber-100 dark:bg-amber-900/30 rounded text-xs text-amber-800 dark:text-amber-200">
                                            <Info className="w-3 h-3 inline mr-1" />
                                            {language === 'vi' 
                                                ? 'Xe này đang trong quá trình sạc. Bạn chỉ có thể đặt lịch sạc cho lần tiếp theo.'
                                                : 'This vehicle is currently charging. You can only schedule for the next session.'}
                                        </div>
                                    )}
                                </div>
                            )}


                            {/* Show loading state for schedule mode when selecting time */}
                            {bookingMode === "scheduled" && chargingStartTimeInput && loadingSlots && (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                    <span className="ml-2 text-sm text-muted-foreground">
                                        {language === 'vi' ? 'Đang tìm slot khả dụng...' : 'Finding available slots...'}
                                    </span>
                                </div>
                            )}

                            {/* Show message if no slots for schedule mode after selecting time */}
                            {bookingMode === "scheduled" && chargingStartTimeInput && !loadingSlots && availableSlots.length === 0 && (
                                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                    <div className="flex items-start space-x-3">
                                        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="font-medium text-amber-700 dark:text-amber-300">
                                                {language === 'vi' ? 'Không có slot khả dụng' : 'No available slots'}
                                            </p>
                                            <p className="text-amber-600 dark:text-amber-400 mt-1">
                                                {language === 'vi'
                                                    ? 'Không có slot phù hợp từ thời gian đã chọn. Vui lòng chọn thời gian khác.'
                                                    : 'No suitable slots from selected time. Please choose another time.'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Booking Mode Selection */}
                            <div className="space-y-3">
                                <h4 className="font-medium flex items-center justify-center space-x-2 text-sm">
                                    <Clock className="w-4 h-4 text-primary" />
                                    <span>{language === 'vi' ? 'Chọn thời gian đặt lịch' : 'Select Booking Time'}</span>
                                </h4>

                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant={bookingMode === "now" ? "default" : "outline"}
                                        onClick={() => {
                                            if (isVehicleCurrentlyCharging) {
                                                toast(
                                                    language === 'vi'
                                                        ? 'Không thể sạc ngay khi xe đang trong quá trình sạc. Vui lòng đặt lịch.'
                                                        : 'Cannot book now while vehicle is charging. Please schedule instead.',
                                                    { duration: 5000 }
                                                );
                                                return;
                                            }
                                            setBookingMode("now");
                                            clearScheduledResults();
                                            setScheduledTime("");
                                        }}
                                        className="flex items-center space-x-2"
                                        disabled={isVehicleCurrentlyCharging}
                                    >
                                        <Zap className="w-4 h-4" />
                                        <span>{language === 'vi' ? 'Sạc ngay' : 'Book Now'}</span>
                                        {isVehicleCurrentlyCharging && (
                                            <Badge variant="destructive" className="ml-2 text-xs">
                                                {language === 'vi' ? 'Đang sạc' : 'Charging'}
                                            </Badge>
                                        )}
                                    </Button>

                                    <Button
                                        variant={bookingMode === "scheduled" ? "default" : "outline"}
                                        onClick={() => {
                                            setBookingMode("scheduled");
                                            clearScheduledResults();
                                            if (!scheduledDate) {
                                                setScheduledDate(minScheduledDate);
                                            }
                                        }}
                                        className="flex items-center space-x-2"
                                    >
                                        <Calendar className="w-4 h-4" />
                                        <span>{language === 'vi' ? 'Đặt lịch' : 'Schedule'}</span>
                                    </Button>
                                </div>

                                {bookingMode === "scheduled" && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">
                                                {language === 'vi' ? 'Ngày sạc' : 'Charging Date'}
                                            </label>
                                            <Input
                                                type="date"
                                                value={scheduledDate}
                                                min={minScheduledDate}
                                                onChange={(e) => {
                                                    setScheduledDate(e.target.value);
                                                    clearScheduledResults();
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">
                                                {language === 'vi' ? 'Giờ bắt đầu' : 'Start Time'}
                                            </label>
                                            <Input
                                                type="time"
                                                value={scheduledTime}
                                                onChange={(e) => {
                                                    setScheduledTime(e.target.value);
                                                    clearScheduledResults();
                                                }}
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <Button
                                                className="w-full"
                                                onClick={() => handleStartTimeSelection(scheduledDate, scheduledTime)}
                                                disabled={loadingSlots || !scheduledDate || !scheduledTime}
                                            >
                                                {loadingSlots ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                        {language === 'vi' ? 'Đang lọc...' : 'Filtering...'}
                                                    </>
                                                ) : (
                                                    <span>
                                                        {language === 'vi' ? 'Lọc slot theo thời gian' : 'Filter slots by time'}
                                                    </span>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Find Available Slots Button for Schedule Mode */}
                                {bookingMode === "scheduled" && configStation && (
                                    <div className="flex justify-center pt-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={async () => {
                                                if (!configStation) return;
                                                clearScheduledResults();
                                                setLoadingSlots(true);
                                                setExpandedChargingPoints(new Set());
                                                setSelectedSlot(null);
                                                setSelectedSlots([]);
                                                try {
                                                    const slots = await callApiForFindAvailableSlots(
                                                        configStation.stationId?.toString() || '',
                                                        initialBatteryLevel,
                                                        targetBatteryLevelConfig
                                                    );
                                                    if (slots && slots.length > 0) {
                                                        setAvailableSlots(slots);
                                                        toast.success(
                                                            language === 'vi'
                                                                ? `Tìm thấy ${slots.length} slot khả dụng`
                                                                : `Found ${slots.length} available slots`
                                                        );
                                                    } else {
                                                        setAvailableSlots([]);
                                                        toast(
                                                            language === 'vi'
                                                                ? 'Không có slot khả dụng'
                                                                : 'No available slots found'
                                                        );
                                                    }
                                                } catch (error) {
                                                    console.error("Error finding available slots:", error);
                                                    toast.error(
                                                        language === 'vi'
                                                            ? 'Lỗi khi tìm slot khả dụng'
                                                            : 'Error finding available slots'
                                                    );
                                                } finally {
                                                    setLoadingSlots(false);
                                                }
                                            }}
                                            disabled={loadingSlots}
                                            className="flex items-center space-x-2"
                                        >
                                            {loadingSlots ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>{language === 'vi' ? 'Đang tìm...' : 'Finding...'}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Search className="w-4 h-4" />
                                                    <span>{language === 'vi' ? 'Tìm slot khả dụng' : 'Find Available Slots'}</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Battery Configuration */}
                            <div className="space-y-4">
                                <h4 className="font-medium flex items-center justify-center space-x-2 text-sm">
                                    <Battery className="w-4 h-4 text-primary" />
                                    <span>{language === 'vi' ? 'Cấu hình pin' : 'Battery Configuration'}</span>
                                </h4>

                                {/* Battery Levels Row */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Current Battery Level */}
                                    <div 
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                            activeBatteryControl === "current" 
                                                ? 'border-primary bg-primary/10' 
                                                : 'border-border hover:border-primary/50'
                                        }`}
                                        onClick={() => setActiveBatteryControl("current")}
                                    >
                                        <div className="text-center space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground block">
                                                {language === 'vi' ? 'Pin hiện tại' : 'Current Battery'}
                                            </label>
                                            <div className={`text-3xl font-bold ${
                                                initialBatteryLevel <= 20 ? 'text-destructive' :
                                                initialBatteryLevel <= 50 ? 'text-yellow-600' : 'text-primary'
                                            }`}>
                                                {initialBatteryLevel}%
                                            </div>
                                            {activeBatteryControl === "current" && (
                                                <div className="text-xs text-primary font-medium">
                                                    {language === 'vi' ? 'Đang điều chỉnh' : 'Active'}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Target Battery Level */}
                                    <div 
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                            activeBatteryControl === "target" 
                                                ? 'border-primary bg-primary/10' 
                                                : 'border-border hover:border-primary/50'
                                        }`}
                                        onClick={() => setActiveBatteryControl("target")}
                                    >
                                        <div className="text-center space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground block">
                                                {language === 'vi' ? 'Pin mong đợi' : 'Target Battery'}
                                            </label>
                                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                                {targetBatteryLevelConfig}%
                                            </div>
                                            {activeBatteryControl === "target" && (
                                                <div className="text-xs text-primary font-medium">
                                                    {language === 'vi' ? 'Đang điều chỉnh' : 'Active'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Unified Slider Control */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>
                                            {activeBatteryControl === "current" 
                                                ? (language === 'vi' ? 'Điều chỉnh pin hiện tại' : 'Adjust Current Battery')
                                                : (language === 'vi' ? 'Điều chỉnh pin mong đợi' : 'Adjust Target Battery')
                                            }
                                        </span>
                                        <span className="font-medium">
                                            {activeBatteryControl === "current" ? initialBatteryLevel : targetBatteryLevelConfig}%
                                        </span>
                                    </div>
                                    <Slider
                                        value={activeBatteryControl === "current" ? [initialBatteryLevel] : [targetBatteryLevelConfig]}
                                        onValueChange={(value: number[]) => {
                                            const newValue = value[0] || 0;
                                            if (activeBatteryControl === "current") {
                                                const clampedValue = Math.max(0, Math.min(100, newValue));
                                                setInitialBatteryLevel(clampedValue);
                                                // Ensure target is always higher than current
                                                if (targetBatteryLevelConfig <= clampedValue) {
                                                    setTargetBatteryLevelConfig(Math.min(100, clampedValue + 5));
                                                }
                                            } else {
                                                const clampedValue = Math.max(initialBatteryLevel + 5, Math.min(100, newValue));
                                                setTargetBatteryLevelConfig(clampedValue);
                                            }
                                        }}
                                        max={100}
                                        min={activeBatteryControl === "current" ? 0 : initialBatteryLevel + 5}
                                        step={1}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>{activeBatteryControl === "current" ? "0%" : `${initialBatteryLevel + 5}%`}</span>
                                        <span>100%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Charging Points and Slots Display */}
                            {availableSlots.length > 0 && (() => {
                                // Filter available slots only
                                const availableOnlySlots = availableSlots.filter((slot) => {
                                    return slot.status === 'AVAILABLE' || !slot.status || slot.freeFrom;
                                });

                                // Group slots by charging point
                                const slotsByChargingPoint = new Map<number, any[]>();
                                const chargingPointsMap = new Map<number, any>();
                                
                                availableSlots.forEach((slot) => {
                                    const chargingPointId = slot.chargingPointId || slot.chargingPointInfo?.id;
                                    if (chargingPointId) {
                                        if (!slotsByChargingPoint.has(chargingPointId)) {
                                            slotsByChargingPoint.set(chargingPointId, []);
                                            chargingPointsMap.set(chargingPointId, slot.chargingPointInfo || {
                                                id: chargingPointId,
                                                chargingPointName: slot.chargingPointName || slot.chargingPointInfo?.chargingPointName || `Point ${chargingPointId}`,
                                                connectorType: slot.connectorType,
                                                powerOutput: slot.powerOutput,
                                                pricePerKwh: slot.pricePerKwh
                                            });
                                        }
                                        slotsByChargingPoint.get(chargingPointId)!.push(slot);
                                    }
                                });

                                const chargingPointsList = Array.from(chargingPointsMap.values());

                                return (
                                    <div className="space-y-3">
                                        <h4 className="font-medium flex items-center space-x-2 text-sm">
                                            <Zap className="w-4 h-4 text-primary" />
                                            <span>{language === 'vi' ? 'Điểm sạc khả dụng' : 'Available Charging Points'}</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {chargingPointsList.length}
                                            </Badge>
                                        </h4>

                                        <div 
                                            className="space-y-2 max-h-96 overflow-y-auto pr-2 available-slots-list"
                                            style={{
                                                scrollbarWidth: 'none', /* Firefox */
                                                msOverflowStyle: 'none', /* IE and Edge */
                                            }}
                                        >
                                            {chargingPointsList.map((cp: any) => {
                                                const cpId = cp.id || cp.chargingPointId;
                                                const slots = slotsByChargingPoint.get(cpId) || [];
                                                const isExpanded = expandedChargingPoints.has(cpId);
                                                const { connectorTypeName, powerOutput, pricePerKwh } = extractSlotInfo({ connectorType: cp.connectorType, powerOutput: cp.powerOutput, pricePerKwh: cp.pricePerKwh });

                                                return (
                                                    <div key={cpId} className="border rounded-lg overflow-hidden">
                                                        {/* Charging Point Card */}
                                                        <div 
                                                            className="p-3 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                                                            onClick={() => {
                                                                const newExpanded = new Set(expandedChargingPoints);
                                                                if (isExpanded) {
                                                                    newExpanded.delete(cpId);
                                                                } else {
                                                                    newExpanded.add(cpId);
                                                                }
                                                                setExpandedChargingPoints(newExpanded);
                                                            }}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center space-x-2">
                                                                        <Zap className="w-4 h-4 text-primary" />
                                                                        <p className="text-sm font-medium">
                                                                            {cp.chargingPointName ? `${cp.chargingPointName} • ` : ''}{connectorTypeName}
                                                                        </p>
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {slots.length} {language === 'vi' ? 'slot' : 'slots'}
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                        {powerOutput !== null ? `${powerOutput} kW` : 'Power N/A'} •
                                                                        {pricePerKwh !== null ? ` ${pricePerKwh} VND/kWh` : ' Price N/A'}
                                                                    </p>
                                                                </div>
                                                                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                            </div>
                                                        </div>

                                                        {/* Slots Display */}
                                                        {isExpanded && (
                                                            <div className="p-4 bg-gradient-to-br from-muted/30 to-background border-t">
                                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                                                    {slots.map((slot: any, slotIndex: number) => {
                                                                        const isAvailable = slot.status === 'AVAILABLE' || !slot.status || slot.freeFrom;
                                                                        const isSelected = selectedSlot === slot || selectedSlots.some(s => s === slot);
                                                                        const isFirstSelected = selectedSlots.length > 0 && selectedSlots[0] === slot;
                                                                        const isSecondSelected = selectedSlots.length === 2 && selectedSlots[1] === slot;
                                                                        const startTime = slot.freeFrom ? new Date(slot.freeFrom) : null;
                                                                        const endTime = slot.freeTo ? new Date(slot.freeTo) : null;

                                                                        // Check if slot is adjacent to first selected slot
                                                                        const isAdjacent = selectedSlots.length === 1 && startTime && selectedSlots[0]?.freeTo && 
                                                                            Math.abs(new Date(selectedSlots[0].freeTo).getTime() - startTime.getTime()) <= 15 * 60 * 1000; // Within 15 minutes

                                                                        return (
                                                                            <div
                                                                                key={slotIndex}
                                                                                className={`relative p-1.5 rounded-xl cursor-pointer transition-all duration-200 border-2 shadow-sm ${
                                                                                    isSelected
                                                                                        ? 'border-primary bg-gradient-to-br from-primary/20 to-primary/10 ring-2 ring-primary/30 shadow-md scale-105'
                                                                                        : isAdjacent
                                                                                        ? 'border-blue-500/70 bg-gradient-to-br from-blue-50 via-blue-50/80 to-cyan-50 dark:from-blue-950/40 dark:via-blue-900/30 dark:to-cyan-950/40 hover:border-blue-600'
                                                                                        : isAvailable
                                                                                        ? 'border-green-500/70 bg-gradient-to-br from-green-50 via-green-50/80 to-emerald-50 dark:from-green-950/40 dark:via-green-900/30 dark:to-emerald-950/40 hover:border-green-600 hover:bg-gradient-to-br hover:from-green-100 hover:via-green-50 hover:to-emerald-50 dark:hover:from-green-900/50 dark:hover:via-green-800/40 dark:hover:to-emerald-900/50 hover:shadow-md hover:scale-105 hover:-translate-y-0.5'
                                                                                        : 'border-orange-500/70 bg-gradient-to-br from-orange-50 via-orange-50/80 to-amber-50 dark:from-orange-950/40 dark:via-orange-900/30 dark:to-amber-950/40 opacity-75 cursor-not-allowed'
                                                                                }`}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    if (isAvailable) {
                                                                                        setSelectedSlots((prevSlots) => {
                                                                                            // Helper to compare slots by time
                                                                                            const isSameSlot = (s1: any, s2: any) => {
                                                                                                return s1?.freeFrom === s2?.freeFrom && s1?.freeTo === s2?.freeTo;
                                                                                            };
                                                                                            
                                                                                            if (prevSlots.length === 0) {
                                                                                                // First slot selection
                                                                                                setSelectedSlot(slot);
                                                                                                console.log("✅ First slot selected:", slot.freeFrom, "to", slot.freeTo);
                                                                                                return [slot];
                                                                                            } else if (prevSlots.length === 1) {
                                                                                                // Check if clicking the same slot - deselect
                                                                                                if (isSameSlot(slot, prevSlots[0])) {
                                                                                                    setSelectedSlot(null);
                                                                                                    console.log("❌ Slot deselected");
                                                                                                    return [];
                                                                                                }
                                                                                                
                                                                                                // Check if this slot is adjacent to the first one
                                                                                                const firstSlotEnd = prevSlots[0]?.freeTo ? new Date(prevSlots[0].freeTo) : null;
                                                                                                const thisSlotStart = startTime;
                                                                                                
                                                                                                console.log("🔍 Checking adjacency:");
                                                                                                console.log("  First slot ends at:", firstSlotEnd?.toISOString());
                                                                                                console.log("  This slot starts at:", thisSlotStart?.toISOString());
                                                                                                
                                                                                                if (firstSlotEnd && thisSlotStart) {
                                                                                                    const timeDiff = Math.abs(firstSlotEnd.getTime() - thisSlotStart.getTime());
                                                                                                    console.log("  Time difference (ms):", timeDiff);
                                                                                                    console.log("  Time difference (minutes):", timeDiff / 60000);
                                                                                                    
                                                                                                    // Allow up to 20 minutes difference for flexibility (slots can be 15 or 30 min apart)
                                                                                                    if (timeDiff < 20 * 60 * 1000) {
                                                                                                        // Adjacent slot - add as second slot
                                                                                                        setSelectedSlot(slot);
                                                                                                        console.log("✅ Second adjacent slot selected!");
                                                                                                        return [prevSlots[0], slot];
                                                                                                    }
                                                                                                }
                                                                                                
                                                                                                // Not adjacent - replace first slot
                                                                                                setSelectedSlot(slot);
                                                                                                console.log("⚠️ Not adjacent - Slot replaced");
                                                                                                return [slot];
                                                                                            } else if (prevSlots.length === 2) {
                                                                                                // Already have 2 slots - replace with new selection
                                                                                                if (isSameSlot(slot, prevSlots[0]) || isSameSlot(slot, prevSlots[1])) {
                                                                                                    // Clicking selected slot - deselect
                                                                                                    const newSlots = prevSlots.filter(s => !isSameSlot(s, slot));
                                                                                                    setSelectedSlot(newSlots.length > 0 ? newSlots[0] : null);
                                                                                                    console.log("❌ Slot deselected, remaining:", newSlots.length);
                                                                                                    return newSlots;
                                                                                                } else {
                                                                                                    // Replace with new single selection
                                                                                                    setSelectedSlot(slot);
                                                                                                    console.log("🔄 Replaced with new slot");
                                                                                                    return [slot];
                                                                                                }
                                                                                            }
                                                                                            return prevSlots;
                                                                                        });
                                                                                    }
                                                                                }}
                                                                            >
                                                                                {isSelected && (
                                                                                    <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1 shadow-lg">
                                                                                        <CheckCircle className="w-5 h-5 text-white" />
                                                                                    </div>
                                                                                )}
                                                                                {isFirstSelected && (
                                                                                    <div className="absolute top-1 left-1 bg-primary text-white text-[8px] px-1 rounded">
                                                                                        1
                                                                                    </div>
                                                                                )}
                                                                                {isSecondSelected && (
                                                                                    <div className="absolute top-1 left-1 bg-primary text-white text-[8px] px-1 rounded">
                                                                                        2
                                                                                    </div>
                                                                                )}
                                                                                {isAvailable && !isSelected && (
                                                                                    <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                                                )}
                                                                                <div className="text-center space-y-0.5">
                                                                                    {startTime && endTime ? (
                                                                                        <>
                                                                                            <div className="space-y-0">
                                                                                                <p className="text-sm font-bold text-foreground leading-tight">
                                                                                                    {startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                                                                </p>
                                                                                            </div>
                                                                                            <div className="flex items-center justify-center">
                                                                                                <div className="h-px w-4 bg-gradient-to-r from-transparent via-muted-foreground/40 to-transparent"></div>
                                                                                            </div>
                                                                                            <div className="space-y-0">
                                                                                                <p className="text-sm font-bold text-foreground leading-tight">
                                                                                                    {endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                                                                </p>
                                                                                            </div>
                                                                                        </>
                                                                                    ) : (
                                                                                        <div className="space-y-1 py-1">
                                                                                            <div className={`w-4 h-4 rounded-full mx-auto ${
                                                                                                isAvailable 
                                                                                                    ? 'bg-green-500 shadow-lg shadow-green-500/50' 
                                                                                                    : 'bg-orange-500 shadow-lg shadow-orange-500/50'
                                                                                            }`}></div>
                                                                                            <p className={`text-sm font-semibold ${
                                                                                                isAvailable 
                                                                                                    ? 'text-green-700 dark:text-green-400'
                                                                                                    : 'text-orange-700 dark:text-orange-400'
                                                                                            }`}>
                                                                                                {isAvailable 
                                                                                                    ? (language === 'vi' ? 'Khả dụng' : 'Available')
                                                                                                    : (language === 'vi' ? 'Đã đặt' : 'Booked')
                                                                                                }
                                                                                            </p>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}



                        </div>
                    )}

                    {/* Confirm and Cancel Buttons - Sticky at bottom */}
                    <div className="flex-shrink-0 flex space-x-2 pt-4 pb-4 px-6 border-t bg-background">
                        <Button
                            onClick={async () => {
                                // Check if vehicle is currently charging (for Book Now mode)
                                if (bookingMode === "now" && isVehicleCurrentlyCharging) {
                                    toast.error(
                                        language === 'vi'
                                            ? 'Không thể sạc ngay khi xe đang trong quá trình sạc. Vui lòng đặt lịch.'
                                            : 'Cannot book now while vehicle is charging. Please schedule instead.'
                                    );
                                    return;
                                }

                                // For Book Now: auto-select first available slot
                                let slotToUse = selectedSlot;
                                if (bookingMode === "now") {
                                    if (availableSlots.length === 0) {
                                        toast.error(language === 'vi' ? 'Không có slot khả dụng' : 'No available slots');
                                        return;
                                    }
                                    // Auto-select first slot for Book Now
                                    slotToUse = availableSlots[0];
                                    console.log("Auto-selected first slot for Book Now:", slotToUse);
                                } else {
                                    // For Schedule: must have selected slot(s)
                                    // Check both selectedSlots and selectedSlot for backward compatibility
                                    const hasSelectedSlots = selectedSlots.length > 0;
                                    const hasSelectedSlot = selectedSlot !== null;
                                    
                                    if (!hasSelectedSlots && !hasSelectedSlot) {
                                        toast.error(language === 'vi' ? 'Vui lòng chọn slot' : 'Please select a slot');
                                        return;
                                    }
                                    // Use first slot for charging point info, but use times from all selected slots
                                    slotToUse = hasSelectedSlots ? selectedSlots[0] : selectedSlot;
                                    console.log("Schedule mode - Using slot:", slotToUse);
                                    console.log("Schedule mode - Selected slots count:", selectedSlots.length);
                                    console.log("Schedule mode - Has selectedSlot:", hasSelectedSlot);
                                }

                                // Time validation is now done in the time calculation section below
                                // using times from selected slots

                                // Ensure we have a valid numeric vehicle ID
                                const selectedVehicleForId = selectedVehicle || selectedVehicleRef.current;
                                const vehicleId = selectedVehicleForId?.vehicleId || selectedVehicleForId?.id || selectedVehicleForId?.VehicleId;
                                const numericVehicleId = typeof vehicleId === 'number' ? vehicleId : parseInt(vehicleId);

                                if (!vehicleId || isNaN(numericVehicleId)) {
                                    toast.error(language === 'vi' ? 'Không tìm thấy ID xe hợp lệ' : 'Invalid vehicle ID');
                                    return;
                                }

                                // Calculate estimated cost from slot data
                                const estimatedCost = selectedSlot?.estimatedCost || 0;

                                // ===== CRITICAL TIME CALCULATION WITH PROPER TIMEZONE HANDLING =====
                                // Helper function to format time for backend (Asia/Ho_Chi_Minh timezone)
                                const formatTimeForBackend = (date: Date): string => {
                                    // Convert to Vietnam timezone (UTC+7)
                                    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
                                    const vietnamTime = new Date(utcTime + (7 * 3600000));

                                    // Format as ISO string but in Vietnam timezone
                                    const year = vietnamTime.getFullYear();
                                    const month = String(vietnamTime.getMonth() + 1).padStart(2, '0');
                                    const day = String(vietnamTime.getDate()).padStart(2, '0');
                                    const hours = String(vietnamTime.getHours()).padStart(2, '0');
                                    const minutes = String(vietnamTime.getMinutes()).padStart(2, '0');
                                    const seconds = String(vietnamTime.getSeconds()).padStart(2, '0');
                                    const milliseconds = String(vietnamTime.getMilliseconds()).padStart(3, '0');

                                    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
                                };

                                // Get current time
                                const now = new Date();
                                const vietnamTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (7 * 3600000));

                                let finalStartTime: Date;
                                let finalEndTime: Date;

                                // Get slots to use for time calculation
                                const slotsToUseForTime = selectedSlots.length > 0 ? selectedSlots : (selectedSlot ? [selectedSlot] : (slotToUse ? [slotToUse] : []));
                                
                                if (slotsToUseForTime.length > 0) {
                                    // Use time from selected slot(s)
                                    console.log("=== USING TIME FROM SELECTED SLOTS ===");
                                    console.log("Selected slots count:", slotsToUseForTime.length);

                                    // Get start time from first slot
                                    const firstSlot = slotsToUseForTime[0];
                                    const firstSlotStart = firstSlot?.freeFrom ? new Date(firstSlot.freeFrom) : null;
                                    
                                    if (!firstSlotStart) {
                                        toast.error(language === 'vi' ? 'Slot không có thời gian bắt đầu' : 'Slot does not have start time');
                                        return;
                                    }

                                    // For Book Now: always use current time, not slot time
                                    // For Schedule: use slot time
                                    if (bookingMode === "now") {
                                        finalStartTime = vietnamTime;
                                        console.log("Book Now - Using current time instead of slot time");
                                        console.log("Book Now - Slot start time (ignored):", firstSlotStart.toISOString());
                                        console.log("Book Now - Actual start time (current):", finalStartTime.toISOString());
                                    } else {
                                        finalStartTime = firstSlotStart;
                                        console.log("Schedule - Using slot start time:", finalStartTime.toISOString());
                                    }

                                    // Get end time from last slot (if multiple slots) or from first slot
                                    if (slotsToUseForTime.length >= 2) {
                                        // Multiple slots: use end time from last slot
                                        const lastSlot = slotsToUseForTime[slotsToUseForTime.length - 1];
                                        const lastSlotEnd = lastSlot?.freeTo ? new Date(lastSlot.freeTo) : null;
                                        
                                        if (lastSlotEnd) {
                                            finalEndTime = lastSlotEnd;
                                            console.log("Using end time from last slot:", finalEndTime.toISOString());
                                        } else {
                                            // Fallback: use end time from first slot or calculate
                                            const firstSlotEnd = firstSlot?.freeTo ? new Date(firstSlot.freeTo) : null;
                                            if (firstSlotEnd) {
                                                finalEndTime = firstSlotEnd;
                                            } else {
                                                // Calculate from duration
                                                const rawRequired = Number(firstSlot?.requiredMinutes);
                                                const minDuration = 30;
                                                const durationMinutes = Number.isFinite(rawRequired) && rawRequired > 0
                                                    ? Math.max(rawRequired, minDuration)
                                                    : minDuration;
                                                finalEndTime = new Date(finalStartTime.getTime() + durationMinutes * 60000);
                                            }
                                        }
                                    } else {
                                        // Single slot: use slot's end time or calculate from duration
                                        const firstSlotEnd = firstSlot?.freeTo ? new Date(firstSlot.freeTo) : null;
                                        
                                        if (firstSlotEnd) {
                                            finalEndTime = firstSlotEnd;
                                        } else {
                                            // Calculate from duration
                                            const rawRequired = Number(firstSlot?.requiredMinutes);
                                            const minDuration = 30;
                                            const durationMinutes = Number.isFinite(rawRequired) && rawRequired > 0
                                                ? Math.max(rawRequired, minDuration)
                                                : minDuration;
                                            finalEndTime = new Date(finalStartTime.getTime() + durationMinutes * 60000);
                                        }
                                    }

                                    console.log("Start time (from first slot):", finalStartTime.toISOString());
                                    console.log("End time (from last slot):", finalEndTime.toISOString());

                                } else if (bookingMode === "now") {
                                    // For "Book Now" without selected slot, use current Vietnam time as start time
                                    console.log("=== BOOK NOW MODE (NO SLOT SELECTED) ===");
                                    finalStartTime = vietnamTime;

                                    // Calculate duration from auto-selected slot
                                    const rawRequired = Number(slotToUse?.requiredMinutes);
                                    const minDuration = 30; // Backend minimum booking duration in minutes
                                    const durationMinutes = Number.isFinite(rawRequired) && rawRequired > 0
                                        ? Math.max(rawRequired, minDuration)
                                        : minDuration;
                                    finalEndTime = new Date(finalStartTime.getTime() + durationMinutes * 60000);

                                    console.log("Book Now - UTC Current time:", now.toISOString());
                                    console.log("Book Now - Vietnam Current time:", vietnamTime.toISOString());
                                    console.log("Book Now - Start time:", finalStartTime.toISOString());
                                    console.log("Book Now - End time:", finalEndTime.toISOString());
                                    console.log("Book Now - Duration (minutes):", durationMinutes);

                                } else {
                                    toast.error(language === 'vi' ? 'Vui lòng chọn slot' : 'Please select a slot');
                                    return;
                                }

                                // Validate: must be at least 30 minutes from now (for scheduled bookings)
                                if (bookingMode === "scheduled") {
                                    const minStartTime = new Date(vietnamTime.getTime() + 30 * 60 * 1000);
                                    if (finalStartTime < minStartTime) {
                                        toast.error(
                                            language === 'vi'
                                                ? 'Thời gian sạc phải sau ít nhất 30 phút từ bây giờ'
                                                : 'Charging time must be at least 30 minutes from now'
                                        );
                                        return;
                                    }
                                }

                                console.log("=== FINAL BOOKING DATA ===");
                                console.log("Booking mode:", bookingMode);
                                console.log("UTC Current time:", now.toISOString());
                                console.log("Vietnam Current time:", vietnamTime.toISOString());
                                console.log("Start time (ISO):", finalStartTime.toISOString());
                                console.log("End time (ISO):", finalEndTime.toISOString());
                                console.log("Start time (formatted for backend):", formatTimeForBackend(finalStartTime));
                                console.log("End time (formatted for backend):", formatTimeForBackend(finalEndTime));
                                console.log("Time difference from UTC (minutes):", Math.round((finalStartTime.getTime() - now.getTime()) / (1000 * 60)));
                                console.log("Time difference from Vietnam (minutes):", Math.round((finalStartTime.getTime() - vietnamTime.getTime()) / (1000 * 60)));

                                // Calculate energy to charge (kWh) based on battery levels and vehicle capacity
                                const selectedVehicleForBooking = selectedVehicle || selectedVehicleRef.current;
                                const vehicleCapacity = selectedVehicleForBooking?.capacity || 50; // Default 50kWh if not available
                                const energyToCharge = (targetBatteryLevelConfig - initialBatteryLevel) / 100 * vehicleCapacity;

                                // Get user ID from context or localStorage
                                const userId = parseInt(localStorage.getItem('userId') || '0');

                                // Extract charging point ID and connector type ID with comprehensive fallbacks
                                const chargingPointId = slotToUse?.chargingPointId ||
                                    slotToUse?.chargingPointInfo?.id ||
                                    slotToUse?.chargingPointInfo?.chargingPointId;

                                // Try multiple ways to extract connectorTypeId
                                let connectorTypeId = slotToUse?.connectorType?.ConnectorTypeId ||
                                    slotToUse?.connectorType?.connectorTypeId ||
                                    slotToUse?.connectorType?.id ||
                                    slotToUse?.chargingPointInfo?.connectorType?.ConnectorTypeId ||
                                    slotToUse?.chargingPointInfo?.connectorType?.connectorTypeId ||
                                    slotToUse?.chargingPointInfo?.connectorType?.id ||
                                    slotToUse?.chargingPointInfo?.connectorTypeId;

                                // If still undefined, try to get it from the connector type name mapping
                                if (!connectorTypeId && selectedSlot?.chargingPointInfo?.connectorType) {
                                    const connectorTypeName = selectedSlot.chargingPointInfo.connectorType;
                                    console.log("Trying to map connector type name to ID:", connectorTypeName);
                                    console.log("Type of connectorTypeName:", typeof connectorTypeName);

                                    // Map connector type names to IDs based on your database
                                    const connectorTypeMapping: { [key: string]: number } = {
                                        'Type 1': 1,
                                        'Type 2': 2,
                                        'CCS': 3,
                                        'CHAdeMO': 4,
                                        'Tesla Supercharger': 5,
                                        'CCS1': 1,
                                        'CCS2': 2,
                                        'Type 2 Mennekes': 2,
                                        'Type 2 AC': 2
                                    };

                                    connectorTypeId = connectorTypeMapping[connectorTypeName] ||
                                        connectorTypeMapping[connectorTypeName.toLowerCase()];

                                    console.log("Mapped connectorTypeId:", connectorTypeId);
                                }

                                // Final fallback - use default connector type ID
                                if (!connectorTypeId) {
                                    console.warn("No connectorTypeId found, using default value 1");
                                    console.warn("Selected slot data:", JSON.stringify(selectedSlot, null, 2));
                                    connectorTypeId = 1; // Default to Type 1 connector
                                }

                                console.log("=== CONNECTOR TYPE ID EXTRACTION RESULT ===");
                                console.log("Final connectorTypeId:", connectorTypeId);
                                console.log("Type of connectorTypeId:", typeof connectorTypeId);

                                // Ensure connectorTypeId is a valid number
                                const finalConnectorTypeId = Number(connectorTypeId);
                                if (isNaN(finalConnectorTypeId) || finalConnectorTypeId <= 0) {
                                    console.warn("Invalid connectorTypeId, using default value 1");
                                    connectorTypeId = 1;
                                } else {
                                    connectorTypeId = finalConnectorTypeId;
                                }

                                console.log("Final processed connectorTypeId:", connectorTypeId);

                                // Determine initial status based on booking mode
                                const initialStatus = bookingMode === "now" ? "CHARGING" : "BOOKED";

                                // Generate slotIds from selected slots
                                const slotsToUseForIds = selectedSlots.length > 0 ? selectedSlots : (selectedSlot ? [selectedSlot] : (slotToUse ? [slotToUse] : []));
                                const slotIds: string[] = [];
                                
                                slotsToUseForIds.forEach((slot: any) => {
                                    if (slot?.freeFrom && slot?.freeTo) {
                                        const slotStart = new Date(slot.freeFrom);
                                        const slotEnd = new Date(slot.freeTo);
                                        const startTimeStr = slotStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                                        const endTimeStr = slotEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                                        
                                        // Try to get slot type from slot data, default to "FIXED"
                                        const slotType = slot?.slotType || slot?.type || "FIXED";
                                        const slotId = `${slotType}_${startTimeStr}_${endTimeStr}`;
                                        slotIds.push(slotId);
                                    } else if (slot?.slotId) {
                                        // If slot already has slotId, use it
                                        slotIds.push(slot.slotId);
                                    } else if (slot?.id) {
                                        // Use slot id if available
                                        slotIds.push(slot.id.toString());
                                    }
                                });

                                // Format time to match API format: "2025-11-08T10:30:00"
                                const formatTimeForAPI = (date: Date): string => {
                                    const year = date.getFullYear();
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const day = String(date.getDate()).padStart(2, '0');
                                    const hours = String(date.getHours()).padStart(2, '0');
                                    const minutes = String(date.getMinutes()).padStart(2, '0');
                                    const seconds = String(date.getSeconds()).padStart(2, '0');
                                    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
                                };

                                const bookingData = {
                                    userId: userId,
                                    vehicleId: numericVehicleId,
                                    stationId: configStation?.stationId,
                                    chargingPointId: chargingPointId,
                                    connectorTypeId: connectorTypeId,
                                    startTime: formatTimeForAPI(finalStartTime),
                                    endTime: formatTimeForAPI(finalEndTime),
                                    currentBattery: parseFloat(initialBatteryLevel.toString()),
                                    targetBattery: parseFloat(targetBatteryLevelConfig.toString()),
                                    energyToCharge: energyToCharge,
                                    estimatedCost: estimatedCost,
                                    initialStatus: initialStatus,  // THÊM TRƯỜNG NÀY - Backend cần để biết status ban đầu
                                    slotIds: slotIds.length > 0 ? slotIds : undefined
                                };

                                console.log("=== BOOKING DATA DEBUG ===");
                                console.log("Booking mode:", bookingMode);
                                console.log("Selected slot:", selectedSlot);
                                console.log("Slot to use (auto or manual):", slotToUse);
                                console.log("Slot chargingPointId:", slotToUse?.chargingPointId);
                                console.log("Slot chargingPointInfo:", slotToUse?.chargingPointInfo);
                                console.log("Slot chargingPointInfo.id:", slotToUse?.chargingPointInfo?.id);
                                console.log("Extracted chargingPointId:", chargingPointId);
                                console.log("Slot connectorType:", slotToUse?.connectorType);
                                console.log("Slot chargingPointInfo.connectorType:", slotToUse?.chargingPointInfo?.connectorType);
                                console.log("Extracted connectorTypeId:", connectorTypeId);
                                console.log("Current vehicle:", selectedVehicleForBooking);
                                console.log("Full selectedSlot structure:", JSON.stringify(selectedSlot, null, 2));
                                console.log("Vehicle capacity:", vehicleCapacity);
                                console.log("Energy to charge:", energyToCharge);
                                console.log("User ID from localStorage:", userId);
                                console.log("Start time:", finalStartTime.toISOString());
                                console.log("Booking data:", bookingData);

                                console.log("=== FINAL VALIDATION DEBUG ===");
                                console.log("Final connectorTypeId before validation:", connectorTypeId);
                                console.log("Final chargingPointId before validation:", chargingPointId);
                                console.log("Final bookingData.connectorTypeId:", bookingData.connectorTypeId);
                                console.log("Final bookingData.chargingPointId:", bookingData.chargingPointId);

                                // Validate required fields
                                if (!bookingData.userId || bookingData.userId === 0) {
                                    console.error("User ID validation failed:", bookingData.userId);
                                    toast.error(language === 'vi' ? 'Không tìm thấy User ID' : 'User ID not found');
                                    return;
                                }

                                if (!bookingData.chargingPointId) {
                                    console.error("Charging Point ID validation failed:", bookingData.chargingPointId);
                                    console.error("Selected slot chargingPointId:", selectedSlot?.chargingPointId);
                                    console.error("Selected slot chargingPointInfo.id:", selectedSlot?.chargingPointInfo?.id);
                                    toast.error(language === 'vi' ? 'Không tìm thấy Charging Point ID' : 'Charging Point ID not found');
                                    return;
                                }

                                if (!bookingData.connectorTypeId || bookingData.connectorTypeId === 0) {
                                    console.error("Connector Type ID validation failed:", bookingData.connectorTypeId);
                                    console.error("Selected slot connectorType:", selectedSlot?.connectorType);
                                    console.error("Selected slot chargingPointInfo.connectorType:", selectedSlot?.chargingPointInfo?.connectorType);
                                    console.error("Full slot data for debugging:", JSON.stringify(selectedSlot, null, 2));
                                    console.error("Raw connectorTypeId variable:", connectorTypeId);
                                    console.error("Type of connectorTypeId:", typeof connectorTypeId);
                                    toast.error(language === 'vi' ? 'Không tìm thấy Connector Type ID. Vui lòng thử lại.' : 'Connector Type ID not found. Please try again.');
                                    return;
                                }

                                if (!bookingData.startTime) {
                                    console.error("Start time validation failed:", bookingData.startTime);
                                    toast.error(language === 'vi' ? 'Thời gian bắt đầu không hợp lệ' : 'Invalid start time');
                                    return;
                                }

                                if (!bookingData.energyToCharge || bookingData.energyToCharge <= 0) {
                                    console.error("Energy to charge validation failed:", bookingData.energyToCharge);
                                    toast.error(language === 'vi' ? 'Năng lượng sạc không hợp lệ' : 'Invalid energy to charge');
                                    return;
                                }

                                // Call confirm booking API
                                console.log("=== ABOUT TO CALL API ===");
                                console.log("Final booking data before API call:", JSON.stringify(bookingData, null, 2));
                                console.log("=== API PAYLOAD TIME VERIFICATION ===");
                                console.log("startTime being sent:", bookingData.startTime);
                                console.log("endTime being sent:", bookingData.endTime);
                                console.log("startTime as Date object:", new Date(bookingData.startTime));
                                console.log("endTime as Date object:", new Date(bookingData.endTime));
                                console.log("Current time for comparison:", new Date().toISOString());

                                const result = await callApiForConfirmBooking(bookingData);

                                if (result) {
                                    console.log("=== Booking result ===", result);

                                    // Extract order data and orderId from response
                                    const normalizedOrder = normalizeOrderResponse(result);

                                    // Extract orderId from response
                                    const orderId = result.orderId || result.data?.orderId;

                                    if (!orderId) {
                                        toast.error(language === 'vi' ? 'Không nhận được Order ID' : 'Order ID not received');
                                        return;
                                    }

                                    // Save orderId to localStorage
                                    localStorage.setItem("currentOrderId", orderId.toString());
                                    console.log("✅ Saved orderId to localStorage:", orderId);

                                    // Persist station context for ChargingSessionView
                                    storeCurrentStationContext(normalizedOrder, configStation ?? selectedStation ?? null, slotToUse);

                                    toast.success(language === 'vi' ? 'Đặt lịch thành công!' : 'Booking successful!');
                                    setIsChargingConfigOpen(false);

                                    // Only navigate to charging session for "Book Now"
                                    if (bookingMode === "now") {
                                        let hasNavigatedToCharging = false;
                                        const navigateToChargingSession = () => {
                                            if (!hasNavigatedToCharging) {
                                                hasNavigatedToCharging = true;
                                                onStartCharging?.(orderId.toString());
                                            }
                                        };

                                        try {
                                            console.log("=== Fetching session created during Book Now ===");
                                            const sessionResponse = await api.get(`/api/sessions/by-order/${orderId}`);
                                            const sessionData = sessionResponse.data?.data;

                                            if (sessionData?.sessionId) {
                                                const sessionId = sessionData.sessionId;
                                                localStorage.setItem("currentSessionId", sessionId.toString());
                                                console.log("✅ Session fetched successfully, sessionId:", sessionId);

                                                toast.success(
                                                    language === 'vi'
                                                        ? 'Bắt đầu sạc thành công!'
                                                        : 'Charging started!'
                                                );

                                                navigateToChargingSession();
                                            } else {
                                                console.error("No sessionId in response:", sessionResponse.data);
                                                toast.error(
                                                    language === 'vi'
                                                        ? 'Không nhận được Session ID'
                                                        : 'Session ID not received'
                                                );
                                                navigateToChargingSession();
                                            }
                                        } catch (sessionError: any) {
                                            console.error("=== Error fetching session after Book Now ===", sessionError);

                                            const recovered = await tryRecoverExistingSession(sessionError, orderId);
                                            if (recovered) {
                                                return;
                                            }

                                            toast.error(
                                                sessionError?.response?.data?.message ||
                                                (language === 'vi'
                                                    ? 'Lỗi khi lấy chi tiết phiên sạc. Vui lòng thử lại.'
                                                    : 'Error fetching session details. Please try again.')
                                            );
                                            navigateToChargingSession();
                                        } finally {
                                            navigateToChargingSession();
                                        }
                                    } else {
                                        // For scheduled booking, navigate to MyBookingView
                                        toast.info(
                                            language === 'vi'
                                                ? 'Đặt lịch đã được lưu vào My Bookings'
                                                : 'Booking saved to My Bookings'
                                        );
                                    }
                                }
                            }}
                            className="flex-1"
                            disabled={
                                targetBatteryLevelConfig <= initialBatteryLevel ||
                                (bookingMode === "now" && (availableSlots.length === 0 || isVehicleCurrentlyCharging)) ||
                                (bookingMode === "scheduled" && (selectedSlots.length === 0 && !selectedSlot))
                            }
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {language === 'vi' ? 'Xác nhận' : 'Confirm'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsChargingConfigOpen(false);
                                setExpandedChargingPoints(new Set());
                                setSelectedSlot(null);
                                setShowAvailableSlots(false);
                            }}
                            className="flex-1"
                        >
                            {language === 'vi' ? 'Hủy' : 'Cancel'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Vehicle Selection Dialog */}
            <Dialog open={isVehicleSelectionOpen} onOpenChange={setIsVehicleSelectionOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader className="text-center">
                        <DialogTitle className="flex items-center justify-center space-x-2">
                            <Car className="w-5 h-5 text-primary" />
                            <span>{language === 'vi' ? 'Chọn xe để sạc' : 'Select Vehicle for Charging'}</span>
                        </DialogTitle>
                        <DialogDescription className="text-center">
                            {language === 'vi' ? 'Vui lòng chọn xe bạn muốn sạc' : 'Please select the vehicle you want to charge'}
                        </DialogDescription>
                    </DialogHeader>

                    {loadingVehicles ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-center space-y-4">
                                <div className="w-8 h-8 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-sm text-muted-foreground">
                                    {language === 'vi' ? 'Đang tải danh sách xe...' : 'Loading vehicles...'}
                                </p>
                            </div>
                        </div>
                    ) : vehicles.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                                    <Car className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-medium text-muted-foreground">
                                        {language === 'vi' ? 'Không có xe nào' : 'No vehicles found'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">

                                        {language === 'vi' ? 'Vui lòng thêm xe vào tài khoản của bạn' : 'Please add a vehicle to your account'}

                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {vehicles && vehicles.length > 0 ? vehicles.map((vehicle, index) => (
                                <motion.div
                                    key={vehicle.plateNumber || index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.1 }}
                                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                                        selectedVehicle?.plateNumber === vehicle?.plateNumber
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border hover:border-primary/50'
                                    }`}
                                    onClick={async () => {
                                        try {
                                            console.log("=== Vehicle clicked ===");
                                            console.log("Clicked vehicle:", vehicle);
                                            if (vehicle && typeof vehicle === 'object') {
                                                setSelectedVehicle(vehicle);
                                                console.log("setSelectedVehicle called with:", vehicle);
                                                
                                                // Check if vehicle is currently charging
                                                const vehicleId = vehicle.vehicleId || vehicle.VehicleId || vehicle.id;
                                                if (vehicleId) {
                                                    const isCharging = await checkVehicleChargingStatus(vehicleId);
                                                    setIsVehicleCurrentlyCharging(isCharging);
                                                    
                                                    if (isCharging) {
                                                        toast(
                                                            language === 'vi'
                                                                ? 'Xe này đang trong quá trình sạc. Bạn chỉ có thể đặt lịch sạc tiếp theo.'
                                                                : 'This vehicle is currently charging. You can only schedule the next charging session.',
                                                            { duration: 5000 }
                                                        );
                                                    }
                                                }
                                            } else {
                                                console.error("Invalid vehicle object:", vehicle);
                                                toast.error(language === 'vi' ? 'Dữ liệu xe không hợp lệ' : 'Invalid vehicle data');
                                            }
                                        } catch (error) {
                                            console.error("Error selecting vehicle:", error);
                                            toast.error(language === 'vi' ? 'Lỗi khi chọn xe' : 'Error selecting vehicle');
                                        }
                                    }}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <Car className="w-6 h-6 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium">
                                                {vehicle?.carModel?.model || vehicle?.brand || 'Unknown Model'}
                                            </h4>
                                            <p className="text-sm text-muted-foreground">
                                                {vehicle?.plateNumber || 'No License Plate'}
                                            </p>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <Badge variant="outline" className="text-xs">
                                                    {vehicle?.productYear || vehicle?.carModel?.productYear || 'N/A'}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                    {vehicle?.connectorTypeName || 'Standard'}
                                                </Badge>
                                            </div>
                                        </div>
                                        {selectedVehicle?.plateNumber === vehicle?.plateNumber ? (
                                            <CheckCircle className="w-5 h-5 text-primary" />
                                        ) : (
                                            <div className="w-5 h-5 border-2 border-muted-foreground rounded-full" />
                                        )}
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="text-center py-8">
                                    <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">
                                        {language === 'vi' ? 'Không có xe nào được tìm thấy' : 'No vehicles found'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex space-x-2 pt-4 border-t">
                        <Button
                            onClick={() => {
                                try {
                                    console.log("=== Confirm button clicked ===");
                                    console.log("selectedVehicle at confirm:", selectedVehicle);
                                    if (selectedVehicle && typeof selectedVehicle === 'object') {
                                        console.log("Vehicle confirmed, closing popup");
                                        setIsVehicleSelectionOpen(false);
                                    } else {
                                        console.log("No vehicle selected at confirm");
                                        toast(
                                            language === 'vi'
                                                ? 'Vui lòng chọn một xe'
                                                : 'Please select a vehicle'
                                        );
                                    }
                                } catch (error) {
                                    console.error("Error confirming vehicle selection:", error);
                                    toast.error(language === 'vi' ? 'Lỗi khi xác nhận xe' : 'Error confirming vehicle');
                                }
                            }}
                            className="flex-1"
                            disabled={!selectedVehicle}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {language === 'vi' ? 'Xác nhận' : 'Confirm'}
                        </Button>

                    </div>
                </DialogContent>
            </Dialog>

            {/* Available Slots Popup Dialog */}
            <Dialog open={isSlotsPopupOpen} onOpenChange={setIsSlotsPopupOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader className="flex-shrink-0 text-center">
                        <DialogTitle className="flex items-center justify-center space-x-2">
                            <Clock className="w-5 h-5 text-primary" />
                            <span>{language === 'vi' ? 'Slot khả dụng' : 'Available Slots'}</span>
                        </DialogTitle>
                        <DialogDescription className="text-center">
                            {language === 'vi'
                                ? `Chọn slot phù hợp cho thời gian ${chargingStartTimeInput} (hoặc gần nhất)`
                                : `Select a suitable slot for time ${chargingStartTimeInput} (or closest available)`
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                        {loadingFilteredSlots ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                <span className="ml-2 text-sm text-muted-foreground">
                                    {language === 'vi' ? 'Đang tải slot...' : 'Loading slots...'}
                                </span>
                            </div>
                        ) : filteredSlots.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
                                {filteredSlots.map((slot, index) => {
                                    const { connectorTypeName, powerOutput, pricePerKwh } = extractSlotInfo(slot);

                                    // Calculate charging duration: prefer backend requiredMinutes if available
                                    const batteryDifference = targetBatteryLevelConfig - initialBatteryLevel;
                                    const vehicleCapacity = (selectedVehicle || selectedVehicleRef.current)?.capacity || 50;
                                    const energyToCharge = (batteryDifference / 100) * vehicleCapacity;
                                    const backendRequired = Number(slot?.requiredMinutes);
                                    const numericPower = (typeof powerOutput === 'number' && powerOutput > 0) ? powerOutput : 22; // default 22kW if unknown
                                    const chargingDuration = (Number.isFinite(backendRequired) && backendRequired > 0)
                                        ? backendRequired
                                        : Math.ceil((energyToCharge / numericPower) * 60);

                                    // Calculate end time
                                    const startTime = slot.freeFrom ? new Date(slot.freeFrom) : new Date();
                                    const endTime = new Date(startTime.getTime() + chargingDuration * 60000);

                                    return (
                                        <div
                                            key={index}
                                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                                selectedSlot === slot
                                                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                                                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                                            }`}
                                            onClick={() => {
                                                console.log("Selected slot:", slot);
                                                setSelectedSlot(slot);
                                                setIsSlotsPopupOpen(false);
                                                toast.success(
                                                    language === 'vi'
                                                        ? 'Đã chọn slot thành công'
                                                        : 'Slot selected successfully'
                                                );
                                            }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <Zap className="w-4 h-4 text-primary" />
                                                        <p className="text-sm font-medium">{connectorTypeName}</p>
                                                        <Badge variant="outline" className="text-xs">
                                                            {powerOutput !== null ? `${powerOutput} kW` : 'Power N/A'}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-sm">
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                                            <span className="font-medium">
                                                                {startTime.toLocaleTimeString('en-US', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                    hour12: true
                                                                })}
                                                            </span>
                                                        </div>
                                                        <span className="text-muted-foreground">→</span>
                                                        <div>
                                                            <span className="font-medium">
                                                                {endTime.toLocaleTimeString('en-US', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                    hour12: true
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="mt-2 flex items-center justify-between">
                                                        <div className="text-sm">
                                                            <p className="text-muted-foreground">
                                                                {language === 'vi' ? 'Thời gian sạc:' : 'Charging Duration:'}
                                                            </p>
                                                            <p className="font-medium">
                                                                {Math.floor(chargingDuration / 60)}h {chargingDuration % 60}m
                                                            </p>
                                                        </div>
                                                        <div className="text-sm text-right">
                                                            <p className="text-muted-foreground">
                                                                {language === 'vi' ? 'Chi phí ước tính:' : 'Estimated Cost:'}
                                                            </p>
                                                            <p className="font-medium text-primary">
                                                                {slot.estimatedCost ? `${slot.estimatedCost.toLocaleString()} VND` : 'N/A'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {selectedSlot === slot && (
                                                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                    <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium text-amber-700 dark:text-amber-300">
                                            {language === 'vi' ? 'Không có slot khả dụng' : 'No available slots'}
                                        </p>
                                        <p className="text-amber-600 dark:text-amber-400 mt-1">
                                            {language === 'vi'
                                                ? 'Không có slot phù hợp cho thời gian đã chọn.'
                                                : 'No suitable slots available for the selected time.'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex-shrink-0 flex space-x-2 pt-4 pb-4 px-6 border-t bg-background">
                        <Button
                            variant="outline"
                            onClick={() => setIsSlotsPopupOpen(false)}
                            className="flex-1"
                        >
                            {language === 'vi' ? 'Đóng' : 'Close'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>

    );

}

