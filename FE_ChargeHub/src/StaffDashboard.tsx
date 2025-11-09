import { useState, useRef, useEffect, useMemo } from "react";
import { useTheme } from "./contexts/ThemeContext";
import { useLanguage } from "./contexts/LanguageContext";
import { useStation } from "./contexts/StationContext";
import { Button } from "./components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
import { Separator } from "./components/ui/separator";
import StaffInvoiceView from "./components/StaffInvoiceView";
import StaffReportView from "./components/StaffReportView";
import PostActivatingView from "./components/PostActivatingView";
import ChargingManagementView from "./components/ChargingManagementView";
import StaffNotificationView from "./components/StaffNotificationView";
import {
    Menu,
    X,
    Sun,
    Moon,
    Globe,
    Home,
    Users,
    Settings,
    HelpCircle,
    LogOut,
    MapPin,
    Zap,
    Car,
    BarChart3,
    Calendar,
    Bell,
    ChevronDown,
    ArrowDown,
    Receipt,
    AlertTriangle,
    FileText,
    CreditCard,
    DollarSign,
    CheckCircle,
    Activity
} from "lucide-react";
import { logoutUser, getOrdersByStation } from "./services/api";
import { toast } from "sonner";

interface StaffDashboardProps {
  onLogout: () => void;
  onNotifications?: () => void;
  onReports?: () => void;
  onChargingManagement?: () => void;
  onPostActivating?: () => void;
  onStationManagement?: () => void;
}

