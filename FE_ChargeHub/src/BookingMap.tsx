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

import axios, { AxiosError } from "axios";
import { toast, Toaster } from "sonner";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { api } from "./services/api";


import {

    Search,

    MapPin,

    Zap,

    Clock,

    Battery,

    Star,

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
    connectorTypeId?: number;
    typeName: string;
    powerOutput: number;
    pricePerKWh: number;
}

interface ChargingPoint {
    chargingPointId?: number;
    status: string;
    connectorTypeId?: number;
    stationId?: number;
    connectorType: ConnectorType;
    powerOutput?: number;
    pricePerKwh?: number;
}






interface BookingMapProps {

    onBack: () => void;

    currentBatteryLevel?: number;

    setCurrentBatteryLevel?: (level: number) => void;

    onStartCharging?: (bookingId: string) => void;

}



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

    const [mapZoom, setMapZoom] = useState(1);

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
    const [initialBatteryLevel, setInitialBatteryLevel] = useState(75);
    const [targetBatteryLevelConfig, setTargetBatteryLevelConfig] = useState(80);
    const [chargingStartTimeInput, setChargingStartTimeInput] = useState("");
    const [chargingEndTime, setChargingEndTime] = useState("");
    const [bookingMode, setBookingMode] = useState<"now" | "scheduled">("now");

    // Vehicle selection states
    const [isVehicleSelectionOpen, setIsVehicleSelectionOpen] = useState(false);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
    const [loadingVehicles, setLoadingVehicles] = useState(false);
    
    // Use ref to persist selected vehicle
    const selectedVehicleRef = useRef<any>(null);

    // Available slots states
    const [availableSlots, setAvailableSlots] = useState<any[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<any>(null);


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

    //View page


    // Calculate available charging points by type for a station
    const calculateStationChargingPoints = async (stationId: string) => {
        try {
            const points = await callApiForGetPointsForEachStation(stationId);
            if (points && points.length > 0) {
                const typeStats: { [typeName: string]: { total: number, available: number } } = {};

                points.forEach(point => {
                    const typeName = point.connectorType.typeName;
                    if (!typeStats[typeName]) {
                        typeStats[typeName] = { total: 0, available: 0 };
                    }
                    typeStats[typeName].total++;
                    if (point.status === 'AVAILABLE') {
                        typeStats[typeName].available++;
                    }
                });

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
            const res = await axios.get("http://localhost:8080/api/charging-stations");
            if (res.status == 200) {
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
            const res = await axios.get(`http://localhost:8080/api/charging-points/station/${stationId}`);
            if (res.status == 200 && Array.isArray(res.data)) {
                return res.data.map((chargingPoint: any) => ({
                    chargingPointId: chargingPoint.chargingPointId,
                    status: chargingPoint.status,
                    connectorTypeId: chargingPoint.connectorTypeId,
                    stationId: chargingPoint.stationId,
                    connectorType: {
                        connectorTypeId: chargingPoint.connectorType.connectorTypeId,
                        typeName: chargingPoint.connectorType.typeName,
                        powerOutput: chargingPoint.connectorType.powerOutput,
                        pricePerKWh: chargingPoint.connectorType.pricePerKWh
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

    // API call to get vehicles list
    const callApiForGetVehicles = async (): Promise<any[] | null> => {
        try {
            const userId = localStorage.getItem("userId");
            if (!userId) {
                console.error("No userId found");
                return null;
            }
            const res = await api.get(`/api/vehicles/user/${userId}`);
            if (res.status == 200) {
                const vehicles = res.data?.data || res.data;
                console.log("=== Vehicles from API ===");
                console.log("Vehicles:", vehicles);
                if (vehicles && vehicles.length > 0) {
                    console.log("First vehicle structure:", vehicles[0]);
                    console.log("First vehicle keys:", Object.keys(vehicles[0]));
                }
                return vehicles;
            }
            throw new Error(language === "vi" ? "Không lấy được danh sách xe" : "Unable to fetch vehicles list");
        } catch (err: any) {
            console.error("API Error:", err);
            // For testing, return mock data if API fails
            console.log("Using mock vehicle data for testing");
            const mockVehicles = [
                {
                    vehicleId: 1,
                    model: "Tesla Model 3",
                    carModel: "Tesla Model 3",
                    licensePlate: "64G-19075",
                    licenseNumber: "64G-19075",
                    plateNumber: "64G-19075",
                    year: 2022,
                    connectorType: "Type 2"
                }
            ];
            console.log("=== Mock Vehicles ===");
            console.log("Mock vehicles:", mockVehicles);
            console.log("First mock vehicle keys:", Object.keys(mockVehicles[0]));
            return mockVehicles;
        }
    }

    // API call to find available slots
    const callApiForFindAvailableSlots = async (stationId: string): Promise<any[] | null> => {
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

            console.log("=== Vehicle Object Debug ===");
            console.log("currentVehicle:", currentVehicle);
            console.log("currentVehicle.vehicleId:", currentVehicle.vehicleId);
            console.log("currentVehicle.id:", currentVehicle.id);
            console.log("currentVehicle keys:", Object.keys(currentVehicle));

            // Try to get vehicleId from various possible fields
            const actualVehicleId = currentVehicle.vehicleId || currentVehicle.id || currentVehicle.vehicle_id;
            
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
                        const foundVehicleId = fullVehicle.vehicleId || fullVehicle.id || fullVehicle.vehicle_id;
                        console.log("foundVehicleId:", foundVehicleId);
                        
                        if (foundVehicleId) {
                            console.log("Using vehicleId from vehicles list:", foundVehicleId);
                            // Update the request body to use the found vehicleId
                            const requestBody = {
                                userId: parseInt(userId),
                                vehicleId: parseInt(foundVehicleId),
                                stationId: parseInt(stationId),
                                currentBattery: 20,
                                targetBattery: 80
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

            const requestBody = {
                userId: parseInt(userId),
                vehicleId: parseInt(actualVehicleId), // Use actual vehicle ID
                stationId: parseInt(stationId),
                currentBattery: 20, // Default current battery %
                targetBattery: 80   // Default target battery %
            };

            console.log("=== Find Available Slots Request ===");
            console.log("Request body:", requestBody);

            const res = await api.post(`/api/orders/find-available-slots`, requestBody);
            if (res.status == 200) {
                return res.data?.data || res.data;
            }
            throw new Error(language === "vi" ? "Không tìm thấy slot khả dụng" : "No available slots found");
        } catch (err: any) {
            console.error("Find available slots error:", err);
            const msg = err?.response?.data?.message || (language === "vi" ? "Không tìm thấy slot khả dụng" : "No available slots found");
            toast.error(msg);
            return null;
        }
    }

    // API call to confirm booking
    const callApiForConfirmBooking = async (bookingData: any): Promise<any | null> => {
        try {
            const res = await api.post("/api/orders/confirm", bookingData);
            if (res.status == 200) {
                return res.data?.data || res.data;
            }
            throw new Error(language === "vi" ? "Xác nhận đặt chỗ thất bại" : "Booking confirmation failed");
        } catch (err: any) {
            const msg = err?.response?.data?.message || (language === "vi" ? "Xác nhận đặt chỗ thất bại" : "Booking confirmation failed");
            toast.error(msg);
            return null;
        }
    }

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
                toast.warning(language === 'vi' ? 'Không tìm thấy trụ sạc nào' : 'No charging points found');
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
                toast.warning("No stations found");
            }
            return list;
        } catch (err: any) {
            console.error("Error loading stations:", err);
            setStations([]);
            toast.error("Failed to load stations");
        }
    }



    useEffect(() => { handleGetStationList() }, [refreshTrigger]);

    // Load vehicles on component mount
    useEffect(() => {
        const loadVehicles = async () => {
            setLoadingVehicles(true);
            try {
                const vehiclesList = await callApiForGetVehicles();
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
    }, []); // Only run once on mount

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
            toast.warning(
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
                toast.warning(
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
            toast.warning(
                language === 'vi'
                    ? 'Vui lòng chọn xe trước khi đặt lịch sạc'
                    : 'Please select a vehicle before booking'
            );
            setIsVehicleSelectionOpen(true);
            return;
        }
        
        console.log("Vehicle is selected, proceeding with booking");

        // Check if station is ACTIVE
        if (station.status !== "ACTIVE") {
            toast.warning(
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
            
            if (slots && slots.length > 0) {
                setAvailableSlots(slots);
                setConfigStation(station);
                setIsChargingConfigOpen(true);
            } else {
                toast.warning(
                    language === 'vi'
                        ? 'Không có slot khả dụng phù hợp với xe của bạn'
                        : 'No available slots suitable for your vehicle'
                );
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

        try {
            console.log("Initializing map...");
            const customStyleUrl = `https://api.maptiler.com/maps/019983ed-809a-7bba-8d9b-f5f42a71219e/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`;
            const map = new maptilersdk.Map({
                container: mapContainerRef.current,
                style: customStyleUrl,
                center: defaultCenterLngLat,
                zoom: mapZoom,
                hash: false,
            });

            __mapRef.current = map;

            map.on('load', () => {
                console.log("Map đã load thành công");
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
                    map.remove();
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

        // Hiển thị tất cả stations với mọi trạng thái
        const allStations = stations.filter(station =>
            station.latitude && station.longitude && station.stationId
        );
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
        </svg>
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
            <span class="text-xs text-gray-500">ID: ${station.stationId}</span>
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

    }, [stations]); // Theo dõi stations thay đổi (sau khi fetch hoặc refresh)


    //hết useEffect
    // Enhanced charging stations data



    // Filtered stations based on search and filters
    console.log("All stations:", stations);
    console.log("Stations length:", stations.length);

    const filteredStations = stations.filter(station => {
        console.log("Filtering station:", station);
        const matchesSearch = station.stationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            station.address?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesAvailable = station.status === "ACTIVE" || "INACTIVE" || "MAINTENANCE";
        const matchesFastCharging = true;
        const matches24h = true;

        console.log("Station matches:", {
            stationName: station.stationName,
            status: station.status,
            matchesSearch,
            matchesAvailable,
            matchesFastCharging,
            matches24h
        });

        return matchesSearch && matchesAvailable && matchesFastCharging && matches24h;

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

            // Generate a booking ID for immediate charging session
            const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Call the callback to navigate to charging session
            onStartCharging?.(bookingId);

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
                                        {(selectedVehicle || selectedVehicleRef.current)?.model || (selectedVehicle || selectedVehicleRef.current)?.carModel || 'Selected Vehicle'}
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
                                                                            <span className="text-xs text-white/60">
                                        {stationTotalPoints[station.stationId?.toString() || ''] || station.chargingPointNumber || 0} {language === 'vi' ? 'trụ sạc' : 'charging points'}
                                      </span>
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
                                        <h3 className="text-lg font-medium text-muted-foreground">No stations found</h3>
                                        <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
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

                                        <p className="text-lg font-semibold">
                                            {stationTotalPoints[detailsStation.stationId?.toString() || ''] || detailsStation.chargingPointNumber || 0}
                                            {language === 'vi' ? ' trụ sạc' : ' charging points'}
                                        </p>
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
            <Dialog open={isChargingConfigOpen} onOpenChange={setIsChargingConfigOpen}>
                <DialogContent className="max-w-md max-h-[60vh] overflow-y-auto">
                    <DialogHeader className="text-center">
                        <DialogTitle className="flex items-center justify-center space-x-2">
                            <Zap className="w-5 h-5 text-primary" />
                            <span>{language === 'vi' ? 'Cấu hình sạc xe' : 'Charging Configuration'}</span>
                        </DialogTitle>
                        <DialogDescription className="text-center">
                            {language === 'vi' ? 'Cấu hình mức pin và thời gian sạc cho trạm' : 'Configure battery level and charging time for station'}
                        </DialogDescription>
                    </DialogHeader>

                    {configStation && (
                        <div className="space-y-6">
                            {/* Station Info */}
                            <div className="bg-muted/50 rounded-lg p-4 text-center">
                                <h4 className="font-medium mb-2">{configStation.stationName}</h4>
                                <p className="text-sm text-muted-foreground">{configStation.address}</p>
                                <div className="flex items-center justify-center space-x-4 mt-2 text-sm">
                  <span className="flex items-center space-x-1">
                    <Zap className="w-4 h-4 text-primary" />
                    <span>{stationTotalPoints[configStation.stationId?.toString() || ''] || configStation.chargingPointNumber || 0} {language === 'vi' ? 'trụ sạc' : 'charging points'}</span>
                  </span>
                                    <Badge variant="outline" className="bg-green-100 text-green-800">
                                        {language === 'vi' ? 'Hoạt động' : 'Active'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Selected Vehicle Info */}
                            {(selectedVehicle || selectedVehicleRef.current) && (
                                <div className="bg-primary/10 rounded-lg p-4">
                                    <h4 className="font-medium flex items-center space-x-2 mb-2">
                                        <Car className="w-4 h-4 text-primary" />
                                        <span>{language === 'vi' ? 'Xe đã chọn' : 'Selected Vehicle'}</span>
                                    </h4>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                                            <Car className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{(selectedVehicle || selectedVehicleRef.current)?.model || (selectedVehicle || selectedVehicleRef.current)?.carModel || 'Unknown Model'}</p>
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
                                </div>
                            )}

                            {/* Available Slots Display */}
                            {availableSlots.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="font-medium flex items-center space-x-2 text-sm">
                                        <Clock className="w-4 h-4 text-primary" />
                                        <span>{language === 'vi' ? 'Slot khả dụng' : 'Available Slots'}</span>
                                    </h4>
                                    <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                                        {availableSlots.map((slot, index) => (
                                            <div
                                                key={index}
                                                className={`p-2 border rounded-lg cursor-pointer transition-all ${
                                                    selectedSlot === slot 
                                                        ? 'border-primary bg-primary/10' 
                                                        : 'border-border hover:border-primary/50'
                                                }`}
                                                onClick={() => setSelectedSlot(slot)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium">{slot.connectorType || 'Standard'}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {slot.powerOutput || 'N/A'} kW • {slot.pricePerKwh || 'N/A'} VND/kWh
                                                        </p>
                                                    </div>
                                                    {selectedSlot === slot && (
                                                        <CheckCircle className="w-4 h-4 text-primary" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
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
                                        onClick={() => setBookingMode("now")}
                                        className="flex items-center space-x-2"
                                    >
                                        <Zap className="w-4 h-4" />
                                        <span>{language === 'vi' ? 'Sạc ngay' : 'Book Now'}</span>
                                    </Button>

                                    <Button
                                        variant={bookingMode === "scheduled" ? "default" : "outline"}
                                        onClick={() => setBookingMode("scheduled")}
                                        className="flex items-center space-x-2"
                                    >
                                        <Calendar className="w-4 h-4" />
                                        <span>{language === 'vi' ? 'Đặt lịch' : 'Schedule'}</span>
                                    </Button>
                                </div>
                            </div>

                            {/* Battery Configuration */}
                            <div className="space-y-2">
                                <h4 className="font-medium flex items-center justify-center space-x-2 text-sm">
                                    <Battery className="w-4 h-4 text-primary" />
                                    <span>{language === 'vi' ? 'Cấu hình pin' : 'Battery Configuration'}</span>
                                </h4>

                                {/* Initial Battery Level */}
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-center block">
                                        {language === 'vi' ? 'Mức pin ban đầu' : 'Initial Battery Level'}
                                    </label>
                                    <div className="flex items-center justify-center space-x-3">
                                        <button
                                            onClick={() => setInitialBatteryLevel(Math.max(0, initialBatteryLevel - 1))}
                                            className="w-8 h-8 bg-muted hover:bg-muted/80 rounded-lg flex items-center justify-center transition-colors text-sm"
                                        >
                                            −
                                        </button>
                                        <div className="flex flex-col items-center">
                                            <input
                                                type="number"
                                                value={initialBatteryLevel}
                                                onChange={(e) => {
                                                    const value = parseInt(e.target.value) || 0;
                                                    const clampedValue = Math.max(0, Math.min(100, value));
                                                    setInitialBatteryLevel(clampedValue);
                                                }}
                                                className="w-16 h-10 text-center text-lg font-bold bg-transparent border-2 border-primary rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                                                min="0"
                                                max="100"
                                            />
                                            <span className="text-xs text-muted-foreground">%</span>
                                        </div>
                                        <button
                                            onClick={() => setInitialBatteryLevel(Math.min(100, initialBatteryLevel + 1))}
                                            className="w-8 h-8 bg-muted hover:bg-muted/80 rounded-lg flex items-center justify-center transition-colors text-sm"
                                        >
                                            +
                                        </button>
                                    </div>

                                    {/* Battery Level Visual Bar */}
                                    <div className="relative w-full h-4 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-300 ${
                                                initialBatteryLevel <= 20 ? 'bg-red-500' :
                                                    initialBatteryLevel <= 50 ? 'bg-yellow-500' : 'bg-green-500'
                                            }`}
                                            style={{ width: `${initialBatteryLevel}%` }}
                                        />
                                    </div>

                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>0%</span>
                                        <span>50%</span>
                                        <span>100%</span>
                                    </div>
                                </div>

                                {/* Target Battery Level */}
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-center block">
                                        {language === 'vi' ? 'Mức pin mục tiêu' : 'Target Battery Level'}
                                    </label>
                                    <div className="flex items-center justify-center space-x-3">
                                        <button
                                            onClick={() => setTargetBatteryLevelConfig(Math.max(initialBatteryLevel + 5, targetBatteryLevelConfig - 1))}
                                            className="w-8 h-8 bg-muted hover:bg-muted/80 rounded-lg flex items-center justify-center transition-colors text-sm"
                                        >
                                            −
                                        </button>
                                        <div className="flex flex-col items-center">
                                            <input
                                                type="number"
                                                value={targetBatteryLevelConfig}
                                                onChange={(e) => {
                                                    const value = parseInt(e.target.value) || 0;
                                                    const clampedValue = Math.max(initialBatteryLevel + 5, Math.min(100, value));
                                                    setTargetBatteryLevelConfig(clampedValue);
                                                }}
                                                className="w-16 h-10 text-center text-lg font-bold bg-transparent border-2 border-primary rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                                                min={initialBatteryLevel + 5}
                                                max="100"
                                            />
                                            <span className="text-xs text-muted-foreground">%</span>
                                        </div>
                                        <button
                                            onClick={() => setTargetBatteryLevelConfig(Math.min(100, targetBatteryLevelConfig + 1))}
                                            className="w-8 h-8 bg-muted hover:bg-muted/80 rounded-lg flex items-center justify-center transition-colors text-sm"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <Slider
                                        value={[targetBatteryLevelConfig]}
                                        onValueChange={(value: number[]) => setTargetBatteryLevelConfig(value[0] || 80)}
                                        max={100}
                                        min={initialBatteryLevel + 5}
                                        step={1}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            {/* Time Configuration - Only show for scheduled booking */}
                            {bookingMode === "scheduled" && (
                                <div className="space-y-2">
                                    <h4 className="font-medium flex items-center justify-center space-x-2 text-sm">
                                        <Clock className="w-4 h-4 text-primary" />
                                        <span>{language === 'vi' ? 'Thời gian sạc' : 'Charging Time'}</span>
                                    </h4>

                                    <div className="flex flex-col items-center space-y-2">
                                        <label className="text-sm font-medium text-center">
                                            {language === 'vi' ? 'Giờ bắt đầu sạc' : 'Start Charging Time'}
                                        </label>
                                        <Input
                                            type="time"
                                            value={chargingStartTimeInput}
                                            onChange={(e) => setChargingStartTimeInput(e.target.value)}
                                            className="w-32 h-10 text-center text-lg font-medium border-2 border-primary rounded-lg focus:ring-2 focus:ring-primary/20"
                                            placeholder="HH:MM"
                                        />
                                        {chargingStartTimeInput && (
                                            <div className="text-xs text-muted-foreground text-center">
                                                {language === 'vi' ? 'Thời gian phải ít nhất 2 tiếng sau hiện tại' : 'Time must be at least 2 hours from now'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}


                            {/* Action Buttons */}
                            <div className="flex space-x-2 pt-2 border-t">
                                <Button
                                    onClick={async () => {
                                        // Validate time for scheduled booking
                                        if (bookingMode === "scheduled") {
                                            if (!chargingStartTimeInput) {
                                                toast.error(language === 'vi' ? 'Vui lòng chọn thời gian sạc' : 'Please select charging time');
                                                return;
                                            }

                                            // Check if time is at least 2 hours from now
                                            const now = new Date();
                                            const selectedTime = new Date();
                                            const [hours, minutes] = chargingStartTimeInput.split(':').map(Number);
                                            if (hours !== undefined && minutes !== undefined) {
                                                selectedTime.setHours(hours, minutes, 0, 0);
                                            } else {
                                                toast.error(language === 'vi' ? 'Thời gian không hợp lệ' : 'Invalid time format');
                                                return;
                                            }

                                            // If selected time is today, check if it's at least 2 hours from now
                                            if (selectedTime.getDate() === now.getDate()) {
                                                const timeDiff = selectedTime.getTime() - now.getTime();
                                                const hoursDiff = timeDiff / (1000 * 60 * 60);

                                                if (hoursDiff < 2) {
                                                    toast.error(language === 'vi' ? 'Thời gian phải ít nhất 2 tiếng sau hiện tại' : 'Time must be at least 2 hours from now');
                                                    return;
                                                }
                                            }
                                        }

                                        // Prepare booking data
                                        const currentVehicle = selectedVehicle || selectedVehicleRef.current;
                                        const bookingData = {
                                            stationId: configStation?.stationId,
                                            vehicleId: currentVehicle?.vehicleId || currentVehicle?.id || currentVehicle?.plateNumber,
                                            initialBatteryLevel: initialBatteryLevel,
                                            targetBatteryLevel: targetBatteryLevelConfig,
                                            bookingMode: bookingMode,
                                            chargingStartTime: bookingMode === "scheduled" ? chargingStartTimeInput : null,
                                            selectedSlot: selectedSlot
                                        };

                                        // Call confirm booking API
                                        const result = await callApiForConfirmBooking(bookingData);
                                        
                                        if (result) {
                                            toast.success(language === 'vi' ? 'Đặt lịch thành công!' : 'Booking successful!');
                                            setIsChargingConfigOpen(false);

                                            // Only navigate to charging session for "Book Now"
                                            if (bookingMode === "now") {
                                                // Generate a booking ID for charging session
                                                const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                                                // Call the callback to navigate to charging session
                                                onStartCharging?.(bookingId);
                                            } else {
                                                // For scheduled booking, navigate to MyBookingView
                                                // This would typically be handled by parent component
                                                // For now, we'll just show success message
                                                toast.info(
                                                    language === 'vi' 
                                                        ? 'Đặt lịch đã được lưu vào My Bookings' 
                                                        : 'Booking saved to My Bookings'
                                                );
                                            }
                                        }
                                    }}
                                    className="flex-1"
                                    disabled={bookingMode === "scheduled" && (!chargingStartTimeInput || targetBatteryLevelConfig <= initialBatteryLevel)}
                                >
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {language === 'vi' ? 'Xác nhận đặt lịch' : 'Confirm Booking'}
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => setIsChargingConfigOpen(false)}
                                >
                                    {language === 'vi' ? 'Hủy' : 'Cancel'}
                                </Button>
                            </div>
                        </div>
                    )}
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
                                        {language === 'vi' 
                                            ? 'Vui lòng thêm xe vào tài khoản của bạn' 
                                            : 'Please add a vehicle to your account'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {vehicles.map((vehicle, index) => (
                                <motion.div
                                    key={vehicle.vehicleId || vehicle.id || index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.1 }}
                                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                                        selectedVehicle?.vehicleId === vehicle.vehicleId || 
                                        selectedVehicle?.id === vehicle.id
                                            ? 'border-primary bg-primary/10' 
                                            : 'border-border hover:border-primary/50'
                                    }`}
                                    onClick={() => {
                                        console.log("=== Vehicle clicked ===");
                                        console.log("Clicked vehicle:", vehicle);
                                        setSelectedVehicle(vehicle);
                                        console.log("setSelectedVehicle called with:", vehicle);
                                    }}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <Car className="w-6 h-6 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium">{vehicle.model || vehicle.carModel || 'Unknown Model'}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {vehicle.licensePlate || vehicle.licenseNumber || 'No License Plate'}
                                            </p>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <Badge variant="outline" className="text-xs">
                                                    {vehicle.year || 'N/A'}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                    {vehicle.connectorType || 'Standard'}
                                                </Badge>
                                            </div>
                                        </div>
                                        {selectedVehicle?.vehicleId === vehicle.vehicleId || 
                                         selectedVehicle?.id === vehicle.id ? (
                                            <CheckCircle className="w-5 h-5 text-primary" />
                                        ) : (
                                            <div className="w-5 h-5 border-2 border-muted-foreground rounded-full" />
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    <div className="flex space-x-2 pt-4 border-t">
                        <Button
                            onClick={() => {
                                console.log("=== Confirm button clicked ===");
                                console.log("selectedVehicle at confirm:", selectedVehicle);
                                if (selectedVehicle) {
                                    console.log("Vehicle confirmed, closing popup");
                                    setIsVehicleSelectionOpen(false);
                                } else {
                                    console.log("No vehicle selected at confirm");
                                    toast.warning(
                                        language === 'vi' 
                                            ? 'Vui lòng chọn một xe' 
                                            : 'Please select a vehicle'
                                    );
                                }
                            }}
                            className="flex-1"
                            disabled={!selectedVehicle}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {language === 'vi' ? 'Xác nhận' : 'Confirm'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                // For now, just close the dialog
                                // In a real app, this might navigate to vehicle management
                                setIsVehicleSelectionOpen(false);
                            }}
                        >
                            {language === 'vi' ? 'Thêm xe' : 'Add Vehicle'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>

    );

}