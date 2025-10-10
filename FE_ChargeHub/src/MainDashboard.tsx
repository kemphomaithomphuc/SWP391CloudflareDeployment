import { useState } from "react";
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
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  // Mock user vehicle data - in real app this would come from backend/context
  const userVehicle = {
    brand: "Tesla",
    model: "Model 3", 
    plateNumber: "30A-12345",
    image: "https://images.unsplash.com/photo-1570169725356-76eff13bee48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZXNsYSUyMG1vZGVsJTIwMyUyMGVsZWN0cmljJTIwY2FyfGVufDF8fHx8MTc1Nzc4MTk4NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
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

        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                JD
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-sidebar-foreground">{t('username')}</h3>
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
              onLogout();
              setSidebarOpen(false);
            }}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-destructive hover:bg-destructive/10 transition-colors"
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
                {/* Notification badge - mock unread count */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
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
              {/* Logo Section */}
              <div className="mb-6">
                <div className="text-center">
                  <h2 className="font-medium text-muted-foreground">{t('logo')}</h2>
                </div>
              </div>

              {/* Vehicle Status */}
              <div className="mb-8">
                <div className="max-w-md mx-auto">
                  {/* Vehicle Model Card */}
                  <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                    <div className="text-center">
                      <h3 className="font-medium text-card-foreground mb-4">{t('show_model')}</h3>
                      
                      {/* Vehicle Image */}
                      <div className="w-32 h-20 mx-auto mb-4 rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={userVehicle.image}
                          alt={`${userVehicle.brand} ${userVehicle.model}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Vehicle Info */}
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <Car className="w-5 h-5 text-primary" />
                        <span className="text-xl font-semibold text-card-foreground">
                          {userVehicle.brand} {userVehicle.model}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{userVehicle.plateNumber}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Status - Highlighted */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl p-8 mb-8 border-2 border-primary/30 relative cursor-pointer hover:scale-105 transition-transform duration-200" onClick={onBooking}>
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-primary mb-2">{t('booking_charging')}</h2>
                  <p className="text-primary/80 mb-4">{t('charging_session_ready')}</p>
                  
                  {/* Book Now Button */}
                  <Button 
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                    onClick={(e) => {
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
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border mb-8">
                <h3 className="text-lg font-semibold text-card-foreground mb-4 text-center">{t('quick_actions')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center space-y-2 h-20 border-primary/30 text-primary hover:bg-primary/10"
                    onClick={onMyBookings}
                  >
                    <BookOpen className="w-6 h-6" />
                    <span className="text-sm">{language === 'vi' ? 'Đặt chỗ của tôi' : 'My Bookings'}</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center space-y-2 h-20 border-primary/30 text-primary hover:bg-primary/10"
                    onClick={onHistory}
                  >
                    <Calendar className="w-6 h-6" />
                    <span className="text-sm">{t('history')}</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center space-y-2 h-20 border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => setActiveSection("subscription")}
                  >
                    <CreditCard className="w-6 h-6" />
                    <span className="text-sm">{t('subscription')}</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center space-y-2 h-20 border-primary/30 text-primary hover:bg-primary/10"
                    onClick={onAnalysis}
                  >
                    <FileText className="w-6 h-6" />
                    <span className="text-sm">{t('personal_analysis')}</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center space-y-2 h-20 border-primary/30 text-primary hover:bg-primary/10"
                    onClick={onReportIssue}
                  >
                    <AlertTriangle className="w-6 h-6" />
                    <span className="text-sm">{t('report_issue')}</span>
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