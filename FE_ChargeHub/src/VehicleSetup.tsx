import { useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Badge } from "./components/ui/badge";
import { ArrowLeft, Car, Zap } from "lucide-react";
import { searchVehicles, VehicleModel } from "./data/vehicleData";
import { useLanguage } from "./contexts/LanguageContext";

interface VehicleSetupProps {
  onNext: () => void;
  onBack: () => void;
}

export default function VehicleSetup({ onNext, onBack }: VehicleSetupProps) {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({
    plateNumber: "",
    brand: "",
    model: "",
    color: ""
  });

  const [modelQuery, setModelQuery] = useState("");
  const [searchResults, setSearchResults] = useState<VehicleModel[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleModel | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleModelSearch = (value: string) => {
    setModelQuery(value);
    setFormData({ ...formData, model: value });
    
    if (value.trim()) {
      const results = searchVehicles(value);
      setSearchResults(results);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
      setSelectedVehicle(null);
    }
  };

  const selectVehicle = (vehicle: VehicleModel) => {
    setSelectedVehicle(vehicle);
    setModelQuery(`${vehicle.brand} ${vehicle.model}`);
    setFormData({
      ...formData,
      brand: vehicle.brand,
      model: `${vehicle.brand} ${vehicle.model}`
    });
    setShowResults(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="h-1 bg-muted flex-1 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-3/4"></div>
            </div>
          </div>
          <h1 className="text-2xl text-foreground mb-1">{t('vehicle_setup')}</h1>
          <p className="text-muted-foreground">{t('register_your_vehicle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Form Fields */}
          <div className="space-y-8">
            {/* Plate Number */}
            <div className="space-y-3">
              <Label className="text-lg text-foreground">{t('license_plate')}</Label>
              <Input
                value={formData.plateNumber}
                onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                placeholder={t('enter_license_plate')}
                className="h-12 bg-input-background border-border rounded-lg text-base"
                required
              />
            </div>

            {/* Brand */}
            <div className="space-y-3">
              <Label className="text-lg text-foreground">{t('vehicle_brand')}</Label>
              <Input
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder={t('select_brand')}
                className="h-12 bg-input-background border-border rounded-lg text-base"
                required
              />
            </div>

            {/* Model with Search */}
            <div className="space-y-3 relative">
              <Label className="text-lg text-foreground">{t('vehicle_model')}</Label>
              <Input
                value={modelQuery}
                onChange={(e) => handleModelSearch(e.target.value)}
                placeholder={language === 'vi' 
                  ? "Gõ để tìm xe (ví dụ: Tesla Model 3, BMW i3)"
                  : "Type to search vehicles (e.g., Tesla Model 3, BMW i3)"
                }
                className="h-12 bg-input-background border-border rounded-lg text-base"
                required
              />

              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-lg shadow-xl z-20 max-h-80 overflow-y-auto">
                  {searchResults.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      type="button"
                      onClick={() => selectVehicle(vehicle)}
                      className="w-full p-4 text-left hover:bg-accent border-b border-border last:border-b-0 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <img
                              src={vehicle.image}
                              alt={`${vehicle.brand} ${vehicle.model}`}
                              className="w-12 h-8 object-cover rounded border"
                            />
                            <div>
                              <div className="font-medium text-card-foreground">
                                {vehicle.brand} {vehicle.model}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {vehicle.year} • {vehicle.range} {language === 'vi' ? 'tầm xa' : 'range'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Connector Types */}
                          <div className="flex items-center space-x-2">
                            <Zap className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {language === 'vi' ? 'Đầu sạc:' : 'Connectors:'}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {vehicle.connectorTypes.map((connector) => (
                                <Badge
                                  key={connector}
                                  variant="secondary"
                                  className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/20"
                                >
                                  {connector}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {/* Show message if no results */}
                  {showResults && modelQuery.trim() && searchResults.length === 0 && (
                    <div className="p-4 text-center text-muted-foreground">
                      <Car className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <div className="text-sm">
                        {language === 'vi' 
                          ? `Không tìm thấy xe nào khớp với "${modelQuery}"`
                          : `No vehicles found matching "${modelQuery}"`
                        }
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {language === 'vi'
                          ? 'Thử tìm theo tên hãng hoặc dòng xe'
                          : 'Try searching by brand or model name'
                        }
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Color */}
            <div className="space-y-3">
              <Label className="text-lg text-foreground">{t('vehicle_color')}</Label>
              {selectedVehicle ? (
                <div className="grid grid-cols-2 gap-2">
                  {selectedVehicle.availableColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`p-3 text-left text-sm border rounded-lg transition-all ${
                        formData.color === color
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary bg-card text-card-foreground"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              ) : (
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder={t('select_color')}
                  className="h-12 bg-input-background border-border rounded-lg text-base"
                  required
                />
              )}
            </div>
          </div>

          {/* Right Column - Vehicle Preview */}
          <div className="flex flex-col items-center justify-center">
            {selectedVehicle ? (
              <div className="text-center">
                <div className="w-80 h-48 bg-card rounded-lg shadow-sm border border-border mb-4 overflow-hidden">
                  <img
                    src={selectedVehicle.image}
                    alt={`${selectedVehicle.brand} ${selectedVehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl text-foreground mb-3">
                  {selectedVehicle.brand} {selectedVehicle.model}
                </h3>
                
                {/* Vehicle Details */}
                <div className="space-y-3 text-left bg-card rounded-lg p-4 border border-border">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        {language === 'vi' ? 'Năm:' : 'Year:'}
                      </span>
                      <span className="ml-2 text-card-foreground">{selectedVehicle.year}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        {language === 'vi' ? 'Tầm xa:' : 'Range:'}
                      </span>
                      <span className="ml-2 text-card-foreground">{selectedVehicle.range}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        {language === 'vi' ? 'Pin:' : 'Battery:'}
                      </span>
                      <span className="ml-2 text-card-foreground">{selectedVehicle.batteryCapacity}</span>
                    </div>
                  </div>
                  
                  {/* Connector Types */}
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center space-x-2 mb-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {language === 'vi' ? 'Đầu sạc' : 'Charging Connectors'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedVehicle.connectorTypes.map((connector) => (
                        <Badge
                          key={connector}
                          variant="secondary"
                          className="text-xs bg-primary/10 text-primary border-primary/20"
                        >
                          {connector}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-80 h-48 bg-card rounded-lg shadow-sm border border-border flex items-center justify-center mb-4">
                  <div className="text-center">
                    <Car className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      {language === 'vi' ? 'Hình ảnh xe' : 'Vehicle Image'}
                    </p>
                  </div>
                </div>
                <h3 className="text-xl text-muted-foreground">
                  {language === 'vi' ? 'Tên xe' : 'Vehicle Name'}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {language === 'vi'
                    ? 'Tìm kiếm dòng xe để xem chi tiết'
                    : 'Search for your vehicle model to see details'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex justify-between items-center mt-12">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>{t('back')}</span>
          </Button>
          
          <Button
            onClick={handleSubmit}
            className="px-8 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
          >
            {t('complete_setup')}
          </Button>
        </div>
      </div>
    </div>
  );
}