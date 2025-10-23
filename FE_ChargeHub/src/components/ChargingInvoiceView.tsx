import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Battery, Zap, CreditCard, Wallet, FileText, Check, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';

interface ChargingSession {
  sessionId: string;
  stationName: string;
  startTime: Date;
  endTime: Date;
  startBattery: number;
  endBattery: number;
  energyConsumed: number; // kWh
  duration: number; // minutes
  subscriptionPlan: string;
}

interface ChargingInvoiceViewProps {
  session: ChargingSession;
  onClose: () => void;
  onPaymentComplete: () => void;
}

interface PaymentMethod {
  id: string;
  type: 'wallet' | 'card' | 'payLater';
  name: string;
  icon: React.ReactNode;
  balance?: number;
  available: boolean;
}

const ChargingInvoiceView: React.FC<ChargingInvoiceViewProps> = ({
  session,
  onClose,
  onPaymentComplete
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Pricing tiers based on subscription plans
  const pricingTiers = {
    basic: { rate: 3500, discount: 0, name: 'Basic Plan' },
    premium: { rate: 3500, discount: 0.15, name: 'Premium Plan' },
    vip: { rate: 3500, discount: 0.25, name: 'VIP Plan' },
    free: { rate: 3500, discount: 0, name: 'Pay-per-use' }
  };

  // Calculate costs
  const baseCost = session.energyConsumed * pricingTiers[session.subscriptionPlan as keyof typeof pricingTiers]?.rate || pricingTiers.free.rate;
  const discount = baseCost * (pricingTiers[session.subscriptionPlan as keyof typeof pricingTiers]?.discount || 0);
  const finalCost = baseCost - discount;

  // Payment methods
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'wallet',
      type: 'wallet',
      name: language === 'vi' ? 'Ví ChargeHub' : 'ChargeHub Wallet',
      icon: <Wallet className="w-5 h-5" />,
      balance: 245000, // VND
      available: true
    },
    {
      id: 'card',
      type: 'card',
      name: language === 'vi' ? 'Thẻ ATM/Debit' : 'ATM/Debit Card',
      icon: <CreditCard className="w-5 h-5" />,
      available: true
    },
    {
      id: 'payLater',
      type: 'payLater',
      name: language === 'vi' ? 'Ví trả sau' : 'Pay Later',
      icon: <FileText className="w-5 h-5" />,
      available: true
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (language === 'vi') {
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const handlePayment = async () => {
    if (!selectedPayment) {
      toast.error(language === 'vi' ? 'Vui lòng chọn phương thức thanh toán' : 'Please select a payment method');
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setShowSuccess(true);
      
      toast.success(language === 'vi' ? 'Thanh toán thành công!' : 'Payment successful!');
      
      setTimeout(() => {
        onPaymentComplete();
      }, 2000);
    }, 2000);
  };

  const translations = {
    vi: {
      title: 'Hoá đơn sạc điện',
      chargingSession: 'Phiên sạc',
      sessionDetails: 'Chi tiết phiên sạc',
      station: 'Trạm sạc',
      duration: 'Thời gian',
      energyUsed: 'Điện năng tiêu thụ',
      batteryCharged: 'Pin đã sạc',
      costBreakdown: 'Chi phí chi tiết',
      baseCost: 'Chi phí cơ bản',
      subscriptionDiscount: 'Giảm giá gói',
      totalAmount: 'Tổng thanh toán',
      paymentMethod: 'Phương thức thanh toán',
      selectPayment: 'Chọn phương thức thanh toán',
      walletBalance: 'Số dư ví',
      payNow: 'Thanh toán ngay',
      processing: 'Đang xử lý...',
      paymentSuccess: 'Thanh toán thành công!',
      close: 'Đóng'
    },
    en: {
      title: 'Charging Invoice',
      chargingSession: 'Charging Session',
      sessionDetails: 'Session Details',
      station: 'Station',
      duration: 'Duration',
      energyUsed: 'Energy Consumed',
      batteryCharged: 'Battery Charged',
      costBreakdown: 'Cost Breakdown',
      baseCost: 'Base Cost',
      subscriptionDiscount: 'Subscription Discount',
      totalAmount: 'Total Amount',
      paymentMethod: 'Payment Method',
      selectPayment: 'Select Payment Method',
      walletBalance: 'Wallet Balance',
      payNow: 'Pay Now',
      processing: 'Processing...',
      paymentSuccess: 'Payment Successful!',
      close: 'Close'
    }
  };

  const t = translations[language];

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full"
        >
          <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Check className="w-10 h-10 text-primary-foreground" />
              </motion.div>
              <h2 className="text-2xl mb-2 text-primary">{t.paymentSuccess}</h2>
              <p className="text-muted-foreground mb-6">
                {formatCurrency(finalCost)}
              </p>
              <Button onClick={onClose} className="w-full">
                {t.close}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 hover:bg-background/50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl text-foreground">{t.title}</h1>
              <p className="text-muted-foreground">
                {session.sessionId}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Session Summary */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="bg-gradient-to-r from-primary/20 to-secondary/20">
              <CardTitle className="flex items-center gap-2">
                <Battery className="w-5 h-5 text-primary" />
                {t.chargingSession}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t.station}:</span>
                    <span className="text-foreground">{session.stationName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t.duration}:</span>
                    <span className="text-foreground">{formatDuration(session.duration)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t.energyUsed}:</span>
                    <span className="text-foreground">{session.energyConsumed.toFixed(2)} kWh</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t.batteryCharged}:</span>
                    <span className="text-foreground">
                      {session.startBattery}% → {session.endBattery}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Plan:</span>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {pricingTiers[session.subscriptionPlan as keyof typeof pricingTiers]?.name || 'Basic'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Battery Progress */}
              <div className="mt-6">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>{session.startBattery}%</span>
                  <span>{session.endBattery}%</span>
                </div>
                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: `${session.startBattery}%` }}
                    animate={{ width: `${session.endBattery}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cost Breakdown */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-secondary-foreground" />
                {t.costBreakdown}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t.baseCost}:</span>
                <span className="text-foreground">{formatCurrency(baseCost)}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between items-center text-primary">
                  <span>{t.subscriptionDiscount}:</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between items-center text-lg">
                <span className="text-foreground">{t.totalAmount}:</span>
                <span className="text-primary">{formatCurrency(finalCost)}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-secondary-foreground" />
                {t.paymentMethod}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">{t.selectPayment}</p>
              
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <motion.div
                    key={method.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      selectedPayment === method.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 bg-card'
                    }`}
                    onClick={() => setSelectedPayment(method.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          selectedPayment === method.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}>
                          {method.icon}
                        </div>
                        <div>
                          <p className="text-foreground">{method.name}</p>
                          {method.balance && (
                            <p className="text-sm text-muted-foreground">
                              {t.walletBalance}: {formatCurrency(method.balance)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {method.balance && method.balance < finalCost && method.type === 'wallet' && (
                        <AlertCircle className="w-5 h-5 text-destructive" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <Button
                onClick={handlePayment}
                disabled={!selectedPayment || isProcessing}
                className="w-full h-12 text-lg"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                    />
                    {t.processing}
                  </div>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    {t.payNow} {formatCurrency(finalCost)}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ChargingInvoiceView;