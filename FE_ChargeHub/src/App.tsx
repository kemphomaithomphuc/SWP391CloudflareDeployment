import { useState } from "react";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { BookingProvider } from "./contexts/BookingContext";
import { StationProvider } from "./contexts/StationContext";
import { Toaster } from "./components/ui/sonner";
import AppLayout from "./components/AppLayout";

// Import components individually to catch any import errors
import Login from "./Login";
import Register from "./Register";  
import ProfileSetup from "./ProfileSetup";
import VehicleSetup from "./VehicleSetup";
import MainDashboard from "./MainDashboard";
import StaffLogin from "./StaffLogin";
import StaffDashboard from "./StaffDashboard";
import StaffHomeDashboard from "./StaffHomeDashboard";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import BookingMap from "./BookingMap";
import HistoryView from "./components/HistoryView";
import PersonalAnalysisView from "./components/PersonalAnalysisView";
import ReportIssueView from "./components/ReportIssueView";
import WalletView from "./components/WalletView";
import NotificationView from "./components/NotificationView";
import StaffNotificationView from "./components/StaffNotificationView";
import SystemConfigView from "./components/SystemConfigView";
import AdminMapView from "./components/AdminMapView";
import RevenueView from "./components/RevenueView";
import StaffManagementView from "./components/StaffManagementView";
import UsageAnalyticsView from "./components/UsageAnalyticsView";
import AdminChargerPostActivatingView from "./components/AdminChargerPostActivatingView";
import LanguageThemeControls from "./components/LanguageThemeControls";
import RoleSelection from "./components/RoleSelection";
import StaffProfileSetup from "./components/StaffProfileSetup";
import EducationSetup from "./components/EducationSetup";
import ChargingInvoiceView from "./components/ChargingInvoiceView";
import PostActivatingView from "./components/PostActivatingView";
import MyBookingView from "./components/MyBookingView";
import ChargingSessionView from "./components/ChargingSessionView";
import StationManagementView from "./components/StationManagementView";
import PremiumSubscriptionView from "./components/PremiumSubscriptionView";

