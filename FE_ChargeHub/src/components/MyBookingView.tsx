import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, Zap, Battery, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useBooking, Booking } from '../contexts/BookingContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './ui/pagination';
import { toast } from 'sonner';
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

interface SessionStarting {
  orderId: number;
  vehicleId: number;
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
  const { updateBookingStatus } = useBooking();
  
  // State for real API data
  const [apiBookings, setApiBookings] = useState<Booking[]>([]);
  const [apiOrders, setApiOrders] = useState<OrderResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Show 5 items per page


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
          setApiOrders(orders);
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
        setApiOrders([]);
      }
    } catch (error) {
      console.error("Error fetching user orders:", error);
      setError("Failed to load bookings");
      setApiBookings([]);
      setApiOrders([]);
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

  // Refresh function
  const refreshData = () => {
    fetchUserOrders();
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

  const formatIsoToDateTime = (iso: string) => {
    const d = new Date(iso);
    const date = d.toLocaleDateString();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${date} • ${time}`;
  };

  const formatCurrency = (amount: number) => {
    return language === 'vi' 
      ? `${amount.toLocaleString('vi-VN')}đ`
      : `$${amount.toFixed(2)}`;
  };

  const handleCancelBooking = (bookingId: string)=> {
    updateBookingStatus(bookingId, 'cancelled');
    toast.success(language === 'vi' ? 'Đã hủy đặt chỗ thành công' : 'Booking cancelled successfully');
  };

  const handleStartCharging = async (orderId: number) => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      
      if (!token || !userId) {
        toast.error(language === 'vi' ? 'Vui lòng đăng nhập để bắt đầu sạc' : 'Please login to start charging');
        return;
      }

      // Find the order to check timing
      const order = apiOrders.find(o => o.orderId === orderId);
      if (!order) {
        toast.error(language === 'vi' ? 'Không tìm thấy đặt chỗ' : 'Order not found');
        return;
      }

      // Enhanced time validation with 15-minute spanning
      const timeInfo = getTimeToStartCharging(order.startTime);
      
      if (!timeInfo.canStart) {
        if (timeInfo.isLate) {
          toast.error(language === 'vi' 
            ? `Đã quá giờ sạc ${timeInfo.timeRemaining} phút. Vui lòng đặt chỗ mới.` 
            : `Charging time has passed by ${timeInfo.timeRemaining} minutes. Please book a new session.`
          );
        } else {
          toast.error(language === 'vi' 
            ? `Còn ${timeInfo.timeRemaining} phút nữa mới đến giờ sạc. Vui lòng đợi.` 
            : `Charging starts in ${timeInfo.timeRemaining} minutes. Please wait.`
          );
        }
        return;
      }

      // Show timing information to user
      if (timeInfo.isEarly) {
        toast.info(language === 'vi' 
          ? `Bắt đầu sạc sớm ${timeInfo.timeRemaining} phút so với giờ đặt` 
          : `Starting charging ${timeInfo.timeRemaining} minutes early`
        );
      } else if (timeInfo.minutesUntilStart < 0) {
        toast.info(language === 'vi' 
          ? `Bắt đầu sạc muộn ${timeInfo.timeRemaining} phút so với giờ đặt` 
          : `Starting charging ${timeInfo.timeRemaining} minutes late`
        );
      }

      // Get the first vehicle for the user (you might want to modify this logic)
      const sessionData: SessionStarting = {
        orderId: orderId,
        vehicleId: 3
      };

      const response = await axios.post(`http://localhost:8080/api/sessions/start`, sessionData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        toast.success(language === 'vi' ? 'Bắt đầu sạc thành công!' : 'Charging session started successfully!');
        
        // Update the order status locally to move it from Upcoming to Active
        const sessionId = response.data.data;
        localStorage.setItem("currentSessionId", sessionId);
        localStorage.setItem("currentOrderId", String(orderId));
        console.log("Charging Session Id", sessionId);
        setApiOrders(prevOrders => 
          prevOrders.map(order => 
            order.orderId === orderId 
              ? { ...order, status: 'CHARGING' }
              : order
          )
        );
        
        // Redirect to ChargingSessionView
        if (onStartCharging) {
          onStartCharging(orderId.toString());
        }
      } else {
        toast.error(response.data.message || (language === 'vi' ? 'Không thể bắt đầu sạc' : 'Failed to start charging'));
      }
    } catch (error: any) {
      console.error('Error starting charging session:', error);
      toast.error(error.response?.data?.message || (language === 'vi' ? 'Lỗi khi bắt đầu sạc' : 'Error starting charging session'));
    }
  };

  const isTimeToStartCharging = (startTime: string) => {
    const now = new Date();
    const orderStartTime = new Date(startTime);
    const timeDiff = Math.abs(now.getTime() - orderStartTime.getTime());
    const minutesDiff = timeDiff / (1000 * 60);
    
    // Allow starting 15 minutes before or after the scheduled time
    return minutesDiff <= 15;
  };

  const getTimeToStartCharging = (startTime: string) => {
    const now = new Date();
    const orderStartTime = new Date(startTime);
    const timeDiff = orderStartTime.getTime() - now.getTime();
    const minutesDiff = Math.ceil(timeDiff / (1000 * 60));
    
    return {
      canStart: isTimeToStartCharging(startTime),
      minutesUntilStart: minutesDiff,
      isEarly: minutesDiff > 0,
      isLate: minutesDiff < -15,
      timeRemaining: Math.abs(minutesDiff)
    };
  };

  const isOrderExpired = (startTime: string) => {
    const now = new Date();
    const orderStartTime = new Date(startTime);
    const timeDiff = now.getTime() - orderStartTime.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    // Order expires 15 minutes after the scheduled start time
    return minutesDiff > 15;
  };

  // Pagination helper functions
  const getPaginatedData = (data: OrderResponseDTO[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data: OrderResponseDTO[]) => {
    return Math.ceil(data.length / itemsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to first page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [apiOrders]);

  // Only use API data - no fallback to mock data
  const upcomingBookings = apiBookings.filter(booking => booking.status === 'confirmed');
  const activeBookings = apiBookings.filter(booking => booking.status === 'active');
  const historyBookings = apiBookings.filter(booking => ['completed', 'cancelled'].includes(booking.status));

  // Helpers to filter apiOrders by time-based logic
  const now = new Date();
  
  const apiUpcomingOrders = apiOrders.filter(order => {
    const startTime = new Date(order.startTime);
    const isExpired = isOrderExpired(order.startTime);
    
    // Only show BOOKED orders that haven't expired
    return order.status === 'BOOKED' && !isExpired;
  }).sort((a, b) => {
    const aCanStart = isTimeToStartCharging(a.startTime);
    const bCanStart = isTimeToStartCharging(b.startTime);
    
    // Prioritize orders that can start charging at the top
    if (aCanStart && !bCanStart) return -1;
    if (!aCanStart && bCanStart) return 1;
    
    // For orders with same charging availability, sort by start time (earliest first)
    const aStartTime = new Date(a.startTime);
    const bStartTime = new Date(b.startTime);
    return aStartTime.getTime() - bStartTime.getTime();
  });
  
  const apiActiveOrders = apiOrders.filter(order => {
    // Only show CHARGING orders
    return order.status === 'CHARGING';
  });
  
  const apiHistoryOrders = apiOrders.filter(order => {
    const endTime = new Date(order.endTime);
    const isExpired = isOrderExpired(order.startTime);
    const isPastEndTime = endTime <= now;
    
    // Include COMPLETED, CANCELED orders OR expired BOOKED orders
    return ['COMPLETED', 'CANCELED'].includes(order.status) || 
           (order.status === 'BOOKED' && (isPastEndTime || isExpired));
  });

  // Check if there's an active charging session
  const hasActiveSession = apiActiveOrders.length > 0;
  const activeSession = apiActiveOrders[0]; // Get the first (and should be only) active session


  // Card for raw API orders to show all details
  const OrderCard = ({ order }: { order: OrderResponseDTO }) => {
    const startTime = new Date(order.startTime);
    const endTime = new Date(order.endTime);
    const now = new Date();
    const canStartCharging = isTimeToStartCharging(order.startTime);
    const isExpired = isOrderExpired(order.startTime);
    const timeInfo = getTimeToStartCharging(order.startTime);
    
    // Determine status badge color and icon
    const getStatusInfo = () => {
      if (isExpired) {
        return {
          color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300',
          icon: <XCircle className="w-4 h-4 text-red-500" />,
          text: language === 'vi' ? 'Đã hết hạn' : 'Expired'
        };
      } else if (startTime > now) {
        return {
          color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
          icon: <Clock className="w-4 h-4 text-blue-500" />,
          text: language === 'vi' ? 'Sắp tới' : 'Upcoming'
        };
      } else if (startTime <= now && endTime > now) {
        return {
          color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
          icon: <Zap className="w-4 h-4 text-green-500" />,
          text: language === 'vi' ? 'Đang sạc' : 'Active'
        };
      } else if (startTime <= now && canStartCharging) {
        // Within 15-minute window after start time but not yet in active charging period
        return {
          color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300',
          icon: <Clock className="w-4 h-4 text-orange-500" />,
          text: language === 'vi' ? 'Có thể bắt đầu' : 'Ready to Start'
        };
      } else {
        return {
          color: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300',
          icon: <CheckCircle className="w-4 h-4 text-gray-500" />,
          text: language === 'vi' ? 'Hoàn thành' : 'Completed'
        };
      }
    };

    const statusInfo = getStatusInfo();

    const handleStartChargingClick = () => {
      if (!canStartCharging) {
        if (timeInfo.isLate) {
          toast.error(language === 'vi' 
            ? `Đã quá giờ sạc ${timeInfo.timeRemaining} phút. Vui lòng đặt chỗ mới.` 
            : `Charging time has passed by ${timeInfo.timeRemaining} minutes. Please book a new session.`
          );
        } else {
          toast.error(language === 'vi' 
            ? `Còn ${timeInfo.timeRemaining} phút nữa mới đến giờ sạc. Vui lòng đợi.` 
            : `Charging starts in ${timeInfo.timeRemaining} minutes. Please wait.`
          );
        }
        return;
      }
    };

    const handleViewCharging = () => {
      // Ensure session data is available for ChargingSessionView
      localStorage.setItem("currentOrderId", String(order.orderId));
      
      if (onStartCharging) {
        onStartCharging(String(order.orderId));
      }
    };

    return (
      <Card className={`mb-4 hover:shadow-lg transition-all duration-200 border-l-4 ${
        isExpired 
          ? 'border-l-red-500 bg-red-50/30 dark:bg-red-950/20' 
          : canStartCharging 
            ? 'border-l-green-500 bg-green-50/30 dark:bg-green-950/20' 
            : 'border-l-primary/20'
      }`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg">{order.stationName}</h3>
                <Badge variant="outline" className={`${statusInfo.color} flex items-center gap-1 px-3 py-1`}>
                  {statusInfo.icon}
                  {statusInfo.text}
                </Badge>
                {canStartCharging && (
                  <Badge variant="default" className="bg-green-500 text-white flex items-center gap-1 px-3 py-1 animate-pulse">
                    <Zap className="w-3 h-3" />
                    {language === 'vi' ? 'Sẵn sàng sạc' : 'Ready to Charge'}
                  </Badge>
                )}
                {!canStartCharging && !isExpired && (
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 flex items-center gap-1 px-3 py-1">
                    <Clock className="w-3 h-3" />
                    {timeInfo.isEarly 
                      ? (language === 'vi' ? `Còn ${timeInfo.timeRemaining} phút` : `${timeInfo.timeRemaining} min left`)
                      : (language === 'vi' ? 'Đã hết hạn' : 'Expired')
                    }
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">{order.stationAddress}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">{language === 'vi' ? 'Bắt đầu' : 'Start'}:</span>
                    <span>{formatIsoToDateTime(order.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="font-medium">{language === 'vi' ? 'Kết thúc' : 'End'}:</span>
                    <span>{formatIsoToDateTime(order.endTime)}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">{order.chargingPower}kW • {order.connectorType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Battery className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">{Math.abs(order.energyToCharge)} kWh</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right ml-4">
              <div className="bg-primary/10 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">{language === 'vi' ? 'Giá/kWh' : 'Price/kWh'}</div>
                <div className="font-bold text-lg text-primary">{formatCurrency(order.pricePerKwh)}</div>
                <div className="text-xs text-muted-foreground mt-1">{language === 'vi' ? 'Tổng cộng' : 'Total'}</div>
                <div className="font-semibold text-primary">{formatCurrency(Math.abs(order.estimatedCost))}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground">
              {language === 'vi' ? 'Tạo lúc' : 'Created'}: {new Date(order.createdAt).toLocaleString()}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground">
                ID: #{order.orderId}
              </div>
              {/* Show different buttons based on order status and active session */}
              {order.status === 'CHARGING' ? (
                // Active charging session - show "View Charging" button
                <Button 
                  onClick={handleViewCharging}
                  size="sm" 
                  className="h-7 px-3 text-xs bg-blue-500 hover:bg-blue-600 text-white shadow-md"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  {language === 'vi' ? 'Xem sạc' : 'View Charging'}
                </Button>
              ) : (startTime > now || (startTime <= now && canStartCharging)) && !isExpired ? (
                // Upcoming session - show "Start Charging" button (disabled if active session exists)
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      onClick={handleStartChargingClick}
                      disabled={!canStartCharging || hasActiveSession}
                      size="sm" 
                      className={`h-7 px-3 text-xs ${
                        canStartCharging && !hasActiveSession
                          ? 'bg-green-500 hover:bg-green-600 text-white shadow-md' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      {hasActiveSession 
                        ? (language === 'vi' ? 'Có phiên sạc khác' : 'Other session active')
                        : (language === 'vi' ? 'Bắt đầu sạc' : 'Start Charging')
                      }
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {language === 'vi' ? 'Xác nhận bắt đầu sạc' : 'Confirm Start Charging'}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {hasActiveSession 
                          ? (language === 'vi' 
                              ? 'Bạn đã có một phiên sạc đang hoạt động. Vui lòng kết thúc phiên sạc hiện tại trước khi bắt đầu phiên sạc mới.'
                              : 'You already have an active charging session. Please end the current session before starting a new one.'
                            )
                          : (language === 'vi' 
                              ? `Bạn có chắc chắn muốn bắt đầu phiên sạc tại ${order.stationName}?`
                              : `Are you sure you want to start charging session at ${order.stationName}?`
                            )
                        }
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {language === 'vi' ? 'Hủy' : 'Cancel'}
                      </AlertDialogCancel>
                      {!hasActiveSession && (
                        <AlertDialogAction 
                          onClick={() => handleStartCharging(order.orderId)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          {language === 'vi' ? 'Xác nhận' : 'Confirm'}
                        </AlertDialogAction>
                      )}
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

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
        <div className="w-full px-0 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="p-2 hover:bg-primary/10 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="ml-1 text-sm text-muted-foreground">
                {language === 'vi' ? 'Về Dashboard' : 'Back to Dashboard'}
              </span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refreshData}
              disabled={loading}
              className="p-2 hover:bg-primary/10 rounded-full"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{translations.title}</h1>
              <p className="text-sm text-muted-foreground">
                {language === 'vi' ? 'Quản lý các đặt chỗ trạm sạc của bạn' : 'Manage your charging station bookings'}
                {apiOrders.length > 0 && (
                  <span className="ml-2 text-green-600 dark:text-green-400">
                    ({language === 'vi' ? 'Dữ liệu thực từ database' : 'Real data from database'})
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
            ) : apiUpcomingOrders.length > 0 ? (
              <>
                {/* Show warning when there's an active session */}
                {hasActiveSession && (
                  <Card className="mb-4 border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        <div>
                          <h4 className="font-medium text-orange-800 dark:text-orange-200">
                            {language === 'vi' ? 'Đang sạc' : 'Currently Charging'}
                          </h4>
                          <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                            {language === 'vi' 
                              ? 'Bạn đang có một phiên sạc đang hoạt động. Vui lòng kết thúc phiên sạc hiện tại trước khi bắt đầu phiên sạc mới.'
                              : 'You have an active charging session. Please end the current session before starting a new one.'
                            }
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {getPaginatedData(apiUpcomingOrders).map(order => (
                  <OrderCard key={order.orderId} order={order} />
                ))}
                {getTotalPages(apiUpcomingOrders) > 1 && (
                  <div className="flex justify-center mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: getTotalPages(apiUpcomingOrders) }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem>
                          <PaginationNext 
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            className={currentPage === getTotalPages(apiActiveOrders) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <EmptyState message={translations.noBookings} />
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {loading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState message={error} />
            ) : apiActiveOrders.length > 0 ? (
              <>
                {/* Show info about single active session */}
                <Card className="mb-4 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <h4 className="font-medium text-blue-800 dark:text-blue-200">
                          {language === 'vi' ? 'Phiên sạc đang hoạt động' : 'Active Charging Session'}
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          {language === 'vi' 
                            ? 'Bạn chỉ có thể có một phiên sạc hoạt động tại một thời điểm. Kết thúc phiên sạc này để bắt đầu phiên sạc mới.'
                            : 'You can only have one active charging session at a time. End this session to start a new one.'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {getPaginatedData(apiActiveOrders).map(order => (
                  <OrderCard key={order.orderId} order={order} />
                ))}
                {getTotalPages(apiActiveOrders) > 1 && (
                  <div className="flex justify-center mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: getTotalPages(apiActiveOrders) }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem>
                          <PaginationNext 
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            className={currentPage === getTotalPages(apiActiveOrders) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <EmptyState message={language === 'vi' ? 'Không có phiên sạc nào đang hoạt động' : 'No active charging sessions'} />
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {apiHistoryOrders.length > 0 ? (
              <>
                {getPaginatedData(apiHistoryOrders).map(order => (
                  <OrderCard key={order.orderId} order={order} />
                ))}
                {getTotalPages(apiHistoryOrders) > 1 && (
                  <div className="flex justify-center mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: getTotalPages(apiHistoryOrders) }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem>
                          <PaginationNext 
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            className={currentPage === getTotalPages(apiHistoryOrders) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <EmptyState message={language === 'vi' ? 'Chưa có lịch sử đặt ch��' : 'No booking history'} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}