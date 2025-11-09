import { useState, useRef, useEffect, useMemo } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useStation } from "../contexts/StationContext";
import { useNotifications } from "../contexts/NotificationContext";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";
import { ArrowLeft, Bell, Clock, Mail, Zap, AlertTriangle, CheckCircle, XCircle, Car, CreditCard, User, FileText, Menu, X, Sun, Moon, Globe, Home, Users, Settings, HelpCircle, LogOut, MapPin, BarChart3, Calendar, ChevronDown, ArrowDown, Receipt, Activity, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
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
        sessionId?: string;
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
    // 🆕 Remove local notifications state, use context instead
    // const [notifications, setNotifications] = useState<StaffNotification[]>([

    // Add state variables for sidebar functionality
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [showScrollIndicator, setShowScrollIndicator] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const { currentStation } = useStation();
    const {
        notifications: apiNotifications,
        unreadCount,
        loading,
        error,
        refreshNotifications,
        markAsRead: contextMarkAsRead
    } = useNotifications();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // 🆕 Auto-load notifications when component mounts
    useEffect(() => {
        console.log("=== STAFF NOTIFICATION VIEW MOUNT DEBUG ===");
        console.log("StaffNotificationView mounted, auto-loading notifications...");
        refreshNotifications();
    }, []);

    // Function to handle language change
    const handleLanguageChange = () => {
        const newLanguage = language === "en" ? "vi" : "en";
        setLanguage(newLanguage);
    };

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            localStorage.removeItem("fullName");
            localStorage.removeItem("email");
            localStorage.removeItem("role");
            localStorage.removeItem("registeredUserId");
            localStorage.removeItem("refreshToken");
            toast.success(t('Logout successful') || 'Logout successful');
            setIsLoggingOut(false);
        } catch (_) {
            // ignore
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            localStorage.removeItem("fullName");
            localStorage.removeItem("email");
            localStorage.removeItem("role");
            localStorage.removeItem("registeredUserId");
            toast.success(t('Logout successful') || 'Logout successful');
            setIsLoggingOut(false);
        }
    };

    const menuItems = useMemo(() => [
        { id: "dashboard", label: t("dashboard") || "Dashboard", icon: Home },
        { id: "chargingManagement", label: language === 'vi' ? "Quản Lý Charging" : "Charging Management", icon: Zap },
        { id: "billing", label: t("billing_invoice") || "Billing & Invoice", icon: Receipt },
        { id: "reports", label: t("report_issues") || "Report Issues", icon: AlertTriangle },
        { id: "postActivating", label: language === 'vi' ? "Kích Hoạt Trạm" : "Post Activating", icon: Activity },
        { id: "notifications", label: t("notification") || "Notifications", icon: Bell },
        { id: "settings", label: "Settings", icon: Settings },
    ], [t, language]);

    // Handle menu item clicks
    const handleMenuClick = (itemId: string) => {
        setSidebarOpen(false);
    };

    // Handle scroll progress tracking
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const maxScroll = scrollHeight - clientHeight;
            const progress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
            setScrollProgress(progress);
            setShowScrollIndicator(maxScroll > 0);
        };

        container.addEventListener('scroll', handleScroll);
        handleScroll();

        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToBottom = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

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

    const handleContactUser = async (notificationId: string, userInfo: any) => {
        const phoneNumber = userInfo.phoneNumber ? ` (${userInfo.phoneNumber})` : '';
        toast.success("Đang liên hệ khách hàng", {
            description: `Gọi điện cho ${userInfo.name}${phoneNumber} về phiên ${userInfo.sessionId}`
        });

        // Mark as read using context
        if (typeof notificationId === 'string') {
            const id = parseInt(notificationId);
            if (!isNaN(id)) {
                await contextMarkAsRead(id);
            }
        }
    };

    const handleRemoveVehicle = async (notificationId: string, actionData: any) => {
        toast.success("Yêu cầu di chuyển xe", {
            description: `Đã gửi thông báo yêu cầu khách hàng di chuyển xe khỏi ${actionData.location}`
        });

        // Mark as read using context
        if (typeof notificationId === 'string') {
            const id = parseInt(notificationId);
            if (!isNaN(id)) {
                await contextMarkAsRead(id);
            }
        }
    };

    const handleApplyPenalty = async (notificationId: string, actionData: any) => {
        toast.success("Áp dụng phí phạt", {
            description: `Phí phạt ${actionData.amount?.toLocaleString()} VND đã được thêm vào hóa đơn`
        });

        // Mark as read using context
        if (typeof notificationId === 'string') {
            const id = parseInt(notificationId);
            if (!isNaN(id)) {
                await contextMarkAsRead(id);
            }
        }
    };

    const handleViewReport = async (notificationId: string, actionData: any) => {
        toast.info("Chuyển đến chi tiết báo cáo", {
            description: `Xem báo cáo ${actionData.reportId}`
        });

        // Mark as read using context
        if (typeof notificationId === 'string') {
            const id = parseInt(notificationId);
            if (!isNaN(id)) {
                await contextMarkAsRead(id);
            }
        }
    };

    const handleScheduleMaintenance = async (notificationId: string, actionData: any) => {
        toast.success("Lên lịch bảo trì", {
            description: `Bảo trì ${actionData.location} đã được lên lịch`
        });

        // Mark as read using context
        if (typeof notificationId === 'string') {
            const id = parseInt(notificationId);
            if (!isNaN(id)) {
                await contextMarkAsRead(id);
            }
        }
    };

    const markAsRead = async (notificationId: string) => {
        if (typeof notificationId === 'string') {
            const id = parseInt(notificationId);
            if (!isNaN(id)) {
                await contextMarkAsRead(id);
            }
        }
    };

    // 🆕 Enhanced refresh function
    const handleRefresh = async () => {
        console.log("=== STAFF MANUAL REFRESH NOTIFICATIONS ===");

        try {
            setIsRefreshing(true);

            await refreshNotifications();

            console.log("Staff manual refresh completed successfully");
            toast.success(language === 'vi' ? 'Đã làm mới thông báo' : 'Notifications refreshed');
        } catch (error) {
            console.error("Staff refresh failed:", error);
            toast.error(language === 'vi' ? 'Không thể làm mới thông báo' : 'Failed to refresh notifications');
        } finally {
            setIsRefreshing(false);
        }
    };

    // 🆕 Map API notifications to StaffNotification format
    const mapToStaffNotifications = (apiNotifications: any[]): StaffNotification[] => {
        return apiNotifications.map((notif) => {
            // Map backend types to staff notification types
            const mapType = (backendType: string) => {
                switch (backendType?.toUpperCase()) {
                    case 'BOOKING':
                        return 'charging_completed';
                    case 'PAYMENT':
                        return 'payment_issue';
                    case 'ISSUE':
                        return 'report_received';
                    case 'PENALTY':
                        return 'extended_parking';
                    case 'GENERAL':
                        return 'system_alert';
                    default:
                        return 'system_alert';
                }
            };

            // Determine priority based on content
            const getPriority = (content: string): "low" | "medium" | "high" | "urgent" => {
                if (content?.toLowerCase().includes('urgent') || content?.toLowerCase().includes('khẩn cấp')) {
                    return 'urgent';
                }
                if (content?.toLowerCase().includes('high') || content?.toLowerCase().includes('cao')) {
                    return 'high';
                }
                if (content?.toLowerCase().includes('medium') || content?.toLowerCase().includes('trung bình')) {
                    return 'medium';
                }
                return 'low';
            };

            // Determine if requires action
            const requiresAction = notif.content?.toLowerCase().includes('action required') ||
                notif.content?.toLowerCase().includes('cần hành động') ||
                notif.content?.toLowerCase().includes('penalty') ||
                notif.content?.toLowerCase().includes('phạt');

            const mappedNotification: StaffNotification = {
                id: notif.notificationId?.toString() || Math.random().toString(),
                type: mapType(notif.type) as StaffNotification['type'],
                title: notif.title || 'No Title',
                message: notif.content || 'No Content',
                timestamp: notif.sentTime || new Date().toISOString(),
                isRead: notif.isRead || false,
                priority: getPriority(notif.content || ''),
                requiresAction
            };

            return mappedNotification;
        });
    };

    const staffNotifications = mapToStaffNotifications(apiNotifications);

    const urgentCount = staffNotifications.filter(n => n.priority === "urgent" && !n.isRead).length;
    const actionRequiredCount = staffNotifications.filter(n => n.requiresAction && !n.isRead).length;

    const renderContent = () => {
        return (
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">
                            {language === 'vi' ? 'Quản Lý Thông Báo' : 'Notification Management'}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {language === 'vi' ? 'Xem và quản lý thông báo hệ thống' : 'View and manage system notifications'}
                        </p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Bell className="w-6 h-6 text-primary" />
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="rounded-full px-2 py-1">
                                {unreadCount}
                            </Badge>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={loading || isRefreshing}
                            className="flex items-center space-x-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
                            <span>{isRefreshing ? (language === 'vi' ? 'Đang làm mới...' : 'Refreshing...') : t('refresh') || 'Refresh'}</span>
                        </Button>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="space-y-4">
                    {loading && (
                        <Card className="bg-card/80 backdrop-blur-xl border border-border/50">
                            <CardContent className="p-12 text-center">
                                <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                                <h3 className="font-medium text-foreground mb-2">
                                    {t('loading_notifications') || 'Loading notifications'}
                                </h3>
                                <p className="text-muted-foreground">
                                    {t('please_wait') || 'Please wait...'}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {error && (
                        <Card className="bg-card/80 backdrop-blur-xl border border-red-200 dark:border-red-800">
                            <CardContent className="p-12 text-center">
                                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                <h3 className="font-medium text-red-900 dark:text-red-100 mb-2">
                                    {t('error_loading_notifications') || 'Error loading notifications'}
                                </h3>
                                <p className="text-red-700 dark:text-red-300 mb-4">
                                    {error}
                                </p>
                                <Button onClick={refreshNotifications} variant="outline">
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    {t('try_again') || 'Try again'}
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {!loading && !error && staffNotifications.map((notification) => (
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
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="min-h-screen bg-background flex relative">
                {/* Overlay for mobile sidebar */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Left Sidebar */}
                <div className={`w-64 bg-sidebar shadow-sm border-r border-sidebar-border flex flex-col fixed left-0 top-0 h-full z-40 transform transition-transform duration-300 ease-in-out ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                    {/* Close button for mobile */}
                    <div className="flex items-center justify-between p-4 border-b border-sidebar-border lg:hidden">
                        <h3 className="font-medium text-sidebar-foreground">Menu</h3>
                        <button
                            aria-label={language === 'vi' ? 'Đóng menu' : 'Close menu'}
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
                        >
                            <X className="w-5 h-5 text-sidebar-foreground" />
                        </button>
                    </div>

                    <div className="p-6 border-b border-sidebar-border">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
                                <span className="font-bold text-sidebar-primary-foreground">V</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="font-semibold text-sidebar-foreground truncate">{currentStation.name}</h2>
                                <p className="text-xs text-sidebar-foreground/60 truncate">
                                    ID: {currentStation.id}
                                </p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 overflow-hidden relative">
                        {/* Scroll Progress Indicator */}
                        {showScrollIndicator && (
                            <div className="absolute top-0 right-0 w-1 h-full bg-sidebar-border/30 z-10">
                                <div
                                    className="w-full bg-sidebar-primary transition-all duration-300 ease-out rounded-full"
                                    style={{ height: `${scrollProgress}%` }}
                                />
                            </div>
                        )}

                        {/* Quick Navigation Buttons */}
                        {showScrollIndicator && (
                            <div className="absolute top-2 right-2 flex flex-col space-y-1 z-20">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={scrollToBottom}
                                    className="h-6 w-6 p-0 bg-sidebar-accent/50 hover:bg-sidebar-accent text-sidebar-foreground rounded-md opacity-70 hover:opacity-100 transition-opacity"
                                    title="Scroll to Logout"
                                >
                                    <ArrowDown className="w-3 h-3" />
                                </Button>
                            </div>
                        )}

                        {/* Scrollable menu area */}
                        <div
                            ref={scrollContainerRef}
                            className="h-full overflow-y-auto px-4 py-4 space-y-2 scrollbar-thin scrollbar-track-sidebar scrollbar-thumb-sidebar-border hover:scrollbar-thumb-sidebar-accent-foreground"
                        >
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Button
                                        key={item.id}
                                        variant={item.id === "notifications" ? "default" : "ghost"}
                                        className={`w-full justify-start ${
                                            item.id === "notifications"
                                                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                        }`}
                                        onClick={() => handleMenuClick(item.id)}
                                    >
                                        <Icon className="w-4 h-4 mr-3" />
                                        {item.label}
                                    </Button>
                                );
                            })}
                        </div>
                    </nav>

                    <div className="p-4 border-t border-sidebar-border relative">
                        {/* Logout indicator when scrolled */}
                        {scrollProgress < 90 && showScrollIndicator && (
                            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                                <div className="flex items-center space-x-1 text-xs text-sidebar-foreground/50 animate-pulse">
                                    <ChevronDown className="w-3 h-3" />
                                    <span>Logout</span>
                                    <ChevronDown className="w-3 h-3" />
                                </div>
                            </div>
                        )}

                        <Button
                            variant="ghost"
                            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                        >
                            <LogOut className="w-4 h-4 mr-3" />
                            Logout
                        </Button>
                    </div>
                </div>

                {/* Overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main Content */}
                <div className="flex-1 md:ml-0 overflow-y-auto">
                    <main className="min-h-screen bg-background">
                        <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
                            {/* Mobile Menu Button */}
                            <div className="md:hidden mb-6">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSidebarOpen(!sidebarOpen)}
                                    className="shadow-sm"
                                >
                                    <Menu className="w-5 h-5 mr-2" />
                                    Menu
                                </Button>
                            </div>
                            {renderContent()}
                        </div>
                    </main>
                </div>
            </div>
            <Toaster />
        </>
    );
}