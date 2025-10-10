import React, { useState } from 'react';
import { ArrowLeft, Search, Eye, Play, Clock, Battery, Zap, User, Car, MapPin, Filter, RefreshCw, CheckCircle, Calendar } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useBooking } from '../contexts/BookingContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { toast } from 'sonner@2.0.3';

interface ChargingManagementViewProps {
  onBack: () => void;
}

// Mock driver data for bookings
const mockDriverData = [
  { id: 'booking-sample-1', driverName: 'Nguyễn Văn An', vehicleId: 'VF8-001-HCM', phone: '+84 901 234 567' },
  { id: 'booking-sample-2', driverName: 'Nguyễn Văn An', vehicleId: 'VF8-001-HCM', phone: '+84 901 234 567' },
  { id: 'booking-sample-3', driverName: 'Nguyễn Văn An', vehicleId: 'VF8-001-HCM', phone: '+84 901 234 567' },
  { id: 'booking-sample-4', driverName: 'Nguyễn Văn An', vehicleId: 'VF8-001-HCM', phone: '+84 901 234 567' },
  { id: 'booking-sample-5', driverName: 'Nguyễn Văn An', vehicleId: 'VF8-001-HCM', phone: '+84 901 234 567' },
];

export default function ChargingManagementView({ onBack }: ChargingManagementViewProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { bookings, updateBookingStatus } = useBooking();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const translations = {
    title: language === 'vi' ? 'Quản Lý Charging' : 'Charging Management',
    subtitle: language === 'vi' ? 'Quản lý tất cả đặt chỗ và phiên sạc của khách hàng' : 'Manage all customer bookings and charging sessions',
    search: language === 'vi' ? 'Tìm kiếm theo tên, ID xe, hoặc trạm...' : 'Search by name, vehicle ID, or station...',
    allStatus: language === 'vi' ? 'Tất cả trạng thái' : 'All Status',
    bookingId: language === 'vi' ? 'ID Đặt chỗ' : 'Booking ID',
    driverName: language === 'vi' ? 'Tên Khách hàng' : 'Driver Name',
    vehicleId: language === 'vi' ? 'ID Xe' : 'Vehicle ID',
    connectorType: language === 'vi' ? 'Loại Sạc' : 'Connector Type',
    stationId: language === 'vi' ? 'ID Trạm' : 'Station ID',
    startTime: language === 'vi' ? 'Thời Gian Bắt Đầu' : 'Start Time',
    status: language === 'vi' ? 'Trạng Thái' : 'Status',
    actions: language === 'vi' ? 'Thao Tác' : 'Actions',
    viewDetails: language === 'vi' ? 'Xem Chi Tiết' : 'View Details',
    bookingDetails: language === 'vi' ? 'Chi Tiết Đặt Chỗ' : 'Booking Details',
    startCharging: language === 'vi' ? 'Bắt Đầu Sạc' : 'Start Charging',
    scheduledStartTime: language === 'vi' ? 'Giờ Bắt Đầu Dự Kiến' : 'Scheduled Start Time',
    customerInfo: language === 'vi' ? 'Thông Tin Khách Hàng' : 'Customer Information',
    chargingInfo: language === 'vi' ? 'Thông Tin Sạc' : 'Charging Information',
    phoneNumber: language === 'vi' ? 'Số Điện Thoại' : 'Phone Number',
    targetBattery: language === 'vi' ? 'Pin Mục Tiêu' : 'Target Battery',
    currentBattery: language === 'vi' ? 'Pin Hiện Tại' : 'Current Battery',
    estimatedDuration: language === 'vi' ? 'Thời Lượng Ước Tính' : 'Estimated Duration',
    estimatedCost: language === 'vi' ? 'Chi Phí Ước Tính' : 'Estimated Cost',
    power: language === 'vi' ? 'Công Suất' : 'Power',
    location: language === 'vi' ? 'Địa Điểm' : 'Location',
    totalBookings: language === 'vi' ? 'Tổng Đặt Chỗ' : 'Total Bookings',
    activeCharging: language === 'vi' ? 'Đang Sạc' : 'Active Charging',
    pendingBookings: language === 'vi' ? 'Chờ Xử Lý' : 'Pending Bookings',
    completedToday: language === 'vi' ? 'Hoàn Thành Hôm Nay' : 'Completed Today',
    refresh: language === 'vi' ? 'Làm Mới' : 'Refresh',
    filter: language === 'vi' ? 'Lọc' : 'Filter',
    minutes: language === 'vi' ? 'phút' : 'minutes',
    hours: language === 'vi' ? 'giờ' : 'hours',
    statusLabels: {
      confirmed: language === 'vi' ? 'Đã Xác Nhận' : 'Confirmed',
      active: language === 'vi' ? 'Đang Sạc' : 'Active',
      completed: language === 'vi' ? 'Hoàn Thành' : 'Completed',
      cancelled: language === 'vi' ? 'Đã Hủy' : 'Cancelled'
    }
  };

  // Get driver data for a booking
  const getDriverData = (bookingId: string) => {
    return mockDriverData.find(driver => driver.id === bookingId) || {
      driverName: 'Nguyễn Văn An',
      vehicleId: 'VF8-001-HCM',
      phone: '+84 901 234 567'
    };
  };

  // Filter bookings based on search term and status
  const filteredBookings = bookings.filter(booking => {
    const driverData = getDriverData(booking.id);
    const matchesSearch = searchTerm === '' || 
      booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driverData.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driverData.vehicleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.stationName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      confirmed: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
      active: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
      completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300',
      cancelled: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300'
    };
    
    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants] || variants.confirmed}>
        {translations.statusLabels[status as keyof typeof translations.statusLabels]}
      </Badge>
    );
  };

  const getConnectorTypeLabel = (chargerType: string) => {
    const types = {
      'DC_FAST': 'DC Fast',
      'AC_FAST': 'AC Fast', 
      'AC_SLOW': 'AC Slow'
    };
    return types[chargerType as keyof typeof types] || chargerType;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} ${translations.minutes}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 
      ? `${hours} ${translations.hours} ${remainingMinutes} ${translations.minutes}`
      : `${hours} ${translations.hours}`;
  };

  const formatCurrency = (amount: number) => {
    return language === 'vi' 
      ? `${amount.toLocaleString('vi-VN')}đ`
      : `$${amount.toFixed(2)}`;
  };

  const formatDateTime = (date: string, time: string) => {
    return `${date} • ${time}`;
  };

  const handleStartCharging = (bookingId: string) => {
    updateBookingStatus(bookingId, 'active');
    toast.success(language === 'vi' ? 'Đã bắt đầu phiên sạc thành công' : 'Charging session started successfully');
    setSelectedBooking(null);
  };

  // Calculate stats
  const stats = {
    total: bookings.length,
    active: bookings.filter(b => b.status === 'active').length,
    pending: bookings.filter(b => b.status === 'confirmed').length,
    completedToday: bookings.filter(b => b.status === 'completed').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-blue-950 dark:to-green-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="p-2 hover:bg-primary/10 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">{translations.title}</h1>
              <p className="text-sm text-muted-foreground">{translations.subtitle}</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              {translations.refresh}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{translations.totalBookings}</p>
                  <p className="text-2xl font-semibold">{stats.total}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{translations.activeCharging}</p>
                  <p className="text-2xl font-semibold">{stats.active}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{translations.pendingBookings}</p>
                  <p className="text-2xl font-semibold">{stats.pending}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{translations.completedToday}</p>
                  <p className="text-2xl font-semibold">{stats.completedToday}</p>
                </div>
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={translations.search}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={translations.filter} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{translations.allStatus}</SelectItem>
                    <SelectItem value="confirmed">{translations.statusLabels.confirmed}</SelectItem>
                    <SelectItem value="active">{translations.statusLabels.active}</SelectItem>
                    <SelectItem value="completed">{translations.statusLabels.completed}</SelectItem>
                    <SelectItem value="cancelled">{translations.statusLabels.cancelled}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              {translations.title}
              <Badge variant="secondary" className="ml-2">
                {filteredBookings.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{translations.bookingId}</TableHead>
                    <TableHead>{translations.driverName}</TableHead>
                    <TableHead>{translations.vehicleId}</TableHead>
                    <TableHead>{translations.connectorType}</TableHead>
                    <TableHead>{translations.stationId}</TableHead>
                    <TableHead>{translations.startTime}</TableHead>
                    <TableHead>{translations.status}</TableHead>
                    <TableHead>{translations.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => {
                    const driverData = getDriverData(booking.id);
                    return (
                      <TableRow key={booking.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">
                          {booking.id.slice(-8)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {driverData.driverName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Car className="w-4 h-4 text-muted-foreground" />
                            {driverData.vehicleId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getConnectorTypeLabel(booking.chargerType)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {booking.qrCode}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(booking.date, booking.time)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(booking.status)}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedBooking({ ...booking, ...driverData })}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                {translations.viewDetails}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>{translations.bookingDetails}</DialogTitle>
                                <DialogDescription>
                                  {language === 'vi' 
                                    ? 'Xem thông tin chi tiết và quản lý phiên sạc của khách hàng'
                                    : 'View detailed information and manage customer charging session'
                                  }
                                </DialogDescription>
                              </DialogHeader>
                              {selectedBooking && (
                                <div className="space-y-6">
                                  {/* Customer Information */}
                                  <div>
                                    <h3 className="font-medium mb-3 flex items-center gap-2">
                                      <User className="w-4 h-4" />
                                      {translations.customerInfo}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <p className="text-muted-foreground mb-1">{translations.driverName}</p>
                                        <p className="font-medium">{selectedBooking.driverName}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground mb-1">{translations.vehicleId}</p>
                                        <p className="font-medium">{selectedBooking.vehicleId}</p>
                                      </div>
                                      <div className="col-span-2">
                                        <p className="text-muted-foreground mb-1">{translations.phoneNumber}</p>
                                        <p className="font-medium">{selectedBooking.phone}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <Separator />

                                  {/* Charging Information */}
                                  <div>
                                    <h3 className="font-medium mb-3 flex items-center gap-2">
                                      <Zap className="w-4 h-4" />
                                      {translations.chargingInfo}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <p className="text-muted-foreground mb-1">{translations.connectorType}</p>
                                        <p className="font-medium">{getConnectorTypeLabel(selectedBooking.chargerType)}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground mb-1">{translations.stationId}</p>
                                        <p className="font-medium">{selectedBooking.qrCode}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground mb-1">{translations.scheduledStartTime}</p>
                                        <p className="font-medium">{formatDateTime(selectedBooking.date, selectedBooking.time)}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground mb-1">{translations.power}</p>
                                        <p className="font-medium">{selectedBooking.power}kW</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground mb-1">{translations.currentBattery}</p>
                                        <p className="font-medium flex items-center gap-1">
                                          <Battery className="w-4 h-4" />
                                          {selectedBooking.currentBattery}%
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground mb-1">{translations.targetBattery}</p>
                                        <p className="font-medium flex items-center gap-1">
                                          <Battery className="w-4 h-4" />
                                          {selectedBooking.targetBattery}%
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground mb-1">{translations.estimatedDuration}</p>
                                        <p className="font-medium">{formatDuration(selectedBooking.duration)}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground mb-1">{translations.estimatedCost}</p>
                                        <p className="font-medium">{formatCurrency(selectedBooking.estimatedCost)}</p>
                                      </div>
                                      <div className="col-span-2">
                                        <p className="text-muted-foreground mb-1">{translations.location}</p>
                                        <p className="font-medium flex items-center gap-1">
                                          <MapPin className="w-4 h-4" />
                                          {selectedBooking.stationName} - {selectedBooking.stationAddress}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Button */}
                                  {selectedBooking.status === 'confirmed' && (
                                    <>
                                      <Separator />
                                      <div className="flex justify-end">
                                        <Button 
                                          onClick={() => handleStartCharging(selectedBooking.id)}
                                          className="gap-2"
                                        >
                                          <Play className="w-4 h-4" />
                                          {translations.startCharging}
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {filteredBookings.length === 0 && (
                <div className="text-center py-12">
                  <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {language === 'vi' ? 'Không tìm thấy đặt chỗ nào' : 'No bookings found'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}