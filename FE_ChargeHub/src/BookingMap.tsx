import { useState, useEffect, useRef } from "react";
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
import { motion } from "motion/react";
import QRCodeGenerator from "./components/QRCodeGenerator";
import ChargingInvoiceView from "./components/ChargingInvoiceView";
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
  RefreshCw,
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
  CheckCircle
} from "lucide-react";

interface ChargingStation {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance: string;
  availablePorts: number;
  totalPorts: number;
  chargerTypes: Array<{
    type: string;
    power: string;
    available: number;
    total: number;
  }>;
  rating: number;
  reviewCount: number;
  pricePerKwh: string;
  status: "Available" | "Busy" | "Maintenance" | "Coming Soon";
  amenities: string[];
  operatingHours: string;
  fastCharging: boolean;
  powerLevel: "Standard" | "Fast" | "Ultra Fast";
  photos: string[];
  operator: string;
  lastUpdated: string;
  estimatedWaitTime?: string;
  weather?: {
    temp: number;
    condition: "sunny" | "cloudy" | "rainy";
    humidity: number;
  };
}

interface FilterState {
  priceRange: [number, number];
  powerLevels: string[];
  amenities: string[];
  operators: string[];
  availableOnly: boolean;
  fastChargingOnly: boolean;
  open24h: boolean;
}

interface BookingMapProps {
  onBack: () => void;
  currentBatteryLevel?: number;
  setCurrentBatteryLevel?: (level: number) => void;
}

