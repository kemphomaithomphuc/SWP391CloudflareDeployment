import { useState } from "react";
import { X, Calendar, Clock, MapPin, DollarSign, AlertTriangle, CheckCircle, XCircle, CreditCard, Gift, Wrench } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { useLanguage } from "../contexts/LanguageContext";

interface NotificationDetailPopupProps {
  notification: {
    id: string;
    type: "booking" | "payment" | "issue" | "penalty" | "general" | "invoice" | "late_arrival" | "charging_complete" | "overstay_warning" | "report_success" | "booking_confirmed";
    title: string;
    message: string;
    timestamp: string;
    isRead: boolean;
    requiresAction?: boolean;
    actionData?: {
      sessionId?: string;
      orderId?: string;
      amount?: number;
      location?: string;
      minutesLate?: number;
      penaltyAmount?: number;
      errorCode?: string;
    } | undefined;
  };
  onClose: () => void;
  onMarkAsRead: (notificationId: string) => void;
  onAction?: (action: string, data: any) => void;
}

export default function NotificationDetailPopup({ 
  notification, 
  onClose, 
  onMarkAsRead,
  onAction 
}: NotificationDetailPopupProps) {
  const { t, language } = useLanguage();
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking": return <Calendar className="w-6 h-6 text-blue-600" />;
      case "payment": return <CreditCard className="w-6 h-6 text-green-600" />;
      case "issue": return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case "penalty": return <XCircle className="w-6 h-6 text-orange-600" />;
      case "general": return <Gift className="w-6 h-6 text-purple-600" />;
      case "invoice": return <CreditCard className="w-6 h-6 text-green-600" />;
      case "late_arrival": return <Clock className="w-6 h-6 text-orange-600" />;
      case "charging_complete": return <CheckCircle className="w-6 h-6 text-blue-600" />;
      case "overstay_warning": return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case "report_success": return <CheckCircle className="w-6 h-6 text-green-600" />;
      default: return <Calendar className="w-6 h-6 text-gray-600" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "booking": return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">{language === 'vi' ? 'Đặt chỗ' : 'Booking'}</Badge>;
      case "payment": return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">{language === 'vi' ? 'Thanh toán' : 'Payment'}</Badge>;
      case "issue": return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">{language === 'vi' ? 'Sự cố' : 'Issue'}</Badge>;
      case "penalty": return <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200">{language === 'vi' ? 'Phạt' : 'Penalty'}</Badge>;
      case "general": return <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">{language === 'vi' ? 'Chung' : 'General'}</Badge>;
      default: return <Badge variant="outline">{language === 'vi' ? 'Thông báo' : 'Notification'}</Badge>;
    }
  };

  const handleMarkAsRead = async () => {
    setIsMarkingAsRead(true);
    try {
      await onMarkAsRead(notification.id);
    } finally {
      setIsMarkingAsRead(false);
    }
  };

  const handleAction = (action: string) => {
    if (onAction) {
      onAction(action, notification.actionData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background border shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getNotificationIcon(notification.type)}
              <div>
                <CardTitle className="text-xl">{notification.title}</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  {getNotificationBadge(notification.type)}
                  <span className="text-sm text-muted-foreground">{notification.timestamp}</span>
                  {!notification.isRead && (
                    <Badge variant="destructive" className="text-xs">
                      {language === 'vi' ? 'Chưa đọc' : 'Unread'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Message Content */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-foreground leading-relaxed">{notification.message}</p>
          </div>

          {/* Action Data Details */}
          {notification.actionData && (
            <div className="space-y-4">
              <Separator />
              <h4 className="font-medium text-foreground flex items-center">
                <Wrench className="w-4 h-4 mr-2" />
                {language === 'vi' ? 'Chi tiết thông tin' : 'Details'}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notification.actionData.sessionId && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {language === 'vi' ? 'Phiên sạc:' : 'Session:'}
                    </span>
                    <span className="text-sm font-medium">{notification.actionData.sessionId}</span>
                  </div>
                )}
                
                {notification.actionData.orderId && (
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {language === 'vi' ? 'Đơn hàng:' : 'Order:'}
                    </span>
                    <span className="text-sm font-medium">{notification.actionData.orderId}</span>
                  </div>
                )}
                
                {notification.actionData.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {language === 'vi' ? 'Vị trí:' : 'Location:'}
                    </span>
                    <span className="text-sm font-medium">{notification.actionData.location}</span>
                  </div>
                )}
                
                {notification.actionData.amount && (
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {language === 'vi' ? 'Số tiền:' : 'Amount:'}
                    </span>
                    <span className="text-sm font-medium">{notification.actionData.amount.toLocaleString()} VND</span>
                  </div>
                )}
                
                {notification.actionData.penaltyAmount && (
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-muted-foreground">
                      {language === 'vi' ? 'Phí phạt:' : 'Penalty:'}
                    </span>
                    <span className="text-sm font-medium text-orange-600">{notification.actionData.penaltyAmount.toLocaleString()} VND</span>
                  </div>
                )}
                
                {notification.actionData.minutesLate && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {language === 'vi' ? 'Trễ:' : 'Late:'}
                    </span>
                    <span className="text-sm font-medium">{notification.actionData.minutesLate} {language === 'vi' ? 'phút' : 'minutes'}</span>
                  </div>
                )}
                
                {notification.actionData.errorCode && (
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-muted-foreground">
                      {language === 'vi' ? 'Mã lỗi:' : 'Error Code:'}
                    </span>
                    <span className="text-sm font-medium text-red-600">{notification.actionData.errorCode}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {notification.requiresAction && !notification.isRead && (
            <div className="space-y-4">
              <Separator />
              <h4 className="font-medium text-foreground">
                {language === 'vi' ? 'Hành động cần thực hiện' : 'Required Actions'}
              </h4>
              
              <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800/30">
                {notification.type === 'booking' && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleAction('start')}
                      className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {language === 'vi' ? 'Bắt đầu sạc' : 'Start Charging'}
                    </Button>
                    <Button
                      onClick={() => handleAction('complete')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {language === 'vi' ? 'Hoàn thành' : 'Complete'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleAction('cancel')}
                      className="flex-1 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {language === 'vi' ? 'Hủy' : 'Cancel'}
                    </Button>
                  </div>
                )}

                {notification.type === 'payment' && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => handleAction('retry')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {language === 'vi' ? 'Thử lại' : 'Retry Payment'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleAction('topup')}
                      className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      {language === 'vi' ? 'Nạp tiền' : 'Top Up'}
                    </Button>
                  </div>
                )}

                {notification.type === 'issue' && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => handleAction('report')}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      {language === 'vi' ? 'Báo cáo sự cố' : 'Report Issue'}
                    </Button>
                  </div>
                )}

                {notification.type === 'penalty' && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => handleAction('pay')}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {language === 'vi' ? 'Thanh toán phạt' : 'Pay Penalty'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleAction('dispute')}
                      className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/30"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      {language === 'vi' ? 'Khiếu nại' : 'Dispute'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4">
            <div className="flex space-x-2">
              {!notification.isRead && (
                <Button
                  variant="outline"
                  onClick={handleMarkAsRead}
                  disabled={isMarkingAsRead}
                  className="flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{isMarkingAsRead ? (language === 'vi' ? 'Đang xử lý...' : 'Processing...') : (language === 'vi' ? 'Đánh dấu đã đọc' : 'Mark as Read')}</span>
                </Button>
              )}
            </div>
            
            <Button
              variant="outline"
              onClick={onClose}
              className="flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>{language === 'vi' ? 'Đóng' : 'Close'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
