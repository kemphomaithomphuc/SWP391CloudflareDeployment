import React, { createContext, useContext, useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { ArrowLeft, Shield, Eye, EyeOff, AlertTriangle, CheckCircle, Settings, Globe } from "lucide-react";
import { useLanguage } from "./contexts/LanguageContext";
import { motion, AnimatePresence } from "motion/react";

interface AdminLoginProps {
  onLogin: () => void;
  onBack: () => void;
}

interface LanguageContextType {
    language: string;
    t: (key: string) => string;
    toggleLanguage: () => void; // 👈 thêm vào
}

export default function AdminLogin({ onLogin, onBack }: AdminLoginProps) {
  const { t, language, toggleLanguage } = useLanguage();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Top Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('back')}
          </Button>

          {/* Language Switcher */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center space-x-2"
          >
            <Globe className="w-4 h-4 text-muted-foreground" />
            <div className="relative flex bg-card border border-border/50 rounded-lg p-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={language}
                  className="absolute inset-1 bg-primary rounded-md"
                  initial={{ x: language === 'vi' ? 0 : 44 }}
                  animate={{ x: language === 'vi' ? 0 : 44 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  style={{ width: '44px' }}
                />
              </AnimatePresence>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => language !== 'vi' && toggleLanguage()}
                className={`relative z-10 h-7 w-11 px-2 text-xs font-medium transition-all duration-200 hover:scale-105 ${
                  language === 'vi' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                VIE
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => language !== 'en' && toggleLanguage()}
                className={`relative z-10 h-7 w-11 px-2 text-xs font-medium transition-all duration-200 hover:scale-105 ${
                  language === 'en' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                ENG
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Main Login Card */}
        <Card className="bg-card/90 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50 shadow-2xl shadow-red-500/10">
          <CardHeader className="text-center space-y-6">
            {/* Admin Logo */}
            <div className="flex items-center justify-center">
              <div className="relative group">
                {/* Outer glow rings */}
                <div className="absolute -inset-8 rounded-full bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent animate-pulse"></div>
                <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-red-500/15 via-red-500/8 to-transparent animate-pulse" style={{animationDelay: '0.5s'}}></div>
                
                {/* Main logo container */}
                <div className="relative">
                  {/* Background geometric pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-3xl transform rotate-6 scale-110 opacity-20"></div>
                  <div className="absolute inset-0 bg-gradient-to-tl from-orange-500 via-red-500 to-red-600 rounded-3xl transform -rotate-3 scale-105 opacity-15"></div>
                  
                  {/* Main logo */}
                  <div className="relative w-20 h-20 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-500/30 transform rotate-12 group-hover:rotate-0 transition-all duration-500 border-2 border-red-500/20">
                    {/* Inner glow */}
                    <div className="absolute inset-2 bg-gradient-to-br from-red-100/20 to-transparent rounded-2xl"></div>
                    
                    {/* Shield icon with extra styling */}
                    <div className="relative">
                      <Shield className="w-10 h-10 text-white filter drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 w-10 h-10">
                        <Shield className="w-10 h-10 text-white/30 blur-sm" />
                      </div>
                    </div>
                    
                    {/* Corner accents */}
                    <div className="absolute top-1 right-1 w-2 h-2 bg-white/40 rounded-full"></div>
                    <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-white/30 rounded-full"></div>
                  </div>
                  
                  {/* Floating particles */}
                  <div className="absolute -top-2 -right-2 w-1 h-1 bg-red-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="absolute -bottom-1 -left-2 w-0.5 h-0.5 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.8s'}}></div>
                  <div className="absolute top-1/2 -right-4 w-0.5 h-0.5 bg-red-400 rounded-full animate-pulse"></div>
                </div>
                
                {/* Energy rays */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-1/2 w-0.5 h-8 bg-gradient-to-t from-red-400/40 to-transparent transform -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute bottom-0 left-1/2 w-0.5 h-6 bg-gradient-to-b from-red-400/40 to-transparent transform -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{transitionDelay: '0.1s'}}></div>
                  <div className="absolute left-0 top-1/2 h-0.5 w-6 bg-gradient-to-l from-red-400/40 to-transparent transform -translate-y-1/2 -translate-x-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{transitionDelay: '0.2s'}}></div>
                  <div className="absolute right-0 top-1/2 h-0.5 w-8 bg-gradient-to-r from-red-400/40 to-transparent transform -translate-y-1/2 translate-x-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{transitionDelay: '0.3s'}}></div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-red-600 via-red-500 to-red-600 bg-clip-text text-transparent">
                  {t('admin_portal')}
                </CardTitle>
                <Badge variant="destructive" className="text-xs font-medium">
                  {t('restricted_access')}
                </Badge>
              </div>
              <p className="text-muted-foreground font-medium">
                {t('admin_portal_description')}
              </p>
            </div>

            {/* Security Notice */}
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    {t('high_security_area')}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {t('admin_access_warning')}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminId" className="text-foreground/90 font-medium">
                  {t('admin_id')}
                </Label>
                <Input
                  id="adminId"
                  type="text"
                  placeholder={t('enter_admin_id')}
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  className="h-12 bg-input-background/50 border-border/60 focus:border-red-500/50 focus:ring-red-500/20 rounded-xl transition-all duration-200"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground/90 font-medium">
                  {t('admin_password')}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t('enter_admin_password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-input-background/50 border-border/60 focus:border-red-500/50 focus:ring-red-500/20 rounded-xl transition-all duration-200 pr-12"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-600/20 rounded-xl transition-all duration-200 hover:shadow-xl hover:shadow-red-600/25 hover:-translate-y-0.5"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{t('authenticating')}</span>
                  </div>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    {t('access_admin_portal')}
                  </>
                )}
              </Button>
            </form>

            {/* Security Features */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground text-center font-medium">
                {t('protected_by')}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>{t('multi_factor_auth')}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>{t('encrypted_connection')}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">  
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>{t('access_logging')}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>{t('session_timeout')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Security Notice */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-xs text-muted-foreground">
            {t('admin_footer_notice')}
          </p>
          <div className="flex items-center justify-center space-x-1 text-xs text-red-600 dark:text-red-400">
            <Settings className="w-3 h-3" />
            <span>{t('system_administrator_only')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}