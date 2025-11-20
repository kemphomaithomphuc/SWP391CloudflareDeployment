import React, { useState } from "react";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { logoutUser } from "./services/api";
import { toast } from "sonner";

import { motion, AnimatePresence } from "motion/react";
import {
    LogOut,
    Map,
    Users,
    Users2,
    TrendingUp,
    BarChart3,
    Globe,
    Settings,
    Activity
} from "lucide-react";

import { useLanguage } from "./contexts/LanguageContext";
import DriverManagementView from "./components/DriverManagementView";
import MarketTrendsWidget from "./components/MarketTrendsWidget";
import ConnectorSuggestionsWidget from "./components/ConnectorSuggestionsWidget";

interface AdminDashboardProps {
    onLogout: () => void;
    onSystemConfig: () => void;
    onAdminMap: () => void;
    onRevenue: () => void;
    onStaffManagement: () => void;
    onUsageAnalytics: () => void;
    onAdminChargerPostActivating: () => void;
    onIssueResolvement: () => void;
}

export default function AdminDashboard({ onLogout, onSystemConfig, onAdminMap, onRevenue, onStaffManagement, onUsageAnalytics, onAdminChargerPostActivating, onIssueResolvement }: AdminDashboardProps) {

    const { language, setLanguage } = useLanguage();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [currentView, setCurrentView] = useState<'dashboard' | 'driverManagement'>('dashboard');
    const [marketTrendsExpanded, setMarketTrendsExpanded] = useState(false);
    const [connectorSuggestionsExpanded, setConnectorSuggestionsExpanded] = useState(false);

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'vi' : 'en');
    };

    const adminName = localStorage.getItem("fullName") || (language === 'vi' ? 'Người dùng' : 'User');
    const storedRole = (localStorage.getItem("role") || "admin").toLowerCase();
    const roleLabel = (() => {
        switch (storedRole) {
            case 'admin':
            case 'administrator':
                return language === 'vi' ? 'Quản trị viên' : 'Administrator';
            case 'staff':
                return language === 'vi' ? 'Nhân viên' : 'Staff';
            case 'driver':
            case 'user':
                return language === 'vi' ? 'Khách hàng' : 'Driver';
            default:
                return language === 'vi' ? 'Người dùng' : 'User';
        }
    })();

    const handleGridButtonClick = (buttonName: string) => {
        console.log(`${buttonName} button clicked`);
        if (buttonName === 'Map') {
            onAdminMap();
        } else if (buttonName === 'SystemConfig') {
            onSystemConfig();
        } else if (buttonName === 'Revenue') {
            onRevenue();
        } else if (buttonName === 'StaffManagement') {
            onStaffManagement();
        } else if (buttonName === 'IssueResolvement') {
            onIssueResolvement();
        }
    };

    const handleUsageAnalyticsClick = () => {
        console.log("Usage Analytics button clicked");
        onUsageAnalytics();
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
            toast.success(language === 'en' ? 'Logout successful' : 'Đăng xuất thành công');
            setIsLoggingOut(false);
            onLogout();
        }
    };

    // Show Driver Management View if selected
    if (currentView === 'driverManagement') {
        return <DriverManagementView onBack={() => setCurrentView('dashboard')} />;
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Top Navigation Bar */}
            <div className="bg-card border-b border-border shadow-sm">
                <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                        {/* Left Side */}
                        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-6 min-w-0 flex-1">
                            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-white font-bold text-xs sm:text-sm">A</span>
                                </div>
                                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                                    <p className="font-medium text-foreground text-xs sm:text-sm md:text-base truncate">
                                        <span className="hidden sm:inline">{roleLabel}: </span>{adminName}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Side */}
                        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 flex-shrink-0">


                            {/* Language Switcher */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                                className="hidden sm:flex items-center space-x-2 sm:space-x-3"
                            >
                                <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <div className="relative flex bg-card border border-border/50 rounded-lg p-0.5 sm:p-1 shadow-sm">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={language}
                                            className="absolute inset-0.5 sm:inset-1 bg-primary rounded-md shadow-sm"
                                            initial={{ x: language === 'vi' ? 0 : 40 }}
                                            animate={{ x: language === 'vi' ? 0 : 40 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            style={{ width: '40px' }}
                                        />
                                    </AnimatePresence>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => language !== 'vi' && toggleLanguage()}
                                        className={`relative z-10 h-7 sm:h-8 w-10 sm:w-12 px-1 sm:px-2 text-[10px] sm:text-xs font-medium transition-all duration-200 active:scale-95 touch-manipulation ${
                                            language === 'vi' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        VIE
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => language !== 'en' && toggleLanguage()}
                                        className={`relative z-10 h-7 sm:h-8 w-10 sm:w-12 px-1 sm:px-2 text-[10px] sm:text-xs font-medium transition-all duration-200 active:scale-95 touch-manipulation ${
                                            language === 'en' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        ENG
                                    </Button>
                                </div>
                            </motion.div>

                            {/* Logout Button */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                            >
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 active:scale-95 touch-manipulation min-h-[36px] sm:min-h-[40px] px-2 sm:px-3"
                                >
                                    <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                                    <motion.span
                                        key={language + 'logout'}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="text-xs sm:text-sm"
                                    >
                                        <span className="hidden sm:inline">{language === 'en' ? 'Logout' : 'Đăng xuất'}</span>
                                        <span className="sm:hidden">{language === 'en' ? 'Out' : 'Thoát'}</span>
                                    </motion.span>
                                </Button>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12 max-w-4xl">
                <div className="space-y-6 sm:space-y-8 md:space-y-12">
                    {/* Widgets Row - Market Trends & Connector Suggestions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <div className={`transition-all duration-300 ${
                            marketTrendsExpanded ? 'md:col-span-2' : ''
                        } ${connectorSuggestionsExpanded && !marketTrendsExpanded ? 'hidden md:block' : ''}`}>
                            <MarketTrendsWidget 
                                className="w-full" 
                                isExpanded={marketTrendsExpanded}
                                onExpandChange={(expanded) => {
                                    setMarketTrendsExpanded(expanded);
                                    if (expanded) {
                                        setConnectorSuggestionsExpanded(false);
                                    }
                                }}
                            />
                        </div>
                        <div className={`transition-all duration-300 ${
                            connectorSuggestionsExpanded ? 'md:col-span-2' : ''
                        } ${marketTrendsExpanded && !connectorSuggestionsExpanded ? 'hidden md:block' : ''}`}>
                            <ConnectorSuggestionsWidget 
                                className="w-full" 
                                isExpanded={connectorSuggestionsExpanded}
                                onExpandChange={(expanded) => {
                                    setConnectorSuggestionsExpanded(expanded);
                                    if (expanded) {
                                        setMarketTrendsExpanded(false);
                                    }
                                }}
                            />
                        </div>
                    </div>
                    
                    {/* 2x2 Grid Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto"
                    >
                        {/* Map Button */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Button
                                variant="outline"
                                onClick={() => handleGridButtonClick('Map')}
                                className="w-full h-24 sm:h-28 md:h-32 flex flex-col items-center justify-center space-y-2 sm:space-y-3 bg-card hover:bg-accent/50 active:bg-accent/70 border-border shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-300 rounded-xl sm:rounded-2xl group touch-manipulation"
                            >
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/10 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors duration-300">
                                    <Map className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                                </div>
                                <motion.span
                                    key={language + 'map'}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="font-medium text-foreground group-hover:text-blue-600 transition-colors duration-300 text-sm sm:text-base"
                                >
                                    {language === 'en' ? 'Map' : 'Bản đồ'}
                                </motion.span>
                            </Button>
                        </motion.div>

                        {/* Staff Management Button */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Button
                                variant="outline"
                                onClick={() => handleGridButtonClick('StaffManagement')}
                                className="w-full h-24 sm:h-28 md:h-32 flex flex-col items-center justify-center space-y-2 sm:space-y-3 bg-card hover:bg-accent/50 active:bg-accent/70 border-border shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-300 rounded-xl sm:rounded-2xl group touch-manipulation"
                            >
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/10 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-green-500/20 transition-colors duration-300">
                                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                                </div>
                                <motion.span
                                    key={language + 'staffmanagement'}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="font-medium text-foreground group-hover:text-green-600 transition-colors duration-300 text-sm sm:text-base text-center px-2"
                                >
                                    {language === 'en' ? 'Staff Management' : 'Quản lý nhân viên'}
                                </motion.span>
                            </Button>
                        </motion.div>

                        {/* Issue Resolvement Button */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.25 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Button
                                variant="outline"
                                onClick={() => handleGridButtonClick('IssueResolvement')}
                                className="w-full h-32 flex flex-col items-center justify-center space-y-3 bg-card hover:bg-accent/50 border-border shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl group"
                            >
                                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center group-hover:bg-red-500/20 transition-colors duration-300">
                                    <Activity className="w-6 h-6 text-red-600" />
                                </div>
                                <motion.span
                                    key={language + 'issueResolvement'}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="font-medium text-foreground group-hover:text-red-600 transition-colors duration-300 text-center"
                                >
                                    {language === 'en' ? 'Issue Resolvement' : 'Xử lý sự cố'}
                                </motion.span>
                            </Button>
                        </motion.div>

                        {/* System Config Button */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Button
                                variant="outline"
                                onClick={() => handleGridButtonClick('SystemConfig')}
                                className="w-full h-24 sm:h-28 md:h-32 flex flex-col items-center justify-center space-y-2 sm:space-y-3 bg-card hover:bg-accent/50 active:bg-accent/70 border-border shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-300 rounded-xl sm:rounded-2xl group touch-manipulation"
                            >
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/10 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors duration-300">
                                    <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                                </div>
                                <motion.span
                                    key={language + 'systemconfig'}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="font-medium text-foreground group-hover:text-purple-600 transition-colors duration-300 text-sm sm:text-base text-center px-2"
                                >
                                    {language === 'en' ? 'System Config' : 'Cấu Hình Hệ Thống'}
                                </motion.span>
                            </Button>
                        </motion.div>

                        {/* Revenue Button */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Button
                                variant="outline"
                                onClick={() => handleGridButtonClick('Revenue')}
                                className="w-full h-24 sm:h-28 md:h-32 flex flex-col items-center justify-center space-y-2 sm:space-y-3 bg-card hover:bg-accent/50 active:bg-accent/70 border-border shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-300 rounded-xl sm:rounded-2xl group touch-manipulation"
                            >
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/10 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-orange-500/20 transition-colors duration-300">
                                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                                </div>
                                <motion.span
                                    key={language + 'revenue'}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="font-medium text-foreground group-hover:text-orange-600 transition-colors duration-300 text-sm sm:text-base"
                                >
                                    {language === 'en' ? 'Revenue' : 'Doanh thu'}
                                </motion.span>
                            </Button>
                        </motion.div>
                        {/* Charger Post Activating Button */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Button
                                variant="outline"
                                onClick={() => onAdminChargerPostActivating()}
                                className="w-full h-24 sm:h-28 md:h-32 flex flex-col items-center justify-center space-y-2 sm:space-y-3 bg-card hover:bg-accent/50 active:bg-accent/70 border-border shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-300 rounded-xl sm:rounded-2xl group touch-manipulation"
                            >
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500/10 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors duration-300">
                                    <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600" />
                                </div>
                                <motion.span
                                    key={language + 'chargeractivating'}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="font-medium text-foreground group-hover:text-cyan-600 transition-colors duration-300 text-center text-sm sm:text-base px-2"
                                >
                                    {language === 'en' ? 'Charger Post Activating' : 'Kích hoạt Trạm sạc'}
                                </motion.span>
                            </Button>
                        </motion.div>

                        {/* Driver Management Button */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.6 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Button
                                variant="outline"
                                onClick={() => setCurrentView('driverManagement')}
                                className="w-full h-32 flex flex-col items-center justify-center space-y-3 bg-card hover:bg-accent/50 border-border shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl group"
                            >
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500/10 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors duration-300">
                                    <Users2 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                                </div>
                                <motion.span
                                    key={language + 'drivermanagement'}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="font-medium text-foreground group-hover:text-indigo-600 transition-colors duration-300 text-center text-sm sm:text-base px-2"
                                >
                                    {language === 'en' ? 'Driver Management' : 'Quản lý Tài xế'}
                                </motion.span>
                            </Button>
                        </motion.div>
                    </motion.div>

                    {/* Usage Analytics Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="flex justify-center"
                    >
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full max-w-md"
                        >
                            <Button
                                variant="default"
                                onClick={handleUsageAnalyticsClick}
                                className="w-full h-14 sm:h-16 bg-primary hover:bg-primary/90 active:bg-primary/80 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-300 rounded-xl sm:rounded-2xl group touch-manipulation"
                            >
                                <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-foreground/20 rounded-lg flex items-center justify-center group-hover:bg-primary-foreground/30 transition-colors duration-300">
                                        <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                                    </div>
                                    <motion.span
                                        key={language + 'analytics'}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="font-medium text-primary-foreground text-sm sm:text-base"
                                    >
                                        {language === 'en' ? 'Usage Analytics' : 'Phân tích sử dụng'}
                                    </motion.span>
                                </div>
                            </Button>
                        </motion.div>
                    </motion.div>



                    {/* Footer Info */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="text-center"
                    >
                        <div className="space-y-2">
                            <motion.div
                                key={language + 'badge'}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Badge variant="outline" className="text-xs">
                                    {language === 'en' ? 'Admin Dashboard v2.0' : 'Bảng điều khiển Admin v2.0'}
                                </Badge>
                            </motion.div>
                            <motion.p
                                key={language + 'description'}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2, delay: 0.1 }}
                                className="text-xs text-muted-foreground"
                            >
                                {language === 'en'
                                    ? 'Manage your charging network efficiently'
                                    : 'Quản lý mạng lưới sạc xe hiệu quả'
                                }
                            </motion.p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}