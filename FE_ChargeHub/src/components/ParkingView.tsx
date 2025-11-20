import React, { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, Clock, CreditCard, Zap, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useBooking } from '../contexts/BookingContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import QRCodeGenerator from './QRCodeGenerator';
import { api } from '../services/api';
import { ParkingSessionSummary } from '../types/parking';
import fetchParkingMonitoring from '../api/parkingMonitor';
import { buildFrontendUrl } from '../utils/url';

// Bỏ hard code, sẽ dùng giá trị từ BE
const PARKING_FEE_PER_MINUTE_FALLBACK = 5000; // Fallback nếu chưa có từ BE (giá trị mặc định từ BE)

interface PaymentDetail {
  userName: string;
  stationName: string;
  stationAddress: string;
  sesionStartTime: string;
  sessionEndTime: string;
  powerConsumed: number;
  baseCost: number;
  totalFee: number;
}

interface ParkingViewProps {
  data: ParkingSessionSummary | null;
  onBack: () => void;
  onParkingSessionClear: () => void;
}

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const formatDateTime = (value?: string, locale: 'vi' | 'en' = 'vi') => {
  if (!value) return locale === 'vi' ? 'Không có dữ liệu' : 'N/A';
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US');
};

const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '0đ';
  return `${Math.round(amount).toLocaleString('vi-VN')}đ`;
};

