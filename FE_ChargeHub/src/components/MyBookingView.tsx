import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, Zap, Battery, QrCode, Phone, Navigation, MoreHorizontal, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useBooking, Booking } from '../contexts/BookingContext';
import PenaltyFeeDisplay from './PenaltyFeeDisplay';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { toast } from 'sonner';
import { Separator } from './ui/separator';
import axios from 'axios';

interface MyBookingViewProps {
  onBack: () => void;
  onStartCharging?: (bookingId: string) => void;
}

// API Response interfaces
interface OrderResponseDTO {
  orderId: number;
  stationName: string;
  stationAddress: string;
  connectorType: string;
  startTime: string; // ISO string format
  endTime: string; // ISO string format
  estimatedDuration: number;
  energyToCharge: number;
  chargingPower: number;
  pricePerKwh: number;
  estimatedCost: number;
  status: string;
  createdAt: string; // ISO string format
}

interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export default function MyBookingView({ onBack, onStartCharging }: MyBookingViewProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { bookings, updateBookingStatus } = useBooking();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  // State for real API data
  const [apiBookings, setApiBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch real orders from API
  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      
      if (!token || !userId) {
        console.log("No token or userId found");
        return;
      }

      console.log("Fetching user orders for userId:", userId);
      console.log("Token:", token);
      
      const response = await axios.get(`http://localhost:8080/api/orders/my-orders?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("Orders API response:", response.data);
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (response.status === 200 && response.data?.success) {
        const orders: OrderResponseDTO[] = response.data.data || [];
        console.log("Found orders:", orders);
        console.log("Orders length:", orders.length);
        
        if (orders.length > 0) {
          // Convert API data to Booking format
          const convertedBookings: Booking[] = orders.map(order => ({
            id: order.orderId.toString(),
            stationName: order.stationName,
            stationAddress: order.stationAddress,
            date: new Date(order.startTime).toLocaleDateString(),
            time: new Date(order.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            duration: Math.round(order.estimatedDuration / 60), // Convert to minutes
            estimatedCost: order.estimatedCost,
            chargerType: order.connectorType as Booking['chargerType'],
            power: order.chargingPower,
            currentBattery: 0, // Not available in API response
            targetBattery: 0, // Not available in API response
            status: order.status.toLowerCase() as Booking['status'],
            createdAt: order.createdAt
          }));
          
          console.log("Converted bookings:", convertedBookings);
          setApiBookings(convertedBookings);
        } else {
          console.log("No orders found in database");
          setApiBookings([]);
        }
      } else {
        console.log("API error or no success response");
        setApiBookings([]);
      }
    } catch (error) {
      console.error("Error fetching user orders:", error);
      setError("Failed to load bookings");
      setApiBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Load orders on component mount
  useEffect(() => {
    fetchUserOrders();
  }, []);

  // Refresh data when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUserOrders();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Test function to check API directly
  const testAPI = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      
      console.log("=== TESTING API DIRECTLY ===");
      console.log("Token:", token);
      console.log("UserId:", userId);
      
      const response = await axios.get(`http://localhost:8080/api/orders/my-orders?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("=== API RESPONSE ===");
      console.log("Status:", response.status);
      console.log("Data:", response.data);
      
    } catch (error: any) {
      console.error("=== API ERROR ===");
      console.error("Error:", error);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
    }
  };

  // Force refresh function
  const forceRefresh = () => {
    console.log("Force refreshing data...");
    setApiBookings([]); // Clear API data
    fetchUserOrders(); // Fetch fresh data
  };

  const translations = {
    title: language === 'vi' ? 'Đặt chỗ của tôi' : 'My Bookings',
    upcoming: language === 'vi' ? 'Sắp tới' : 'Upcoming',
    active: language === 'vi' ? 'Đang sạc' : 'Active',
    history: language === 'vi' ? 'Lịch sử' : 'History',
    noBookings: language === 'vi' ? 'Chưa có đặt chỗ nào' : 'No bookings yet',
    bookingDetails: language === 'vi' ? 'Chi tiết đặt chỗ' : 'Booking Details',
    cancel: language === 'vi' ? 'Hủy đặt chỗ' : 'Cancel Booking',
    confirmCancel: language === 'vi' ? 'Xác nhận hủy' : 'Confirm Cancellation',
    cancelMessage: language === 'vi' ? 'Bạn có chắc chắn muốn hủy đặt chỗ này không?' : 'Are you sure you want to cancel this booking?',
    navigate: language === 'vi' ? 'Chỉ đường' : 'Navigate',
    showQR: language === 'vi' ? 'Hiển thị QR' : 'Show QR',
    contact: language === 'vi' ? 'Liên hệ' : 'Contact',
    startCharging: language === 'vi' ? 'Bắt đầu sạc' : 'Start Charging',
    estimatedCost: language === 'vi' ? 'Chi phí ước tính' : 'Estimated Cost',
    duration: language === 'vi' ? 'Thời lượng' : 'Duration',
    chargerType: language === 'vi' ? 'Loại sạc' : 'Charger Type',
    targetBattery: language === 'vi' ? 'Pin mục tiêu' : 'Target Battery',
    currentBattery: language === 'vi' ? 'Pin hiện tại' : 'Current Battery',
    minutes: language === 'vi' ? 'phút' : 'minutes',
    hours: language === 'vi' ? 'giờ' : 'hours',
    status: {
      confirmed: language === 'vi' ? 'Đã xác nhận' : 'Confirmed',
      active: language === 'vi' ? 'Đang sạc' : 'Active',
      completed: language === 'vi' ? 'Hoàn thành' : 'Completed',
      cancelled: language === 'vi' ? 'Đã hủy' : 'Cancelled'
    }
  };

  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'active':
        return <Zap className="w-4 h-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300';
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300';
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300';
    }
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

  const formatDateTime = (date: string, time: string) => {
    return `${date} • ${time}`;
  };

  const formatCurrency = (amount: number) => {
    return language === 'vi' 
      ? `${amount.toLocaleString('vi-VN')}đ`
      : `$${amount.toFixed(2)}`;
  };

  const handleCancelBooking = (bookingId: string) => {
    updateBookingStatus(bookingId, 'cancelled');
    toast.success(language === 'vi' ? 'Đã hủy đặt chỗ thành công' : 'Booking cancelled successfully');
  };

  // Use API data if available, otherwise use context data
  const displayBookings = apiBookings.length > 0 ? apiBookings : bookings;
  
  const upcomingBookings = displayBookings.filter(booking => booking.status === 'confirmed');
  const activeBookings = displayBookings.filter(booking => booking.status === 'active');
  const historyBookings = displayBookings.filter(booking => ['completed', 'cancelled'].includes(booking.status));

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium">{booking.stationName}</h3>
              <Badge variant="outline" className={`${getStatusColor(booking.status)} flex items-center gap-1`}>
                {getStatusIcon(booking.status)}
                {translations.status[booking.status]}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <MapPin className="w-4 h-4" />
              <span>{booking.stationAddress}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDateTime(booking.date, booking.time)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(booking.duration)}</span>
              </div>
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedBooking(booking)}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{translations.bookingDetails}</DialogTitle>
              </DialogHeader>
              {selectedBooking && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">{translations.estimatedCost}</p>
                      <p className="font-medium">{formatCurrency(selectedBooking.estimatedCost)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">{translations.chargerType}</p>
                      <p className="font-medium">{selectedBooking.chargerType}</p>
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
                  </div>
                  
                  <Separator />
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Navigation className="w-4 h-4 mr-2" />
                      {translations.navigate}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <QrCode className="w-4 h-4 mr-2" />
                      {translations.showQR}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Phone className="w-4 h-4 mr-2" />
                      {translations.contact}
                    </Button>
                  </div>
                  
                  {selectedBooking.status === 'confirmed' && (
                    <>
                      <Separator />
                      <div className="flex gap-2">
                        {onStartCharging && (
                          <Button 
                            onClick={() => onStartCharging(selectedBooking.id)}
                            size="sm" 
                            className="flex-1"
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            {translations.startCharging}
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="flex-1">
                              <XCircle className="w-4 h-4 mr-2" />
                              {translations.cancel}
                            </Button>
                          </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{translations.confirmCancel}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {translations.cancelMessage}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {language === 'vi' ? 'Không' : 'No'}
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleCancelBooking(selectedBooking.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {language === 'vi' ? 'Có, hủy đặt chỗ' : 'Yes, cancel booking'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>{booking.power}kW</span>
            </div>
            <div className="flex items-center gap-1">
              <Battery className="w-4 h-4 text-blue-500" />
              <span>{booking.currentBattery}% → {booking.targetBattery}%</span>
            </div>
          </div>
          <span className="font-medium text-primary">
            {formatCurrency(booking.estimatedCost)}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
        <Calendar className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  const LoadingState = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
        <Clock className="w-8 h-8 text-muted-foreground animate-spin" />
      </div>
      <p className="text-muted-foreground">
        {language === 'vi' ? 'Đang tải đặt chỗ...' : 'Loading bookings...'}
      </p>
    </div>
  );

  const ErrorState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <p className="text-red-600 dark:text-red-400 mb-4">{message}</p>
      <Button onClick={fetchUserOrders} variant="outline">
        {language === 'vi' ? 'Thử lại' : 'Retry'}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-blue-950 dark:to-green-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="p-2 hover:bg-primary/10 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchUserOrders}
              disabled={loading}
              className="p-2 hover:bg-primary/10 rounded-full"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={testAPI}
              className="p-2 hover:bg-primary/10 rounded-full"
            >
              Test API
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={forceRefresh}
              className="p-2 hover:bg-primary/10 rounded-full"
            >
              Force Refresh
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{translations.title}</h1>
              <p className="text-sm text-muted-foreground">
                {language === 'vi' ? 'Quản lý các đặt chỗ trạm sạc của bạn' : 'Manage your charging station bookings'}
                {apiBookings.length > 0 && (
                  <span className="ml-2 text-green-600 dark:text-green-400">
                    ({language === 'vi' ? 'Dữ liệu thực từ database' : 'Real data from database'})
                  </span>
                )}
                {apiBookings.length === 0 && !loading && !error && (
                  <span className="ml-2 text-orange-600 dark:text-orange-400">
                    ({language === 'vi' ? 'Dữ liệu demo' : 'Demo data'})
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-gray-900">
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {translations.upcoming}
              {upcomingBookings.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                  {upcomingBookings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              {translations.active}
              {activeBookings.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                  {activeBookings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {translations.history}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {loading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState message={error} />
            ) : upcomingBookings.length > 0 ? (
              upcomingBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            ) : (
              <EmptyState message={translations.noBookings} />
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {loading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState message={error} />
            ) : activeBookings.length > 0 ? (
              activeBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            ) : (
              <EmptyState message={language === 'vi' ? 'Không có phiên sạc nào đang hoạt động' : 'No active charging sessions'} />
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {historyBookings.length > 0 ? (
              historyBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            ) : (
              <EmptyState message={language === 'vi' ? 'Chưa có lịch sử đặt ch��' : 'No booking history'} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}