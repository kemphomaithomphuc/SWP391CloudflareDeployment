import { useState, useEffect } from "react";
import { ArrowLeft, Bell, Clock, Mail, Zap, AlertTriangle, CheckCircle, XCircle, Car, CreditCard, Calendar, Gift, DollarSign, Wrench, Eye, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { toast } from "sonner";
import { Toaster } from "./ui/sonner";
import { useLanguage } from "../contexts/LanguageContext";
import { useNotifications } from "../contexts/NotificationContext";
import NotificationDetailPopup from "./NotificationDetailPopup";

interface Notification {
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
}

interface NotificationViewProps {
  onBack: () => void;
}

export default function NotificationView({ onBack }: NotificationViewProps) {
  const { t, language } = useLanguage();
  const { 
    notifications: apiNotifications, 
    unreadCount: contextUnreadCount, 
    loading, 
    error,
    refreshNotifications,
    markAsRead: contextMarkAsRead,
    markAllAsRead 
  } = useNotifications();
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [notificationCounts, setNotificationCounts] = useState({
    total: 0,
    unread: 0,
    actionRequired: 0
  });
  
  // Update notification counts
  const updateNotificationCounts = (notifications: any[]) => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.isRead).length;
    const actionRequired = notifications.filter(n => n.requiresAction && !n.isRead).length;
    
    setNotificationCounts({
      total,
      unread,
      actionRequired
    });
  };
  
  // Update counts when notifications change
  useEffect(() => {
    updateNotificationCounts(apiNotifications);
  }, [apiNotifications]);

  // Handle mark as read
  const handleMarkAsRead = async (notificationId: string | number) => {
    await contextMarkAsRead(Number(notificationId));
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };
  
  // Generate localized notification data (fallback) - 5 notification tasks
  const getLocalizedNotifications = (): Notification[] => [
    // BOOKING Notifications
    {
      id: "booking-1",
      type: "booking",
      title: language === 'vi' ? 'Đặt chỗ thành công' : 'Booking Confirmed',
      message: language === 'vi' 
        ? 'Đặt chỗ sạc xe tại Trạm Sạc Premium - Q1 đã được xác nhận. Thời gian: 14:00 - 16:00'
        : 'Your charging slot at Premium Station - Q1 has been reserved. Time: 2:00 PM - 4:00 PM',
      timestamp: language === 'vi' ? '5 phút trước' : '5 minutes ago',
      isRead: false,
      requiresAction: true,
      actionData: {
        sessionId: "CS001",
        orderId: "ORD001",
        location: language === 'vi' ? 'Trạm Sạc Premium - Q1' : 'Premium Station - Q1'
      }
    },
    {
      id: "booking-2",
      type: "booking",
      title: language === 'vi' ? 'Phiên sạc bắt đầu' : 'Charging Session Started',
      message: language === 'vi'
        ? 'Phiên sạc tại Trạm Sạc EcoCharge đã bắt đầu. Vui lòng cắm xe vào trạm sạc.'
        : 'Your charging session at EcoCharge Station has started. Please plug in your vehicle.',
      timestamp: language === 'vi' ? '2 phút trước' : '2 minutes ago',
      isRead: false,
      requiresAction: true,
      actionData: {
        sessionId: "CS002",
        location: language === 'vi' ? 'Trạm Sạc EcoCharge - Q7' : 'EcoCharge Station - Q7'
      }
    },
    {
      id: "booking-3",
      type: "booking",
      title: language === 'vi' ? 'Phiên sạc hoàn thành' : 'Charging Session Completed',
      message: language === 'vi'
        ? 'Phiên sạc Tesla Model 3 tại Trạm Sạc EcoCharge đã hoàn thành. Pin đã sạc 95%.'
        : 'Your Tesla Model 3 charging session at EcoCharge Station is complete. Battery charged to 95%.',
      timestamp: language === 'vi' ? '10 phút trước' : '10 minutes ago',
      isRead: true,
      requiresAction: false,
      actionData: {
        sessionId: "CS003",
        location: language === 'vi' ? 'Trạm Sạc EcoCharge - Q7' : 'EcoCharge Station - Q7'
      }
    },

    // PAYMENT Notifications
    {
      id: "payment-1",
      type: "payment",
      title: language === 'vi' ? 'Thanh toán thành công' : 'Payment Successful',
      message: language === 'vi'
        ? 'Thanh toán 75,000 VND cho phiên sạc đã thành công. Ví của bạn đã được cập nhật.'
        : 'Payment of 75,000 VND for charging session was successful. Your wallet has been updated.',
      timestamp: language === 'vi' ? '3 phút trước' : '3 minutes ago',
      isRead: false,
      requiresAction: false,
      actionData: {
        amount: 75000,
        sessionId: "CS004"
      }
    },
    {
      id: "payment-2",
      type: "payment",
      title: language === 'vi' ? 'Nạp tiền thành công' : 'Wallet Top-up Successful',
      message: language === 'vi'
        ? 'Đã nạp 500,000 VND vào ví thành công. Số dư hiện tại: 1,250,000 VND'
        : 'Successfully topped up 500,000 VND to your wallet. Current balance: 1,250,000 VND',
      timestamp: language === 'vi' ? '1 giờ trước' : '1 hour ago',
      isRead: true,
      requiresAction: false,
      actionData: {
        amount: 500000
      }
    },
    {
      id: "payment-3",
      type: "payment",
      title: language === 'vi' ? 'Thanh toán thất bại' : 'Payment Failed',
      message: language === 'vi'
        ? 'Thanh toán 45,000 VND thất bại do số dư không đủ. Vui lòng nạp thêm tiền vào ví.'
        : 'Payment of 45,000 VND failed due to insufficient balance. Please top up your wallet.',
      timestamp: language === 'vi' ? '30 phút trước' : '30 minutes ago',
      isRead: false,
      requiresAction: true,
      actionData: {
        amount: 45000
      }
    },

    // ISSUE Notifications
    {
      id: "issue-1",
      type: "issue",
      title: language === 'vi' ? 'Lỗi sạc xe' : 'Charging Error',
      message: language === 'vi'
        ? 'Đã xảy ra lỗi tại Trạm Sạc Premium - Q1. Nhân viên đã được thông báo và đang xử lý.'
        : 'A charging error occurred at Premium Station - Q1. Staff has been notified and is handling the issue.',
      timestamp: language === 'vi' ? '15 phút trước' : '15 minutes ago',
      isRead: false,
      requiresAction: true,
      actionData: {
        sessionId: "CS005",
        location: language === 'vi' ? 'Trạm Sạc Premium - Q1' : 'Premium Station - Q1',
        errorCode: "ERR_001"
      }
    },
    {
      id: "issue-2",
      type: "issue",
      title: language === 'vi' ? 'Trạng thái lỗi' : 'Error Status',
      message: language === 'vi'
        ? 'Trạm sạc tại EcoCharge Q7 đang gặp sự cố. Vui lòng chờ trong khi chúng tôi khắc phục.'
        : 'Charging station at EcoCharge Q7 is experiencing issues. Please wait while we resolve the problem.',
      timestamp: language === 'vi' ? '1 giờ trước' : '1 hour ago',
      isRead: true,
      requiresAction: false,
      actionData: {
        location: language === 'vi' ? 'EcoCharge Q7' : 'EcoCharge Q7',
        errorCode: "ERR_002"
      }
    },

    // PENALTY Notifications
    {
      id: "penalty-1",
      type: "penalty",
      title: language === 'vi' ? 'Phạt không đến đúng giờ' : 'No-Show Penalty',
      message: language === 'vi'
        ? 'Bạn đã không đến đúng giờ đặt chỗ tại Trạm Sạc Premium - Q1. Phí phạt: 25,000 VND'
        : 'You did not arrive on time for your booking at Premium Station - Q1. Penalty fee: 25,000 VND',
      timestamp: language === 'vi' ? '1 giờ trước' : '1 hour ago',
      isRead: false,
      requiresAction: true,
      actionData: {
        sessionId: "CS006",
        location: language === 'vi' ? 'Trạm Sạc Premium - Q1' : 'Premium Station - Q1',
        penaltyAmount: 25000
      }
    },
    {
      id: "penalty-2",
      type: "penalty",
      title: language === 'vi' ? 'Phạt hủy đặt chỗ' : 'Cancellation Penalty',
      message: language === 'vi'
        ? 'Bạn đã hủy đặt chỗ trong vòng 2 giờ trước giờ sạc. Phí phạt: 15,000 VND'
        : 'You cancelled your booking within 2 hours of charging time. Penalty fee: 15,000 VND',
      timestamp: language === 'vi' ? '2 giờ trước' : '2 hours ago',
      isRead: true,
      requiresAction: false,
      actionData: {
        penaltyAmount: 15000
      }
    },

    // GENERAL Notifications
    {
      id: "general-1",
      type: "general",
      title: language === 'vi' ? 'Khuyến mãi đặc biệt' : 'Special Promotion',
      message: language === 'vi'
        ? 'Giảm 20% cho tất cả phiên sạc vào cuối tuần này! Áp dụng từ 6/1 - 7/1/2025'
        : '20% off all charging sessions this weekend! Valid from Jan 6-7, 2025',
      timestamp: language === 'vi' ? '1 ngày trước' : '1 day ago',
      isRead: false,
      requiresAction: false
    },
    {
      id: "general-2",
      type: "general",
      title: language === 'vi' ? 'Bảo trì hệ thống' : 'System Maintenance',
      message: language === 'vi'
        ? 'Hệ thống sẽ bảo trì từ 2:00 - 4:00 AM ngày 8/1/2025. Một số tính năng có thể tạm thời không khả dụng.'
        : 'System maintenance scheduled from 2:00 - 4:00 AM on Jan 8, 2025. Some features may be temporarily unavailable.',
      timestamp: language === 'vi' ? '2 ngày trước' : '2 days ago',
      isRead: true,
      requiresAction: false
    }
  ];

  // Use API notifications, fallback to local ones
  const displayNotifications = apiNotifications.length > 0 ? apiNotifications.map(notif => ({
    id: notif.notificationId.toString(),
    type: notif.type.toLowerCase() as any,
    title: notif.title,
    message: notif.content,
    timestamp: notif.sentTime,
    isRead: notif.isRead,
    requiresAction: false,
    actionData: undefined
  })) : getLocalizedNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking": return <Calendar className="w-5 h-5 text-blue-600" />;
      case "payment": return <CreditCard className="w-5 h-5 text-green-600" />;
      case "issue": return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "penalty": return <XCircle className="w-5 h-5 text-orange-600" />;
      case "general": return <Gift className="w-5 h-5 text-purple-600" />;
      case "invoice": return <CreditCard className="w-5 h-5 text-green-600" />;
      case "late_arrival": return <Clock className="w-5 h-5 text-orange-600" />;
      case "charging_complete": return <Zap className="w-5 h-5 text-blue-600" />;
      case "overstay_warning": return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "report_success": return <CheckCircle className="w-5 h-5 text-green-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "booking": return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">{language === 'vi' ? 'Đặt chỗ' : 'Booking'}</Badge>;
      case "payment": return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">{language === 'vi' ? 'Thanh toán' : 'Payment'}</Badge>;
      case "issue": return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">{language === 'vi' ? 'Sự cố' : 'Issue'}</Badge>;
      case "penalty": return <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200">{language === 'vi' ? 'Phạt' : 'Penalty'}</Badge>;
      case "general": return <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">{language === 'vi' ? 'Chung' : 'General'}</Badge>;
      case "invoice": return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">{t('invoice_badge')}</Badge>;
      case "late_arrival": return <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200">{t('late_arrival_badge')}</Badge>;
      case "charging_complete": return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">{t('charging_complete_badge')}</Badge>;
      case "overstay_warning": return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">{t('overstay_warning_badge')}</Badge>;
      case "report_success": return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">{t('report_success_badge')}</Badge>;
      default: return <Badge variant="outline">{t('notification_badge')}</Badge>;
    }
  };

  // Handle booking actions
  const handleBookingAction = (notificationId: string, action: 'start' | 'complete' | 'cancel', actionData: any) => {
    switch (action) {
      case 'start':
        toast.success(language === 'vi' ? 'Phiên sạc đã bắt đầu' : 'Charging session started', {
          description: language === 'vi' ? 'Vui lòng cắm xe vào trạm sạc' : 'Please plug in your vehicle'
        });
        break;
      case 'complete':
        toast.success(language === 'vi' ? 'Phiên sạc hoàn thành' : 'Charging session completed', {
          description: language === 'vi' ? 'Xe đã được sạc đầy' : 'Vehicle has been fully charged'
        });
        break;
      case 'cancel':
        toast.success(language === 'vi' ? 'Đã hủy phiên sạc' : 'Charging session cancelled', {
          description: language === 'vi' ? 'Phiên sạc đã được hủy thành công' : 'Charging session cancelled successfully'
        });
        break;
    }
    handleMarkAsRead(notificationId);
  };

  // Handle payment actions
  const handlePaymentAction = (notificationId: string, action: 'retry' | 'topup', actionData: any) => {
    switch (action) {
      case 'retry':
        toast.success(language === 'vi' ? 'Đang thử lại thanh toán' : 'Retrying payment', {
          description: language === 'vi' ? 'Vui lòng chờ trong giây lát' : 'Please wait a moment'
        });
        break;
      case 'topup':
        toast.success(language === 'vi' ? 'Chuyển đến trang nạp tiền' : 'Redirecting to top-up page', {
          description: language === 'vi' ? 'Đang chuyển hướng...' : 'Redirecting...'
        });
        break;
    }
    handleMarkAsRead(notificationId);
  };

  // Handle issue actions
  const handleIssueAction = (notificationId: string, actionData: any) => {
    toast.info(language === 'vi' ? 'Đã báo cáo sự cố' : 'Issue reported', {
      description: language === 'vi' ? 'Nhân viên đã được thông báo' : 'Staff has been notified'
    });
    handleMarkAsRead(notificationId);
  };

  // Handle penalty actions
  const handlePenaltyAction = (notificationId: string, action: 'pay' | 'dispute', actionData: any) => {
    switch (action) {
      case 'pay':
        toast.success(language === 'vi' ? 'Đã thanh toán phí phạt' : 'Penalty fee paid', {
          description: language === 'vi' ? `Đã thanh toán ${actionData.penaltyAmount?.toLocaleString()} VND` : `Paid ${actionData.penaltyAmount?.toLocaleString()} VND`
        });
        break;
      case 'dispute':
        toast.info(language === 'vi' ? 'Đã gửi khiếu nại' : 'Dispute submitted', {
          description: language === 'vi' ? 'Khiếu nại đã được gửi, chúng tôi sẽ xem xét' : 'Dispute submitted, we will review it'
        });
        break;
    }
    handleMarkAsRead(notificationId);
  };

  // Legacy handlers for backward compatibility
  const handleCancelSession = (notificationId: string, actionData: any) => {
    handleBookingAction(notificationId, 'cancel', actionData);
  };

  const handleContinueSession = (notificationId: string, actionData: any) => {
    handlePenaltyAction(notificationId, 'pay', actionData);
  };

  const markAsReadLocal = (notificationId: string) => {
    handleMarkAsRead(notificationId);
  };

  // Handle popup actions
  const handleViewNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedNotification(null);
  };

  const handlePopupMarkAsRead = async (notificationId: string) => {
    await handleMarkAsRead(notificationId);
    if (selectedNotification) {
      setSelectedNotification({ ...selectedNotification, isRead: true });
    }
  };

  const handlePopupAction = (action: string, data: any) => {
    // Handle different actions based on notification type
    switch (action) {
      case 'start':
        handleBookingAction(selectedNotification!.id, 'start', data);
        break;
      case 'complete':
        handleBookingAction(selectedNotification!.id, 'complete', data);
        break;
      case 'cancel':
        handleBookingAction(selectedNotification!.id, 'cancel', data);
        break;
      case 'retry':
        handlePaymentAction(selectedNotification!.id, 'retry', data);
        break;
      case 'topup':
        handlePaymentAction(selectedNotification!.id, 'topup', data);
        break;
      case 'report':
        handleIssueAction(selectedNotification!.id, data);
        break;
      case 'pay':
        handlePenaltyAction(selectedNotification!.id, 'pay', data);
        break;
      case 'dispute':
        handlePenaltyAction(selectedNotification!.id, 'dispute', data);
        break;
    }
    handleClosePopup();
  };

  // Use state-based unread count for consistency
  const unreadCount = contextUnreadCount;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4"> 
              <Button
                variant="ghost"
                onClick={onBack}
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('back')}</span>
              </Button>
              <div>
                <h1 className="text-3xl font-semibold bg-gradient-to-r from-primary to-secondary-foreground bg-clip-text text-transparent">
                  {t('notifications')}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {t('manage_notifications_updates')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Bell className="w-6 h-6 text-primary" />
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="rounded-full px-2 py-1">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshNotifications}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{t('refresh')}</span>
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{t('Mark all read')}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {displayNotifications.map((notification) => (
              <Card 
                key={notification.id}
                className={`transition-all hover:shadow-lg ${
                  !notification.isRead 
                    ? 'bg-card/80 backdrop-blur-xl border-primary/30 shadow-lg' 
                    : 'bg-card/60 backdrop-blur-xl border-border/50'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-foreground">
                            {notification.title}
                          </h3>
                          {getNotificationBadge(notification.type)}
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {notification.timestamp}
                        </span>
                      </div>

                      <p className="text-muted-foreground mb-4">
                        {notification.message}
                      </p>

                      {/* Action Buttons for different notification types */}
                      {notification.requiresAction && !notification.isRead && (
                        <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800/30">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-orange-900 dark:text-orange-100">
                              {language === 'vi' ? 'Bạn muốn làm gì?' : 'What would you like to do?'}
                            </span>
                            {notification.actionData?.penaltyAmount && (
                            <Badge variant="outline" className="text-orange-700 border-orange-300 dark:text-orange-300 dark:border-orange-700">
                                {language === 'vi' ? 'Phí' : 'Fee'}: {notification.actionData.penaltyAmount.toLocaleString()} VND
                            </Badge>
                            )}
                          </div>
                          
                          {/* Booking Actions */}
                          {notification.type === 'booking' && (
                            <div className="flex flex-col sm:flex-row gap-3">
                              <Button
                                variant="outline"
                                onClick={() => handleBookingAction(notification.id, 'start', notification.actionData)}
                                className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30"
                              >
                                <Zap className="w-4 h-4 mr-2" />
                                {language === 'vi' ? 'Bắt đầu sạc' : 'Start Charging'}
                              </Button>
                              <Button
                                onClick={() => handleBookingAction(notification.id, 'complete', notification.actionData)}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {language === 'vi' ? 'Hoàn thành' : 'Complete'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleBookingAction(notification.id, 'cancel', notification.actionData)}
                                className="flex-1 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                {language === 'vi' ? 'Hủy' : 'Cancel'}
                              </Button>
                            </div>
                          )}

                          {/* Payment Actions */}
                          {notification.type === 'payment' && (
                            <div className="flex flex-col sm:flex-row gap-3">
                              <Button
                                onClick={() => handlePaymentAction(notification.id, 'retry', notification.actionData)}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CreditCard className="w-4 h-4 mr-2" />
                                {language === 'vi' ? 'Thử lại' : 'Retry Payment'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handlePaymentAction(notification.id, 'topup', notification.actionData)}
                                className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30"
                              >
                                <DollarSign className="w-4 h-4 mr-2" />
                                {language === 'vi' ? 'Nạp tiền' : 'Top Up'}
                              </Button>
                            </div>
                          )}

                          {/* Issue Actions */}
                          {notification.type === 'issue' && (
                            <div className="flex flex-col sm:flex-row gap-3">
                              <Button
                                onClick={() => handleIssueAction(notification.id, notification.actionData)}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                              >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                {language === 'vi' ? 'Báo cáo sự cố' : 'Report Issue'}
                              </Button>
                            </div>
                          )}

                          {/* Penalty Actions */}
                          {notification.type === 'penalty' && (
                            <div className="flex flex-col sm:flex-row gap-3">
                              <Button
                                onClick={() => handlePenaltyAction(notification.id, 'pay', notification.actionData)}
                                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                              >
                                <CreditCard className="w-4 h-4 mr-2" />
                                {language === 'vi' ? 'Thanh toán phạt' : 'Pay Penalty'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handlePenaltyAction(notification.id, 'dispute', notification.actionData)}
                                className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/30"
                              >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                {language === 'vi' ? 'Khiếu nại' : 'Dispute'}
                              </Button>
                            </div>
                          )}

                          {/* Legacy Late Arrival Actions */}
                          {notification.type === 'late_arrival' && (
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                              variant="outline"
                              onClick={() => handleCancelSession(notification.id, notification.actionData)}
                              className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/30"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              {t('cancel_session')}
                            </Button>
                            <Button
                              onClick={() => handleContinueSession(notification.id, notification.actionData)}
                              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {t('continue_and_pay_fee')}
                            </Button>
                          </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewNotification(notification)}
                          className="flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>{language === 'vi' ? 'Xem chi tiết' : 'View Details'}</span>
                        </Button>
                        
                        {!notification.isRead && !notification.requiresAction && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="flex items-center space-x-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>{t('mark_as_read')}</span>
                        </Button>
                      )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Empty State */}
            {displayNotifications.length === 0 && !loading && (
              <Card className="bg-card/80 backdrop-blur-xl border border-border/50">
                <CardContent className="p-12 text-center">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-foreground mb-2">
                    {t('no_notifications')}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('all_notifications_appear_here')}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {loading && (
              <Card className="bg-card/80 backdrop-blur-xl border border-border/50">
                <CardContent className="p-12 text-center">
                  <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                  <h3 className="font-medium text-foreground mb-2">
                    {t('loading_notifications')}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('please_wait')}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {error && (
              <Card className="bg-card/80 backdrop-blur-xl border border-red-200 dark:border-red-800">
                <CardContent className="p-12 text-center">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="font-medium text-red-900 dark:text-red-100 mb-2">
                    {t('error_loading_notifications')}
                  </h3>
                  <p className="text-red-700 dark:text-red-300 mb-4">
                    {error}
                  </p>
                  <Button onClick={refreshNotifications} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('try_again')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary Stats */}
          <Card className="mt-8 bg-gradient-to-r from-primary/10 to-chart-2/10 backdrop-blur-xl border border-primary/20">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-foreground">{notificationCounts.total}</div>
                  <div className="text-sm text-muted-foreground">{t('total_notifications')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-orange-600">{notificationCounts.unread}</div>
                  <div className="text-sm text-muted-foreground">{t('unread')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-green-600">{notificationCounts.actionRequired}</div>
                  <div className="text-sm text-muted-foreground">{t('action_required')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Notification Detail Popup */}
      {showPopup && selectedNotification && (
        <NotificationDetailPopup
          notification={selectedNotification}
          onClose={handleClosePopup}
          onMarkAsRead={handlePopupMarkAsRead}
          onAction={handlePopupAction}
        />
      )}
      
      <Toaster />
    </>
  );
}