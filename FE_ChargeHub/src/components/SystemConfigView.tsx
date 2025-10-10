import { useState } from "react";
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
  MapPin,
  Clock,
  DollarSign,
  AlertTriangle,
  Users,
  Save,
  Plus,
  Edit,
  Trash2,
  Zap,
  Calendar,
  CreditCard,
  Timer,
  Car
} from "lucide-react";
import AdminLanguageThemeControls from "./AdminLanguageThemeControls";

interface SystemConfigViewProps {
  onBack: () => void;
}

// Mock stations data
const stations = [
  { id: "alpha", name: "ChargeHub Station Alpha", address: "123 Nguyen Hue, District 1, Ho Chi Minh City", currentPrice: 3500 },
  { id: "beta", name: "ChargeHub Station Beta", address: "456 Le Loi, District 3, Ho Chi Minh City", currentPrice: 3200 },
  { id: "gamma", name: "ChargeHub Station Gamma", address: "789 Dong Khoi, District 1, Ho Chi Minh City", currentPrice: 3800 },
  { id: "delta", name: "ChargeHub Station Delta", address: "321 Vo Van Tan, District 3, Ho Chi Minh City", currentPrice: 3300 },
  { id: "echo", name: "ChargeHub Station Echo", address: "654 Hai Ba Trung, District 1, Ho Chi Minh City", currentPrice: 3600 }
];

// Mock peak hours data
const peakHours = [
  { id: "morning", label: "Morning Peak", labelVi: "Giờ Cao Điểm Sáng", hours: "7:00 - 9:00", multiplier: 1.5 },
  { id: "evening", label: "Evening Peak", labelVi: "Giờ Cao Điểm Tối", hours: "17:00 - 19:00", multiplier: 1.8 },
  { id: "weekend", label: "Weekend Peak", labelVi: "Cuối Tuần", hours: "Sat-Sun 10:00 - 14:00", multiplier: 1.3 }
];

// Mock subscription plans
const subscriptionPlans = [
  { 
    id: "basic", 
    name: "Basic Plan", 
    nameVi: "Gói Cơ Bản", 
    price: 99000, 
    discount: 5,
    features: {
      en: ["Basic charging access", "Standard charging speed", "Email support", "Basic usage analytics"],
      vi: ["Truy cập sạc cơ bản", "Tốc độ sạc tiêu chuẩn", "Hỗ trợ email", "Phân tích sử dụng cơ bản"]
    }
  },
  { 
    id: "standard", 
    name: "Premium Plan", 
    nameVi: "Gói Premium", 
    price: 199000, 
    discount: 10,
    features: {
      en: ["Extended booking (24h vs 2h)", "Discounted rates (15-20% off)", "No booking/cancellation fees", "Priority charging access", "24/7 phone support", "Advanced analytics"],
      vi: ["Đặt chỗ mở rộng (24h thay vì 2h)", "Giá ưu đãi (giảm 15-20%)", "Miễn phí đặt chỗ/hủy", "Truy cập sạc ưu tiên", "Hỗ trợ điện thoại 24/7", "Phân tích nâng cao"]
    }
  },
  { 
    id: "premium", 
    name: "Pro Plan", 
    nameVi: "Gói Pro", 
    price: 299000, 
    discount: 15,
    features: {
      en: ["Unlimited charging access", "Ultra-fast charging priority", "Dedicated support manager", "Custom analytics reports", "API access", "White-label solutions", "Enterprise features"],
      vi: ["Truy cập sạc không giới hạn", "Ưu tiên sạc siêu nhanh", "Quản lý hỗ trợ chuyên dụng", "Báo cáo phân tích tùy chỉnh", "Truy cập API", "Giải pháp white-label", "Tính năng doanh nghiệp"]
    }
  }
];

