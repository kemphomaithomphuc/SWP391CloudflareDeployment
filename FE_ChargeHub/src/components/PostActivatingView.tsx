import { useState } from "react";
import { ArrowLeft, Search, Filter, Zap, Users, MapPin, Settings, CheckCircle, XCircle, Clock, RefreshCw, Edit3, UserCheck, Activity, AlertTriangle, Power, Wrench } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { toast } from "sonner@2.0.3";
import { Progress } from "./ui/progress";

interface PostActivatingViewProps {
  onBack: () => void;
}

interface ChargingStation {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'inactive' | 'maintenance' | 'occupied';
  type: 'DC_FAST' | 'AC_SLOW' | 'AC_FAST';
  power: number;
  currentUser?: {
    id: string;
    name: string;
    phone: string;
    startTime: string;
    targetBattery: number;
    currentBattery: number;
  };
  price: number;
  coordinates: [number, number];
  lastMaintenance: string;
  totalSessions: number;
  revenue: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  vehiclePlate: string;
  currentStation?: string;
  sessionStartTime?: string;
  targetBattery?: number;
  currentBattery?: number;
}

export default function PostActivatingView({ onBack }: PostActivatingViewProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState("stations");

  // Mock data for charging stations
  const [stations, setStations] = useState<ChargingStation[]>([
    {
      id: "CS001",
      name: "ChargeHub Nguyễn Huệ",
      location: "123 Nguyễn Huệ, Q.1, TP.HCM",
      status: "active",
      type: "DC_FAST",
      power: 150,
      price: 5500,
      coordinates: [10.774, 106.703],
      lastMaintenance: "2024-12-15",
      totalSessions: 1247,
      revenue: 45680000
    },
    {
      id: "CS002", 
      name: "ChargeHub Landmark 81",
      location: "Landmark 81, Bình Thạnh, TP.HCM",
      status: "occupied",
      type: "DC_FAST",
      power: 180,
      currentUser: {
        id: "U001",
        name: "Nguyễn Văn A",
        phone: "0901234567",
        startTime: "14:30",
        targetBattery: 80,
        currentBattery: 45
      },
      price: 6000,
      coordinates: [10.795, 106.722],
      lastMaintenance: "2024-12-10", 
      totalSessions: 892,
      revenue: 32450000
    },
    {
      id: "CS003",
      name: "ChargeHub Crescent Mall",
      location: "Crescent Mall, Q.7, TP.HCM",
      status: "maintenance",
      type: "AC_FAST",
      power: 22,
      price: 3500,
      coordinates: [10.741, 106.710],
      lastMaintenance: "2024-12-18",
      totalSessions: 654,
      revenue: 18900000
    },
    {
      id: "CS004",
      name: "ChargeHub Aeon Tân Phú",
      location: "Aeon Mall Tân Phú, TP.HCM",
      status: "inactive",
      type: "AC_SLOW",
      power: 7,
      price: 2800,
      coordinates: [10.795, 106.622],
      lastMaintenance: "2024-12-05",
      totalSessions: 445,
      revenue: 12340000
    }
  ]);

  // Mock data for customers with active sessions
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: "U001",
      name: "Nguyễn Văn A",
      phone: "0901234567",
      vehiclePlate: "51A-12345",
      currentStation: "CS002",
      sessionStartTime: "14:30",
      targetBattery: 80,
      currentBattery: 45
    },
    {
      id: "U002", 
      name: "Trần Thị B",
      phone: "0902345678",
      vehiclePlate: "51B-67890",
      currentStation: "CS001",
      sessionStartTime: "13:15",
      targetBattery: 90,
      currentBattery: 65
    }
  ]);

  const text = {
    en: {
      title: "Station Activation Management",
      subtitle: "Manage charging station activation and customer sessions",
      search: "Search stations or customers...",
      filter: "Filter by status",
      all: "All",
      active: "Active",
      inactive: "Inactive", 
      maintenance: "Maintenance",
      occupied: "Occupied",
      stations: "Charging Stations",
      customers: "Active Sessions",
      stationName: "Station Name",
      location: "Location",
      status: "Status",
      type: "Type",
      power: "Power",
      price: "Price",
      currentUser: "Current User",
      actions: "Actions",
      activate: "Activate",
      deactivate: "Deactivate",
      editStation: "Edit Station",
      forceStop: "Force Stop",
      transferStation: "Transfer Station",
      viewDetails: "View Details",
      customerName: "Customer Name",
      phone: "Phone",
      vehiclePlate: "Vehicle Plate",
      currentStation: "Current Station",
      sessionTime: "Session Time",
      batteryLevel: "Battery Level",
      targetLevel: "Target Level",
      activateForCustomer: "Activate for Customer",
      selectCustomer: "Select Customer",
      selectStation: "Select Station",
      reason: "Reason",
      activate_success: "Station activated successfully",
      deactivate_success: "Station deactivated successfully", 
      transfer_success: "Customer transferred successfully",
      force_stop_success: "Session stopped successfully",
      confirm_activate: "Confirm Activation",
      confirm_activate_desc: "Are you sure you want to activate this station for the customer?",
      confirm_deactivate: "Confirm Deactivation", 
      confirm_deactivate_desc: "Are you sure you want to deactivate this station?",
      confirm_transfer: "Confirm Transfer",
      confirm_transfer_desc: "Are you sure you want to transfer this customer to a different station?",
      confirm_force_stop: "Confirm Force Stop",
      confirm_force_stop_desc: "Are you sure you want to force stop this charging session?",
      cancel: "Cancel",
      confirm: "Confirm",
      dcFast: "DC Fast",
      acFast: "AC Fast", 
      acSlow: "AC Slow",
      kw: "kW",
      vnd_kwh: "VND/kWh",
      since: "Since",
      target: "Target",
      current: "Current",
      sessions: "sessions",
      revenue: "revenue",
      back: "Back",
      quickStats: "Quick Overview",
      activeStations: "Active Stations",
      occupiedStations: "Occupied Stations", 
      maintenanceStations: "Under Maintenance",
      inactiveStations: "Inactive Stations",
      totalRevenue: "Total Revenue",
      chargingProgress: "Charging Progress"
    },
    vi: {
      title: "Quản Lý Kích Hoạt Trạm",
      subtitle: "Quản lý việc kích hoạt trạm sạc và phiên sạc của khách hàng", 
      search: "Tìm kiếm trạm hoặc khách hàng...",
      filter: "Lọc theo trạng thái",
      all: "Tất cả",
      active: "Hoạt động",
      inactive: "Không hoạt động",
      maintenance: "Bảo trì", 
      occupied: "Đang sử dụng",
      stations: "Trạm Sạc",
      customers: "Phiên Đang Hoạt Động",
      stationName: "Tên Trạm",
      location: "Vị Trí",
      status: "Trạng Thái",
      type: "Loại",
      power: "Công Suất",
      price: "Giá",
      currentUser: "Người Dùng",
      actions: "Thao Tác",
      activate: "Kích Hoạt",
      deactivate: "Tắt",
      editStation: "Sửa Trạm",
      forceStop: "Dừng Bắt Buộc",
      transferStation: "Chuyển Trạm",
      viewDetails: "Xem Chi Tiết",
      customerName: "Tên Khách Hàng",
      phone: "Điện Thoại",
      vehiclePlate: "Biển Số",
      currentStation: "Trạm Hiện Tại", 
      sessionTime: "Thời Gian Sạc",
      batteryLevel: "Mức Pin",
      targetLevel: "Mục Tiêu",
      activateForCustomer: "Kích Hoạt Cho Khách",
      selectCustomer: "Chọn Khách Hàng",
      selectStation: "Chọn Trạm",
      reason: "Lý Do",
      activate_success: "Kích hoạt trạm thành công",
      deactivate_success: "Tắt trạm thành công",
      transfer_success: "Chuyển khách thành công", 
      force_stop_success: "Dừng phiên sạc thành công",
      confirm_activate: "Xác Nhận Kích Hoạt",
      confirm_activate_desc: "Bạn có chắc chắn muốn kích hoạt trạm này cho khách hàng?",
      confirm_deactivate: "Xác Nhận Tắt Trạm",
      confirm_deactivate_desc: "Bạn có chắc chắn muốn tắt trạm này?",
      confirm_transfer: "Xác Nhận Chuyển Trạm",
      confirm_transfer_desc: "Bạn có chắc chắn muốn chuyển khách hàng này sang trạm khác?",
      confirm_force_stop: "Xác Nhận Dừng Bắt Buộc",
      confirm_force_stop_desc: "Bạn có chắc chắn muốn dừng bắt buộc phiên sạc này?",
      cancel: "Hủy",
      confirm: "Xác Nhận",
      dcFast: "DC Nhanh",
      acFast: "AC Nhanh",
      acSlow: "AC Chậm", 
      kw: "kW",
      vnd_kwh: "VND/kWh",
      since: "Từ lúc",
      target: "Mục tiêu",
      current: "Hiện tại",
      sessions: "phiên",
      revenue: "doanh thu",
      back: "Quay lại",
      quickStats: "Tổng Quan Nhanh",
      activeStations: "Trạm Hoạt Động",
      occupiedStations: "Trạm Đang Dùng",
      maintenanceStations: "Đang Bảo Trì", 
      inactiveStations: "Trạm Không Hoạt Động",
      totalRevenue: "Tổng Doanh Thu",
      chargingProgress: "Tiến Độ Sạc"
    }
  };

  const t = text[language];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'occupied':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';  
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'inactive':
        return <XCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case 'occupied':
        return <Power className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'DC_FAST':
        return t.dcFast;
      case 'AC_FAST':
        return t.acFast;
      case 'AC_SLOW':
        return t.acSlow;
      default:
        return type;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const filteredStations = stations.filter(station => {
    const matchesSearch = station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || station.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleActivateStation = (station: ChargingStation) => {
    setStations(prev => prev.map(s => 
      s.id === station.id ? { ...s, status: 'active' as const } : s
    ));
    toast.success(t.activate_success);
  };

  const handleDeactivateStation = (station: ChargingStation) => {
    setStations(prev => prev.map(s => 
      s.id === station.id ? { ...s, status: 'inactive' as const } : s
    ));
    toast.success(t.deactivate_success);
  };

  const handleTransferCustomer = (customer: Customer, newStationId: string) => {
    setCustomers(prev => prev.map(c =>
      c.id === customer.id ? { ...c, currentStation: newStationId } : c
    ));
    toast.success(t.transfer_success);
  };

  const handleForceStop = (customer: Customer) => {
    setCustomers(prev => prev.filter(c => c.id !== customer.id));
    setStations(prev => prev.map(s =>
      s.id === customer.currentStation ? { ...s, status: 'active' as const, currentUser: undefined } : s
    ));
    toast.success(t.force_stop_success);
  };

  // Calculate stats
  const stats = {
    active: stations.filter(s => s.status === 'active').length,
    occupied: stations.filter(s => s.status === 'occupied').length,
    maintenance: stations.filter(s => s.status === 'maintenance').length,
    inactive: stations.filter(s => s.status === 'inactive').length,
    totalRevenue: stations.reduce((sum, s) => sum + s.revenue, 0)
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Header */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-primary hover:text-primary/80 hover:bg-primary/10 -ml-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.back}
            </Button>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-foreground font-semibold">{t.title}</h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <div>
            <h2 className="text-foreground font-semibold mb-4">{t.quickStats}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <Card className="border-border bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wide">{t.activeStations}</p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.active}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">{t.occupiedStations}</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.occupied}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Power className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-orange-700 dark:text-orange-300 uppercase tracking-wide">{t.maintenanceStations}</p>
                    <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{stats.maintenance}</p>
                  </div>
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">{t.inactiveStations}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.inactive}</p>
                  </div>
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wide">{t.totalRevenue}</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{formatCurrency(stats.totalRevenue).slice(0, -1)}M</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-input-background border-border h-10"
                />
              </div>
              <div className="flex items-center gap-3 sm:w-auto">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48 bg-input-background h-10">
                    <SelectValue placeholder={t.filter} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all}</SelectItem>
                    <SelectItem value="active">{t.active}</SelectItem>
                    <SelectItem value="inactive">{t.inactive}</SelectItem>
                    <SelectItem value="maintenance">{t.maintenance}</SelectItem>
                    <SelectItem value="occupied">{t.occupied}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <div className="border-b border-border pb-4">
                <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/50">
                  <TabsTrigger value="stations" className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    {t.stations}
                  </TabsTrigger>
                  <TabsTrigger value="customers" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {t.customers}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Stations Tab */}
              <TabsContent value="stations" className="space-y-4 mt-6">
                <div className="space-y-4">
                  {filteredStations.map((station) => (
                    <Card key={station.id} className="border-border hover:shadow-md transition-all duration-200 bg-gradient-to-r from-card to-card/50">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-6">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-4 mb-5">
                              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                                <Zap className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-card-foreground mb-2 truncate">{station.name}</h3>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(station.status)}
                                  <Badge className={getStatusColor(station.status)}>
                                    {t[station.status as keyof typeof t] || station.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-3 mb-5">
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                                <span className="text-muted-foreground text-sm leading-relaxed">{station.location}</span>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="flex items-center gap-2">
                                  <Settings className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-muted-foreground text-sm">{t.type}:</span>
                                  <span className="font-medium text-card-foreground text-sm">{getTypeText(station.type)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Zap className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-muted-foreground text-sm">{t.power}:</span>
                                  <span className="font-medium text-card-foreground text-sm">{station.power} {t.kw}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground text-sm">{t.price}:</span>
                                  <span className="font-medium text-card-foreground text-sm">{formatCurrency(station.price)}/{t.kw}h</span>
                                </div>
                              </div>
                            </div>

                            {station.currentUser && (
                              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center gap-2 mb-4">
                                  <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  <span className="font-medium text-blue-800 dark:text-blue-200">{t.currentUser}</span>
                                </div>
                                <div className="space-y-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                                    <div>
                                      <span className="text-blue-700 dark:text-blue-300 font-medium">{station.currentUser.name}</span>
                                    </div>
                                    <div>
                                      <span className="text-blue-600 dark:text-blue-400">{station.currentUser.phone}</span>
                                    </div>
                                    <div>
                                      <span className="text-blue-600 dark:text-blue-400">{t.since}: {station.currentUser.startTime}</span>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-blue-600 dark:text-blue-400">{t.chargingProgress}</span>
                                      <span className="text-blue-700 dark:text-blue-300 font-medium">
                                        {station.currentUser.currentBattery}%/{station.currentUser.targetBattery}%
                                      </span>
                                    </div>
                                    <Progress 
                                      value={(station.currentUser.currentBattery / station.currentUser.targetBattery) * 100} 
                                      className="h-2"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-3 flex-shrink-0">
                          {station.status === 'inactive' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  {t.activate}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t.confirm_activate}</AlertDialogTitle>
                                  <AlertDialogDescription>{t.confirm_activate_desc}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleActivateStation(station)}>
                                    {t.confirm}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          {station.status === 'active' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive" className="shadow-sm">
                                  <XCircle className="w-4 h-4 mr-2" />
                                  {t.deactivate}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t.confirm_deactivate}</AlertDialogTitle>
                                  <AlertDialogDescription>{t.confirm_deactivate_desc}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeactivateStation(station)}>
                                    {t.confirm}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          <Button size="sm" variant="outline" className="shadow-sm">
                            <Settings className="w-4 h-4 mr-2" />
                            {t.editStation}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Customers Tab */}
            <TabsContent value="customers" className="space-y-4 mt-6">
              <div className="space-y-4">
                {filteredCustomers.map((customer) => {
                  const currentStation = stations.find(s => s.id === customer.currentStation);
                  return (
                    <Card key={customer.id} className="border-border hover:shadow-md transition-all duration-200 bg-gradient-to-r from-card to-card/50">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-6">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-4 mb-5">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                                <UserCheck className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-card-foreground mb-2 truncate">{customer.name}</h3>
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                  {t.active}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="space-y-3 mb-5">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">{t.phone}:</span>
                                  <span className="font-medium text-card-foreground">{customer.phone}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">{t.vehiclePlate}:</span>
                                  <span className="font-medium text-card-foreground">{customer.vehiclePlate}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">{t.sessionTime}:</span>
                                  <span className="font-medium text-card-foreground">{customer.sessionStartTime}</span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">{t.chargingProgress}</span>
                                  <span className="font-medium text-card-foreground">
                                    {customer.currentBattery}%/{customer.targetBattery}%
                                  </span>
                                </div>
                                <Progress 
                                  value={customer.currentBattery ? (customer.currentBattery / (customer.targetBattery || 100)) * 100 : 0} 
                                  className="h-2"
                                />
                              </div>
                            </div>

                            {currentStation && (
                              <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center gap-2 mb-3">
                                  <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  <span className="font-medium text-card-foreground">{t.currentStation}</span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-muted-foreground">
                                    {currentStation.name} - {currentStation.location}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-3 flex-shrink-0">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  {t.transferStation}
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{t.transferStation}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>{t.selectStation}</Label>
                                    <Select>
                                      <SelectTrigger>
                                        <SelectValue placeholder={t.selectStation} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {stations.filter(s => s.status === 'active' && s.id !== customer.currentStation).map(station => (
                                          <SelectItem key={station.id} value={station.id}>
                                            {station.name} - {getTypeText(station.type)}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>{t.reason}</Label>
                                    <Textarea placeholder={language === 'en' ? 'Enter reason for transfer...' : 'Nhập lý do chuyển trạm...'} />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline">{t.cancel}</Button>
                                    <Button onClick={() => handleTransferCustomer(customer, 'CS001')}>
                                      {t.confirm}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive" className="shadow-sm">
                                  <XCircle className="w-4 h-4 mr-2" />
                                  {t.forceStop}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t.confirm_force_stop}</AlertDialogTitle>
                                  <AlertDialogDescription>{t.confirm_force_stop_desc}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleForceStop(customer)}>
                                    {t.confirm}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}