import { useState } from "react";
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

interface ChargingStation {
  id: string;
  name: string;
  address: string;
  status: "online" | "offline" | "maintenance" | "error";
  totalPoints: number;
  availablePoints: number;
  connectorTypes: {
    type: string;
    available: number;
    total: number;
    power: string;
    maxPower: number;
    currentPower: number;
  }[];
  activeSessions: number;
  lastActivity: string;
  uptime: number;
  temperature: number;
  energyConsumed: number;
}

interface AdminChargerPostActivatingViewProps {
  onBack: () => void;
}

export default function AdminChargerPostActivatingView({ onBack }: AdminChargerPostActivatingViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [isControlDialogOpen, setIsControlDialogOpen] = useState(false);
  const [controlAction, setControlAction] = useState<'activate' | 'deactivate' | null>(null);

  const [stations, setStations] = useState<ChargingStation[]>([
    {
      id: "ST001",
      name: "ChargeHub Premium - Q1",
      address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
      status: "online",
      totalPoints: 8,
      availablePoints: 3,
      connectorTypes: [
        { type: "Type 2 AC", available: 2, total: 4, power: "22kW", maxPower: 22, currentPower: 18.5 },
        { type: "CCS DC", available: 1, total: 2, power: "50kW", maxPower: 50, currentPower: 47.2 },
        { type: "CHAdeMO", available: 0, total: 2, power: "50kW", maxPower: 50, currentPower: 0 }
      ],
      activeSessions: 5,
      lastActivity: "2024-01-20 14:30:25",
      uptime: 99.2,
      temperature: 35,
      energyConsumed: 1450.5
    },
    {
      id: "ST002", 
      name: "ChargeHub Express - Q3",
      address: "456 Võ Văn Tần, Quận 3, TP.HCM",
      status: "maintenance",
      totalPoints: 6,
      availablePoints: 0,
      connectorTypes: [
        { type: "Type 2 AC", available: 0, total: 3, power: "22kW", maxPower: 22, currentPower: 0 },
        { type: "CCS DC", available: 0, total: 3, power: "75kW", maxPower: 75, currentPower: 0 }
      ],
      activeSessions: 0,
      lastActivity: "2024-01-20 10:15:00",
      uptime: 87.5,
      temperature: 28,
      energyConsumed: 980.2
    },
    {
      id: "ST003",
      name: "ChargeHub EcoStation - Q7", 
      address: "789 Nguyễn Thị Thập, Quận 7, TP.HCM",
      status: "online",
      totalPoints: 12,
      availablePoints: 8,
      connectorTypes: [
        { type: "Type 2 AC", available: 4, total: 6, power: "22kW", maxPower: 22, currentPower: 15.3 },
        { type: "CCS DC", available: 3, total: 4, power: "100kW", maxPower: 100, currentPower: 89.7 },
        { type: "CHAdeMO", available: 1, total: 2, power: "100kW", maxPower: 100, currentPower: 95.1 }
      ],
      activeSessions: 4,
      lastActivity: "2024-01-20 14:35:10",
      uptime: 96.8,
      temperature: 42,
      energyConsumed: 2150.8
    },
    {
      id: "ST004",
      name: "ChargeHub FastCharge - Q5",
      address: "321 Trần Hưng Đạo, Quận 5, TP.HCM", 
      status: "error",
      totalPoints: 4,
      availablePoints: 1,
      connectorTypes: [
        { type: "CCS DC", available: 1, total: 2, power: "150kW", maxPower: 150, currentPower: 142.3 },
        { type: "CHAdeMO", available: 0, total: 2, power: "150kW", maxPower: 150, currentPower: 0 }
      ],
      activeSessions: 1,
      lastActivity: "2024-01-20 13:45:32",
      uptime: 78.3,
      temperature: 58,
      energyConsumed: 890.1
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "offline": return <XCircle className="w-4 h-4 text-gray-500" />;
      case "maintenance": return <Settings className="w-4 h-4 text-yellow-500" />;
      case "error": return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      online: { label: "Hoạt động", class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200" },
      offline: { label: "Ngoại tuyến", class: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200" },
      maintenance: { label: "Bảo trì", class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200" },
      error: { label: "Lỗi", class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200" }
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

  const executeChargerAction = () => {
    if (!selectedStation || !controlAction) return;

    const station = selectedStation;
    let newStatus: "online" | "offline" | "maintenance" | "error" = station.status;
    let toastMessage = "";

    switch (controlAction) {
      case 'activate':
        newStatus = 'online';
        toastMessage = `Đã kích hoạt thành công ${station.name}`;
        break;
      case 'deactivate':
        newStatus = 'offline';
        toastMessage = `Đã vô hiệu hóa ${station.name}`;
        break;
    }

    setStations(prev => prev.map(s => 
      s.id === station.id 
        ? { ...s, status: newStatus, lastActivity: new Date().toLocaleString('sv-SE') } 
        : s
    ));


    toast.success(toastMessage);
    setIsControlDialogOpen(false);
    setControlAction(null);
    setSelectedStation(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </Button>
            <div>
              <h1 className="text-3xl font-semibold bg-gradient-to-r from-primary to-secondary-foreground bg-clip-text text-transparent">
                Charger Post Activating
              </h1>
              <p className="text-muted-foreground mt-2">
                Quản lý trạng thái và điều khiển từ xa các trạm sạc
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className="w-8 h-8 text-primary" />
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6 bg-card/80 backdrop-blur-xl border border-border/50">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm trạm sạc..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Lọc theo trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="online">Hoạt động</SelectItem>
                    <SelectItem value="offline">Ngoại tuyến</SelectItem>
                    <SelectItem value="maintenance">Bảo trì</SelectItem>
                    <SelectItem value="error">Lỗi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredStations.map((station) => (
            <Card key={station.id} className="bg-card/80 backdrop-blur-xl border border-border/50 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(station.status)}
                    <CardTitle className="text-lg">{station.name}</CardTitle>
                  </div>
                  {getStatusBadge(station.status)}
                </div>
                <p className="text-sm text-muted-foreground">{station.address}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-muted/30 rounded-lg p-2">
                    <div className="text-xs text-muted-foreground">Khả dụng</div>
                    <div className="font-semibold text-green-600">{station.availablePoints}/{station.totalPoints}</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-2">
                    <div className="text-xs text-muted-foreground">Phiên sạc</div>
                    <div className="font-semibold text-blue-600">{station.activeSessions}</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-2">
                    <div className="text-xs text-muted-foreground">Uptime</div>
                    <div className="font-semibold text-purple-600">{station.uptime}%</div>
                  </div>
                </div>

                <Separator />

                {/* Power Information */}
                <div>
                  <h5 className="font-medium mb-2 flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                    Công suất hiện tại:
                  </h5>
                  <div className="space-y-2">
                    {station.connectorTypes.map((connector, idx) => (
                      <div key={idx} className="bg-muted/20 rounded-lg p-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{connector.type}</span>
                          <Badge variant="outline" className="text-xs">
                            {connector.power}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Công suất sử dụng:</span>
                            <span className="font-medium">{connector.currentPower}kW / {connector.maxPower}kW</span>
                          </div>
                          <Progress 
                            value={(connector.currentPower / connector.maxPower) * 100} 
                            className="h-1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* System Info */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Nhiệt độ:</span>
                    <span className={`ml-2 font-medium ${station.temperature > 50 ? 'text-red-600' : station.temperature > 40 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {station.temperature}°C
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Năng lượng:</span>
                    <span className="ml-2 font-medium">{station.energyConsumed}kWh</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Hoạt động cuối: {station.lastActivity}
                </div>

                <Separator />

                {/* Control Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    size="sm"
                    variant={station.status === 'online' ? 'outline' : 'default'}
                    onClick={() => handleChargerAction('activate', station.id)}
                    disabled={station.status === 'online'}
                    className="flex items-center space-x-1"
                  >
                    <Power className="w-3 h-3" />
                    <span className="text-xs">Kích hoạt</span>
                  </Button>

                  <Button 
                    size="sm"
                    variant={station.status === 'offline' ? 'outline' : 'secondary'}
                    onClick={() => handleChargerAction('deactivate', station.id)}
                    disabled={station.status === 'offline'}
                    className="flex items-center space-x-1"
                  >
                    <XCircle className="w-3 h-3" />
                    <span className="text-xs">Vô hiệu hóa</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Control Confirmation Dialog */}
        <Dialog open={isControlDialogOpen} onOpenChange={setIsControlDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Xác nhận thao tác
              </DialogTitle>
              <DialogDescription>
                {controlAction === 'activate' && "Bạn có chắc chắn muốn kích hoạt trạm sạc này?"}
                {controlAction === 'deactivate' && "Bạn có chắc chắn muốn vô hiệu hóa trạm sạc này? Tất cả phiên sạc hiện tại sẽ bị dừng."}
              </DialogDescription>
            </DialogHeader>
            
            {selectedStation && (
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-medium">{selectedStation.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedStation.address}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span>Trạng thái hiện tại:</span>
                    {getStatusBadge(selectedStation.status)}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span>Phiên sạc hoạt động:</span>
                    <span className="font-medium">{selectedStation.activeSessions}</span>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsControlDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button onClick={executeChargerAction}>
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