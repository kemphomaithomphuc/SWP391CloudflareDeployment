import { useState, useEffect } from "react";
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
  BookOpen
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import { useTheme } from "./contexts/ThemeContext";
import { useLanguage } from "./contexts/LanguageContext";
import ProfileView from "./components/ProfileView";
import VehicleView from "./components/VehicleView";
import SubscriptionView from "./components/SubscriptionView";
import { logoutUser, getUnreadNotificationCount, getNotifications } from "./services/api";
import { toast } from "sonner";

import Footer from "./components/Footer";

interface MainDashboardProps {
  onLogout: () => void;
  onBooking?: () => void;
  onHistory?: () => void;
  onAnalysis?: () => void;
  onReportIssue?: () => void;
  onWallet?: () => void;
  onNotifications?: () => void;
  onMyBookings?: () => void;
  onPremiumSubscription?: () => void;
  vehicleBatteryLevel?: number;
  setVehicleBatteryLevel?: (level: number) => void;
}

export default function MainDashboard({ onLogout, onBooking, onHistory, onAnalysis, onReportIssue, onWallet, onNotifications, onMyBookings, onPremiumSubscription, vehicleBatteryLevel = 75, setVehicleBatteryLevel }: MainDashboardProps) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userFullName, setUserFullName] = useState(localStorage.getItem('fullName') || '');
  const [userAvatar, setUserAvatar] = useState(localStorage.getItem('avatar') || '');
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  // Update user full name and avatar when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setUserFullName(localStorage.getItem('fullName') || '');
      setUserAvatar(localStorage.getItem('avatar') || '');
    };
    
    // Listen for storage changes (works across tabs)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom avatar change events (works within same tab)
    const handleAvatarChange = () => {
      setUserAvatar(localStorage.getItem('avatar') || '');
    };
    
    // Listen for custom profile change events (works within same tab)
    const handleProfileChange = () => {
      setUserFullName(localStorage.getItem('fullName') || '');
      setUserAvatar(localStorage.getItem('avatar') || '');
    };
    
    window.addEventListener('avatarChanged', handleAvatarChange);
    window.addEventListener('profileChanged', handleProfileChange);
    
    // Also check on component mount
    handleStorageChange();
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('avatarChanged', handleAvatarChange);
      window.removeEventListener('profileChanged', handleProfileChange);
    };
  }, []);

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

  // Mock user vehicle data - in real app this would come from backend/context
  const userVehicle = {
    brand: "Tesla",
    model: "Model 3", 
    plateNumber: "30A-12345",
    image: "https://images.unsplash.com/photo-1570169725356-76eff13bee48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZXNsYSUyMG1vZGVsJTIwMyUyMGVsZWN0cmljJTIwY2FyfGVufDF8fHx8MTc1Nzc4MTk4NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  };

  return (
    <div 
      className="min-h-screen bg-background flex relative"
      style={{
        backgroundImage: "url('/images/dashboard-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Background overlay for better text readability */}
      <div 
        className="fixed inset-0 bg-black/20 z-0"
        style={{ backdropFilter: 'blur(1px)' }}
      />
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <div className={`w-64 bg-white/15 border border-white/25 shadow-lg rounded-2xl flex flex-col fixed left-4 top-4 h-[calc(100vh-2rem)] z-40 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Close button for mobile */}
        <div className="flex items-center justify-between p-4 border-b border-white/25 lg:hidden">
          <h3 className="font-medium text-sidebar-foreground">Menu</h3>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <X className="w-5 h-5 text-sidebar-foreground" />
          </button>
        </div>

        <div className="p-6 border-b border-white/25">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              {userAvatar ? (
                <img 
                  src={userAvatar} 
                  alt="Profile Avatar" 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                  {userFullName?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h3 className="font-medium text-sidebar-foreground">
                {userFullName || t('username')}
              </h3>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => {
              setActiveSection("profile");
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

          <div className="pt-4 border-t border-white/25 mt-4 space-y-2">
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

        <div className="p-4 border-t border-white/25">
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
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <div className="bg-white/15 border border-white/25 shadow-lg rounded-2xl p-4 mx-4 mt-4">
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
              
              {/* Budget Button */}
              <button 
                onClick={onWallet}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {t('show_budget')}
              </button>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="flex-1 p-6">
          {activeSection === "dashboard" && (
            <div className="max-w-5xl mx-auto">
              {/* Booking Status - Highlighted */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl p-8 mb-8 border-2 border-primary/30 relative cursor-pointer hover:scale-105 transition-transform duration-200" onClick={onBooking}>
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-primary mb-2">{t('booking_charging')}</h2>
                  <p className="text-primary/80 mb-4">{t('charging_session_ready')}</p>
                  
                  {/* Book Now Button */}
                  <Button 
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onBooking?.();
                    }}
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    {t('booking_charging')}
                  </Button>
                </div>
                
                {/* Popular annotation */}
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium transform rotate-12">
                  {t('popular')}
                </div>
              </div>

              {/* Quick Actions Section */}
              <div className="bg-white/15 border border-white/25 shadow-lg rounded-2xl p-8 mb-8">
                <h3 className="text-2xl font-semibold text-primary mb-6 text-center">{t('quick_actions')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center space-y-2 h-20 border border-white/25 text-primary hover:bg-white/20 bg-white/10 hover:scale-105 transition-all duration-200 rounded-xl"
                    onClick={onMyBookings}
                  >
                    <BookOpen className="w-6 h-6" />
                    <span className="text-sm font-medium">{language === 'vi' ? 'Đặt chỗ của tôi' : 'My Bookings'}</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center space-y-2 h-20 border border-white/25 text-primary hover:bg-white/20 bg-white/10 hover:scale-105 transition-all duration-200 rounded-xl"
                    onClick={onHistory}
                  >
                    <Calendar className="w-6 h-6" />
                    <span className="text-sm font-medium">{t('history')}</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center space-y-2 h-20 border border-white/25 text-primary hover:bg-white/20 bg-white/10 hover:scale-105 transition-all duration-200 rounded-xl"
                    onClick={() => setActiveSection("subscription")}
                  >
                    <CreditCard className="w-6 h-6" />
                    <span className="text-sm font-medium">{t('subscription')}</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center space-y-2 h-20 border border-white/25 text-primary hover:bg-white/20 bg-white/10 hover:scale-105 transition-all duration-200 rounded-xl"
                    onClick={onAnalysis}
                  >
                    <FileText className="w-6 h-6" />
                    <span className="text-sm font-medium">{t('personal_analysis')}</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center space-y-2 h-20 border border-white/25 text-primary hover:bg-white/20 bg-white/10 hover:scale-105 transition-all duration-200 rounded-xl"
                    onClick={onReportIssue}
                  >
                    <AlertTriangle className="w-6 h-6" />
                    <span className="text-sm font-medium">{t('report_issue')}</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {activeSection === "profile" && <ProfileView onBack={() => setActiveSection("dashboard")} />}
          {activeSection === "vehicle" && <VehicleView onBack={() => setActiveSection("dashboard")} />}
          {activeSection === "subscription" && <SubscriptionView onBack={() => setActiveSection("dashboard")} mode="explore" />}
          {activeSection === "check-subscription" && <SubscriptionView onBack={() => setActiveSection("dashboard")} mode="current" />}
        </div>



        {/* Footer - Only show on dashboard */}
        {activeSection === "dashboard" && <Footer />}
      </div>
    </div>
  );
}