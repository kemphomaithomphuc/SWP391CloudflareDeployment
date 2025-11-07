import { useState, useEffect } from "react";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { BookingProvider } from "./contexts/BookingContext";
import { StationProvider } from "./contexts/StationContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { Toaster } from "./components/ui/sonner";
import AppLayout from "./components/AppLayout";
import { Routes, Route, useLocation } from 'react-router-dom'
import axios from "axios";
import { jwtDecode } from "jwt-decode";


// Import components individually to catch any import errors
import Login from "./Login";
import Register from "./Register";  
import ProfileSetup from "./ProfileSetup";
import VehicleSetup from "./VehicleSetup";
import MainDashboard from "./MainDashboard";
import StaffLogin from "./StaffLogin";
import StaffDashboard from "./StaffDashboard";
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
import IssueResolvementView from "./components/IssueResolvementView";
import LanguageThemeControls from "./components/LanguageThemeControls";
import RoleSelection from "./components/RoleSelection";
import StaffProfileSetup from "./components/StaffProfileSetup";
import EducationSetup from "./components/EducationSetup";
import ChargingInvoiceView from "./components/ChargingInvoiceView";
import PostActivatingView from "./components/PostActivatingView";
import MyBookingView from "./components/MyBookingView";
import ChargingSessionView from "./components/ChargingSessionView";
import PremiumSubscriptionView from "./components/PremiumSubscriptionView";
import PaymentResultView from "./components/PaymentResultView";
import { checkAndRefreshToken } from "./services/api";

type ViewType = "login" | "register" | "roleSelection" | "profileSetup" | "vehicleSetup" | "staffProfileSetup" | "educationSetup" | "dashboard" | "staffLogin" | "staffDashboard" | "adminLogin" | "adminDashboard" | "systemConfig" | "adminMap" | "revenue" | "staffManagement" | "usageAnalytics" | "booking" | "history" | "analysis" | "reportIssue" | "wallet" | "notifications" | "staffNotifications" | "postActivating" | "adminChargerPostActivating" | "myBookings" | "chargingSession" | "stationManagement" | "premiumSubscription" | "issueResolvement";

