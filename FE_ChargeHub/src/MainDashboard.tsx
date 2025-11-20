import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  Car, 
  CreditCard, 
  Languages, 
  LogOut, 
  Bell,
  Calendar,
  FileText,
  AlertTriangle,
  Menu,
  X,
  Sun,
  Moon,
  Clock,
  BookOpen,
  Receipt,
  Zap,
  MapPin,
  Battery,
  TrendingUp,
  Star,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import { useTheme } from "./contexts/ThemeContext";
import { useLanguage } from "./contexts/LanguageContext";
import { useChatbot } from "./contexts/ChatbotContext";
import ProfileView from "./components/ProfileView";
import VehicleView from "./components/VehicleView";
import SubscriptionView from "./components/SubscriptionView";
import TransactionHistoryView from "./components/TransactionHistoryView";
import UserStatusBanner from "./components/UserStatusBanner"; // 🆕 Import UserStatusBanner
import { logoutUser, getUnreadNotificationCount, getNotifications } from "./services/api";
import { toast } from "sonner";

import Footer from "./components/Footer";
import Chatbot from "./components/Chatbot";

interface MainDashboardProps {
  onLogout: () => void;
  onBooking?: () => void;
  onReportIssue?: () => void;
  onNotifications?: () => void;
  onMyBookings?: () => void;
  onPremiumSubscription?: () => void;
  vehicleBatteryLevel?: number;
  setVehicleBatteryLevel?: (level: number) => void;
  initialSection?: string;
}

