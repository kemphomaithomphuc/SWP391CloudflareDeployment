import React, { useState, useEffect, useRef } from 'react';
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
import api, { cancelOrder, CancelOrderDTO } from "../services/api";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from "./ui/pagination";

interface MyBookingViewProps {
  onBack: () => void;
  onStartCharging?: (bookingId: string) => void;
}

// API Response interfaces
interface OrderResponseDTO {
  orderId: number;
  
  // Station & Charging Point info
  stationId?: number;
  chargingPointId?: number;
  chargingPointName?: string;  // ✅ NEW - Tên charging point (e.g., "A1", "B2")
  stationName: string;
  stationAddress: string;
  connectorType: string;
  
  // User info
  userId?: number;
  userName?: string;
  userPhone?: string;
  
  // Vehicle info
  vehicleId?: number;
  vehiclePlate?: string;
  vehicleModel?: string;
  
  // Battery info
  startedBattery?: number;
  expectedBattery?: number;
  
  // Time info
  startTime: string; // ISO string format
  endTime: string; // ISO string format
  estimatedDuration: number;
  
  // Charging info
  energyToCharge: number;
  chargingPower: number;
  pricePerKwh: number;
  estimatedCost: number;
  
  // Status
  status: string;
  createdAt: string; // ISO string format
}

interface SessionStarting {
  orderId: number;
  vehicleId: number;
  userLatitude: number;
  userLongitude: number;
}

interface StationInfoStoragePayload {
  stationId?: number;
  stationName?: string;
  stationAddress?: string;
  connectorType?: string;
  chargingPower?: number;
  pricePerKwh?: number;
  timestamp: string;
}

interface UserVehicle {
  vehicleId: number;
  plateNumber?: string;
  brand?: string;
  model?: string;
}

interface TransactionHistoryItem {
  transactionId: number;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  paymentTime: string | null;
  userId: number;
  userName: string;
  userEmail: string;
  sessionId: number;
  sessionStartTime: string;
  sessionEndTime: string;
  powerConsumed: number;
  stationName: string;
  stationAddress: string;
  vnpayTransactionNo: string | null;
  vnpayBankCode: string | null;
}

interface TransactionHistoryResponse {
  transactions: TransactionHistoryItem[];
  totalElements: number;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
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
  const [userVehicles, setUserVehicles] = useState<UserVehicle[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);
  const [itemsPerPage] = useState(5); // Show 5 items per page
  const [transactionPageSize] = useState(10); // Show 10 transactions per page

  // Transaction filters
  const [transactionFilters, setTransactionFilters] = useState({
    status: '',
    paymentMethod: '',
    fromDate: '',
    toDate: '',
    stationId: '',
    sortBy: 'createdAt',
    sortDirection: 'desc'
  });
  const chargingNavigationRef = useRef<string | null>(null);

  const persistStationInfoFromOrder = (order: OrderResponseDTO) => {
    const stationInfoPayload: StationInfoStoragePayload = {
      timestamp: new Date().toISOString()
    };

    if (typeof order.stationName === 'string' && order.stationName.trim().length > 0) {
      stationInfoPayload.stationName = order.stationName;
    }
    if (typeof order.stationAddress === 'string' && order.stationAddress.trim().length > 0) {
      stationInfoPayload.stationAddress = order.stationAddress;
    }
    if (typeof order.stationId === 'number' && !isNaN(order.stationId)) {
      stationInfoPayload.stationId = order.stationId;
    }
    if (typeof order.connectorType === 'string' && order.connectorType.trim().length > 0) {
      stationInfoPayload.connectorType = order.connectorType;
    }
    if (typeof order.chargingPower === 'number' && !isNaN(order.chargingPower)) {
      stationInfoPayload.chargingPower = order.chargingPower;
    }
    if (typeof order.pricePerKwh === 'number' && !isNaN(order.pricePerKwh)) {
      stationInfoPayload.pricePerKwh = order.pricePerKwh;
    }

    try {
      localStorage.setItem("currentStationInfo", JSON.stringify(stationInfoPayload));
      if (stationInfoPayload.stationId !== undefined && stationInfoPayload.stationId !== null) {
        localStorage.setItem("currentStationId", String(stationInfoPayload.stationId));
      }
    } catch (storageError) {
      console.error("Error storing station info:", storageError);
    }
  };

