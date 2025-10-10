import { useLanguage } from "./contexts/LanguageContext";
import { useTheme } from "./contexts/ThemeContext";
import { Button } from "./components/ui/button";
import { Globe, Sun, Moon } from "lucide-react";

export default function TestLanguage() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Language & Theme Test</h1>
        
        <div className="space-y-4">
          <div>
            <p>Current language: <strong>{language}</strong></p>
            <p>Dashboard translation: <strong>{t('dashboard')}</strong></p>
            <p>Customer Support translation: <strong>{t('customer_support')}</strong></p>
          </div>

          <Button 
            onClick={() => setLanguage(language === "en" ? "vi" : "en")}
            className="w-full"
          >
            <Globe className="w-4 h-4 mr-2" />
            Switch to {language === "en" ? "Tiếng Việt" : "English"}
          </Button>

          <Button 
            onClick={toggleTheme}
            variant="outline"
            className="w-full"
          >
            {theme === "light" ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />}
            Switch to {theme === "light" ? "Dark" : "Light"} Theme
          </Button>
        </div>
      </div>
    </div>
  );
}