export default function MainDashboard({ onLogout, onBooking, onReportIssue, onNotifications, onMyBookings, onPremiumSubscription, vehicleBatteryLevel = 75, setVehicleBatteryLevel, initialSection = "dashboard" }: MainDashboardProps) {
  const [activeSection, setActiveSection] = useState(initialSection);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { sendAutoMessage } = useChatbot();

  // Sync activeSection with initialSection prop when it changes
  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  // Load notification count on component mount
  useEffect(() => {
    const loadNotificationCount = async () => {
      console.log("=== NOTIFICATION COUNT DEBUG ===");
      console.log("Loading notification count...");
      
      try {
        // Get all notifications and calculate unread count locally
        const notifications = await getNotifications();
        const localCount = notifications.filter(n => !n.isRead).length;
        
        console.log("Total notifications:", notifications.length);
        console.log("Unread count (local calculation):", localCount);
        
        // Also get API count for comparison
        try {
          const apiCount = await getUnreadNotificationCount();
          console.log("API count:", apiCount);
          console.log("Difference:", localCount - apiCount);
        } catch (apiErr) {
          console.log("API count failed, using local calculation");
        }
        
        setUnreadNotificationCount(localCount);
        console.log("Set unreadNotificationCount to:", localCount);
      } catch (error) {
        console.error("=== NOTIFICATION COUNT ERROR ===");
        console.error("Error loading notification count:", error);
        console.error("Error type:", typeof error);
        console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
      }
    };
    
    loadNotificationCount();
  }, []);

  // Handle logout with API call
  const handleLogout = async () => {
    console.log("=== LOGOUT DEBUG START ===");
    console.log("handleLogout called");
    console.log("isLoggingOut:", isLoggingOut);
    
    try {
      setIsLoggingOut(true);
      console.log("Set isLoggingOut to true");
      
      console.log("Calling logoutUser API...");
      const logoutResponse = await logoutUser();
      console.log("Logout API response:", logoutResponse);
      
      console.log("Clearing localStorage...");
      console.log("Before clear - token:", localStorage.getItem("token"));
      console.log("Before clear - userId:", localStorage.getItem("userId"));
      console.log("Before clear - fullName:", localStorage.getItem("fullName"));
      console.log("Before clear - email:", localStorage.getItem("email"));
      console.log("Before clear - role:", localStorage.getItem("role"));
      console.log("Before clear - registeredUserId:", localStorage.getItem("registeredUserId"));
      
      // Clear local storage
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("fullName");
      localStorage.removeItem("email");
      localStorage.removeItem("role");
      localStorage.removeItem("registeredUserId");
      localStorage.removeItem("refreshToken");
      
      console.log("After clear - token:", localStorage.getItem("token"));
      console.log("After clear - userId:", localStorage.getItem("userId"));
      console.log("After clear - fullName:", localStorage.getItem("fullName"));
      console.log("After clear - email:", localStorage.getItem("email"));
      console.log("After clear - role:", localStorage.getItem("role"));
      console.log("After clear - registeredUserId:", localStorage.getItem("registeredUserId"));
      
      console.log("Showing success toast...");
      toast.success(t("Logout successful"));
      
      console.log("Calling onLogout callback...");
      onLogout();
      console.log("onLogout callback completed");
      
    } catch (error) {
      console.error("=== LOGOUT ERROR ===");
      console.error("Logout error:", error);
      console.error("Error type:", typeof error);
      console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
      console.error("Error response:", error instanceof Error && 'response' in error ? (error as any).response : "No response");
      console.error("Error status:", error instanceof Error && 'response' in error ? (error as any).response?.status : "No status");
      
      toast.error(t("Logout failed"));
    } finally {
      console.log("Setting isLoggingOut to false");
      setIsLoggingOut(false);
      console.log("=== LOGOUT DEBUG END ===");
    }
  };

  return (
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
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <X className="w-5 h-5 text-sidebar-foreground" />
          </button>
        </div>

        {/* Close button for desktop */}
        <div className="hidden lg:flex items-center justify-end p-4 border-b border-sidebar-border">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
            title="Close sidebar"
          >
            <X className="w-5 h-5 text-sidebar-foreground" />
          </button>
        </div>

        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                {localStorage.getItem("fullName")?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sidebar-foreground truncate">
                {localStorage.getItem("fullName") || t('username')}
              </h3>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {localStorage.getItem("email") || ""}
              </p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">
                {localStorage.getItem("role") || "user"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => {
              setActiveSection("profile");
              navigate("/profile");
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
              activeSection === "profile" ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
          >
            <User className="w-5 h-5" />
            <span>{t('profile')}</span>
          </button>

          <button
            onClick={() => {
              setActiveSection("vehicle");
              navigate("/vehicle");
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
              activeSection === "vehicle" ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
          >
            <Car className="w-5 h-5" />
            <span>{t('vehicle_details')}</span>
          </button>

          <button
            onClick={() => {
              if (onPremiumSubscription) {
                onPremiumSubscription();
                setSidebarOpen(false);
              }
            }}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <CreditCard className="w-5 h-5" />
            <span>{language === 'vi' ? 'Gói Premium' : 'Premium Plan'}</span>
          </button>

          <button
            onClick={() => {
              setActiveSection("transaction-history");
              navigate("/transaction-history");
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
              activeSection === "transaction-history" ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
          >
            <Receipt className="w-5 h-5" />
            <span>{t('transaction_history')}</span>
          </button>

          <div className="pt-4 border-t border-sidebar-border mt-4 space-y-2">
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {t('language')}:
            </div>
            <button 
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              onClick={() => {
                setLanguage(language === 'en' ? 'vi' : 'en');
                setSidebarOpen(false);
              }}
            >
              <Languages className="w-5 h-5" />
              <span>{language === 'en' ? 'English' : 'Tiếng Việt'}</span>
            </button>

            <div className="px-3 py-2 text-sm text-muted-foreground">
              {t('theme')}:
            </div>
            <button 
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              onClick={() => {
                toggleTheme();
                setSidebarOpen(false);
              }}
            >
              {theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span>{theme === 'light' ? t('light_mode') : t('dark_mode')}</span>
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={() => {
              console.log("=== LOGOUT BUTTON CLICKED ===");
              console.log("Logout button clicked");
              console.log("isLoggingOut:", isLoggingOut);
              console.log("Calling handleLogout...");
              handleLogout();
              console.log("Closing sidebar...");
              setSidebarOpen(false);
            }}
            disabled={isLoggingOut}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-5 h-5" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>



      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-card shadow-sm border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Hamburger Menu Button */}
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg bg-muted hover:bg-accent transition-colors"
              >
                <Menu className="w-5 h-5 text-muted-foreground" />
              </button>
              
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="font-bold text-primary-foreground text-sm">C</span>
                </div>
                <h1 className="font-semibold text-foreground">ChargeHub</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notification Button */}
              <button 
                onClick={onNotifications}
                className="p-2 rounded-lg bg-muted hover:bg-accent transition-colors relative"
              >
                <Bell className="w-5 h-5 text-muted-foreground" />
                {/* Notification badge - real unread count */}
                {unreadNotificationCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-xs text-white font-medium">
                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                  </div>
                )}
              </button>
              <span className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={onNotifications}>{t('notification')}</span>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="flex-1 p-6">
          {activeSection === "dashboard" && (
            <div className="max-w-7xl mx-auto">
              {/* 🆕 User Status Banner */}
              <UserStatusBanner userId={parseInt(localStorage.getItem("userId") || "0")} />
              
              {/* Hero Section with Background Video */}
              <div className="relative mb-16 overflow-hidden rounded-3xl h-[600px]">
                {/* Background Video */}
                <div className="absolute inset-0">
                  <video
                    className="w-full h-full object-cover"
                    src="https://digitalassets.tesla.com/tesla-contents/video/upload/f_auto,q_auto:best/Charging-Hero-Desktop.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-transparent" />
                </div>
                
                {/* Floating elements for visual interest */}
                <div className="absolute inset-0">
                  <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-40 right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
                  <div className="absolute top-60 right-10 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
                </div>
                
                {/* Content */}
                <div className="relative z-10 p-8 md:p-16 h-full flex items-center">
                  <div className="max-w-2xl">
                    <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
                      {language === 'vi' ? 'Sạc xe điện' : 'EV Charging'}
                      <span className="block text-primary mt-2 drop-shadow-lg">
                        {language === 'vi' ? 'thông minh - Nhanh chóng - Tiện lợi' : 'Smart - Fast - Convenient'}
                      </span>
                    </h1>
                    <p className="text-lg text-white mb-8 max-w-xl leading-relaxed">
                      {language === 'vi' 
                        ? 'Tìm và đặt trạm sạc gần nhất với giá cả hợp lý. Hơn 1000 trạm sạc trên toàn quốc sẵn sàng phục vụ bạn 24/7.'
                        : 'Find and book the nearest charging stations with affordable prices. Over 1000 charging stations nationwide ready to serve you 24/7.'
                      }
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button 
                        size="lg"
                        className="bg-primary hover:bg-primary/90 text-white px-10 py-7 text-lg font-semibold shadow-2xl hover:shadow-primary/50 hover:scale-105 transition-all duration-300"
                        onClick={onBooking}
                      >
                        <Zap className="w-6 h-6 mr-2" />
                        {language === 'vi' ? 'Đặt sạc ngay' : 'Book Now'}
                      </Button>
                      
                      <Button 
                        variant="secondary"
                        size="lg"
                        className="px-10 py-7 text-lg font-semibold bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-2 border-white/30 hover:border-white/50 transition-all duration-300"
                        onClick={() => {
                          const message = language === 'vi' ? 'tìm trạm gần vị trí của tôi' : 'find stations near my location';
                          sendAutoMessage(message);
                        }}
                      >
                        <MapPin className="w-5 h-5 mr-2" />
                        {language === 'vi' ? 'Tìm trạm gần' : 'Find Stations'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Cards - Simple Design
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                <div className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow text-center">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-foreground mb-2">0.8 km</p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'vi' ? 'Trạm gần nhất' : 'Nearest Station'}
                  </p>
                </div>

                <div className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow text-center">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-foreground mb-2">₫2,500</p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'vi' ? 'Giá mỗi kWh' : 'Price per kWh'}
                  </p>
                </div>

                <div className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow text-center">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-foreground mb-2">4.8</p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'vi' ? 'Đánh giá trung bình' : 'Average Rating'}
                  </p>
                </div>
              </div> */}

              {/* Quick Actions - Simplified */}
              <div className="mb-16 mt-12">
                <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                  {language === 'vi' ? 'Dịch vụ của chúng tôi' : 'Our Services'}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div 
                    className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer w-full"
                    onClick={onMyBookings}
                  >
                    <BookOpen className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">
                      {language === 'vi' ? 'Đặt chỗ của tôi' : 'My Bookings'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'vi' ? 'Quản lý lịch sử đặt chỗ' : 'Manage booking history'}
                    </p>
                  </div>

                  <div 
                    className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer w-full"
                    onClick={() => {
                      setActiveSection("transaction-history");
                      navigate("/transaction-history");
                    }}
                  >
                    <Receipt className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">
                      {language === 'vi' ? 'Lịch sử giao dịch' : 'Transaction History'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'vi' ? 'Xem chi tiết thanh toán' : 'View payment details'}
                    </p>
                  </div>

                  <div 
                    className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer w-full"
                    onClick={onPremiumSubscription}
                  >
                    <CreditCard className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">
                      {language === 'vi' ? 'Gói Premium' : 'Premium Plan'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'vi' ? 'Nâng cấp dịch vụ' : 'Upgrade service'}
                    </p>
                  </div>

                  <div 
                    className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer w-full"
                    onClick={onReportIssue}
                  >
                    <AlertTriangle className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">
                      {language === 'vi' ? 'Báo cáo sự cố' : 'Report Issue'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'vi' ? 'Hỗ trợ khách hàng' : 'Customer support'}
                    </p>
                  </div>
              </div>
            </div>
            </div>
          )}
          {activeSection === "profile" && <ProfileView onBack={() => { setActiveSection("dashboard"); navigate("/dashboard"); }} />}
          {activeSection === "vehicle" && <VehicleView onBack={() => { setActiveSection("dashboard"); navigate("/dashboard"); }} />}
          {activeSection === "transaction-history" && <TransactionHistoryView onBack={() => { setActiveSection("dashboard"); navigate("/dashboard"); }} />}
          {activeSection === "subscription" && <SubscriptionView onBack={() => { setActiveSection("dashboard"); navigate("/dashboard"); }} mode="explore" />}
          {activeSection === "check-subscription" && <SubscriptionView onBack={() => { setActiveSection("dashboard"); navigate("/dashboard"); }} mode="current" />}
        </div>



        {/* Footer - Only show on dashboard */}
        {activeSection === "dashboard" && <Footer />}
      </div>

      {/* Chat Widget */}
      <Chatbot />
    </div>
  );
}