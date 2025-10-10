import React, { useState, useEffect } from 'react';
import { ArrowLeft, Zap, Pause, Play, Square, Clock, Battery, MapPin, CreditCard, QrCode } from 'lucide-react';
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
import { toast } from 'sonner@2.0.3';
import { motion } from 'motion/react';
import QRCodeGenerator from './QRCodeGenerator';

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
  energyConsumed: number; // in kWh
  costPerKWh: number;
  totalCost: number;
  estimatedTimeRemaining: number; // in minutes
}

export default function ChargingSessionView({ onBack, bookingId }: ChargingSessionViewProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { bookings, updateBookingStatus, startChargingSession, endChargingSession, calculatePenaltyFees } = useBooking();
  
  const [session, setSession] = useState<ChargingSession>({
    id: `session-${Date.now()}`,
    bookingId,
    stationName: "EVN Station Thủ Đức",
    stationAddress: "123 Võ Văn Ngân, Thủ Đức, TP.HCM",
    chargerType: 'DC_FAST',
    power: 50,
    startTime: new Date().toISOString(),
    pausedTime: 0,
    status: 'charging',
    currentBattery: 45,
    targetBattery: 80,
    initialBattery: 45,
    energyConsumed: 0,
    costPerKWh: 3500, // VND per kWh
    totalCost: 0,
    estimatedTimeRemaining: 42
  });

  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

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

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (session.status === 'charging') {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
        
        // Simulate charging progress
        setSession(prev => {
          const newEnergyConsumed = prev.energyConsumed + (prev.power / 3600); // kWh per second
          const newCurrentBattery = Math.min(
            prev.targetBattery,
            prev.initialBattery + ((newEnergyConsumed / 50) * 100) // Assume 50kWh battery capacity
          );
          const newTotalCost = newEnergyConsumed * prev.costPerKWh;
          
          const batteryDifference = prev.targetBattery - newCurrentBattery;
          const newEstimatedTime = batteryDifference > 0 ? Math.ceil((batteryDifference / 100) * 50 * 60 / prev.power) : 0;
          
          return {
            ...prev,
            energyConsumed: newEnergyConsumed,
            currentBattery: newCurrentBattery,
            totalCost: newTotalCost,
            estimatedTimeRemaining: newEstimatedTime
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [session.status]);

  // Auto start charging session on mount
  useEffect(() => {
    if (!sessionStarted) {
      const currentTime = new Date().toISOString();
      startChargingSession(bookingId, currentTime);
      setSessionStarted(true);
    }
  }, [bookingId, startChargingSession, sessionStarted]);

  // Auto complete when target battery reached
  useEffect(() => {
    if (session.currentBattery >= session.targetBattery && session.status === 'charging') {
      const endTime = new Date().toISOString();
      setSession(prev => ({ ...prev, status: 'completed', endTime }));
      endChargingSession(bookingId, endTime);
      toast.success(language === 'vi' ? 'Sạc hoàn tất!' : 'Charging completed!');
      setShowPaymentDialog(true);
    }
  }, [session.currentBattery, session.targetBattery, session.status, bookingId, endChargingSession, language]);

  const handlePause = () => {
    setSession(prev => ({ ...prev, status: 'paused' }));
    toast.info(language === 'vi' ? 'Đã tạm dừng sạc' : 'Charging paused');
  };

  const handleContinue = () => {
    setSession(prev => ({ ...prev, status: 'charging' }));
    toast.success(language === 'vi' ? 'Tiếp tục sạc' : 'Charging resumed');
  };

  const handleStop = () => {
    const endTime = new Date().toISOString();
    setSession(prev => ({ 
      ...prev, 
      status: 'stopped', 
      endTime 
    }));
    endChargingSession(bookingId, endTime);
    toast.info(language === 'vi' ? 'Đã dừng sạc' : 'Charging stopped');
    setShowPaymentDialog(true);
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

  const batteryProgress = ((session.currentBattery - session.initialBattery) / (session.targetBattery - session.initialBattery)) * 100;

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
            <div className="flex-1">
              <h1 className="text-xl font-semibold">{translations.title}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{session.stationName}</span>
              </div>
            </div>
            <Badge className={`${getStatusColor()} text-white flex items-center gap-2`}>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              {translations.status[session.status]}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
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
                  {Math.round(session.currentBattery)}%
                </span>
              </div>
              <Progress value={batteryProgress} className="h-3" />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{session.initialBattery}%</span>
                <span>Target: {session.targetBattery}%</span>
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
                <p className="text-2xl font-bold">{session.energyConsumed.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">kWh</p>
              </div>
              
              <div className="text-center p-4 bg-card rounded-lg border">
                <CreditCard className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{formatCurrency(session.totalCost)}</p>
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
                    <span>{session.energyConsumed.toFixed(2)} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'vi' ? 'Pin sạc:' : 'Battery charged:'}:</span>
                    <span>{session.initialBattery}% → {Math.round(session.currentBattery)}%</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium text-lg">
                    <span>{translations.totalAmount}:</span>
                    <span className="text-primary">{formatCurrency(session.totalCost)}</span>
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
              data={{
                amount: (() => {
                  const currentBooking = bookings.find(b => b.id === bookingId);
                  const penaltyTotal = currentBooking?.penaltyFees?.total || 0;
                  return Math.round(session.totalCost + penaltyTotal);
                })(),
                sessionId: session.id,
                stationName: session.stationName
              }}
            />
            <p className="text-center text-sm text-muted-foreground">
              {language === 'vi' 
                ? 'Quét mã QR để thanh toán' 
                : 'Scan QR code to pay'
              }
            </p>
            <p className="text-center font-medium text-lg">
              {formatCurrency(session.totalCost)}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}