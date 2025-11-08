import { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./components/ui/dialog";
import { ArrowLeft, Car, AlertTriangle } from "lucide-react";
import { useLanguage } from "./contexts/LanguageContext";
import axios from "axios";
import { api } from "./services/api";


interface VehicleSetupProps {
  onNext: () => void;
  onBack: () => void;
  onBackToLogin?: () => void;
}

interface ConnectorType {
  TypeName: string;
  ConnectorTypeId: string;
  PowerOutput?: number;
  PricePerKwh?: number;
}

interface UserVehicle {
  plateNumber: string;
  brand: string;
  model: string;
  carModelId?: number;
}
interface CarModel {
  plateNumber: string;
  brand: string;
  model: string;
  connectorTypeId?: string;
  carModelImage?: string;
  carModelId?: number;
}


export default function VehicleSetup({ onNext, onBack, onBackToLogin }: VehicleSetupProps) {
  const { t, language, setLanguage } = useLanguage();
  const [formData, setFormData] = useState({
    plateNumber: "",
    brand: "",
    model: ""
  });

  const [carModels, setCarModels] = useState<CarModel[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null); // Raw error từ API
  const [plateNumber, setPlateNumber] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedCarModel, setSelectedCarModel] = useState<CarModel | null>(null);
  const [selectedCarModelId, setSelectedCarModelId] = useState<number | null>(null);
  const [connectorTypes, setConnectorTypes] = useState<ConnectorType[] | null>(null);
  const [connectorTypeId, setConnectorTypeId] = useState("");
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  // Check if user came from login (has dateOfBirth but no vehicle)
  const isFromLogin = localStorage.getItem("token") && localStorage.getItem("userId");
  
  // Handle back button click - LUÔN hiện popup confirm
  const handleBackClick = () => {
    setShowExitConfirm(true);
  };
  
  // Confirm exit và về Login.tsx
  const handleConfirmExit = () => {
    // Clear all auth data
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("registeredUserId");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    
    // Close popup và về Login.tsx
    setShowExitConfirm(false);
    
    // Sử dụng onBackToLogin nếu có, fallback về onBack
    if (onBackToLogin) {
      onBackToLogin();
    } else {
      onBack();
    }
  };
  
  // Check if license plate already exists
  const checkLicensePlateExists = async (plate: string): Promise<boolean> => {
    try {
      const res = await api.get(`/api/vehicles/${plate}`);
      // Nếu status 200 = license plate đã tồn tại
      if (res.status === 200) {
        return true;
      }
    } catch (err: any) {
      // Nếu 404 = license plate chưa tồn tại (OK)
      if (err.response?.status === 404) {
        return false;
      }
      // Các lỗi khác
      console.error("Error checking license plate:", err);
    }
    return false;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorKey(null);
    setError(null);
    
    // Validate license plate
    if (!plateNumber.trim()) {
      setErrorKey('License plate is required');
      return;
    }
    
    // Validate brand
    if (!selectedBrand || selectedBrand === "") {
      setErrorKey('Brand is required');
      return;
    }
    
    // Validate model
    if (!selectedModel || selectedModel === "") {
      setErrorKey('Model is required');
      return;
    }
    
    if (!selectedCarModelId) {
      setErrorKey('Car model not found');
      return;
    }
    
    // Check license plate duplicate
    setLoading(true);
    const exists = await checkLicensePlateExists(plateNumber.trim());
    setLoading(false);
    
    if (exists) {
      setErrorKey('License plate already exists');
      return;
    }
    
    const vehicleData: UserVehicle = {
      plateNumber: plateNumber.trim(),
      brand: selectedBrand,
      model: selectedModel
    };
    
    const success = await addingUserVehicle(vehicleData);
    if (success) {
      onNext();
    }
  };
  const fetchConnectorType = async() : Promise<ConnectorType[] | null> => {
    try {
      const res = await api.get("/api/connector-types");
      if (res.status === 200) {
        return (res.data as any[]).map((connector) => ({ 
          TypeName: connector.TypeName,
          ConnectorTypeId: connector.connectorTypeId
        })) as ConnectorType[];
      }
    } catch (err) {
      console.error("Error fetching connector types:", err);
      // Don't set error here as it's not critical for the main functionality
    }
    return null;
  };
  const fetchCarModels = async(): Promise<CarModel[] | null> => {
    setLoading(true);
    setError(null);
    setErrorKey(null);
    try {
      const res = await api.get("/api/carModel");
      if (res.status === 200 && res.data.success) {
        // Filter out invalid entries (where brand or model is null)
        const validModels = res.data.data.filter((model: any) => 
          model.brand && model.model && model.brand !== null && model.model !== null
        );
        
        return validModels.map((model: any) => ({
          plateNumber: "", // Not provided in API response
          brand: model.brand,
          model: model.model,
          connectorTypeId: model.connectorTypeIds?.[0], // Take first connector type ID
          carModelImage: model.carModelImage,
          carModelId: model.carModelId
        })) as CarModel[];
      }
    } catch (err) {
      console.error("Error fetching car models:", err);
      setErrorKey('Error loading car models');
      return null;
    }
    return null;
  }

  const filterCarModesByConnector = async(): Promise<CarModel[] | null> => {
    setLoading(true);
    setError(null);
    setErrorKey(null);
    try {
      var connectorTypes = await fetchConnectorType();
      var carModels = await fetchCarModels();
      
      if (connectorTypes && carModels) {
        // Filter models that have compatible connector types
        var filteredModels = carModels.filter((car) =>
          car.connectorTypeId && connectorTypes!.some((connector) => 
            connector.ConnectorTypeId === car.connectorTypeId
          )
        );
        return filteredModels;
      }
      
      // If connector filtering fails, return all car models
      return carModels;
    } catch (err) {
      console.error("Error filtering car models:", err);
      setErrorKey('Error filtering car models');
      return null;
    }
  }
  const addingUserVehicle = async(vehicle: UserVehicle) => {
    setLoading(true);
    setError(null);
    setErrorKey(null);
    const userId = localStorage.getItem("userId") || localStorage.getItem("registeredUserId");
    console.log("Adding vehicle for userId:", userId, plateNumber, selectedCarModelId);
    try {
      const payload = {
        plateNumber: vehicle.plateNumber,
        userId: userId,
        carModelId: selectedCarModelId
      };     
      const response = await api.post("/api/vehicles", payload);

      if (response.status === 200 || response.status === 201) {
        console.log("Vehicle added successfully");
        setLoading(false);
        return true;
      }
    } catch (err: any) {
      console.error("Error adding user vehicle:", err);
      const apiError = err?.response?.data?.message;
      if (apiError) {
        setError(apiError); // Raw message từ API
      } else {
        setErrorKey('Error adding vehicle');
      }
      setLoading(false);
      return false;
    }
    setLoading(false);
    return false;
  }

  const getCarModeIdBaseOnModelAndBrand = (brand: string, model: string): number | null => {
    if (!carModels) return null;
    const carModel = carModels.find(car =>
      car.brand === brand && car.model === model
    );
    return carModel?.carModelId || null;
  };

  // Get unique brands from carModels
  const getUniqueBrands = (): string[] => {
    if (!carModels) return [];
    const brands = [...new Set(carModels.map(model => model.brand))];
    return brands.sort();
  };

  // Get models filtered by selected brand
  const getModelsByBrand = (brand: string): string[] => {
    if (!carModels || !brand) return [];
    const models = carModels
      .filter(model => model.brand === brand)
      .map(model => model.model);
    return [...new Set(models)].sort();
  };

  // Handle brand selection
  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    setSelectedModel(""); // Reset model when brand changes
    setSelectedCarModel(null); // Reset selected car model
    setSelectedCarModelId(null); // Reset selected car model ID
    setFormData({ ...formData, brand, model: "" });
    setError(null); // Clear error when brand is selected
    setErrorKey(null);
  };

  // Handle model selection
  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    setFormData({ ...formData, model });
    setError(null); // Clear error when model is selected
    setErrorKey(null);
    
    // Find and set the selected car model for image display and ID
    if (carModels && selectedBrand) {
      const carModel = carModels.find(car => 
        car.brand === selectedBrand && car.model === model
      );
      setSelectedCarModel(carModel || null);
      setSelectedCarModelId(carModel?.carModelId || null);
      console.log("Selected Car Model ID:", carModel?.carModelId);
    }
  };

  useEffect(() => {
    const loadCarModels = async() => {
      try {
        setLoading(true);
        const models = await filterCarModesByConnector();
        setCarModels(models);
      } catch (err) {
        console.error("Error loading car models:", err);
        setErrorKey('Error loading car data');
      } finally {
        setLoading(false);
      }
    };
    loadCarModels();
  }, []) 

  

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Language Switcher - Top Right */}
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage("en")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                language === "en"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage("vi")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                language === "vi"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              VI
            </button>
          </div>
        </div>
        
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
                  value={plateNumber}
                  onChange={(e) => {
                    setPlateNumber(e.target.value);
                    setFormData({ ...formData, plateNumber: e.target.value });
                  }}
                  placeholder={t('enter_license_plate')}
                  className="h-12 bg-input-background border-border rounded-lg text-base"
                  required
                />
            </div>

            {/* Brand */}
            <div className="space-y-3">
              <Label className="text-lg text-foreground">{t('vehicle_brand')}</Label>
              <Select value={selectedBrand} onValueChange={handleBrandChange} disabled={loading}>
                <SelectTrigger className="h-12 bg-input-background border-border rounded-lg text-base">
                  <SelectValue placeholder={
                    loading 
                      ? t('Loading...')
                      : t('select_brand')
                  } />
                </SelectTrigger>
                <SelectContent>
                  {getUniqueBrands().map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model */}
            <div className="space-y-3">
              <Label className="text-lg text-foreground">{t('vehicle_model')}</Label>
              <Select 
                value={selectedModel} 
                onValueChange={handleModelChange}
                disabled={!selectedBrand || loading}
              >
                <SelectTrigger className="h-12 bg-input-background border-border rounded-lg text-base">
                  <SelectValue 
                    placeholder={
                      loading
                        ? t('Loading...')
                        : !selectedBrand 
                          ? t('Select brand first')
                          : t('select_model')
                    } 
                  />
                </SelectTrigger>
                <SelectContent>
                  {getModelsByBrand(selectedBrand).map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Error Display */}
            {(error || errorKey) && (
              <div className="space-y-3">
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error || (errorKey && t(errorKey))}</p>
                </div>
              </div>
            )}
          
          </div>

          {/* Right Column - Vehicle Preview */}
          <div className="flex flex-col items-center justify-center">
            {selectedBrand && selectedModel && selectedCarModel ? (
              <div className="text-center">
                <div className="w-80 h-48 bg-card rounded-lg shadow-sm border border-border mb-4 overflow-hidden">
                  {selectedCarModel.carModelImage ? (
                    <img
                      src={selectedCarModel.carModelImage}
                      alt={`${selectedBrand} ${selectedModel}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to icon if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="flex items-center justify-center h-full">
                              <svg class="h-16 w-16 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V15a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1m-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4"></path>
                              </svg>
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Car className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl text-foreground mb-3">
                  {selectedBrand} {selectedModel}
                </h3>
                
                {/* Vehicle Details */}
                <div className="space-y-3 text-left bg-card rounded-lg p-4 border border-border">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        {t('Brand:')}
                      </span>
                      <span className="ml-2 text-card-foreground">{selectedBrand}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        {t('Model:')}
                      </span>
                      <span className="ml-2 text-card-foreground">{selectedModel}</span>
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
                      {t('Vehicle Image')}
                    </p>
                  </div>
                </div>
                <h3 className="text-xl text-muted-foreground">
                  {t('Vehicle Name')}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('Select brand and model to see details')}
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
            onClick={handleBackClick}
            className="text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>{t('back')}</span>
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg disabled:opacity-50"
          >
            {loading ? t('Loading...') : t('complete_setup')}
          </Button>
        </div>
      </div>
      
      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
              </div>
              <DialogTitle className="text-xl font-semibold">
                {t('Exit vehicle setup?')}
              </DialogTitle>
            </div>
          </DialogHeader>
          
          <DialogDescription className="text-muted-foreground leading-relaxed pt-2">
            {t('If you exit now, you need to add vehicle information when you log in again to use the charging service. Are you sure you want to exit?')}
          </DialogDescription>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowExitConfirm(false)}
              className="flex-1 sm:flex-none"
            >
              {t('Stay and continue')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmExit}
              className="flex-1 sm:flex-none"
            >
              {t('Exit and logout')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}