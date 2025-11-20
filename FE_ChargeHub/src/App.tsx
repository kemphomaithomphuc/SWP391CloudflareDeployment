import { useState, useEffect } from "react";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { BookingProvider } from "./contexts/BookingContext";
import { StationProvider } from "./contexts/StationContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { Toaster } from "./components/ui/sonner";
import AppLayout from "./components/AppLayout";
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'


// Import components individually to catch any import errors
import Login from "./Login";
import Register from "./Register";  
import ProfileSetup from "./ProfileSetup";
import VehicleSetup from "./VehicleSetup";
import MainDashboard from "./MainDashboard";
import StaffLogin from "./StaffLogin";
import StaffDashboard from "./StaffDashboard";
import StaffNotificationView from "./components/StaffNotificationView";
import StaffReportView from "./components/StaffReportView";
import ChargingManagementView from "./components/ChargingManagementView";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import BookingMap from "./BookingMap";
import HistoryView from "./components/HistoryView";
import PersonalAnalysisView from "./components/PersonalAnalysisView";
import ReportIssueView from "./components/ReportIssueView";
import NotificationView from "./components/NotificationView";
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
import MyBookingView from "./components/MyBookingView";
import ChargingSessionView from "./components/ChargingSessionView";
import PremiumSubscriptionView from "./components/PremiumSubscriptionView";
import PaymentResultView from "./components/PaymentResultView";
import { ChatbotProvider } from "./contexts/ChatbotContext";
import { checkAndRefreshToken, logoutUser, api } from "./services/api";
import PenaltyPayment from "./PenaltyPayment";
import PayUnpaid from "./payUnpaid";
import ParkingView from "./components/ParkingView";
import { ParkingSessionSummary } from "./types/parking";

