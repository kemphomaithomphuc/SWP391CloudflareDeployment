import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Button } from "./ui/button";
import { Sun, Moon } from "lucide-react";

export default function QuickControls() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center space-x-2">
      {/* Language Toggle - Simple */}
      <div className="flex items-center bg-card/90 backdrop-blur-sm border border-border rounded-full p-1 shadow-lg">
        <Button
          variant={language === 'vi' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setLanguage('vi')}
          className="h-7 px-3 rounded-full text-xs font-medium"
        >
          VI
        </Button>
        <Button
          variant={language === 'en' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setLanguage('en')}
          className="h-7 px-3 rounded-full text-xs font-medium"
        >
          EN
        </Button>
      </div>

      {/* Theme Toggle - Simple */}
      <Button
        variant="outline"
        size="sm"
        onClick={toggleTheme}
        className="h-9 w-9 p-0 rounded-full bg-card/90 backdrop-blur-sm border-border shadow-lg hover:scale-105 transition-transform"
      >
        {theme === 'light' ? (
          <Sun className="w-4 h-4" />
        ) : (
          <Moon className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}