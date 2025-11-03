import { useState, useEffect } from "react";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { BookingProvider } from "./contexts/BookingContext";
import { StationProvider } from "./contexts/StationContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { Toaster } from "./components/ui/sonner";
import AppLayout from "./components/AppLayout";
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
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
import PenaltyPaymentView from "./components/PenaltyPaymentView";
import { access } from "fs";
import { checkAndRefreshToken } from "./services/api";

type ViewType = "login" | "register" | "roleSelection" | "profileSetup" | "vehicleSetup" | "staffProfileSetup" | "educationSetup" | "dashboard" | "staffLogin" | "staffDashboard" | "staffHome" | "adminLogin" | "adminDashboard" | "systemConfig" | "adminMap" | "revenue" | "staffManagement" | "usageAnalytics" | "booking" | "history" | "analysis" | "reportIssue" | "wallet" | "notifications" | "staffNotifications" | "postActivating" | "adminChargerPostActivating" | "myBookings" | "chargingSession" | "stationManagement" | "premiumSubscription" | "penaltyPayment";

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [vehicleBatteryLevel, setVehicleBatteryLevel] = useState(75);
  const [currentBookingId, setCurrentBookingId] = useState<string>("");

  // Lấy currentView từ URL path
  const getCurrentViewFromPath = (): ViewType => {
    const path = location.pathname.replace('/', '') || 'login';
    return path as ViewType;
  };

  const currentView = getCurrentViewFromPath();

  const switchToLogin = () => navigate('/login');
  const switchToRegister = () => navigate('/register');
  const switchToRoleSelection = () => {
    console.log("Switching to roleSelection view");
    navigate('/roleSelection');
  };
  const switchToProfileSetup = () => navigate('/profileSetup');
  const switchToVehicleSetup = () => navigate('/vehicleSetup');
  const switchToStaffProfileSetup = () => navigate('/staffProfileSetup');
  const switchToEducationSetup = () => navigate('/educationSetup');
  const completeSetup = () => navigate('/login');
  const completeStaffSetup = () => navigate('/staffDashboard');
  const switchToStaffLogin = () => navigate('/staffLogin');
  const completeStaffLogin = () => navigate('/staffDashboard');
  const switchToStaffHome = () => navigate('/staffHome');
  const switchToAdminLogin = () => navigate('/adminLogin');
  const completeAdminLogin = () => navigate('/adminDashboard');
  const switchToBooking = () => navigate('/booking');
  const switchToHistory = () => navigate('/history');
  const switchToAnalysis = () => navigate('/analysis');
  const switchToReportIssue = () => navigate('/reportIssue');
  const switchToWallet = () => navigate('/wallet');
  const switchToNotifications = () => navigate('/notifications');
  const switchToStaffNotifications = () => navigate('/staffNotifications');
  const switchToSystemConfig = () => navigate('/systemConfig');
  const switchToAdminMap = () => navigate('/adminMap');
  const switchToRevenue = () => navigate('/revenue');
  const switchToStaffManagement = () => navigate('/staffManagement');
  const switchToUsageAnalytics = () => navigate('/usageAnalytics');
  const switchToPostActivating = () => navigate('/postActivating');
  const switchToAdminChargerPostActivating = () => navigate('/adminChargerPostActivating');
  const switchToMyBookings = () => navigate('/myBookings');
  const switchToChargingSession = (bookingId: string) => {
    setCurrentBookingId(bookingId);
    navigate('/chargingSession');
  };
  const switchToStationManagement = () => navigate('/stationManagement');
  const switchToPremiumSubscription = () => navigate('/premiumSubscription');

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
            navigate("/dashboard");
          } else {
            // User needs vehicle setup
            navigate("/vehicleSetup");
          }
        } else {
          // Fallback to vehicle setup
          navigate("/vehicleSetup");
        }
      } catch (err) {
        console.error("Error checking user vehicles:", err);
        // Fallback to vehicle setup
        navigate("/vehicleSetup");
      }
    } else {
      // For new users, go to vehicle setup
      switchToVehicleSetup();
    }
  };

  // Generic navigation handler for layout
  const handleNavigation = (view: string) => {
    navigate(`/${view}`);
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


    // Skip OAuth if backend is not available
    const skipOAuth = localStorage.getItem("skipOAuth") === "true";
    if (skipOAuth) {
      console.log("Skipping OAuth due to backend issues");
      return;
    }

    // Temporarily disable OAuth completely
    console.log("OAuth temporarily disabled - backend not available");
    return;

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
            navigate("/roleSelection");
          } else {
            // Từ login, kiểm tra role để điều hướng đúng
            try {
              const decoded: any = jwtDecode(at);
              if (decoded) {
                navigate("/dashboard");
              } else {
                navigate("/roleSelection");
              }
            } catch (e) {
              console.error("JWT decode failed:", e);
              navigate("/login");
            }
          }
        } catch (e) {
          console.error("OAuth callback exchange failed:", e);
          // Set flag to skip OAuth in future
          localStorage.setItem("skipOAuth", "true");
          navigate("/login");
        }
      })();
    }

  
    // deps rỗng để chỉ chạy 1 lần khi app mount
  }, []);
  //Phần này Minh thêm, chạy không được thì comment block hoặc xóa

  // Token refresh check - runs every 2 minutes for 30-minute tokens
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Check token immediately
    checkAndRefreshToken();

    // Set up interval to check token every 2 minutes (for 30-minute tokens)
    const interval = setInterval(() => {
      checkAndRefreshToken();
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, []);

  // Render current view based on URL
  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return <MainDashboard onLogout={switchToLogin} onBooking={switchToBooking} onHistory={switchToHistory} onAnalysis={switchToAnalysis} onReportIssue={switchToReportIssue} onWallet={switchToWallet} onNotifications={switchToNotifications} onMyBookings={switchToMyBookings} onPremiumSubscription={switchToPremiumSubscription} vehicleBatteryLevel={vehicleBatteryLevel} setVehicleBatteryLevel={setVehicleBatteryLevel} />;

      case "booking":
        return <BookingMap onBack={() => navigate("/dashboard")} currentBatteryLevel={vehicleBatteryLevel} setCurrentBatteryLevel={setVehicleBatteryLevel} onStartCharging={switchToChargingSession} onNavigateToBookings={() => navigate("/myBookings")} />;

      case "history":
        return <HistoryView onBack={() => navigate("/dashboard")} />;

      case "analysis":
        return <PersonalAnalysisView onBack={() => navigate("/dashboard")} />;

      case "reportIssue":
        return <ReportIssueView onBack={() => navigate("/dashboard")} />;

      case "wallet":
        return <WalletView onBack={() => navigate("/dashboard")} />;

      case "notifications":
        return <NotificationView onBack={() => navigate("/dashboard")} />;

      case "staffNotifications":
        return <StaffNotificationView onBack={() => navigate("/staffDashboard")} />;

      case "staffDashboard":
        return <StaffDashboard onLogout={switchToLogin} onGoHome={switchToStaffHome} onNotifications={switchToStaffNotifications} onPostActivating={switchToPostActivating} onStationManagement={switchToStationManagement} />;

      case "staffHome":
        return <StaffHomeDashboard onBack={() => navigate("/staffDashboard")} />;

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
        return <SystemConfigView onBack={() => navigate("/adminDashboard")} />;

      case "adminMap":
        return <AdminMapView onBack={() => navigate("/adminDashboard")} />;

      case "revenue":
        return <RevenueView onBack={() => navigate("/adminDashboard")} />;

      case "staffManagement":
        return <StaffManagementView onBack={() => navigate("/adminDashboard")} />;

      case "usageAnalytics":
        return <UsageAnalyticsView onBack={() => navigate("/adminDashboard")} />;

      case "adminChargerPostActivating":
        return <AdminChargerPostActivatingView onBack={() => navigate("/adminDashboard")} />;

      case "postActivating":
        return <PostActivatingView onBack={() => navigate("/staffDashboard")} />;

      case "myBookings":
        return <MyBookingView onBack={() => navigate("/dashboard")} onStartCharging={switchToChargingSession} />;

      case "chargingSession":
        return <ChargingSessionView onBack={() => navigate("/myBookings")} bookingId={currentBookingId} />;

      case "stationManagement":
        return <StationManagementView onBack={() => navigate("/staffDashboard")} />;

      case "premiumSubscription":
        return <PremiumSubscriptionView onBack={() => navigate("/dashboard")} userType="driver" />;

      case "penaltyPayment":
        return <PenaltyPaymentView onBack={() => navigate("/login")} userId={parseInt(localStorage.getItem("userId") || "0")} />;

      case "vehicleSetup":
        return (
          <VehicleSetup 
            onNext={completeSetup}
            onBack={() => navigate("/profileSetup")}
          />
        );

      case "profileSetup":
        return (
          <ProfileSetup 
            onNext={handleProfileCompletion}
            onBack={() => navigate("/roleSelection")}
          />
        );

      case "staffProfileSetup":
        return (
          <StaffProfileSetup 
            onNext={switchToEducationSetup}
            onBack={() => navigate("/roleSelection")}
          />
        );

      case "educationSetup":
        return (
          <EducationSetup 
            onNext={completeStaffSetup}
            onBack={() => navigate("/staffProfileSetup")}
          />
        );

      case "roleSelection":
        return (
          <RoleSelection 
            onSelectRole={handleRoleSelection}
            onBack={() => navigate("/login")}
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
              onLogin={() => navigate("/dashboard")}
              // Redirect staff/admin directly after role detection
              onStaffLogin={() => navigate("/staffDashboard")}
              onAdminLogin={() => navigate("/adminDashboard")}
              onSwitchToRoleSelection={switchToRoleSelection}
              onSwitchToVehicleSetup={switchToVehicleSetup}
            />
            <LanguageThemeControls />
          </>
        );
    }
  };

  const layoutWrapper = (
    <AppLayout
      userType={userType || "driver"}
      currentView={currentView}
      onNavigate={handleNavigation}
      onLogout={switchToLogin}
      showSidebar={showSidebar}
    >
      {renderContent()}
    </AppLayout>
  );

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/" element={layoutWrapper} />
      <Route path="/login" element={layoutWrapper} />
      <Route path="/register" element={layoutWrapper} />
      <Route path="/roleSelection" element={layoutWrapper} />
      <Route path="/staffLogin" element={layoutWrapper} />
      <Route path="/adminLogin" element={layoutWrapper} />
      
      {/* Setup Routes */}
      <Route path="/profileSetup" element={layoutWrapper} />
      <Route path="/vehicleSetup" element={layoutWrapper} />
      <Route path="/staffProfileSetup" element={layoutWrapper} />
      <Route path="/educationSetup" element={layoutWrapper} />
      
      {/* Driver Dashboard Routes */}
      <Route path="/dashboard" element={layoutWrapper} />
      <Route path="/booking" element={layoutWrapper} />
      <Route path="/history" element={layoutWrapper} />
      <Route path="/analysis" element={layoutWrapper} />
      <Route path="/reportIssue" element={layoutWrapper} />
      <Route path="/wallet" element={layoutWrapper} />
      <Route path="/notifications" element={layoutWrapper} />
      <Route path="/myBookings" element={layoutWrapper} />
      <Route path="/chargingSession" element={layoutWrapper} />
      <Route path="/premiumSubscription" element={layoutWrapper} />
      <Route path="/penaltyPayment" element={layoutWrapper} />
      
      {/* Staff Dashboard Routes */}
      <Route path="/staffDashboard" element={layoutWrapper} />
      <Route path="/staffHome" element={layoutWrapper} />
      <Route path="/staffNotifications" element={layoutWrapper} />
      <Route path="/postActivating" element={layoutWrapper} />
      <Route path="/stationManagement" element={layoutWrapper} />
      
      {/* Admin Dashboard Routes */}
      <Route path="/adminDashboard" element={layoutWrapper} />
      <Route path="/systemConfig" element={layoutWrapper} />
      <Route path="/adminMap" element={layoutWrapper} />
      <Route path="/revenue" element={layoutWrapper} />
      <Route path="/staffManagement" element={layoutWrapper} />
      <Route path="/usageAnalytics" element={layoutWrapper} />
      <Route path="/adminChargerPostActivating" element={layoutWrapper} />
      
      {/* Catch all - redirect to login */}
      <Route path="*" element={layoutWrapper} />
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