export default function SystemConfigView({ onBack }: SystemConfigViewProps) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  
  // Station pricing states
  const [selectedStation, setSelectedStation] = useState("");
  const [newPrice, setNewPrice] = useState("");
  
  // Peak hours states
  const [selectedPeakHour, setSelectedPeakHour] = useState("");
  const [newMultiplier, setNewMultiplier] = useState("");
  
  // Penalty fees states
  const [parkingPenalty, setParkingPenalty] = useState("5000"); // VND per hour
  const [latePenalty, setLatePenalty] = useState("10000"); // VND per 15 minutes
  
  // Subscription states
  const [selectedPlan, setSelectedPlan] = useState("");
  const [newPlanPrice, setNewPlanPrice] = useState("");
  const [newPlanDiscount, setNewPlanDiscount] = useState("");

  // New penalty rule states
  const [isAddingPenaltyRule, setIsAddingPenaltyRule] = useState(false);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleCategory, setNewRuleCategory] = useState("");
  const [newRuleDescription, setNewRuleDescription] = useState("");
  const [newRuleAmount, setNewRuleAmount] = useState("");
  const [newRuleUnit, setNewRuleUnit] = useState("");
  const [newRuleStatus, setNewRuleStatus] = useState("active");
  const [newRuleNotes, setNewRuleNotes] = useState("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
  };

  const handleStationPriceUpdate = () => {
    if (!selectedStation || !newPrice) return;
    
    // In real app, update station price via API
    console.log(`Updating station ${selectedStation} price to ${newPrice} VND/kWh`);
    
    // Reset form
    setSelectedStation("");
    setNewPrice("");
  };

  const handlePeakHourUpdate = () => {
    if (!selectedPeakHour || !newMultiplier) return;
    
    // In real app, update peak hour multiplier via API
    console.log(`Updating peak hour ${selectedPeakHour} multiplier to ${newMultiplier}`);
    
    // Reset form
    setSelectedPeakHour("");
    setNewMultiplier("");
  };

  const handlePenaltyUpdate = () => {
    // In real app, update penalty fees via API
    console.log(`Updating penalties - Parking: ${parkingPenalty} VND/hour, Late: ${latePenalty} VND/15min`);
  };

  const handleSubscriptionUpdate = () => {
    if (!selectedPlan || !newPlanPrice || !newPlanDiscount) return;
    
    // In real app, update subscription plan via API
    console.log(`Updating plan ${selectedPlan} - Price: ${newPlanPrice} VND, Discount: ${newPlanDiscount}%`);
    
    // Reset form
    setSelectedPlan("");
    setNewPlanPrice("");
    setNewPlanDiscount("");
  };

  const handleCreatePenaltyRule = () => {
    if (!newRuleName || !newRuleCategory || !newRuleAmount || !newRuleUnit) return;
    
    // In real app, create new penalty rule via API
    console.log(`Creating penalty rule: ${newRuleName} - Category: ${newRuleCategory} - Amount: ${newRuleAmount} ${newRuleUnit}`);
    
    // Reset form and close dialog
    setNewRuleName("");
    setNewRuleCategory("");
    setNewRuleDescription("");
    setNewRuleAmount("");
    setNewRuleUnit("");
    setNewRuleStatus("active");
    setNewRuleNotes("");
    setIsAddingPenaltyRule(false);
  };

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
        <Tabs defaultValue="station-pricing" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-card/80 backdrop-blur-sm">
            <TabsTrigger value="station-pricing" className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>{t('station_pricing')}</span>
            </TabsTrigger>
            <TabsTrigger value="peak-hours" className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>{t('peak_hours')}</span>
            </TabsTrigger>
            <TabsTrigger value="penalties" className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{t('penalties')}</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span>{t('subscriptions')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Station Pricing Tab */}
          <TabsContent value="station-pricing" className="space-y-6">
            <Card className="bg-card/80 backdrop-blur-sm border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>{t('station_pricing_management')}</span>
                </CardTitle>
                <CardDescription>
                  {t('set_pricing_stations')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Station Prices */}
                <div className="space-y-4">
                  <h4 className="font-medium">
                    {t('current_pricing')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stations.map((station) => (
                      <Card key={station.id} className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{station.name}</p>
                              <p className="text-sm text-muted-foreground">{station.address}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-primary">
                                {formatCurrency(station.currentPrice)}/kWh
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Update Station Price */}
                <div className="bg-muted/20 rounded-lg p-6 space-y-4">
                  <h4 className="font-medium">
                    {t('update_station_price')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select value={selectedStation} onValueChange={setSelectedStation}>
                      <SelectTrigger className="bg-input-background border-border/60">
                        <SelectValue placeholder={t('select_station')} />
                      </SelectTrigger>
                      <SelectContent>
                        {stations.map((station) => (
                          <SelectItem key={station.id} value={station.id}>
                            <div>
                              <p className="font-medium">{station.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {t('current')}: {formatCurrency(station.currentPrice)}/kWh
                              </p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder={t('new_price_kwh')}
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="bg-input-background border-border/60"
                    />
                    <Button onClick={handleStationPriceUpdate} disabled={!selectedStation || !newPrice}>
                      <Save className="w-4 h-4 mr-2" />
                      {t('update_price')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Peak Hours Tab */}
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
                {/* Current Peak Hours */}
                <div className="space-y-4">
                  <h4 className="font-medium">
                    {t('current_peak_hours')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {peakHours.map((peak) => (
                      <Card key={peak.id} className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="text-center space-y-2">
                            <h5 className="font-medium">
                              {language === 'en' ? peak.label : peak.labelVi}
                            </h5>
                            <p className="text-sm text-muted-foreground">{peak.hours}</p>
                            <Badge variant="secondary" className="font-semibold">
                              {peak.multiplier}x {t('multiplier')}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Update Peak Hour */}
                <div className="bg-muted/20 rounded-lg p-6 space-y-4">
                  <h4 className="font-medium">
                    {t('update_peak_multiplier')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select value={selectedPeakHour} onValueChange={setSelectedPeakHour}>
                      <SelectTrigger className="bg-input-background border-border/60">
                        <SelectValue placeholder={t('select_peak_hour')} />
                      </SelectTrigger>
                      <SelectContent>
                        {peakHours.map((peak) => (
                          <SelectItem key={peak.id} value={peak.id}>
                            <div>
                              <p className="font-medium">
                                {language === 'en' ? peak.label : peak.labelVi}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {peak.hours} - {t('current')}: {peak.multiplier}x
                              </p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder={t('new_multiplier')}
                      value={newMultiplier}
                      onChange={(e) => setNewMultiplier(e.target.value)}
                      className="bg-input-background border-border/60"
                    />
                    <Button onClick={handlePeakHourUpdate} disabled={!selectedPeakHour || !newMultiplier}>
                      <Save className="w-4 h-4 mr-2" />
                      {t('update_multiplier')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Penalties Tab */}
          <TabsContent value="penalties" className="space-y-6">
            <Card className="bg-card/80 backdrop-blur-sm border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  <span>{t('penalty_fees_management')}</span>
                </CardTitle>
                <CardDescription>
                  {t('configure_penalty_fees')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Parking Without Charging Penalty */}
                  <Card className="bg-muted/30">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                          <Car className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {t('parking_without_charging')}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {t('fee_per_hour_parking')}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Input
                          type="number"
                          value={parkingPenalty}
                          onChange={(e) => setParkingPenalty(e.target.value)}
                          className="bg-input-background border-border/60"
                          placeholder="VND per hour"
                        />
                        <p className="text-sm text-muted-foreground">
                          {t('current')}: {formatCurrency(parseInt(parkingPenalty || "0"))}/{t('hour')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Late Arrival Penalty */}
                  <Card className="bg-muted/30">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                          <Timer className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {t('late_arrival_penalty')}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {t('fee_per_15_minutes_late')}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Input
                          type="number"
                          value={latePenalty}
                          onChange={(e) => setLatePenalty(e.target.value)}
                          className="bg-input-background border-border/60"
                          placeholder="VND per 15 minutes"
                        />
                        <p className="text-sm text-muted-foreground">
                          {t('current')}: {formatCurrency(parseInt(latePenalty || "0"))}/15{t('min')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-col space-y-4">
                  <div className="flex justify-center">
                    <Button onClick={handlePenaltyUpdate} className="w-full max-w-md">
                      <Save className="w-4 h-4 mr-2" />
                      {t('update_penalty_fees')}
                    </Button>
                  </div>

                  {/* Add New Penalty Rule Section */}
                  <div className="bg-muted/20 rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">
                          {t('penalty_rules_list')}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {t('manage_existing_rules')}
                        </p>
                      </div>
                      <Dialog open={isAddingPenaltyRule} onOpenChange={setIsAddingPenaltyRule}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            {t('add_new_penalty_rule')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card/80 backdrop-blur-sm border-border/60 max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center space-x-2">
                              <AlertTriangle className="w-5 h-5 text-orange-500" />
                              <span>{t('new_penalty_rule')}</span>
                            </DialogTitle>
                            <DialogDescription>
                              {t('create_custom_penalty')}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            {/* Rule Name */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                {t('rule_name')}
                              </label>
                              <Input
                                value={newRuleName}
                                onChange={(e) => setNewRuleName(e.target.value)}
                                placeholder={t('enter_rule_name')}
                                className="bg-input-background border-border/60"
                              />
                            </div>

                            {/* Rule Category */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                {t('rule_category')}
                              </label>
                              <Select value={newRuleCategory} onValueChange={setNewRuleCategory}>
                                <SelectTrigger className="bg-input-background border-border/60">
                                  <SelectValue placeholder={t('select_category')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="parking">{t('parking_violations')}</SelectItem>
                                  <SelectItem value="charging">{t('charging_violations')}</SelectItem>
                                  <SelectItem value="time">{t('time_violations')}</SelectItem>
                                  <SelectItem value="equipment">{t('equipment_misuse')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Penalty Amount */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                {t('penalty_amount')}
                              </label>
                              <Input
                                type="number"
                                value={newRuleAmount}
                                onChange={(e) => setNewRuleAmount(e.target.value)}
                                placeholder={t('enter_penalty_amount')}
                                className="bg-input-background border-border/60"
                              />
                            </div>

                            {/* Penalty Unit */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                {t('penalty_unit')}
                              </label>
                              <Select value={newRuleUnit} onValueChange={setNewRuleUnit}>
                                <SelectTrigger className="bg-input-background border-border/60">
                                  <SelectValue placeholder={t('penalty_unit')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="fixed">{t('fixed_amount')}</SelectItem>
                                  <SelectItem value="per_hour">{t('per_hour')}</SelectItem>
                                  <SelectItem value="per_15_min">{t('per_15_minutes')}</SelectItem>
                                  <SelectItem value="per_violation">{t('per_violation')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Rule Status */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                {t('rule_status')}
                              </label>
                              <Select value={newRuleStatus} onValueChange={setNewRuleStatus}>
                                <SelectTrigger className="bg-input-background border-border/60">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">{t('active')}</SelectItem>
                                  <SelectItem value="pending">{t('pending')}</SelectItem>
                                  <SelectItem value="draft">{t('draft')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Effective Date */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                {t('effective_date')}
                              </label>
                              <Input
                                type="date"
                                className="bg-input-background border-border/60"
                              />
                            </div>
                          </div>

                          {/* Violation Description */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              {t('violation_description')}
                            </label>
                            <textarea
                              value={newRuleDescription}
                              onChange={(e) => setNewRuleDescription(e.target.value)}
                              placeholder={t('describe_violation')}
                              className="w-full h-20 px-3 py-2 bg-input-background border border-border/60 rounded-lg text-sm resize-none"
                            />
                          </div>

                          {/* Additional Notes */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              {t('additional_notes')} ({t('optional')})
                            </label>
                            <textarea
                              value={newRuleNotes}
                              onChange={(e) => setNewRuleNotes(e.target.value)}
                              placeholder={t('optional_notes')}
                              className="w-full h-16 px-3 py-2 bg-input-background border border-border/60 rounded-lg text-sm resize-none"
                            />
                          </div>

                          <div className="flex justify-end space-x-3">
                            <Button variant="outline" onClick={() => setIsAddingPenaltyRule(false)}>
                              {t('cancel')}
                            </Button>
                            <Button 
                              onClick={handleCreatePenaltyRule}
                              disabled={!newRuleName || !newRuleCategory || !newRuleAmount || !newRuleUnit}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              {t('create_rule')}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
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
                {/* Current Subscription Plans */}
                <div className="space-y-4">
                  <h4 className="font-medium">
                    {t('current_subscription_plans')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {subscriptionPlans.map((plan) => (
                      <Card key={plan.id} className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="text-center space-y-3">
                            <h5 className="font-medium">
                              {language === 'en' ? plan.name : plan.nameVi}
                            </h5>
                            <div className="space-y-1">
                              <p className="font-semibold text-primary">
                                {formatCurrency(plan.price)}/{t('month')}
                              </p>
                              <Badge variant="secondary">
                                {plan.discount}% {t('discount')}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
                        {subscriptionPlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            <div>
                              <p className="font-medium">
                                {language === 'en' ? plan.name : plan.nameVi}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(plan.price)} - {plan.discount}% {t('discount')}
                              </p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder={t('new_price_vnd')}
                      value={newPlanPrice}
                      onChange={(e) => setNewPlanPrice(e.target.value)}
                      className="bg-input-background border-border/60"
                    />
                    <Input
                      type="number"
                      placeholder={t('discount_percent')}
                      value={newPlanDiscount}
                      onChange={(e) => setNewPlanDiscount(e.target.value)}
                      className="bg-input-background border-border/60"
                    />
                    <Button onClick={handleSubscriptionUpdate} disabled={!selectedPlan || !newPlanPrice || !newPlanDiscount}>
                      <Save className="w-4 h-4 mr-2" />
                      {t('update_plan')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}