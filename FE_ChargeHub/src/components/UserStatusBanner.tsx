import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { AlertTriangle, Shield, Info } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { getUserProfile, type UserDTO } from "../services/api";
import { useNavigate } from "react-router-dom";

interface UserStatusBannerProps {
  userId: number;
}

export default function UserStatusBanner({ userId }: UserStatusBannerProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [userStatus, setUserStatus] = useState<'ACTIVE' | 'INACTIVE' | 'BANNED' | null>(null);
  const [violations, setViolations] = useState(0);

  useEffect(() => {
    fetchUserStatus();
  }, [userId]);

  const fetchUserStatus = async () => {
    try {
      const response = await getUserProfile(userId);
      if (response.success && response.data) {
        setUserStatus(response.data.status as 'ACTIVE' | 'INACTIVE' | 'BANNED');
        setViolations(response.data.violations || 0);
      }
    } catch (error) {
      console.error("Error fetching user status:", error);
    }
  };

  if (!userStatus || userStatus === 'ACTIVE') {
    return null; // Don't show banner for active users
  }

  if (userStatus === 'BANNED') {
    return (
      <Alert variant="destructive" className="mb-6 border-2 border-red-500 dark:border-red-700">
        <Shield className="h-5 w-5" />
        <AlertTitle className="text-lg font-bold">
          {language === 'vi' ? '⚠️ Tài khoản bị khóa' : '⚠️ Account Suspended'}
        </AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-3">
            {language === 'vi' 
              ? `Tài khoản của bạn đã bị khóa do vi phạm ${violations} lần. Bạn chỉ có thể xem thông tin, không thể thực hiện các thao tác như đặt lịch, sạc điện, hay giao dịch.`
              : `Your account has been suspended due to ${violations} violations. You can only view information but cannot perform actions like booking, charging, or transactions.`}
          </p>
          <Button 
            onClick={() => navigate('/penalty-payment')}
            variant="default"
            size="sm"
            className="bg-white text-red-600 hover:bg-red-50 dark:bg-gray-800 dark:text-red-400"
          >
            {language === 'vi' ? 'Thanh toán để mở khóa' : 'Pay to Unlock'}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (userStatus === 'INACTIVE') {
    return (
      <Alert variant="default" className="mb-6 border-2 border-yellow-500 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20">
        <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        <AlertTitle className="text-lg font-bold text-yellow-800 dark:text-yellow-200">
          {language === 'vi' ? 'ℹ️ Tài khoản chưa kích hoạt' : 'ℹ️ Account Inactive'}
        </AlertTitle>
        <AlertDescription className="mt-2 text-yellow-700 dark:text-yellow-300">
          <p>
            {language === 'vi' 
              ? 'Tài khoản của bạn chưa được kích hoạt hoàn toàn. Một số tính năng có thể bị giới hạn. Vui lòng liên hệ hỗ trợ để kích hoạt.'
              : 'Your account is not fully activated. Some features may be limited. Please contact support to activate.'}
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
