import { useEffect, useState } from 'react';
import { ArrowLeft, Search, Users2, Mail, Calendar, MapPin, Eye, Edit, MinusCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { toast } from "sonner";
import { Toaster } from './ui/sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import AdminLanguageThemeControls from './AdminLanguageThemeControls';
import axios from 'axios';

type ChargingPoint = unknown;
interface ConnectorType {

    type: string;

    available: number;

    total: number;

    power: string;

    connectorTypeId?: number;

    typeName?: string;

    powerOutput?: number;

    pricePerKwh?: number;

    vehicles?: any[];

}


interface ChargingStation {

    id: string;

    name: string;

    address: string;

    latitude: number;

    longitude: number;

    status: string;

    totalPoints: number;

    availablePoints: number;

    connectorTypes: ConnectorType[];

    chargingPoints?: ChargingPoint[];

    chargingPointNumber?: number;

    pricing: {

        standard: number;

        fast: number;

        rapid: number;

    };

    operatingHours: string;

    contactPhone: string;

    contactEmail: string;

    lastMAINTENANCE: string;

    nextMAINTENANCE: string;

    revenue: {

        daily: number;

        monthly: number;

    };

    // API fields

    stationId?: string;

    stationName?: string;

    numberOfPort?: number;

}
// UI staff type and initial empty list
interface StaffUI {
  id: string;
  name: string;
  email: string;
  birthDate: string;
  station: string;
  position: string; // role from API: ADMIN | STAFF | DRIVER
  statusRaw: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  joinDate: string;
  avatar: string | null;
}
const initialStaff: StaffUI[] = [];

const stations = [
  { id: 'all', name: 'All Stations', nameVi: 'Tất cả trạm' },
  { id: 'center', name: 'ChargeHub Center', nameVi: 'ChargeHub Trung tâm' },
  { id: 'mall', name: 'ChargeHub Mall', nameVi: 'ChargeHub TTTM' },
  { id: 'airport', name: 'ChargeHub Airport', nameVi: 'ChargeHub Sân bay' },
];

const positions = [
  { id: 'all', name: 'All Roles', nameVi: 'Tất cả vai trò' },
  { id: 'ADMIN', name: 'Admin', nameVi: 'Quản trị' },
  { id: 'STAFF', name: 'Staff', nameVi: 'Nhân viên' },
  { id: 'DRIVER', name: 'Driver', nameVi: 'Tài xế' },
];

const statusOptions = [
  { id: 'all', name: 'All Status', nameVi: 'Tất cả trạng thái' },
  { id: 'ACTIVE', name: 'Active', nameVi: 'Hoạt động' },
  { id: 'INACTIVE', name: 'Inactive', nameVi: 'Ngưng hoạt động' },
  { id: 'BANNED', name: 'Banned', nameVi: 'Cấm' },
];

interface StaffManagementViewProps {
  onBack: () => void;
}

interface Staff{
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  role: string;
  status: string;
  stationId: string;
  stationName: string;
  stationAddress: string;
}

export default function StaffManagementView({ onBack }: StaffManagementViewProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStation, setSelectedStation] = useState('all');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedStaff, setSelectedStaff] = useState<StaffUI | null>(null);
  const [staffList, setStaffList] = useState<StaffUI[]>(initialStaff);
  const [stationsCount, setStationsCount] = useState<number>(0);
  const [stationsList, setStationsList] = useState<ChargingStation[]>([]);
  const [stationOptions, setStationOptions] = useState<Array<{ id: string; name: string; nameVi: string }>>([
    { id: 'all', name: 'All Stations', nameVi: 'Tất cả trạm' },
  ]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assignTargetStaff, setAssignTargetStaff] = useState<StaffUI | null>(null);
  const [assignSelectedStationId, setAssignSelectedStationId] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUI | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<StaffUI | null>(null);
  const [staffFullName, setStaffFullName] = useState("");
  const [staffStatus, setStaffStatus] = useState("");
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    birthDate: '',
    station: '',
    position: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'BANNED'
  });

  const isVietnamese = language === 'vi';

  const translations = {
    title: isVietnamese ? 'Quản Lý Nhân Sự' : 'Staff Management',
    subtitle: isVietnamese ? 'Quản lý và theo dõi tất cả nhân viên trong hệ thống' : 'manage and monitor all staff members in the system',
    searchPlaceholder: isVietnamese ? 'Tìm kiếm nhân viên...' : 'Search staff...',
    filterByStation: isVietnamese ? 'Lọc theo trạm' : 'Filter by Station',
    filterByPosition: isVietnamese ? 'Lọc theo vị trí' : 'Filter by Position',
    filterByStatus: isVietnamese ? 'Lọc theo trạng thái' : 'Filter by Status',
    addStaff: isVietnamese ? 'Thêm nhân viên' : 'Add Staff',
    exportData: isVietnamese ? 'Xuất dữ liệu' : 'Export Data',
    stt: isVietnamese ? 'STT' : 'No.',
    staffId: isVietnamese ? 'Mã số' : 'Staff ID',
    name: isVietnamese ? 'Họ tên' : 'Name',
    birthDate: isVietnamese ? 'Ngày sinh' : 'Birth Date',
    email: isVietnamese ? 'Email' : 'Email',
    station: isVietnamese ? 'Trạm' : 'Station',
    position: isVietnamese ? 'Vị trí' : 'Position',
    status: isVietnamese ? 'Trạng thái' : 'Status',
    actions: isVietnamese ? 'Thao tác' : 'Actions',
    active: isVietnamese ? 'Hoạt động' : 'Active',
    inactive: isVietnamese ? 'Ngưng hoạt động' : 'Inactive',
    manager: isVietnamese ? 'Quản lý' : 'Manager',
    supervisor: isVietnamese ? 'Giám sát' : 'Supervisor',
    technician: isVietnamese ? 'Kỹ thuật viên' : 'Technician',
    viewDetails: isVietnamese ? 'Xem chi tiết' : 'View Details',
    editStaff: isVietnamese ? 'Chỉnh sửa' : 'Edit',
    deleteStaff: isVietnamese ? 'Xóa' : 'Delete',
    staffDetails: isVietnamese ? 'Chi tiết nhân viên' : 'Staff Details',
    joinDate: isVietnamese ? 'Ngày gia nhập' : 'Join Date',
    totalStaff: isVietnamese ? 'Tổng nhân viên' : 'Total Staff',
    activeStaff: isVietnamese ? 'Nhân viên hoạt động' : 'Active Staff',
    back: isVietnamese ? 'Quay lại trang chính' : 'Back to Dashboard',
  };

  // Filter staff data
  const filteredStaff = staffList.filter(staff => {
    const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStation = selectedStation === 'all' || staff.station === selectedStation;
    const matchesPosition = selectedPosition === 'all' || staff.position === selectedPosition;
    const matchesStatus = selectedStatus === 'all' || staff.statusRaw === selectedStatus;

    return matchesSearch && matchesStation && matchesPosition && matchesStatus;
  });

  const activeStaffCount = staffList.filter(staff => staff.statusRaw === 'ACTIVE').length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isVietnamese 
      ? date.toLocaleDateString('vi-VN')
      : date.toLocaleDateString('en-US');
  };

  const getPositionTranslation = (role: string) => {
    const r = role.toUpperCase();
    if (r === 'ADMIN') return isVietnamese ? 'Quản trị' : 'Admin';
    if (r === 'STAFF') return isVietnamese ? 'Nhân viên' : 'Staff';
    if (r === 'DRIVER') return isVietnamese ? 'Tài xế' : 'Driver';
    return role;
  };

  const getStationTranslation = (stationName: string) => {
    if (!isVietnamese) return stationName;
    const stationMap: { [key: string]: string } = {
      'ChargeHub Center': 'ChargeHub Trung tâm',
      'ChargeHub Mall': 'ChargeHub TTTM',
      'ChargeHub Airport': 'ChargeHub Sân bay',
    };
    return stationMap[stationName] || stationName;
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Name,Email,Birth Date,Station,Position,Status,Join Date\n"
      + filteredStaff.map(staff => 
          `${staff.id},${staff.name},${staff.email},${staff.birthDate},${staff.station},${staff.position},${staff.statusRaw},${staff.joinDate}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "staff_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(isVietnamese ? "Đã xuất dữ liệu thành công" : "Data exported successfully");
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      birthDate: '',
      station: '',
      position: '',
      status: 'ACTIVE'
    });
  };

  const fetchChargingStations = async (): Promise<ChargingStation[] | null> => {
    const token = localStorage.getItem("token");
          try {
  
              const res = await axios.get("http://localhost:8080/api/charging-stations",{
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
  
  
              if (res.status === 200) {
  
                  console.log("API Response:", res.data);
  
                  return (res.data as any[]).map(station => ({
                      id: String(station.stationId),
                      stationId: String(station.stationId),
                      stationName: station.stationName,
                      address: station.address,
                      latitude: station.latitude,
                      longitude: station.longitude,
                      numberOfPort: station.numberOfPort,
                      status: station.status,
                      chargingPoints: station.chargingPoints,
                      chargingPointNumber: station.chargingPointNumber,
                  })) as ChargingStation[];
  
              }
  
  
  
              throw new Error("Không thể lấy danh sách trạm sạc");
  
          } catch (err: any) {
  
              const msg =
  
                  err?.response?.data?.message || "Lấy danh sách trạm thất bại. Vui lòng thử lại.";
  
              toast.error(msg);
  
              return null;
  
          }
  
      };
  
  const getAvailableStaffs = async() : Promise<Staff[]|null> => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://localhost:8080/api/staff-management/available",
        {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(res.data);
    if (res.status === 200) {
      const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      return (list as any[]).map((staff) => ({
        userId: staff.userId,
        fullName: staff.fullName,
        email: staff.email ?? "",
        phone: staff.phone ?? "",
        dateOfBirth: staff.dateOfBirth ?? "",
        address: staff.address ?? "",
        role: staff.role ?? "",
        status: staff.status ?? "ACTIVE",
        stationId: staff.stationId ?? "",
        stationName: staff.stationName ?? "",
        stationAddress: staff.stationAddress ?? staff.stationName ?? ""  
      
      })) as Staff[]
    } 
  } catch (err: any) {

    }
    return null;
  }

  const assignStaffToStation = async (stationId: string, userId: string): Promise<boolean> => {
    const token = localStorage.getItem("token");
    try {
      const payload = { userId, stationId: Number(stationId) };
      const res = await axios.post("http://localhost:8080/api/staff-management/assign", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return res.status === 200 || res.status === 204;
    } catch (err: any) {
      toast.error(isVietnamese ? 'Gán trạm thất bại' : 'Assign failed');
      return false;
    }
  }

  const updateStaffStatus = async (fullName: string ,status: string, userId: string): Promise<boolean> => {
    const token = localStorage.getItem("token");
    try {
      const payload = {
        fullName: fullName,
        status: status
      }
      const res = await axios.put(`http://localhost:8080/api/staff-management/staff/${userId}`, payload,
        {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
      );
      return res.status === 200 || res.status === 204;

    } catch {
      return false;
    }
  }

  const removeStaffFromStation = async(stationId: string, userId: string): Promise<boolean> => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.delete(`http://localhost:8080/api/staff-management/stations/${stationId}/staff/${userId}`,{
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return res.status === 200 || res.status === 204;
    } catch (err: any) {
      return false;
    }
  }
  

  useEffect(() => {
    (async () => {
      const [staffs, stations] = await Promise.all([getAvailableStaffs(), fetchChargingStations()]);
      if (stations) {
        setStationsCount(stations.length);
        const opts = stations.map(s => ({
          id: String(s.stationName ?? s.id ?? ''),
          name: String(s.stationName ?? s.id ?? ''),
          nameVi: String(s.stationName ?? s.id ?? ''),
        })).filter(o => o.name);
        setStationOptions([{ id: 'all', name: 'All Stations', nameVi: 'Tất cả trạm' }, ...opts]);
        setStationsList(stations);
      }
      if (staffs) {
        const mapped: StaffUI[] = staffs.map(s => ({
          id: String(s.userId ?? ''),
          name: s.fullName ?? '',
          email: s.email ?? '',
          birthDate: s.dateOfBirth ?? '',
          station: s.stationName ?? '',
          position: String(s.role ?? '').toUpperCase(),
          statusRaw: (String(s.status ?? 'ACTIVE').toUpperCase() as 'ACTIVE'|'INACTIVE'|'BANNED'),
          joinDate: '',
          avatar: null,
        }));
        setStaffList(mapped);
      }
    })();
  }, []);

  const generateStaffId = () => {
    const existingIds = staffList.map(s => Number.parseInt(s.id.replace('STF', '')));
    const maxId = Math.max(...existingIds);
    return `STF${String(maxId + 1).padStart(3, '0')}`;
  };

  const handleAddStaff = () => {
    if (!formData.name || !formData.email || !formData.birthDate || !formData.station || !formData.position) {
      toast.error(isVietnamese ? "Vui lòng điền đầy đủ thông tin" : "Please fill in all required fields");
      return;
    }

    const newStaff: StaffUI = {
      id: generateStaffId(),
      name: formData.name,
      email: formData.email,
      birthDate: formData.birthDate,
      station: formData.station,
      position: formData.position,
      statusRaw: formData.status,
      joinDate: new Date().toISOString().slice(0, 10),
      avatar: null,
    };

    setStaffList(prev => [...prev, newStaff]);
    resetForm();
    setIsAddDialogOpen(false);
    toast.success(isVietnamese ? "Đã thêm nhân viên thành công" : "Staff member added successfully");
  };

  const handleEditStaff = async () => {
    if (!editingStaff) return;
    const fullNameToUpdate = formData.name?.trim() || editingStaff.name;
    const statusToUpdate = formData.status;

    const ok = await updateStaffStatus(fullNameToUpdate, statusToUpdate, editingStaff.id);
    if (ok) {
      setStaffList(prev => prev.map(s => s.id === editingStaff.id ? { ...s, name: fullNameToUpdate, statusRaw: statusToUpdate } : s));
      toast.success(isVietnamese ? "Cập nhật trạng thái thành công" : "Updated successfully");
      setEditingStaff(null);
      setIsEditDialogOpen(false);
    } else {
      toast.error(isVietnamese ? "Cập nhật thất bại" : "Update failed");
    }
  };

  const handleDeleteStaff = async () => {
    if (!deletingStaff) return;
    // Ưu tiên dùng stationId đã xác định khi mở dialog (nếu có)
    let stationIdToUse = (window as any)._deleteStationId as string | undefined;
    if (!stationIdToUse) {
      const latestStations = await fetchChargingStations();
      const station = (latestStations || stationsList).find(s => (s.stationName || s.name) === deletingStaff.station);
      if (station?.stationId) stationIdToUse = String(station.stationId);
    }
    if (!stationIdToUse) {
      toast.error(isVietnamese ? 'Không tìm thấy trạm của nhân viên' : 'Station not found for staff');
      return;
    }
    const ok = await removeStaffFromStation(stationIdToUse, deletingStaff.id);
    if (ok) {
      setStaffList(prev => prev.map(s => s.id === deletingStaff.id ? { ...s, station: '' } : s));
      setDeletingStaff(null);
      setIsDeleteDialogOpen(false);
      (window as any)._deleteStationId = undefined;
      toast.success(isVietnamese ? 'Đã gỡ nhân viên khỏi trạm' : 'Removed from station');
    } else {
      toast.error(isVietnamese ? 'Thao tác thất bại' : 'Operation failed');
    }
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (staff: StaffUI) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      email: staff.email,
      birthDate: staff.birthDate,
      station: staff.station,
      position: staff.position,
      status: staff.statusRaw
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (staff: StaffUI) => {
    setDeletingStaff(staff);
    setIsDeleteDialogOpen(true);
    // Xác định station ngay khi mở dialog
    void (async () => {
      const latestStations = await fetchChargingStations();
      const station = (latestStations || stationsList).find(s => (s.stationName || s.name) === staff.station);
      if (station?.stationId) {
        (window as any)._deleteStationId = String(station.stationId);
      }
    })();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-red-50/30 dark:to-red-950/20">
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
                {translations.back}
              </Button>
              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 via-red-500/90 to-red-500/70 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 transform group-hover:scale-110 transition-transform duration-300">
                    <Users2 className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="font-semibold text-foreground">
                    {translations.title}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {translations.subtitle}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Admin Language Theme Controls */}
            <AdminLanguageThemeControls />
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-7xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">{translations.totalStaff}</p>
                  <p className="text-2xl font-bold text-red-800 dark:text-red-200">{staffList.length}</p>
                </div>
                <Users2 className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">{translations.activeStaff}</p>
                  <p className="text-2xl font-bold text-red-800 dark:text-red-200">{activeStaffCount}</p>
                </div>
                <Users2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">Stations</p>
                  <p className="text-2xl font-bold text-red-800 dark:text-red-200">{stationsCount}</p>
                </div>
                <MapPin className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-8 border-red-200 dark:border-red-800 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={translations.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-red-200 dark:border-red-800 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={selectedStation} onValueChange={(value: string) => setSelectedStation(value)}>
                  <SelectTrigger className="w-full sm:w-48 border-red-200 dark:border-red-800 focus:ring-red-500">
                    <SelectValue placeholder={translations.filterByStation} />
                  </SelectTrigger>
                  <SelectContent>
                    {stationOptions.map((station) => (
                      <SelectItem key={station.id} value={station.id}>
                        {isVietnamese ? station.nameVi : station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedPosition} onValueChange={(value: string) => setSelectedPosition(value)}>
                  <SelectTrigger className="w-full sm:w-48 border-red-200 dark:border-red-800 focus:ring-red-500">
                    <SelectValue placeholder={translations.filterByPosition} />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((position) => (
                      <SelectItem key={position.id} value={position.id}>
                        {isVietnamese ? position.nameVi : position.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={(value: string) => setSelectedStatus(value)}>
                  <SelectTrigger className="w-full sm:w-48 border-red-200 dark:border-red-800 focus:ring-red-500">
                    <SelectValue placeholder={translations.filterByStatus} />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {isVietnamese ? status.nameVi : status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Table */}
        <Card className="border-red-200 dark:border-red-800 shadow-lg">
          <CardHeader className="border-b border-red-200 dark:border-red-800">
            <CardTitle className="text-red-800 dark:text-red-200">
              {translations.title} ({filteredStaff.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-red-200 dark:border-red-800 hover:bg-red-50/50 dark:hover:bg-red-950/20">
                    <TableHead className="text-red-700 dark:text-red-300 w-16">{translations.stt}</TableHead>
                    <TableHead className="text-red-700 dark:text-red-300">{translations.staffId}</TableHead>
                    <TableHead className="text-red-700 dark:text-red-300">{translations.name}</TableHead>
                    <TableHead className="text-red-700 dark:text-red-300">{translations.birthDate}</TableHead>
                    <TableHead className="text-red-700 dark:text-red-300">{translations.email}</TableHead>
                    <TableHead className="text-red-700 dark:text-red-300">{translations.station}</TableHead>
                    <TableHead className="text-red-700 dark:text-red-300">{translations.position}</TableHead>
                    <TableHead className="text-red-700 dark:text-red-300">{translations.status}</TableHead>
                    <TableHead className="text-red-700 dark:text-red-300 text-center">{translations.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((staff, index) => (
                    <TableRow 
                      key={staff.id} 
                      className="border-red-100 dark:border-red-900 hover:bg-red-50/30 dark:hover:bg-red-950/10"
                    >
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-red-300 text-red-700 dark:border-red-700 dark:text-red-300">
                          {staff.id}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={staff.avatar || undefined} />
                            <AvatarFallback className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                              {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{staff.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(staff.birthDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{staff.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {staff.station ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {getStationTranslation(staff.station)}
                          </div>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                            {isVietnamese ? 'Chưa có trạm làm việc' : 'No assigned station'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {getPositionTranslation(staff.position)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={staff.statusRaw === 'ACTIVE' ? 'default' : 'secondary'}
                          className={
                            staff.statusRaw === 'ACTIVE'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : staff.statusRaw === 'BANNED'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }
                        >
                          {staff.statusRaw === 'ACTIVE' ? translations.active : staff.statusRaw === 'BANNED' ? 'Banned' : translations.inactive}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedStaff(staff)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/30"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle className="text-red-800 dark:text-red-200">
                                  {translations.staffDetails}
                                </DialogTitle>
                                <DialogDescription>
                                  {staff.name} - {staff.id}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedStaff && (
                                <div className="space-y-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12">
                                      <AvatarImage src={selectedStaff.avatar || undefined} />
                                      <AvatarFallback className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                                        {selectedStaff.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h3 className="font-semibold">{selectedStaff.name}</h3>
                                      <p className="text-sm text-muted-foreground">{selectedStaff.id}</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="font-medium text-muted-foreground">{translations.birthDate}:</p>
                                      <p>{formatDate(selectedStaff.birthDate)}</p>
                                    </div>
                                    {/* Join date hidden - not provided by API */}
                                    <div className="col-span-2">
                                      <p className="font-medium text-muted-foreground">{translations.email}:</p>
                                      <p>{selectedStaff.email}</p>
                                    </div>
                                    <div>
                                      <p className="font-medium text-muted-foreground">{translations.station}:</p>
                                      <p>
                                        {selectedStaff.station
                                          ? getStationTranslation(selectedStaff.station)
                                          : (isVietnamese ? 'Chưa có trạm làm việc' : 'No assigned station')}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="font-medium text-muted-foreground">{translations.position}:</p>
                                      <p>{getPositionTranslation(selectedStaff.position)}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={Boolean(staff.station)}
                            onClick={() => {
                              setAssignTargetStaff(staff);
                              setAssignSelectedStationId('');
                              setIsAssignDialogOpen(true);
                            }}
                            className={"hover:bg-green-50 dark:hover:bg-green-950/30 " + (staff.station ? "text-muted-foreground" : "text-green-600")}
                            title={staff.station ? (isVietnamese ? 'Đã có trạm' : 'Already assigned') : (isVietnamese ? 'Gán trạm làm việc' : 'Assign station')}
                          >
                            <MapPin className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(staff)}
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-950/30"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!staff.station}
                            onClick={() => openDeleteDialog(staff)}
                            className={"hover:bg-red-50 dark:hover:bg-red-950/30 " + (!staff.station ? "text-muted-foreground" : "text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300")}
                            title={staff.station ? (isVietnamese ? 'Gỡ khỏi trạm' : 'Unassign from station') : (isVietnamese ? 'Chưa có trạm để gỡ' : 'No station to unassign')}
                          >
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredStaff.length === 0 && (
              <div className="text-center py-12">
                <Users2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {isVietnamese ? 'Không tìm thấy nhân viên nào' : 'No staff members found'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assign Station Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-800 dark:text-red-200">
                {isVietnamese ? 'Gán trạm làm việc' : 'Assign Station'}
              </DialogTitle>
              <DialogDescription>
                {assignTargetStaff ? `${assignTargetStaff.name} - ${assignTargetStaff.id}` : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{translations.station}</Label>
                <Select value={assignSelectedStationId} onValueChange={(value: string) => setAssignSelectedStationId(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={isVietnamese ? 'Chọn trạm' : 'Select station'} />
                  </SelectTrigger>
                  <SelectContent>
                    {stationsList.map((s) => (
                      <SelectItem key={String(s.id ?? s.stationId)} value={String(s.stationId ?? s.id)}>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{s.stationName || s.name}</span>
                          <span className="text-xs text-muted-foreground">{s.address}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                  {isVietnamese ? 'Hủy' : 'Cancel'}
                </Button>
                <Button
                  disabled={!assignTargetStaff || !assignSelectedStationId}
                  onClick={async () => {
                    if (!assignTargetStaff || !assignSelectedStationId) return;
                    const ok = await assignStaffToStation(assignSelectedStationId, assignTargetStaff.id);
                    if (ok) {
                      const chosen = stationsList.find(s => String(s.stationId ?? s.id) === assignSelectedStationId);
                      setStaffList(prev => prev.map(s => s.id === assignTargetStaff.id ? { ...s, station: String(chosen?.stationName || chosen?.name || '') } : s));
                      setIsAssignDialogOpen(false);
                      toast.success(isVietnamese ? 'Đã gán trạm làm việc' : 'Assigned successfully');
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isVietnamese ? 'Xác nhận' : 'Confirm'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Staff Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-800 dark:text-red-200">
                {isVietnamese ? "Thêm nhân viên mới" : "Add New Staff Member"}
              </DialogTitle>
              <DialogDescription>
                {isVietnamese ? "Nhập thông tin nhân viên mới" : "Enter information for the new staff member"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="add-name">{translations.name}</Label>
                <Input
                  id="add-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={isVietnamese ? "Nhập họ tên" : "Enter full name"}
                />
              </div>
              <div>
                <Label htmlFor="add-email">{translations.email}</Label>
                <Input
                  id="add-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={isVietnamese ? "Nhập email" : "Enter email"}
                />
              </div>
              <div>
                <Label htmlFor="add-birthDate">{translations.birthDate}</Label>
                <Input
                  id="add-birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="add-station">{translations.station}</Label>
                <Select value={formData.station} onValueChange={(value: string) => setFormData(prev => ({ ...prev, station: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={isVietnamese ? "Chọn trạm" : "Select station"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ChargeHub Center">ChargeHub Center</SelectItem>
                    <SelectItem value="ChargeHub Mall">ChargeHub Mall</SelectItem>
                    <SelectItem value="ChargeHub Airport">ChargeHub Airport</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="add-position">{translations.position}</Label>
                <Select value={formData.position} onValueChange={(value: string) => setFormData(prev => ({ ...prev, position: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={isVietnamese ? "Chọn vị trí" : "Select position"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                    <SelectItem value="Technician">Technician</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="add-status">{translations.status}</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value as 'ACTIVE' | 'INACTIVE' | 'BANNED' }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">{translations.active}</SelectItem>
                    <SelectItem value="INACTIVE">{translations.inactive}</SelectItem>
                    <SelectItem value="BANNED">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  {isVietnamese ? "Hủy" : "Cancel"}
                </Button>
                <Button onClick={handleAddStaff} className="bg-red-600 hover:bg-red-700">
                  {isVietnamese ? "Thêm" : "Add"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Staff Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-800 dark:text-red-200">
                {isVietnamese ? "Chỉnh sửa nhân viên" : "Edit Staff Member"}
              </DialogTitle>
              <DialogDescription>
                {editingStaff && `${editingStaff.name} - ${editingStaff.id}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">{translations.name}</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={isVietnamese ? "Nhập họ tên" : "Enter full name"}
                />
              </div>
              <div>
                <Label htmlFor="edit-status">{translations.status}</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value as 'ACTIVE'|'INACTIVE'|'BANNED' }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">{translations.active}</SelectItem>
                    <SelectItem value="INACTIVE">{translations.inactive}</SelectItem>
                    <SelectItem value="BANNED">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  {isVietnamese ? "Hủy" : "Cancel"}
                </Button>
                <Button onClick={handleEditStaff} className="bg-red-600 hover:bg-red-700">
                  {isVietnamese ? "Cập nhật" : "Update"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Staff Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-800 dark:text-red-200">
                {isVietnamese ? "Xác nhận xóa nhân viên" : "Confirm Staff Deletion"}
              </DialogTitle>
              <DialogDescription>
                {isVietnamese 
                  ? "Bạn có chắc chắn muốn xóa nhân viên này? Hành động này không thể hoàn tác."
                  : "Are you sure you want to delete this staff member? This action cannot be undone."
                }
              </DialogDescription>
            </DialogHeader>
            {deletingStaff && (
              <div className="py-4">
                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={deletingStaff.avatar || undefined} />
                    <AvatarFallback className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                      {deletingStaff.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{deletingStaff.name}</h4>
                    <p className="text-sm text-muted-foreground">{deletingStaff.id} - {deletingStaff.email}</p>
                    <p className="text-sm text-muted-foreground">{getStationTranslation(deletingStaff.station)}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                {isVietnamese ? "Hủy" : "Cancel"}
              </Button>
              <Button variant="destructive" onClick={handleDeleteStaff}>
                {isVietnamese ? "Xóa" : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Toaster />
    </div>
  );
}