type ViewType = "login" | "register" | "roleSelection" | "profileSetup" | "vehicleSetup" | "staffProfileSetup" | "educationSetup" | "dashboard" | "staffLogin" | "staffDashboard" | "staffHome" | "adminLogin" | "adminDashboard" | "systemConfig" | "adminMap" | "revenue" | "staffManagement" | "usageAnalytics" | "booking" | "history" | "analysis" | "reportIssue" | "wallet" | "notifications" | "staffNotifications" | "postActivating" | "adminChargerPostActivating" | "myBookings" | "chargingSession" | "stationManagement" | "premiumSubscription";

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewType>("login");
  const [vehicleBatteryLevel, setVehicleBatteryLevel] = useState(75);
  const [currentBookingId, setCurrentBookingId] = useState<string>("");

  const switchToLogin = () => setCurrentView("login");
  const switchToRegister = () => setCurrentView("register");
  const switchToRoleSelection = () => setCurrentView("roleSelection");
  const switchToProfileSetup = () => setCurrentView("profileSetup");
  const switchToVehicleSetup = () => setCurrentView("vehicleSetup");
  const switchToStaffProfileSetup = () => setCurrentView("staffProfileSetup");
  const switchToEducationSetup = () => setCurrentView("educationSetup");
  const completeSetup = () => setCurrentView("dashboard");
  const completeStaffSetup = () => setCurrentView("staffDashboard");
  const switchToStaffLogin = () => setCurrentView("staffLogin");
  const completeStaffLogin = () => setCurrentView("staffDashboard");
  const switchToStaffHome = () => setCurrentView("staffHome");
  const switchToAdminLogin = () => setCurrentView("adminLogin");
  const completeAdminLogin = () => setCurrentView("adminDashboard");
  const switchToBooking = () => setCurrentView("booking");
  const switchToHistory = () => setCurrentView("history");
  const switchToAnalysis = () => setCurrentView("analysis");
  const switchToReportIssue = () => setCurrentView("reportIssue");
  const switchToWallet = () => setCurrentView("wallet");
  const switchToNotifications = () => setCurrentView("notifications");
  const switchToStaffNotifications = () => setCurrentView("staffNotifications");
  const switchToSystemConfig = () => setCurrentView("systemConfig");
  const switchToAdminMap = () => setCurrentView("adminMap");
  const switchToRevenue = () => setCurrentView("revenue");
  const switchToStaffManagement = () => setCurrentView("staffManagement");
  const switchToUsageAnalytics = () => setCurrentView("usageAnalytics");
  const switchToPostActivating = () => setCurrentView("postActivating");
  const switchToAdminChargerPostActivating = () => setCurrentView("adminChargerPostActivating");
  const switchToMyBookings = () => setCurrentView("myBookings");
  const switchToChargingSession = (bookingId: string) => {
    setCurrentBookingId(bookingId);
    setCurrentView("chargingSession");
  };
  const switchToStationManagement = () => setCurrentView("stationManagement");
  const switchToPremiumSubscription = () => setCurrentView("premiumSubscription");


  // Generic navigation handler for layout
  const handleNavigation = (view: string) => {
    setCurrentView(view as ViewType);
  };

  // Determine user type and whether to show sidebar based on current view
  const getUserType = (): 'driver' | 'staff' | 'admin' | undefined => {
    if (['dashboard', 'booking', 'history', 'analysis', 'reportIssue', 'wallet', 'notifications', 'myBookings', 'chargingSession', 'premiumSubscription'].includes(currentView)) {
      return 'driver';
    }
    if (['staffDashboard', 'staffHome', 'staffNotifications', 'postActivating', 'stationManagement'].includes(currentView)) {
      return 'staff';  
    }
    if (['adminDashboard', 'systemConfig', 'adminMap', 'revenue', 'staffManagement', 'usageAnalytics', 'adminChargerPostActivating'].includes(currentView)) {
      return 'admin';
    }
    return undefined;
  };

  const shouldShowSidebar = () => {
    const authViews = ['login', 'register', 'roleSelection', 'profileSetup', 'vehicleSetup', 'staffLogin', 'adminLogin', 'staffProfileSetup', 'educationSetup', 'dashboard', 'staffDashboard', 'staffHome'];
    return !authViews.includes(currentView);
  };

  const userType = getUserType();
  const showSidebar = shouldShowSidebar();

  const handleRoleSelection = (role: 'driver' | 'staff') => {
    if (role === 'driver') {
      switchToProfileSetup();
    } else {
      switchToStaffProfileSetup();
    }
  };

  // Render current view based on state
  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return <MainDashboard onLogout={switchToLogin} onBooking={switchToBooking} onHistory={switchToHistory} onAnalysis={switchToAnalysis} onReportIssue={switchToReportIssue} onWallet={switchToWallet} onNotifications={switchToNotifications} onMyBookings={switchToMyBookings} onPremiumSubscription={switchToPremiumSubscription} vehicleBatteryLevel={vehicleBatteryLevel} setVehicleBatteryLevel={setVehicleBatteryLevel} />;

      case "booking":
        return <BookingMap onBack={() => setCurrentView("dashboard")} currentBatteryLevel={vehicleBatteryLevel} setCurrentBatteryLevel={setVehicleBatteryLevel} />;

      case "history":
        return <HistoryView onBack={() => setCurrentView("dashboard")} />;

      case "analysis":
        return <PersonalAnalysisView onBack={() => setCurrentView("dashboard")} />;

      case "reportIssue":
        return <ReportIssueView onBack={() => setCurrentView("dashboard")} />;

      case "wallet":
        return <WalletView onBack={() => setCurrentView("dashboard")} />;

      case "notifications":
        return <NotificationView onBack={() => setCurrentView("dashboard")} />;

      case "staffNotifications":
        return <StaffNotificationView onBack={() => setCurrentView("staffDashboard")} />;

      case "staffDashboard":
        return <StaffDashboard onLogout={switchToLogin} onGoHome={switchToStaffHome} onNotifications={switchToStaffNotifications} onPostActivating={switchToPostActivating} onStationManagement={switchToStationManagement} />;

      case "staffHome":
        return <StaffHomeDashboard onBack={() => setCurrentView("staffDashboard")} />;

      case "staffLogin":
        return (
          <StaffLogin 
            onLogin={completeStaffLogin}
            onBack={switchToLogin}
          />
        );

      case "adminLogin":
        return (
          <AdminLogin 
            onLogin={completeAdminLogin}
            onBack={switchToLogin}
          />
        );

      case "adminDashboard":
        return <AdminDashboard onLogout={switchToLogin} onSystemConfig={switchToSystemConfig} onAdminMap={switchToAdminMap} onRevenue={switchToRevenue} onStaffManagement={switchToStaffManagement} onUsageAnalytics={switchToUsageAnalytics} onAdminChargerPostActivating={switchToAdminChargerPostActivating} />;

      case "systemConfig":
        return <SystemConfigView onBack={() => setCurrentView("adminDashboard")} />;

      case "adminMap":
        return <AdminMapView onBack={() => setCurrentView("adminDashboard")} />;

      case "revenue":
        return <RevenueView onBack={() => setCurrentView("adminDashboard")} />;

      case "staffManagement":
        return <StaffManagementView onBack={() => setCurrentView("adminDashboard")} />;

      case "usageAnalytics":
        return <UsageAnalyticsView onBack={() => setCurrentView("adminDashboard")} />;

      case "adminChargerPostActivating":
        return <AdminChargerPostActivatingView onBack={() => setCurrentView("adminDashboard")} />;

      case "postActivating":
        return <PostActivatingView onBack={() => setCurrentView("staffDashboard")} />;

      case "myBookings":
        return <MyBookingView onBack={() => setCurrentView("dashboard")} onStartCharging={switchToChargingSession} />;

      case "chargingSession":
        return <ChargingSessionView onBack={() => setCurrentView("myBookings")} bookingId={currentBookingId} />;

      case "stationManagement":
        return <StationManagementView onBack={() => setCurrentView("staffDashboard")} />;

      case "premiumSubscription":
        return <PremiumSubscriptionView onBack={() => setCurrentView("dashboard")} userType="driver" />;



      case "vehicleSetup":
        return (
          <VehicleSetup 
            onNext={completeSetup}
            onBack={() => setCurrentView("profileSetup")}
          />
        );

      case "profileSetup":
        return (
          <ProfileSetup 
            onNext={switchToVehicleSetup}
            onBack={() => setCurrentView("roleSelection")}
          />
        );

      case "staffProfileSetup":
        return (
          <StaffProfileSetup 
            onNext={switchToEducationSetup}
            onBack={() => setCurrentView("roleSelection")}
          />
        );

      case "educationSetup":
        return (
          <EducationSetup 
            onNext={completeStaffSetup}
            onBack={() => setCurrentView("staffProfileSetup")}
          />
        );

      case "roleSelection":
        return (
          <RoleSelection 
            onSelectRole={handleRoleSelection}
            onBack={() => setCurrentView("register")}
          />
        );

      case "register":
        return (
          <Register 
            onSwitchToLogin={switchToLogin}
            onSwitchToRoleSelection={switchToRoleSelection}
          />
        );

      default:
        return (
          <>
            <Login 
              onSwitchToRegister={switchToRegister} 
              onLogin={() => setCurrentView("dashboard")}
              onStaffLogin={switchToStaffLogin}
              onAdminLogin={switchToAdminLogin}
            />
            <LanguageThemeControls />
          </>
        );
    }
  };

  return (
    <AppLayout
      userType={userType}
      currentView={currentView}
      onNavigate={handleNavigation}
      onLogout={switchToLogin}
      showSidebar={showSidebar}
    >
      {renderContent()}
    </AppLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BookingProvider>
          <StationProvider>
            <AppContent />
            <Toaster />
          </StationProvider>
        </BookingProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}