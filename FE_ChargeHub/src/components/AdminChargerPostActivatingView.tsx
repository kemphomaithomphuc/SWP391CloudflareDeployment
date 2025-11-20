import { useState, useEffect } from "react";
import axios from "axios";
import { apiBaseUrl } from "../services/api";
import { ArrowLeft, Search, Filter, Zap, Power, XCircle, CheckCircle, Settings, AlertTriangle, Activity, Clock, Users, Gauge } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { Progress } from "./ui/progress";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";

interface ChargingStation {
  id: string;
  name: string;
  address: string;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  totalPoints: number;
  availablePoints: number;
  connectorTypes: {
    type: string;
    chargingPointName: string;
    status: string;
    available: number;
    total: number;
    power: string;
    maxPower: number;
    currentPower: number;
  }[];
  activeSessions: number;
  lastActivity: string;
  uptime: number;
  orderCount: number;
  chargingPointNumber: number;
  // API fields
  stationId?: string;
  stationName?: string;
}

interface AdminChargerPostActivatingViewProps {
  onBack: () => void;
}

export default function AdminChargerPostActivatingView({ onBack }: AdminChargerPostActivatingViewProps) {
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [isControlDialogOpen, setIsControlDialogOpen] = useState(false);
  const [controlAction, setControlAction] = useState<'activate' | 'deactivate' | null>(null);

  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectorDialogStation, setConnectorDialogStation] = useState<ChargingStation | null>(null);

  // API functions
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchStations = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("📥 Fetching stations from API...");
      const response = await axios.get(`${apiBaseUrl}/api/charging-stations`, {
        headers: getAuthHeaders()
      });

      console.log("✅ Stations API response:", response.data);

      // Transform API response to UI format
      const transformedStations: ChargingStation[] = response.data.map((station: any) => {
        const chargingPoints: any[] = Array.isArray(station.chargingPoints) ? station.chargingPoints : [];
        const totalPoints = station.chargingPointNumber ?? station.totalPoints ?? chargingPoints.length ?? 0;
        const availablePoints = chargingPoints.filter(point => point.status === "AVAILABLE").length;

        return {
          id: station.stationId || station.id,
          name: station.stationName || station.name,
          address: station.address,
          status: station.status,
          stationId: station.stationId,
          stationName: station.stationName,
          totalPoints,
          availablePoints,
          chargingPointNumber: totalPoints,
          connectorTypes: chargingPoints.map((point: any) => {
          const connectorType = point.connectorType || {};
          const powerOutput = connectorType.powerOutput || point.powerOutput || 0;

          return {
            type: connectorType.typeName || point.typeName || "Unknown",
            chargingPointName: point.chargingPointName || point.chargingPointId?.toString() || "Trụ sạc",
            status: point.status || "UNKNOWN",
            available: 1, // Simplified
            total: 1,
            power: `${powerOutput}kW`,
            maxPower: powerOutput,
            currentPower: powerOutput // Simplified, in real app this would be dynamic
          };
        }),
          activeSessions: 0, // Placeholder for future data
          uptime: station.uptime || 0,
          orderCount: station.orderCount || 0
        };
      });

      setStations(transformedStations);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Không thể tải danh sách trạm sạc";
      setError(errorMsg);
      console.error("❌ Error fetching stations:", err);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateStationStatus = async (stationId: string, status: "ACTIVE" | "INACTIVE") => {
    try {
      console.log(`🔄 Updating station ${stationId} status to ${status}...`);
      const response = await axios.patch(
        `${apiBaseUrl}/api/charging-stations/${stationId}/status`,
        status,
        {
          headers: getAuthHeaders()
        }
      );

      console.log("✅ Station status update response:", response.data);

      // Update local state
      setStations(prev => prev.map(station =>
        station.id === stationId
          ? { ...station, status }
          : station
      ));

      toast.success(`Trạm sạc đã được ${status === 'ACTIVE' ? 'kích hoạt' : 'vô hiệu hóa'}`);
      return true;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Không thể cập nhật trạng thái trạm sạc";
      console.error("❌ Error updating station status:", err);
      toast.error(errorMsg);
      return false;
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const getConnectorStatusInfo = (status: string) => {
    const normalized = (status || "").toUpperCase();
    switch (normalized) {
      case "AVAILABLE":
        return { label: "Sẵn sàng", className: "text-green-400" };
      case "OCCUPIED":
        return { label: "Đang sử dụng", className: "text-blue-400" };
      case "RESERVED":
        return { label: "Đã đặt trước", className: "text-orange-400" };
      case "OUT_OF_SERVICE":
        return { label: "Ngoài dịch vụ", className: "text-red-400" };
      case "MAINTENANCE":
        return { label: "Đang bảo trì", className: "text-yellow-400" };
      default:
        return { label: "Không xác định", className: "text-gray-400" };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE": return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "INACTIVE": return <XCircle className="w-4 h-4 text-gray-400" />;
      case "MAINTENANCE": return <Settings className="w-4 h-4 text-yellow-400" />;
      default: return <XCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: "Hoạt động", class: "bg-green-900/30 text-green-400 border-green-800" },
      INACTIVE: { label: "Không hoạt động", class: "bg-gray-800 text-gray-400 border-gray-700" },
      MAINTENANCE: { label: "Bảo trì", class: "bg-yellow-900/30 text-yellow-400 border-yellow-800" }
    };

    return (
      <Badge variant="secondary" className={statusConfig[status as keyof typeof statusConfig]?.class}>
        {statusConfig[status as keyof typeof statusConfig]?.label}
      </Badge>
    );
  };

  const filteredStations = stations.filter(station => {
    const matchesSearch = station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         station.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || station.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleChargerAction = (action: 'activate' | 'deactivate', stationId: string) => {
    setControlAction(action);
    const station = stations.find(s => s.id === stationId);
    setSelectedStation(station || null);
    setIsControlDialogOpen(true);
  };

  const executeChargerAction = async () => {
    if (!selectedStation || !controlAction) return;

    const station = selectedStation;
    const newStatus: "ACTIVE" | "INACTIVE" = controlAction === 'activate' ? 'ACTIVE' : 'INACTIVE';

    const success = await updateStationStatus(station.id, newStatus);

    if (success) {
      setIsControlDialogOpen(false);
      setControlAction(null);
      setSelectedStation(null);
    }
  };

  const headerTitle = language === 'vi' ? 'Kích hoạt Trạm sạc' : 'Charger Post Activating';
  const headerSubtitle = language === 'vi'
    ? 'Quản lý trạng thái và điều khiển từ xa các trạm sạc'
    : 'Manage station status and remote controls';

  return (
    <div className="min-h-screen bg-black p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('back_to_dashboard')}</span>
            </Button>
            <div className="flex items-center space-x-3">
              <div className="relative group">
                <div className="w-10 h-10 bg-gray-800 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                  <Activity className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="font-semibold text-white">
                  {headerTitle}
                </h1>
                <p className="text-sm text-gray-400">
                  {headerSubtitle}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6 bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm trạm sạc..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Lọc theo trạng thái" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-800">
                    <SelectItem value="all" className="text-white hover:bg-gray-800">Tất cả</SelectItem>
                    <SelectItem value="ACTIVE" className="text-white hover:bg-gray-800">Hoạt động</SelectItem>
                    <SelectItem value="INACTIVE" className="text-white hover:bg-gray-800">Không hoạt động</SelectItem>
                    <SelectItem value="MAINTENANCE" className="text-white hover:bg-gray-800">Bảo trì</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="bg-red-950/20 border-red-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2 text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
              <span>Đang tải danh sách trạm sạc...</span>
            </div>
          </div>
        ) : (
          /* Stations Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredStations.map((station) => {
              const connectorList = station.connectorTypes || [];
              const displayedConnectors = connectorList.slice(0, 3);
              const hasMoreConnectors = connectorList.length > 3;

              return (
            <Card key={station.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(station.status)}
                    <CardTitle className="text-lg text-white">{station.name}</CardTitle>
                  </div>
                  {getStatusBadge(station.status)}
                </div>
                <p className="text-sm text-gray-400">{station.address}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-800 rounded-lg p-2 border border-gray-700">
                    <div className="text-xs text-gray-400">Tổng điểm</div>
                    <div className="font-semibold text-white">{station.chargingPointNumber}</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-2 border border-gray-700">
                    <div className="text-xs text-gray-400">Khả dụng</div>
                    <div className="font-semibold text-white">
                      {station.availablePoints}/{station.totalPoints}
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-2 border border-gray-700">
                    <div className="text-xs text-gray-400">Đơn hàng</div>
                    <div className="font-semibold text-white">{station.orderCount}</div>
                  </div>
                </div>
        {/* Power Information */}
                <div>
                  <h5 className="font-medium mb-2 flex items-center text-white">
                    <Zap className="w-4 h-4 mr-2 text-gray-400" />
                    Công suất hiện tại:
                  </h5>
                  <div className="space-y-2">
                    {displayedConnectors.map((connector, idx) => {
                      const statusInfo = getConnectorStatusInfo(connector.status);
                      return (
                      <div key={idx} className="bg-gray-800 rounded-lg p-2 border border-gray-700">
                        <div className="flex justify-between items-center mb-1">
                          <div>
                            <div className="text-sm font-medium text-white">{connector.chargingPointName}</div>
                            <div className="text-xs text-gray-400">{connector.type}</div>
                            <div className={`text-xs ${statusInfo.className}`}>{statusInfo.label}</div>
                          </div>
                          <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                            {connector.power}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Công suất sử dụng:</span>
                            <span className="font-medium text-white">{connector.currentPower}kW / {connector.maxPower}kW</span>
                          </div>
                          <Progress 
                            value={(connector.currentPower / connector.maxPower) * 100} 
                            className="h-1 bg-gray-700 [&>[data-slot=progress-indicator]]:bg-gray-500"
                          />
                        </div>
                      </div>
                    );
                    })}
                  </div>
                  {hasMoreConnectors && (
                    <div className="pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-0 text-xs text-gray-400 hover:text-white"
                        onClick={() => setConnectorDialogStation(station)}
                      >
                        {`Xem tất cả ${connectorList.length} trụ`}
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Control Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    size="sm"
                    variant={station.status === 'ACTIVE' ? 'outline' : 'default'}
                    onClick={() => handleChargerAction('activate', station.id)}
                    disabled={station.status === 'ACTIVE'}
                    className={`flex items-center space-x-1 ${station.status === 'ACTIVE' ? 'border-gray-600 text-gray-400' : 'bg-green-600 hover:bg-green-700 text-white border-0'}`}
                  >
                    <Power className="w-3 h-3" />
                    <span className="text-xs">Kích hoạt</span>
                  </Button>

                  <Button 
                    size="sm"
                    variant={station.status === 'INACTIVE' ? 'outline' : 'secondary'}
                    onClick={() => handleChargerAction('deactivate', station.id)}
                    disabled={station.status === 'INACTIVE'}
                    className={`flex items-center space-x-1 ${station.status === 'INACTIVE' ? 'border-gray-600 text-gray-400' : 'bg-red-600 hover:bg-red-700 text-white border-0'}`}
                  >
                    <XCircle className="w-3 h-3" />
                    <span className="text-xs">Vô hiệu hóa</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )})}
          </div>
        )}

        {/* Connector List Dialog */}
        <Dialog open={!!connectorDialogStation} onOpenChange={(open: boolean) => {
          if (!open) setConnectorDialogStation(null);
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-teal-500 dark:text-emerald-300" />
                Danh sách trụ sạc
              </DialogTitle>
              <DialogDescription>
                {connectorDialogStation?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {connectorDialogStation?.connectorTypes?.map((connector, idx) => {
                const statusInfo = getConnectorStatusInfo(connector.status);
                return (
                <Card key={`${connector.chargingPointName}-${idx}`} className="bg-blue-50/60 dark:bg-slate-800/60 border border-blue-100/60 dark:border-slate-700">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-100">{connector.chargingPointName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-300">{connector.type}</div>
                        <div className={`text-xs ${statusInfo.className}`}>{statusInfo.label}</div>
                      </div>
                      <Badge variant="outline" className="text-xs border-emerald-400/60 text-emerald-600 dark:border-emerald-400 dark:text-emerald-300">
                        {connector.power}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                      <span>Công suất sử dụng:</span>
                      <span className="font-medium">{connector.currentPower}kW / {connector.maxPower}kW</span>
                    </div>
                    <Progress value={(connector.currentPower / connector.maxPower) * 100} className="h-1 bg-blue-100/80 dark:bg-slate-800 [&>[data-slot=progress-indicator]]:bg-emerald-500 dark:[&>[data-slot=progress-indicator]]:bg-emerald-400" />
                  </CardContent>
                </Card>
              );
              })}
              {connectorDialogStation?.connectorTypes?.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  Không có trụ sạc nào.
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white" onClick={() => setConnectorDialogStation(null)}>
                Đóng
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Control Confirmation Dialog */}
        <Dialog open={isControlDialogOpen} onOpenChange={setIsControlDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white">
            <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Activity className="w-5 h-5 text-gray-400" />
            {controlAction === 'activate' ? 'Xác nhận kích hoạt' : 'Xác nhận vô hiệu hóa'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {controlAction === 'activate'
              ? "Bạn có chắc chắn muốn kích hoạt trạm sạc này?"
              : "Bạn có chắc chắn muốn vô hiệu hóa trạm sạc này? Tất cả phiên sạc hiện tại sẽ bị dừng."}
          </DialogDescription>
            </DialogHeader>
            
            {selectedStation && (
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h4 className="font-medium text-white">{selectedStation.name}</h4>
                  <p className="text-sm text-gray-400">{selectedStation.address}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-400">Trạng thái hiện tại</span>
                    {getStatusBadge(selectedStation.status)}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white" onClick={() => setIsControlDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button className={`${controlAction === 'activate' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white border-0`} onClick={executeChargerAction}>
                    Xác nhận
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}