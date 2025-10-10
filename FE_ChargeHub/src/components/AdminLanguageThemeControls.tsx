import React from "react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { motion, AnimatePresence } from "motion/react";
import { Sun, Moon, Globe } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

export default function AdminLanguageThemeControls() {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();

  return (
    <div className="flex items-center space-x-4">
      {/* Theme Toggle */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center space-x-2"
      >
        <motion.div
          animate={{ 
            scale: theme === 'light' ? 1.1 : 1,
            color: theme === 'light' ? '#f59e0b' : '#6b7280'
          }}
          transition={{ duration: 0.2 }}
        >
          <Sun className="w-4 h-4" />
        </motion.div>
        <Switch
          checked={theme === 'dark'}
          onCheckedChange={toggleTheme}
          className="transition-all duration-200"
        />
        <motion.div
          animate={{ 
            scale: theme === 'dark' ? 1.1 : 1,
            color: theme === 'dark' ? '#3b82f6' : '#6b7280'
          }}
          transition={{ duration: 0.2 }}
        >
          <Moon className="w-4 h-4" />
        </motion.div>
      </motion.div>

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
    </div>
  );
}