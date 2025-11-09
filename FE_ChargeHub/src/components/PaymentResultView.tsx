import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle2, XCircle, Loader2, CreditCard } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';
import { api } from '../services/api';

export default function PaymentResultView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'processing'>('processing');
  const [paymentInfo, setPaymentInfo] = useState<{
    amount?: string;
    transactionId?: string;
    orderId?: string;
    message?: string;
  }>({});

  useEffect(() => {
    const processPaymentResult = async () => {
      try {
        // Get VNPay response parameters
        const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
        const vnp_Amount = searchParams.get('vnp_Amount');
        const vnp_TxnRef = searchParams.get('vnp_TxnRef');
        const vnp_TransactionNo = searchParams.get('vnp_TransactionNo');
        const vnp_OrderInfo = searchParams.get('vnp_OrderInfo');

        console.log('VNPay Response:', {
          vnp_ResponseCode,
          vnp_Amount,
          vnp_TxnRef,
          vnp_TransactionNo,
          vnp_OrderInfo
        });

        // Forward callback params to backend to ensure transaction status updates
        const queryParams = Object.fromEntries(searchParams.entries());
        try {
          await api.get('/api/payment/vnpay/callback', { params: queryParams });
          console.log('Forwarded VNPay callback to backend');
        } catch (callbackError) {
          console.error('Error forwarding callback to backend:', callbackError);
        }

        // Check payment status based on response code
        // 00: Success, others: Failed
        if (vnp_ResponseCode === '00') {
          setPaymentStatus('success');
          
          // Format amount (VNPay returns amount * 100)
          const formattedAmount = vnp_Amount 
            ? (parseInt(vnp_Amount) / 100).toLocaleString('vi-VN') + '₫'
            : 'N/A';

          setPaymentInfo({
            amount: formattedAmount,
            transactionId: vnp_TransactionNo || 'N/A',
            orderId: vnp_TxnRef || 'N/A',
            message: language === 'vi' ? 'Thanh toán thành công!' : 'Payment successful!'
          });

          toast.success(language === 'vi' ? 'Thanh toán thành công!' : 'Payment successful!');

          // Auto redirect to dashboard after 3 seconds
          setTimeout(() => {
            navigate('/home');
          }, 3000);
        } else {
          setPaymentStatus('failed');
          
          const errorMessages: { [key: string]: { vi: string; en: string } } = {
            '07': { vi: 'Giao dịch bị nghi ngờ gian lận', en: 'Transaction suspected of fraud' },
            '09': { vi: 'Thẻ chưa đăng ký dịch vụ Internet Banking', en: 'Card not registered for Internet Banking' },
            '10': { vi: 'Xác thực thông tin thẻ không đúng quá số lần quy định', en: 'Card authentication failed too many times' },
            '11': { vi: 'Hết hạn chờ thanh toán', en: 'Payment timeout' },
            '12': { vi: 'Thẻ bị khóa', en: 'Card is locked' },
            '13': { vi: 'Mật khẩu xác thực OTP không chính xác', en: 'Incorrect OTP password' },
            '24': { vi: 'Giao dịch bị hủy', en: 'Transaction cancelled' },
            '51': { vi: 'Tài khoản không đủ số dư', en: 'Insufficient balance' },
            '65': { vi: 'Vượt quá hạn mức giao dịch trong ngày', en: 'Exceeded daily transaction limit' },
            '75': { vi: 'Ngân hàng thanh toán đang bảo trì', en: 'Payment bank under maintenance' },
            '79': { vi: 'Nhập sai mật khẩu quá số lần quy định', en: 'Incorrect password too many times' },
            'default': { vi: 'Giao dịch không thành công', en: 'Transaction failed' }
          };

          const defaultMsg = { vi: 'Giao dịch không thành công', en: 'Transaction failed' };
          const errorMsg = errorMessages[vnp_ResponseCode || 'default'] || defaultMsg;
          
          setPaymentInfo({
            amount: vnp_Amount ? (parseInt(vnp_Amount) / 100).toLocaleString('vi-VN') + '₫' : 'N/A',
            transactionId: vnp_TransactionNo || 'N/A',
            orderId: vnp_TxnRef || 'N/A',
            message: language === 'vi' ? errorMsg.vi : errorMsg.en
          });

          toast.error(language === 'vi' ? errorMsg.vi : errorMsg.en);
        }
      } catch (error) {
        console.error('Error processing payment result:', error);
        setPaymentStatus('failed');
        setPaymentInfo({
          message: language === 'vi' ? 'Lỗi xử lý kết quả thanh toán' : 'Error processing payment result'
        });
        toast.error(language === 'vi' ? 'Lỗi xử lý kết quả thanh toán' : 'Error processing payment result');
      } finally {
        setLoading(false);
      }
    };

    processPaymentResult();
  }, [searchParams, language, navigate]);

  const handleBackToDashboard = () => {
    navigate('/home');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-neutral-950 to-black">
        <Card className="w-full max-w-md bg-neutral-900 border border-neutral-800 text-neutral-100 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-16 h-16 text-emerald-400 animate-spin mb-4" />
            <p className="text-lg font-medium">
              {language === 'vi' ? 'Đang xử lý kết quả thanh toán...' : 'Processing payment result...'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-neutral-950 to-black p-4">
      <Card className="w-full max-w-2xl bg-neutral-900 text-neutral-100 border border-neutral-800 shadow-[0_25px_80px_rgba(0,0,0,0.6)]">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-3 text-2xl text-emerald-400">
            <CreditCard className="w-8 h-8" />
            {language === 'vi' ? 'Kết quả thanh toán' : 'Payment Result'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Icon */}
          <div className="flex flex-col items-center justify-center py-8">
            {paymentStatus === 'success' ? (
              <>
                <CheckCircle2 className="w-24 h-24 text-emerald-400 mb-4" />
                <h2 className="text-3xl font-bold text-emerald-400 mb-2">
                  {language === 'vi' ? 'Thanh toán thành công!' : 'Payment Successful!'}
                </h2>
                <p className="text-neutral-300 text-center">
                  {language === 'vi' 
                    ? 'Giao dịch của bạn đã được xử lý thành công.' 
                    : 'Your transaction has been processed successfully.'}
                </p>
              </>
            ) : (
              <>
                <XCircle className="w-24 h-24 text-rose-400 mb-4" />
                <h2 className="text-3xl font-bold text-rose-400 mb-2">
                  {language === 'vi' ? 'Thanh toán thất bại!' : 'Payment Failed!'}
                </h2>
                <p className="text-neutral-300 text-center">
                  {paymentInfo.message || (language === 'vi' 
                    ? 'Giao dịch của bạn không thành công.' 
                    : 'Your transaction was not successful.')}
                </p>
              </>
            )}
          </div>

          {/* Payment Details */}
          <div className="bg-neutral-800/60 rounded-2xl p-6 space-y-4 border border-neutral-700">
            <h3 className="text-lg font-semibold mb-4">
              {language === 'vi' ? 'Chi tiết giao dịch' : 'Transaction Details'}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-neutral-400">
                  {language === 'vi' ? 'Mã giao dịch' : 'Transaction ID'}
                </p>
                <p className="font-medium">{paymentInfo.transactionId}</p>
              </div>
              
              <div>
                <p className="text-sm text-neutral-400">
                  {language === 'vi' ? 'Mã đơn hàng' : 'Order ID'}
                </p>
                <p className="font-medium">{paymentInfo.orderId}</p>
              </div>
              
              <div className="col-span-2">
                <p className="text-sm text-neutral-400">
                  {language === 'vi' ? 'Số tiền' : 'Amount'}
                </p>
                <p className="text-3xl font-bold text-emerald-400">
                  {paymentInfo.amount}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleBackToDashboard}
              className={`flex-1 ${paymentStatus === 'success' ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_10px_30px_rgba(16,185,129,0.3)]' : 'border-neutral-700 text-neutral-100 hover:bg-neutral-800'}`}
              variant={paymentStatus === 'success' ? 'default' : 'outline'}
            >
              {language === 'vi' ? 'Về trang chủ' : 'Back to Dashboard'}
            </Button>
            
            {paymentStatus === 'failed' && (
              <Button
                onClick={() => window.history.back()}
                className="flex-1 border border-neutral-700 text-neutral-100 hover:bg-neutral-800"
              >
                {language === 'vi' ? 'Thử lại' : 'Try Again'}
              </Button>
            )}
          </div>

          {/* Auto redirect message for success */}
          {paymentStatus === 'success' && (
            <p className="text-center text-sm text-neutral-400">
              {language === 'vi' 
                ? 'Tự động chuyển về trang chủ sau 3 giây...' 
                : 'Automatically redirecting to dashboard in 3 seconds...'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