type ViewType =
  | "login"
  | "register"
  | "roleSelection"
  | "profileSetup"
  | "vehicleSetup"
  | "staffProfileSetup"
  | "educationSetup"
  | "dashboard"
  | "staffLogin"
  | "staffDashboard"
  | "staffReports"
  | "adminLogin"
  | "adminDashboard"
  | "systemConfig"
  | "adminMap"
  | "revenue"
  | "staffManagement"
  | "usageAnalytics"
  | "booking"
  | "history"
  | "analysis"
  | "reportIssue"
  | "notifications"
  | "staffNotifications"
  | "adminChargerPostActivating"
  | "myBookings"
  | "chargingSession"
  | "premiumSubscription"
  | "issueResolvement"
  | "penaltyPayment"
  | "payUnpaid"
  | "chargingManagement"
  | "parking";

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState<ViewType>("login");
  const [vehicleBatteryLevel, setVehicleBatteryLevel] = useState(75);
  const [currentBookingId, setCurrentBookingId] = useState<string>("");
  const [parkingSummary, setParkingSummary] = useState<ParkingSessionSummary | null>(() => {
    try {
      const stored = localStorage.getItem("parkingSessionSummary");
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Failed to parse parking summary:", error);
      return null;
    }
  });

  const switchToLogin = () => {
    setCurrentView("login");
    navigate("/login");
  };
  const switchToRegister = () => {
    setCurrentView("register");
    navigate("/register");
  };
  const switchToRoleSelection = () => {
    console.log("Switching to roleSelection view");
    setCurrentView("roleSelection");
    navigate("/role-selection");
  };
  const switchToProfileSetup = () => {
    setCurrentView("profileSetup");
    navigate("/profile-setup");
  };
  const switchToVehicleSetup = () => {
    setCurrentView("vehicleSetup");
    navigate("/vehicle-setup");
  };
  const switchToStaffProfileSetup = () => {
    setCurrentView("staffProfileSetup");
    navigate("/staff-profile-setup");
  };
  const switchToEducationSetup = () => {
    setCurrentView("educationSetup");
    navigate("/education-setup");
  };
  const completeSetup = () => {
    setCurrentView("login");
    navigate("/login");
  };
  const completeStaffSetup = () => {
    setCurrentView("staffDashboard");
    navigate("/staff/dashboard");
  };
  const switchToStaffLogin = () => {
    setCurrentView("staffLogin");
    navigate("/staff/login");
  };
  const completeStaffLogin = () => {
    setCurrentView("staffDashboard");
    navigate("/staff/dashboard");
  };
  const switchToStaffReports = () => {
    setCurrentView("staffReports");
    navigate("/staff/reports");
  };
  const switchToAdminLogin = () => {
    setCurrentView("adminLogin");
    navigate("/admin/login");
  };
  const completeAdminLogin = () => {
    setCurrentView("adminDashboard");
    navigate("/admin/dashboard");
  };
  const switchToBooking = () => {
    setCurrentView("booking");
    navigate("/booking");
  };
  const switchToHistory = () => {
    setCurrentView("history");
    navigate("/history");
  };
  const switchToAnalysis = () => {
    setCurrentView("analysis");
    navigate("/analysis");
  };
  const switchToReportIssue = () => {
    setCurrentView("reportIssue");
    navigate("/report-issue");
  };
  const switchToNotifications = () => {
    setCurrentView("notifications");
    navigate("/notifications");
  };
  const switchToStaffNotifications = () => {
    setCurrentView("staffNotifications");
    navigate("/staff/notifications");
  };
  const switchToSystemConfig = () => {
    setCurrentView("systemConfig");
    navigate("/admin/system-config");
  };
  const switchToAdminMap = () => {
    setCurrentView("adminMap");
    navigate("/admin/map");
  };
  const switchToRevenue = () => {
    setCurrentView("revenue");
    navigate("/admin/revenue");
  };
  const switchToStaffManagement = () => {
    setCurrentView("staffManagement");
    navigate("/admin/staff-management");
  };
  const switchToUsageAnalytics = () => {
    setCurrentView("usageAnalytics");
    navigate("/admin/usage-analytics");
  };
  const switchToChargingManagement = () => {
    setCurrentView("chargingManagement");
    navigate("/staff/charging-management");
  };
  const switchToAdminChargerPostActivating = () => {
    setCurrentView("adminChargerPostActivating");
    navigate("/admin/charger-post-activating");
  };
  const switchToIssueResolvement = () => {
    setCurrentView("issueResolvement");
    navigate("/admin/issue-resolvement");
  };
  const switchToMyBookings = () => {
    setCurrentView("myBookings");
    navigate("/my-bookings");
  };
  const switchToChargingSession = (bookingId: string) => {
    setCurrentBookingId(bookingId);
    setCurrentView("chargingSession");
    navigate(`/charging-session/${bookingId}`);
  };
  const switchToParking = () => {
    setCurrentView("parking");
    // Use replace: true to avoid creating new history entry and prevent page reload
    navigate("/parking", { replace: true });
  };
  const switchToPremiumSubscription = () => {
    setCurrentView("premiumSubscription");
    navigate("/premium-subscription");
  };
  const switchToPenaltyPayment = () => {
    setCurrentView("penaltyPayment");
    navigate("/penalty-payment");
  };

  const clearAuthStorage = () => {
    const keysToRemove = [
      "token",
      "userId",
      "fullName",
      "email",
      "role",
      "registeredUserId",
      "refreshToken",
      "stationId"
    ];

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  };

  const handleAdminLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Admin logout error:", error);
    } finally {
      clearAuthStorage();
      setCurrentView("login");
      navigate("/login");
    }
  };

  useEffect(() => {
    if (parkingSummary) {
      try {
        localStorage.setItem("parkingSessionSummary", JSON.stringify(parkingSummary));
      } catch (error) {
        console.error("Failed to persist parking summary:", error);
      }
    } else {
      localStorage.removeItem("parkingSessionSummary");
    }
  }, [parkingSummary]);

  const handleParkingStart = (summary: ParkingSessionSummary) => {
    setParkingSummary(summary);
    switchToParking();
  };

  const handleParkingSessionClear = () => {
    setParkingSummary(null);
  };

  // Check if user needs vehicle setup after profile completion
  const handleProfileCompletion = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        // Check if user has vehicles
        const userId = localStorage.getItem("userId") || localStorage.getItem("registeredUserId");
        if (userId) {
          const res = await api.get(`/api/user/profile/${userId}`);
          if (res.data && res.data.vehicles && res.data.vehicles.length > 0) {
            // User has vehicles, go to dashboard
            setCurrentView("dashboard");
            navigate("/dashboard");
          } else {
            // User needs vehicle setup
            setCurrentView("vehicleSetup");
            navigate("/vehicle-setup");
          }
        } else {
          // Fallback to vehicle setup
          setCurrentView("vehicleSetup");
          navigate("/vehicle-setup");
        }
      } catch (err) {
        console.error("Error checking user vehicles:", err);
        // Fallback to vehicle setup
        setCurrentView("vehicleSetup");
        navigate("/vehicle-setup");
      }
    } else {
      // For new users, go to vehicle setup
      switchToVehicleSetup();
    }
  };

  // Generic navigation handler for layout
  const handleNavigation = (view: string) => {
    const viewToPath: { [key: string]: string } = {
      "login": "/login",
      "register": "/register",
      "roleSelection": "/role-selection",
      "profileSetup": "/profile-setup",
      "vehicleSetup": "/vehicle-setup",
      "staffProfileSetup": "/staff-profile-setup",
      "educationSetup": "/education-setup",
      "dashboard": "/dashboard",
      "booking": "/booking",
      "history": "/history",
      "analysis": "/analysis",
      "reportIssue": "/report-issue",
      "notifications": "/notifications",
      "myBookings": "/my-bookings",
      "premiumSubscription": "/premium-subscription",
      "penaltyPayment": "/penalty-payment",
      "payUnpaid": "/pay-unpaid",
      "staffLogin": "/staff/login",
      "staffDashboard": "/staff/dashboard",
      "staffNotifications": "/staff/notifications",
      "staffReports": "/staff/reports",
      "chargingManagement": "/staff/charging-management",
      "adminLogin": "/admin/login",
      "adminDashboard": "/admin/dashboard",
      "systemConfig": "/admin/system-config",
      "adminMap": "/admin/map",
      "revenue": "/admin/revenue",
      "staffManagement": "/admin/staff-management",
      "usageAnalytics": "/admin/usage-analytics",
      "adminChargerPostActivating": "/admin/charger-post-activating",
      "issueResolvement": "/admin/issue-resolvement",
      "chargingSession": "/charging-session",
    "parking": "/parking",
    };
    
    const path = viewToPath[view];
    if (path) {
      setCurrentView(view as ViewType);
      navigate(path);
    }
  };

  // Determine user type and whether to show sidebar based on current view
  const getUserType = (): 'driver' | 'staff' | 'admin' | undefined => {
    if (['dashboard', 'booking', 'history', 'analysis', 'reportIssue', 'notifications', 'myBookings', 'chargingSession', 'premiumSubscription', 'parking'].includes(currentView)) {
      return 'driver';
    }
    if (['staffDashboard', 'staffNotifications', 'staffReports', 'chargingManagement'].includes(currentView)) {
      return 'staff';  
    }
    if (['adminDashboard', 'systemConfig', 'adminMap', 'revenue', 'staffManagement', 'usageAnalytics', 'adminChargerPostActivating'].includes(currentView)) {
      return 'admin';
    }
    return undefined;
  };

  const shouldShowSidebar = () => {
    const authViews = ['login', 'register', 'roleSelection', 'profileSetup', 'vehicleSetup', 'staffLogin', 'adminLogin', 'staffProfileSetup', 'educationSetup', 'dashboard', 'staffDashboard', 'penaltyPayment'];
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

          const r = await api.get(
            `/api/auth/social/callback?code=${code}&state=${state}`
          );

          const at = r?.data?.data?.accessToken as string | undefined;
          const rt = r?.data?.data?.refreshToken as string | undefined;
          console.log(at, rt);
          if (!at) throw new Error("Missing accessToken from callback");
          localStorage.setItem("token", at);
          if (rt) localStorage.setItem("refreshToken", rt);

          // /me
          try {
            const meRes = await api.post(
              `/api/auth/me`,
              null,
              { headers: { Authorization: `Bearer ${at}` } }
            );
            const userId = meRes?.data?.data;
            if (userId != null) {
              localStorage.setItem("userId", String(userId));
              
              // Fetch and store user profile data
              try {
                const profileRes = await api.get(`/api/user/profile/${userId}`);
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
            setCurrentView("roleSelection");
            navigate("/role-selection");
          } else {
            // Từ login, nếu có token hợp lệ thì điều hướng thẳng đến dashboard
            setCurrentView("dashboard");
            navigate("/dashboard");
          }
        } catch (e) {
          console.error("OAuth callback exchange failed:", e);
          setCurrentView("login");
          navigate("/login");
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
        return <MainDashboard onLogout={switchToLogin} onBooking={switchToBooking} onHistory={switchToHistory} onAnalysis={switchToAnalysis} onReportIssue={switchToReportIssue} onNotifications={switchToNotifications} onMyBookings={switchToMyBookings} onPremiumSubscription={switchToPremiumSubscription} vehicleBatteryLevel={vehicleBatteryLevel} setVehicleBatteryLevel={setVehicleBatteryLevel} />;

      case "booking":
        return <BookingMap onBack={() => navigate("/dashboard")} currentBatteryLevel={vehicleBatteryLevel} setCurrentBatteryLevel={setVehicleBatteryLevel} onStartCharging={switchToChargingSession} />;

      case "history":
        return <HistoryView onBack={() => navigate("/dashboard")} />;

      case "analysis":
        return <PersonalAnalysisView onBack={() => navigate("/dashboard")} />;

      case "reportIssue":
        return <ReportIssueView onBack={() => navigate("/dashboard")} />;

      case "notifications":
        return <NotificationView onBack={() => navigate("/dashboard")} />;

      case "staffNotifications":
        return <StaffNotificationView onBack={() => navigate("/staff/dashboard")} />;

      case "staffDashboard":
        return <StaffDashboard onLogout={switchToLogin} onNotifications={switchToStaffNotifications} onReports={switchToStaffReports} onChargingManagement={switchToChargingManagement} />;

      case "staffReports":
        return <StaffReportView onBack={() => navigate("/staff/dashboard")} />;

      case "chargingManagement":
        {
          const storedStationId = localStorage.getItem("stationId");
          return (
            <ChargingManagementView
              onBack={() => navigate("/staff/dashboard")}
              {...(storedStationId ? { stationId: Number(storedStationId) } : {})}
            />
          );
        }

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
        return <SystemConfigView onBack={() => navigate("/admin/dashboard")} />;

      case "adminMap":
        return <AdminMapView onBack={() => navigate("/admin/dashboard")} />;

      case "revenue":
        return <RevenueView onBack={() => navigate("/admin/dashboard")} />;

      case "staffManagement":
        return <StaffManagementView onBack={() => navigate("/admin/dashboard")} />;

      case "usageAnalytics":
        return <UsageAnalyticsView onBack={() => navigate("/admin/dashboard")} />;

      case "adminChargerPostActivating":
        return <AdminChargerPostActivatingView onBack={() => navigate("/admin/dashboard")} />;

      case "issueResolvement":
        return <IssueResolvementView onBack={() => navigate("/admin/dashboard")} />;

      case "myBookings":
        return <MyBookingView onBack={() => navigate("/dashboard")} onStartCharging={switchToChargingSession} onParkingStart={handleParkingStart} />;

      case "chargingSession": {
        // Get bookingId from URL params or state
        const urlBookingId = location.pathname.split("/charging-session/")[1];
        const finalBookingId = urlBookingId || currentBookingId;
        return (
          <ChargingSessionView
            onBack={() => navigate("/my-bookings")}
            bookingId={finalBookingId}
            onParkingStart={handleParkingStart}
          />
        );
      }

      case "parking":
        return (
          <ParkingView
            data={parkingSummary}
            onBack={() => navigate("/my-bookings")}
            onParkingSessionClear={handleParkingSessionClear}
          />
        );

      case "premiumSubscription":
        return <PremiumSubscriptionView onBack={() => navigate("/dashboard")} userType="driver" />;

      case "penaltyPayment":
        return <PenaltyPayment />;
      case "payUnpaid":
        return <PayUnpaid />;
      case "vehicleSetup":
        return (
          <VehicleSetup 
            onNext={completeSetup}
            onBack={() => navigate("/profile-setup")}
            onBackToLogin={switchToLogin}
          />
        );

      case "profileSetup":
        return (
          <ProfileSetup 
            onNext={handleProfileCompletion}
            onBack={() => navigate("/role-selection")}
          />
        );

      case "staffProfileSetup":
        return (
          <StaffProfileSetup 
            onNext={switchToEducationSetup}
            onBack={() => navigate("/role-selection")}
          />
        );

      case "educationSetup":
        return (
          <EducationSetup 
            onNext={completeStaffSetup}
            onBack={() => navigate("/staff-profile-setup")}
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
              onLogin={() => {
                setCurrentView("dashboard");
                navigate("/dashboard");
              }}
              onStaffLogin={completeStaffLogin}
              onAdminLogin={completeAdminLogin}
              onSwitchToRoleSelection={switchToRoleSelection}
              onSwitchToVehicleSetup={switchToVehicleSetup}
              onSwitchToPenaltyPayment={switchToPenaltyPayment}
            />
            <LanguageThemeControls />
          </>
        );
    }
  };

  // Sync currentView with URL - handle browser back/forward
  useEffect(() => {
    const path = location.pathname;
    const pathToView: { [key: string]: ViewType } = {
      "/": "login",
      "/login": "login",
      "/register": "register",
      "/role-selection": "roleSelection",
      "/profile-setup": "profileSetup",
      "/vehicle-setup": "vehicleSetup",
      "/staff-profile-setup": "staffProfileSetup",
      "/education-setup": "educationSetup",
      "/home": "dashboard",
      "/dashboard": "dashboard",
      "/booking": "booking",
      "/history": "history",
      "/analysis": "analysis",
      "/report-issue": "reportIssue",
      "/notifications": "notifications",
      "/my-bookings": "myBookings",
      "/premium-subscription": "premiumSubscription",
      "/penalty-payment": "penaltyPayment",
      "/pay-unpaid": "payUnpaid",
      "/staff/login": "staffLogin",
      "/staff/dashboard": "staffDashboard",
      "/staff/notifications": "staffNotifications",
      "/staff/reports": "staffReports",
      "/admin/login": "adminLogin",
      "/admin/dashboard": "adminDashboard",
      "/admin/system-config": "systemConfig",
      "/admin/map": "adminMap",
      "/admin/revenue": "revenue",
      "/admin/staff-management": "staffManagement",
      "/admin/usage-analytics": "usageAnalytics",
      "/admin/charger-post-activating": "adminChargerPostActivating",
      "/admin/issue-resolvement": "issueResolvement",
    "/parking": "parking",
    };

    // Handle charging session with dynamic bookingId
    if (path.startsWith("/charging-session")) {
      const bookingId = path.split("/")[2];
      if (bookingId && currentBookingId !== bookingId) {
        setCurrentBookingId(bookingId);
      }
      if (currentView !== "chargingSession") {
        setCurrentView("chargingSession");
      }
      return;
    }

    // Update view based on path
    const newView = pathToView[path];
    if (newView && currentView !== newView) {
      setCurrentView(newView);
    }
  }, [location.pathname, currentView, currentBookingId]);

  return (
    <Routes>
      {/* Auth Routes */}
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
        path="/login" 
        element={
          <AppLayout
            userType={userType || "driver"}
            currentView="login"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={false}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route 
        path="/register" 
        element={
          <AppLayout
            userType={userType || "driver"}
            currentView="register"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={false}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route 
        path="/role-selection" 
        element={
          <AppLayout
            userType={userType || "driver"}
            currentView="roleSelection"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={false}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route 
        path="/profile-setup" 
        element={
          <AppLayout
            userType={userType || "driver"}
            currentView="profileSetup"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={false}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route 
        path="/vehicle-setup" 
        element={
          <AppLayout
            userType={userType || "driver"}
            currentView="vehicleSetup"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={false}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route 
        path="/staff-profile-setup" 
        element={
          <AppLayout
            userType={userType || "driver"}
            currentView="staffProfileSetup"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={false}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route 
        path="/education-setup" 
        element={
          <AppLayout
            userType={userType || "driver"}
            currentView="educationSetup"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={false}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      
      {/* Driver Routes */}
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
        path="/dashboard" 
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
        path="/booking" 
        element={
          <AppLayout
            userType="driver"
            currentView="booking"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={showSidebar}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route 
        path="/history" 
        element={
          <AppLayout
            userType="driver"
            currentView="history"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={showSidebar}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route 
        path="/analysis" 
        element={
          <AppLayout
            userType="driver"
            currentView="analysis"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={showSidebar}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route 
        path="/report-issue" 
        element={
          <AppLayout
            userType="driver"
            currentView="reportIssue"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={showSidebar}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route 
        path="/notifications" 
        element={
          <AppLayout
            userType="driver"
            currentView="notifications"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={showSidebar}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route 
        path="/my-bookings" 
        element={
          <AppLayout
            userType="driver"
            currentView="myBookings"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={showSidebar}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route 
        path="/charging-session/:bookingId?" 
        element={
          <AppLayout
            userType="driver"
            currentView="chargingSession"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={showSidebar}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route
        path="/parking"
        element={
          <AppLayout
            userType="driver"
            currentView="parking"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={showSidebar}
          >
            {renderContent()}
          </AppLayout>
        }
      />
      <Route 
        path="/premium-subscription" 
        element={
          <AppLayout
            userType="driver"
            currentView="premiumSubscription"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={showSidebar}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      
      {/* Staff Routes */}
      <Route 
        path="/staff/login" 
        element={
          <AppLayout
            userType="staff"
            currentView="staffLogin"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={false}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route 
        path="/staff/dashboard" 
        element={
          <AppLayout
            userType="staff"
            currentView="staffDashboard"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={showSidebar}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route 
        path="/staff/notifications" 
        element={
          <AppLayout
            userType="staff"
            currentView="staffNotifications"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={showSidebar}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route 
        path="/staff/reports" 
        element={
          <AppLayout
            userType="staff"
            currentView="staffReports"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={showSidebar}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route 
        path="/staff/charging-management" 
        element={
          <AppLayout
            userType="staff"
            currentView="chargingManagement"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={showSidebar}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      
      {/* Admin Routes */}
      <Route 
        path="/admin/login" 
        element={
          <AppLayout
            userType="admin"
            currentView="adminLogin"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={false}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route 
        path="/admin/dashboard" 
        element={
          <AppLayout
            userType="admin"
            currentView="adminDashboard"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={showSidebar}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route 
        path="/admin/system-config" 
        element={
          <AppLayout
            userType="admin"
            currentView="systemConfig"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={showSidebar}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route 
        path="/admin/map" 
        element={
          <AppLayout
            userType="admin"
            currentView="adminMap"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={showSidebar}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route 
        path="/admin/revenue" 
        element={
          <AppLayout
            userType="admin"
            currentView="revenue"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={showSidebar}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route 
        path="/admin/staff-management" 
        element={
          <AppLayout
            userType="admin"
            currentView="staffManagement"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={showSidebar}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route 
        path="/admin/usage-analytics" 
        element={
          <AppLayout
            userType="admin"
            currentView="usageAnalytics"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={showSidebar}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route 
        path="/admin/charger-post-activating" 
        element={
          <AppLayout
            userType="admin"
            currentView="adminChargerPostActivating"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={showSidebar}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      <Route 
        path="/admin/issue-resolvement" 
        element={
          <AppLayout
            userType="admin"
            currentView="issueResolvement"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={showSidebar}
          >
            {renderContent()}
          </AppLayout>
        } 
      />
      
      {/* Payment Routes */}
      <Route 
        path="/payment/result" 
        element={<PaymentResultView />} 
      />
      <Route
        path="/penalty-payment"
        element={
          <AppLayout
            userType={userType || "driver"}
            currentView="penaltyPayment"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={false}
          >
            <PenaltyPayment />
          </AppLayout>
        }
      />
      <Route
        path="/pay-unpaid"
        element={
          <AppLayout
            userType={userType || "driver"}
            currentView="payUnpaid"
            onNavigate={handleNavigation}
            onLogout={switchToLogin}
            showSidebar={false}
          >
            <PayUnpaid />
          </AppLayout>
        }
      />
      
      {/* Fallback Route */}
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
              <ChatbotProvider>
                <AppContent />
                <Toaster />
              </ChatbotProvider>
            </NotificationProvider>
          </StationProvider>
        </BookingProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}