  const ensureSessionForOrder = async (order: OrderResponseDTO, options?: { showToast?: boolean }) => {
    const showToast = options?.showToast ?? true;
    try {
      const response = await api.get(`/api/sessions/by-order/${order.orderId}`);
      const sessionData = response.data?.data;
      if (response.status === 200 && response.data?.success && sessionData?.sessionId) {
        localStorage.setItem("currentSessionId", sessionData.sessionId.toString());
        return sessionData.sessionId.toString();
      }

      if (showToast) {
        toast.error(language === 'vi'
          ? 'Không tìm thấy phiên sạc cho đơn này.'
          : 'Charging session not found for this order.');
      }
    } catch (error: any) {
      console.error("Error fetching session for order:", error);
      if (showToast) {
        const message = error?.response?.data?.message || error.message || (language === 'vi'
          ? 'Không thể lấy thông tin phiên sạc.'
          : 'Unable to retrieve charging session information.');
        toast.error(message);
      }
    }
    return null;
  };

  const navigateToChargingSession = async (order: OrderResponseDTO, options?: { showToast?: boolean }) => {
    persistStationInfoFromOrder(order);
    localStorage.setItem("currentOrderId", String(order.orderId));
    chargingNavigationRef.current = String(order.orderId);

    await ensureSessionForOrder(order, options);
    if (onStartCharging) {
      onStartCharging(String(order.orderId));
    }
  };


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

      let vehicles: UserVehicle[] = [];