export default function BookingMap({ onBack, currentBatteryLevel = 75, setCurrentBatteryLevel }: BookingMapProps) {
  const { theme } = useTheme();
  const { addBooking } = useBooking();
  const { language, t } = useLanguage();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const mapRef = useRef<HTMLDivElement>(null);

  // Charging session states
  const [chargingProgress, setChargingProgress] = useState(0);
  const [chargingStartTime, setChargingStartTime] = useState<Date | null>(null);
  const [currentChargingBattery, setCurrentChargingBattery] = useState(0);
  const [chargingCost, setChargingCost] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [chargingPower, setChargingPower] = useState(0);
  const [chargingIntervalRef, setChargingIntervalRef] = useState<NodeJS.Timeout | null>(null);
  const [completedSession, setCompletedSession] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [detailsStation, setDetailsStation] = useState<ChargingStation | null>(null);

  // Advanced Filters State
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 10000],
    powerLevels: [],
    amenities: [],
    operators: [],
    availableOnly: false,
    fastChargingOnly: false,
    open24h: false
  });

  // Mock current user ID (in real app, get from auth context)
  const currentUserId = "user-001"; // Has premium subscription
  const userSubscription = getCurrentUserSubscription(currentUserId);
  const subscriptionPlan = userSubscription ? getSubscriptionPlan(userSubscription.planId) : null;

  // Handler for opening station details
  const handleViewDetails = (station: ChargingStation) => {
    setDetailsStation(station);
    setIsDetailsDialogOpen(true);
  };

  // Cleanup charging interval on unmount
  useEffect(() => {
    return () => {
      if (chargingIntervalRef) {
        clearInterval(chargingIntervalRef);
      }
    };
  }, [chargingIntervalRef]);

  // Enhanced charging stations data
  const chargingStations: ChargingStation[] = [
    {
      id: 1,
      name: "V-GREEN Station Central",
      address: "123 Nguyen Hue, District 1, Ho Chi Minh City",
      lat: 10.8231,
      lng: 106.6297,
      distance: "0.5 km",
      availablePorts: 6,
      totalPorts: 8,
      chargerTypes: [
        { type: "DC Fast", power: "150kW", available: 2, total: 3 },
        { type: "AC Standard", power: "22kW", available: 4, total: 5 }
      ],
      rating: 4.8,
      reviewCount: 127,
      pricePerKwh: "3,500 VND",
      status: "Available",
      amenities: ["Parking", "WiFi", "Cafe", "Security", "Shopping", "Restroom"],
      operatingHours: "24/7",
      fastCharging: true,
      powerLevel: "Ultra Fast",
      photos: ["station1_1.jpg", "station1_2.jpg"],
      operator: "VinFast",
      lastUpdated: "2 mins ago",
      weather: { temp: 28, condition: "sunny", humidity: 65 }
    },
    {
      id: 2,
      name: "ChargeHub Premium Station",
      address: "456 Le Loi, District 3, Ho Chi Minh City", 
      lat: 10.7769,
      lng: 106.6955,
      distance: "1.2 km",
      availablePorts: 3,
      totalPorts: 6,
      chargerTypes: [
        { type: "DC Fast", power: "60kW", available: 1, total: 2 },
        { type: "AC Standard", power: "11kW", available: 2, total: 4 }
      ],
      rating: 4.6,
      reviewCount: 89,
      pricePerKwh: "3,200 VND",
      status: "Available",
      amenities: ["Parking", "Security", "Restroom", "Coffee"],
      operatingHours: "6:00 AM - 10:00 PM",
      fastCharging: true,
      powerLevel: "Fast",
      photos: ["station2_1.jpg"],
      operator: "ChargeHub",
      lastUpdated: "5 mins ago",
      estimatedWaitTime: "10-15 mins",
      weather: { temp: 29, condition: "cloudy", humidity: 70 }
    },
    {
      id: 3,
      name: "EcoCharge Station District 7",
      address: "789 Nguyen Van Linh, District 7, Ho Chi Minh City",
      lat: 10.7415,
      lng: 106.7219,
      distance: "3.5 km",
      availablePorts: 2,
      totalPorts: 4,
      chargerTypes: [
        { type: "DC Fast", power: "120kW", available: 1, total: 2 },
        { type: "AC Standard", power: "7kW", available: 1, total: 2 }
      ],
      rating: 4.5,
      reviewCount: 56,
      pricePerKwh: "3,300 VND",
      status: "Available",
      amenities: ["Parking", "Restroom", "Shopping"],
      operatingHours: "5:00 AM - 11:00 PM",
      fastCharging: true,
      powerLevel: "Fast",
      photos: ["station3_1.jpg"],
      operator: "EcoCharge",
      lastUpdated: "8 mins ago",
      weather: { temp: 27, condition: "sunny", humidity: 60 }
    },
    {
      id: 4,
      name: "PowerHub Express Binh Thanh",
      address: "456 Xo Viet Nghe Tinh, Binh Thanh, Ho Chi Minh City",
      lat: 10.8014,
      lng: 106.7109,
      distance: "4.2 km",
      availablePorts: 0,
      totalPorts: 6,
      chargerTypes: [
        { type: "DC Fast", power: "180kW", available: 0, total: 3 },
        { type: "AC Standard", power: "22kW", available: 0, total: 3 }
      ],
      rating: 4.7,
      reviewCount: 92,
      pricePerKwh: "3,800 VND",
      status: "Busy",
      amenities: ["Parking", "WiFi", "Cafe", "Security"],
      operatingHours: "24/7",
      fastCharging: true,
      powerLevel: "Ultra Fast",
      photos: ["station4_1.jpg"],
      operator: "PowerHub",
      lastUpdated: "3 mins ago",
      estimatedWaitTime: "20-25 mins",
      weather: { temp: 28, condition: "sunny", humidity: 65 }
    },
    {
      id: 5,
      name: "GreenVolt Station Tan Binh",
      address: "123 Cong Hoa, Tan Binh, Ho Chi Minh City",
      lat: 10.8006,
      lng: 106.6530,
      distance: "5.1 km",
      availablePorts: 4,
      totalPorts: 8,
      chargerTypes: [
        { type: "DC Fast", power: "100kW", available: 2, total: 4 },
        { type: "AC Standard", power: "11kW", available: 2, total: 4 }
      ],
      rating: 4.4,
      reviewCount: 73,
      pricePerKwh: "3,100 VND",
      status: "Available",
      amenities: ["Parking", "WiFi", "Restroom"],
      operatingHours: "6:00 AM - 10:00 PM",
      fastCharging: true,
      powerLevel: "Fast",
      photos: ["station5_1.jpg"],
      operator: "GreenVolt",
      lastUpdated: "12 mins ago",
      weather: { temp: 26, condition: "rainy", humidity: 85 }
    },
    {
      id: 6,
      name: "QuickCharge Station Phu Nhuan",
      address: "789 Phan Xich Long, Phu Nhuan, Ho Chi Minh City",
      lat: 10.7983,
      lng: 106.6831,
      distance: "2.8 km",
      availablePorts: 1,
      totalPorts: 2,
      chargerTypes: [
        { type: "AC Standard", power: "22kW", available: 1, total: 2 }
      ],
      rating: 4.2,
      reviewCount: 34,
      pricePerKwh: "2,900 VND",
      status: "Available",
      amenities: ["Parking", "Security"],
      operatingHours: "24/7",
      fastCharging: false,
      powerLevel: "Standard",
      photos: ["station6_1.jpg"],
      operator: "QuickCharge",
      lastUpdated: "15 mins ago",
      weather: { temp: 28, condition: "cloudy", humidity: 70 }
    }
  ];

  // Filtered stations based on search and filters
  const filteredStations = chargingStations.filter(station => {
    const matchesSearch = station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         station.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAvailable = !filters.availableOnly || station.status === "Available";
    const matchesFastCharging = !filters.fastChargingOnly || station.fastCharging;
    const matches24h = !filters.open24h || station.operatingHours === "24/7";
    
    return matchesSearch && matchesAvailable && matchesFastCharging && matches24h;
  });

  const calculateEstimatedCost = () => {
    if (!selectedStation) return { originalPrice: 0, discountedPrice: 0, discount: 0, discountAmount: 0, chargingTime: 0, kwhNeeded: 0 };

    // Calculate kWh needed based on battery levels
    const batteryDifference = Math.max(0, targetBatteryLevel - currentBatteryLevel);
    const kwhNeeded = (batteryDifference / 100) * 75; // Assume 75kWh battery capacity for Tesla Model 3
    
    if (kwhNeeded <= 0) {
      return { originalPrice: 0, discountedPrice: 0, discount: 0, discountAmount: 0, chargingTime: 0, kwhNeeded: 0 };
    }

    // Get price per kWh from station (remove VND and convert to number)
    const pricePerKwhString = selectedStation.pricePerKwh.replace(/[^\d]/g, '');
    const pricePerKwh = parseInt(pricePerKwhString) || 3500;
    
    // Calculate base price based on kWh needed
    const basePrice = Math.round(kwhNeeded * pricePerKwh);

    // Calculate estimated charging time based on charger power
    let chargingPowerKw = 22; // Default AC charging
    if (selectedStation.chargerTypes[0]?.power) {
      const powerString = selectedStation.chargerTypes[0].power.replace(/[^\d]/g, '');
      chargingPowerKw = parseInt(powerString) || 22;
    }
    
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
    const baseDistance = parseFloat(station.distance.replace(/[^0-9.]/g, ''));
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
        instruction: `Turn left into ${station.name}`,
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
    const timeSlotData = formatSelectedTimeSlot(selectedTimeSlot);
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
        const hour = parseInt(selectedTimeSlot.split('-')[1]);
        tomorrow.setHours(hour, 0, 0, 0);
        bookingDate = tomorrow.toLocaleDateString('en-CA');
        bookingTime = tomorrow.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      } else if (selectedTimeSlot.includes('nextweek')) {
        // Next week booking
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const dayOfWeek = parseInt(selectedTimeSlot.split('-')[1]);
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
      stationName: selectedStation.name,
      stationAddress: selectedStation.address,
      date: bookingDate,
      time: bookingTime,
      duration: costInfo.chargingTime,
      status: isImmediateBooking ? 'confirmed' : 'confirmed',
      estimatedCost: costInfo.discountedPrice,
      chargerType: selectedStation.powerLevel === 'Ultra Fast' ? 'DC_FAST' : selectedStation.powerLevel === 'Fast' ? 'AC_FAST' : 'AC_SLOW',
      power: selectedStation.powerLevel === 'Ultra Fast' ? 150 : selectedStation.powerLevel === 'Fast' ? 50 : 22,
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
    setChargingStartTime(startTime);
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
            stationName: selectedStation?.name || '',
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
          setCurrentBatteryLevel(Math.round(newBattery));
          
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
                  {selectedStation.name}
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
              <h4 className="font-medium">{selectedStation.name}</h4>
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
                value={`ChargeHub-${selectedStation.id}-${Date.now()}`}
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
    const elapsedTime = chargingStartTime ? Math.floor((Date.now() - chargingStartTime.getTime()) / 1000) : 0;
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
              {selectedStation.name}
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
                  setChargingStartTime(null);
                  setRemainingTime(0);
                  setChargingPower(0);
                  
                  // Update battery level to current charging level
                  if (currentChargingBattery > currentBatteryLevel) {
                    setCurrentBatteryLevel(Math.round(currentChargingBattery));
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
          setChargingStartTime(null);
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
          setChargingStartTime(null);
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
            </div>

            {/* Enhanced Header Controls */}
            <div className="flex items-center space-x-4">
              {/* Subscription Info in Header */}
              {subscriptionPlan && (
                <div className="hidden lg:flex items-center space-x-2 bg-primary/10 rounded-lg px-3 py-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-primary">{subscriptionPlan.name}</span>
                  <span className="text-xs text-primary/80">({subscriptionPlan.chargingDiscount}% off)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stations List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-foreground">{t('find_charging_stations')}</h2>
                <div className="flex items-center space-x-2">
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
            <div className="space-y-4">
              {filteredStations.map((station) => (
                <motion.div
                  key={station.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-card rounded-xl p-6 shadow-sm border border-border cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedStation?.id === station.id ? 'ring-2 ring-primary border-primary' : ''
                  }`}
                  onClick={() => setSelectedStation(station)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-card-foreground">{station.name}</h3>
                        <Badge 
                          variant={station.status === "Available" ? "default" : "secondary"}
                          className={`${
                            station.status === "Available" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : ""
                          }`}
                        >
                          {station.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{station.address}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{station.distance}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Zap className="w-4 h-4" />
                          <span>{station.availablePorts}/{station.totalPorts} available</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>{station.rating} ({station.reviewCount})</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-primary">{station.pricePerKwh}</div>
                      <div className="text-xs text-muted-foreground">per kWh</div>
                    </div>
                  </div>

                  {/* Charger Types */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {station.chargerTypes.map((charger, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {charger.type} {charger.power} ({charger.available}/{charger.total})
                      </Badge>
                    ))}
                  </div>

                  {/* Amenities Preview */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {station.amenities.slice(0, 3).map((amenity, index) => (
                      <div key={index} className="flex items-center space-x-1 text-xs text-muted-foreground">
                        {amenity === 'Parking' && <Car className="w-3 h-3" />}
                        {amenity === 'WiFi' && <Wifi className="w-3 h-3" />}
                        {amenity === 'Cafe' && <Coffee className="w-3 h-3" />}
                        {amenity === 'Security' && <Shield className="w-3 h-3" />}
                        <span>{amenity}</span>
                      </div>
                    ))}
                    {station.amenities.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{station.amenities.length - 3} more</span>
                    )}
                  </div>

                  {/* View Details Button */}
                  <div className="flex justify-center mt-4 mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(station);
                      }}
                      className="flex items-center space-x-2 text-sm"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>{language === 'vi' ? 'Xem Chi tiết' : 'View Details'}</span>
                    </Button>
                  </div>

                  {/* Enhanced Booking Section */}
                  {selectedStation?.id === station.id && station.status === "Available" && (
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
                                  onChange={(e) => {
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
                                className={`h-full transition-all duration-300 ${
                                  currentBatteryLevel <= 20 ? 'bg-destructive' :
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
                              <div className={`text-3xl font-bold ${
                                currentBatteryLevel <= 20 ? 'text-destructive' :
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
                                    className={`p-2 rounded-lg text-sm font-medium transition-all hover:scale-105 ${
                                      currentBatteryLevel === level 
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
                                <div className={`text-lg font-bold ${
                                  currentBatteryLevel <= 20 ? 'text-destructive' :
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
                                onValueChange={(value) => setTargetBatteryLevel(value[0])}
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
                                  className={`p-1.5 rounded text-xs font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    targetBatteryLevel === level 
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
                                  <h4 className="font-medium">{selectedStation.name}</h4>
                                  <p className="text-sm text-muted-foreground">{selectedStation.address}</p>
                                  
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
          </div>

          {/* Interactive Map Section */}
          <div className="space-y-6">
            {/* Map Controls */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5" />
                    <span>Station Map</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={mapType === "road" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setMapType("road");
                        if (selectedStation) {
                          setShowRoute(true);
                          setIsLoadingRoute(true);
                          const details = calculateRouteDetails(selectedStation);
                          setRouteDetails(details);
                          setTimeout(() => setIsLoadingRoute(false), 1500);
                        }
                      }}
                    >
                      <Route className="w-4 h-4 mr-1" />
                      Road
                    </Button>
                    <Button
                      variant={mapType === "satellite" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMapType("satellite")}
                    >
                      <Satellite className="w-4 h-4 mr-1" />
                      Satellite
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative">
                  {/* Map Container */}
                  <div 
                    ref={mapRef}
                    className={`h-96 rounded-lg relative overflow-hidden ${
                      mapType === "satellite" 
                        ? "bg-gradient-to-br from-slate-800 to-slate-900" 
                        : "bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950"
                    }`}
                  >
                    {/* Map Grid Background */}
                    <div className="absolute inset-0 opacity-10">
                      <svg width="100%" height="100%" className="w-full h-full">
                        <defs>
                          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                      </svg>
                    </div>

                    {/* Station Markers - Hide when showing route */}
                    {filteredStations.map((station, index) => (
                      <motion.div
                        key={station.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                          scale: (!showRoute || !routeDetails) ? 1 : 0, 
                          opacity: (!showRoute || !routeDetails) ? 1 : 0 
                        }}
                        transition={{ 
                          delay: (!showRoute || !routeDetails) ? index * 0.1 : 0,
                          duration: 0.3
                        }}
                        className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
                          selectedStation?.id === station.id ? 'z-20' : 'z-10'
                        } ${(!showRoute || !routeDetails) ? '' : 'pointer-events-none'}`}
                        style={{
                          left: `${30 + (index % 3) * 25}%`,
                          top: `${25 + Math.floor(index / 3) * 30}%`
                        }}
                        onClick={() => {
                          if (!showRoute || !routeDetails) {
                            setSelectedStation(station);
                            if (mapType === "road") {
                              setShowRoute(true);
                              setIsLoadingRoute(true);
                              const details = calculateRouteDetails(station);
                              setRouteDetails(details);
                              setTimeout(() => setIsLoadingRoute(false), 1500);
                            }
                          }
                        }}
                      >
                        {/* Station Marker */}
                        <div className={`relative group ${selectedStation?.id === station.id ? 'scale-125' : ''} transition-transform`}>
                          {/* Availability Ring */}
                          <div className={`absolute -inset-2 rounded-full animate-ping ${
                            station.status === "Available" ? "bg-green-400" :
                            station.status === "Busy" ? "bg-yellow-400" : "bg-red-400"
                          } opacity-20`} />
                          
                          {/* Main Marker */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-800 ${
                            station.status === "Available" ? "bg-green-500" :
                            station.status === "Busy" ? "bg-yellow-500" : "bg-red-500"
                          }`}>
                            <Zap className="w-5 h-5 text-white" />
                          </div>

                          {/* Station Info Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-48">
                              <div className="space-y-1">
                                <h4 className="font-medium text-sm">{station.name}</h4>
                                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  <span>{station.distance}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                  <Zap className="w-3 h-3" />
                                  <span>{station.availablePorts}/{station.totalPorts} available</span>
                                </div>
                                <div className="text-xs font-medium text-primary">
                                  {station.pricePerKwh}/kWh
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* User Location */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-15">
                      <div className="relative">
                        <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                          <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            Your Location
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Map Controls */}
                    <div className="absolute top-4 right-4 flex flex-col space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-card/80 backdrop-blur-sm"
                        onClick={() => setMapZoom(Math.min(mapZoom + 0.2, 2))}
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-card/80 backdrop-blur-sm"
                        onClick={() => setMapZoom(Math.max(mapZoom - 0.2, 0.5))}
                      >
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-card/80 backdrop-blur-sm"
                        onClick={() => setShowHeatMap(!showHeatMap)}
                      >
                        <Layers className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Heat Map Overlay */}
                    {showHeatMap && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-radial from-red-500/30 to-transparent rounded-full" />
                        <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-gradient-radial from-yellow-500/30 to-transparent rounded-full" />
                        <div className="absolute bottom-1/3 left-1/2 w-20 h-20 bg-gradient-radial from-green-500/30 to-transparent rounded-full" />
                      </div>
                    )}

                    {/* Route Lines */}
                    {showRoute && selectedStation && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <defs>
                          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.8 }} />
                            <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.8 }} />
                          </linearGradient>
                        </defs>
                        <path
                          d={`M 50% 50% Q 65% 30% ${30 + (filteredStations.findIndex(s => s.id === selectedStation.id) % 3) * 25}% ${25 + Math.floor(filteredStations.findIndex(s => s.id === selectedStation.id) / 3) * 30}%`}
                          stroke="url(#routeGradient)"
                          strokeWidth="3"
                          fill="none"
                          strokeDasharray="10,5"
                          className="animate-pulse"
                        />
                      </svg>
                    )}

                    {/* Loading Indicator */}
                    {isLoadingRoute && (
                      <div className="absolute top-4 left-4 bg-card/80 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Calculating route...</span>
                      </div>
                    )}

                    {/* Route Info Overlay */}
                    {showRoute && routeDetails && !isLoadingRoute && (
                      <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg border shadow-lg p-4 max-w-72">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Route className="w-4 h-4 text-primary" />
                            <h4 className="font-medium text-sm">Route to {selectedStation?.name}</h4>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowRoute(false);
                              setRouteDetails(null);
                            }}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Distance:</span>
                            <span className="font-medium text-primary">{routeDetails.distance}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Est. Time:</span>
                            <span className="font-medium">{routeDetails.duration}</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="space-y-1">
                            <h5 className="text-xs font-medium text-muted-foreground mb-1">DIRECTIONS</h5>
                            {routeDetails.steps.map((step, index) => (
                              <div key={index} className="flex items-start space-x-2 text-xs">
                                <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                                  <span className="text-primary font-medium">{index + 1}</span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-foreground">{step.instruction}</p>
                                  <p className="text-muted-foreground">{step.distance}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <Separator className="my-2" />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowRoute(false);
                              setRouteDetails(null);
                            }}
                            className="w-full text-xs"
                          >
                            <MapPin className="w-3 h-3 mr-1" />
                            Show All Stations
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Distance Markers on Route */}
                    {showRoute && routeDetails && !isLoadingRoute && (
                      <>
                        {/* 25% marker */}
                        <div className="absolute" style={{ left: '58%', top: '40%' }}>
                          <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                            {(parseFloat(routeDetails.distance) * 0.25).toFixed(1)} km
                          </div>
                        </div>
                        {/* 50% marker */}
                        <div className="absolute" style={{ left: '65%', top: '35%' }}>
                          <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                            {(parseFloat(routeDetails.distance) * 0.5).toFixed(1)} km
                          </div>
                        </div>
                        {/* 75% marker */}
                        <div className="absolute" style={{ left: '72%', top: '30%' }}>
                          <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                            {(parseFloat(routeDetails.distance) * 0.75).toFixed(1)} km
                          </div>
                        </div>
                        
                        {/* Destination Station Marker */}
                        <div 
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30"
                          style={{
                            left: `${30 + (filteredStations.findIndex(s => s.id === selectedStation.id) % 3) * 25}%`,
                            top: `${25 + Math.floor(filteredStations.findIndex(s => s.id === selectedStation.id) / 3) * 30}%`
                          }}
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="relative"
                          >
                            {/* Pulsing ring */}
                            <div className="absolute -inset-3 rounded-full bg-primary animate-ping opacity-30" />
                            {/* Main destination marker */}
                            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-800">
                              <Target className="w-6 h-6 text-primary-foreground" />
                            </div>
                            {/* Station name label */}
                            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md whitespace-nowrap">
                              {selectedStation.name}
                            </div>
                          </motion.div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map Legend */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Map Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full" />
                    <span>Available ({filteredStations.filter(s => s.status === "Available").length})</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full" />
                    <span>Busy ({filteredStations.filter(s => s.status === "Busy").length})</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-red-500 rounded-full" />
                    <span>Maintenance ({filteredStations.filter(s => s.status === "Maintenance").length})</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span>Your Location</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Show route to selected station</span>
                    <Switch
                      checked={showRoute}
                      onCheckedChange={(checked) => {
                        setShowRoute(checked);
                        if (checked && selectedStation) {
                          setIsLoadingRoute(true);
                          const details = calculateRouteDetails(selectedStation);
                          setRouteDetails(details);
                          setTimeout(() => setIsLoadingRoute(false), 1500);
                        } else {
                          setRouteDetails(null);
                        }
                      }}
                      disabled={!selectedStation}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Show usage heat map</span>
                    <Switch
                      checked={showHeatMap}
                      onCheckedChange={setShowHeatMap}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected Station Quick Info */}
            {selectedStation && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Target className="w-4 h-4" />
                    <span>Selected Station</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-medium">{selectedStation.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedStation.address}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span>Distance:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{selectedStation.distance}</span>
                        {routeDetails && showRoute && (
                          <Badge variant="secondary" className="text-xs">
                            {routeDetails.duration}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Available ports:</span>
                      <span className="font-medium">{selectedStation.availablePorts}/{selectedStation.totalPorts}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Price per kWh:</span>
                      <span className="font-medium text-primary">{selectedStation.pricePerKwh}</span>
                    </div>
                    {selectedStation.weather && (
                      <div className="flex items-center justify-between text-sm">
                        <span>Weather:</span>
                        <div className="flex items-center space-x-1">
                          {selectedStation.weather.condition === "sunny" && <Sun className="w-4 h-4 text-yellow-500" />}
                          {selectedStation.weather.condition === "cloudy" && <Cloud className="w-4 h-4 text-gray-500" />}
                          {selectedStation.weather.condition === "rainy" && <CloudRain className="w-4 h-4 text-blue-500" />}
                          <span>{selectedStation.weather.temp}°C</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Quick Route Actions */}
                    <Separator className="my-3" />
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={showRoute ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const newShowRoute = !showRoute;
                          setShowRoute(newShowRoute);
                          if (newShowRoute) {
                            setMapType("road");
                            setIsLoadingRoute(true);
                            const details = calculateRouteDetails(selectedStation);
                            setRouteDetails(details);
                            setTimeout(() => setIsLoadingRoute(false), 1500);
                          } else {
                            setRouteDetails(null);
                          }
                        }}
                        className="flex-1"
                      >
                        <Route className="w-4 h-4 mr-1" />
                        {showRoute ? "Hide Route" : "Show Route"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Navigate to station (mock action)
                          alert(`Opening navigation to ${selectedStation.name}`);
                        }}
                      >
                        <Navigation className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Station Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-primary" />
              <span>{detailsStation?.name}</span>
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
                      {language === 'vi' ? 'Khoảng cách' : 'Distance'}
                    </h4>
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-sm">{detailsStation.distance}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">
                      {language === 'vi' ? 'Nhà vận hành' : 'Operator'}
                    </h4>
                    <p className="text-sm">{detailsStation.operator}</p>
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
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">
                      {language === 'vi' ? 'Giờ hoạt động' : 'Operating Hours'}
                    </h4>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-sm">{detailsStation.operatingHours}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">
                      {language === 'vi' ? 'Đánh giá' : 'Rating'}
                    </h4>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm">{detailsStation.rating} ({detailsStation.reviewCount} {language === 'vi' ? 'đánh giá' : 'reviews'})</span>
                    </div>
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
                    <p className="text-lg font-semibold">{detailsStation.availablePorts}/{detailsStation.totalPorts}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        {language === 'vi' ? 'Giá mỗi kWh' : 'Price per kWh'}
                      </span>
                      <DollarSign className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-lg font-semibold text-primary">{detailsStation.pricePerKwh}</p>
                  </div>
                </div>
              </div>

              {/* Charger Types */}
              <div>
                <h4 className="font-medium mb-3">
                  {language === 'vi' ? 'Loại sạc có sẵn' : 'Available Charger Types'}
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {detailsStation.chargerTypes.map((charger, index) => (
                    <div key={index} className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-sm">{charger.type}</h5>
                          <p className="text-xs text-muted-foreground">{charger.power}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{charger.available}/{charger.total} {language === 'vi' ? 'có sẵn' : 'available'}</p>
                          <div className="w-16 bg-muted rounded-full h-2 mt-1">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${(charger.available / charger.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h4 className="font-medium mb-3">
                  {language === 'vi' ? 'Tiện ích' : 'Amenities'}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {detailsStation.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-muted/30 rounded-lg p-2">
                      {amenity === 'Parking' && <Car className="w-4 h-4 text-primary" />}
                      {amenity === 'WiFi' && <Wifi className="w-4 h-4 text-primary" />}
                      {amenity === 'Cafe' && <Coffee className="w-4 h-4 text-primary" />}
                      {amenity === 'Security' && <Shield className="w-4 h-4 text-primary" />}
                      {amenity === 'Shopping' && <MapPin className="w-4 h-4 text-primary" />}
                      {amenity === 'Restroom' && <MapPin className="w-4 h-4 text-primary" />}
                      <span className="text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weather Information */}
              {detailsStation.weather && (
                <div>
                  <h4 className="font-medium mb-3">
                    {language === 'vi' ? 'Thời tiết hiện tại' : 'Current Weather'}
                  </h4>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {detailsStation.weather.condition === 'sunny' && <Sun className="w-5 h-5 text-yellow-500" />}
                        {detailsStation.weather.condition === 'cloudy' && <Cloud className="w-5 h-5 text-gray-500" />}
                        {detailsStation.weather.condition === 'rainy' && <CloudRain className="w-5 h-5 text-blue-500" />}
                        <span className="text-sm capitalize">{detailsStation.weather.condition}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Thermometer className="w-4 h-4 text-red-500" />
                          <span className="text-sm">{detailsStation.weather.temp}°C</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Wind className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">{detailsStation.weather.humidity}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                    alert(`Opening navigation to ${detailsStation.name}`);
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
    </div>
  );
}