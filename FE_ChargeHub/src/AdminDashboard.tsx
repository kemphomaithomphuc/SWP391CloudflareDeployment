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
    Eye,
    EyeOff,
    Globe,
    Settings,
    Activity
} from "lucide-react";

import { useLanguage } from "./contexts/LanguageContext";
import DriverManagementView from "./components/DriverManagementView";

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
    const [showSalary, setShowSalary] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [currentView, setCurrentView] = useState<'dashboard' | 'driverManagement'>('dashboard');

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'vi' : 'en');
    };

    const adminData = {
        username: "Admin01",
        salary: 85000000 // VND
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
    };

    const handleGridButtonClick = (buttonName: string) => {
        console.log(`${buttonName} button clicked`);
        if (buttonName === 'SystemConfig') {
            onSystemConfig();
        } else if (buttonName === 'Map') {
            onAdminMap();
        } else if (buttonName === 'Revenue') {
            onRevenue();
        } else if (buttonName === 'StaffManagement') {
            onStaffManagement();

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
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Left Side */}
                        <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">A</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="font-medium text-foreground">
                                        Admin: {adminData.username}
                                    </p>
                                    <div className="flex items-center space-x-2">
                                        <p className="text-sm text-muted-foreground">
                                            Salary: {showSalary ? formatCurrency(adminData.salary) : '••••••••'}
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowSalary(!showSalary)}
                                            className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                                        >
                                            {showSalary ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side */}
                        <div className="flex items-center space-x-4">


                            {/* Language Switcher */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                                className="flex items-center space-x-3"
                            >
                                <Globe className="w-4 h-4 text-muted-foreground" />
                                <div className="relative flex bg-card border border-border/50 rounded-lg p-1 shadow-sm">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={language}
                                            className="absolute inset-1 bg-primary rounded-md shadow-sm"
                                            initial={{ x: language === 'vi' ? 0 : 48 }}
                                            animate={{ x: language === 'vi' ? 0 : 48 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            style={{ width: '48px' }}
                                        />
                                    </AnimatePresence>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => language !== 'vi' && toggleLanguage()}
                                        className={`relative z-10 h-8 w-12 px-2 text-xs font-medium transition-all duration-200 hover:scale-105 ${
                                            language === 'vi' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        VIE
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => language !== 'en' && toggleLanguage()}
                                        className={`relative z-10 h-8 w-12 px-2 text-xs font-medium transition-all duration-200 hover:scale-105 ${
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
                                    className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 hover:scale-105"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    <motion.span
                                        key={language + 'logout'}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {language === 'en' ? 'Logout' : 'Đăng xuất'}
                                    </motion.span>
                                </Button>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-12 max-w-4xl">
                <div className="space-y-12">
                    {/* 2x2 Grid Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto"
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
                                className="w-full h-32 flex flex-col items-center justify-center space-y-3 bg-card hover:bg-accent/50 border-border shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl group"
                            >
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors duration-300">
                                    <Map className="w-6 h-6 text-blue-600" />
                                </div>
                                <motion.span
                                    key={language + 'map'}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="font-medium text-foreground group-hover:text-blue-600 transition-colors duration-300"
                                >
                                    {language === 'en' ? 'Map' : 'Bản đồ'}
                                </motion.span>
                            </Button>
                        </motion.div>

            {/* Issue Resolvement Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.35 }}
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
                  key={language + 'issue-resolve'}
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
                className="w-full h-32 flex flex-col items-center justify-center space-y-3 bg-card hover:bg-accent/50 border-border shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl group"
              >
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center group-hover:bg-green-500/20 transition-colors duration-300">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <motion.span 
                  key={language + 'staffmanagement'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="font-medium text-foreground group-hover:text-green-600 transition-colors duration-300"
                >
                  {language === 'en' ? 'Staff Management' : 'Quản lý nhân viên'}
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
                                className="w-full h-32 flex flex-col items-center justify-center space-y-3 bg-card hover:bg-accent/50 border-border shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl group"
                            >
                                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors duration-300">
                                    <Settings className="w-6 h-6 text-purple-600" />
                                </div>
                                <motion.span
                                    key={language + 'systemconfig'}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="font-medium text-foreground group-hover:text-purple-600 transition-colors duration-300"
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
                                className="w-full h-32 flex flex-col items-center justify-center space-y-3 bg-card hover:bg-accent/50 border-border shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl group"
                            >
                                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center group-hover:bg-orange-500/20 transition-colors duration-300">
                                    <TrendingUp className="w-6 h-6 text-orange-600" />
                                </div>
                                <motion.span
                                    key={language + 'revenue'}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="font-medium text-foreground group-hover:text-orange-600 transition-colors duration-300"
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
                                className="w-full h-32 flex flex-col items-center justify-center space-y-3 bg-card hover:bg-accent/50 border-border shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl group"
                            >
                                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors duration-300">
                                    <Activity className="w-6 h-6 text-cyan-600" />
                                </div>
                                <motion.span
                                    key={language + 'chargeractivating'}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="font-medium text-foreground group-hover:text-cyan-600 transition-colors duration-300 text-center"
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
                                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors duration-300">
                                    <Users2 className="w-6 h-6 text-indigo-600" />
                                </div>
                                <motion.span
                                    key={language + 'drivermanagement'}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="font-medium text-foreground group-hover:text-indigo-600 transition-colors duration-300 text-center"
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
                                className="w-full h-16 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl group"
                            >
                                <div className="flex items-center justify-center space-x-3">
                                    <div className="w-8 h-8 bg-primary-foreground/20 rounded-lg flex items-center justify-center group-hover:bg-primary-foreground/30 transition-colors duration-300">
                                        <BarChart3 className="w-5 h-5 text-primary-foreground" />
                                    </div>
                                    <motion.span
                                        key={language + 'analytics'}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="font-medium text-primary-foreground"
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