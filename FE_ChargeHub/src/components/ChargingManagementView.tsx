import React, { useEffect, useState } from 'react';
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
import { toast } from 'sonner';
import { Input as UITextInput } from './ui/input';
import { findAlternativeChargingPoints, changeChargingPoint, getOrdersByStation, getUserProfile, type ChargingPointDTO, type UserDTO } from '../services/api';

interface ChargingManagementViewProps {
    onBack: () => void;
    stationId?: number;
}

export default function ChargingManagementView({ onBack, stationId }: ChargingManagementViewProps) {
    const { language } = useLanguage();
    const { theme } = useTheme();
    const { bookings, updateBookingStatus } = useBooking();
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isChangeDialogOpen, setIsChangeDialogOpen] = useState(false);
    const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false);
    const [alternativePoints, setAlternativePoints] = useState<ChargingPointDTO[]>([]);
    const [selectedAltPointId, setSelectedAltPointId] = useState<number | null>(null);
    const [changeReason, setChangeReason] = useState<string>('Trụ đang bận / sự cố kỹ thuật');
    const [isSubmittingChange, setIsSubmittingChange] = useState(false);
    const [stationOrders, setStationOrders] = useState<any[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [staffStationId, setStaffStationId] = useState<number | null>(null);

    const translations = {
        title: language === 'vi' ? 'Quản Lý Charging' : 'Charging Management',
        subtitle: language === 'vi' ? 'Quản lý tất cả đặt chỗ và phiên sạc của khách hàng' : 'Manage all customer bookings and charging sessions',
        search: language === 'vi' ? 'Tìm kiếm theo tên, ID xe, hoặc trạm...' : 'Search by name, vehicle ID, or station...',
        allStatus: language === 'vi' ? 'Tất cả trạng thái' : 'All Status',
        bookingId: language === 'vi' ? 'ID Đặt chỗ' : 'Booking ID',
        driverName: language === 'vi' ? 'Tên Khách hàng' : 'Driver Name',
        vehicleId: language === 'vi' ? 'Biển Số Xe' : 'Plate Number',
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
            booked: language === 'vi' ? 'Đã Đặt' : 'Booked',
            confirmed: language === 'vi' ? 'Đã Xác Nhận' : 'Confirmed',
            charging: language === 'vi' ? 'Đang Sạc' : 'Charging',
            active: language === 'vi' ? 'Đang Sạc' : 'Active',
            completed: language === 'vi' ? 'Hoàn Thành' : 'Completed',
            cancelled: language === 'vi' ? 'Đã Hủy' : 'Cancelled',
            canceled: language === 'vi' ? 'Đã Hủy' : 'Canceled'
        }
    };

    // Station orders filtered (exclude COMPLETED/CANCELED)
    const stationOrdersFiltered = (stationOrders || [])
        .filter((o: any) => {
            const s = (o.status || '').toString().toUpperCase();
            // Chỉ hiển thị BOOKED và CHARGING, loại bỏ COMPLETED/CANCELED
            return s !== 'COMPLETED' && s !== 'COMPLETE' && 
                   s !== 'CANCELED' && s !== 'CANCELLED';
        })
        .filter((o: any) => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            return (
                (o.orderId?.toString() || '').toLowerCase().includes(term) ||
                (o.userName || '').toLowerCase().includes(term) ||
                (o.vehiclePlate || '').toLowerCase().includes(term) ||
                (o.connectorType || '').toLowerCase().includes(term)
            );
        })
        .filter((o: any) => {
            if (statusFilter === 'all') return true;
            return (o.status || '').toString().toLowerCase() === statusFilter;
        });

    // Note: filteredBookings not used anymore, all data comes from stationOrdersFiltered

    const getStatusBadge = (status: string) => {
        const variants = {
            booked: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
            confirmed: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
            charging: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
            active: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
            completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300',
            cancelled: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300',
            canceled: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300'
        };

        const statusLabel = translations.statusLabels[status as keyof typeof translations.statusLabels] || status;
        const variantClass = variants[status as keyof typeof variants] || variants.booked;

        return (
            <Badge variant="outline" className={variantClass}>
                {statusLabel}
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

    // Load staff's station ID from profile on mount
    useEffect(() => {
        const loadStaffStation = async () => {
            try {
                const userId = localStorage.getItem('userId');
                if (!userId) {
                    toast.error(language === 'vi' ? 'Không tìm thấy userId. Vui lòng đăng nhập lại' : 'userId not found. Please login again');
                    return;
                }

                const response = await getUserProfile(Number(userId));

                if (response.success && response.data?.stationId) {
                    const sid = response.data.stationId;
                    setStaffStationId(sid);
                    localStorage.setItem('stationId', String(sid));
                    console.log('Staff station loaded:', sid, response.data.stationName || '');
                } else {
                    console.warn('Staff has no station assigned:', response);
                    toast.warning(language === 'vi' ? 'Tài khoản chưa được gán trạm' : 'Account has no station assigned');
                }
            } catch (error) {
                console.error('Error loading staff station:', error);
                toast.error(language === 'vi' ? 'Không thể tải thông tin trạm' : 'Cannot load station info');
            }
        };

        loadStaffStation();
    }, [language]);

    // Load station orders (BOOKED, CHARGING) when stationId is available
    useEffect(() => {
        const sid = stationId ?? staffStationId ?? (localStorage.getItem('stationId') ? Number(localStorage.getItem('stationId')) : null);
        if (!sid) return;

        (async () => {
            try {
                setLoadingOrders(true);
                const res = await getOrdersByStation(sid, ['BOOKED', 'CHARGING']);
                setStationOrders(res?.data || []);

                if (res?.data && res.data.length > 0) {
                    toast.success(language === 'vi'
                        ? `Đã tải ${res.data.length} đơn hàng`
                        : `Loaded ${res.data.length} orders`);
                }
            } catch (e: any) {
                console.error('Error loading orders:', e);
                const errorMsg = e?.response?.data?.message || e?.message;
                toast.error(language === 'vi'
                    ? `Không thể tải đơn hàng: ${errorMsg}`
                    : `Cannot load orders: ${errorMsg}`);
            } finally {
                setLoadingOrders(false);
            }
        })();
    }, [stationId, staffStationId, language]);

    const openChangeDialog = async () => {
        if (!selectedBooking) return;
        try {
            setIsChangeDialogOpen(true);
            setIsLoadingAlternatives(true);
            setAlternativePoints([]);
            setSelectedAltPointId(null);

            // Extract orderId and chargingPointId from backend response
            const orderId = selectedBooking.orderId;
            const currentChargingPointId = selectedBooking.chargingPointId;

            // Validate required fields
            if (!orderId || !currentChargingPointId) {
                toast.error(language === 'vi' ? 'Thiếu thông tin đơn đặt chỗ' : 'Missing booking information');
                setIsLoadingAlternatives(false);
                return;
            }

            console.log('Finding alternatives for orderId:', orderId, 'chargingPointId:', currentChargingPointId);
            const res = await findAlternativeChargingPoints(orderId, currentChargingPointId);
            setAlternativePoints(res.data || []);

            if (!res.data || res.data.length === 0) {
                toast.info(language === 'vi' ? 'Không có trụ thay thế khả dụng' : 'No alternative charging points available');
            }
        } catch (e) {
            toast.error(language === 'vi' ? 'Lỗi khi tải trụ thay thế' : 'Failed to load alternative points');
        } finally {
            setIsLoadingAlternatives(false);
        }
    };

    const submitChangeChargingPoint = async () => {
        if (!selectedBooking || !selectedAltPointId) {
            toast.error(language === 'vi' ? 'Vui lòng chọn trụ thay thế' : 'Please select an alternative point');
            return;
        }
        try {
            setIsSubmittingChange(true);

            const orderId = selectedBooking.orderId;
            const currentChargingPointId = selectedBooking.chargingPointId;

            if (!orderId || !currentChargingPointId || !selectedAltPointId) {
                toast.error(language === 'vi' ? 'Thiếu thông tin cần thiết' : 'Missing required information');
                setIsSubmittingChange(false);
                return;
            }

            const maybeStaffId = localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : undefined;
            const payload: any = {
                orderId,
                currentChargingPointId,
                newChargingPointId: selectedAltPointId,
                reason: changeReason,
            };
            if (typeof maybeStaffId === 'number' && !Number.isNaN(maybeStaffId)) {
                payload.staffId = maybeStaffId;
            }

            const res = await changeChargingPoint(payload);
            toast.success(res.message || (language === 'vi' ? 'Đổi trụ sạc thành công' : 'Charging point changed successfully'));
            setIsChangeDialogOpen(false);

            // Reload orders after successful change
            const sid = stationId ?? staffStationId ?? (localStorage.getItem('stationId') ? Number(localStorage.getItem('stationId')) : null);
            if (sid) {
                try {
                    const refreshRes = await getOrdersByStation(sid, ['BOOKED', 'CHARGING']);
                    setStationOrders(refreshRes?.data || []);
                } catch (refreshError) {
                    console.error('Error refreshing orders:', refreshError);
                }
            }
        } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message;
            toast.error(msg || (language === 'vi' ? 'Đổi trụ sạc thất bại' : 'Failed to change charging point'));
        } finally {
            setIsSubmittingChange(false);
        }
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
    const baseList: any[] = stationOrdersFiltered; // do not fallback to mock for stats
    const stats = {
        total: baseList.length,
        active: baseList.filter((b: any) => (b.status || '').toString().toLowerCase() === 'charging' || (b.status || '').toString().toLowerCase() === 'active').length,
        pending: baseList.filter((b: any) => (b.status || '').toString().toLowerCase() === 'booked' || (b.status || '').toString().toLowerCase() === 'confirmed').length,
        completedToday: 0
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

                {/* Bookings Table (station-scoped if available) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Car className="w-5 h-5" />
                            {language === 'vi' ? 'Đơn tại trạm' : 'Station Orders'}
                            <Badge variant="secondary" className="ml-2">
                                {stationOrdersFiltered.length}
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
                                    {stationOrdersFiltered.map((booking: any) => {
                                        return (
                                            <TableRow key={booking.id || booking.orderId} className="hover:bg-muted/50">
                                                <TableCell className="font-mono text-sm">
                                                    {(booking.orderId || booking.id)?.toString().slice(-8)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-muted-foreground" />
                                                        {booking.userName || '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Car className="w-4 h-4 text-muted-foreground" />
                                                        {booking.vehiclePlate || '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {booking.connectorType || '-'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {booking.stationId || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {booking.startTime ? new Date(booking.startTime).toLocaleString() : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge((booking.status || '').toString().toLowerCase())}
                                                </TableCell>
                                                <TableCell>
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setSelectedBooking(booking)}
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
                                                                                <p className="font-medium">{selectedBooking.userName || '-'}</p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-muted-foreground mb-1">{translations.vehicleId}</p>
                                                                                <p className="font-medium">{selectedBooking.vehiclePlate || '-'}</p>
                                                                            </div>
                                                                            <div className="col-span-2">
                                                                                <p className="text-muted-foreground mb-1">{translations.phoneNumber}</p>
                                                                                <p className="font-medium">{selectedBooking.userPhone || '-'}</p>
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
                                                                                <p className="font-medium">{selectedBooking.connectorType || '-'}</p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-muted-foreground mb-1">{translations.stationId}</p>
                                                                                <p className="font-medium">{selectedBooking.chargingPointId || '-'}</p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-muted-foreground mb-1">{translations.scheduledStartTime}</p>
                                                                                <p className="font-medium">
                                                                                    {selectedBooking.startTime
                                                                                        ? new Date(selectedBooking.startTime).toLocaleString()
                                                                                        : '-'}
                                                                                </p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-muted-foreground mb-1">{translations.power}</p>
                                                                                <p className="font-medium">{selectedBooking.chargingPower || 0}kW</p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-muted-foreground mb-1">{translations.currentBattery}</p>
                                                                                <p className="font-medium flex items-center gap-1">
                                                                                    <Battery className="w-4 h-4" />
                                                                                    {selectedBooking.startedBattery || 0}%
                                                                                </p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-muted-foreground mb-1">{translations.targetBattery}</p>
                                                                                <p className="font-medium flex items-center gap-1">
                                                                                    <Battery className="w-4 h-4" />
                                                                                    {selectedBooking.expectedBattery || 0}%
                                                                                </p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-muted-foreground mb-1">{translations.estimatedDuration}</p>
                                                                                <p className="font-medium">{formatDuration(selectedBooking.estimatedDuration || 0)}</p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-muted-foreground mb-1">{translations.estimatedCost}</p>
                                                                                <p className="font-medium">{formatCurrency(selectedBooking.estimatedCost || 0)}</p>
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

                                                                    {/* Actions */}
                                                                    <Separator />
                                                                    <div className="flex items-center justify-between gap-3">
                                                                        {selectedBooking.status === 'confirmed' && (
                                                                            <Button
                                                                                onClick={() => handleStartCharging(selectedBooking.id)}
                                                                                className="gap-2"
                                                                            >
                                                                                <Play className="w-4 h-4" />
                                                                                {translations.startCharging}
                                                                            </Button>
                                                                        )}

                                                                        <Dialog open={isChangeDialogOpen} onOpenChange={setIsChangeDialogOpen}>
                                                                            <DialogTrigger asChild>
                                                                                <Button variant="outline" onClick={openChangeDialog}>
                                                                                    {language === 'vi' ? 'Đổi trụ sạc' : 'Change charger'}
                                                                                </Button>
                                                                            </DialogTrigger>
                                                                            <DialogContent className="max-w-xl">
                                                                                <DialogHeader>
                                                                                    <DialogTitle>{language === 'vi' ? 'Chọn trụ thay thế' : 'Select alternative charger'}</DialogTitle>
                                                                                    <DialogDescription>
                                                                                        {language === 'vi' ? 'Chỉ hiển thị trụ cùng loại đầu nối, cùng trạm và không trùng lịch' : 'Only compatible, same-station and non-conflicting chargers are listed'}
                                                                                    </DialogDescription>
                                                                                </DialogHeader>

                                                                                <div className="space-y-4">
                                                                                    <div className="space-y-2">
                                                                                        <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Chọn trụ mới' : 'Alternative point'}</p>
                                                                                        <Select value={selectedAltPointId ? String(selectedAltPointId) : undefined} onValueChange={(v: string) => setSelectedAltPointId(Number(v))}>
                                                                                            <SelectTrigger>
                                                                                                <SelectValue placeholder={isLoadingAlternatives ? (language === 'vi' ? 'Đang tải...' : 'Loading...') : (language === 'vi' ? 'Chọn trụ' : 'Select point')} />
                                                                                            </SelectTrigger>
                                                                                            <SelectContent>
                                                                                                {alternativePoints.map(p => (
                                                                                                    <SelectItem key={p.chargingPointId} value={String(p.chargingPointId)}>
                                                                                                        {`#${p.chargingPointId} • ${p.typeName || ''} ${p.powerOutput ? `• ${p.powerOutput}kW` : ''}`}
                                                                                                    </SelectItem>
                                                                                                ))}
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                    </div>

                                                                                    <div className="space-y-2">
                                                                                        <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Lý do đổi trụ' : 'Reason'}</p>
                                                                                        <UITextInput value={changeReason} onChange={(e) => setChangeReason(e.target.value)} />
                                                                                    </div>

                                                                                    <div className="flex justify-end gap-2">
                                                                                        <Button variant="outline" onClick={() => setIsChangeDialogOpen(false)}>
                                                                                            {language === 'vi' ? 'Hủy' : 'Cancel'}
                                                                                        </Button>
                                                                                        <Button disabled={isSubmittingChange || !selectedAltPointId} onClick={submitChangeChargingPoint}>
                                                                                            {isSubmittingChange ? (language === 'vi' ? 'Đang đổi...' : 'Changing...') : (language === 'vi' ? 'Xác nhận đổi' : 'Confirm change')}
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>
                                                                            </DialogContent>
                                                                        </Dialog>
                                                                    </div>
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

                            {stationOrdersFiltered.length === 0 && (
                                <div className="text-center py-12">
                                    <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <div className="space-y-2">
                                        <p className="text-muted-foreground">
                                            {language === 'vi' ? 'Hiện tại trạm không có đơn nào' : 'This station has no orders right now'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}