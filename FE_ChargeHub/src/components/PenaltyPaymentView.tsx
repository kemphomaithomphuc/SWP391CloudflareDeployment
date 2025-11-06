import { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Shield, AlertTriangle, CreditCard, CheckCircle, XCircle } from "lucide-react";
import { getUserProfile, type UserDTO, api } from "../services/api";
import { toast } from "sonner";

interface PenaltyPaymentViewProps {
  onBack: () => void;
  userId: number;
}

export default function PenaltyPaymentView({ onBack, userId }: PenaltyPaymentViewProps) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  
  const [userData, setUserData] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');
  const [penaltyAmount] = useState(500000); // 500,000 VND fixed penalty fee

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await getUserProfile(userId);
      if (response.success && response.data) {
        setUserData(response.data);
      } else {
        toast.error(language === 'vi' ? 'Không thể lấy thông tin người dùng' : 'Unable to fetch user information');
      }
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      toast.error(language === 'vi' ? 'Lỗi khi tải thông tin người dùng' : 'Error loading user information');
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

  const handlePayment = async () => {
    try {
      setPaymentStatus('processing');
      
      // Call backend API to process penalty payment and unban user
      const response = await api.post('/api/user/penalty-payment', null, {
        params: {
          userId: userId,
          amount: penaltyAmount
        }
      });
      
      if (response.data.success) {
        setPaymentStatus('success');
        toast.success(language === 'vi' ? 'Thanh toán thành công! Tài khoản của bạn đã được kích hoạt lại' : 'Payment successful! Your account has been reactivated');
        
        // Clear localStorage and redirect to login after 3 seconds
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userId');
          onBack(); // Return to login
        }, 3000);
      } else {
        throw new Error(response.data.message || 'Payment failed');
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
            {language === 'vi' ? 'Tài Khoản Bị Khóa' : 'Account Suspended'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'vi' 
              ? 'Tài khoản của bạn đã bị khóa do vi phạm quy định'
              : 'Your account has been suspended due to policy violations'}
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
                <Badge variant="destructive" className="text-lg px-3 py-1">
                  {language === 'vi' ? 'Đã bị khóa' : 'BANNED'}
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
            {/* Amount Display */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <p className="text-sm text-muted-foreground mb-2">
                {language === 'vi' ? 'Số tiền phải thanh toán' : 'Amount Due'}
              </p>
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(penaltyAmount)}
              </p>
            </div>

            {/* Payment Status */}
            {paymentStatus === 'pending' && (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {language === 'vi' 
                      ? '⚠️ Sau khi thanh toán thành công, tài khoản của bạn sẽ được mở khóa ngay lập tức.'
                      : '⚠️ Your account will be unlocked immediately after successful payment.'}
                  </p>
                </div>
                <Button 
                  onClick={handlePayment}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-6 text-lg"
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
                onClick={onBack}
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