      const [vehiclesResponse, ordersResponse] = await Promise.all([
        api.get(`/api/user/${userId}/vehicles`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(error => {
          console.error("Error fetching user vehicles:", error);
          return null;
        }),
        api.get(`api/orders/my-orders?userId=${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (vehiclesResponse?.data?.success && Array.isArray(vehiclesResponse.data.data)) {
        vehicles = vehiclesResponse.data.data.map((vehicle: any) => ({
          vehicleId: vehicle.vehicleId ?? vehicle.id,
          plateNumber: vehicle.plateNumber,
          brand: vehicle.carModel?.brand,
          model: vehicle.carModel?.model,
        }));
        setUserVehicles(vehicles);
        console.log("Fetched user vehicles:", vehicles);
      } else {
        setUserVehicles([]);
      }

      if (ordersResponse?.status === 200 && ordersResponse.data?.success) {
        const orders: OrderResponseDTO[] = ordersResponse.data.data || [];
        console.log("Found orders:", orders);
        console.log("Orders length:", orders.length);
        console.log("Raw orders data:", JSON.stringify(orders, null, 2));

        const enrichedOrders = orders.map(order => {
          if (order.vehicleId) return order;

          const matchByPlate = order.vehiclePlate
            ? vehicles.find(v => v.plateNumber?.toLowerCase() === order.vehiclePlate?.toLowerCase())
            : undefined;

          const fallbackVehicle = matchByPlate?.vehicleId ?? vehicles[0]?.vehicleId;

          if (fallbackVehicle != null) {
            return {
              ...order,
              vehicleId: fallbackVehicle,
            };
          }

          return order;
        });

        setApiOrders(enrichedOrders);
        
        if (orders.length > 0) {
          // Convert API data to Booking format
          const convertedBookings: Booking[] = enrichedOrders.map(order => {
            // Map API status to Booking status
            let bookingStatus: Booking['status'];
            switch (order.status) {
              case 'BOOKED':
                bookingStatus = 'confirmed';
                break;
              case 'CHARGING':
                bookingStatus = 'active';
                break;
              case 'COMPLETED':
                bookingStatus = 'completed';
                break;
              case 'CANCELED':
                bookingStatus = 'cancelled';
                break;
              default:
                bookingStatus = 'confirmed';
                break;
            }

            return {
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
              status: bookingStatus,
            createdAt: order.createdAt
            };
          });
          
          console.log("Converted bookings:", convertedBookings);
          console.log("Booking statuses:", convertedBookings.map(b => ({ id: b.id, status: b.status })));
          
          // Debug: Show status mapping
          console.log("=== STATUS MAPPING VERIFICATION ===");
          enrichedOrders.forEach(order => {
            const convertedBooking = convertedBookings.find(b => b.id === order.orderId.toString());
            console.log(`Order ${order.orderId}: API status "${order.status}" -> Booking status "${convertedBooking?.status}"`);
          });
          
          setApiBookings(convertedBookings);
          
          // Additional debug: Show the mapping
          console.log("=== STATUS MAPPING DEBUG ===");
          enrichedOrders.forEach(order => {
            console.log(`Order ${order.orderId}: ${order.status} -> ${convertedBookings.find(b => b.id === order.orderId.toString())?.status}`);
          });
          
          console.log("✅ Successfully loaded and converted", enrichedOrders.length, "orders");
        } else {
          console.log("No orders found in database");
          setApiBookings([]);
        }
      } else {
        console.log("API error or no success response");
        setApiBookings([]);
        setApiOrders([]);
      }
    } catch (error: any) {
      console.error("Error fetching user orders:", error);
      if (error.response?.status === 401) {
        setError("Please log in again to view your bookings");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userId");
      } else if (error.response?.status === 500) {
        setError("Server error. Please try again later.");
      } else {
        setError("Failed to load bookings. Please check your connection.");
      }
      setApiBookings([]);
      setApiOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch transaction history from API
  const fetchTransactionHistory = async () => {
    try {
      setTransactionLoading(true);
      setTransactionError(null);

      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        console.log("No token or userId found for transactions");
        setTransactionError("Please log in to view transaction history");
        return;
      }

      console.log("Fetching transaction history for userId:", userId);

      // Build query parameters
      const params = new URLSearchParams({
        userId: userId,
        page: transactionPage.toString(),
        pageSize: transactionPageSize.toString(),
        sortBy: transactionFilters.sortBy,
        sortDirection: transactionFilters.sortDirection
      });

      // Add optional filters
      if (transactionFilters.status) params.append('status', transactionFilters.status);
      if (transactionFilters.paymentMethod) params.append('paymentMethod', transactionFilters.paymentMethod);
      if (transactionFilters.fromDate) params.append('fromDate', transactionFilters.fromDate);
      if (transactionFilters.toDate) params.append('toDate', transactionFilters.toDate);
      if (transactionFilters.stationId) params.append('stationId', transactionFilters.stationId);

      const response = await api.get(`/api/transactions/history?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data?.success) {
        const apiPayload = response.data.data;
        const transactions = apiPayload?.transactions ?? [];

        console.log("Fetched transaction history:", {
          totalElements: apiPayload?.totalElements,
          transactionsCount: transactions.length,
          transactions
        });

        setTransactionHistory(transactions);
      } else {
        console.log("Transaction API error or no success response");
        setTransactionHistory([]);
      }
    } catch (error: any) {
      console.error("Error fetching transaction history:", error);
      if (error.response?.status === 401) {
        setTransactionError("Please log in again to view transaction history");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userId");
      } else if (error.response?.status === 500) {
        setTransactionError("Server error. Please try again later.");
      } else {
        setTransactionError("Failed to load transaction history. Please check your connection.");
      }
      setTransactionHistory([]);
    } finally {
      setTransactionLoading(false);
    }
  };

  useEffect(() => {
    if (!onStartCharging || apiOrders.length === 0) {
      return;
    }

    const chargingOrder = apiOrders.find(order => order.status === 'CHARGING');
    if (!chargingOrder) {
      return;
    }

    const orderKey = chargingOrder.orderId?.toString();
    if (!orderKey || chargingNavigationRef.current === orderKey) {
      return;
    }

    // Persist station info and session context silently, then navigate
    void navigateToChargingSession(chargingOrder, { showToast: false });
  }, [apiOrders, onStartCharging]);

  // Load orders on component mount
  useEffect(() => {
    console.log("Component mounted, fetching user orders...");
    fetchUserOrders();
  }, []);

  // Load transaction history when filters or page changes
  useEffect(() => {
    fetchTransactionHistory();
  }, [transactionPage, transactionFilters]);

  // Refresh data when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("Component became visible, refreshing data...");
        fetchUserOrders();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Refresh function
  const refreshData = () => {
    console.log("Manual refresh triggered");
    fetchUserOrders();
  };

  const translations = {
    title: language === 'vi' ? 'Đặt chỗ của tôi' : 'My Bookings',
    upcoming: language === 'vi' ? 'Sắp tới' : 'Upcoming',
    active: language === 'vi' ? 'Đang sạc' : 'Active',
    history: language === 'vi' ? 'Lịch sử đặt chỗ' : 'Booking History',
    transactions: language === 'vi' ? 'Lịch sử giao dịch' : 'Transaction History',
    noBookings: language === 'vi' ? 'Chưa có đặt chỗ nào' : 'No bookings yet',
    noTransactions: language === 'vi' ? 'Chưa có giao dịch nào' : 'No transactions yet',
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

  const handleCancelBooking = async (orderId: number) => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      
      if (!token || !userId) {
        toast.error(language === 'vi' ? 'Vui lòng đăng nhập để hủy đặt chỗ' : 'Please login to cancel booking');
        return;
      }

      console.log("=== CANCEL ORDER DEBUG ===");
      console.log("Canceling order ID:", orderId);
      console.log("User ID:", userId);

      const cancelRequest: CancelOrderDTO = {
        orderId: orderId,
        userId: parseInt(userId),
        reason: language === 'vi' ? 'Người dùng hủy đặt chỗ' : 'User cancelled booking'
      };

      console.log("Cancel request:", cancelRequest);

      const response = await cancelOrder(cancelRequest);
      
      if (response.success) {
        console.log("Cancel order successful:", response.data);
        toast.success(language === 'vi' ? 'Đã hủy đặt chỗ thành công' : 'Booking cancelled successfully');
        
        // Refresh the orders list
        await fetchUserOrders();
      } else {
        console.error("Cancel order failed:", response.message);
        toast.error(response.message || (language === 'vi' ? 'Hủy đặt chỗ thất bại' : 'Failed to cancel booking'));
      }
    } catch (error: any) {
      console.error("=== CANCEL ORDER ERROR ===");
      console.error("Error:", error);
      console.error("Error response:", error?.response);
      console.error("Error response data:", error?.response?.data);
      
      let errorMessage = language === 'vi' ? 'Hủy đặt chỗ thất bại' : 'Failed to cancel booking';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.status === 401) {
        errorMessage = language === 'vi' ? 'Phiên đăng nhập đã hết hạn' : 'Session expired';
      } else if (error?.response?.status === 500) {
        errorMessage = language === 'vi' ? 'Lỗi máy chủ' : 'Server error';
      }
      
      toast.error(errorMessage);
    }
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