export default function StaffDashboard({ onLogout, onNotifications, onReports, onChargingManagement, onPostActivating, onStationManagement }: StaffDashboardProps) {
    const [activeSection, setActiveSection] = useState("dashboard");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [showScrollIndicator, setShowScrollIndicator] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [ordersCount, setOrdersCount] = useState<number>(0);
    const { theme, toggleTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const { currentStation } = useStation();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Function to handle language change
    const handleLanguageChange = () => {
        const newLanguage = language === "en" ? "vi" : "en";
        setLanguage(newLanguage);
    };
    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await logoutUser();
        } catch (_) {
            // ignore
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            localStorage.removeItem("fullName");
            localStorage.removeItem("email");
            localStorage.removeItem("role");
            localStorage.removeItem("registeredUserId");
            localStorage.removeItem("refreshToken");
            toast.success(t('Logout successful'));
            setIsLoggingOut(false);
            onLogout();
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
        setActiveSection(itemId);
        setSidebarOpen(false);
    };

  // Fetch orders count on mount
  useEffect(() => {
    const fetchOrdersCount = async () => {
      try {
        const stationId = localStorage.getItem('stationId');
        if (stationId) {
          const response = await getOrdersByStation(Number(stationId));
          if (response.success && response.data) {
            setOrdersCount(response.data.length);
          }
        }
      } catch (error) {
        console.error('Error fetching orders count:', error);
      }
    };
    
    fetchOrdersCount();
  }, []);

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
    handleScroll(); // Initial check

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

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

    const renderContent = () => {
        switch (activeSection) {
      case "billing":
        return (
          <StaffInvoiceView onBack={() => setActiveSection("dashboard")} />
        );

      case "reports":
        return (
          <StaffReportView onBack={() => setActiveSection("dashboard")} />
        );

      case "postActivating":
        return (
          <PostActivatingView onBack={() => setActiveSection("dashboard")} />
        );

      case "chargingManagement":
        return (
          <ChargingManagementView onBack={() => setActiveSection("dashboard")} />
        );

      case "notifications":
        return (
          <StaffNotificationView onBack={() => setActiveSection("dashboard")} />
        );

      case "settings":
        return (
          <div className="space-y-6">
            <h2 className="text-foreground">{t("settings")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Theme Settings */}
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                <h3 className="font-medium text-card-foreground mb-4">{t("appearance")}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("theme")}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleTheme}
                      className="h-8"
                    >
                      {theme === "light" ? (
                        <>
                          <Moon className="w-3 h-3 mr-1" />
                          {t("dark")}
                        </>
                      ) : (
                        <>
                          <Sun className="w-3 h-3 mr-1" />
                          {t("light")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Language Settings */}
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                <h3 className="font-medium text-card-foreground mb-4">{t("language")}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("display_language")}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLanguageChange}
                      className="h-8"
                    >
                      <Globe className="w-3 h-3 mr-1" />
                      {language === "en" ? t("tieng_viet") : t("english")}
                    </Button>
                  </div>
                </div>
              </div>

              {/* System Logs */}
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                <h3 className="font-medium text-card-foreground mb-4">{t("system_logs")}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t("view_system_logs_monitoring")}</p>
                <Button variant="outline" size="sm" onClick={() => setActiveSection("system-logs")}>
                  <Settings className="w-3 h-3 mr-1" />
                  {t("view_logs")}
                </Button>
              </div>

              {/* Backup */}
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                <h3 className="font-medium text-card-foreground mb-4">{t("backup")}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t("system_backup_recovery")}</p>
                <Button variant="outline" size="sm" onClick={() => setActiveSection("backup")}>
                  <Settings className="w-3 h-3 mr-1" />
                  {t("manage_backup")}
                </Button>
              </div>

              {/* Security */}
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border md:col-span-2">
                <h3 className="font-medium text-card-foreground mb-4">{t("security")}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t("security_access_control")}</p>
                <Button variant="outline" size="sm" onClick={() => setActiveSection("security")}>
                  <Settings className="w-3 h-3 mr-1" />
                  {t("security_settings")}
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="mb-2 text-foreground">
                {language === 'vi' ? 'Bảng Điều Khiển Nhân Viên' : 'Staff Dashboard'}
              </h2>
              <p className="text-muted-foreground">
                {language === 'vi' 
                  ? 'Chào mừng bạn đến với hệ thống quản lý trạm sạc' 
                  : 'Welcome to the charging station management system'
                }
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div 
                className="bg-card rounded-xl p-6 shadow-sm border border-border cursor-pointer hover:shadow-md hover:border-yellow-600/30 transition-all duration-200"
                onClick={() => setActiveSection("chargingManagement")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Quản Lý Charging' : 'Charging Management'}</p>
                    <p className="text-2xl font-semibold text-card-foreground">{ordersCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </div>

              <div 
                className="bg-card rounded-xl p-6 shadow-sm border border-border cursor-pointer hover:shadow-md hover:border-green-600/30 transition-all duration-200"
                onClick={() => setActiveSection("billing")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('pending_invoices')}</p>
                    <p className="text-2xl font-semibold text-card-foreground">5</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>

              <div 
                className="bg-card rounded-xl p-6 shadow-sm border border-border cursor-pointer hover:shadow-md hover:border-orange-600/30 transition-all duration-200"
                onClick={() => setActiveSection("reports")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('open_reports')}</p>
                    <p className="text-2xl font-semibold text-card-foreground">3</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </div>

              <div 
                className="bg-card rounded-xl p-6 shadow-sm border border-border cursor-pointer hover:shadow-md hover:border-purple-600/30 transition-all duration-200"
                onClick={() => setActiveSection("notifications")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('notifications')}</p>
                    <p className="text-2xl font-semibold text-card-foreground">12</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <Bell className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <h3 className="font-medium text-card-foreground mb-6">{t('quick_actions')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div 
                  className="group p-6 border border-border rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/30 bg-gradient-to-br from-card to-card/80"
                  onClick={() => setActiveSection("chargingManagement")}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-card-foreground mb-1">{language === 'vi' ? "Quản Lý Charging" : "Charging Management"}</h4>
                      <p className="text-sm text-muted-foreground">{language === 'vi' ? "Quản lý đặt chỗ và phiên sạc" : "Manage bookings and charging sessions"}</p>
                    </div>
                  </div>
                </div>

                <div 
                  className="group p-6 border border-border rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/30 bg-gradient-to-br from-card to-card/80"
                  onClick={() => setActiveSection("billing")}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Receipt className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-card-foreground mb-1">{t("create_invoice") || "Create Invoice"}</h4>
                      <p className="text-sm text-muted-foreground">{t("generate_customer_invoices") || "Generate customer invoices"}</p>
                    </div>
                  </div>
                </div>

                <div 
                  className="group p-6 border border-border rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/30 bg-gradient-to-br from-card to-card/80"
                  onClick={() => setActiveSection("reports")}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-card-foreground mb-1">{t("report_issues") || "Report Issues"}</h4>
                      <p className="text-sm text-muted-foreground">{t("submit_equipment_reports") || "Submit equipment or other reports"}</p>
                    </div>
                  </div>
                </div>

                <div 
                  className="group p-6 border border-border rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/30 bg-gradient-to-br from-card to-card/80"
                  onClick={() => setActiveSection("notifications")}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Bell className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-card-foreground mb-1">{t("notification") || "Notifications"}</h4>
                      <p className="text-sm text-muted-foreground">{t("view_system_alerts") || "View system alerts"}</p>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
            <div className="flex">
                {/* Sidebar */}
                <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-sidebar border-r border-sidebar-border transform ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                } transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0`}>
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between p-4 md:hidden">
                            <span className="font-semibold text-sidebar-foreground">Menu</span>
                            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Station Info Header - Visible on desktop */}
                        <div className="hidden md:block p-4 border-b border-sidebar-border">
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
                                            variant={activeSection === item.id ? "default" : "ghost"}
                                            className={`w-full justify-start ${
                                                activeSection === item.id
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
        </div>
    );
}