import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Users2, Mail, Calendar, MapPin, Eye, Edit, Trash2, UserPlus, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import AdminLanguageThemeControls from './AdminLanguageThemeControls';
import { 
  getAvailableStaff, 
  getStaffByStation, 
  assignStaffToStation, 
  unassignStaffFromStation,
  getAllChargingStations,
  updateUserStatus,
  type StaffDTO,
  type ChargingStationDTO
} from '../services/api';

// Staff type definition
interface StaffMember {
    id: string;
    name: string;
    email?: string;
    birthDate?: string;
    station: string;
    position: string;
    status: 'active' | 'inactive';
    joinDate: string;
    avatar: null | string;
}


const positions = [
    { id: 'all', name: 'All Positions', nameVi: 'Tất cả vị trí' },
    { id: 'manager', name: 'Manager', nameVi: 'Quản lý' },
    { id: 'supervisor', name: 'Supervisor', nameVi: 'Giám sát' },
    { id: 'technician', name: 'Technician', nameVi: 'Kỹ thuật viên' },
];

const statusOptions = [
    { id: 'all', name: 'All Status', nameVi: 'Tất cả trạng thái' },
    { id: 'active', name: 'Active', nameVi: 'Hoạt động' },
    { id: 'inactive', name: 'Inactive', nameVi: 'Ngưng hoạt động' },
];

interface StaffManagementViewProps {
    onBack: () => void;
}

