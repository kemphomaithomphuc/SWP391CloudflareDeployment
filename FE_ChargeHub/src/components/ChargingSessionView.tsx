import React, { useState, useEffect } from 'react';
import { ArrowLeft, Zap, Pause, Play, Square, Clock, Battery, MapPin, CreditCard, QrCode, RefreshCw, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useBooking } from '../contexts/BookingContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Separator } from './ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import QRCodeGenerator from './QRCodeGenerator';
import axios from 'axios';


interface ChargingSessionViewProps {
  onBack: () => void;
  bookingId: string;
}

interface ChargingSession {
  id: string;
  bookingId: string;
  stationName: string;
  stationAddress: string;
  chargerType: 'DC_FAST' | 'AC_SLOW' | 'AC_FAST';
  power: number;
  startTime: string;
  endTime?: string;
  pausedTime: number; // Total paused time in seconds
  status: 'charging' | 'paused' | 'completed' | 'stopped';
  currentBattery: number;
  targetBattery: number;
  initialBattery: number;
  energyConsumed: number; // in kWh (powerConsumed in api)
  costPerKWh: number;
  totalCost: number; //(cost in api)
  estimatedTimeRemaining: number; // in minutes
}

export default function ChargingSessionView({ onBack, bookingId }: ChargingSessionViewProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { bookings, updateBookingStatus, startChargingSession, endChargingSession, calculatePenaltyFees } = useBooking();
  const sessionId = localStorage.getItem("currentSessionId");
  const userId = localStorage.getItem("userId");
  const orderId = localStorage.getItem("currentOrderId");
  const token = localStorage.getItem("token");

  
  const [session, setSession] = useState<ChargingSession>({
    id: String(sessionId),
    bookingId: String(orderId),
    stationName: "EVN Station Thủ Đức",
    stationAddress: "123 Võ Văn Ngân, Thủ Đức, TP.HCM",
    chargerType: 'DC_FAST',
    power: 50,
    startTime: new Date().toISOString(),
    pausedTime: 0,
    status: 'charging',
    currentBattery: 0, // Will be set from API
    targetBattery: 100, // Always 100% as final milestone
    initialBattery: 0, // Will be set from API
    energyConsumed: 0,
    costPerKWh: 3500, // VND per kWh
    totalCost: 0,
    estimatedTimeRemaining: 0
  });

  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [smoothBattery, setSmoothBattery] = useState(0);
  const [smoothEnergy, setSmoothEnergy] = useState(0);
  const [smoothCost, setSmoothCost] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  
  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStartTime, setSimulationStartTime] = useState<number | null>(null);
  const [lastApiData, setLastApiData] = useState<{
    battery: number;
    energy: number;
    cost: number;
    timestamp: number;
  } | null>(null);
  
  // Constants for simulation
  const BATTERY_CAPACITY_KWH = 50; // Typical EV battery capacity
  const CHARGING_POWER_KW = session.power; // Charging power from session

  

  const translations = {
    title: language === 'vi' ? 'Phiên sạc đang hoạt động' : 'Active Charging Session',
    chargingStatus: language === 'vi' ? 'Trạng thái sạc' : 'Charging Status',
    batteryLevel: language === 'vi' ? 'Mức pin' : 'Battery Level',
    timeElapsed: language === 'vi' ? 'Thời gian đã sạc' : 'Time Elapsed',
    energyConsumed: language === 'vi' ? 'Năng lượng tiêu thụ' : 'Energy Consumed',
    currentCost: language === 'vi' ? 'Chi phí hiện tại' : 'Current Cost',
    estimatedRemaining: language === 'vi' ? 'Thời gian còn lại' : 'Estimated Remaining',
    pause: language === 'vi' ? 'Tạm dừng' : 'Pause',
    continue: language === 'vi' ? 'Tiếp tục' : 'Continue',
    stop: language === 'vi' ? 'Dừng sạc' : 'Stop Charging',
    paymentRequired: language === 'vi' ? 'Thanh toán phí sạc' : 'Payment Required',
    paymentDetails: language === 'vi' ? 'Chi tiết thanh toán' : 'Payment Details',
    totalAmount: language === 'vi' ? 'Tổng số tiền' : 'Total Amount',
    payNow: language === 'vi' ? 'Thanh toán ngay' : 'Pay Now',
    payWithQR: language === 'vi' ? 'Thanh toán QR' : 'Pay with QR',
    sessionSummary: language === 'vi' ? 'Tóm tắt phiên sạc' : 'Session Summary',
    confirmStop: language === 'vi' ? 'Xác nhận dừng sạc' : 'Confirm Stop Charging',
    confirmStopMessage: language === 'vi' ? 'Bạn có chắc chắn muốn dừng phiên sạc này không? Bạn sẽ cần thanh toán cho năng lượng đã sử dụng.' : 'Are you sure you want to stop this charging session? You will need to pay for the energy consumed.',
    status: {
      charging: language === 'vi' ? 'Đang sạc' : 'Charging',
      paused: language === 'vi' ? 'Tạm dừng' : 'Paused',
      completed: language === 'vi' ? 'Hoàn thành' : 'Completed',
      stopped: language === 'vi' ? 'Đã dừng' : 'Stopped'
    }
  };

  const handleChargingMonitoring = async (sessionId: string, isInitialCall: boolean = false): Promise<ChargingSession | null> => {
    // Only show loading for initial call, not for periodic updates
    if (isInitialCall) {
      setLoading(true);
    }
    setError(null);
    
    try {
      if (!token) {
        throw new Error('No authentication token found');
      }

      if (!sessionId) {
        throw new Error('Session ID is required for monitoring');
      }

      console.log(`Monitoring session ID: `, sessionId);
      
      const response = await axios.get(`http://localhost:8080/api/sessions/${sessionId}/monitor`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.success) {
        const monitoringData = response.data.data;
        
        console.log('Monitoring API Response:', response.data);
        console.log('Monitoring Data:', monitoringData);
        
        // Handle initial battery setup and start simulation
        if (!isInitialized && monitoringData.currentBattery) {
          setSession(prev => ({
            ...prev,
            initialBattery: monitoringData.currentBattery,
            currentBattery: monitoringData.currentBattery
          }));
          setSmoothBattery(monitoringData.currentBattery);
          setSmoothEnergy(monitoringData.powerConsumed || 0);
          setSmoothCost(monitoringData.cost || 0);
          setIsInitialized(true);
          setIsSimulating(true);
          setSimulationStartTime(Date.now());
          console.log('Initial battery set:', monitoringData.currentBattery);
        }

        // Map API response to ChargingSession format based on actual API structure
        const updatedSession: ChargingSession = {
          id: sessionId,
          bookingId: String(orderId),
          stationName: session.stationName,
          stationAddress: session.stationAddress,
          chargerType: session.chargerType,
          power: session.power,
          startTime: session.startTime,
          ...(session.endTime && { endTime: session.endTime }),
          pausedTime: session.pausedTime,
          status: session.status,
          currentBattery: monitoringData.currentBattery || session.currentBattery,
          targetBattery: 100, // Always 100% as final milestone
          initialBattery: session.initialBattery || monitoringData.currentBattery || 0,
          energyConsumed: monitoringData.powerConsumed || session.energyConsumed,
          costPerKWh: session.costPerKWh,
          totalCost: monitoringData.cost || session.totalCost,
          estimatedTimeRemaining: session.estimatedTimeRemaining
        };

        console.log('Updated Session:', updatedSession);

        // Update session state
        setSession(updatedSession);

        // Store API data for simulation corrections (don't immediately update smooth values)
        if (monitoringData.currentBattery !== undefined || 
            monitoringData.powerConsumed !== undefined || 
            monitoringData.cost !== undefined) {
          setLastApiData({
            battery: monitoringData.currentBattery || smoothBattery,
            energy: monitoringData.powerConsumed || smoothEnergy,
            cost: monitoringData.cost || smoothCost,
            timestamp: Date.now()
          });
        }
        
        // Update last update time for subtle feedback
        setLastUpdateTime(new Date());
        
        // Only update loading state for initial call
        if (isInitialCall) {
          setLoading(false);
        }
        
        // Only show success toast for initial call, not periodic updates
        if (isInitialCall) {
          toast.success(language === 'vi' 
            ? 'Kết nối theo dõi sạc thành công' 
            : 'Charging monitoring connected successfully'
          );
        }
        
        return updatedSession;
      } else {
        throw new Error(response.data?.message || 'Failed to get monitoring data');
      }
    } catch (err: any) {
      console.error('Error monitoring charging session:', err);
      
      // Handle different types of errors
      let errorMessage = 'Failed to monitor charging session';
      
      if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        const serverMessage = err.response.data?.message;
        
        switch (status) {
          case 401:
            errorMessage = 'Authentication failed. Please login again.';
            break;
          case 404:
            errorMessage = 'Session not found. Please check your session ID.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = serverMessage || `Server error (${status})`;
        }
      } else if (err.request) {
        // Network error
        errorMessage = 'Network error. Please check your connection.';
      } else {
        // Other error
        errorMessage = err.message || 'Unknown error occurred';
      }
      
      setError(errorMessage);
      
      // Only update loading state for initial call
      if (isInitialCall) {
        setLoading(false);
      }
      
      // Show error toast with specific message
      toast.error(language === 'vi' 
        ? `Lỗi: ${errorMessage}` 
        : `Error: ${errorMessage}`
      );
      
      return null;
    }
  };

  const handleChargingTerminating = async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        throw new Error('No authentication token found');
      }

      if (!sessionId) {
        throw new Error('Session ID is required for terminating charging');
      }

      console.log(`Terminating charging session: ${sessionId}`);
      
      const response = await axios.post(`http://localhost:8080/api/sessions/${sessionId}/end`, {

      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.success) {
        console.log('Charging session terminated successfully:', response.data);
        
        // Stop simulation
        setIsSimulating(false);
        
        // Update session status
        setSession(prev => ({
          ...prev,
          status: 'stopped',
          endTime: new Date().toISOString()
        }));
        
        // Show success message
        toast.success(language === 'vi' 
          ? 'Đã dừng sạc thành công' 
          : 'Charging session stopped successfully'
        );
        
        // Show payment dialog
        setShowPaymentDialog(true);
        
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Failed to terminate charging session');
      }
    } catch (err: any) {
      console.error('Error terminating charging session:', err);
      
      // Handle different types of errors
      let errorMessage = 'Failed to terminate charging session';
      
      if (err.response) {
        const status = err.response.status;
        const serverMessage = err.response.data?.message;
        

      } else if (err.request) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = err.message || 'Unknown error occurred';
      }
      
      setError(errorMessage);
      
      // Show error toast
      toast.error(language === 'vi' 
        ? `Lỗi: ${errorMessage}` 
        : `Error: ${errorMessage}`
      );
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Main charging simulation effect (runs every 100ms for smooth animation)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isSimulating && session.status === 'charging' && simulationStartTime && session.initialBattery > 0) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsedSeconds = (now - simulationStartTime) / 1000;
        
        // Calculate simulated values based on charging power and time
        const energyConsumed = (CHARGING_POWER_KW * elapsedSeconds) / 3600; // kWh
        const batteryIncrease = (energyConsumed / BATTERY_CAPACITY_KWH) * 100; // percentage
        const simulatedBattery = Math.min(100, session.initialBattery + batteryIncrease);
        const simulatedCost = energyConsumed * session.costPerKWh;
        
        // Apply API corrections if available (smooth transition to real data)
        if (lastApiData && (now - lastApiData.timestamp) < 5000) { // Use API data if less than 5 seconds old
          const correctionFactor = 0.1; // Smooth correction factor
          setSmoothBattery(prev => prev + (lastApiData.battery - prev) * correctionFactor);
          setSmoothEnergy(prev => prev + (lastApiData.energy - prev) * correctionFactor);
          setSmoothCost(prev => prev + (lastApiData.cost - prev) * correctionFactor);
        } else {
          // Use simulated values
          setSmoothBattery(simulatedBattery);
          setSmoothEnergy(energyConsumed);
          setSmoothCost(simulatedCost);
        }
        
        // Update elapsed time
        setElapsedTime(Math.floor(elapsedSeconds));
        
        // Stop simulation when battery reaches 100%
        if (simulatedBattery >= 100) {
          setIsSimulating(false);
        }
      }, 100); // Update every 100ms for smooth animation
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulating, session.status, simulationStartTime, session.initialBattery, session.costPerKWh, CHARGING_POWER_KW, lastApiData]);

  // Auto start charging session on mount
  useEffect(() => {
    if (!sessionStarted) {
      const currentTime = new Date().toISOString();
      startChargingSession(bookingId, currentTime);
      setSessionStarted(true);
    }
  }, [bookingId, startChargingSession, sessionStarted]);

  // Initial API call and periodic monitoring (every 2 seconds)
  useEffect(() => {
    const sessionId = localStorage.getItem("currentSessionId");
    if (!sessionId || !sessionStarted) return;
    console.log("Current session id: ", sessionId);

    // Initial monitoring call to get initial battery (with loading)
    handleChargingMonitoring(sessionId, true);

    // Set up periodic monitoring every 2 seconds for smooth updates (no loading)
    const monitoringInterval = setInterval(() => {
      handleChargingMonitoring(sessionId, false);
    }, 2000); // 2 seconds for smooth updates

    return () => {
      clearInterval(monitoringInterval);
    };
  }, [sessionStarted, token]);

  // Retry mechanism for failed monitoring
  const retryMonitoring = () => {
    const sessionId = localStorage.getItem("currentSessionId");
    if (sessionId) {
      setError(null); // Clear previous errors
      handleChargingMonitoring(sessionId, true); // Show loading for retry
    }
  };

  // Auto complete when target battery reached (100%)
  useEffect(() => {
    if (smoothBattery >= 100 && session.status === 'charging' && isSimulating) {
      setIsSimulating(false);
      const endTime = new Date().toISOString();
      setSession(prev => ({ ...prev, status: 'completed', endTime }));
      endChargingSession(bookingId, endTime);
      toast.success(language === 'vi' ? 'Sạc hoàn tất!' : 'Charging completed!');
      setShowPaymentDialog(true);
    }
  }, [smoothBattery, session.status, isSimulating, bookingId, endChargingSession, language]);

  const handlePause = () => {
    setSession(prev => ({ ...prev, status: 'paused' }));
    toast.info(language === 'vi' ? 'Đã tạm dừng sạc' : 'Charging paused');
  };

  const handleContinue = () => {
    setSession(prev => ({ ...prev, status: 'charging' }));
    toast.success(language === 'vi' ? 'Tiếp tục sạc' : 'Charging resumed');
  };

  const handleStop = async () => {
    const sessionId = localStorage.getItem("currentSessionId");
    if (!sessionId) {
      toast.error(language === 'vi' ? 'Không tìm thấy ID phiên sạc' : 'Session ID not found');
      return;
    }

    // Call API to terminate charging session
    await handleChargingTerminating(sessionId);
  };


  const handlePayment = () => {
    toast.success(language === 'vi' ? 'Thanh toán thành công!' : 'Payment successful!');
    setShowPaymentDialog(false);
    onBack();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => {
    return language === 'vi' 
      ? `${Math.round(amount).toLocaleString('vi-VN')}đ`
      : `$${(amount / 23000).toFixed(2)}`;
  };

  const getStatusColor = () => {
    switch (session.status) {
      case 'charging':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-blue-500';
      case 'stopped':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Calculate battery progress from initial to 100% (smooth)
  const batteryProgress = session.initialBattery > 0 
    ? Math.max(0, Math.min(100, ((smoothBattery - session.initialBattery) / (100 - session.initialBattery)) * 100))
    : 0;

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
              onClick={() => {
                const sessionId = localStorage.getItem("currentSessionId");
                if (sessionId) {
                  handleChargingMonitoring(sessionId, true); // Show loading for manual refresh
                }
              }}
              disabled={loading}
              className="p-2 hover:bg-primary/10 rounded-full"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">{translations.title}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{session.stationName}</span>
                {lastUpdateTime && (
                  <span className="text-xs opacity-70">
                    {language === 'vi' ? 'Cập nhật' : 'Updated'} {lastUpdateTime.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
            <Badge className={`${getStatusColor()} text-white flex items-center gap-2`}>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              {translations.status[session.status]}
            </Badge>
            {isSimulating && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                {language === 'vi' ? 'Đang mô phỏng' : 'Simulating'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">
                    {language === 'vi' ? 'Lỗi theo dõi phiên sạc' : 'Charging monitoring error'}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retryMonitoring}
                  disabled={loading}
                  className="text-red-600 border-red-300 hover:bg-red-100 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {language === 'vi' ? 'Thử lại' : 'Retry'}
                </Button>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>
            </CardContent>
          </Card>
        )}
        {/* Main Status Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-blue-500/5" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              {translations.chargingStatus}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative space-y-6">
            {/* Battery Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{translations.batteryLevel}</span>
                <span className="text-2xl font-bold text-primary">
                  {Math.round(smoothBattery)}%
                </span>
              </div>
              <Progress value={Math.max(0, Math.min(100, batteryProgress))} className="h-3" />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{session.initialBattery}%</span>
                <span>Target: 100%</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-card rounded-lg border">
                <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{formatTime(elapsedTime)}</p>
                <p className="text-sm text-muted-foreground">{translations.timeElapsed}</p>
              </div>
              
              <div className="text-center p-4 bg-card rounded-lg border">
                <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold">{smoothEnergy.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">kWh</p>
              </div>
              
              <div className="text-center p-4 bg-card rounded-lg border">
                <CreditCard className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{formatCurrency(smoothCost)}</p>
                <p className="text-sm text-muted-foreground">{translations.currentCost}</p>
              </div>
              
              <div className="text-center p-4 bg-card rounded-lg border">
                <Battery className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{session.estimatedTimeRemaining}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'vi' ? 'phút' : 'min'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Control Buttons */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              {session.status === 'charging' && (
                <>
                  <Button
                    onClick={handlePause}
                    variant="outline"
                    size="lg"
                    className="flex items-center gap-2 min-w-[140px]"
                  >
                    <Pause className="w-5 h-5" />
                    {translations.pause}
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="lg"
                        disabled={loading}
                        className="flex items-center gap-2 min-w-[140px]"
                      >
                        <Square className="w-5 h-5" />
                        {translations.stop}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{translations.confirmStop}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {translations.confirmStopMessage}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {language === 'vi' ? 'Hủy' : 'Cancel'}
                        </AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleStop}
                          disabled={loading}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {language === 'vi' ? 'Dừng sạc' : 'Stop Charging'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
              
              {session.status === 'paused' && (
                <>
                  <Button
                    onClick={handleContinue}
                    size="lg"
                    className="flex items-center gap-2 min-w-[140px]"
                  >
                    <Play className="w-5 h-5" />
                    {translations.continue}
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="lg"
                        disabled={loading}
                        className="flex items-center gap-2 min-w-[140px]"
                      >
                        <Square className="w-5 h-5" />
                        {translations.stop}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{translations.confirmStop}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {translations.confirmStopMessage}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {language === 'vi' ? 'Hủy' : 'Cancel'}
                        </AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleStop}
                          disabled={loading}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {language === 'vi' ? 'Dừng sạc' : 'Stop Charging'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Station Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {language === 'vi' ? 'Thông tin trạm sạc' : 'Station Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium">{session.stationName}</p>
              <p className="text-sm text-muted-foreground">{session.stationAddress}</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-primary" />
                <span>{session.chargerType} - {session.power}kW</span>
              </div>
              <div className="flex items-center gap-1">
                <CreditCard className="w-4 h-4 text-green-500" />
                <span>{formatCurrency(session.costPerKWh)}/kWh</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{translations.paymentRequired}</DialogTitle>
            <DialogDescription>
              {translations.paymentDetails}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="font-medium">{translations.sessionSummary}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{translations.timeElapsed}:</span>
                    <span>{formatTime(elapsedTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{translations.energyConsumed}:</span>
                    <span>{smoothEnergy.toFixed(2)} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'vi' ? 'Pin sạc:' : 'Battery charged:'}:</span>
                    <span>{session.initialBattery}% → {Math.round(smoothBattery)}%</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium text-lg">
                    <span>{translations.totalAmount}:</span>
                    <span className="text-primary">{formatCurrency(smoothCost)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex gap-2">
              <Button onClick={handlePayment} className="flex-1">
                <CreditCard className="w-4 h-4 mr-2" />
                {translations.payNow}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowQRDialog(true)}
                className="flex-1"
              >
                <QrCode className="w-4 h-4 mr-2" />
                {translations.payWithQR}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Payment Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{translations.payWithQR}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <QRCodeGenerator 
              value={JSON.stringify({
                amount: (() => {
                  const currentBooking = bookings.find(b => b.id === bookingId);
                  const penaltyTotal = currentBooking?.penaltyFees?.total || 0;
                  return Math.round(session.totalCost + penaltyTotal);
                })(),
                sessionId: session.id,
                stationName: session.stationName,
                bookingId: bookingId
              })}
              size={200}
            />
            <p className="text-center text-sm text-muted-foreground">
              {language === 'vi' 
                ? 'Quét mã QR để thanh toán' 
                : 'Scan QR code to pay'
              }
            </p>
            <p className="text-center font-medium text-lg">
              {formatCurrency(smoothCost)}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}