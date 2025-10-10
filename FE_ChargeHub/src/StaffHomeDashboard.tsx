import { useState } from "react";
import { useTheme } from "./contexts/ThemeContext";
import { useLanguage } from "./contexts/LanguageContext";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { 
  Search,
  MapPin,
  Zap,
  Clock,
  Battery,
  Car,
  Star,
  Navigation,
  Filter,
  RefreshCw,
  ArrowLeft,
  Sun,
  Moon,
  Globe,
  Settings
} from "lucide-react";

interface StaffHomeDashboardProps {
  onBack: () => void;
}

export default function StaffHomeDashboard({ onBack }: StaffHomeDashboardProps) {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all-locations");
  const [selectedChargerType, setSelectedChargerType] = useState("all-types");

  // Mock data for charging stations
  const chargingStations = [
    {
      id: 1,
      name: "ChargeHub Station Alpha",
      address: "123 Nguyen Hue, District 1, Ho Chi Minh City",
      distance: "0.5 km",
      availablePorts: 3,
      totalPorts: 4,
      chargerTypes: ["Type 2", "CCS"],
      rating: 4.8,
      pricePerKwh: "3,500 VND",
      status: "Available",
      amenities: ["Parking", "WiFi", "Cafe"]
    },
    {
      id: 2,
      name: "ChargeHub Station Beta",
      address: "456 Le Loi, District 3, Ho Chi Minh City",
      distance: "1.2 km",
      availablePorts: 2,
      totalPorts: 3,
      chargerTypes: ["Type 2", "CHAdeMO"],
      rating: 4.6,
      pricePerKwh: "3,200 VND",
      status: "Available",
      amenities: ["Parking", "Security"]
    },
    {
      id: 3,
      name: "ChargeHub Station Gamma",
      address: "789 Dong Khoi, District 1, Ho Chi Minh City",
      distance: "2.1 km",
      availablePorts: 0,
      totalPorts: 2,
      chargerTypes: ["Type 2"],
      rating: 4.4,
      pricePerKwh: "3,800 VND",
      status: "Busy",
      amenities: ["Parking"]
    }
  ];

  const filteredStations = chargingStations.filter(station => {
    const matchesSearch = station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         station.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = !selectedLocation || selectedLocation === "all-locations" || station.address.includes(selectedLocation);
    const matchesChargerType = !selectedChargerType || selectedChargerType === "all-types" || station.chargerTypes.includes(selectedChargerType);
    
    return matchesSearch && matchesLocation && matchesChargerType;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30">
      {/* Header */}
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
{t('back_to_staff_portal')}
              </Button>
              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 transform group-hover:scale-110 transition-transform duration-300">
                    <Zap className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h1 className="font-semibold text-foreground">ChargeHub</h1>
                  <p className="text-sm text-muted-foreground">{t('staff_view_find_stations')}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage(language === "en" ? "vi" : "en")}
                className="text-muted-foreground hover:text-foreground"
              >
                <Globe className="w-4 h-4 mr-1" />
                {language === "en" ? "VI" : "EN"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground"
              >
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter Section */}
        <div className="mb-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-foreground">{t('find_charging_stations')}</h2>
            <p className="text-muted-foreground">{t('locate_monitor_stations')}</p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('search_stations_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-card/80 backdrop-blur-sm border-border/60 rounded-xl focus:border-primary/50 focus:ring-primary/20"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-48 bg-card/80 backdrop-blur-sm border-border/60 rounded-xl">
                <SelectValue placeholder={t('all_locations')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-locations">{t('all_locations')}</SelectItem>
                <SelectItem value="District 1">{t('district_1')}</SelectItem>
                <SelectItem value="District 3">{t('district_3')}</SelectItem>
                <SelectItem value="District 7">{t('district_7')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedChargerType} onValueChange={setSelectedChargerType}>
              <SelectTrigger className="w-48 bg-card/80 backdrop-blur-sm border-border/60 rounded-xl">
                <SelectValue placeholder={t('all_charger_types')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-types">{t('all_types')}</SelectItem>
                <SelectItem value="Type 2">{t('type_2')}</SelectItem>
                <SelectItem value="CCS">{t('ccs')}</SelectItem>
                <SelectItem value="CHAdeMO">{t('chademo')}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="bg-card/80 backdrop-blur-sm border-border/60 rounded-xl hover:bg-accent/50"
              onClick={() => {
                setSelectedLocation("all-locations");
                setSelectedChargerType("all-types");
                setSearchQuery("");
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('reset_filters')}
            </Button>
          </div>
        </div>

        {/* Stations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStations.map((station) => (
            <Card key={station.id} className="bg-card/80 backdrop-blur-sm border-border/60 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{station.name}</CardTitle>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{station.rating}</span>
                    </div>
                  </div>
                  <Badge 
                    variant={station.status === "Available" ? "default" : "secondary"}
                    className={station.status === "Available" ? "bg-primary/10 text-primary" : "bg-muted"}
                  >
{t(station.status.toLowerCase())}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{station.address}</p>
                    <p className="text-xs text-muted-foreground font-medium">{station.distance} {t('away')}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <span className="text-sm">{t('available_ports')}</span>
                    </div>
                    <span className="font-medium">{station.availablePorts}/{station.totalPorts}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Battery className="w-4 h-4 text-primary" />
                      <span className="text-sm">{t('price_per_kwh')}</span>
                    </div>
                    <span className="font-medium text-primary">{station.pricePerKwh}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">{t('charger_types')}</p>
                  <div className="flex flex-wrap gap-1">
                    {station.chargerTypes.map((type) => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">{t('amenities')}</p>
                  <div className="flex flex-wrap gap-1">
                    {station.amenities.map((amenity) => (
                      <Badge key={amenity} variant="secondary" className="text-xs">
                        {t(amenity.toLowerCase())}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
{t('view_details')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredStations.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-2">{t('no_stations_found')}</h3>
            <p className="text-muted-foreground mb-4">{t('adjust_search_criteria')}</p>
            <Button 
              variant="outline"
              onClick={() => {
                setSelectedLocation("all-locations");
                setSelectedChargerType("all-types");
                setSearchQuery("");
              }}
            >
              {t('reset_filters')}
            </Button>
          </div>
        )}

        {/* Staff Note */}
        <div className="mt-12 text-center">
          <div className="bg-card/60 backdrop-blur-sm rounded-xl p-6 border border-border/30">
            <h3 className="font-medium text-foreground mb-2">{t('staff_information')}</h3>
            <p className="text-muted-foreground text-sm">
              {t('staff_view_note')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}