import { useState, ReactNode } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useNotifications } from "../contexts/NotificationContext";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import NotificationBadge from "./NotificationBadge";
import { 
  Home,
  Users,
  MapPin,
  Settings,
  Bell,
  Receipt,
  BarChart3,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Globe,
  ChevronLeft,
  Zap,
  Calendar,
  Wallet,
  FileText,
  AlertTriangle,
  CreditCard
} from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
  userType?: 'driver' | 'staff' | 'admin';
  currentView?: string;
  onNavigate?: (view: string) => void;
  onLogout?: () => void;
  showSidebar?: boolean;
}

interface NavigationItem {
  id: string;
  label: string;
  labelVi: string;
  icon: React.ComponentType<any>;
  onClick: () => void;
  userTypes: ('driver' | 'staff' | 'admin')[];
}

export default function AppLayout({ 
  children, 
  userType = 'driver',
  currentView = 'dashboard',
  onNavigate,
  onLogout,
  showSidebar = true
}: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = () => {
    const newLanguage = language === "en" ? "vi" : "en";
    setLanguage(newLanguage);
  };

  // Navigation items based on user type
  const navigationItems: NavigationItem[] = [
    // Driver navigation
    {
      id: 'dashboard',
      label: 'Dashboard',
      labelVi: 'Bảng điều khiển',
      icon: Home,
      onClick: () => onNavigate?.('dashboard'),
      userTypes: ['driver']
    },
    {
      id: 'booking',
      label: 'Book Charging',
      labelVi: 'Đặt chỗ sạc',
      icon: MapPin,
      onClick: () => onNavigate?.('booking'),
      userTypes: ['driver']
    },
    {
      id: 'myBookings',
      label: 'My Bookings',
      labelVi: 'Đặt chỗ của tôi',
      icon: Calendar,
      onClick: () => onNavigate?.('myBookings'),
      userTypes: ['driver']
    },
    {
      id: 'wallet',
      label: 'Wallet',
      labelVi: 'Ví tiền',
      icon: Wallet,
      onClick: () => onNavigate?.('wallet'),
      userTypes: ['driver']
    },
    {
      id: 'history',
      label: 'History',
      labelVi: 'Lịch sử',
      icon: FileText,
      onClick: () => onNavigate?.('history'),
      userTypes: ['driver']
    },
    {
      id: 'analysis',
      label: 'Analytics',
      labelVi: 'Phân tích',
      icon: BarChart3,
      onClick: () => onNavigate?.('analysis'),
      userTypes: ['driver']
    },
    {
      id: 'premiumSubscription',
      label: 'Premium',
      labelVi: 'Gói premium',
      icon: CreditCard,
      onClick: () => onNavigate?.('premiumSubscription'),
      userTypes: ['driver']
    },
    {
      id: 'notifications',
      label: 'Notifications',
      labelVi: 'Thông báo',
      icon: Bell,
      onClick: () => onNavigate?.('notifications'),
      userTypes: ['driver']
    },
    {
      id: 'reportIssue',
      label: 'Report Issue',
      labelVi: 'Báo cáo sự cố',
      icon: AlertTriangle,
      onClick: () => onNavigate?.('reportIssue'),
      userTypes: ['driver']
    },
    
    // Staff navigation
    {
      id: 'staffDashboard',
      label: 'Staff Dashboard',
      labelVi: 'Bảng điều khiển',
      icon: Home,
      onClick: () => onNavigate?.('staffDashboard'),
      userTypes: ['staff']
    },
    {
      id: 'customers',
      label: 'Customer Support',
      labelVi: 'Hỗ trợ khách hàng',
      icon: Users,
      onClick: () => onNavigate?.('customers'),
      userTypes: ['staff']
    },
    {
      id: 'chargingManagement',
      label: 'Charging Management',
      labelVi: 'Quản lý sạc',
      icon: Zap,
      onClick: () => onNavigate?.('chargingManagement'),
      userTypes: ['staff']
    },
    {
      id: 'stationManagement',
      label: 'Station Management',
      labelVi: 'Quản lý trạm',
      icon: MapPin,
      onClick: () => onNavigate?.('stationManagement'),
      userTypes: ['staff']
    },
    {
      id: 'billing',
      label: 'Billing & Invoice',
      labelVi: 'Hóa đơn',
      icon: Receipt,
      onClick: () => onNavigate?.('billing'),
      userTypes: ['staff']
    },
    {
      id: 'staffLanguageToggle',
      label: language === 'en' ? 'Tiếng Việt' : 'English',
      labelVi: language === 'vi' ? 'Tiếng Anh' : 'Tiếng Việt',
      icon: Globe,
      onClick: handleLanguageChange,
      userTypes: ['staff']
    },
    
    // Admin navigation
    {
      id: 'adminDashboard',
      label: 'Admin Dashboard',
      labelVi: 'Bảng điều khiển',
      icon: Home,
      onClick: () => onNavigate?.('adminDashboard'),
      userTypes: ['admin']
    },
    {
      id: 'systemConfig',
      label: 'System Config',
      labelVi: 'Cấu hình hệ thống',
      icon: Settings,
      onClick: () => onNavigate?.('systemConfig'),
      userTypes: ['admin']
    },
    {
      id: 'revenue',
      label: 'Revenue',
      labelVi: 'Doanh thu',
      icon: BarChart3,
      onClick: () => onNavigate?.('revenue'),
      userTypes: ['admin']
    },
    {
      id: 'staffManagement',
      label: 'Staff Management',
      labelVi: 'Quản lý nhân viên',
      icon: Users,
      onClick: () => onNavigate?.('staffManagement'),
      userTypes: ['admin']
    },
    {
      id: 'languageToggle',
      label: language === 'en' ? 'Tiếng Việt' : 'English',
      labelVi: language === 'vi' ? 'Tiếng Anh' : 'Tiếng Việt',
      icon: Globe,
      onClick: handleLanguageChange,
      userTypes: ['admin']
    },

  ];

  const filteredNavItems = navigationItems.filter(item => 
    item.userTypes.includes(userType)
  );

  if (!showSidebar) {
    return (
      <div className="min-h-screen bg-background">
        <main className="h-screen overflow-auto">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-sidebar border-r border-sidebar-border
        transition-all duration-300 ease-in-out
        flex flex-col app-layout-sidebar
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                <span className="font-bold text-sidebar-primary-foreground text-sm">C</span>
              </div>
              <div>
                <h1 className="font-semibold text-sidebar-foreground">ChargeHub</h1>
                <p className="text-xs text-muted-foreground capitalize">
                  {userType === 'driver' ? (language === 'vi' ? 'Khách hàng' : 'Driver') :
                   userType === 'staff' ? (language === 'vi' ? 'Nhân viên' : 'Staff') :
                   (language === 'vi' ? 'Quản trị' : 'Admin')}
                </p>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex"
            >
              <ChevronLeft className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4 scrollbar-thin">
          <nav className="space-y-2">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id || 
                              (item.id === 'dashboard' && currentView === 'dashboard') ||
                              (item.id === 'staffDashboard' && currentView === 'staffDashboard') ||
                              (item.id === 'adminDashboard' && currentView === 'adminDashboard');
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    item.onClick();
                    setMobileMenuOpen(false);
                  }}
                  className={`
                    w-full justify-start h-10
                    ${isActive 
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }
                    ${sidebarCollapsed ? 'px-2' : 'px-3'}
                  `}
                >
                  {item.id === 'notifications' ? (
                    <NotificationBadge className={`${sidebarCollapsed ? '' : 'mr-3'} flex-shrink-0`} />
                  ) : (
                    <Icon className={`w-4 h-4 ${sidebarCollapsed ? '' : 'mr-3'} flex-shrink-0`} />
                  )}
                  {!sidebarCollapsed && (
                    <span className="truncate">
                      {language === 'vi' ? item.labelVi : item.label}
                    </span>
                  )}
                </Button>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          {/* Theme & Language Controls - Only for drivers */}
          {!sidebarCollapsed && userType === 'driver' && (
            <div className="flex items-center justify-between mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-8 px-2"
              >
                {theme === "light" ? (
                  <Moon className="w-3 h-3 mr-1" />
                ) : (
                  <Sun className="w-3 h-3 mr-1" />
                )}
                <span className="text-xs">
                  {theme === "light" ? "Dark" : "Light"}
                </span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLanguageChange}
                className="h-8 px-2"
              >
                <Globe className="w-3 h-3 mr-1" />
                <span className="text-xs">
                  {language === "en" ? "VI" : "EN"}
                </span>
              </Button>
            </div>
          )}
          
          {/* Only Logout for drivers - no notifications in sidebar */}
          {userType === 'driver' && (
            <>
              <Separator />
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className={`flex-1 text-destructive hover:text-destructive ${sidebarCollapsed ? 'px-2' : 'justify-start'}`}
                >
                  <LogOut className={`w-4 h-4 ${sidebarCollapsed ? '' : 'mr-2'}`} />
                  {!sidebarCollapsed && (language === 'vi' ? 'Đăng xuất' : 'Logout')}
                </Button>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-card border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <span className="font-bold text-primary-foreground text-xs">C</span>
            </div>
            <span className="font-semibold text-foreground">ChargeHub</span>
          </div>
          
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-background app-layout-main">
          <ScrollArea className="h-full scrollbar-thin">
            <div className="main-content-area min-h-full">
              {children}
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}