export default function ParkingView({ data, onBack, onParkingSessionClear }: ParkingViewProps) {
  const { language } = useLanguage();
  const { bookings } = useBooking();
  const paymentReturnUrl = useMemo(() => buildFrontendUrl('/payment/result'), []);

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentDetail | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    if (!data?.parkingStartTime) return 0;
    const start = new Date(data.parkingStartTime).getTime();
    return Number.isNaN(start) ? 0 : Math.max(0, Math.floor((Date.now() - start) / 1000));
  });
  const [finalizedCost, setFinalizedCost] = useState(data?.totalCost ?? 0);
  const [finalizedEnergy, setFinalizedEnergy] = useState(data?.energyConsumed ?? 0);
  const [parkingFeeOverride, setParkingFeeOverride] = useState<number | null>(null);
  const [parkingRatePerMinute, setParkingRatePerMinute] = useState<number | null>(null);
  
  // Lưu parkingStartTime từ API để FE tự tính elapsed time
  const [parkingStartTime, setParkingStartTime] = useState<string | null>(data?.parkingStartTime || null);

  // FE tự tính elapsed time dựa trên parkingStartTime từ BE
  useEffect(() => {
    if (!parkingStartTime) return;
    const startTimestamp = new Date(parkingStartTime).getTime();
    if (Number.isNaN(startTimestamp)) return;
    const updateTimer = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startTimestamp) / 1000)));
    };
    updateTimer();
    const interval = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(interval);
  }, [parkingStartTime]);

  useEffect(() => {
    if (data) {
      setFinalizedCost(data.totalCost);
      setFinalizedEnergy(data.energyConsumed);
    }
  }, [data]);

  useEffect(() => {
    setParkingFeeOverride(null);
    // Reset parkingStartTime khi sessionId thay đổi
    setParkingStartTime(data?.parkingStartTime || null);
  }, [data?.sessionId, data?.parkingStartTime]);

  useEffect(() => {
    if (!data?.sessionId) {
      return;
    }

    const sessionId = data.sessionId;

    let cancelled = false;
    let interval: number | undefined;

    const poll = async (options?: { silent?: boolean }) => {
      try {
        const monitoring = await fetchParkingMonitoring(sessionId);
        if (cancelled || !monitoring) return;
        
        // ✅ CHỈ LẤY parkingStartTime TỪ BE, FE TỰ TÍNH elapsed time
        // BE chỉ cần gửi parkingStartTime, FE sẽ tự tính elapsedSeconds = Date.now() - parkingStartTime
        if (monitoring.parkingStartTime) {
          // Cập nhật parkingStartTime nếu có (lần đầu hoặc khi thay đổi)
          setParkingStartTime((current) => {
            if (current !== monitoring.parkingStartTime) {
              if (!options?.silent) {
                console.log(`[Parking Timer] Cập nhật parkingStartTime từ BE: ${monitoring.parkingStartTime}`);
              }
              return monitoring.parkingStartTime!;
            }
            return current;
          });
        }
        
        // Cập nhật các giá trị khác từ BE
        if (typeof monitoring.currentFee === 'number') {
          setParkingFeeOverride(monitoring.currentFee);
        }
        if (typeof monitoring.chargingCost === 'number') {
          setFinalizedCost(monitoring.chargingCost);
        }
        if (typeof monitoring.parkingRatePerMinute === 'number') {
          setParkingRatePerMinute(monitoring.parkingRatePerMinute);
        }
      } catch (error) {
        if (!options?.silent) {
          console.error('Failed to monitor parking session:', error);
        }
      }
    };

    poll();
    interval = window.setInterval(() => poll({ silent: true }), 5000);

    return () => {
      cancelled = true;
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, [data?.sessionId]);

  const parkingFee = useMemo(() => {
    // Ưu tiên dùng giá trị từ BE (estimatedParkingFee)
    if (parkingFeeOverride !== null) {
      return parkingFeeOverride;
    }
    // Tính tạm dựa trên rate từ BE (fallback nếu chưa có rate từ BE thì dùng 5000)
    const rate = parkingRatePerMinute ?? PARKING_FEE_PER_MINUTE_FALLBACK;
    return Math.max(0, Math.ceil(elapsedSeconds / 60) * rate);
  }, [parkingFeeOverride, elapsedSeconds, parkingRatePerMinute]);
  const totalEstimatedCost = (finalizedCost ?? 0) + parkingFee;

  const translations = {
    title: language === 'vi' ? 'Đang đỗ xe sau khi sạc' : 'Post-Charge Parking',
    subtitle: language === 'vi'
      ? 'Phí đỗ xe đang được tính dựa theo thời gian thực. Vui lòng kết thúc khi sẵn sàng thanh toán.'
      : 'Parking fee continues to accrue. End parking when you are ready to pay.',
    summaryTitle: language === 'vi' ? 'Tóm tắt phiên sạc' : 'Charging Summary',
    trackerTitle: language === 'vi' ? 'Theo dõi parking' : 'Parking Tracker',
    timerLabel: language === 'vi' ? 'Thời gian đỗ xe' : 'Parking Duration',
    feePerMinute: language === 'vi' ? 'Phí đỗ xe / phút' : 'Parking Fee / min',
    parkingFee: language === 'vi' ? 'Phí đỗ xe hiện tại' : 'Current Parking Fee',
    startLabel: language === 'vi' ? 'Bắt đầu đỗ' : 'Parking Started',
    finishParking: language === 'vi' ? 'Kết thúc parking' : 'Finish Parking',
    totalEstimate: language === 'vi' ? 'Tổng phí tạm tính (sạc + parking)' : 'Estimated Total (Charging + Parking)',
    paymentRequired: language === 'vi' ? 'Thanh toán phí sạc & parking' : 'Pay Charging & Parking Fees',
    paymentDetails: language === 'vi' ? 'Chi tiết thanh toán' : 'Payment Details',
    sessionSummary: language === 'vi' ? 'Tóm tắt phiên sạc' : 'Session Summary',
    timeElapsed: language === 'vi' ? 'Thời gian đã sạc' : 'Time Elapsed',
    energyConsumed: language === 'vi' ? 'Năng lượng tiêu thụ' : 'Energy Consumed',
    parkingTimer: language === 'vi' ? 'Thời gian đỗ xe' : 'Parking Duration',
    parkingFeeLabel: language === 'vi' ? 'Phí đỗ xe' : 'Parking Fee',
    totalAmount: language === 'vi' ? 'Tổng số tiền' : 'Total Amount',
    payNow: language === 'vi' ? 'Thanh toán ngay' : 'Pay Now',
    payWithQR: language === 'vi' ? 'Thanh toán QR' : 'Pay with QR',
    paymentSummary: language === 'vi' ? 'Tổng thanh toán' : 'Payment Summary',
    back: language === 'vi' ? 'Quay lại' : 'Back',
    emptyTitle: language === 'vi' ? 'Không có dữ liệu parking' : 'No parking data',
    emptyDesc: language === 'vi'
      ? 'Bạn chưa có phiên parking nào đang hoạt động. Hãy bắt đầu sạc và kết thúc để chuyển sang parking.'
      : 'You do not have an active parking session. Start and finish a charging session to enter parking mode.'
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

  const fetchPaymentDetail = async (sessionId: string, userId: string, options?: { silent?: boolean }) => {
    try {
      const res = await api.get('/api/payment/detail', {
        params: {
          sessionId,
          userId,
        },
      });
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
    setFinalizedCost(detail.totalFee);
    setFinalizedEnergy(detail.powerConsumed);
    setPaymentData(detail);
  };

  const handlePayment = async () => {
    if (!data) return;
    try {
      setPaymentLoading(true);
      let sessionId = data.sessionId || localStorage.getItem("currentSessionId");
      const userId = localStorage.getItem("userId");
      if (!sessionId || !userId) {
        toast.error(language === 'vi' ? 'Không tìm thấy thông tin phiên sạc' : 'Session information not found');
        return;
      }
      const paymentDetail = await fetchPaymentDetail(sessionId, userId);
      if (!paymentDetail) {
        toast.error(language === 'vi' ? 'Không thể lấy thông tin thanh toán' : 'Unable to fetch payment information');
        return;
      }
      applyPaymentDetail(paymentDetail);
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

  const handleDirectPayment = async () => {
    if (!data) return;
    try {
      let sessionId = data.sessionId || localStorage.getItem("currentSessionId");
      const userId = localStorage.getItem("userId");
      if (!sessionId || !userId) {
        toast.error(language === 'vi' ? 'Không tìm thấy thông tin phiên sạc' : 'Session information not found');
        return;
      }

      const detailForSync = await fetchPaymentDetail(sessionId, userId, { silent: true });
      if (detailForSync) {
        applyPaymentDetail(detailForSync);
      }

      // Convert to numbers as backend expects Long
      const sessionIdNum = Number(sessionId);
      const userIdNum = Number(userId);
      
      if (isNaN(sessionIdNum) || isNaN(userIdNum)) {
        toast.error(language === 'vi' ? 'Thông tin phiên sạc không hợp lệ' : 'Invalid session information');
        return;
      }

      const payload = {
        sessionId: sessionIdNum,
        userId: userIdNum,
        paymentMethod: "VNPAY",
        returnUrl: paymentReturnUrl,
        bankCode: "NCB"
      };

      const res = await api.post('/api/payment/initiate', payload);

      if (res.status === 200 && res.data.success) {
        setShowPaymentConfirmation(false);
        setShowPaymentDialog(false);
        toast.success(language === 'vi'
          ? 'Đang chuyển đến trang thanh toán...'
          : 'Redirecting to payment...'
        );
        onParkingSessionClear();
        localStorage.removeItem("parkingSessionSummary");
        setTimeout(() => {
          window.location.href = res.data.data.paymentUrl;
        }, 500);
      } else {
        throw new Error(res.data?.message || 'Payment initiation failed');
      }
    } catch (err: any) {
      console.error('Error initiating payment:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Unknown error';
      console.error('Error details:', {
        message: errorMessage,
        status: err?.response?.status,
        data: err?.response?.data
      });
      toast.error(language === 'vi' 
        ? `Lỗi khi khởi tạo thanh toán: ${errorMessage}` 
        : `Error initiating payment: ${errorMessage}`
      );
      throw err;
    }
  };

  const handleConfirmPayment = async () => {
    try {
      setPaymentLoading(true);
      await handleDirectPayment();
    } catch {
      toast.error(language === 'vi' ? 'Lỗi khi xử lý thanh toán' : 'Error processing payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleFinishParking = () => {
    setShowPaymentDialog(true);
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-emerald-50 dark:from-gray-950 dark:via-slate-950 dark:to-emerald-950">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            {translations.back}
          </Button>
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>{translations.emptyTitle}</CardTitle>
              <CardDescription>{translations.emptyDesc}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-emerald-50 dark:from-gray-950 dark:via-slate-950 dark:to-emerald-950">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-2 hover:bg-primary/10 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{translations.title}</h1>
            <p className="text-sm text-muted-foreground">{translations.subtitle}</p>
          </div>
          <Button onClick={handleFinishParking} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {translations.finishParking}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600" />
              {translations.summaryTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-white/70 dark:bg-gray-900/40">
                <p className="text-sm text-muted-foreground">{translations.timeElapsed}</p>
                <p className="text-2xl font-semibold text-primary">
                  {formatTime(Math.max(0, Math.floor((new Date(data.endTime).getTime() - new Date(data.startTime).getTime()) / 1000)))}
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-white/70 dark:bg-gray-900/40">
                <p className="text-sm text-muted-foreground">{translations.energyConsumed}</p>
                <p className="text-2xl font-semibold">{finalizedEnergy.toFixed(2)} kWh</p>
              </div>
              <div className="p-4 rounded-lg border bg-white/70 dark:bg-gray-900/40">
                <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Bắt đầu sạc' : 'Charging Started'}</p>
                <p className="font-medium">{formatDateTime(data.startTime, language === 'vi' ? 'vi' : 'en')}</p>
              </div>
              <div className="p-4 rounded-lg border bg-white/70 dark:bg-gray-900/40">
                <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Kết thúc sạc' : 'Charging Ended'}</p>
                <p className="font-medium">{formatDateTime(data.endTime, language === 'vi' ? 'vi' : 'en')}</p>
              </div>
              <div className="p-4 rounded-lg border bg-white/70 dark:bg-gray-900/40 md:col-span-2">
                <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Chi phí phiên sạc' : 'Charging Cost'}</p>
                <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{formatCurrency(finalizedCost)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Trạm sạc' : 'Station'}</p>
                <p className="font-semibold">{data.stationName}</p>
                <p className="text-sm text-muted-foreground">{data.stationAddress}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Thông tin trụ' : 'Connector'}</p>
                <p className="font-semibold">{data.chargerType} · {data.power}kW</p>
                {data.chargingPointName && (
                  <p className="text-sm text-muted-foreground">
                    {language === 'vi' ? 'Trụ' : 'Point'}: {data.chargingPointName}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              {translations.trackerTitle}
            </CardTitle>
            <CardDescription>{translations.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{translations.timerLabel}</p>
              <p className="text-4xl font-bold text-blue-700 dark:text-blue-300 mt-2">
                {formatTime(elapsedSeconds)}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border bg-white/70 dark:bg-gray-900/40">
                <p className="text-sm text-muted-foreground">{translations.parkingFee}</p>
                <p className="text-2xl font-semibold text-blue-600">{formatCurrency(parkingFee)}</p>
              </div>
              <div className="p-4 rounded-lg border bg-white/70 dark:bg-gray-900/40">
                <p className="text-sm text-muted-foreground">{translations.feePerMinute}</p>
                <p className="text-xl font-semibold">{formatCurrency(parkingRatePerMinute ?? PARKING_FEE_PER_MINUTE_FALLBACK)}</p>
              </div>
              <div className="p-4 rounded-lg border bg-white/70 dark:bg-gray-900/40">
                <p className="text-sm text-muted-foreground">{translations.startLabel}</p>
                <p className="font-medium">{formatDateTime(data.parkingStartTime, language === 'vi' ? 'vi' : 'en')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{translations.totalEstimate}</p>
                <p className="text-3xl font-bold text-primary mt-1">
                  {formatCurrency(totalEstimatedCost)}
                </p>
              </div>
              <Button onClick={handleFinishParking} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <CreditCard className="w-5 h-5 mr-2" />
                {translations.finishParking}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'vi'
                ? 'Sau khi kết thúc parking bạn sẽ được chuyển sang bước thanh toán.'
                : 'Finish parking to proceed to payment.'}
            </p>
          </CardContent>
        </Card>
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
                    <span className="font-medium">{formatTime(Math.max(0, Math.floor((new Date(data.endTime).getTime() - new Date(data.startTime).getTime()) / 1000)))}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">{translations.energyConsumed}:</span>
                    <span className="font-medium">{finalizedEnergy.toFixed(2)} kWh</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">{translations.parkingTimer}:</span>
                    <span className="font-medium">{formatTime(elapsedSeconds)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">{translations.parkingFeeLabel}:</span>
                    <span className="font-medium">{formatCurrency(parkingFee)}</span>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-between items-center py-3 bg-muted/50 rounded-lg px-3">
                    <span className="text-lg font-semibold">{translations.totalAmount}:</span>
                    <span className="text-2xl font-bold text-primary">{formatCurrency(totalEstimatedCost)}</span>
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
                <CreditCard className="w-5 h-5 mr-2" />
                {translations.payWithQR}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{translations.payWithQR}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <QRCodeGenerator
              value={JSON.stringify({
                amount: (() => {
                  const currentBooking = bookings.find(b => b.id === data.bookingId);
                  const penaltyTotal = currentBooking?.penaltyFees?.total || 0;
                  return Math.round((finalizedCost ?? 0) + parkingFee + penaltyTotal);
                })(),
                sessionId: data.sessionId,
                stationName: data.stationName,
                bookingId: data.bookingId
              })}
              size={200}
            />
            <p className="text-center text-sm text-muted-foreground">
              {language === 'vi' ? 'Quét mã QR để thanh toán' : 'Scan QR code to pay'}
            </p>
            <p className="text-center font-medium text-lg">
              {formatCurrency((finalizedCost ?? 0) + parkingFee)}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Confirmation */}
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
                : 'Please review the payment information before confirming'}
            </DialogDescription>
          </DialogHeader>

          {paymentData && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{language === 'vi' ? 'Thông tin phiên sạc' : 'Session Information'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{language === 'vi' ? 'Tên người dùng' : 'User Name'}</label>
                      <p className="text-sm font-medium">{paymentData.userName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{language === 'vi' ? 'Trạm sạc' : 'Charging Station'}</label>
                      <p className="text-sm font-medium">{paymentData.stationName}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">{language === 'vi' ? 'Địa chỉ trạm' : 'Station Address'}</label>
                      <p className="text-sm font-medium">{paymentData.stationAddress}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{language === 'vi' ? 'Chi tiết phiên sạc' : 'Session Details'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{language === 'vi' ? 'Thời gian bắt đầu' : 'Start Time'}</label>
                      <p className="text-sm font-medium">{new Date(paymentData.sesionStartTime).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{language === 'vi' ? 'Thời gian kết thúc' : 'End Time'}</label>
                      <p className="text-sm font-medium">{new Date(paymentData.sessionEndTime).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{language === 'vi' ? 'Năng lượng tiêu thụ' : 'Energy Consumed'}</label>
                      <p className="text-sm font-medium">{paymentData.powerConsumed} kWh</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{language === 'vi' ? 'Chi phí cơ bản' : 'Base Cost'}</label>
                      <p className="text-sm font-medium">{formatCurrency(paymentData.baseCost)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="text-lg text-green-800 dark:text-green-200">
                    {translations.paymentSummary}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{language === 'vi' ? 'Chi phí sạc' : 'Charging Cost'}</span>
                    <span className="font-medium">{formatCurrency(paymentData.totalFee)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{translations.parkingFeeLabel}</span>
                    <span className="font-medium">{formatCurrency(parkingFee)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">{translations.totalAmount}</span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(paymentData.totalFee + parkingFee)}
                    </span>
                  </div>
                </CardContent>
              </Card>

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


