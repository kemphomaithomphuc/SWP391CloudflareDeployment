import { useState, useEffect } from "react";

import { useTheme } from "../contexts/ThemeContext";

import { useLanguage } from "../contexts/LanguageContext";

import { Button } from "./ui/button";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

import { Badge } from "./ui/badge";

import { Shield, AlertTriangle, CreditCard, CheckCircle, XCircle } from "lucide-react";

import { getUserProfile, type UserDTO } from "../services/api";

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

      

      // Simulate payment processing (3 seconds)

      await new Promise(resolve => setTimeout(resolve, 3000));

      

      // After payment success, call backend to unban user

      // Note: You need to create an endpoint in backend to handle penalty payment and unban

      // For now, we'll just simulate the success

      

      // TODO: Call backend API to process penalty payment and unban user

      // await processPenaltyPayment(userId, penaltyAmount);

      

      setPaymentStatus('success');

      toast.success(language === 'vi' ? 'Thanh toán thành công! Tài khoản của bạn đã được kích hoạt lại' : 'Payment successful! Your account has been reactivated');

      

      // Redirect to dashboard after 3 seconds

      setTimeout(() => {

        window.location.reload(); // Reload to update user status

      }, 3000);

      

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

                  {userData?.violations || 0} / 3

                </Badge>

              </div>

              <div>

                <p className="text-sm text-muted-foreground mb-1">

                  {language === 'vi' ? 'Trạng thái' : 'Status'}

                </p>

                <Badge variant="destructive" className="text-lg px-3 py-1">

                  {language === 'vi' ? 'BỊ KHÓA' : 'BANNED'}

                </Badge>

              </div>

            </div>

            

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">

              <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start">

                <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />

                {language === 'vi' 

                  ? 'Bạn đã vi phạm quy định của hệ thống 3 lần. Tài khoản của bạn đã bị khóa và cần thanh toán phí phạt để tiếp tục sử dụng dịch vụ.'

                  : 'You have violated system policies 3 times. Your account has been suspended and requires payment of a penalty fee to continue using the service.'}

              </p>

            </div>

          </CardContent>

        </Card>



        {/* Payment Section */}

        {paymentStatus === 'pending' && (

          <Card className="bg-card/80 backdrop-blur-sm border-border/60 mb-6">

            <CardHeader>

              <CardTitle className="flex items-center space-x-2">

                <CreditCard className="w-5 h-5 text-primary" />

                <span>

                  {language === 'vi' ? 'Thanh Toán Phí Phạt' : 'Pay Penalty Fee'}

                </span>

              </CardTitle>

              <CardDescription>

                {language === 'vi' 

                  ? 'Thanh toán để kích hoạt lại tài khoản'

                  : 'Make payment to reactivate your account'}

              </CardDescription>

            </CardHeader>

            <CardContent className="space-y-6">

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">

                <p className="text-sm text-blue-800 dark:text-blue-200">

                  {language === 'vi' 

                    ? 'Để kích hoạt lại tài khoản, bạn cần thanh toán phí phạt theo quy định của hệ thống.'

                    : 'To reactivate your account, you need to pay the penalty fee as per system regulations.'}

                </p>

              </div>



              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-200 dark:border-red-800">

                <div>

                  <p className="text-sm text-muted-foreground mb-1">

                    {language === 'vi' ? 'Phí phạt' : 'Penalty Fee'}

                  </p>

                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">

                    {formatCurrency(penaltyAmount)}

                  </p>

                </div>

                <Button 

                  onClick={handlePayment}

                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-lg"

                >

                  <CreditCard className="w-5 h-5 mr-2" />

                  {language === 'vi' ? 'Thanh Toán Ngay' : 'Pay Now'}

                </Button>

              </div>



              <div className="text-xs text-muted-foreground text-center">

                {language === 'vi' 

                  ? 'Bằng cách nhấn "Thanh Toán Ngay", bạn đồng ý với điều khoản và chính sách của chúng tôi.'

                  : 'By clicking "Pay Now", you agree to our terms and conditions.'}

              </div>

            </CardContent>

          </Card>

        )}



        {/* Processing Status */}

        {paymentStatus === 'processing' && (

          <Card className="bg-card/80 backdrop-blur-sm border-border/60 mb-6">

            <CardContent className="p-12 text-center">

              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>

              <h3 className="text-xl font-semibold mb-2">

                {language === 'vi' ? 'Đang xử lý thanh toán...' : 'Processing payment...'}

              </h3>

              <p className="text-muted-foreground">

                {language === 'vi' 

                  ? 'Vui lòng chờ trong giây lát'

                  : 'Please wait a moment'}

              </p>

            </CardContent>

          </Card>

        )}



        {/* Success Status */}

        {paymentStatus === 'success' && (

          <Card className="bg-card/80 backdrop-blur-sm border-border/60 mb-6">

            <CardContent className="p-12 text-center">

              <div className="bg-green-100 dark:bg-green-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">

                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />

              </div>

              <h3 className="text-xl font-semibold mb-2">

                {language === 'vi' ? 'Thanh toán thành công!' : 'Payment successful!'}

              </h3>

              <p className="text-muted-foreground mb-4">

                {language === 'vi' 

                  ? 'Tài khoản của bạn đã được kích hoạt lại. Đang chuyển hướng...'

                  : 'Your account has been reactivated. Redirecting...'}

              </p>

            </CardContent>

          </Card>

        )}



        {/* Failed Status */}

        {paymentStatus === 'failed' && (

          <Card className="bg-card/80 backdrop-blur-sm border-border/60 mb-6">

            <CardContent className="p-12 text-center">

              <div className="bg-red-100 dark:bg-red-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">

                <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />

              </div>

              <h3 className="text-xl font-semibold mb-2">

                {language === 'vi' ? 'Thanh toán thất bại' : 'Payment failed'}

              </h3>

              <p className="text-muted-foreground mb-6">

                {language === 'vi' 

                  ? 'Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.'

                  : 'An error occurred during payment. Please try again.'}

              </p>

              <Button onClick={handleRetry} className="bg-primary hover:bg-primary/90">

                {language === 'vi' ? 'Thử Lại' : 'Retry'}

              </Button>

            </CardContent>

          </Card>

        )}



        {/* Info Card */}

        {paymentStatus === 'pending' && (

          <Card className="bg-card/80 backdrop-blur-sm border-border/60">

            <CardContent className="p-6">

              <h3 className="font-semibold mb-4">

                {language === 'vi' ? 'Thông tin bổ sung' : 'Additional Information'}

              </h3>

              <ul className="space-y-2 text-sm text-muted-foreground">

                <li className="flex items-start">

                  <span className="mr-2">•</span>

                  <span>

                    {language === 'vi' 

                      ? 'Sau khi thanh toán thành công, tài khoản của bạn sẽ được kích hoạt lại ngay lập tức.'

                      : 'After successful payment, your account will be reactivated immediately.'}

                  </span>

                </li>

                <li className="flex items-start">

                  <span className="mr-2">•</span>

                  <span>

                    {language === 'vi' 

                      ? 'Số lần vi phạm sẽ được reset về 0.'

                      : 'Your violations will be reset to 0.'}

                  </span>

                </li>

                <li className="flex items-start">

                  <span className="mr-2">•</span>

                  <span>

                    {language === 'vi' 

                      ? 'Nếu bạn tiếp tục vi phạm quy định, tài khoản có thể bị khóa vĩnh viễn.'

                      : 'If you continue to violate policies, your account may be permanently banned.'}

                  </span>

                </li>

              </ul>

            </CardContent>

          </Card>

        )}

      </div>

    </div>

  );

}

