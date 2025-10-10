import { useState } from "react";
import { ArrowLeft, Bell, Clock, Mail, Zap, AlertTriangle, CheckCircle, XCircle, Car, CreditCard, User, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { toast } from "sonner@2.0.3";
import { Toaster } from "./ui/sonner";

interface StaffNotification {
  id: string;
  type: "charging_completed" | "late_arrival_decision" | "extended_parking" | "user_decision" | "overstay_alert" | "report_received" | "system_alert" | "payment_issue" | "maintenance_required";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: "low" | "medium" | "high" | "urgent";
  requiresAction?: boolean;
  userInfo?: {
    name: string;
    sessionId: string;
    location: string;
    vehiclePlate?: string;
    phoneNumber?: string;
  };
  actionData?: {
    sessionId: string;
    reportId?: string;
    amount?: number;
    location?: string;
    chargingDuration?: string;
    energyDelivered?: number;
    decisionType?: "cancel" | "wait_with_fee";
    parkingDuration?: string;
  };
}

interface StaffNotificationViewProps {
  onBack: () => void;
}

export default function StaffNotificationView({ onBack }: StaffNotificationViewProps) {
  const [notifications, setNotifications] = useState<StaffNotification[]>([
    {
      id: "1",
      type: "charging_completed",
      title: "⚡ Phiên sạc hoàn thành",
      message: "Khách hàng Nguyễn Văn A đã hoàn thành phiên sạc CS001 tại Trạm Sạc Premium - Q1. Thời gian sạc: 45 phút, năng lượng: 25.5 kWh. Thanh toán thành công.",
      timestamp: "1 phút trước",
      isRead: false,
      priority: "low",
      requiresAction: false,
      userInfo: {
        name: "Nguyễn Văn A",
        sessionId: "CS001",
        location: "Trạm Sạc Premium - Q1",
        vehiclePlate: "30A-12345",
        phoneNumber: "0901234567"
      },
      actionData: {
        sessionId: "CS001",
        location: "Trạm Sạc Premium - Q1",
        chargingDuration: "45 phút",
        energyDelivered: 25.5,
        amount: 89250
      }
    },
    {
      id: "2",
      type: "late_arrival_decision",
      title: "⏰ Khách hàng chọn tiếp tục sau khi trễ",
      message: "Khách hàng Trần Thị B đã đến trễ 15 phút cho phiên sạc CS002. Khách hàng đã chọn tiếp tục và chấp nhận phí trễ 10,000 VND. Phiên sạc đã được kích hoạt.",
      timestamp: "3 phút trước",
      isRead: false,
      priority: "medium",
      requiresAction: false,
      userInfo: {
        name: "Trần Thị B",
        sessionId: "CS002",
        location: "Premium Station - Q3",
        vehiclePlate: "51G-98765",
        phoneNumber: "0912345678"
      },
      actionData: {
        sessionId: "CS002",
        location: "Premium Station - Q3",
        amount: 10000,
        decisionType: "wait_with_fee"
      }
    },
    {
      id: "3",
      type: "extended_parking",
      title: "🚨 Xe đậu quá lâu không sạc",
      message: "Khách hàng Lê Văn C đã đậu xe tại EcoCharge Q7 hơn 30 phút nhưng chưa bắt đầu sạc. Cần liên hệ ngay để giải phóng slot hoặc áp dụng phí phạt đậu xe 15,000 VND.",
      timestamp: "2 phút trước",
      isRead: false,
      priority: "high",
      requiresAction: true,
      userInfo: {
        name: "Lê Văn C",
        sessionId: "CS003",
        location: "EcoCharge Q7",
        vehiclePlate: "29B-55555",
        phoneNumber: "0923456789"
      },
      actionData: {
        sessionId: "CS003",
        location: "EcoCharge Q7",
        parkingDuration: "32 phút",
        amount: 15000
      }
    },
    {
      id: "4",
      type: "late_arrival_decision",
      title: "❌ Khách hàng hủy do đến trễ",
      message: "Khách hàng Phạm Văn D đã đến trễ 20 phút cho phiên sạc CS004 và quyết định hủy phiên sạc. Slot tại FastCharge - Q5 hiện đã được giải phóng cho khách hàng khác.",
      timestamp: "8 phút trước",
      isRead: false,
      priority: "low",
      requiresAction: false,
      userInfo: {
        name: "Phạm Văn D",
        sessionId: "CS004",
        location: "FastCharge - Q5",
        vehiclePlate: "92C-11111",
        phoneNumber: "0934567890"
      },
      actionData: {
        sessionId: "CS004",
        location: "FastCharge - Q5",
        decisionType: "cancel"
      }
    },
    {
      id: "5",
      type: "charging_completed",
      title: "⚡ Phiên sạc hoàn thành",
      message: "Khách hàng Hoàng Thị E đã hoàn thành phiên sạc CS005 tại GreenPower Q2. Thời gian sạc: 1h 20m, năng lượng: 42.8 kWh. Xe đã rời khỏi trạm.",
      timestamp: "12 phút trước",
      isRead: true,
      priority: "low",
      requiresAction: false,
      userInfo: {
        name: "Hoàng Thị E",
        sessionId: "CS005",
        location: "GreenPower Q2",
        vehiclePlate: "92C-11111",
        phoneNumber: "0945678901"
      },
      actionData: {
        sessionId: "CS005",
        location: "GreenPower Q2",
        chargingDuration: "1h 20m",
        energyDelivered: 42.8,
        amount: 149800
      }
    },
    {
      id: "6",
      type: "report_received",
      title: "📋 Báo cáo sự cố mới",
      message: "Khách hàng Võ Minh F vừa báo cáo sự cố 'Trạm sạc không hoạt động' tại EcoCharge Q7. Yêu cầu kiểm tra và xử lý trong 24h.",
      timestamp: "25 phút trước", 
      isRead: false,
      priority: "high",
      requiresAction: true,
      userInfo: {
        name: "Võ Minh F",
        sessionId: "RPT001",
        location: "EcoCharge Q7",
        phoneNumber: "0956789012"
      },
      actionData: {
        reportId: "RPT001",
        sessionId: "RPT001",
        location: "EcoCharge Q7"
      }
    },
    {
      id: "7",
      type: "payment_issue",
      title: "💳 Lỗi thanh toán",
      message: "Phiên sạc CS007 của khách hàng Đỗ Thị G gặp lỗi thanh toán. Thẻ bị từ chối. Cần liên hệ khách hàng để xử lý.",
      timestamp: "35 phút trước",
      isRead: false,
      priority: "urgent",
      requiresAction: true,
      userInfo: {
        name: "Đỗ Thị G",
        sessionId: "CS007",
        location: "FastCharge - Q5",
        vehiclePlate: "61A-77777",
        phoneNumber: "0967890123"
      },
      actionData: {
        sessionId: "CS007",
        amount: 85000,
        location: "FastCharge - Q5"
      }
    },
    {
      id: "8",
      type: "maintenance_required",
      title: "🔧 Yêu cầu bảo trì",
      message: "Trạm sạc EcoStation - Q8 cần bảo trì định kỳ. Đã vận hành 2000+ phiên sạc. Lên lịch bảo trì trong tuần này.",
      timestamp: "2 giờ trước",
      isRead: true, 
      priority: "medium",
      requiresAction: true,
      actionData: {
        location: "EcoStation - Q8"
      }
    }
  ]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "charging_completed": return <Zap className="w-5 h-5 text-green-600" />;
      case "late_arrival_decision": return <Clock className="w-5 h-5 text-orange-600" />;
      case "extended_parking": return <Car className="w-5 h-5 text-red-600" />;
      case "user_decision": return <User className="w-5 h-5 text-blue-600" />;
      case "overstay_alert": return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "report_received": return <FileText className="w-5 h-5 text-orange-600" />;
      case "system_alert": return <Bell className="w-5 h-5 text-purple-600" />;
      case "payment_issue": return <CreditCard className="w-5 h-5 text-red-700" />;
      case "maintenance_required": return <Car className="w-5 h-5 text-yellow-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationBadge = (type: string, priority: string) => {
    const priorityColors = {
      urgent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
      high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200", 
      medium: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
      low: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200"
    };

    const typeLabels = {
      charging_completed: "Hoàn thành",
      late_arrival_decision: "Trễ giờ",
      extended_parking: "Đậu lâu",
      user_decision: "Quyết định",
      overstay_alert: "Cảnh báo",
      report_received: "Báo cáo",
      system_alert: "Hệ thống", 
      payment_issue: "Thanh toán",
      maintenance_required: "Bảo trì"
    };

    return (
      <div className="flex items-center space-x-2">
        <Badge variant="secondary" className={priorityColors[priority as keyof typeof priorityColors]}>
          {typeLabels[type as keyof typeof typeLabels]}
        </Badge>
        {priority === "urgent" && <Badge variant="destructive" className="animate-pulse">Khẩn</Badge>}
        {priority === "high" && <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200">Cao</Badge>}
      </div>
    );
  };

  const handleContactUser = (notificationId: string, userInfo: any) => {
    const phoneNumber = userInfo.phoneNumber ? ` (${userInfo.phoneNumber})` : '';
    toast.success("Đang liên hệ khách hàng", {
      description: `Gọi điện cho ${userInfo.name}${phoneNumber} về phiên ${userInfo.sessionId}`
    });
    
    // Mark as read and remove action requirement
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId 
        ? { ...notif, isRead: true, requiresAction: false }
        : notif
    ));
  };

  const handleRemoveVehicle = (notificationId: string, actionData: any) => {
    toast.success("Yêu cầu di chuyển xe", {
      description: `Đã gửi thông báo yêu cầu khách hàng di chuyển xe khỏi ${actionData.location}`
    });
    
    // Mark as read and remove action requirement
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId 
        ? { ...notif, isRead: true, requiresAction: false }
        : notif
    ));
  };

  const handleApplyPenalty = (notificationId: string, actionData: any) => {
    toast.success("Áp dụng phí phạt", {
      description: `Phí phạt ${actionData.amount?.toLocaleString()} VND đã được thêm vào hóa đơn`
    });

    // Mark as read and remove action requirement  
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId 
        ? { ...notif, isRead: true, requiresAction: false }
        : notif
    ));
  };

  const handleViewReport = (notificationId: string, actionData: any) => {
    toast.info("Chuyển đến chi tiết báo cáo", {
      description: `Xem báo cáo ${actionData.reportId}`
    });

    // Mark as read
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId 
        ? { ...notif, isRead: true }
        : notif
    ));
  };

  const handleScheduleMaintenance = (notificationId: string, actionData: any) => {
    toast.success("Lên lịch bảo trì", {
      description: `Bảo trì ${actionData.location} đã được lên lịch`
    });

    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId 
        ? { ...notif, isRead: true, requiresAction: false }
        : notif
    ));
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, isRead: true } : notif
    ));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const urgentCount = notifications.filter(n => n.priority === "urgent" && !n.isRead).length;
  const actionRequiredCount = notifications.filter(n => n.requiresAction && !n.isRead).length;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30 p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </Button>
              <div>
                <h1 className="text-3xl font-semibold bg-gradient-to-r from-primary to-secondary-foreground bg-clip-text text-transparent">
                  Thông báo Staff
                </h1>
                <p className="text-muted-foreground mt-2">
                  Quản lý thông báo và cảnh báo hệ thống
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
            {notifications.map((notification) => (
              <Card 
                key={notification.id}
                className={`transition-all hover:shadow-lg ${
                  !notification.isRead 
                    ? 'bg-card/80 backdrop-blur-xl border-primary/30 shadow-lg' 
                    : 'bg-card/60 backdrop-blur-xl border-border/50'
                } ${
                  notification.priority === "urgent" 
                    ? 'border-red-500/50 shadow-red-500/20' 
                    : ''
                } ${
                  notification.type === "charging_completed" 
                    ? 'border-green-500/30 shadow-green-500/10' 
                    : ''
                } ${
                  notification.type === "extended_parking" 
                    ? 'border-red-500/40 shadow-red-500/15' 
                    : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Priority Indicator */}
                    <div className="flex-shrink-0 mt-1">
                      {notification.priority === "urgent" && (
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      )}
                      {notification.priority === "high" && (
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      )}
                      {notification.priority === "medium" && (
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      )}
                      {notification.priority === "low" && (
                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      )}
                    </div>

                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <h3 className="font-medium text-foreground">
                            {notification.title}
                          </h3>
                          {getNotificationBadge(notification.type, notification.priority)}
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {notification.timestamp}
                        </span>
                      </div>

                      <p className="text-muted-foreground mb-4">
                        {notification.message}
                      </p>

                      {/* User Info */}
                      {notification.userInfo && (
                        <div className="bg-muted/50 rounded-lg p-3 mb-4 border border-border/30">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Khách hàng:</span>
                              <p className="font-medium">{notification.userInfo.name}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Phiên:</span>
                              <p className="font-medium">{notification.userInfo.sessionId}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Vị trí:</span>
                              <p className="font-medium">{notification.userInfo.location}</p>
                            </div>
                            {notification.userInfo.vehiclePlate && (
                              <div>
                                <span className="text-muted-foreground">Biển số:</span>
                                <p className="font-medium">{notification.userInfo.vehiclePlate}</p>
                              </div>
                            )}
                          </div>

                          {/* Extended details for specific notification types */}
                          {(notification.type === "charging_completed" || notification.type === "extended_parking") && notification.actionData && (
                            <div className="mt-3 pt-3 border-t border-border/30">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                {notification.actionData.chargingDuration && (
                                  <div>
                                    <span className="text-muted-foreground">Thời gian sạc:</span>
                                    <p className="font-medium text-green-600">{notification.actionData.chargingDuration}</p>
                                  </div>
                                )}
                                {notification.actionData.energyDelivered && (
                                  <div>
                                    <span className="text-muted-foreground">Năng lượng:</span>
                                    <p className="font-medium text-blue-600">{notification.actionData.energyDelivered} kWh</p>
                                  </div>
                                )}
                                {notification.actionData.parkingDuration && (
                                  <div>
                                    <span className="text-muted-foreground">Thời gian đậu:</span>
                                    <p className="font-medium text-orange-600">{notification.actionData.parkingDuration}</p>
                                  </div>
                                )}
                                {notification.actionData.amount && (
                                  <div>
                                    <span className="text-muted-foreground">Số tiền:</span>
                                    <p className="font-medium text-primary">{notification.actionData.amount.toLocaleString()} VND</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Phone number for contact */}
                          {notification.userInfo.phoneNumber && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              📞 {notification.userInfo.phoneNumber}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      {notification.requiresAction && (
                        <div className="space-y-3">
                          {notification.type === "extended_parking" && (
                            <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 border border-red-200 dark:border-red-800/30">
                              <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                  variant="outline"
                                  onClick={() => handleContactUser(notification.id, notification.userInfo)}
                                  className="flex-1 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300"
                                >
                                  <User className="w-4 h-4 mr-2" />
                                  Liên hệ khách hàng
                                </Button>
                                <Button
                                  onClick={() => handleRemoveVehicle(notification.id, notification.actionData)}
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                >
                                  <Car className="w-4 h-4 mr-2" />
                                  Yêu cầu di chuyển xe
                                </Button>
                                <Button
                                  onClick={() => handleApplyPenalty(notification.id, notification.actionData)}
                                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                  <CreditCard className="w-4 h-4 mr-2" />
                                  Áp dụng phí phạt
                                </Button>
                              </div>
                            </div>
                          )}

                          {notification.type === "overstay_alert" && (
                            <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800/30">
                              <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                  variant="outline"
                                  onClick={() => handleContactUser(notification.id, notification.userInfo)}
                                  className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300"
                                >
                                  <User className="w-4 h-4 mr-2" />
                                  Liên hệ khách hàng
                                </Button>
                                <Button
                                  onClick={() => handleApplyPenalty(notification.id, notification.actionData)}
                                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                  <CreditCard className="w-4 h-4 mr-2" />
                                  Áp dụng phí phạt
                                </Button>
                              </div>
                            </div>
                          )}

                          {notification.type === "report_received" && (
                            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800/30">
                              <Button
                                onClick={() => handleViewReport(notification.id, notification.actionData)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Xem chi tiết báo cáo
                              </Button>
                            </div>
                          )}

                          {notification.type === "payment_issue" && (
                            <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 border border-red-200 dark:border-red-800/30">
                              <Button
                                onClick={() => handleContactUser(notification.id, notification.userInfo)}
                                className="w-full bg-red-600 hover:bg-red-700 text-white"
                              >
                                <User className="w-4 h-4 mr-2" />
                                Liên hệ khách hàng ngay
                              </Button>
                            </div>
                          )}

                          {notification.type === "maintenance_required" && (
                            <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800/30">
                              <Button
                                onClick={() => handleScheduleMaintenance(notification.id, notification.actionData)}
                                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                              >
                                <Car className="w-4 h-4 mr-2" />
                                Lên lịch bảo trì
                              </Button>
                            </div>
                          )}
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
                          Đánh dấu đã đọc
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
                    Không có thông báo
                  </h3>
                  <p className="text-muted-foreground">
                    Tất cả thông báo của staff sẽ hiển thị ở đây
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary Stats */}
          <Card className="mt-8 bg-gradient-to-r from-primary/10 to-chart-2/10 backdrop-blur-xl border border-primary/20">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-foreground">{notifications.length}</div>
                  <div className="text-sm text-muted-foreground">Tổng thông báo</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-orange-600">{unreadCount}</div>
                  <div className="text-sm text-muted-foreground">Chưa đọc</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-red-600">{urgentCount}</div>
                  <div className="text-sm text-muted-foreground">Khẩn cấp</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-blue-600">{actionRequiredCount}</div>
                  <div className="text-sm text-muted-foreground">Cần hành động</div>
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