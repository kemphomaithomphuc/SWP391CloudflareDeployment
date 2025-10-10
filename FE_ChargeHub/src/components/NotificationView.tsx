import { useState, useEffect } from "react";
import { ArrowLeft, Bell, Clock, Mail, Zap, AlertTriangle, CheckCircle, XCircle, Car, CreditCard } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { toast } from "sonner@2.0.3";
import { Toaster } from "./ui/sonner";
import { useLanguage } from "../contexts/LanguageContext";
import { useBooking } from "../contexts/BookingContext";

interface Notification {
  id: string;
  type: "invoice" | "late_arrival" | "charging_complete" | "overstay_warning" | "report_success";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  requiresAction?: boolean;
  actionData?: {
    sessionId: string;
    minutesLate?: number;
    penaltyAmount?: number;
    location?: string;
  };
}

interface NotificationViewProps {
  onBack: () => void;
}

export default function NotificationView({ onBack }: NotificationViewProps) {
  const { t, language } = useLanguage();
  const { notifications, markNotificationAsRead } = useBooking();
  
  // Generate localized notification data
  const getLocalizedNotifications = (): Notification[] => [
    {
      id: "1",
      type: "late_arrival",
      title: t('late_arrival_title'),
      message: t('late_arrival_message')
        .replace('{minutes}', '10')
        .replace('{location}', language === 'vi' ? 'Trạm Sạc Premium - Q1' : 'Premium Charging Station - Q1')
        .replace('{amount}', '5,000'),
      timestamp: language === 'vi' ? '2 phút trước' : '2 minutes ago',
      isRead: false,
      requiresAction: true,
      actionData: {
        sessionId: "CS001",
        minutesLate: 10,
        penaltyAmount: 5000,
        location: language === 'vi' ? 'Trạm Sạc Premium - Q1' : 'Premium Charging Station - Q1'
      }
    },
    {
      id: "2", 
      type: "overstay_warning",
      title: t('overstay_warning_title'),
      message: t('overstay_warning_message')
        .replace('{location}', language === 'vi' ? 'Premium Station - Q3' : 'Premium Station - Q3')
        .replace('{minutes}', '15')
        .replace('{amount}', '15,000'),
      timestamp: language === 'vi' ? '5 phút trước' : '5 minutes ago',
      isRead: false,
      requiresAction: false,
      actionData: {
        sessionId: "CS002",
        penaltyAmount: 15000,
        location: language === 'vi' ? 'Premium Station - Q3' : 'Premium Station - Q3'
      }
    },
    {
      id: "3",
      type: "charging_complete", 
      title: t('charging_complete_title'),
      message: t('charging_complete_message')
        .replace('{vehicle}', 'Tesla Model 3')
        .replace('{location}', language === 'vi' ? 'Trạm Sạc EcoCharge' : 'EcoCharge Station')
        .replace('{percentage}', '95'),
      timestamp: language === 'vi' ? '10 phút trước' : '10 minutes ago',
      isRead: false,
      requiresAction: false,
      actionData: {
        sessionId: "CS003",
        location: language === 'vi' ? 'Trạm Sạc EcoCharge - Q7' : 'EcoCharge Station - Q7'
      }
    },
    {
      id: "4",
      type: "invoice",
      title: t('invoice_sent_title'),
      message: t('invoice_sent_message')
        .replace('{date}', '16/09/2025')
        .replace('{email}', 'cuongdeptrai@gmail.com')
        .replace('{amount}', '75,000'),
      timestamp: language === 'vi' ? '1 giờ trước' : '1 hour ago',
      isRead: true,
      requiresAction: false,
      actionData: {
        sessionId: "CS004"
      }
    },
    {
      id: "5",
      type: "report_success",
      title: t('report_success_title'),
      message: t('report_success_message')
        .replace('{title}', language === 'vi' ? 'Trạm sạc không hoạt động' : 'Charging station malfunction')
        .replace('{location}', language === 'vi' ? 'EcoCharge Q7' : 'EcoCharge Q7'),
      timestamp: language === 'vi' ? '2 giờ trước' : '2 hours ago',
      isRead: true,
      requiresAction: false,
      actionData: {
        sessionId: "RPT001",
        location: "EcoCharge Q7"
      }
    }
  ];

  // Use notifications from context, fallback to local ones if empty
  const contextNotifications = notifications.length > 0 ? notifications : getLocalizedNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "invoice": return <CreditCard className="w-5 h-5 text-green-600" />;
      case "late_arrival": return <Clock className="w-5 h-5 text-orange-600" />;
      case "charging_complete": return <Zap className="w-5 h-5 text-blue-600" />;
      case "overstay_warning": return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "report_success": return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "booking_confirmed": return <CheckCircle className="w-5 h-5 text-green-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "invoice": return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">{t('invoice_badge')}</Badge>;
      case "late_arrival": return <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200">{t('late_arrival_badge')}</Badge>;
      case "charging_complete": return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">{t('charging_complete_badge')}</Badge>;
      case "overstay_warning": return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">{t('overstay_warning_badge')}</Badge>;
      case "report_success": return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">{t('report_success_badge')}</Badge>;
      case "booking_confirmed": return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">{language === 'vi' ? 'Đặt chỗ' : 'Booking'}</Badge>;
      default: return <Badge variant="outline">{t('notification_badge')}</Badge>;
    }
  };

  const handleCancelSession = (notificationId: string, actionData: any) => {
    toast.success(t('session_cancelled_successfully'), {
      description: t('session_cancelled_description')
        .replace('{sessionId}', actionData.sessionId)
        .replace('{location}', actionData.location)
    });
    
    // Mark notification as read
    markNotificationAsRead(notificationId);

    // Simulate sending notification to staff
    setTimeout(() => {
      toast.info(t('notification_sent_to_staff'), {
        description: t('staff_notified_cancellation')
      });
    }, 1000);
  };

  const handleContinueSession = (notificationId: string, actionData: any) => {
    toast.success(t('continue_charging_session'), {
      description: t('late_fee_description')
        .replace('{amount}', actionData.penaltyAmount?.toLocaleString())
    });

    // Mark notification as read
    markNotificationAsRead(notificationId);

    // Simulate sending notification to staff
    setTimeout(() => {
      toast.info(t('notification_sent_to_staff'), {
        description: t('staff_notified_late_fee')
      });
    }, 1000);
  };

  const markAsRead = (notificationId: string) => {
    markNotificationAsRead(notificationId);
  };

  const unreadCount = contextNotifications.filter(n => !n.isRead).length;

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

            <div className="flex items-center space-x-2">
              <Bell className="w-6 h-6 text-primary" />
              {unreadCount > 0 && (
                <Badge variant="destructive" className="rounded-full px-2 py-1">
                  {unreadCount}
                </Badge>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {contextNotifications.map((notification) => (
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

                      {/* Action Buttons for Late Arrival */}
                      {notification.requiresAction && notification.type === "late_arrival" && (
                        <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800/30">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-orange-900 dark:text-orange-100">
                              {t('what_would_you_like_to_do')}
                            </span>
                            <Badge variant="outline" className="text-orange-700 border-orange-300 dark:text-orange-300 dark:border-orange-700">
                              {t('fee')}: {notification.actionData?.penaltyAmount?.toLocaleString()} VND
                            </Badge>
                          </div>
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
                        </div>
                      )}

                      {/* Mark as Read Button */}
                      {!notification.isRead && !notification.requiresAction && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="mt-2"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {t('mark_as_read')}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Empty State */}
            {notifications.length === 0 && (
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
          </div>

          {/* Summary Stats */}
          <Card className="mt-8 bg-gradient-to-r from-primary/10 to-chart-2/10 backdrop-blur-xl border border-primary/20">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-foreground">{contextNotifications.length}</div>
                  <div className="text-sm text-muted-foreground">{t('total_notifications')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-orange-600">{unreadCount}</div>
                  <div className="text-sm text-muted-foreground">{t('unread')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-green-600">
                    {contextNotifications.filter(n => n.requiresAction).length}
                  </div>
                  <div className="text-sm text-muted-foreground">{t('action_required')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Toaster />
    </>
  );
}