      // Get user location for distance check
      console.log("=== Getting user location ===");
      
      let position: GeolocationPosition;
      try {
        position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
      } catch (locationError: any) {
        console.error("Location error:", locationError);
        if (locationError?.code === 1) {
          toast.error(
            language === 'vi'
              ? 'Cần quyền truy cập vị trí để bắt đầu sạc. Vui lòng cho phép truy cập vị trí trong trình duyệt.'
              : 'Location permission required to start charging. Please allow location access in your browser.'
          );
        } else if (locationError?.code === 3) {
          toast.error(
            language === 'vi'
              ? 'Không thể lấy vị trí (timeout). Vui lòng thử lại.'
              : 'Cannot get location (timeout). Please try again.'
          );
        } else {
          toast.error(
            language === 'vi'
              ? 'Không thể lấy vị trí. Vui lòng bật GPS và thử lại.'
              : 'Cannot get location. Please enable GPS and try again.'
          );
        }
        return;
      }

      const userLatitude = position.coords.latitude;
      const userLongitude = position.coords.longitude;
      console.log("User location:", { userLatitude, userLongitude });

      // Persist station info for ChargingSessionView
      persistStationInfoFromOrder(order);

      // Get vehicleId from order (from DB, not hardcoded)
      let vehicleId = order.vehicleId;
      if (!vehicleId) {
        const matchByPlate = order.vehiclePlate
          ? userVehicles.find(v => v.plateNumber?.toLowerCase() === order.vehiclePlate?.toLowerCase())
          : undefined;

        vehicleId = matchByPlate?.vehicleId ?? userVehicles[0]?.vehicleId;
      }

      if (!vehicleId) {
        toast.error(language === 'vi' ? 'Không tìm thấy thông tin xe trong đơn đặt' : 'Vehicle information not found in order');
        return;
      }

      const sessionData: SessionStarting = {
        orderId: orderId,
        vehicleId: vehicleId,
        userLatitude: userLatitude,
        userLongitude: userLongitude
      };

      console.log("=== Starting session with data ===", sessionData);

