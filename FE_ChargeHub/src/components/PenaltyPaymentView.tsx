import { useState, useEffect, useMemo } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Shield, AlertTriangle, CreditCard, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { api, getUserProfile, type UserDTO, getUnpaidFees, payPenaltyAndUnlock, type FeeDTO } from "../services/api";
import { retryPayment } from "../api/retryPayment";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface PenaltyPaymentViewProps {
  onBack: () => void;
  userId: number;
}

export default function PenaltyPaymentView({ onBack, userId }: PenaltyPaymentViewProps) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState<UserDTO | null>(null);
  const [unpaidFees, setUnpaidFees] = useState<FeeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');
  const [failedTransactionIds, setFailedTransactionIds] = useState<number[]>([]);

  const statusContent = useMemo(() => {
    const map: Record<NonNullable<UserDTO["status"]> | "UNKNOWN", {
      header: { vi: string; en: string };
      description: { vi: string; en: string };
      badge: { vi: string; en: string; variant: "default" | "secondary" | "destructive" | "outline" };
    }> = {
      BANNED: {
        header: {
          vi: "Tài Khoản Bị Khóa",
          en: "Account Suspended",
        },
        description: {
          vi: "Tài khoản của bạn đã bị khóa do vi phạm quy định",
          en: "Your account has been suspended due to policy violations",
        },
        badge: {
          vi: "Đã bị khóa",
          en: "BANNED",
          variant: "destructive",
        },
      },
      INACTIVE: {
        header: {
          vi: "Tài Khoản Tạm Khóa",
          en: "Account Inactive",
        },
        description: {
          vi: "Tài khoản của bạn đang bị hạn chế do còn phí chưa thanh toán",
          en: "Your account is temporarily limited due to unpaid fees",
        },
        badge: {
          vi: "Tạm khóa",
          en: "INACTIVE",
          variant: "outline",
        },
      },
      ACTIVE: {
        header: {
          vi: "Thanh Toán Phí Phạt",
          en: "Penalty Payment",
        },
        description: {
          vi: "Hoàn tất thanh toán để tiếp tục sử dụng đầy đủ dịch vụ",
          en: "Complete payment to continue using all services normally",
        },
        badge: {
          vi: "Đang hoạt động",
          en: "ACTIVE",
          variant: "default",
        },
      },
      UNKNOWN: {
        header: {
          vi: "Thanh Toán Phí Phạt",
          en: "Penalty Payment",
        },
        description: {
          vi: "Hoàn tất thanh toán để tiếp tục sử dụng đầy đủ dịch vụ",
          en: "Complete payment to continue using all services normally",
        },
        badge: {
          vi: "Không xác định",
          en: "UNKNOWN",
          variant: "secondary",
        },
      },
    };

    const status = userData?.status ?? "UNKNOWN";
    return map[status];
  }, [userData?.status]);

  const hasRetryOnly = unpaidFees.length === 0 && failedTransactionIds.length > 0;

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const userResponse = await getUserProfile(userId);
      if (userResponse.success && userResponse.data) {
        setUserData(userResponse.data);
      }
      
      // Fetch unpaid fees
      const feesResponse = await getUnpaidFees(userId);
      if (feesResponse.success && feesResponse.data) {
        const fees = Array.isArray(feesResponse.data.unpaidFees)
          ? feesResponse.data.unpaidFees
          : [];
        const failedTransactions = Array.isArray(feesResponse.data.failedTransactionIds)
          ? feesResponse.data.failedTransactionIds
          : [];

        setUnpaidFees(fees);
        setFailedTransactionIds(failedTransactions);

        // Persist the primary failed transaction id for retry flows
        if (failedTransactions.length > 0) {
          try {
            localStorage.setItem("penaltyTransactionId", String(failedTransactions[0]));
          } catch (storageError) {
            console.warn('Unable to store penaltyTransactionId', storageError);
          }
        } else {
          try {
            localStorage.removeItem("penaltyTransactionId");
          } catch (storageError) {
            console.warn('Unable to clear penaltyTransactionId', storageError);
          }
        }
      } else {
        setUnpaidFees([]);
        setFailedTransactionIds([]);
        toast.error(language === 'vi' ? 'Không thể lấy danh sách phí phạt' : 'Unable to fetch penalty fees');
      }
      
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(language === 'vi' ? 'Lỗi khi tải dữ liệu' : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getTotalAmount = () => {
    return unpaidFees.reduce((total, fee) => total + fee.amount, 0);
  };

  const getFeeTypeLabel = (feeType: string) => {
    const labels: Record<string, { vi: string; en: string }> = {
      'CANCEL': { vi: 'Hủy muộn', en: 'Late Cancellation' },
      'NO_SHOW': { vi: 'Không đến', en: 'No Show' },
      'OVERTIME': { vi: 'Quá giờ', en: 'Overtime' }
    };
    return labels[feeType]?.[language === 'vi' ? 'vi' : 'en'] || feeType;
  };

  const deriveRetryTransactionId = (): number | undefined => {
    const storedId = localStorage.getItem("penaltyTransactionId");
    if (storedId) {
      const numeric = Number(storedId);
      if (!Number.isNaN(numeric)) {
        return numeric;
      }
    }
    if (failedTransactionIds.length > 0) {
      return failedTransactionIds[0];
    }

    if (unpaidFees.length === 0) {
      return undefined;
    }
    const primaryFee = unpaidFees[0];
    if (primaryFee?.orderId != null) {
      return primaryFee.orderId;
    }
    if (primaryFee?.sessionId != null) {
      return primaryFee.sessionId;
    }
    if (primaryFee?.feeId != null) {
      return primaryFee.feeId;
    }
    return undefined;
  };

  const handlePayment = async () => {
    try {
      setPaymentStatus('processing');
      
      const feeIds = unpaidFees.map(fee => fee.feeId);
      console.log('[PenaltyPayment] feeIds for payment:', feeIds);
      
      let responseData: any;
      if (userData?.status === 'BANNED') {
        console.log('[PenaltyPayment] Using payPenaltyAndUnlock');
        responseData = await payPenaltyAndUnlock(userId, feeIds);
      } else if (userData?.status === 'ACTIVE') {
        const transactionId = deriveRetryTransactionId();
        console.log('[PenaltyPayment] Derived transactionId:', transactionId);
        if (!transactionId) {
          throw new Error(language === 'vi'
            ? 'Không tìm thấy giao dịch cần thanh toán lại.'
            : 'Unable to determine the transaction to retry.');
        }
        const retryPayload = {
          transactionId,
          userId,
          paymentMethod: 'VNPAY',
        };
        console.log('[PenaltyPayment] Calling retryPayment with payload:', retryPayload);
        responseData = await retryPayment({
          transactionId,
          userId,
          paymentMethod: 'VNPAY',
        });
        try {
          localStorage.removeItem("penaltyTransactionId");
        } catch (cleanupError) {
          console.warn('Unable to clear penaltyTransactionId', cleanupError);
        }
      } else {
        console.log('[PenaltyPayment] Using /api/penalties/pay');
        const response = await api.post('/api/penalties/pay', {
          userId,
          feeIds,
        });
        responseData = response?.data ?? response;
      }

      console.log('[PenaltyPayment] Response data:', responseData);

      const paymentUrl =
        typeof responseData?.data?.paymentUrl === 'string'
          ? responseData.data.paymentUrl
          : typeof responseData?.paymentUrl === 'string'
            ? responseData.paymentUrl
            : undefined;

      if (paymentUrl) {
        try {
          localStorage.setItem('penaltyPaymentUrl', paymentUrl);
        } catch (storageError) {
          console.warn('Unable to store penaltyPaymentUrl', storageError);
        }
        window.location.href = paymentUrl;
        return;
      }

      const wasSuccessful = Boolean(responseData?.success);
      const responseMessage = responseData?.message;

      if (wasSuccessful) {
        setPaymentStatus('success');
        const message = language === 'vi' 
          ? 'Thanh toán thành công! Tài khoản của bạn đã được kích hoạt lại' 
          : 'Payment successful! Your account has been reactivated';
        toast.success(message);
        
        // Clear localStorage and redirect to login after 3 seconds
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userId');
          localStorage.removeItem('role');
          onBack(); // Return to login
        }, 3000);
      } else {
        throw new Error(responseMessage || 'Payment failed');
      }
      
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
      toast.error(language === 'vi' ? 'Thanh toán thất bại. Vui lòng thử lại' : 'Payment failed. Please try again');
    }
  };

  const handleRetry = () => {
    setPaymentStatus('pending');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {language === 'vi' ? 'Đang tải...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full">
              <Shield className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {language === 'vi' ? statusContent.header.vi : statusContent.header.en}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'vi' ? statusContent.description.vi : statusContent.description.en}
          </p>
        </div>

        {/* Main Content */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/60 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span>
                {language === 'vi' ? 'Thông Tin Vi Phạm' : 'Violation Details'}
              </span>
            </CardTitle>
            <CardDescription>
              {language === 'vi' 
                ? 'Chi tiết các vi phạm của tài khoản'
                : 'Details of account violations'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {language === 'vi' ? 'Số lần vi phạm' : 'Violations'}
                </p>
                <Badge variant="destructive" className="text-lg px-3 py-1">
                  {userData?.violations || 0}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {language === 'vi' ? 'Trạng thái' : 'Status'}
                </p>
                <Badge variant={statusContent.badge.variant} className="text-lg px-3 py-1">
                  {language === 'vi' ? statusContent.badge.vi : statusContent.badge.en}
                </Badge>
              </div>
            </div>

            {userData?.reasonReport && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                  {language === 'vi' ? 'Lý do khóa tài khoản:' : 'Ban Reason:'}
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {userData.reasonReport}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Card */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>
                {language === 'vi' ? 'Thanh Toán Phí Phạt' : 'Penalty Payment'}
              </span>
            </CardTitle>
            <CardDescription>
              {language === 'vi' 
                ? 'Thanh toán để mở khóa tài khoản'
                : 'Pay to unlock your account'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Fees List */}
            {unpaidFees.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {language === 'vi' ? 'Danh sách phí chưa thanh toán:' : 'Unpaid Fees:'}
                </p>
                {unpaidFees.map((fee) => (
                  <div 
                    key={fee.feeId}
                    className="flex justify-between items-center p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{getFeeTypeLabel(fee.feeType)}</p>
                      <p className="text-sm text-muted-foreground">{fee.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(fee.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <Badge variant="destructive" className="text-base px-3 py-1">
                      {formatCurrency(fee.amount)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {failedTransactionIds.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {language === 'vi'
                    ? 'Giao dịch cần thanh toán lại:'
                    : 'Transactions requiring retry:'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {failedTransactionIds.map((id) => (
                    <Badge key={id} variant="secondary" className="px-3 py-1">
                      #{id}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === 'vi'
                    ? 'Nhấn thanh toán để tiếp tục xử lý lại giao dịch qua VNPAY.'
                    : 'Click pay now to retry these transactions via VNPAY.'}
                </p>

                {hasRetryOnly && (
                  <div className="text-xs text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                    {language === 'vi'
                      ? 'Hiện tại bạn không còn phí phạt nào, tuy nhiên vẫn còn giao dịch thanh toán bị lỗi cần xử lý lại.'
                      : 'You have no outstanding penalty fees, but there is a failed payment that needs to be retried.'}
                  </div>
                )}
              </div>
            )}

            {/* Payment Status */}
            {paymentStatus === 'pending' && (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {userData?.status === 'ACTIVE'
                      ? (language === 'vi'
                        ? '⚠️ Bạn phải thanh toán để có thể tiếp tục đặt phiên sạc.'
                        : '⚠️ You must complete the payment to continue booking charging sessions.')
                      : (language === 'vi'
                        ? '⚠️ Sau khi thanh toán thành công, tài khoản của bạn sẽ được mở khóa ngay lập tức.'
                        : '⚠️ Your account will be unlocked immediately after successful payment.')}
                  </p>
                </div>
                <Button 
                  onClick={handlePayment}
                  variant="default"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg shadow-md hover:shadow-lg transition-shadow"
                  size="lg"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  {language === 'vi' ? 'Thanh Toán Ngay' : 'Pay Now'}
                </Button>
              </div>
            )}

            {paymentStatus === 'processing' && (
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
                <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
                  {language === 'vi' ? 'Đang xử lý thanh toán...' : 'Processing payment...'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === 'vi' ? 'Vui lòng đợi' : 'Please wait'}
                </p>
              </div>
            )}

            {paymentStatus === 'success' && (
              <div className="text-center space-y-4 py-6">
                <div className="flex justify-center">
                  <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full">
                    <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {language === 'vi' ? 'Thanh Toán Thành Công!' : 'Payment Successful!'}
                </h3>
                <p className="text-muted-foreground">
                  {language === 'vi' 
                    ? 'Tài khoản của bạn đã được kích hoạt lại. Đang chuyển hướng...'
                    : 'Your account has been reactivated. Redirecting...'}
                </p>
              </div>
            )}

            {paymentStatus === 'failed' && (
              <div className="text-center space-y-4 py-6">
                <div className="flex justify-center">
                  <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full">
                    <XCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {language === 'vi' ? 'Thanh Toán Thất Bại' : 'Payment Failed'}
                </h3>
                <p className="text-muted-foreground">
                  {language === 'vi' 
                    ? 'Đã có lỗi xảy ra trong quá trình thanh toán'
                    : 'An error occurred during payment'}
                </p>
                <Button 
                  onClick={handleRetry}
                  variant="outline"
                  className="mt-4"
                >
                  {language === 'vi' ? 'Thử Lại' : 'Retry'}
                </Button>
              </div>
            )}

            {/* Cancel Button */}
            {paymentStatus === 'pending' && (
              <Button 
                onClick={() => navigate("/dashboard")}
                variant="ghost"
                className="w-full"
              >
                {language === 'vi' ? 'Quay Lại' : 'Go Back'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
            {language === 'vi' ? '💡 Cần trợ giúp?' : '💡 Need help?'}
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            {language === 'vi' 
              ? 'Nếu bạn cho rằng tài khoản bị khóa nhầm, vui lòng liên hệ hỗ trợ: support@chargehub.com'
              : 'If you believe your account was banned by mistake, please contact support: support@chargehub.com'}
          </p>
        </div>
      </div>
    </div>
  );
}
