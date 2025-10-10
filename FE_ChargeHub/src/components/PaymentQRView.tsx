import { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { QrCode, CreditCard, Banknote, CheckCircle, ArrowLeft, Mail, Clock, Copy } from "lucide-react";
import { calculateDiscountedPrice, getCurrentUserSubscription, getSubscriptionPlan } from "../data/subscriptionData";

interface PaymentQRViewProps {
  onBack: () => void;
  invoiceData: {
    id: string;
    customerName: string;
    customerEmail: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    totalAmount: number;
    customerId?: string;
  };
}

export default function PaymentQRView({ onBack, invoiceData }: PaymentQRViewProps) {
  const { language, t } = useLanguage();
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'cash' | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes

  // Calculate pricing with subscription discount
  const userSubscription = getCurrentUserSubscription(invoiceData.customerId || '');
  const pricingInfo = calculateDiscountedPrice(invoiceData.totalAmount, userSubscription);
  const subscriptionPlan = userSubscription ? getSubscriptionPlan(userSubscription.planId) : null;

  // Countdown timer for QR code expiry
  useEffect(() => {
    if (paymentStatus === 'pending' && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining, paymentStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handlePaymentConfirm = (method: 'qr' | 'cash') => {
    setPaymentMethod(method);
    setPaymentStatus('processing');
    
    // Simulate payment processing
    setTimeout(() => {
      setPaymentStatus('completed');
      
      // Send email after successful payment
      setTimeout(() => {
        setEmailSent(true);
      }, 1000);
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (paymentStatus === 'completed') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              {language === 'vi' ? 'Thanh toán thành công!' : 'Payment Successful!'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {language === 'vi' 
                ? `Hóa đơn #${invoiceData.id} đã được thanh toán`
                : `Invoice #${invoiceData.id} has been paid`
              }
            </p>

            <Card className="p-6 mb-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {language === 'vi' ? 'Phương thức thanh toán:' : 'Payment Method:'}
                  </span>
                  <span className="font-medium">
                    {paymentMethod === 'qr' 
                      ? (language === 'vi' ? 'Quét mã QR' : 'QR Code')
                      : (language === 'vi' ? 'Tiền mặt' : 'Cash')
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {language === 'vi' ? 'Số tiền đã thanh toán:' : 'Amount Paid:'}
                  </span>
                  <span className="font-semibold text-lg">
                    {formatCurrency(pricingInfo.discountedPrice)}
                  </span>
                </div>
                {pricingInfo.discount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>
                      {language === 'vi' ? 'Tiết kiệm được:' : 'Savings:'}
                    </span>
                    <span className="font-medium">
                      -{formatCurrency(pricingInfo.discountAmount)} ({pricingInfo.discount}%)
                    </span>
                  </div>
                )}
              </div>
            </Card>

            <div className="flex items-center justify-center space-x-2 mb-6">
              <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-green-600 dark:text-green-400">
                {emailSent 
                  ? (language === 'vi' ? 'Hóa đơn đã được gửi qua email' : 'Invoice sent via email')
                  : (language === 'vi' ? 'Đang gửi hóa đơn...' : 'Sending invoice...')
                }
              </span>
            </div>

            <div className="space-y-3">
              <Button onClick={onBack} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'vi' ? 'Quay về Dashboard' : 'Back to Dashboard'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={onBack} className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'vi' ? 'Quay lại' : 'Back'}
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {language === 'vi' ? 'Thanh toán hóa đơn' : 'Invoice Payment'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'vi' ? `Hóa đơn #${invoiceData.id}` : `Invoice #${invoiceData.id}`}
            </p>
          </div>
        </div>

        {/* Customer Information */}
        <Card className="p-6 mb-6">
          <h3 className="font-semibold mb-4">
            {language === 'vi' ? 'Thông tin khách hàng' : 'Customer Information'}
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {language === 'vi' ? 'Tên:' : 'Name:'}
              </span>
              <span>{invoiceData.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span>{invoiceData.customerEmail}</span>
            </div>
            {subscriptionPlan && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === 'vi' ? 'Gói đăng ký:' : 'Subscription:'}
                </span>
                <Badge variant="secondary">{subscriptionPlan.name}</Badge>
              </div>
            )}
          </div>
        </Card>

        {/* Pricing Information */}
        <Card className="p-6 mb-6">
          <h3 className="font-semibold mb-4">
            {language === 'vi' ? 'Chi tiết thanh toán' : 'Payment Details'}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {language === 'vi' ? 'Tổng tiền gốc:' : 'Original Amount:'}
              </span>
              <span>{formatCurrency(pricingInfo.originalPrice)}</span>
            </div>
            
            {pricingInfo.discount > 0 && (
              <>
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>
                    {language === 'vi' ? `Giảm giá (${pricingInfo.discount}%):` : `Discount (${pricingInfo.discount}%):`}
                  </span>
                  <span>-{formatCurrency(pricingInfo.discountAmount)}</span>
                </div>
                <Separator />
              </>
            )}
            
            <div className="flex justify-between text-lg font-semibold">
              <span>
                {language === 'vi' ? 'Tổng thanh toán:' : 'Total Amount:'}
              </span>
              <span>{formatCurrency(pricingInfo.discountedPrice)}</span>
            </div>
          </div>
        </Card>

        {/* Payment Methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* QR Code Payment */}
          <Card className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">
                {language === 'vi' ? 'Quét mã QR' : 'Scan QR Code'}
              </h3>
              
              {/* QR Code Placeholder */}
              <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-16 h-16 text-muted-foreground" />
              </div>
              
              <div className="flex items-center justify-center space-x-2 mb-4 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>
                  {language === 'vi' ? `Hết hạn sau: ${formatTime(timeRemaining)}` : `Expires in: ${formatTime(timeRemaining)}`}
                </span>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {language === 'vi' ? 'Số tiền:' : 'Amount:'}
                  </span>
                  <span className="font-medium">{formatCurrency(pricingInfo.discountedPrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    {language === 'vi' ? 'Mã GD:' : 'Ref:'}
                  </span>
                  <div className="flex items-center space-x-1">
                    <span className="font-mono text-xs">{invoiceData.id}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(invoiceData.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => handlePaymentConfirm('qr')} 
                className="w-full"
                disabled={paymentStatus === 'processing'}
              >
                {paymentStatus === 'processing' 
                  ? (language === 'vi' ? 'Đang xử lý...' : 'Processing...')
                  : (language === 'vi' ? 'Xác nhận thanh toán QR' : 'Confirm QR Payment')
                }
              </Button>
            </div>
          </Card>

          {/* Cash Payment */}
          <Card className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Banknote className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold mb-4">
                {language === 'vi' ? 'Thanh toán tiền mặt' : 'Cash Payment'}
              </h3>
              
              <div className="bg-muted rounded-lg p-4 mb-4">
                <div className="text-2xl font-bold text-foreground mb-2">
                  {formatCurrency(pricingInfo.discountedPrice)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {language === 'vi' 
                    ? 'Khách hàng thanh toán bằng tiền mặt'
                    : 'Customer pays with cash'
                  }
                </p>
              </div>

              <Button 
                onClick={() => handlePaymentConfirm('cash')} 
                variant="outline"
                className="w-full"
                disabled={paymentStatus === 'processing'}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {paymentStatus === 'processing' 
                  ? (language === 'vi' ? 'Đang xử lý...' : 'Processing...')
                  : (language === 'vi' ? 'Xác nhận thanh toán mặt' : 'Confirm Cash Payment')
                }
              </Button>
            </div>
          </Card>
        </div>

        {/* Invoice Items */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">
            {language === 'vi' ? 'Chi tiết hóa đơn' : 'Invoice Items'}
          </h3>
          <div className="space-y-3">
            {invoiceData.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex-1">
                  <span className="font-medium">{item.description}</span>
                  <div className="text-sm text-muted-foreground">
                    {language === 'vi' ? 'SL:' : 'Qty:'} {item.quantity} × {formatCurrency(item.unitPrice)}
                  </div>
                </div>
                <span className="font-medium">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}