      const response = await api.post(`/api/sessions/start`, sessionData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        toast.success(language === 'vi' ? 'Bắt đầu sạc thành công!' : 'Charging session started successfully!');
        
        // Update the order status locally to move it from Upcoming to Active
        const sessionId = response.data.data;
        localStorage.setItem("currentSessionId", sessionId.toString());
        localStorage.setItem("currentOrderId", String(orderId));
        console.log("✅ Charging Session Id:", sessionId);
        
        setApiOrders(prevOrders => 
          prevOrders.map(order => 
            order.orderId === orderId 
              ? { ...order, status: 'CHARGING' }
              : order
          )
        );
        
        // Redirect to ChargingSessionView using orderId
        if (onStartCharging) {
          chargingNavigationRef.current = String(orderId);
          onStartCharging(String(orderId));
        }
      } else {
        toast.error(response.data.message || (language === 'vi' ? 'Không thể bắt đầu sạc' : 'Failed to start charging'));
      }
    } catch (error: any) {
      console.error('Error starting charging session:', error);
      
      // Enhanced error handling
      const errorMsg = error.response?.data?.message;
      
      if (error.response?.status === 400) {
        if (errorMsg?.includes('too far') || errorMsg?.includes('distance') || errorMsg?.includes('meters')) {
          toast.error(
            language === 'vi'
              ? 'Bạn quá xa trạm sạc (>100m). Vui lòng di chuyển gần hơn.'
              : 'You are too far from the station (>100m). Please move closer.'
          );
        } else if (errorMsg?.includes('time slot') || errorMsg?.includes('Out of booking')) {
          toast.error(
            language === 'vi'
              ? 'Ngoài thời gian đặt chỗ. Đơn đã bị hủy với phí phạt.'
              : 'Out of booking time slot. Order canceled with penalty.'
          );
        } else if (errorMsg?.includes('location') || errorMsg?.includes('required')) {
          toast.error(
            language === 'vi'
              ? 'Vị trí không hợp lệ. Vui lòng bật GPS và thử lại.'
              : 'Invalid location. Please enable GPS and try again.'
          );
        } else {
          toast.error(errorMsg || (language === 'vi' ? 'Không thể bắt đầu sạc' : 'Failed to start charging'));
        }
      } else if (error.response?.status === 401) {
        toast.error(language === 'vi' ? 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' : 'Session expired. Please login again.');
      } else {
        toast.error(errorMsg || (language === 'vi' ? 'Lỗi khi bắt đầu sạc' : 'Error starting charging session'));
      }
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
    // Show all BOOKED orders regardless of time
    // BOOKED orders should always be in Upcoming until they become CHARGING, COMPLETED, or CANCELED
    return order.status === 'BOOKED';
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
    // Only include orders that are actually COMPLETED or CANCELED
    // BOOKED orders should stay in Upcoming even if their time has passed
    return ['COMPLETED', 'CANCELED'].includes(order.status);
  });

  // Check if there's an active charging session
  const hasActiveSession = apiActiveOrders.length > 0;
  const activeSession = apiActiveOrders[0]; // Get the first (and should be only) active session

  // Debug: Log current state
  console.log("=== MY BOOKING VIEW DEBUG ===");
  console.log("apiOrders length:", apiOrders.length);
  console.log("apiBookings length:", apiBookings.length);
  console.log("apiOrders:", apiOrders);
  console.log("apiBookings:", apiBookings);
  console.log("upcomingBookings length:", upcomingBookings.length);
  console.log("activeBookings length:", activeBookings.length);
  console.log("historyBookings length:", historyBookings.length);
  console.log("apiUpcomingOrders length:", apiUpcomingOrders.length);
  console.log("apiActiveOrders length:", apiActiveOrders.length);
  console.log("apiHistoryOrders length:", apiHistoryOrders.length);
  
  // Debug: Show which tab each order appears in
  console.log("=== TAB ASSIGNMENT VERIFICATION ===");
  console.log("Upcoming tab orders:", apiUpcomingOrders.map(o => ({ id: o.orderId, status: o.status })));
  console.log("Active tab orders:", apiActiveOrders.map(o => ({ id: o.orderId, status: o.status })));
  console.log("History tab orders:", apiHistoryOrders.map(o => ({ id: o.orderId, status: o.status })));

  // Function to verify database data directly
  const verifyDatabaseData = async () => {
    try {
      console.log("=== VERIFYING DATABASE DATA ===");
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      
      if (!token || !userId) {
        console.error("No token or userId found");
        return;
      }

      console.log("Fetching fresh data from database...");
      const response = await api.get(`api/orders/my-orders?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("Fresh API response:", response.data);
      console.log("Response status:", response.status);
      console.log("Response success:", response.data?.success);
      console.log("Raw data array:", response.data?.data);
      
      if (response.data?.data) {
        console.log("Database orders count:", response.data.data.length);
        response.data.data.forEach((order: any, index: number) => {
          console.log(`Database Order ${index + 1}:`, {
            orderId: order.orderId,
            status: order.status,
            stationName: order.stationName,
            startTime: order.startTime,
            endTime: order.endTime,
            createdAt: order.createdAt
          });
        });
        
        // Compare with current displayed data
        console.log("=== COMPARISON WITH DISPLAYED DATA ===");
        console.log("Database orders:", response.data.data.length);
        console.log("Currently displayed orders:", apiOrders.length);
        
        if (response.data.data.length !== apiOrders.length) {
          console.warn("⚠️ Count mismatch between database and displayed data");
          console.log("Database order IDs:", response.data.data.map((o: any) => o.orderId));
          console.log("Displayed order IDs:", apiOrders.map(o => o.orderId));
        }
        
        // Check for missing orders
        const dbOrderIds = response.data.data.map((o: any) => o.orderId);
        const displayedOrderIds = apiOrders.map(o => o.orderId);
        const missingOrders = dbOrderIds.filter((id: any) => !displayedOrderIds.includes(id));
        const extraOrders = displayedOrderIds.filter((id: any) => !dbOrderIds.includes(id));
        
        if (missingOrders.length > 0) {
          console.warn("⚠️ Missing orders in display:", missingOrders);
        }
        if (extraOrders.length > 0) {
          console.warn("⚠️ Extra orders in display:", extraOrders);
        }
      }
    } catch (error) {
      console.error("Error verifying database data:", error);
    }
  };

  // Debug button to log current state
  const handleDebugClick = () => {
    console.log("=== DEBUG BUTTON CLICKED ===");
    console.log("Current apiOrders:", JSON.stringify(apiOrders, null, 2));
    console.log("Current apiBookings:", JSON.stringify(apiBookings, null, 2));
    console.log("Current apiUpcomingOrders:", JSON.stringify(apiUpcomingOrders, null, 2));
    console.log("Current apiActiveOrders:", JSON.stringify(apiActiveOrders, null, 2));
    console.log("Current apiHistoryOrders:", JSON.stringify(apiHistoryOrders, null, 2));
    
    // Show summary
    console.log("=== SUMMARY ===");
    console.log(`Total orders: ${apiOrders.length}`);
    console.log(`Upcoming: ${apiUpcomingOrders.length}`);
    console.log(`Active: ${apiActiveOrders.length}`);
    console.log(`History: ${apiHistoryOrders.length}`);
    
    // Show status mapping
    console.log("=== STATUS MAPPING ===");
    apiOrders.forEach(order => {
      console.log(`Order ${order.orderId}: ${order.status}`);
    });
    
    // Show filtering logic
    console.log("=== FILTERING LOGIC ===");
    console.log("Upcoming filter: BOOKED (all BOOKED orders)");
    console.log("Active filter: CHARGING");
    console.log("History filter: COMPLETED || CANCELED");
    
    // Show time-based filtering
    console.log("=== TIME-BASED FILTERING ===");
    const now = new Date();
    apiOrders.forEach(order => {
      const startTime = new Date(order.startTime);
      const endTime = new Date(order.endTime);
      const isExpired = isOrderExpired(order.startTime);
      const isPastEndTime = endTime <= now;
      console.log(`Order ${order.orderId}: start=${startTime.toISOString()}, end=${endTime.toISOString()}, expired=${isExpired}, pastEnd=${isPastEndTime}`);
    });
    
    // Show which tab each order should appear in
    console.log("=== TAB ASSIGNMENT ===");
    apiOrders.forEach(order => {
      const startTime = new Date(order.startTime);
      const endTime = new Date(order.endTime);
      const isExpired = isOrderExpired(order.startTime);
      const isPastEndTime = endTime <= now;
      
      let tab = "Unknown";
      if (order.status === 'BOOKED') {
        tab = "Upcoming";
      } else if (order.status === 'CHARGING') {
        tab = "Active";
      } else if (['COMPLETED', 'CANCELED'].includes(order.status)) {
        tab = "History";
      }
      
      console.log(`Order ${order.orderId}: ${order.status} -> ${tab}`);
    });
    
    // Show raw vs processed data comparison
    console.log("=== RAW VS PROCESSED DATA COMPARISON ===");
    console.log("Raw API orders:", apiOrders);
    console.log("Processed bookings:", apiBookings);
    console.log("Filtered upcoming orders:", apiUpcomingOrders);
    console.log("Filtered active orders:", apiActiveOrders);
    console.log("Filtered history orders:", apiHistoryOrders);
    
    // Show data integrity check
    console.log("=== DATA INTEGRITY CHECK ===");
    console.log("Total API orders:", apiOrders.length);
    console.log("Total processed bookings:", apiBookings.length);
    console.log("Total filtered orders:", apiUpcomingOrders.length + apiActiveOrders.length + apiHistoryOrders.length);
    
    if (apiOrders.length !== apiBookings.length) {
      console.warn("⚠️ Mismatch: API orders count != processed bookings count");
    }
    
    if (apiOrders.length !== (apiUpcomingOrders.length + apiActiveOrders.length + apiHistoryOrders.length)) {
      console.warn("⚠️ Mismatch: Some orders are not being filtered into any tab");
    }
  };


  // Card for raw API orders to show all details
  const OrderCard = ({ order }: { order: OrderResponseDTO }) => {
    const startTime = new Date(order.startTime);
    const endTime = new Date(order.endTime);
    const now = new Date();
    const canStartCharging = isTimeToStartCharging(order.startTime);
    const isExpired = isOrderExpired(order.startTime);
    const timeInfo = getTimeToStartCharging(order.startTime);
    
    // Determine status badge color and icon based on actual order status
    const getStatusInfo = () => {
      // Check actual order status first
      if (order.status === 'COMPLETED') {
        return {
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300',
          icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
          text: language === 'vi' ? 'Hoàn thành' : 'Completed'
        };
      } else if (order.status === 'CANCELED') {
        return {
          color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300',
          icon: <XCircle className="w-4 h-4 text-red-500" />,
          text: language === 'vi' ? 'Đã hủy' : 'Cancelled'
        };
      } else if (order.status === 'CHARGING') {
        return {
          color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
          icon: <Zap className="w-4 h-4 text-green-500" />,
          text: language === 'vi' ? 'Đang sạc' : 'Active'
        };
      } else if (order.status === 'BOOKED') {
        // BOOKED status means upcoming
        return {
          color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
          icon: <Clock className="w-4 h-4 text-blue-500" />,
          text: language === 'vi' ? 'Sắp tới' : 'Upcoming'
        };
      } else {
        // Fallback to time-based logic for unknown statuses
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
        } else {
          return {
            color: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300',
            icon: <CheckCircle className="w-4 h-4 text-gray-500" />,
            text: language === 'vi' ? 'Hoàn thành' : 'Completed'
          };
        }
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
                {/* Only show time-based badges for BOOKED status */}
                {order.status === 'BOOKED' && (
                  <>
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
                  </>
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
              ) : order.status === 'BOOKED' ? (
                // BOOKED orders - show "Start Charging" and "Cancel" buttons (regardless of time)
                <div className="flex items-center gap-2">
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

                  {/* Cancel Order Button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline"
                        size="sm" 
                        className="h-7 px-3 text-xs bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-300"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        {language === 'vi' ? 'Hủy đặt chỗ' : 'Cancel Booking'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {language === 'vi' ? 'Xác nhận hủy đặt chỗ' : 'Confirm Cancel Booking'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {language === 'vi' 
                            ? `Bạn có chắc chắn muốn hủy đặt chỗ tại ${order.stationName}? Hành động này không thể hoàn tác.`
                            : `Are you sure you want to cancel the booking at ${order.stationName}? This action cannot be undone.`
                          }
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {language === 'vi' ? 'Không' : 'No'}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleCancelBooking(order.orderId)}
                          className="bg-red-500 hover:bg-red-600 text-white"
                        >
                          {language === 'vi' ? 'Hủy đặt chỗ' : 'Cancel Booking'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : null}
                      </div>
        </div>
      </CardContent>
    </Card>
  );
  };

  // Transaction Card Component
  const TransactionCard = ({ transaction }: { transaction: TransactionHistoryItem }) => {
    const getTransactionStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'success':
          return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300';
        case 'pending':
          return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300';
        case 'failed':
        case 'cancelled':
          return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300';
        default:
          return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300';
      }
    };

    const getTransactionStatusIcon = (status: string) => {
      switch (status.toLowerCase()) {
        case 'success':
          return <CheckCircle className="w-4 h-4 text-green-500" />;
        case 'pending':
          return <Clock className="w-4 h-4 text-yellow-500" />;
        case 'failed':
        case 'cancelled':
          return <XCircle className="w-4 h-4 text-red-500" />;
        default:
          return <AlertTriangle className="w-4 h-4 text-gray-500" />;
      }
    };

    // Calculate charging duration from session times
    const getChargingDuration = () => {
      if (transaction.sessionStartTime && transaction.sessionEndTime) {
        const start = new Date(transaction.sessionStartTime);
        const end = new Date(transaction.sessionEndTime);
        const durationMs = end.getTime() - start.getTime();
        const durationMinutes = Math.round(durationMs / (1000 * 60));
        return durationMinutes;
      }
      return 0;
    };

    const chargingDuration = getChargingDuration();

    return (
      <Card className="mb-4 hover:shadow-lg transition-all duration-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg">
                  {transaction.stationName}
                </h3>
                <Badge variant="outline" className={`${getTransactionStatusColor(transaction.status)} flex items-center gap-1 px-3 py-1`}>
                  {getTransactionStatusIcon(transaction.status)}
                  {transaction.status}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">{transaction.stationAddress}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">{language === 'vi' ? 'Bắt đầu' : 'Start'}:</span>
                    <span>{new Date(transaction.sessionStartTime).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="font-medium">{language === 'vi' ? 'Kết thúc' : 'End'}:</span>
                    <span>{new Date(transaction.sessionEndTime).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">👤 {language === 'vi' ? 'Người dùng' : 'User'}:</span>
                    <span>{transaction.userName}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">{transaction.powerConsumed.toFixed(2)} kWh</span>
                  </div>
                  {chargingDuration > 0 && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-500" />
                      <span className="font-medium">{chargingDuration} {language === 'vi' ? 'phút' : 'minutes'}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-medium">💳 {language === 'vi' ? 'Thanh toán' : 'Payment'}:</span>
                    <span>{transaction.paymentMethod}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right ml-4">
              <div className="bg-primary/10 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">{language === 'vi' ? 'Số tiền' : 'Amount'}</div>
                <div className="font-bold text-lg text-primary">{formatCurrency(transaction.amount)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  ID: #{transaction.transactionId}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground">
              {language === 'vi' ? 'Thời gian tạo' : 'Created'}: {new Date(transaction.createdAt).toLocaleString()}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Session: #{transaction.sessionId}</span>
              {transaction.paymentTime && (
                <span>Paid: {new Date(transaction.paymentTime).toLocaleString()}</span>
              )}
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
                {apiOrders.length === 0 && !loading && (
                  <span className="ml-2 text-orange-600 dark:text-orange-400">
                    ({language === 'vi' ? 'Không có dữ liệu' : 'No data'})
                  </span>
                )}
                {loading && (
                  <span className="ml-2 text-blue-600 dark:text-blue-400">
                    ({language === 'vi' ? 'Đang tải...' : 'Loading...'})
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      {(apiOrders.length > 0 || transactionHistory.length > 0) && (
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {apiOrders.length > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      {language === 'vi' ? 'Tổng đặt chỗ:' : 'Total Bookings:'}
                    </span>
                    <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-blue-800 dark:text-blue-200">
                      {apiOrders.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {language === 'vi' ? 'Sắp tới:' : 'Upcoming:'}
                    </span>
                    <span className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-green-800 dark:text-green-200">
                      {apiUpcomingOrders.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-600 dark:text-orange-400 font-medium">
                      {language === 'vi' ? 'Đang sạc:' : 'Active:'}
                    </span>
                    <span className="bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded text-orange-800 dark:text-orange-200">
                      {apiActiveOrders.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      {language === 'vi' ? 'Lịch sử đặt chỗ:' : 'Booking History:'}
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-gray-800 dark:text-gray-200">
                      {apiHistoryOrders.length}
                    </span>
                  </div>
                </>
              )}
              {transactionHistory.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-purple-600 dark:text-purple-400 font-medium">
                    {language === 'vi' ? 'Giao dịch:' : 'Transactions:'}
                  </span>
                  <span className="bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded text-purple-800 dark:text-purple-200">
                    {transactionHistory.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-gray-900">
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {translations.upcoming}
              {apiUpcomingOrders.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                  {apiUpcomingOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              {translations.active}
              {apiActiveOrders.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                  {apiActiveOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {translations.history}
              {apiHistoryOrders.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                  {apiHistoryOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              {translations.transactions}
              {transactionHistory.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                  {transactionHistory.length}
                </Badge>
              )}
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
              <EmptyState message={language === 'vi' ? 'Chưa có lịch sử đặt chỗ' : 'No booking history'} />
            )}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            {transactionLoading ? (
              <LoadingState />
            ) : transactionError ? (
              <ErrorState message={transactionError} />
            ) : transactionHistory.length > 0 ? (
              <>
                {/* Transaction filters */}
                <Card className="mb-4 border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 items-end">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium mb-2">
                          {language === 'vi' ? 'Trạng thái' : 'Status'}
                        </label>
                        <select
                          value={transactionFilters.status}
                          onChange={(e) => setTransactionFilters(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        >
                          <option value="">{language === 'vi' ? 'Tất cả' : 'All'}</option>
                          <option value="SUCCESS">{language === 'vi' ? 'Thành công' : 'Success'}</option>
                          <option value="PENDING">{language === 'vi' ? 'Đang chờ' : 'Pending'}</option>
                          <option value="FAILED">{language === 'vi' ? 'Thất bại' : 'Failed'}</option>
                          <option value="CANCELLED">{language === 'vi' ? 'Đã hủy' : 'Cancelled'}</option>
                        </select>
                      </div>

                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium mb-2">
                          {language === 'vi' ? 'Phương thức thanh toán' : 'Payment Method'}
                        </label>
                        <select
                          value={transactionFilters.paymentMethod}
                          onChange={(e) => setTransactionFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        >
                          <option value="">{language === 'vi' ? 'Tất cả' : 'All'}</option>
                          <option value="VNPAY">VNPAY</option>
                          <option value="QR">QR</option>
                          <option value="CASH">{language === 'vi' ? 'Tiền mặt' : 'Cash'}</option>
                        </select>
                      </div>

                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium mb-2">
                          {language === 'vi' ? 'Từ ngày' : 'From Date'}
                        </label>
                        <input
                          type="date"
                          value={transactionFilters.fromDate}
                          onChange={(e) => setTransactionFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        />
                      </div>

                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium mb-2">
                          {language === 'vi' ? 'Đến ngày' : 'To Date'}
                        </label>
                        <input
                          type="date"
                          value={transactionFilters.toDate}
                          onChange={(e) => setTransactionFilters(prev => ({ ...prev, toDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        />
                      </div>

                      <Button
                        onClick={() => {
                          setTransactionFilters({
                            status: '',
                            paymentMethod: '',
                            fromDate: '',
                            toDate: '',
                            stationId: '',
                            sortBy: 'createdAt',
                            sortDirection: 'desc'
                          });
                          setTransactionPage(1); // Reset to first page
                        }}
                        variant="outline"
                        size="sm"
                      >
                        {language === 'vi' ? 'Xóa bộ lọc' : 'Clear Filters'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {transactionHistory.map(transaction => (
                  <TransactionCard key={transaction.transactionId} transaction={transaction} />
                ))}

                {/* Transaction pagination would go here if needed */}
              </>
            ) : (
              <EmptyState message={translations.noTransactions} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}