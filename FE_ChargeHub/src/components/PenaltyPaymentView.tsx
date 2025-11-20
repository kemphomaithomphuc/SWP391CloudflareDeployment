import { useState, useEffect, useMemo } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Shield, AlertTriangle, CreditCard, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  fetchPenaltyUserProfile,
  unlockBannedUser,
  type PenaltyUserDTO,
} from "../api/penaltyPayment";

interface PenaltyPaymentViewProps {
  onBack: () => void;
  userId: number;
}

export default function PenaltyPaymentView({
  onBack,
  userId,
}: PenaltyPaymentViewProps) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState<PenaltyUserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');
  const [selectedMethod, setSelectedMethod] = useState<'CASH' | 'VNPAY'>('CASH');

  const statusContent = useMemo(() => {
    const map: Record<NonNullable<PenaltyUserDTO["status"]> | "UNKNOWN", {
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
    return map[status] ?? map.UNKNOWN;
  }, [userData?.status]);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const userResponse = await fetchPenaltyUserProfile(userId);
      if (userResponse.success && userResponse.data) {
        setUserData(userResponse.data);
        if (userResponse.data.status && userResponse.data.status !== "BANNED") {
          navigate("/pay-unpaid", { replace: true });
          return;
        }
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(language === 'vi' ? 'Lỗi khi tải dữ liệu' : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setPaymentStatus('processing');
      if (userData?.status !== 'BANNED') {
        throw new Error(
          language === 'vi'
            ? 'Tài khoản của bạn không ở trạng thái bị khóa.'
            : 'Your account is not in banned status.'
        );
      }

      const response = await unlockBannedUser({ userId, paymentMethod: selectedMethod });
      if (response?.success) {
        setPaymentStatus('success');
        const message =
          language === 'vi'
            ? 'Thanh toán thành công! Tài khoản của bạn đã được mở khóa.'
            : 'Payment successful! Your account has been unlocked.';
        toast.success(message);
      } else {
        throw new Error(
          response?.message ||
            (language === 'vi' ? 'Thanh toán thất bại' : 'Payment failed')
        );
      }
      
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('role');
        onBack();
      }, 3000);
      
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        error?.message;
      console.error('Payment error:', error);
      if (error?.response?.data) {
        console.error('[PenaltyPayment] Backend response:', error.response.data);
      }
      setPaymentStatus('failed');
      toast.error(
        language === 'vi'
          ? `Thanh toán thất bại: ${backendMessage ?? 'Vui lòng thử lại'}`
          : `Payment failed: ${backendMessage ?? 'Please try again'}`
      );
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
    <div className="min-h-screen bg-[#050505] text-white p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white/10 border border-white/10 p-4 rounded-full">
              <Shield className="w-12 h-12 text-red-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {language === 'vi' ? statusContent.header.vi : statusContent.header.en}
          </h1>
          <p className="text-gray-300">
            {language === 'vi' ? statusContent.description.vi : statusContent.description.en}
          </p>
        </div>

        {/* Main Content */}
        <Card className="bg-[#111111] border border-white/10 text-white shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span>
                {language === 'vi' ? 'Thông Tin Tài Khoản' : 'Account Details'}
              </span>
            </CardTitle>
            <CardDescription className="text-gray-300">
              {language === 'vi' 
                ? 'Trạng thái tài khoản và giao dịch cần thanh toán'
                : 'Account status and pending transaction'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">
                  {language === 'vi' ? 'Số lần vi phạm' : 'Violations'}
                </p>
                <Badge variant="destructive" className="text-lg px-3 py-1">
                  {userData?.violations || 0}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">
                  {language === 'vi' ? 'Trạng thái' : 'Status'}
                </p>
                <Badge variant={statusContent.badge.variant} className="text-lg px-3 py-1">
                  {language === 'vi' ? statusContent.badge.vi : statusContent.badge.en}
                </Badge>
              </div>
            </div>

            {userData?.reasonReport && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm font-medium text-red-200 mb-2">
                  {language === 'vi' ? 'Lý do khóa tài khoản:' : 'Ban Reason:'}
                </p>
                <p className="text-sm text-red-200">
                  {userData.reasonReport}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Card */}
        <Card className="bg-[#0f172a] border border-white/10 text-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <CreditCard className="w-5 h-5 text-blue-400" />
              <span>
                {language === 'vi' ? 'Thanh Toán Giao Dịch' : 'Transaction Payment'}
              </span>
            </CardTitle>
            <CardDescription className="text-gray-300">
              {language === 'vi' 
                ? 'Hoàn tất thanh toán giao dịch còn tồn đọng'
                : 'Complete the pending transaction payment'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-gray-300">
              {language === 'vi'
                ? 'Thanh toán để mở khóa tài khoản và tiếp tục sử dụng dịch vụ.'
                : 'Complete the payment to unlock your account and continue using the service.'}
            </p>

            {/* Payment Status */}
            {paymentStatus === 'pending' && (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-200">
                    {language === 'vi'
                      ? '⚠️ Hoàn tất thanh toán để tiếp tục sử dụng đầy đủ dịch vụ.'
                      : '⚠️ Complete the payment to continue using all services.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-white">
                    {language === 'vi' ? 'Chọn phương thức thanh toán' : 'Select payment method'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        key: 'CASH' as const,
                        title: language === 'vi' ? 'Tiền mặt' : 'Cash',
                        description:
                          language === 'vi'
                            ? 'Thanh toán trực tiếp tại quầy hỗ trợ.'
                            : 'Pay directly at the support desk.',
                      },
                      {
                        key: 'VNPAY' as const,
                        title: 'VNPAY',
                        description:
                          language === 'vi'
                            ? 'Thanh toán nhanh qua cổng VNPAY.'
                            : 'Quick payment via VNPAY gateway.',
                      },
                    ].map((method) => {
                      const isActive = selectedMethod === method.key;
                      return (
                        <button
                          key={method.key}
                          type="button"
                          onClick={() => setSelectedMethod(method.key)}
                          className={`rounded-xl border p-4 text-left transition-all ${
                            isActive
                              ? 'border-blue-400 bg-blue-500/10 shadow-sm text-white'
                              : 'border-white/10 bg-white/5 hover:border-blue-400 hover:bg-blue-500/10 text-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-base">{method.title}</span>
                            <span
                              className={`h-4 w-4 rounded-full border-2 ${
                                isActive ? 'border-blue-500 bg-blue-500' : 'border-white/30 bg-transparent'
                              }`}
                            />
                          </div>
                          <p className="text-xs text-gray-300 mt-2">{method.description}</p>
                        </button>
                      );
                    })}
                  </div>
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
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto"></div>
                <p className="text-lg font-medium text-blue-300">
                  {language === 'vi' ? 'Đang xử lý thanh toán...' : 'Processing payment...'}
                </p>
                <p className="text-sm text-gray-300">
                  {language === 'vi' ? 'Vui lòng đợi' : 'Please wait'}
                </p>
              </div>
            )}

            {paymentStatus === 'success' && (
              <div className="text-center space-y-4 py-6">
                <div className="flex justify-center">
                  <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-full">
                    <CheckCircle className="w-16 h-16 text-green-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-green-400">
                  {language === 'vi' ? 'Thanh Toán Thành Công!' : 'Payment Successful!'}
                </h3>
                <p className="text-gray-300">
                  {language === 'vi' 
                    ? 'Tài khoản của bạn đã được kích hoạt lại. Đang chuyển hướng...'
                    : 'Your account has been reactivated. Redirecting...'}
                </p>
              </div>
            )}

            {paymentStatus === 'failed' && (
              <div className="text-center space-y-4 py-6">
                <div className="flex justify-center">
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-full">
                    <XCircle className="w-16 h-16 text-red-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-red-400">
                  {language === 'vi' ? 'Thanh Toán Thất Bại' : 'Payment Failed'}
                </h3>
                <p className="text-gray-300">
                  {language === 'vi' 
                    ? 'Đã có lỗi xảy ra trong quá trình thanh toán'
                    : 'An error occurred during payment'}
                </p>
                <Button 
                  onClick={handleRetry}
                  variant="outline"
                  className="mt-4 border-white/20 text-white"
                >
                  {language === 'vi' ? 'Thử Lại' : 'Retry'}
                </Button>
              </div>
            )}

            {/* Cancel Button */}
            {paymentStatus === 'pending' && (
              <Button 
                onClick={() => navigate("/login")}
                variant="ghost"
                className="w-full"
              >
                {language === 'vi' ? 'Quay Lại' : 'Go Back'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <div className="mt-6 p-4 bg-[#111111] border border-white/10 rounded-lg">
          <p className="text-sm text-white mb-2">
            {language === 'vi' ? '💡 Cần trợ giúp?' : '💡 Need help?'}
          </p>
          <p className="text-xs text-gray-300">
            {language === 'vi' 
              ? 'Nếu bạn cho rằng tài khoản bị khóa nhầm, vui lòng liên hệ hỗ trợ: support@chargehub.com'
              : 'If you believe your account was banned by mistake, please contact support: support@chargehub.com'}
          </p>
        </div>
      </div>
    </div>
  );
}
