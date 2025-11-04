import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Users2, Mail, Calendar, Eye, Edit, Ban, ShieldAlert, AlertCircle, UserCheck, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import AdminLanguageThemeControls from './AdminLanguageThemeControls';
import { getAllUsers, reportViolation, updateUserStatus } from '../services/api';

interface DriverManagementViewProps {
  onBack: () => void;
}

interface DriverData {
  userId: number;
  fullName: string;
  email: string;
  dateOfBirth: string;
  role: string;
  status: 'ACTIVE' | 'BANNED' | 'INACTIVE';
  violations: number;
  reasonReport?: string;
  avatar?: string;
}

export default function DriverManagementView({ onBack }: DriverManagementViewProps) {
  const { language } = useLanguage();
  const [drivers, setDrivers] = useState<DriverData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState<DriverData | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverData | null>(null);
  const [newStatus, setNewStatus] = useState<'ACTIVE' | 'BANNED' | 'INACTIVE'>('ACTIVE');
  const [newRole, setNewRole] = useState<'DRIVER' | 'STAFF' | 'ADMIN'>('DRIVER');
  const [violationReason, setViolationReason] = useState('');

  const isVietnamese = language === 'vi';

  const translations = {
    title: isVietnamese ? 'Quản Lý Tài Xế' : 'Driver Management',
    search: isVietnamese ? 'Tìm kiếm theo tên hoặc email...' : 'Search by name or email...',
    filterStatus: isVietnamese ? 'Lọc theo trạng thái' : 'Filter by status',
    all: isVietnamese ? 'Tất cả' : 'All',
    active: isVietnamese ? 'Hoạt động' : 'Active',
    banned: isVietnamese ? 'Đã cấm' : 'Banned',
    inactive: isVietnamese ? 'Không hoạt động' : 'Inactive',
    totalDrivers: isVietnamese ? 'Tổng số tài xế' : 'Total Drivers',
    bannedDrivers: isVietnamese ? 'Đã cấm' : 'Banned',
    table: {
      no: isVietnamese ? 'STT' : 'No.',
      id: 'ID',
      name: isVietnamese ? 'Tên' : 'Name',
      email: 'Email',
      dob: isVietnamese ? 'Ngày sinh' : 'Date of Birth',
      violations: isVietnamese ? 'Vi phạm' : 'Violations',
      status: isVietnamese ? 'Trạng thái' : 'Status',
      actions: isVietnamese ? 'Hành động' : 'Actions',
    },
    actions: {
      view: isVietnamese ? 'Xem' : 'View',
      edit: isVietnamese ? 'Sửa' : 'Edit',
      reportViolation: isVietnamese ? 'Báo cáo vi phạm' : 'Report Violation',
    },
    dialog: {
      viewTitle: isVietnamese ? 'Chi tiết tài xế' : 'Driver Details',
      editTitle: isVietnamese ? 'Chỉnh sửa tài xế' : 'Edit Driver',
      reportTitle: isVietnamese ? 'Báo cáo vi phạm' : 'Report Violation',
      close: isVietnamese ? 'Đóng' : 'Close',
      save: isVietnamese ? 'Lưu' : 'Save',
      report: isVietnamese ? 'Báo cáo' : 'Report',
      status: isVietnamese ? 'Trạng thái' : 'Status',
      role: isVietnamese ? 'Vai trò' : 'Role',
      reason: isVietnamese ? 'Lý do vi phạm' : 'Violation Reason',
      reasonPlaceholder: isVietnamese ? 'Nhập lý do vi phạm...' : 'Enter violation reason...',
    },
    messages: {
      loading: isVietnamese ? 'Đang tải dữ liệu...' : 'Loading data...',
      noData: isVietnamese ? 'Không có dữ liệu' : 'No data available',
      updateSuccess: isVietnamese ? 'Cập nhật thành công!' : 'Update successful!',
      updateError: isVietnamese ? 'Cập nhật thất bại!' : 'Update failed!',
      reportSuccess: isVietnamese ? 'Báo cáo vi phạm thành công!' : 'Violation reported successfully!',
      reportError: isVietnamese ? 'Báo cáo vi phạm thất bại!' : 'Violation report failed!',
    },
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const response = await getAllUsers();
      if (response.success && response.data) {
        setDrivers(response.data as DriverData[]);
      } else {
        toast.error(translations.messages.updateError);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error(translations.messages.updateError);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDriver = async () => {
    if (!editingDriver) return;

    try {
      const response = await updateUserStatus(
        editingDriver.userId,
        newStatus,
        newRole
      );
      
      if (response.success) {
        toast.success(translations.messages.updateSuccess);
        setIsEditDialogOpen(false);
        fetchDrivers(); // Refresh list
      } else {
        toast.error(translations.messages.updateError);
      }
    } catch (error) {
      console.error('Error updating driver:', error);
      toast.error(translations.messages.updateError);
    }
  };

  const handleReportViolation = async (driver: DriverData) => {
    if (!violationReason.trim()) {
      toast.error(isVietnamese ? 'Vui lòng nhập lý do vi phạm' : 'Please enter violation reason');
      return;
    }

    try {
      const response = await reportViolation(driver.userId, violationReason);
      
      if (response.success) {
        toast.success(translations.messages.reportSuccess);
        setViolationReason('');
        fetchDrivers(); // Refresh list
      } else {
        toast.error(translations.messages.reportError);
      }
    } catch (error) {
      console.error('Error reporting violation:', error);
      toast.error(translations.messages.reportError);
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = 
      driver.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || driver.status === selectedStatus.toUpperCase();
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500">{translations.active}</Badge>;
      case 'BANNED':
        return <Badge variant="destructive">{translations.banned}</Badge>;
      case 'INACTIVE':
        return <Badge variant="secondary">{translations.inactive}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getViolationsBadge = (violations: number) => {
    if (violations >= 3) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {violations}
        </Badge>
      );
    } else if (violations > 0) {
      return <Badge variant="secondary">{violations}</Badge>;
    }
    return <Badge variant="outline">{violations}</Badge>;
  };

  const totalDrivers = drivers.length;
  const bannedDrivers = drivers.filter(d => d.status === 'BANNED').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="hover:bg-white/50 dark:hover:bg-gray-800/50"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {isVietnamese ? 'Quay lại' : 'Back'}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {translations.title}
              </h1>
              <p className="text-muted-foreground">
                {isVietnamese ? 'Quản lý thông tin và trạng thái tài xế' : 'Manage driver information and status'}
              </p>
            </div>
          </div>
          <AdminLanguageThemeControls />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {translations.totalDrivers}
              </CardTitle>
              <Users2 className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalDrivers}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {translations.bannedDrivers}
              </CardTitle>
              <Ban className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{bannedDrivers}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isVietnamese ? 'Hoạt động' : 'Active'}
              </CardTitle>
              <UserCheck className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {drivers.filter(d => d.status === 'ACTIVE').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={translations.search}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder={translations.filterStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translations.all}</SelectItem>
                  <SelectItem value="active">{translations.active}</SelectItem>
                  <SelectItem value="banned">{translations.banned}</SelectItem>
                  <SelectItem value="inactive">{translations.inactive}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">{translations.messages.loading}</p>
              </div>
            ) : filteredDrivers.length === 0 ? (
              <div className="text-center py-12">
                <Users2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{translations.messages.noData}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">{translations.table.no}</TableHead>
                      <TableHead className="w-[80px]">{translations.table.id}</TableHead>
                      <TableHead>{translations.table.name}</TableHead>
                      <TableHead>{translations.table.email}</TableHead>
                      <TableHead>{translations.table.dob}</TableHead>
                      <TableHead className="text-center">{translations.table.violations}</TableHead>
                      <TableHead>{translations.table.status}</TableHead>
                      <TableHead className="text-right">{translations.table.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDrivers.map((driver, index) => (
                      <TableRow key={driver.userId}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{driver.userId}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={driver.avatar} />
                              <AvatarFallback>
                                {driver.fullName?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{driver.fullName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{driver.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {driver.dateOfBirth ? new Date(driver.dateOfBirth).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {getViolationsBadge(driver.violations)}
                        </TableCell>
                        <TableCell>{getStatusBadge(driver.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDriver(driver);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingDriver(driver);
                                setNewStatus(driver.status);
                                setNewRole(driver.role as any);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDriver(driver);
                                setViolationReason('');
                              }}
                            >
                              <ShieldAlert className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{translations.dialog.viewTitle}</DialogTitle>
            </DialogHeader>
            {selectedDriver && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={selectedDriver.avatar} />
                    <AvatarFallback className="text-2xl">
                      {selectedDriver.fullName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">{selectedDriver.fullName}</h3>
                    <p className="text-muted-foreground">{selectedDriver.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">{translations.table.id}</Label>
                    <p className="font-medium">{selectedDriver.userId}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{translations.table.dob}</Label>
                    <p className="font-medium">
                      {selectedDriver.dateOfBirth ? new Date(selectedDriver.dateOfBirth).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{translations.dialog.role}</Label>
                    <p className="font-medium">{selectedDriver.role}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{translations.dialog.status}</Label>
                    <div className="mt-1">{getStatusBadge(selectedDriver.status)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{translations.table.violations}</Label>
                    <div className="mt-1">{getViolationsBadge(selectedDriver.violations)}</div>
                  </div>
                </div>

                {selectedDriver.reasonReport && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <Label className="text-red-900 dark:text-red-100">{translations.dialog.reason}</Label>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                      {selectedDriver.reasonReport}
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setIsViewDialogOpen(false)}>
                {translations.dialog.close}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{translations.dialog.editTitle}</DialogTitle>
              <DialogDescription>
                {isVietnamese 
                  ? 'Cập nhật thông tin tài xế' 
                  : 'Update driver information'}
              </DialogDescription>
            </DialogHeader>
            {editingDriver && (
              <div className="space-y-4">
                <div>
                  <Label>{translations.dialog.status}</Label>
                  <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">{translations.active}</SelectItem>
                      <SelectItem value="BANNED">{translations.banned}</SelectItem>
                      <SelectItem value="INACTIVE">{translations.inactive}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{translations.dialog.role}</Label>
                  <Select value={newRole} onValueChange={(value: any) => setNewRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRIVER">Driver</SelectItem>
                      <SelectItem value="STAFF">Staff</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    {translations.dialog.close}
                  </Button>
                  <Button onClick={handleUpdateDriver}>
                    {translations.dialog.save}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Report Violation Dialog */}
        <Dialog open={!!selectedDriver && !isViewDialogOpen && !isEditDialogOpen} onOpenChange={() => setSelectedDriver(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{translations.dialog.reportTitle}</DialogTitle>
              <DialogDescription>
                {isVietnamese 
                  ? `Báo cáo vi phạm cho ${selectedDriver?.fullName}` 
                  : `Report violation for ${selectedDriver?.fullName}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{translations.dialog.reason}</Label>
                <Textarea
                  placeholder={translations.dialog.reasonPlaceholder}
                  value={violationReason}
                  onChange={(e) => setViolationReason(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedDriver(null)}>
                  {translations.dialog.close}
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => selectedDriver && handleReportViolation(selectedDriver)}
                >
                  {translations.dialog.report}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