function AppContent() {
  const location = useLocation();
  const [currentView, setCurrentView] = useState<ViewType>("login");
  const [vehicleBatteryLevel, setVehicleBatteryLevel] = useState(75);
  const [currentBookingId, setCurrentBookingId] = useState<string>("");

  const switchToLogin = () => setCurrentView("login");
  const switchToRegister = () => setCurrentView("register");
  const switchToRoleSelection = () => {
    console.log("Switching to roleSelection view");
    setCurrentView("roleSelection");
  };
  const switchToProfileSetup = () => setCurrentView("profileSetup");
  const switchToVehicleSetup = () => setCurrentView("vehicleSetup");
  const switchToStaffProfileSetup = () => setCurrentView("staffProfileSetup");
  const switchToEducationSetup = () => setCurrentView("educationSetup");
  const completeSetup = () => setCurrentView("login");
  const completeStaffSetup = () => setCurrentView("staffDashboard");
  const switchToStaffLogin = () => setCurrentView("staffLogin");
  const completeStaffLogin = () => setCurrentView("staffDashboard");
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
const switchToIssueResolvement = () => setCurrentView("issueResolvement");
  const switchToMyBookings = () => setCurrentView("myBookings");
  const switchToChargingSession = (bookingId: string) => {
    setCurrentBookingId(bookingId);
    setCurrentView("chargingSession");
  };
  const switchToStationManagement = () => setCurrentView("stationManagement");
  const switchToPremiumSubscription = () => setCurrentView("premiumSubscription");

  // Check if user needs vehicle setup after profile completion
  const handleProfileCompletion = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        // Check if user has vehicles
        const userId = localStorage.getItem("userId") || localStorage.getItem("registeredUserId");
        if (userId) {
          const res = await axios.get(`http://localhost:8080/api/user/profile/${userId}`);
          if (res.data && res.data.vehicles && res.data.vehicles.length > 0) {
            // User has vehicles, go to dashboard
            setCurrentView("dashboard");
          } else {
            // User needs vehicle setup
            setCurrentView("vehicleSetup");
          }
        } else {
          // Fallback to vehicle setup
          setCurrentView("vehicleSetup");
        }
      } catch (err) {
        console.error("Error checking user vehicles:", err);
        // Fallback to vehicle setup
        setCurrentView("vehicleSetup");
      }
    } else {
      // For new users, go to vehicle setup
      switchToVehicleSetup();
    }
  };

  // Generic navigation handler for layout
  const handleNavigation = (view: string) => {
    setCurrentView(view as ViewType);
  };

  // Determine user type and whether to show sidebar based on current view
  const getUserType = (): 'driver' | 'staff' | 'admin' | undefined => {
    if (['dashboard', 'booking', 'history', 'analysis', 'reportIssue', 'wallet', 'notifications', 'myBookings', 'chargingSession', 'premiumSubscription'].includes(currentView)) {
      return 'driver';
    }
    if (['staffDashboard', 'staffNotifications', 'postActivating', 'stationManagement'].includes(currentView)) {
      return 'staff';  
    }
    if (['adminDashboard', 'systemConfig', 'adminMap', 'revenue', 'staffManagement', 'usageAnalytics', 'adminChargerPostActivating'].includes(currentView)) {
      return 'admin';
    }
    return undefined;
  };

  const shouldShowSidebar = () => {
    const authViews = ['login', 'register', 'roleSelection', 'profileSetup', 'vehicleSetup', 'staffLogin', 'adminLogin', 'staffProfileSetup', 'educationSetup', 'dashboard', 'staffDashboard'];
    return !authViews.includes(currentView);
  };

  const userType = getUserType();
  const showSidebar = shouldShowSidebar();

  const handleRoleSelection = (role: 'driver' | 'staff') => {
    // Lưu role vào localStorage
    localStorage.setItem("role", role);
    
    if (role === 'driver') {
      switchToProfileSetup();
    } else {
      switchToStaffProfileSetup();
    }
  };
  //Phần này Minh thêm, chạy không được thì comment block hoặc xóa
  useEffect(() => {
    const url = new URL(window.location.href);
    const params = url.searchParams;

    const code = params.get("code");
    const state = params.get("state");

    const source = params.get("source"); // Thêm source parameter
    console.log("OAuth URL params:", { code, state, source});


    // Chạy OAuth flow nếu có token/code trên URL
    // CASE 2: Có code + state từ Google/Facebook → gọi callback đổi token
    if (code && (state === "google" || state === "facebook")) {
      (async () => {
        try {

          const r = await axios.get(
            `http://localhost:8080/api/auth/social/callback?code=${code}&state=${state}`
          );

          const at = r?.data?.data?.accessToken as string | undefined;
          const rt = r?.data?.data?.refreshToken as string | undefined;
          console.log(at, rt);
          if (!at) throw new Error("Missing accessToken from callback");
          const decoded: any = jwtDecode(at);

          localStorage.setItem("token", at);
          if (rt) localStorage.setItem("refreshToken", rt);

          // /me
          try {
            const meRes = await axios.post(
              "http://localhost:8080/api/auth/me",
              null,
              { headers: { Authorization: `Bearer ${at}` } }
            );
            const userId = meRes?.data?.data;
            if (userId != null) {
              localStorage.setItem("userId", String(userId));
              
              // Fetch and store user profile data
              try {
                const profileRes = await axios.get(`http://localhost:8080/api/user/profile/${userId}`);
                if (profileRes.status === 200 && profileRes.data?.data) {
                  const userProfile = profileRes.data.data;
                  if (userProfile.fullName) {
                    localStorage.setItem("fullName", userProfile.fullName);
                    console.log("OAuth: Stored fullName:", userProfile.fullName);
                  }
                  if (userProfile.email) {
                    localStorage.setItem("email", userProfile.email);
                    console.log("OAuth: Stored email:", userProfile.email);
                  }
                }
              } catch (profileErr) {
                console.warn("Cannot fetch user profile:", profileErr);
              }
            }
          } catch (e) {
            console.warn("Cannot fetch /me:", e);
          }
          // Điều hướng vào RoleSelection hoặc dashboard tùy theo source
          if (source === "register") {
            console.log("OAuth success with code/state from register, navigating to roleSelection");
            setCurrentView("roleSelection")
          } else {
            // Từ login, kiểm tra role để điều hướng đúng
            try {
              const decoded: any = jwtDecode(at);
              if (decoded) {
                setCurrentView("dashboard");
              } else {
                setCurrentView("roleSelection");
              }
            } catch (e) {
              console.error("JWT decode failed:", e);
              setCurrentView("login");
            }
          }
        } catch (e) {
          console.error("OAuth callback exchange failed:", e);
          setCurrentView("login");
        }
      })();
    }

  
    // deps rỗng để chỉ chạy 1 lần khi app mount
  }, []);
  //Phần này Minh thêm, chạy không được thì comment block hoặc xóa

  // Token refresh check - runs every 5 minutes
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Check token immediately
    checkAndRefreshToken();

    // Set up interval to check token every 5 minutes
    const interval = setInterval(() => {
      checkAndRefreshToken();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Render current view based on state
  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return <MainDashboard onLogout={switchToLogin} onBooking={switchToBooking} onHistory={switchToHistory} onAnalysis={switchToAnalysis} onReportIssue={switchToReportIssue} onWallet={switchToWallet} onNotifications={switchToNotifications} onMyBookings={switchToMyBookings} onPremiumSubscription={switchToPremiumSubscription} vehicleBatteryLevel={vehicleBatteryLevel} setVehicleBatteryLevel={setVehicleBatteryLevel} />;

      case "booking":
        return <BookingMap onBack={() => setCurrentView("dashboard")} currentBatteryLevel={vehicleBatteryLevel} setCurrentBatteryLevel={setVehicleBatteryLevel} onStartCharging={switchToChargingSession} />;

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
        return <AdminDashboard onLogout={switchToLogin} onSystemConfig={switchToSystemConfig} onAdminMap={switchToAdminMap} onRevenue={switchToRevenue} onStaffManagement={switchToStaffManagement} onUsageAnalytics={switchToUsageAnalytics} onAdminChargerPostActivating={switchToAdminChargerPostActivating} onIssueResolvement={switchToIssueResolvement} />;

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

      case "issueResolvement":
        return <IssueResolvementView onBack={() => setCurrentView("adminDashboard")} />;

      case "postActivating":
        return <PostActivatingView onBack={() => setCurrentView("staffDashboard")} />;

      case "myBookings":
        return <MyBookingView onBack={() => setCurrentView("dashboard")} onStartCharging={switchToChargingSession} />;

      case "chargingSession":
        return <ChargingSessionView onBack={() => setCurrentView("myBookings")} bookingId={currentBookingId} />;


      case "premiumSubscription":
        return <PremiumSubscriptionView onBack={() => setCurrentView("dashboard")} userType="driver" />;



      case "vehicleSetup":
        return (
          <VehicleSetup 
            onNext={completeSetup}
            onBack={() => setCurrentView("profileSetup")}
            onBackToLogin={switchToLogin}
          />
        );

      case "profileSetup":
        return (
          <ProfileSetup 
            onNext={handleProfileCompletion}
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
            onBack={() => setCurrentView("login")}
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
              onStaffLogin={completeStaffLogin}
              onAdminLogin={completeAdminLogin}
              onSwitchToRoleSelection={switchToRoleSelection}
              onSwitchToVehicleSetup={switchToVehicleSetup}
            />
            <LanguageThemeControls />
          </>
        );
    }
  };

  // Sync currentView with URL
  useEffect(() => {
    if (location.pathname === "/home" && currentView !== "dashboard") {
      setCurrentView("dashboard");
    }
  }, [location.pathname]);

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <AppLayout
            userType={userType || "driver"}
            currentView={currentView}
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={showSidebar}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route 
        path="/home" 
        element={
          <AppLayout
            userType={userType || "driver"}
            currentView="dashboard"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={showSidebar}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route 
        path="/payment/result" 
        element={<PaymentResultView />} 
      />
      <Route 
        path="*" 
        element={
          <AppLayout
            userType={userType || "driver"}
            currentView={currentView}
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={showSidebar}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BookingProvider>
          <StationProvider>
            <NotificationProvider>
              <AppContent />
              <Toaster />
            </NotificationProvider>
          </StationProvider>
        </BookingProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}