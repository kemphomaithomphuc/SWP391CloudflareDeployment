import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Button } from "./ui/button";
import { 
  Sun, 
  Moon, 
  Languages,
  Globe,
  Sparkles
} from "lucide-react";

export default function LanguageThemeControls() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  return (
    <>
      {/* Desktop Version */}
      <div className="fixed top-4 right-4 z-50 hidden sm:flex items-center space-x-3">
        {/* Language Toggle */}
        <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded-2xl shadow-lg shadow-black/5 p-1">
          <div className="flex items-center relative">
            {/* Background slider */}
            <div 
              className={`absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-primary via-primary/90 to-primary/80 rounded-xl transition-all duration-300 ease-out shadow-sm ${
                language === 'vi' ? 'left-0' : 'left-1/2'
              }`}
            />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage('vi')}
              className={`relative z-10 h-8 px-4 rounded-xl text-xs font-medium transition-all duration-300 ease-out ${
                language === 'vi' 
                  ? 'text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              } hover:bg-transparent`}
            >
              🇻🇳 VI
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage('en')}
              className={`relative z-10 h-8 px-4 rounded-xl text-xs font-medium transition-all duration-300 ease-out ${
                language === 'en' 
                  ? 'text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              } hover:bg-transparent`}
            >
              🇺🇸 EN
            </Button>
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded-2xl shadow-lg shadow-black/5">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-10 w-10 p-0 rounded-xl transition-all duration-300 ease-out hover:scale-105 group relative"
          >
            <div className="relative">
              {theme === 'light' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-500 group-hover:text-amber-600 transition-colors duration-200" />
                  <Sparkles className="w-2 h-2 text-amber-400 absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors duration-200" />
                  <div className="w-1 h-1 bg-blue-300 rounded-full absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </>
              )}
            </div>
          </Button>
        </div>

        {/* Current Language Indicator */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-primary/20 border border-primary/30 rounded-2xl shadow-lg shadow-primary/10 px-3 py-2">
          <div className="flex items-center space-x-2">
            <Globe className="w-3 h-3 text-primary animate-pulse" />
            <span className="text-xs font-medium text-primary">
              {language === 'vi' ? 'Tiếng Việt' : 'English'}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Version */}
      <div className="fixed top-3 right-3 z-50 flex sm:hidden items-center space-x-2">
        {/* Compact Language Toggle */}
        <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded-xl shadow-lg p-1">
          <div className="flex items-center relative">
            <div 
              className={`absolute top-0 bottom-0 w-1/2 bg-primary rounded-lg transition-all duration-300 ease-out ${
                language === 'vi' ? 'left-0' : 'left-1/2'
              }`}
            />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage('vi')}
              className={`relative z-10 h-7 px-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                language === 'vi' 
                  ? 'text-primary-foreground' 
                  : 'text-muted-foreground'
              } hover:bg-transparent`}
            >
              VI
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage('en')}
              className={`relative z-10 h-7 px-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                language === 'en' 
                  ? 'text-primary-foreground' 
                  : 'text-muted-foreground'
              } hover:bg-transparent`}
            >
              EN
            </Button>
          </div>
        </div>

        {/* Compact Theme Toggle */}
        <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded-xl shadow-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-8 w-8 p-0 rounded-lg transition-all duration-300 hover:scale-105"
          >
            {theme === 'light' ? (
              <Sun className="w-3 h-3 text-amber-500" />
            ) : (
              <Moon className="w-3 h-3 text-blue-400" />
            )}
          </Button>
        </div>
      </div>
    </>
  );
}