import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Zap, Pause, Play, Square, Clock, Battery, MapPin, CreditCard, QrCode, RefreshCw, AlertTriangle, User, Phone, Mail, Car, Hash } from 'lucide-react';
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
import { api } from '../services/api';
import { checkAndRefreshToken } from '../services/api';
import { ParkingSessionSummary } from '../types/parking';
import fetchParkingMonitoring from '../api/parkingMonitor';
import { buildFrontendUrl } from '../utils/url';


interface ChargingSessionViewProps {
  onBack: () => void;
  bookingId: string;
  onParkingStart?: (summary: ParkingSessionSummary) => void;
}

interface ChargingSession {
  id: string;
  bookingId: string;
  stationId?: number;
  stationName: string;
  stationAddress: string;
  chargerType: 'DC_FAST' | 'AC_SLOW' | 'AC_FAST' | string;
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
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  vehiclePlate?: string;
  chargingPointName?: string;
  lastMonitorTime?: string;
}

interface PaymentDetail {
  userName: string,
  stationName: string,
  stationAddress: string,
  sesionStartTime: string,
  sessionEndTime: string,
  powerConsumed: number,
  baseCost: number,
  totalFee: number
}

interface StoredStationInfo {
  stationId?: number;
  stationName?: string;
  stationAddress?: string;
  connectorType?: string;
  chargingPower?: number;
  pricePerKwh?: number;
  timestamp?: string;
  chargingPointName?: string;
}

const SESSION_STORAGE_KEY = (sessionId?: string | null) =>
  sessionId && sessionId !== 'null' ? `charging-session-${sessionId}` : null;

const coerceSessionStatus = (
  value: any,
  fallback: ChargingSession['status']
): ChargingSession['status'] => {
  if (
    value === 'charging' ||
    value === 'paused' ||
    value === 'completed' ||
    value === 'stopped'
  ) {
    return value;
  }
  return fallback;
};

const getStoredStationInfo = (): StoredStationInfo | null => {
  try {
    const raw = localStorage.getItem("currentStationInfo");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as StoredStationInfo;
    }
    return null;
  } catch (error) {
    console.error("Failed to parse stored station info:", error);
    return null;
  }
};