export default function StaffManagementView({ onBack }: StaffManagementViewProps) {
    const { language } = useLanguage();
    const { theme } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStation, setSelectedStation] = useState('all');
    const [selectedPosition, setSelectedPosition] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [stations, setStations] = useState<ChargingStationDTO[]>([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);
    
    // Load stations on mount
    useEffect(() => {
      loadStations();
      loadStaff(); // Load all available staff initially
    }, []);
    
    // Reload staff when station selection changes
    useEffect(() => {
      loadStaff();
    }, [selectedStation]);
    
    const loadStations = async () => {
      try {
        const stationList = await getAllChargingStations();
        setStations(stationList || []);
      } catch (error) {
        console.error('Error loading stations:', error);
      }
    };
    
    const loadStaff = async () => {
      setLoading(true);
      try {
        let response;
        if (selectedStation === 'all') {
          // Load all available staff
          response = await getAvailableStaff();
        } else {
          // Extract stationId from selected station
          const station = stations.find(s => s.stationId.toString() === selectedStation);
          if (station) {
            response = await getStaffByStation(station.stationId);
          } else {
            response = await getAvailableStaff();
          }
        }
        
        if (response && response.success && response.data) {
          // Transform StaffDTO to StaffMember
          const transformedStaff: StaffMember[] = response.data.map((staff: StaffDTO): StaffMember => {
            const currentDate: string = new Date().toISOString().split('T')[0];
            return {
              id: `STF${String(staff.userId).padStart(3, '0')}`,
              name: staff.fullName,
              email: staff.email || '',
              birthDate: staff.dateOfBirth || '',
              station: staff.stationName || 'Unassigned',
              position: staff.role === 'STAFF' ? 'Technician' : 'Manager',
              status: staff.status === 'ACTIVE' ? 'active' as const : 'inactive' as const,
              joinDate: currentDate,
              avatar: null
            };
          });
          setStaffList(transformedStaff);
        }
      } catch (error) {
        console.error('Error loading staff:', error);
        toast.error(language === 'vi' ? 'Lỗi khi tải danh sách nhân viên' : 'Error loading staff list');
        setStaffList([]); // Clear list on error
      } finally {
        setLoading(false);
      }
    };

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        birthDate: '',
        station: '',
        position: '',
        status: 'active' as 'active' | 'inactive'
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
        back: isVietnamese ? 'Quay lại' : 'Back',
    };

    // Filter staff data
    const filteredStaff = staffList.filter(staff => {
        const matchesSearch = staff.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.id?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStation = selectedStation === 'all' ||
            staff.station.toLowerCase().includes(selectedStation === 'center' ? 'center' :
                selectedStation === 'mall' ? 'mall' :
                    selectedStation === 'airport' ? 'airport' : '');
        const matchesPosition = selectedPosition === 'all' || staff.position.toLowerCase() === selectedPosition;
        const matchesStatus = selectedStatus === 'all' || staff.status === selectedStatus;

        return matchesSearch && matchesStation && matchesPosition && matchesStatus;
    });

    const activeStaffCount = staffList.filter(staff => staff.status === 'active').length;

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return isVietnamese
            ? date.toLocaleDateString('vi-VN')
            : date.toLocaleDateString('en-US');
    };

    const getPositionTranslation = (position: string) => {
        const positionMap: { [key: string]: string } = {
            'Manager': isVietnamese ? 'Quản lý' : 'Manager',
            'Supervisor': isVietnamese ? 'Giám sát' : 'Supervisor',
            'Technician': isVietnamese ? 'Kỹ thuật viên' : 'Technician',
        };
        return positionMap[position] || position;
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
                `${staff.id},${staff.name || ''},${staff.email || ''},${staff.birthDate || ''},${staff.station},${staff.position},${staff.status},${staff.joinDate}`
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
            status: 'active'
        });
    };

    const generateStaffId = () => {
        const existingIds = staffList.map(s => parseInt(s.id.replace('STF', '')));
        const maxId = Math.max(...existingIds);
        return `STF${String(maxId + 1).padStart(3, '0')}`;
    };

    const handleAddStaff = () => {
        if (!formData.name || !formData.email || !formData.birthDate || !formData.station || !formData.position) {
            toast.error(isVietnamese ? "Vui lòng điền đầy đủ thông tin" : "Please fill in all required fields");
            return;
        }

        const currentDate: string = new Date().toISOString().split('T')[0];
        const newStaff: StaffMember = {
            id: generateStaffId(),
            name: formData.name,
            email: formData.email,
            birthDate: formData.birthDate,
            station: formData.station,
            position: formData.position,
            status: formData.status,
            joinDate: currentDate,
            avatar: null,
        };

        setStaffList(prev => [...prev, newStaff]);
        resetForm();
        setIsAddDialogOpen(false);
        toast.success(isVietnamese ? "Đã thêm nhân viên thành công" : "Staff member added successfully");
    };

    const handleEditStaff = () => {
        if (!editingStaff || !formData.name || !formData.email || !formData.birthDate || !formData.station || !formData.position) {
            toast.error(isVietnamese ? "Vui lòng điền đầy đủ thông tin" : "Please fill in all required fields");
            return;
        }

        setStaffList(prev => prev.map(staff =>
            staff.id === editingStaff.id
                ? {
                    ...staff,
                    name: formData.name,
                    email: formData.email,
                    birthDate: formData.birthDate,
                    station: formData.station,
                    position: formData.position,
                    status: formData.status
                  }
                : staff
        ));

        setEditingStaff(null);
        resetForm();
        setIsEditDialogOpen(false);
        toast.success(isVietnamese ? "Đã cập nhật nhân viên thành công" : "Staff member updated successfully");
    };

    const handleDeleteStaff = () => {
        if (!deletingStaff) return;

        setStaffList(prev => prev.filter(staff => staff.id !== deletingStaff.id));
        setDeletingStaff(null);
        setIsDeleteDialogOpen(false);
        toast.success(isVietnamese ? "Đã xóa nhân viên thành công" : "Staff member deleted successfully");
    };

    const openAddDialog = () => {
        resetForm();
        setIsAddDialogOpen(true);
    };

    const openEditDialog = (staff: StaffMember) => {
        setEditingStaff(staff);
        setFormData({
            name: staff.name || '',
            email: staff.email || '',
            birthDate: staff.birthDate || '',
            station: staff.station,
            position: staff.position,
            status: staff.status
        });
        setIsEditDialogOpen(true);
    };

    const openDeleteDialog = (staff: StaffMember) => {
        setDeletingStaff(staff);
        setIsDeleteDialogOpen(true);
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
                {/* Main Content */}
                <div className="mb-8">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-800 dark:from-red-400 dark:to-red-600 bg-clip-text text-transparent mb-2">
                            {translations.title}
                        </h1>
                        <p className="text-muted-foreground text-lg">{translations.subtitle}</p>
                    </div>
                </div>

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
                                    <p className="text-sm font-medium text-red-700 dark:text-red-300">{isVietnamese ? 'Trạm sạc' : 'Stations'}</p>
                                    <p className="text-2xl font-bold text-red-800 dark:text-red-200">{stations.length}</p>
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
                                <Select value={selectedStation} onValueChange={setSelectedStation}>
                                    <SelectTrigger className="w-full sm:w-48 border-red-200 dark:border-red-800 focus:ring-red-500">
                                        <SelectValue placeholder={translations.filterByStation} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                          {isVietnamese ? 'Tất cả trạm' : 'All Stations'}
                                        </SelectItem>
                                        {stations.map((station) => (
                                            <SelectItem key={station.stationId} value={station.stationId.toString()}>
                                                {station.stationName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={selectedPosition} onValueChange={setSelectedPosition}>
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

                                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
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

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <Button
                                    onClick={openAddDialog}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    {translations.addStaff}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleExport}
                                    className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    {translations.exportData}
                                </Button>
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
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-12">
                                                <div className="flex flex-col items-center space-y-4">
                                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                                                    <p className="text-muted-foreground">
                                                        {isVietnamese ? 'Đang tải dữ liệu...' : 'Loading data...'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredStaff.map((staff, index) => (
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
                                                            {staff.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'ST'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{staff.name || '-'}</span>
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
                                                                    <span className="text-sm">{staff.email || '-'}</span>
                                                                </div>
                                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    {getStationTranslation(staff.station)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                    {getPositionTranslation(staff.position)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={staff.status === 'active' ? 'default' : 'secondary'}
                                                    className={staff.status === 'active'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                                    }
                                                >
                                                    {staff.status === 'active' ? translations.active : translations.inactive}
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
                                                                                {selectedStaff.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'ST'}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div>
                                                                            <h3 className="font-semibold">{selectedStaff.name || '-'}</h3>
                                                                            <p className="text-sm text-muted-foreground">{selectedStaff.id}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                                        <div>
                                                                            <p className="font-medium text-muted-foreground">{translations.birthDate}:</p>
                                                                            <p>{formatDate(selectedStaff.birthDate)}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-medium text-muted-foreground">{translations.joinDate}:</p>
                                                                            <p>{formatDate(selectedStaff.joinDate)}</p>
                                                                        </div>
                                                                        <div className="col-span-2">
                                                                            <p className="font-medium text-muted-foreground">{translations.email}:</p>
                                                                            <p>{selectedStaff.email || '-'}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-medium text-muted-foreground">{translations.station}:</p>
                                                                            <p>{getStationTranslation(selectedStaff.station)}</p>
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
                                                        onClick={() => openEditDialog(staff)}
                                                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-950/30"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openDeleteDialog(staff)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
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
                                <Select value={formData.station} onValueChange={(value: any) => setFormData(prev => ({ ...prev, station: value }))}>
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
                                <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData(prev => ({ ...prev, status: value }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">{translations.active}</SelectItem>
                                        <SelectItem value="inactive">{translations.inactive}</SelectItem>
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
                                <Label htmlFor="edit-email">{translations.email}</Label>
                                <Input
                                    id="edit-email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder={isVietnamese ? "Nhập email" : "Enter email"}
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-birthDate">{translations.birthDate}</Label>
                                <Input
                                    id="edit-birthDate"
                                    type="date"
                                    value={formData.birthDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-station">{translations.station}</Label>
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
                                <Label htmlFor="edit-position">{translations.position}</Label>
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
                                <Label htmlFor="edit-status">{translations.status}</Label>
                                <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData(prev => ({ ...prev, status: value }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">{translations.active}</SelectItem>
                                        <SelectItem value="inactive">{translations.inactive}</SelectItem>
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
                                                            {deletingStaff.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'ST'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h4 className="font-medium">{deletingStaff.name || '-'}</h4>
                                                        <p className="text-sm text-muted-foreground">{deletingStaff.id} - {deletingStaff.email || '-'}</p>
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