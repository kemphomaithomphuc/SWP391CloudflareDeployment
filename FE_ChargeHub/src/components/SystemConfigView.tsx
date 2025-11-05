import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { 
  ArrowLeft,
  Settings,
  Clock,
  CreditCard,
  Plus,
  Save,
  Edit,
  Trash2
} from "lucide-react";
import AdminLanguageThemeControls from "./AdminLanguageThemeControls";
import { 
  getAllSubscriptions, 
  type SubscriptionResponseDTO, 
  updateSubscription,
  getAllChargingStations,
  type ChargingStationDTO,
  getPriceFactorsByStation,
  type PriceFactorResponseDTO,
  createPriceFactor,
  updatePriceFactor,
  deletePriceFactor,
  getAllSubscriptionFeatures,
  type SubscriptionFeatureResponseDTO,
  createSubscriptionFeature,
  updateSubscriptionFeature,
  deleteSubscriptionFeature,
  getSubscriptionFeaturesBySubscription
} from "../services/api";
import { toast } from "sonner";

interface SystemConfigViewProps {
  onBack: () => void;
}

export default function SystemConfigView({ onBack }: SystemConfigViewProps) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  
  // ========== PEAK HOURS (PRICE FACTOR) STATES ==========
  const [stations, setStations] = useState<ChargingStationDTO[]>([]);
  const [priceFactors, setPriceFactors] = useState<PriceFactorResponseDTO[]>([]);
  const [loadingStations, setLoadingStations] = useState(false);
  const [loadingPriceFactors, setLoadingPriceFactors] = useState(false);
  
  // Selected station for viewing price factors
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  
  // Create/Edit price factor
  const [isCreatingPriceFactor, setIsCreatingPriceFactor] = useState(false);
  const [editingPriceFactor, setEditingPriceFactor] = useState<PriceFactorResponseDTO | null>(null);
  
  // Form fields
  const [newFactor, setNewFactor] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newDescription, setNewDescription] = useState("");
  
  // ========== SUBSCRIPTION STATES ==========
  const [selectedPlan, setSelectedPlan] = useState("");
  const [newPlanPrice, setNewPlanPrice] = useState("");
  const [plans, setPlans] = useState<SubscriptionResponseDTO[] | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // ========== SUBSCRIPTION FEATURE STATES ==========
  const [features, setFeatures] = useState<SubscriptionFeatureResponseDTO[]>([]);
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [selectedFeaturePlan, setSelectedFeaturePlan] = useState<number | null>(null);
  
  // Create/Edit feature
  const [isCreatingFeature, setIsCreatingFeature] = useState(false);
  const [editingFeature, setEditingFeature] = useState<SubscriptionFeatureResponseDTO | null>(null);
  
  // Feature form fields
  const [newFeatureKey, setNewFeatureKey] = useState("");
  const [newFeatureValue, setNewFeatureValue] = useState("");
  const [newFeatureType, setNewFeatureType] = useState<"NUMERIC" | "BOOLEAN" | "STRING" | "PERCENTAGE">("NUMERIC");
  const [newFeatureDisplayName, setNewFeatureDisplayName] = useState("");
  const [newFeatureDescription, setNewFeatureDescription] = useState("");

  // Fetch stations on mount
  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoadingStations(true);
        const stationList = await getAllChargingStations();
        setStations(stationList || []);
        // Auto-select first station if available
        if (stationList && stationList.length > 0 && stationList[0]) {
          setSelectedStationId(stationList[0].stationId);
        }
      } catch (error) {
        console.error("Error fetching stations:", error);
        toast.error(language === 'vi' ? 'Không thể tải danh sách trạm' : 'Failed to load stations');
      } finally {
        setLoadingStations(false);
      }
    };
    fetchStations();
  }, []);

  // Fetch price factors when station is selected
  useEffect(() => {
    if (!selectedStationId) return;
    
    const fetchPriceFactors = async () => {
      try {
        setLoadingPriceFactors(true);
        const response = await getPriceFactorsByStation(selectedStationId);
        setPriceFactors(response?.data || []);
      } catch (error) {
        console.error("Error fetching price factors:", error);
        toast.error(language === 'vi' ? 'Không thể tải yếu tố giá' : 'Failed to load price factors');
        setPriceFactors([]);
    } finally {
        setLoadingPriceFactors(false);
      }
    };
    
    fetchPriceFactors();
  }, [selectedStationId]);

  // Fetch subscriptions on mount
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoadingPlans(true);
        const res = await getAllSubscriptions();
        setPlans(res?.data || []);
        // Auto-select first plan for features if available
        if (res?.data && res.data.length > 0 && res.data[0]) {
          setSelectedFeaturePlan(res.data[0].subscriptionId);
        }
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
        setPlans(null);
    } finally {
        setLoadingPlans(false);
      }
    };
    fetchSubscriptions();
  }, []);

  // Fetch subscription features when plan is selected
  useEffect(() => {
    if (!selectedFeaturePlan) return;
    
    const fetchFeatures = async () => {
      try {
        setLoadingFeatures(true);
        const response = await getSubscriptionFeaturesBySubscription(selectedFeaturePlan);
        setFeatures(response?.data || []);
      } catch (error) {
        console.error("Error fetching subscription features:", error);
        toast.error(language === 'vi' ? 'Không thể tải tính năng gói cước' : 'Failed to load subscription features');
        setFeatures([]);
      } finally {
        setLoadingFeatures(false);
      }
    };
    
    fetchFeatures();
  }, [selectedFeaturePlan]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
  };

  // Format date time for display
  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Handle create price factor
  const handleCreatePriceFactor = async () => {
    if (!selectedStationId || !newFactor || !newStartDate || !newStartTime || !newEndDate || !newEndTime) {
      toast.error(language === 'vi' ? 'Vui lòng điền đầy đủ thông tin' : 'Please fill all fields');
      return;
    }

    try {
      const startDateTime = `${newStartDate}T${newStartTime}:00`;
      const endDateTime = `${newEndDate}T${newEndTime}:00`;
      
      await createPriceFactor({
        stationId: selectedStationId,
        factor: parseFloat(newFactor),
        startTime: startDateTime,
        endTime: endDateTime,
        description: newDescription || ""
      });

      toast.success(language === 'vi' ? 'Tạo yếu tố giá thành công' : 'Price factor created successfully');
      
      // Reset form
      setNewFactor("");
      setNewStartDate("");
      setNewStartTime("");
      setNewEndDate("");
      setNewEndTime("");
      setNewDescription("");
      setIsCreatingPriceFactor(false);
      
      // Refresh price factors
      const response = await getPriceFactorsByStation(selectedStationId);
      setPriceFactors(response?.data || []);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          (language === 'vi' ? 'Không thể tạo yếu tố giá' : 'Failed to create price factor');
      toast.error(errorMessage);
      console.error("Error creating price factor:", error);
    }
  };

  // Handle update price factor
  const handleUpdatePriceFactor = async () => {
    if (!editingPriceFactor || !newFactor || !newStartDate || !newStartTime || !newEndDate || !newEndTime) {
      toast.error(language === 'vi' ? 'Vui lòng điền đầy đủ thông tin' : 'Please fill all fields');
      return;
    }

    try {
      const startDateTime = `${newStartDate}T${newStartTime}:00`;
      const endDateTime = `${newEndDate}T${newEndTime}:00`;
      
      await updatePriceFactor(editingPriceFactor.priceFactorId, {
        factor: parseFloat(newFactor),
        startTime: startDateTime,
        endTime: endDateTime,
        description: newDescription || ""
      });

      toast.success(language === 'vi' ? 'Cập nhật yếu tố giá thành công' : 'Price factor updated successfully');
      
      // Reset form
      setEditingPriceFactor(null);
      setNewFactor("");
      setNewStartDate("");
      setNewStartTime("");
      setNewEndDate("");
      setNewEndTime("");
      setNewDescription("");
      
      // Refresh price factors
      const response = await getPriceFactorsByStation(selectedStationId!);
      setPriceFactors(response?.data || []);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          (language === 'vi' ? 'Không thể cập nhật yếu tố giá' : 'Failed to update price factor');
      toast.error(errorMessage);
      console.error("Error updating price factor:", error);
    }
  };

  // Handle delete price factor
  const handleDeletePriceFactor = async (priceFactorId: number) => {
    if (!confirm(language === 'vi' ? 'Bạn có chắc chắn muốn xóa yếu tố giá này?' : 'Are you sure you want to delete this price factor?')) {
      return;
    }

    try {
      await deletePriceFactor(priceFactorId);
      toast.success(language === 'vi' ? 'Xóa yếu tố giá thành công' : 'Price factor deleted successfully');
      
      // Refresh price factors
      const response = await getPriceFactorsByStation(selectedStationId!);
      setPriceFactors(response?.data || []);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          (language === 'vi' ? 'Không thể xóa yếu tố giá' : 'Failed to delete price factor');
      toast.error(errorMessage);
      console.error("Error deleting price factor:", error);
    }
  };

  // Handle edit price factor - populate form
  const handleEditPriceFactor = (factor: PriceFactorResponseDTO) => {
    setEditingPriceFactor(factor);
    setNewFactor(factor.factor.toString());
    setNewDescription(factor.description || "");
    
    // Parse datetime
    const startDate = new Date(factor.startTime);
    const endDate = new Date(factor.endTime);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const startTimeStr = startDate.toTimeString().slice(0, 5);
    const endDateStr = endDate.toISOString().split('T')[0];
    const endTimeStr = endDate.toTimeString().slice(0, 5);
    
    setNewStartDate(startDateStr || "");
    setNewStartTime(startTimeStr || "");
    setNewEndDate(endDateStr || "");
    setNewEndTime(endTimeStr || "");
  };

  // Handle cancel edit/create
  const handleCancelForm = () => {
    setIsCreatingPriceFactor(false);
    setEditingPriceFactor(null);
    setNewFactor("");
    setNewStartDate("");
    setNewStartTime("");
    setNewEndDate("");
    setNewEndTime("");
    setNewDescription("");
  };

  // Handle cancel feature edit/create
  const handleCancelFeatureForm = () => {
    setIsCreatingFeature(false);
    setEditingFeature(null);
    setNewFeatureKey("");
    setNewFeatureValue("");
    setNewFeatureType("NUMERIC");
    setNewFeatureDisplayName("");
    setNewFeatureDescription("");
  };

  // Handle create feature
  const handleCreateFeature = async () => {
    if (!selectedFeaturePlan || !newFeatureKey || !newFeatureValue) {
      toast.error(language === 'vi' ? 'Vui lòng điền đầy đủ thông tin' : 'Please fill all required fields');
      return;
    }

    try {
      const featureData: any = {
        subscriptionId: selectedFeaturePlan,
        featureKey: newFeatureKey,
        featureValue: newFeatureValue,
        featureType: newFeatureType
      };
      
      if (newFeatureDisplayName) featureData.displayName = newFeatureDisplayName;
      if (newFeatureDescription) featureData.description = newFeatureDescription;
      
      await createSubscriptionFeature(featureData);

      toast.success(language === 'vi' ? 'Tạo tính năng thành công' : 'Feature created successfully');
      
      // Reset form
      handleCancelFeatureForm();
      
      // Refresh features
      const response = await getSubscriptionFeaturesBySubscription(selectedFeaturePlan);
      setFeatures(response?.data || []);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          (language === 'vi' ? 'Không thể tạo tính năng' : 'Failed to create feature');
      toast.error(errorMessage);
      console.error("Error creating feature:", error);
    }
  };

  // Handle update feature
  const handleUpdateFeature = async () => {
    if (!editingFeature || !newFeatureKey || !newFeatureValue) {
      toast.error(language === 'vi' ? 'Vui lòng điền đầy đủ thông tin' : 'Please fill all required fields');
      return;
    }

    try {
      const featureData: any = {
        subscriptionId: selectedFeaturePlan!,
        featureKey: newFeatureKey,
        featureValue: newFeatureValue,
        featureType: newFeatureType
      };
      
      if (newFeatureDisplayName) featureData.displayName = newFeatureDisplayName;
      if (newFeatureDescription) featureData.description = newFeatureDescription;
      
      await updateSubscriptionFeature(editingFeature.featureId, featureData);

      toast.success(language === 'vi' ? 'Cập nhật tính năng thành công' : 'Feature updated successfully');
      
      // Reset form
      handleCancelFeatureForm();
      
      // Refresh features
      const response = await getSubscriptionFeaturesBySubscription(selectedFeaturePlan!);
      setFeatures(response?.data || []);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          (language === 'vi' ? 'Không thể cập nhật tính năng' : 'Failed to update feature');
      toast.error(errorMessage);
      console.error("Error updating feature:", error);
    }
  };

  // Handle delete feature
  const handleDeleteFeature = async (featureId: number) => {
    if (!confirm(language === 'vi' ? 'Bạn có chắc chắn muốn xóa tính năng này?' : 'Are you sure you want to delete this feature?')) {
      return;
    }

    try {
      await deleteSubscriptionFeature(featureId);
      toast.success(language === 'vi' ? 'Xóa tính năng thành công' : 'Feature deleted successfully');
      
      // Refresh features
      const response = await getSubscriptionFeaturesBySubscription(selectedFeaturePlan!);
      setFeatures(response?.data || []);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          (language === 'vi' ? 'Không thể xóa tính năng' : 'Failed to delete feature');
      toast.error(errorMessage);
      console.error("Error deleting feature:", error);
    }
  };

  // Handle edit feature - populate form
  const handleEditFeature = (feature: SubscriptionFeatureResponseDTO) => {
    setEditingFeature(feature);
    setNewFeatureKey(feature.featureKey);
    setNewFeatureValue(feature.featureValue);
    setNewFeatureType(feature.featureType as "NUMERIC" | "BOOLEAN" | "STRING" | "PERCENTAGE");
    setNewFeatureDisplayName(feature.displayName || "");
    setNewFeatureDescription(feature.description || "");
  };

  // Handle subscription update
  const handleSubscriptionUpdate = async () => {
    if (!selectedPlan || !newPlanPrice || !plans || plans.length === 0) {
      toast.error(language === 'vi' ? 'Vui lòng chọn gói và nhập giá mới' : 'Please select a plan and enter new price');
      return;
    }
    
    // Find subscription by plan type (BASIC, PLUS, PREMIUM)
    const subscription = plans.find(p => 
      (p.type || "").toUpperCase() === selectedPlan.toUpperCase()
    );
    
    if (!subscription || !subscription.subscriptionId) {
      toast.error(language === 'vi' ? `Không tìm thấy gói cước với loại: ${selectedPlan}` : `Subscription not found for plan type: ${selectedPlan}`);
      return;
    }
    
    try {
      const response = await updateSubscription(subscription.subscriptionId, {
        price: Number(newPlanPrice)
      });
      
      // Check if update was successful
      if (response?.success) {
        // Show success toast with backend message
        toast.success(response.message || (language === 'vi' ? 'Cập nhật gói cước thành công' : 'Subscription updated successfully'));
        
        // Refresh plans list after update
        const res = await getAllSubscriptions();
        setPlans(res?.data || []);
        setSelectedPlan("");
        setNewPlanPrice("");
      } else {
        // Show error toast if success is false
        toast.error(response.message || (language === 'vi' ? 'Cập nhật gói cước thất bại' : 'Failed to update subscription'));
      }
    } catch (error: any) {
      // Handle error response
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          (language === 'vi' ? 'Có lỗi xảy ra khi cập nhật gói cước' : 'An error occurred while updating subscription');
      toast.error(errorMessage);
      console.error("Error updating subscription:", error);
    }
  };

  const displayPlans = useMemo(() => {
    if (plans && plans.length > 0) {
      return plans.map(p => ({
        id: String(p.subscriptionId ?? p.type ?? ""),
        name: (p.type || "").toUpperCase(),
      }));
    }
    return [];
  }, [plans]);

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
                {t('back_to_dashboard')}
              </Button>
              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 via-red-500/90 to-red-500/70 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 transform group-hover:scale-110 transition-transform duration-300">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="font-semibold text-foreground">
                    {t('system_configuration')}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {t('manage_pricing_settings')}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Admin Language Theme Controls */}
            <AdminLanguageThemeControls />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Tabs defaultValue="peak-hours" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 bg-card/80 backdrop-blur-sm">
            <TabsTrigger value="peak-hours" className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>{t('peak_hours')}</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span>{t('subscriptions')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Peak Hours (Price Factor) Tab */}
          <TabsContent value="peak-hours" className="space-y-6">
            <Card className="bg-card/80 backdrop-blur-sm border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span>{t('peak_hours_management')}</span>
                </CardTitle>
                <CardDescription>
                  {t('configure_peak_multipliers')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Station Selection */}
                <div className="space-y-4">
                  <h4 className="font-medium">
                    {language === 'vi' ? 'Chọn trạm sạc' : 'Select Charging Station'}
                  </h4>
                  <Select 
                    value={selectedStationId?.toString() || ""} 
                    onValueChange={(value: string) => setSelectedStationId(parseInt(value))}
                  >
                      <SelectTrigger className="bg-input-background border-border/60">
                      <SelectValue placeholder={language === 'vi' ? 'Chọn trạm...' : 'Select station...'} />
                      </SelectTrigger>
                      <SelectContent>
                      {stations.map((station) => (
                        <SelectItem key={station.stationId} value={station.stationId.toString()}>
                            <div>
                            <p className="font-medium">{station.stationName}</p>
                            <p className="text-xs text-muted-foreground">{station.address}</p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                {/* Current Price Factors */}
                {selectedStationId && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                        {language === 'vi' ? 'Yếu tố giá hiện tại' : 'Current Price Factors'}
                        </h4>
                      <Dialog open={isCreatingPriceFactor || !!editingPriceFactor} onOpenChange={(open: boolean) => !open && handleCancelForm()}>
                        <DialogTrigger asChild>
                          <Button onClick={() => setIsCreatingPriceFactor(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            {language === 'vi' ? 'Thêm yếu tố giá' : 'Add Price Factor'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card/80 backdrop-blur-sm border-border/60 max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center space-x-2">
                              <Clock className="w-5 h-5 text-primary" />
                              <span>
                                {editingPriceFactor 
                                  ? (language === 'vi' ? 'Chỉnh sửa yếu tố giá' : 'Edit Price Factor')
                                  : (language === 'vi' ? 'Yếu tố giá mới' : 'New Price Factor')
                                }
                              </span>
                            </DialogTitle>
                            <DialogDescription>
                              {language === 'vi' ? 'Thiết lập hệ số giá theo thời gian' : 'Set price multiplier by time'}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            {/* Factor */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                {language === 'vi' ? 'Hệ số giá' : 'Price Factor'}
                              </label>
                              <Input
                                type="number"
                                step="0.1"
                                value={newFactor}
                                onChange={(e) => setNewFactor(e.target.value)}
                                placeholder="e.g. 1.5"
                                className="bg-input-background border-border/60"
                              />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                {language === 'vi' ? 'Mô tả' : 'Description'}
                              </label>
                              <Input
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                placeholder={language === 'vi' ? 'Nhập mô tả...' : 'Enter description...'}
                                className="bg-input-background border-border/60"
                              />
                            </div>

                            {/* Start Date */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                {language === 'vi' ? 'Ngày bắt đầu' : 'Start Date'}
                              </label>
                              <Input
                                type="date"
                                value={newStartDate}
                                onChange={(e) => setNewStartDate(e.target.value)}
                                className="bg-input-background border-border/60"
                              />
                            </div>

                            {/* Start Time */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                {language === 'vi' ? 'Giờ bắt đầu' : 'Start Time'}
                              </label>
                              <Input
                                type="time"
                                value={newStartTime}
                                onChange={(e) => setNewStartTime(e.target.value)}
                                className="bg-input-background border-border/60"
                              />
                            </div>

                            {/* End Date */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                {language === 'vi' ? 'Ngày kết thúc' : 'End Date'}
                              </label>
                              <Input
                                type="date"
                                value={newEndDate}
                                onChange={(e) => setNewEndDate(e.target.value)}
                                className="bg-input-background border-border/60"
                              />
                          </div>

                            {/* End Time */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {language === 'vi' ? 'Giờ kết thúc' : 'End Time'}
                            </label>
                              <Input
                                type="time"
                                value={newEndTime}
                                onChange={(e) => setNewEndTime(e.target.value)}
                                className="bg-input-background border-border/60"
                            />
                          </div>
                          </div>

                          <div className="flex justify-end space-x-3">
                            <Button variant="outline" onClick={handleCancelForm}>
                              {language === 'vi' ? 'Hủy' : 'Cancel'}
                            </Button>
                            <Button 
                              onClick={editingPriceFactor ? handleUpdatePriceFactor : handleCreatePriceFactor}
                              disabled={!newFactor || !newStartDate || !newStartTime || !newEndDate || !newEndTime}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              {language === 'vi' ? 'Lưu' : 'Save'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {loadingPriceFactors ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {language === 'vi' ? 'Đang tải...' : 'Loading...'}
                      </div>
                    ) : priceFactors.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {language === 'vi' ? 'Chưa có yếu tố giá nào cho trạm này' : 'No price factors for this station'}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {priceFactors.map((factor) => (
                          <Card key={factor.priceFactorId} className="bg-muted/30">
                            <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div>
                                    <h5 className="font-medium">{factor.description || (language === 'vi' ? 'Yếu tố giá' : 'Price Factor')}</h5>
                                    <p className="text-sm text-muted-foreground">
                                      {formatDateTime(factor.startTime)} - {formatDateTime(factor.endTime)}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleEditPriceFactor(factor)}
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    {language === 'vi' ? 'Sửa' : 'Edit'}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => handleDeletePriceFactor(factor.priceFactorId)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    {language === 'vi' ? 'Xóa' : 'Delete'}
                                  </Button>
                  </div>
                </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            <Card className="bg-card/80 backdrop-blur-sm border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <span>{t('subscription_plans_management')}</span>
                </CardTitle>
                <CardDescription>
                  {t('configure_subscription_pricing')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Subscription Plans (live from BE if available) */}
                <div className="space-y-4">
                  <h4 className="font-medium">
                    {t('current_subscription_plans')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plans && plans.length > 0 ? (
                      plans.map((plan: any) => (
                        <Card key={plan.subscriptionId} className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="text-center space-y-3">
                            <h5 className="font-medium">
                                {plan.type ? plan.type.toUpperCase() : plan.subscriptionName || 'N/A'}
                            </h5>
                            <div className="space-y-1">
                                {plan.price && (
                                  <p className="font-semibold text-primary">
                                    {formatCurrency(plan.price)}/{t('month')}
                                  </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      ))
                    ) : (
                      <div className="col-span-3 text-center text-muted-foreground">
                        {language === 'vi' ? 'Đang tải gói cước...' : 'Loading subscription plans...'}
                  </div>
                    )}
                </div>
                </div>
                {/* Update Subscription Plan */}
                <div className="bg-muted/20 rounded-lg p-6 space-y-4">
                  <h4 className="font-medium">
                    {t('update_subscription_plan')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                      <SelectTrigger className="bg-input-background border-border/60">
                        <SelectValue placeholder={t('select_plan')} />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Show plans from backend */}
                        {plans && plans.length > 0 ? (
                          plans.map((plan) => (
                            <SelectItem 
                              key={plan.subscriptionId} 
                              value={(plan.type || "").toUpperCase()}
                            >
                              <div>
                                <p className="font-medium">{(plan.type || "").toUpperCase()}</p>
                                {plan.subscriptionId && (
                                  <p className="text-xs text-muted-foreground">
                                    ID: {plan.subscriptionId}
                                  </p>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            {/* Fallback to hardcoded plans if backend data not available */}
                            <SelectItem value={"BASIC"}>
                              <div>
                                <p className="font-medium">BASIC</p>
                              </div>
                            </SelectItem>
                            <SelectItem value={"PLUS"}>
                              <div>
                                <p className="font-medium">PLUS</p>
                              </div>
                            </SelectItem>
                            <SelectItem value={"PREMIUM"}>
                              <div>
                                <p className="font-medium">PREMIUM</p>
                              </div>
                            </SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder={t('new_price_vnd')}
                      value={newPlanPrice}
                      onChange={(e) => setNewPlanPrice(e.target.value)}
                      className="bg-input-background border-border/60"
                    />
                    <Button onClick={handleSubscriptionUpdate} disabled={!selectedPlan || !newPlanPrice}>
                      <Save className="w-4 h-4 mr-2" />
                      {t('update_plan')}
                    </Button>
                  </div>
                </div>

                {/* Subscription Features Management */}
                <Card className="bg-card/80 backdrop-blur-sm border-border/60">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="w-5 h-5 text-primary" />
                      <span>{language === 'vi' ? 'Quản lý Tính năng Gói cước' : 'Subscription Features Management'}</span>
                    </CardTitle>
                    <CardDescription>
                      {language === 'vi' ? 'Cấu hình tính năng cho từng gói cước' : 'Configure features for each subscription plan'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Plan Selection */}
                    <div className="space-y-4">
                      <h4 className="font-medium">
                        {language === 'vi' ? 'Chọn gói cước' : 'Select Subscription Plan'}
                      </h4>
                      <Select 
                        value={selectedFeaturePlan?.toString() || ""} 
                        onValueChange={(value: string) => setSelectedFeaturePlan(parseInt(value))}
                      >
                        <SelectTrigger className="bg-input-background border-border/60">
                          <SelectValue placeholder={language === 'vi' ? 'Chọn gói...' : 'Select plan...'} />
                        </SelectTrigger>
                        <SelectContent>
                          {plans && plans.length > 0 ? (
                            plans.map((plan) => (
                              <SelectItem key={plan.subscriptionId} value={plan.subscriptionId.toString()}>
                                <div>
                                  <p className="font-medium">{plan.type ? plan.type.toUpperCase() : plan.subscriptionName || 'N/A'}</p>
                                  {plan.price && (
                                    <p className="text-xs text-muted-foreground">
                                      {formatCurrency(plan.price)}/month
                                    </p>
                                  )}
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>
                              <span className="text-muted-foreground">{language === 'vi' ? 'Không có gói nào' : 'No plans available'}</span>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Current Features */}
                    {selectedFeaturePlan && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">
                            {language === 'vi' ? 'Tính năng hiện tại' : 'Current Features'}
                          </h4>
                          <Dialog open={isCreatingFeature || !!editingFeature} onOpenChange={(open: boolean) => !open && handleCancelFeatureForm()}>
                            <DialogTrigger asChild>
                              <Button onClick={() => setIsCreatingFeature(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                {language === 'vi' ? 'Thêm tính năng' : 'Add Feature'}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card/80 backdrop-blur-sm border-border/60 max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="flex items-center space-x-2">
                                  <Settings className="w-5 h-5 text-primary" />
                                  <span>
                                    {editingFeature 
                                      ? (language === 'vi' ? 'Chỉnh sửa tính năng' : 'Edit Feature')
                                      : (language === 'vi' ? 'Tính năng mới' : 'New Feature')
                                    }
                                  </span>
                                </DialogTitle>
                                <DialogDescription>
                                  {language === 'vi' ? 'Thêm hoặc chỉnh sửa tính năng cho gói cước' : 'Add or edit feature for subscription plan'}
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                                {/* Feature Key */}
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">
                                    {language === 'vi' ? 'Mã tính năng' : 'Feature Key'}
                                  </label>
                                  <Input
                                    value={newFeatureKey}
                                    onChange={(e) => setNewFeatureKey(e.target.value)}
                                    placeholder="e.g. ADVANCE_BOOKING_DAYS"
                                    className="bg-input-background border-border/60"
                                  />
                                </div>

                                {/* Feature Type */}
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">
                                    {language === 'vi' ? 'Loại' : 'Type'}
                                  </label>
                                  <Select value={newFeatureType} onValueChange={(value: "NUMERIC" | "BOOLEAN" | "STRING" | "PERCENTAGE") => setNewFeatureType(value)}>
                                    <SelectTrigger className="bg-input-background border-border/60">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="NUMERIC">NUMERIC</SelectItem>
                                      <SelectItem value="BOOLEAN">BOOLEAN</SelectItem>
                                      <SelectItem value="STRING">STRING</SelectItem>
                                      <SelectItem value="PERCENTAGE">PERCENTAGE</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Feature Value */}
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">
                                    {language === 'vi' ? 'Giá trị' : 'Value'}
                                  </label>
                                  <Input
                                    value={newFeatureValue}
                                    onChange={(e) => setNewFeatureValue(e.target.value)}
                                    placeholder="e.g. 7, true, 10%"
                                    className="bg-input-background border-border/60"
                                  />
                                </div>

                                {/* Display Name */}
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">
                                    {language === 'vi' ? 'Tên hiển thị' : 'Display Name'}
                                  </label>
                                  <Input
                                    value={newFeatureDisplayName}
                                    onChange={(e) => setNewFeatureDisplayName(e.target.value)}
                                    placeholder={language === 'vi' ? 'Tên hiển thị...' : 'Display name...'}
                                    className="bg-input-background border-border/60"
                                  />
                                </div>

                                {/* Description */}
                                <div className="space-y-2 md:col-span-2">
                                  <label className="text-sm font-medium">
                                    {language === 'vi' ? 'Mô tả' : 'Description'}
                                  </label>
                                  <textarea
                                    value={newFeatureDescription}
                                    onChange={(e) => setNewFeatureDescription(e.target.value)}
                                    placeholder={language === 'vi' ? 'Mô tả chi tiết...' : 'Detailed description...'}
                                    className="w-full h-20 px-3 py-2 bg-input-background border border-border/60 rounded-lg text-sm resize-none"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end space-x-3">
                                <Button variant="outline" onClick={handleCancelFeatureForm}>
                                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                                </Button>
                                <Button 
                                  onClick={editingFeature ? handleUpdateFeature : handleCreateFeature}
                                  disabled={!newFeatureKey || !newFeatureValue}
                                >
                                  <Save className="w-4 h-4 mr-2" />
                                  {language === 'vi' ? 'Lưu' : 'Save'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>

                        {loadingFeatures ? (
                          <div className="text-center py-8 text-muted-foreground">
                            {language === 'vi' ? 'Đang tải...' : 'Loading...'}
                          </div>
                        ) : features.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            {language === 'vi' ? 'Chưa có tính năng nào cho gói này' : 'No features for this plan'}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {features.map((feature) => (
                              <Card key={feature.featureId} className="bg-muted/30">
                                <CardContent className="p-4">
                                  <div className="space-y-3">
                                    <div>
                                      <div>
                                        <h5 className="font-medium">{feature.displayName || feature.featureKey}</h5>
                                        <p className="text-sm text-muted-foreground">{feature.description || feature.featureKey}</p>
                                        <Badge variant="outline" className="mt-1">{feature.featureType}</Badge>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleEditFeature(feature)}
                                      >
                                        <Edit className="w-4 h-4 mr-1" />
                                        {language === 'vi' ? 'Sửa' : 'Edit'}
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="destructive"
                                        onClick={() => handleDeleteFeature(feature.featureId)}
                                      >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        {language === 'vi' ? 'Xóa' : 'Delete'}
                    </Button>
                  </div>
                </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