// Helper function to build ParkingSessionSummary from session and parking monitoring data
const buildParkingSummary = (
  session: ChargingSession,
  parkingMonitoring: any,
  parkingStartTime?: string
): ParkingSessionSummary => {
  const now = new Date().toISOString();

  const summary: ParkingSessionSummary = {
    sessionId: session.id,
    bookingId: session.bookingId,
    stationName: session.stationName,
    stationAddress: session.stationAddress,
    startTime: session.startTime,
    endTime: session.endTime || now,
    energyConsumed: session.energyConsumed || 0,
    totalCost: session.totalCost || 0,
    parkingStartTime: parkingStartTime || session.endTime || now,
    ...(session.userName && { userName: session.userName }),
    ...(session.chargerType && { chargerType: session.chargerType }),
    ...(session.power && { power: session.power }),
    ...(session.chargingPointName && { chargingPointName: session.chargingPointName }),
    ...(session.initialBattery !== undefined && { initialBattery: session.initialBattery }),
    ...(session.targetBattery !== undefined && { targetBattery: session.targetBattery })
  };

  return summary;
};
export default function ChargingSessionView({ onBack, bookingId, onParkingStart }: ChargingSessionViewProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { bookings, updateBookingStatus, startChargingSession, endChargingSession, calculatePenaltyFees } = useBooking();
  const sessionId = localStorage.getItem("currentSessionId");
  const userId = localStorage.getItem("userId");
  const orderId = localStorage.getItem("currentOrderId");
  const token = localStorage.getItem("token");
  const defaultUserName = localStorage.getItem("fullName") || undefined;
  const defaultUserPhone = localStorage.getItem("phone") || localStorage.getItem("phoneNumber") || undefined;
  const defaultUserEmail = localStorage.getItem("email") || undefined;
  const paymentReturnUrl = useMemo(() => buildFrontendUrl('/payment/result'), []);

  const initialStationInfo = getStoredStationInfo();
  const initialChargerType = initialStationInfo?.connectorType && typeof initialStationInfo.connectorType === 'string'
    ? initialStationInfo.connectorType
    : 'DC_FAST';
  const initialPower = typeof initialStationInfo?.chargingPower === 'number' && !isNaN(initialStationInfo.chargingPower)
    ? initialStationInfo.chargingPower
    : 50;
  const initialPrice = typeof initialStationInfo?.pricePerKwh === 'number' && !isNaN(initialStationInfo.pricePerKwh)
    ? initialStationInfo.pricePerKwh
    : 3500;

  
  const buildInitialSession = (): ChargingSession => {
    const base: ChargingSession = {
      id: String(sessionId),
      bookingId: orderId ? String(orderId) : '',
      stationName: initialStationInfo?.stationName ?? "EVN Station Thủ Đức",
      stationAddress: initialStationInfo?.stationAddress ?? "123 Võ Văn Ngân, Thủ Đức, TP.HCM",
      chargerType: initialChargerType,
      power: initialPower,
      startTime: new Date().toISOString(),
      pausedTime: 0,
      status: 'charging',
      currentBattery: 0, // Will be set from API
      targetBattery: 100, // Always 100% as final milestone
      initialBattery: 0, // Will be set from API
      energyConsumed: 0,
      costPerKWh: initialPrice, // VND per kWh
      totalCost: 0,
      estimatedTimeRemaining: 0
    };

    if (defaultUserName) {
      base.userName = defaultUserName;
    }

    if (defaultUserPhone) {
      base.userPhone = defaultUserPhone;
    }

    if (defaultUserEmail) {
      base.userEmail = defaultUserEmail;
    }

    if (typeof initialStationInfo?.stationId === 'number' && !isNaN(initialStationInfo.stationId)) {
      base.stationId = initialStationInfo.stationId;
    }

    return base;
  };

  const [session, setSession] = useState<ChargingSession>(() => {
    const initial = buildInitialSession();
    const storageKey = SESSION_STORAGE_KEY(initial.id);
    if (storageKey) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            ...initial,
            ...parsed,
            startTime: parsed.startTime || initial.startTime,
            status: parsed.status || initial.status,
          };
        }
      } catch (error) {
        console.error("Failed to restore session from storage:", error);
      }
    }
    return initial;
  });

  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitializedRef = useRef(false); // Use ref to persist across re-renders without causing re-renders
  const [isMonitoring, setIsMonitoring] = useState(false); // Track if monitoring call is in progress
  const [smoothBattery, setSmoothBattery] = useState(0);
  const [smoothEnergy, setSmoothEnergy] = useState(0);
  const [smoothCost, setSmoothCost] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [finalizedMetrics, setFinalizedMetrics] = useState<{ cost: number; energy: number } | null>(null);
  const expectedPaymentAmountRef = useRef<number | null>(null);
  const PAYMENT_AMOUNT_TOLERANCE_VND = 500; // Allow minor rounding differences
  const stationInfoRef = useRef<StoredStationInfo | null>(initialStationInfo);

  const saveLastChargedStationSnapshot = (overrides?: Partial<StoredStationInfo>) => {
    const fallbackStationId =
      typeof stationInfoRef.current?.stationId === "number" && !isNaN(stationInfoRef.current.stationId)
        ? stationInfoRef.current.stationId
        : undefined;

    const activeStationId =
      typeof session.stationId === "number" && !isNaN(session.stationId)
        ? session.stationId
        : fallbackStationId;

    const targetStationId =
      typeof overrides?.stationId === "number" && !isNaN(overrides.stationId)
        ? overrides.stationId
        : activeStationId;

    if (targetStationId === undefined) {
      return;
    }

    const payload = {
      stationId: targetStationId,
      stationName: overrides?.stationName ?? session.stationName ?? stationInfoRef.current?.stationName,
      stationAddress: overrides?.stationAddress ?? session.stationAddress ?? stationInfoRef.current?.stationAddress,
      savedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem("lastChargedStation", JSON.stringify(payload));
    } catch (storageError) {
      console.error("Failed to persist last charged station snapshot:", storageError);
    }
  };

  const persistSessionState = (nextSession: Partial<ChargingSession>) => {
    const storageKey = SESSION_STORAGE_KEY(nextSession.id ?? session.id);
    if (!storageKey) return;
    try {
      const data = {
        startTime: nextSession.startTime ?? session.startTime,
        status: coerceSessionStatus(nextSession.status, session.status),
        energyConsumed: nextSession.energyConsumed ?? session.energyConsumed,
        totalCost: nextSession.totalCost ?? session.totalCost,
        currentBattery: nextSession.currentBattery ?? session.currentBattery,
        chargingPointName: nextSession.chargingPointName ?? session.chargingPointName,
        stationName: nextSession.stationName ?? session.stationName,
        stationAddress: nextSession.stationAddress ?? session.stationAddress,
        userName: nextSession.userName ?? session.userName,
        userPhone: nextSession.userPhone ?? session.userPhone,
        userEmail: nextSession.userEmail ?? session.userEmail,
        vehiclePlate: nextSession.vehiclePlate ?? session.vehiclePlate,
        costPerKWh: nextSession.costPerKWh ?? session.costPerKWh,
        power: nextSession.power ?? session.power,
        initialBattery: nextSession.initialBattery ?? session.initialBattery,
        targetBattery: nextSession.targetBattery ?? session.targetBattery,
        bookingId: nextSession.bookingId ?? session.bookingId,
        stationId: nextSession.stationId ?? session.stationId,
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to persist session state:", error);
    }
  };

  const updateSessionWithStationInfo = (info: StoredStationInfo) => {
    stationInfoRef.current = info;
    setSession(prev => {
      const next: ChargingSession = {
        ...prev,
        stationName: info.stationName ?? prev.stationName,
        stationAddress: info.stationAddress ?? prev.stationAddress,
        chargerType: info.connectorType && typeof info.connectorType === 'string' && info.connectorType.trim().length > 0
          ? info.connectorType
          : prev.chargerType,
        power: typeof info.chargingPower === 'number' && !isNaN(info.chargingPower)
          ? info.chargingPower
          : prev.power,
        costPerKWh: typeof info.pricePerKwh === 'number' && !isNaN(info.pricePerKwh)
          ? info.pricePerKwh
          : prev.costPerKWh
      };

      if (typeof info.stationId === 'number' && !isNaN(info.stationId)) {
        next.stationId = info.stationId;
      }

      if (info.chargingPointName !== undefined) {
        next.chargingPointName = info.chargingPointName;
      }

      persistSessionState(next);
      return next;
    });
  };

  const updateSessionWithOrderData = (orderData: any) => {
    if (!orderData || typeof orderData !== 'object') {
      return;
    }

    setSession(prev => {
      const next: ChargingSession = {
        ...prev,
        bookingId: orderData.orderId != null ? String(orderData.orderId) : prev.bookingId,
        startTime: orderData.startTime ?? prev.startTime,
        ...(orderData.endTime ? { endTime: orderData.endTime } : {}),
        initialBattery: typeof orderData.startedBattery === 'number' && !isNaN(orderData.startedBattery)
          ? orderData.startedBattery
          : prev.initialBattery,
        targetBattery: typeof orderData.expectedBattery === 'number' && !isNaN(orderData.expectedBattery)
          ? orderData.expectedBattery
          : prev.targetBattery,
      };

      if (typeof orderData.chargingPower === 'number' && !isNaN(orderData.chargingPower)) {
        next.power = orderData.chargingPower;
      }

      if (typeof orderData.pricePerKwh === 'number' && !isNaN(orderData.pricePerKwh)) {
        next.costPerKWh = orderData.pricePerKwh;
      }

      if (orderData.connectorType) {
        next.chargerType = orderData.connectorType;
      }

      if (orderData.stationName) {
        next.stationName = orderData.stationName;
      }

      if (orderData.stationAddress) {
        next.stationAddress = orderData.stationAddress;
      }

      if (orderData.chargingPointName ?? orderData.chargingPoint) {
        next.chargingPointName = orderData.chargingPointName ?? orderData.chargingPoint;
      }

      const phoneFromOrder = orderData.userPhone ?? orderData.userPhoneNumber;
      if (phoneFromOrder) {
        next.userPhone = phoneFromOrder;
      }

      if (orderData.userName) {
        next.userName = orderData.userName;
      }

      if (orderData.userEmail) {
        next.userEmail = orderData.userEmail;
      }

      if (orderData.vehiclePlate) {
        next.vehiclePlate = orderData.vehiclePlate;
      }

      if (typeof orderData.stationId === 'number' && !isNaN(orderData.stationId)) {
        next.stationId = orderData.stationId;
      }

      persistSessionState(next);
      return next;
    });
  };

  const persistStationInfoContext = (orderData: any) => {
    if (!orderData) {
      return;
    }

    const info: StoredStationInfo = {
      stationId: typeof orderData.stationId === 'number'
        ? orderData.stationId
        : stationInfoRef.current?.stationId,
      stationName: orderData.stationName ?? stationInfoRef.current?.stationName ?? undefined,
      stationAddress: orderData.stationAddress ?? stationInfoRef.current?.stationAddress ?? undefined,
      connectorType: orderData.connectorType ?? stationInfoRef.current?.connectorType ?? undefined,
      chargingPower: typeof orderData.chargingPower === 'number'
        ? orderData.chargingPower
        : stationInfoRef.current?.chargingPower,
      pricePerKwh: typeof orderData.pricePerKwh === 'number'
        ? orderData.pricePerKwh
        : stationInfoRef.current?.pricePerKwh,
      chargingPointName: orderData?.chargingPointName
        ?? stationInfoRef.current?.chargingPointName,
      timestamp: new Date().toISOString()
    };

    stationInfoRef.current = info;

    try {
      localStorage.setItem("currentStationInfo", JSON.stringify(info));
      if (info.stationId !== undefined) {
        localStorage.setItem("currentStationId", info.stationId.toString());
      }
    } catch (storageError) {
      console.error("Failed to persist station info:", storageError);
    }

    updateSessionWithOrderData(orderData);
    updateSessionWithStationInfo(info);
  };


  
  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStartTime, setSimulationStartTime] = useState<number | null>(null);
  const [lastApiData, setLastApiData] = useState<{
    battery: number;
    energy: number;
    cost: number;
    timestamp: number;
  } | null>(null);
  
  useEffect(() => {
    if (!session.startTime) return;
    const start = new Date(session.startTime);
    if (Number.isNaN(start.getTime())) return;
    
    const updateElapsed = () => {
      const diffSeconds = Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000));
      setElapsedTime(diffSeconds);
    };
    
    updateElapsed(); // Cập nhật ngay
    
    if (session.status === 'charging') {
      const interval = setInterval(updateElapsed, 1000);
      return () => clearInterval(interval);
    }
  }, [session.startTime, session.status]);

  // Ref to store monitoring interval ID for manual cleanup
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Constants for simulation
  const BATTERY_CAPACITY_KWH = 50; // Typical EV battery capacity
  const CHARGING_POWER_KW = session.power; // Charging power from session
  
  // Token timeout warning (30 minutes)
  const [tokenWarningShown, setTokenWarningShown] = useState(false);
  
  // 100% completion popup
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [completionDialogShown, setCompletionDialogShown] = useState(false);
  
  // Payment confirmation
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentDetail | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  // Charging finishing state
  const [isChargingFinishing, setIsChargingFinishing] = useState(false);
  
  // Track 401 errors to avoid premature redirect
  const [unauthorizedCount, setUnauthorizedCount] = useState(0);
  const MAX_UNAUTHORIZED_RETRIES = 3; // Retry 3 times before redirecting
  
  // Monitor localStorage changes for sessionId
  useEffect(() => {
    const checkSessionId = () => {
      const currentSessionId = localStorage.getItem("currentSessionId");
      const currentUserId = localStorage.getItem("userId");
      console.log("SessionId Monitor - currentSessionId:", currentSessionId);
      console.log("SessionId Monitor - currentUserId:", currentUserId);
      
      // Update session state if sessionId is available
      if (currentSessionId && session.id !== currentSessionId) {
        setSession(prev => {
          const next = {
            ...prev,
            id: currentSessionId
          };
          persistSessionState(next);
          return next;
        });
        console.log("SessionId Monitor - Updated session.id to:", currentSessionId);
      }

      const storedStationInfo = getStoredStationInfo();
      if (storedStationInfo) {
        const previousInfo = stationInfoRef.current;
        const infoChanged = !previousInfo || (
          previousInfo.stationId !== storedStationInfo.stationId ||
          previousInfo.stationName !== storedStationInfo.stationName ||
          previousInfo.stationAddress !== storedStationInfo.stationAddress ||
          previousInfo.connectorType !== storedStationInfo.connectorType ||
          previousInfo.chargingPower !== storedStationInfo.chargingPower ||
          previousInfo.pricePerKwh !== storedStationInfo.pricePerKwh
        );

        if (infoChanged) {
          updateSessionWithStationInfo(storedStationInfo);
        }
      }
    };
    
    // Check immediately
    checkSessionId();
    
    // Set up interval to check periodically
    const interval = setInterval(checkSessionId, 2000);
    
    return () => clearInterval(interval);
  }, [session.id]);

  useEffect(() => {
    setFinalizedMetrics(null);
    expectedPaymentAmountRef.current = null;
    isInitializedRef.current = false; // Reset initialization flag for new session
    persistSessionState({});
    console.log('🔄 Session ID changed, resetting initialization flag');
  }, [session.id]);

  useEffect(() => {
    const ensureActiveSessionContext = async () => {
      const existingSessionId = localStorage.getItem("currentSessionId");
      if (existingSessionId) {
        if (!sessionStarted) {
          setSession(prev => {
            const next = {
              ...prev,
              id: existingSessionId
            };
            persistSessionState(next);
            return next;
          });
          setSessionStarted(true);
        }
        return;
      }

      if (!token) {
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`
      };

      const processSession = (sessionData: any, relatedOrder?: any) => {
        if (!sessionData?.sessionId) {
          return false;
        }

        try {
          localStorage.setItem("currentSessionId", sessionData.sessionId.toString());
        } catch (error) {
          console.error("Failed to persist sessionId:", error);
        }

        setSession(prev => {
          const next = {
            ...prev,
            id: sessionData.sessionId.toString(),
            startTime: sessionData.startTime ?? prev.startTime
          };
          persistSessionState(next);
          return next;
        });

        if (relatedOrder) {
          persistStationInfoContext(relatedOrder);
        }

        if (!sessionStarted) {
          setSessionStarted(true);
        }

        return true;
      };

      const savedOrderId = localStorage.getItem("currentOrderId");

      if (savedOrderId) {
        try {
          const sessionRes = await api.get(
            `/api/sessions/by-order/${savedOrderId}`
          );
          if (sessionRes.data?.success && sessionRes.data?.data) {
            let relatedOrder: any = null;
            try {
              if (userId) {
                const ordersRes = await api.get(
                  `/api/orders/my-orders?userId=${userId}`
                );
                if (ordersRes.data?.success && Array.isArray(ordersRes.data.data)) {
                  relatedOrder = ordersRes.data.data.find(
                    (order: any) => String(order.orderId) === String(savedOrderId)
                  );
                }
              }
            } catch (orderFetchError) {
              console.error("Failed to fetch related order:", orderFetchError);
            }

            if (processSession(sessionRes.data.data, relatedOrder)) {
              return;
            }
          }
        } catch (restoreError) {
          console.error("Failed to restore session from saved orderId:", restoreError);
        }
      }

      if (!userId) {
        return;
      }

      try {
        const ordersRes = await api.get(
          `/api/orders/my-orders?userId=${userId}`
        );

        if (ordersRes.data?.success && Array.isArray(ordersRes.data.data)) {
          const chargingOrder = ordersRes.data.data.find((order: any) => order.status === 'CHARGING');
          if (chargingOrder) {
            try {
              const sessionRes = await api.get(
                `/api/sessions/by-order/${chargingOrder.orderId}`
              );
              if (sessionRes.data?.success && sessionRes.data?.data) {
                if (processSession(sessionRes.data.data, chargingOrder)) {
                  return;
                }
              }
            } catch (sessionError) {
              console.error("Failed to fetch session for active order:", sessionError);
            }
          }
        }
      } catch (orderListError) {
        console.error("Failed to retrieve orders for session restore:", orderListError);
      }
    };

    ensureActiveSessionContext();
  }, [token, sessionStarted, userId]);

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
    // Skip if already monitoring (prevent race condition)
    if (isMonitoring && !isInitialCall) {
      console.log('Monitoring call skipped - already in progress');
      return null;
    }
    
    setIsMonitoring(true);
    
    // Only show loading for initial call, not for periodic updates
    if (isInitialCall) {
      setLoading(true);
    }
    setError(null);
    
    try {
      // Get fresh token from localStorage for each call
      const currentToken = localStorage.getItem("token");
      
      if (!currentToken) {
        console.error('No authentication token found - skipping monitoring call');
        setError('Authentication token not found. Please ensure you are logged in.');
        
        // Don't redirect immediately - token might be loading
        // Only return null and let the periodic check handle it
        setIsMonitoring(false);
        if (isInitialCall) {
          setLoading(false);
        }
        return null;
      }

      if (!sessionId) {
        throw new Error('Session ID is required for monitoring');
      }

      console.log(`Monitoring session ID: ${sessionId}`);
      
      const response = await api.get(`/api/sessions/${sessionId}/monitor`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
        timeout: 5000, // 5 second timeout for smooth UX
      });

      if (response.data && response.data.success) {
        const monitoringData = response.data.data;
        
        console.log('Monitoring API Response:', response.data);
        console.log('Monitoring Data:', monitoringData);
        
        // Reset unauthorized count on successful call
        setUnauthorizedCount(0);
        
        // Handle initial battery setup and start simulation - ONLY ONCE
        // Use ref to avoid re-initialization on every API call
        if (!isInitializedRef.current && monitoringData.currentBattery !== undefined) {
          console.log('🎬 INITIALIZING SESSION (ONCE) - Battery:', monitoringData.currentBattery, 'Target:', monitoringData.targetBattery);

          setSession(prev => {
            const next = {
              ...prev,
              initialBattery: monitoringData.currentBattery,
              currentBattery: monitoringData.currentBattery,
              // Also set targetBattery from API if available
              ...(typeof monitoringData.targetBattery === 'number' && !isNaN(monitoringData.targetBattery)
                ? { targetBattery: monitoringData.targetBattery }
                : {})
            };
            persistSessionState(next);
            return next;
          });
          setSmoothBattery(monitoringData.currentBattery);
          setSmoothEnergy(monitoringData.powerConsumed || 0);
          setSmoothCost(monitoringData.cost || 0);
          isInitializedRef.current = true; // Mark as initialized using ref
          // Don't restart simulation if already running
          if (!isSimulating) {
            setIsSimulating(true);
            setSimulationStartTime(Date.now());
          }
        } else {
          console.log('📊 Updating from API (not reinitializing) - Battery:', monitoringData.currentBattery, 'Energy:', monitoringData.powerConsumed, 'Cost:', monitoringData.cost);
        }

        // Check status early to determine if we need to transition to PARKING
        // Backend returns status as "CHARGING", "PARKING", or "COMPLETED"
        const rawStatus = monitoringData.status?.toUpperCase() || monitoringData.status;
        const isParkingStatus = rawStatus === 'PARKING';

        // Map API response to ChargingSession format based on actual API structure
        // Note: If status is PARKING, we handle it below and return early
        // Here we coerce status for ChargingSession interface (PARKING is mapped to 'stopped')
        const derivedStatus = isParkingStatus
          ? 'stopped' // Treat PARKING as stopped in ChargingSession interface
          : coerceSessionStatus(monitoringData.status, session.status);
        const updatedSession: ChargingSession = {
          id: sessionId,
          bookingId: orderId ? String(orderId) : session.bookingId,
          stationName: session.stationName,
          stationAddress: session.stationAddress,
          chargerType: session.chargerType,
          power: session.power,
          startTime: session.startTime,
          ...(session.endTime && { endTime: session.endTime }),
          pausedTime: session.pausedTime,
          status: derivedStatus,
          currentBattery: monitoringData.currentBattery || session.currentBattery,
          targetBattery: typeof monitoringData.targetBattery === 'number' && !isNaN(monitoringData.targetBattery)
            ? monitoringData.targetBattery
            : session.targetBattery || 100, // Use API value or fallback to session value or 100
          initialBattery: session.initialBattery || monitoringData.currentBattery || 0,
          energyConsumed: monitoringData.powerConsumed || session.energyConsumed,
          costPerKWh: session.costPerKWh,
          totalCost: monitoringData.cost || session.totalCost,
        estimatedTimeRemaining: typeof monitoringData.estimatedRemainingMinutes === 'number'
          ? monitoringData.estimatedRemainingMinutes
          : session.estimatedTimeRemaining
        };

        if (monitoringData.startTime) {
          updatedSession.startTime = monitoringData.startTime;
        }

        if (monitoringData.currentTime) {
          updatedSession.lastMonitorTime = monitoringData.currentTime;
        }

        if (typeof session.stationId === 'number' && !isNaN(session.stationId)) {
          updatedSession.stationId = session.stationId;
        }

        console.log('Updated Session:', updatedSession);

        // Transition to ParkingView if status is PARKING and we haven't already transitioned
        // Note: isParkingStatus was already checked above
        if (isParkingStatus && onParkingStart && session.status !== 'stopped') {
          console.log('🚗 Detected PARKING status from monitoring API, transitioning to ParkingView...');
          console.log('📊 Monitoring data:', { status: rawStatus, ...monitoringData });

          // Stop monitoring and simulation immediately
          setIsMonitoring(false);
          setIsSimulating(false);
          if (monitoringIntervalRef.current) {
            clearInterval(monitoringIntervalRef.current);
            monitoringIntervalRef.current = null;
          }

          // Set status to stopped immediately to prevent monitoring useEffect from running again
          setSession(prev => {
            const next = {
              ...prev,
              status: 'stopped' as ChargingSession['status'],
              endTime: monitoringData.currentTime ?
                (typeof monitoringData.currentTime === 'string'
                  ? monitoringData.currentTime
                  : new Date(monitoringData.currentTime).toISOString())
                : new Date().toISOString()
            };
            persistSessionState(next);
            return next;
          });

          // Fetch parking monitoring data to build summary
          try {
            const parkingMonitoringData = await fetchParkingMonitoring(sessionId);
            console.log('📊 Parking monitoring data retrieved:', parkingMonitoringData);

            // Convert monitoringData.currentTime to ISO string if it's a LocalDateTime
            const endTimeStr = monitoringData.currentTime
              ? (typeof monitoringData.currentTime === 'string'
                  ? monitoringData.currentTime
                  : new Date(monitoringData.currentTime).toISOString())
              : new Date().toISOString();

            // Build parking summary with latest data
            const parkingSummary = buildParkingSummary(
              {
                ...updatedSession,
                endTime: endTimeStr,
                energyConsumed: monitoringData.powerConsumed || updatedSession.energyConsumed || 0,
                totalCost: monitoringData.cost || updatedSession.totalCost || 0
              },
              parkingMonitoringData,
              parkingMonitoringData.parkingStartTime || endTimeStr
            );

            console.log('🏁 Parking summary built successfully:', parkingSummary);

            // Transition to ParkingView
            onParkingStart(parkingSummary);
            return updatedSession;
          } catch (error: any) {
            console.error('❌ Error fetching parking monitoring data:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error';
            toast.error(language === 'vi'
              ? `Lỗi khi lấy thông tin đỗ xe: ${errorMessage}. Vui lòng thử lại.`
              : `Error fetching parking data: ${errorMessage}. Please try again.`
            );
            // Don't return here - let it continue to update session normally
            // User can manually check parking status later
          }
        }

        // Update session state
        persistSessionState(updatedSession);
        setSession(updatedSession);

        // Handle elapsed time sync from API with priority:
        // 1. If API returns elapsedSeconds (precise) → use it directly and sync
        // 2. Otherwise → let local timer continue running (don't sync from imprecise elapsedMinutes)
        if (typeof monitoringData.elapsedSeconds === 'number' && !isNaN(monitoringData.elapsedSeconds)) {
          // Best case: API returns precise seconds
          const apiElapsedSeconds = Math.round(monitoringData.elapsedSeconds);
          const currentElapsedSeconds = elapsedTime;
          const discrepancy = Math.abs(apiElapsedSeconds - currentElapsedSeconds);
          
          console.log(`⏱️ API time (precise): ${apiElapsedSeconds}s, Local: ${currentElapsedSeconds}s, Discrepancy: ${discrepancy}s`);
          
          // Sync if discrepancy > 2 seconds (allow small variance for network delay)
          if (discrepancy > 2) {
            console.log(`🔄 Syncing from precise API elapsedSeconds: ${apiElapsedSeconds}s`);
            setElapsedTime(apiElapsedSeconds);
          } else {
            console.log(`✅ Time in sync with API (within 2s tolerance)`);
          }
        } else {
          console.log(`⏱️ No precise elapsed time from API, keeping local timer: ${elapsedTime}s`);
        }

        // ALWAYS update smooth values from API data (Backend always provides these values)
        if (monitoringData.currentBattery !== undefined) {
          setSmoothBattery(monitoringData.currentBattery);
        }
        if (monitoringData.powerConsumed !== undefined) {
          setSmoothEnergy(monitoringData.powerConsumed);
        }
        if (monitoringData.cost !== undefined) {
          setSmoothCost(monitoringData.cost);
        }
        
        // Store API data for simulation corrections
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
        if (monitoringData.currentTime) {
          const parsedTime = new Date(monitoringData.currentTime);
          setLastUpdateTime(isNaN(parsedTime.getTime()) ? new Date() : parsedTime);
        } else {
          setLastUpdateTime(new Date());
        }
        
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
      let shouldStopMonitoring = false;
      
      if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        const serverMessage = err.response.data?.message;
        
        switch (status) {
          case 401:
            // Check current count before incrementing
            const currentUnauthorizedCount = unauthorizedCount;
            
            // Increment unauthorized count
            setUnauthorizedCount(prev => prev + 1);
            
            // Only redirect after multiple failures to avoid premature logout
            if (currentUnauthorizedCount >= MAX_UNAUTHORIZED_RETRIES - 1) {
              errorMessage = language === 'vi' 
                ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' 
                : 'Session expired. Please login again.';
              shouldStopMonitoring = true;
              
              // Clear token and redirect to login after delay
              localStorage.removeItem('token');
              localStorage.removeItem('currentSessionId');
              localStorage.removeItem('currentOrderId');
              toast.error(errorMessage);
              
              setTimeout(() => {
                window.location.href = '/login';
              }, 2000);
            } else {
              // Just log and retry
              errorMessage = language === 'vi' 
                ? `Lỗi xác thực. Đang thử lại... (${currentUnauthorizedCount + 1}/${MAX_UNAUTHORIZED_RETRIES})` 
                : `Authentication error. Retrying... (${currentUnauthorizedCount + 1}/${MAX_UNAUTHORIZED_RETRIES})`;
              console.warn('401 Unauthorized, retrying...', { attemptNumber: currentUnauthorizedCount + 1 });
              
              // Don't show toast for retries, just log
              if (isInitialCall) {
                toast(errorMessage, { icon: '⚠️' });
              }
              
              // Don't stop monitoring yet, allow retry
              shouldStopMonitoring = false;
            }
            break;
            
          case 404:
            errorMessage = language === 'vi' 
              ? 'Không tìm thấy phiên sạc.' 
              : 'Session not found.';
            shouldStopMonitoring = true;
            break;
            
          case 500:
            errorMessage = language === 'vi' 
              ? 'Lỗi server. Vui lòng thử lại sau.' 
              : 'Server error. Please try again later.';
            // Don't stop monitoring on server errors, might be temporary
            break;
            
          default:
            errorMessage = serverMessage || `Server error (${status})`;
        }
      } else if (err.request) {
        // Network error - don't stop monitoring, might be temporary
        errorMessage = language === 'vi' 
          ? 'Lỗi mạng. Đang thử kết nối lại...' 
          : 'Network error. Retrying...';
        
        // Don't show toast for periodic network errors, just log
        if (!isInitialCall) {
          console.log('Network error during monitoring, will retry...');
          return null;
        }
      } else {
        // Other error
        errorMessage = err.message || 'Unknown error occurred';
      }
      
      setError(errorMessage);
      
      // Only update loading state for initial call
      if (isInitialCall) {
        setLoading(false);
      }
      
      // Show error toast only for initial calls or critical errors
      if (isInitialCall || shouldStopMonitoring) {
        toast.error(errorMessage);
      }
      
      // Stop session if critical error
      if (shouldStopMonitoring) {
        setSession(prev => {
          const next = { ...prev, status: 'stopped' as ChargingSession['status'] };
          persistSessionState(next);
          return next;
        });
      }
      
      return null;
    } finally {
      setIsMonitoring(false); // Reset monitoring flag
    }
  };

  const handleChargingTerminating = async () => {
    // Store previous status for rollback if error occurs
    const previousStatus = session.status;
    
    // Reset unauthorized count to prevent false redirect from monitoring
    setUnauthorizedCount(0);

    // Set flag to prevent redirect during critical operation
    localStorage.setItem('preventRedirect', 'true');

    try {
      setLoading(true);
      setError(null);

      // Get fresh token from localStorage (may have been refreshed by interceptor)
      const currentToken = localStorage.getItem("token");
      if (!currentToken) {
        throw new Error('No authentication token found');
      }

      // Check and refresh token if needed before API call
      try {
        await checkAndRefreshToken();
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Continue with current token, interceptor will handle retry
      }

      // Get token again after potential refresh
      const freshToken = localStorage.getItem("token");
      if (!freshToken) {
        throw new Error('No authentication token found after refresh');
      }

      const currentSessionId = localStorage.getItem("currentSessionId");
      if (!currentSessionId || currentSessionId === 'null') {
        throw new Error('Session ID is required for terminating charging');
      }

      console.log(`Terminating charging session: ${currentSessionId}`);
      
      // Stop monitoring immediately before API call
      if (monitoringIntervalRef.current) {
        console.log('Clearing monitoring interval before termination');
        clearInterval(monitoringIntervalRef.current);
        monitoringIntervalRef.current = null;
      }
      
      // Stop simulation immediately
      setIsSimulating(false);
      
      // Use api instance instead of axios directly to benefit from auto-refresh token interceptor
      const response = await api.post(`/api/sessions/${currentSessionId}/end`, {
        // Empty body
      }, {
        headers: {
          Authorization: `Bearer ${freshToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.success) {
        console.log('Charging session terminated successfully:', response.data);
        
        saveLastChargedStationSnapshot();
        
        // Check if backend transitioned to PARKING status
        // Backend will transition CHARGING -> PARKING when user stops manually
        // Wrap in try-catch to prevent error propagation and redirect
        try {
          // Wait a moment for backend to process the transition
          await new Promise(resolve => setTimeout(resolve, 500));

          // Check session status via monitoring API
          // If this fails, don't propagate error - just continue with payment dialog
          const monitoringResponse = await api.get(`/api/sessions/${currentSessionId}/monitor`, {
            headers: {
              Authorization: `Bearer ${freshToken}`,
            },
            timeout: 5000,
          });

          if (monitoringResponse.data?.success) {
            const monitoringData = monitoringResponse.data.data;
            const rawStatus = monitoringData?.status?.toUpperCase() || monitoringData?.status;

            // If status is PARKING, transition to ParkingView
            if (rawStatus === 'PARKING' && onParkingStart) {
              console.log('🚗 Backend transitioned to PARKING after stop, moving to ParkingView...');
              console.log('📊 Monitoring data after stop:', { status: rawStatus, ...monitoringData });

              // Stop monitoring immediately (already stopped in handleChargingTerminating, but double-check)
              setIsMonitoring(false);
              setIsSimulating(false);
              if (monitoringIntervalRef.current) {
                clearInterval(monitoringIntervalRef.current);
                monitoringIntervalRef.current = null;
              }

              // Set status to stopped immediately to prevent monitoring useEffect from running again
              setSession(prev => {
                const next = {
                  ...prev,
                  status: 'stopped' as ChargingSession['status'],
                  endTime: monitoringData.currentTime ?
                    (typeof monitoringData.currentTime === 'string'
                      ? monitoringData.currentTime
                      : new Date(monitoringData.currentTime).toISOString())
                    : new Date().toISOString()
                };
                persistSessionState(next);
                return next;
              });

              // Fetch parking monitoring data to build summary
              try {
                const parkingMonitoringData = await fetchParkingMonitoring(currentSessionId);
                console.log('📊 Parking monitoring data retrieved after stop:', parkingMonitoringData);

                // Convert monitoringData.currentTime to ISO string if needed
                const endTimeStr = monitoringData.currentTime
                  ? (typeof monitoringData.currentTime === 'string'
                      ? monitoringData.currentTime
                      : new Date(monitoringData.currentTime).toISOString())
                  : new Date().toISOString();

                // Get updated session data with latest values
                const updatedSessionData = {
                  ...session,
                  endTime: endTimeStr,
                  energyConsumed: monitoringData.powerConsumed || session.energyConsumed || 0,
                  totalCost: monitoringData.cost || session.totalCost || 0
                };

                // Build parking summary
                const parkingSummary = buildParkingSummary(
                  updatedSessionData,
                  parkingMonitoringData,
                  parkingMonitoringData.parkingStartTime || endTimeStr
                );

                console.log('🏁 Parking summary built from stop:', parkingSummary);

                // Transition to ParkingView
                onParkingStart(parkingSummary);
                return response.data;
              } catch (error: any) {
                console.error('❌ Error fetching parking monitoring after stop:', error);
                const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error';
                toast.error(language === 'vi'
                  ? `Lỗi khi lấy thông tin đỗ xe: ${errorMessage}. Vui lòng thử lại.`
                  : `Error fetching parking data: ${errorMessage}. Please try again.`
                );
                // Fall through to show payment dialog
              }
            }
          }
        } catch (monitoringError: any) {
          // ✅ Handle monitoring error gracefully - don't propagate to interceptor
          console.warn('Monitoring check failed after end session (non-critical):', monitoringError);
          // If it's a 401, we already handled it - don't let interceptor redirect
          // Continue with payment dialog flow
          // Fall through to show payment dialog
        }

        // Update session status to stopped ONLY after successful API call
        setSession(prev => {
          const next = {
            ...prev,
            status: 'stopped' as ChargingSession['status'],
            endTime: new Date().toISOString()
          };
          persistSessionState(next);
          return next;
        });
        
        // Show success message
        toast.success(language === 'vi' 
          ? 'Đã dừng sạc thành công' 
          : 'Charging session stopped successfully'
        );
        
        // Sync latest payment detail (if available) to freeze displayed values
        const userIdSnapshot = localStorage.getItem("userId");
        if (userIdSnapshot) {
          const detail = await fetchPaymentDetail(currentSessionId, userIdSnapshot, { silent: true });
          if (detail) {
            applyPaymentDetail(detail);
          }
        }

        // Show payment dialog - payment will be initiated when user confirms
        setShowPaymentDialog(true);
        
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Failed to terminate charging session');
      }
    } catch (err: any) {
      console.error('Error terminating charging session:', err);
      
      // Handle different types of errors
      let errorMessage = language === 'vi'
        ? 'Không thể kết thúc phiên sạc'
        : 'Failed to terminate charging session';
      let shouldShowRetry = true;
      
      if (err.response) {
        const status = err.response.status;
        const serverMessage = err.response.data?.message;
        
        switch (status) {
          case 401:
            // 401 error - token expired or invalid
            // Don't redirect (flag prevents it), just show error message
            errorMessage = language === 'vi'
              ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
              : 'Authentication failed. Please login again.';
            // User can manually navigate or retry after re-login
            shouldShowRetry = false;
            break;
          case 404:
            errorMessage = language === 'vi'
              ? 'Không tìm thấy phiên sạc. Vui lòng kiểm tra lại.'
              : 'Session not found. Please check your session ID.';
            break;
          case 500:
            errorMessage = language === 'vi'
              ? 'Lỗi server. Vui lòng thử lại sau.'
              : 'Server error. Please try again later.';
            break;
          default:
            errorMessage = serverMessage || (language === 'vi'
              ? `Lỗi server (${status})`
              : `Server error (${status})`);
        }
      } else if (err.request) {
        errorMessage = language === 'vi'
          ? 'Lỗi mạng. Vui lòng kiểm tra kết nối.'
          : 'Network error. Please check your connection.';
      } else {
        errorMessage = err.message || (language === 'vi'
          ? 'Lỗi không xác định'
          : 'Unknown error occurred');
      }
      
      setError(errorMessage);
      
      // Show error toast with retry option (except for 401)
      const isAuthError = err.response?.status === 401;
      toast.error(
        language === 'vi'
          ? `Lỗi: ${errorMessage}`
          : `Error: ${errorMessage}`,
        {
          duration: isAuthError ? 7000 : 5000,
          action: !isAuthError && shouldShowRetry ? {
            label: language === 'vi' ? 'Thử lại' : 'Retry',
            onClick: () => handleChargingTerminating()
          } : undefined
        }
      );
      
      // Reset finishing state so user can retry
      setIsChargingFinishing(false);
      
      // Rollback session status to previous state
      setSession(prev => {
        const next = {
          ...prev,
          status: previousStatus
        };
        persistSessionState(next);
        return next;
      });
      
      // Restart simulation if it was running before
      if (previousStatus === 'charging') {
        setIsSimulating(true);
      }
      
      return null;
    } finally {
      // ✅ Always clear preventRedirect flag in finally block
      localStorage.removeItem('preventRedirect');

      setLoading(false);
      setIsChargingFinishing(false);
    }
  };

  // Main charging simulation effect (runs every 100ms for smooth animation)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isSimulating && session.status === 'charging' && simulationStartTime && session.initialBattery > 0) {
      interval = setInterval(() => {
        // Stop simulation if session is stopped
        if (session.status === 'stopped') {
          setIsSimulating(false);
          clearInterval(interval);
          return;
        }
        
        const now = Date.now();
        const elapsedSeconds = (now - simulationStartTime) / 1000;
        
        // Calculate simulated values based on charging power and time
        const energyConsumed = (CHARGING_POWER_KW * elapsedSeconds) / 3600; // kWh
        const batteryIncrease = (energyConsumed / BATTERY_CAPACITY_KWH) * 100; // percentage
        const simulatedBattery = Math.min(100, session.initialBattery + batteryIncrease);
        const simulatedCost = energyConsumed * session.costPerKWh;
        
        // Only use simulation if no recent API data (API data takes priority)
        if (!lastApiData || (now - lastApiData.timestamp) > 3000) { // Use simulation if API data is older than 3 seconds
          setSmoothBattery(simulatedBattery);
          setSmoothEnergy(energyConsumed);
          setSmoothCost(simulatedCost);
        }
        // If recent API data exists, the API monitoring effect will handle the updates
        
        // Elapsed time is handled by separate 1-second interval
        
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

  // Initial API call and periodic monitoring (every 5 seconds)
  useEffect(() => {
    const sessionId = localStorage.getItem("currentSessionId");
    const currentToken = localStorage.getItem("token");
    
    console.log("🔍 Monitoring useEffect triggered:", {
      hasSessionId: !!sessionId,
      sessionId: sessionId,
      sessionStarted,
      status: session.status,
      hasToken: !!currentToken,
      tokenPreview: currentToken ? currentToken.substring(0, 20) + '...' : 'null'
    });
    
    // Check prerequisites - IMPORTANT: Stop if session is already stopped
    if (!sessionId || !sessionStarted || session.status === 'stopped' || !currentToken) {
      console.log("Monitoring skipped - prerequisites not met:", {
        hasSessionId: !!sessionId, 
        sessionStarted, 
        status: session.status,
        hasToken: !!currentToken
      });
      
      // Clear any existing interval if session is stopped
      if (session.status === 'stopped' && monitoringIntervalRef.current) {
        console.log("Session stopped, clearing any existing monitoring interval");
        clearInterval(monitoringIntervalRef.current);
        monitoringIntervalRef.current = null;
      }
      
      return;
    }
    
    console.log("Starting monitoring for session:", sessionId);

    // Start simulation immediately for smooth UI, will be corrected by API data
    if (!isInitializedRef.current && !isSimulating) {
      setIsSimulating(true);
      setSimulationStartTime(Date.now());
      setSmoothBattery(session.initialBattery || 0);
      setSmoothEnergy(0);
      setSmoothCost(0);
      console.log('🎬 Starting simulation immediately for smooth UI');
    }

    // Initial monitoring call to get initial battery (with loading)
    handleChargingMonitoring(sessionId, true);

    // Set up periodic monitoring every 5 seconds for smooth updates (no loading)
    const monitoringInterval = setInterval(async () => {
      // Check if monitoring should stop
      if (session.status === 'stopped') {
        console.log("Session stopped, clearing monitoring interval");
        clearInterval(monitoringInterval);
        if (monitoringIntervalRef.current === monitoringInterval) {
          monitoringIntervalRef.current = null;
        }
        return;
      }
      
      // Check token is still valid
      const freshToken = localStorage.getItem("token");
      if (!freshToken) {
        console.log("Token not found, stopping monitoring");
        clearInterval(monitoringInterval);
        if (monitoringIntervalRef.current === monitoringInterval) {
          monitoringIntervalRef.current = null;
        }
        return;
      }
      
      // Call monitoring without loading indicator
      await handleChargingMonitoring(sessionId, false);
    }, 5000); // 5 seconds polling interval

    // Store interval ref for manual cleanup
    monitoringIntervalRef.current = monitoringInterval;

    return () => {
      console.log("Cleaning up monitoring interval");
      clearInterval(monitoringInterval);
      if (monitoringIntervalRef.current === monitoringInterval) {
        monitoringIntervalRef.current = null;
      }
    };
  }, [sessionStarted, session.status]);

  // Separate effect for 1-second updates (elapsed time only) - REMOVED: now handled in startTime useEffect

  // Retry mechanism for failed monitoring
  const retryMonitoring = () => {
    const sessionId = localStorage.getItem("currentSessionId");
    if (sessionId) {
      setError(null); // Clear previous errors
      handleChargingMonitoring(sessionId, true); // Show loading for retry
    }
  };

  // Show completion dialog when battery reaches 100%
  useEffect(() => {
    if (smoothBattery >= 100 && session.status === 'charging' && isSimulating && !completionDialogShown) {
      setIsSimulating(false);
      setShowCompletionDialog(true);
      setCompletionDialogShown(true);
      toast.success(language === 'vi' ? 'Pin đã sạc đầy 100%!' : 'Battery charged to 100%!');
    }
  }, [smoothBattery, session.status, isSimulating, completionDialogShown, language]);

  // Token timeout warning for 30-minute sessions
  useEffect(() => {
    const checkTokenTimeout = () => {
      const token = localStorage.getItem("token");
      if (!token || tokenWarningShown) return;

      try {
        const parts = token.split('.');
        if (parts.length !== 3 || !parts[1]) return;
        
        const payload = JSON.parse(atob(parts[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = payload.exp - currentTime;
        
        // Show warning when 5 minutes remaining (for 30-minute tokens)
        if (timeUntilExpiry <= 5 * 60 && timeUntilExpiry > 0) {
          setTokenWarningShown(true);
          toast(language === 'vi' 
            ? 'Phiên đăng nhập sắp hết hạn. Vui lòng lưu tiến trình sạc.' 
            : 'Session will expire soon. Please save your charging progress.', { icon: '⚠️' }
          );
        }
      } catch (error) {
        console.error('Error checking token timeout:', error);
      }
    };

    // Check every minute for token timeout
    const interval = setInterval(checkTokenTimeout, 60 * 1000);
    
    // Check immediately
    checkTokenTimeout();

    return () => clearInterval(interval);
  }, [tokenWarningShown, language]);

  const handlePause = () => {
    setSession(prev => {
      const next = { ...prev, status: 'paused' as ChargingSession['status'] };
      persistSessionState(next);
      return next;
    });
    toast.info(language === 'vi' ? 'Đã tạm dừng sạc' : 'Charging paused');
  };

  const handleContinue = () => {
    setSession(prev => {
      const next = { ...prev, status: 'charging' as ChargingSession['status'] };
      persistSessionState(next);
      return next;
    });
    toast.success(language === 'vi' ? 'Tiếp tục sạc' : 'Charging resumed');
  };

  const handleStop = async () => {
    const sessionId = localStorage.getItem("currentSessionId");
    if (!sessionId || sessionId === 'null') {
      toast.error(language === 'vi' ? 'Không tìm thấy ID phiên sạc' : 'Session ID not found');
      return;
    }

    // Prevent multiple calls
    if (loading || isChargingFinishing) {
      return;
    }

    // Set charging finishing state
    setIsChargingFinishing(true);
    
    // Show notification that charging is finishing
    toast.info(language === 'vi' ? 'Đang kết thúc phiên sạc...' : 'Finishing charging session...');

    // Stop simulation immediately to prevent further updates
    setIsSimulating(false);
    
    // Call API to terminate charging session (only once)
    await handleChargingTerminating();
  };

  const handleCompletionConfirm = async () => {
    const sessionId = localStorage.getItem("currentSessionId");
    if (!sessionId || sessionId === 'null') {
      toast.error(language === 'vi' ? 'Không tìm thấy ID phiên sạc' : 'Session ID not found');
      return;
    }

    // Prevent multiple calls
    if (loading || isChargingFinishing) {
      return;
    }

    // Set charging finishing state
    setIsChargingFinishing(true);
    
    // Show notification that charging is finishing
    toast.info(language === 'vi' ? 'Đang kết thúc phiên sạc...' : 'Finishing charging session...');

    // Stop simulation immediately to prevent further updates
    setIsSimulating(false);
    
    // Call API to terminate charging session (only once)
    await handleChargingTerminating();
    
    // Close the completion dialog
    setShowCompletionDialog(false);
  };

  const handleCompletionCancel = () => {
    // Close the completion dialog
    setShowCompletionDialog(false);
    
    // Resume simulation if user cancels
    setIsSimulating(true);
  };

  const parsePaymentDetail = (rawData: any): PaymentDetail => {
    const parseNumeric = (value: any): number => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const baseCostValue = parseNumeric(rawData?.baseCost);
    const totalFeeValueRaw = parseNumeric(rawData?.totalFee);
    const totalFeeValue = totalFeeValueRaw > 0 ? totalFeeValueRaw : baseCostValue;

    return {
      userName: rawData?.userName || 'N/A',
      stationName: rawData?.stationName || 'N/A',
      stationAddress: rawData?.stationAddress || 'N/A',
      sesionStartTime: rawData?.sessionStartTime || new Date().toISOString(),
      sessionEndTime: rawData?.sessionEndTime || new Date().toISOString(),
      powerConsumed: parseNumeric(rawData?.powerConsumed),
      baseCost: baseCostValue,
      totalFee: totalFeeValue
    };
  };

  const fetchPaymentDetail = async (
    sessionId: string,
    userId: string,
    options?: { silent?: boolean }
  ): Promise<PaymentDetail | null> => {
    try {
      const res = await api.get(`/api/payment/detail?sessionId=${sessionId}&userId=${userId}`);

      if (res.status === 200 && res.data?.success) {
        return parsePaymentDetail(res.data.data);
      }

      const serverMessage = res.data?.message || 'Unable to fetch payment information';
      throw new Error(serverMessage);
    } catch (err: any) {
      if (options?.silent) {
        console.warn('Silent payment detail fetch failed:', err);
        return null;
      }

      if (err?.response?.data?.message) {
        throw new Error(err.response.data.message);
      }

      throw err instanceof Error ? err : new Error('Unable to fetch payment information');
    }
  };

  const applyPaymentDetail = (detail: PaymentDetail) => {
    setSession(prev => {
      const next = {
        ...prev,
        energyConsumed: detail.powerConsumed,
        totalCost: detail.totalFee,
        stationName: detail.stationName ?? prev.stationName,
        stationAddress: detail.stationAddress ?? prev.stationAddress,
        userName: detail.userName ?? prev.userName,
        ...(detail.sesionStartTime ? { startTime: detail.sesionStartTime } : {}),
        ...(detail.sessionEndTime ? { endTime: detail.sessionEndTime } : {}),
      };
      persistSessionState(next);
      return next;
    });

    setSmoothEnergy(detail.powerConsumed);
    setSmoothCost(detail.totalFee);
    setFinalizedMetrics({ cost: detail.totalFee, energy: detail.powerConsumed });
    expectedPaymentAmountRef.current = Math.round(detail.totalFee);
  };


  const handlePayment = async () => {
    try {
      setPaymentLoading(true);
      let sessionId = localStorage.getItem("currentSessionId");
      const userId = localStorage.getItem("userId");
      console.log("Payment Debug - handlePayment SessionId:", sessionId);
      console.log("Payment Debug - handlePayment UserId:", userId);
      
      // If sessionId is not found, try to get it from the session state
      if (!sessionId && session.id) {
        sessionId = session.id;
        console.log("Payment Debug - Using session.id as fallback in handlePayment:", sessionId);
      }
      
      if (!sessionId || !userId) {
        toast.error(language === 'vi' ? 'Không tìm thấy thông tin phiên sạc' : 'Session information not found');
        return;
      }
      const paymentDetail = await fetchPaymentDetail(sessionId, userId, { silent: false });

      if (!paymentDetail) {
        toast.error(language === 'vi' ? 'Không thể lấy thông tin thanh toán' : 'Unable to fetch payment information');
        return;
      }

      console.log('Payment API Response (parsed):', paymentDetail);

      applyPaymentDetail(paymentDetail);
      setPaymentData(paymentDetail);
      setShowPaymentConfirmation(true);
    } catch (err: any) {
      console.error('Error fetching payment details:', err);
      const message = err instanceof Error ? err.message : undefined;
      toast.error(
        language === 'vi'
          ? `Lỗi khi lấy thông tin thanh toán${message ? `: ${message}` : ''}`
          : `Error fetching payment details${message ? `: ${message}` : ''}`
      );
    } finally {
      setPaymentLoading(false);
    }
  };
  const handleDirectPayment = async() => {
    try {
      // Get fresh values from localStorage
      let sessionId = localStorage.getItem("currentSessionId");
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");
      
      console.log("Payment Debug - SessionId:", sessionId);
      console.log("Payment Debug - UserId:", userId);
      console.log("Payment Debug - Token:", token);
      console.log("Payment Debug - All localStorage:", {
        currentSessionId: localStorage.getItem("currentSessionId"),
        userId: localStorage.getItem("userId"),
        currentOrderId: localStorage.getItem("currentOrderId"),
        token: localStorage.getItem("token")
      });
      
      // If sessionId is not found, try to get it from the session state
      if (!sessionId && session.id) {
        sessionId = session.id;
        console.log("Payment Debug - Using session.id as fallback:", sessionId);
      }
      
      if (!sessionId || !userId) {
        toast.error(language === 'vi' ? 'Không tìm thấy thông tin phiên sạc' : 'Session information not found');
        return;
      }

      const previousExpectedAmount = expectedPaymentAmountRef.current;
      const detailForSync = await fetchPaymentDetail(sessionId, userId, { silent: true });
      if (detailForSync) {
        applyPaymentDetail(detailForSync);
        const updatedAmount = expectedPaymentAmountRef.current;
        const baselineAmount = previousExpectedAmount ?? Math.round(smoothCost);

        if (
          updatedAmount !== null &&
          Math.abs(updatedAmount - baselineAmount) > PAYMENT_AMOUNT_TOLERANCE_VND
        ) {
          toast.info(
            language === 'vi'
              ? 'Chi phí thanh toán đã được đồng bộ với dữ liệu mới nhất.'
              : 'Payment amount has been synchronized with the latest charging data.'
          );
        }
      }

      const payload = {
        sessionId: sessionId,
        userId: userId,
        paymentMethod: "VNPAY",
        returnUrl: paymentReturnUrl,
        bankCode: "NCB"
      }
      
      const res = await api.post(`/api/payment/initiate`, payload);
      
      if (res.status === 200 && res.data.success) {
        console.log('Payment initiated successfully:', res.data);
        console.log('Payment URL:', res.data.data.paymentUrl);
        
        // Close dialogs before redirecting
        setShowPaymentConfirmation(false);
        setShowPaymentDialog(false);
        
        saveLastChargedStationSnapshot();
        
        // Clear session data from localStorage before redirecting to payment
        localStorage.removeItem("currentSessionId");
        localStorage.removeItem("currentOrderId");
        localStorage.removeItem("currentStationInfo");
        localStorage.removeItem("currentStationId");
        
        // Show brief success message
        toast.success(language === 'vi' 
          ? 'Đang chuyển đến trang thanh toán...' 
          : 'Redirecting to payment...'
        );
        
        // Redirect to payment URL
        setTimeout(() => {
          window.location.href = res.data.data.paymentUrl;
        }, 500);
      } else {
        throw new Error(res.data?.message || 'Payment initiation failed');
      }

    } catch (err: any) {
      console.error('Error initiating payment:', err);
      toast.error(language === 'vi' ? 'Lỗi khi khởi tạo thanh toán' : 'Error initiating payment');
      throw err; // Re-throw to be caught by handleConfirmPayment
    }
  }

  const handleConfirmPayment = async () => {
    try {
      setPaymentLoading(true);
      
      // Call the direct payment method
      await handleDirectPayment();
      
    } catch (err: any) {
      console.error('Error processing payment:', err);
      toast.error(language === 'vi' ? 'Lỗi khi xử lý thanh toán' : 'Error processing payment');
    } finally {
      setPaymentLoading(false);
    }
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

  const formatDateTime = (value?: string) => {
    if (!value) {
      return language === 'vi' ? 'Không có dữ liệu' : 'N/A';
    }

    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US');
  };

  const formatCurrency = (amount: number | undefined | null) => {
    // Always use Vietnamese currency (VND) regardless of language
    // Handle invalid values
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '0đ';
    }
    return `${Math.round(amount).toLocaleString('vi-VN')}đ`;
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

  // Calculate battery progress from 0% to 100% (simple and dynamic)
  const batteryProgress = Math.max(0, Math.min(100, smoothBattery));

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

      {/* Charging Finishing Notification */}
      {isChargingFinishing && (
        <div className="bg-orange-50 dark:bg-orange-950/20 border-b border-orange-200 dark:border-orange-800">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-orange-600 dark:text-orange-400 animate-spin" />
              <div>
                <h4 className="font-medium text-orange-800 dark:text-orange-200">
                  {language === 'vi' ? 'Đang kết thúc phiên sạc' : 'Finishing Charging Session'}
                </h4>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  {language === 'vi' 
                    ? 'Vui lòng đợi trong khi hệ thống kết thúc phiên sạc của bạn...' 
                    : 'Please wait while the system finishes your charging session...'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 transition-all duration-500 ease-out ${
                    session.status === 'charging' ? 'animate-pulse' : ''
                  }`}
                  style={{ width: `${batteryProgress}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white drop-shadow-sm">
                    {Math.round(batteryProgress)}%
                  </span>
                </div>
                {/* Charging indicator */}
                {session.status === 'charging' && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <div className="w-1 h-1 bg-green-400 rounded-full animate-ping" />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{session.initialBattery}%</span>
                <span>Target: {session.targetBattery}%</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                <p className="text-2xl font-bold">{formatCurrency(finalizedMetrics?.cost ?? smoothCost)}</p>
                <p className="text-sm text-muted-foreground">{translations.currentCost}</p>
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
                          disabled={loading || isChargingFinishing}
                          className={`${isChargingFinishing ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}`}
                        >
                          {isChargingFinishing 
                            ? (language === 'vi' ? 'Đang kết thúc...' : 'Finishing...')
                            : (language === 'vi' ? 'Dừng sạc' : 'Stop Charging')
                          }
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
                          disabled={loading || isChargingFinishing}
                          className={`${isChargingFinishing ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}`}
                        >
                          {isChargingFinishing 
                            ? (language === 'vi' ? 'Đang kết thúc...' : 'Finishing...')
                            : (language === 'vi' ? 'Dừng sạc' : 'Stop Charging')
                          }
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
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-base">{session.stationName}</p>
              <p className="text-muted-foreground">{session.stationAddress}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span>{session.chargerType} · {session.power}kW</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-green-500" />
                <span>{formatCurrency(session.costPerKWh)}/kWh</span>
              </div>
              {session.chargingPointName && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span>{language === 'vi' ? 'Trụ sạc' : 'Charging Point'}: {session.chargingPointName}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-purple-500" />
                <span>{language === 'vi' ? 'Mã đơn' : 'Order'}: #{session.bookingId}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>{language === 'vi' ? 'Bắt đầu' : 'Start'}: {formatDateTime(session.startTime)}</span>
              </div>
              {session.endTime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <span>{language === 'vi' ? 'Kết thúc dự kiến' : 'Expected End'}: {formatDateTime(session.endTime)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/*<Card>*/}
        {/*  <CardHeader>*/}
        {/*    <CardTitle className="flex items-center gap-2">*/}
        {/*      <User className="w-5 h-5" />*/}
        {/*      {language === 'vi' ? 'Thông tin khách hàng' : 'Customer Information'}*/}
        {/*    </CardTitle>*/}
        {/*  </CardHeader>*/}
        {/*  <CardContent className="space-y-3 text-sm">*/}
        {/*    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">*/}
        {/*      <div className="flex items-center gap-2">*/}
        {/*        <User className="w-4 h-4 text-primary" />*/}
        {/*        <span>{session.userName || (language === 'vi' ? 'Chưa xác định' : 'Unknown')}</span>*/}
        {/*      </div>*/}
        {/*      <div className="flex items-center gap-2">*/}
        {/*        <Phone className="w-4 h-4 text-green-500" />*/}
        {/*        <span>{session.userPhone || (language === 'vi' ? 'Chưa có' : 'N/A')}</span>*/}
        {/*      </div>*/}
        {/*      <div className="flex items-center gap-2 break-all">*/}
        {/*        <Mail className="w-4 h-4 text-blue-500" />*/}
        {/*        <span>{session.userEmail || (language === 'vi' ? 'Chưa có' : 'N/A')}</span>*/}
        {/*      </div>*/}
        {/*      {session.vehiclePlate && (*/}
        {/*        <div className="flex items-center gap-2">*/}
        {/*          <Car className="w-4 h-4 text-amber-500" />*/}
        {/*          <span>{language === 'vi' ? 'Biển số' : 'Vehicle'}: {session.vehiclePlate}</span>*/}
        {/*        </div>*/}
        {/*      )}*/}
        {/*    </div>*/}
        {/*  </CardContent>*/}
        {/*</Card>*/}
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <CreditCard className="w-6 h-6 text-primary" />
              {translations.paymentRequired}
            </DialogTitle>
            <DialogDescription className="text-base">
              {translations.paymentDetails}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Card className="border-2">
              <CardContent className="p-6 space-y-4">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  {translations.sessionSummary}
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">{translations.timeElapsed}:</span>
                    <span className="font-medium">{formatTime(elapsedTime)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">{translations.energyConsumed}:</span>
                    <span className="font-medium">{session.energyConsumed.toFixed(2)} kWh</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">{language === 'vi' ? 'Pin sạc:' : 'Battery charged:'}:</span>
                    <span className="font-medium">{session.initialBattery}% → {Math.round(session.currentBattery)}%</span>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-between items-center py-3 bg-muted/50 rounded-lg px-3">
                    <span className="text-lg font-semibold">{translations.totalAmount}:</span>
                    <span className="text-2xl font-bold text-primary">{formatCurrency(session.totalCost)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex gap-3">
              <Button 
                onClick={handlePayment} 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3"
                size="lg"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                {translations.payNow}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowQRDialog(true)}
                className="flex-1 border-2 hover:bg-muted font-medium py-3"
                size="lg"
              >
                <QrCode className="w-5 h-5 mr-2" />
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
              {formatCurrency(finalizedMetrics?.cost ?? smoothCost)}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* 100% Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Battery className="w-5 h-5 text-green-500" />
              {language === 'vi' ? 'Pin đã sạc đầy 100%' : 'Battery Charged to 100%'}
            </DialogTitle>
            <DialogDescription>
              {language === 'vi' 
                ? 'Pin của bạn đã được sạc đầy 100%. Bạn có muốn kết thúc phiên sạc không?' 
                : 'Your battery has been charged to 100%. Would you like to end the charging session?'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Battery className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                100%
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {language === 'vi' 
                  ? 'Pin đã được sạc đầy hoàn toàn' 
                  : 'Battery fully charged'
                }
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleCompletionCancel}
                className="flex-1"
                disabled={loading || isChargingFinishing}
              >
                {language === 'vi' ? 'Tiếp tục sạc' : 'Continue Charging'}
              </Button>
              <Button
                onClick={handleCompletionConfirm}
                className={`flex-1 ${isChargingFinishing ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-60' : 'bg-green-600 hover:bg-green-700'}`}
                disabled={loading || isChargingFinishing}
              >
                {loading || isChargingFinishing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Square className="w-4 h-4 mr-2" />
                )}
                {isChargingFinishing 
                  ? (language === 'vi' ? 'Đang kết thúc...' : 'Finishing...')
                  : (language === 'vi' ? 'Kết thúc sạc' : 'End Charging')
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Confirmation Dialog */}
      <Dialog open={showPaymentConfirmation} onOpenChange={setShowPaymentConfirmation}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-500" />
              {language === 'vi' ? 'Xác nhận thanh toán' : 'Payment Confirmation'}
            </DialogTitle>
            <DialogDescription>
              {language === 'vi' 
                ? 'Vui lòng xem lại thông tin thanh toán trước khi xác nhận' 
                : 'Please review the payment information before confirming'
              }
            </DialogDescription>
          </DialogHeader>
          
          {paymentData && (
            <div className="space-y-6">
              {/* User and Station Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{language === 'vi' ? 'Thông tin phiên sạc' : 'Session Information'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {language === 'vi' ? 'Tên người dùng' : 'User Name'}
                      </label>
                      <p className="text-sm font-medium">{paymentData.userName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {language === 'vi' ? 'Trạm sạc' : 'Charging Station'}
                      </label>
                      <p className="text-sm font-medium">{paymentData.stationName}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        {language === 'vi' ? 'Địa chỉ trạm' : 'Station Address'}
                      </label>
                      <p className="text-sm font-medium">{paymentData.stationAddress}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Session Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{language === 'vi' ? 'Chi tiết phiên sạc' : 'Session Details'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {language === 'vi' ? 'Thời gian bắt đầu' : 'Start Time'}
                      </label>
                      <p className="text-sm font-medium">
                        {new Date(paymentData.sesionStartTime).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {language === 'vi' ? 'Thời gian kết thúc' : 'End Time'}
                      </label>
                      <p className="text-sm font-medium">
                        {new Date(paymentData.sessionEndTime).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {language === 'vi' ? 'Năng lượng tiêu thụ' : 'Energy Consumed'}
                      </label>
                      <p className="text-sm font-medium">{paymentData?.powerConsumed ?? 0} kWh</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {language === 'vi' ? 'Chi phí cơ bản' : 'Base Cost'}
                      </label>
                      <p className="text-sm font-medium">{formatCurrency(paymentData?.baseCost ?? 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Summary */}
              <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="text-lg text-green-800 dark:text-green-200">
                    {language === 'vi' ? 'Tổng thanh toán' : 'Payment Summary'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">
                      {language === 'vi' ? 'Tổng cộng' : 'Total Amount'}
                    </span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(paymentData?.totalFee ?? 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentConfirmation(false)}
                  className="flex-1"
                  disabled={paymentLoading}
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleConfirmPayment}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={paymentLoading}
                >
                  {paymentLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  {language === 'vi' ? 'Xác nhận thanh toán' : 'Confirm Payment'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}