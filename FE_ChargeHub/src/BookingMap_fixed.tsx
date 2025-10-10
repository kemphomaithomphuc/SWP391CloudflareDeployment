import { useState, useEffect, useRef } from "react";
import { useTheme } from "./contexts/ThemeContext";
import { useLanguage } from "./contexts/LanguageContext";
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
  Settings
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
}

export default function BookingMap({ onBack, currentBatteryLevel = 75 }: BookingMapProps) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState({ lat: 10.8231, lng: 106.6297 }); // Ho Chi Minh City
  const [bookingStep, setBookingStep] = useState<"select" | "confirm" | "success">("select");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [targetBatteryLevel, setTargetBatteryLevel] = useState(80);
  const [mapZoom, setMapZoom] = useState(1);
  const [mapType, setMapType] = useState<"road" | "satellite">("road");
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const mapRef = useRef<HTMLDivElement>(null);

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

  const handleBooking = () => {
    if (!selectedStation || !selectedTimeSlot || targetBatteryLevel <= currentBatteryLevel) return;
    
    setBookingStep("success");
    setTimeout(() => {
      setBookingStep("select");
      setSelectedStation(null);
      setSelectedTimeSlot("");
      setTargetBatteryLevel(80);
    }, 3000);
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

                  {/* Enhanced Booking Section */}
                  {selectedStation?.id === station.id && station.status === "Available" && (
                    <div className="pt-4 border-t border-border space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Book This Station</h4>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Battery Level Information */}
                        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 space-y-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <Battery className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">Battery Configuration</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Current</div>
                              <div className={`font-bold ${
                                currentBatteryLevel <= 20 ? 'text-destructive' :
                                currentBatteryLevel <= 50 ? 'text-yellow-600' : 'text-primary'
                              }`}>
                                {currentBatteryLevel}%
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Target</div>
                              <div className="font-bold text-green-600 dark:text-green-400">
                                {targetBatteryLevel}%
                              </div>
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

                        <div>
                          <label className="text-sm text-muted-foreground mb-1 block">Time Slot</label>
                          <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="now">Now</SelectItem>
                              <SelectItem value="1h">In 1 hour</SelectItem>
                              <SelectItem value="2h">In 2 hours</SelectItem>
                              <SelectItem value="tomorrow">Tomorrow 9:00 AM</SelectItem>
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
                                    <span className="font-medium">{selectedTimeSlot}</span>
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

          {/* Map Placeholder */}
          <div className="space-y-6">
            <Card className="h-96">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Map View</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-64 bg-muted/20 rounded-lg">
                <div className="text-center text-muted-foreground">
                  <MapIcon className="w-12 h-12 mx-auto mb-2" />
                  <p>Interactive map will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}