import { useState } from "react";
import { Zap, Edit3, Check, X, Plus, Minus } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useLanguage } from "../contexts/LanguageContext";
import { toast } from  "sonner";

interface BatteryInputProps {
  currentBattery?: number;
  onUpdate?: (batteryLevel: number) => void;
}

export default function BatteryInput({ currentBattery = 75, onUpdate }: BatteryInputProps) {
  const [batteryLevel, setBatteryLevel] = useState(currentBattery);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(currentBattery.toString());
  const { t } = useLanguage();

  const handleUpdate = () => {
    const newLevel = parseInt(inputValue);
    if (newLevel >= 0 && newLevel <= 100) {
      setBatteryLevel(newLevel);
      setIsEditing(false);
      onUpdate?.(newLevel);
      toast.success(t('battery_level_updated'));
    } else {
      toast.error("Battery level must be between 0-100%");
      setInputValue(batteryLevel.toString());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUpdate();
    } else if (e.key === 'Escape') {
      setInputValue(batteryLevel.toString());
      setIsEditing(false);
    }
  };

  const getBatteryColor = (level: number) => {
    if (level <= 20) return "text-destructive";
    if (level <= 50) return "text-yellow-500";
    return "text-primary";
  };

  const incrementBattery = () => {
    const newLevel = Math.min(100, batteryLevel + 1);
    setBatteryLevel(newLevel);
    setInputValue(newLevel.toString());
    onUpdate?.(newLevel);
  };

  const decrementBattery = () => {
    const newLevel = Math.max(0, batteryLevel - 1);
    setBatteryLevel(newLevel);
    setInputValue(newLevel.toString());
    onUpdate?.(newLevel);
  };

  return (
    <div className="space-y-4">
      {/* Single Battery Level Card */}
      <div className="bg-gradient-to-br from-card to-card/95 rounded-xl p-4 shadow-lg border border-border/50 backdrop-blur-sm">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-primary animate-pulse" />
            <div>
              <span className="font-semibold text-card-foreground">{t('current_battery')}</span>
              <div className="text-xs text-muted-foreground">{t('battery_percentage')}</div>
            </div>
          </div>

          {/* Direct Number Input with Controls */}
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={decrementBattery}
              disabled={batteryLevel <= 0}
              className="w-8 h-8 p-0"
            >
              <Minus className="w-4 h-4" />
            </Button>
            
            <div className="text-center min-w-[100px]">
              <Input
                type="number"
                min="0"
                max="100"
                value={inputValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setInputValue(value);
                  const numValue = parseInt(value);
                  if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                    setBatteryLevel(numValue);
                    onUpdate?.(numValue);
                  }
                }}
                onBlur={() => {
                  const numValue = parseInt(inputValue);
                  if (isNaN(numValue) || numValue < 0 || numValue > 100) {
                    setInputValue(batteryLevel.toString());
                    toast.error("Battery level must be between 0-100%");
                  }
                }}
                className={`text-center text-2xl font-bold border-2 ${getBatteryColor(batteryLevel)} bg-transparent`}
                placeholder="0-100"
              />
              <div className="text-xs text-muted-foreground mt-1">Enter 0-100%</div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={incrementBattery}
              disabled={batteryLevel >= 100}
              className="w-8 h-8 p-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Battery Bar Visualization */}
          <div className="relative mb-4">
            <div className="w-full bg-muted/50 h-3 rounded-full overflow-hidden shadow-inner">
              <div 
                className={`h-full transition-all duration-700 ease-out rounded-full ${
                  batteryLevel <= 20 ? 'bg-gradient-to-r from-destructive to-destructive/80' :
                  batteryLevel <= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 
                  'bg-gradient-to-r from-primary to-primary/80'
                }`}
                style={{ width: `${batteryLevel}%` }}
              >
                <div className="h-full w-full bg-white/20 rounded-full"></div>
              </div>
            </div>
            {/* Battery percentage markers */}
            <div className="flex justify-between mt-1 px-1">
              <span className="text-xs text-muted-foreground">0%</span>
              <span className="text-xs text-muted-foreground">50%</span>
              <span className="text-xs text-muted-foreground">100%</span>
            </div>
          </div>

          {/* Quick Level Display */}
          <div className="text-center mb-4">
            <div className={`text-3xl font-bold ${getBatteryColor(batteryLevel)}`}>
              {batteryLevel}%
            </div>
            <div className="text-sm text-muted-foreground">Current Battery Level</div>
          </div>

          {/* Quick Set Options */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground text-center">Quick Set Options:</div>
            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 75, 100].map(level => (
                <Button
                  key={level}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInputValue(level.toString());
                    setBatteryLevel(level);
                    onUpdate?.(level);
                    toast.success(t('battery_level_updated'));
                  }}
                  className={`transition-all hover:scale-105 ${
                    batteryLevel === level ? 'border-primary bg-primary/10' : ''
                  } ${
                    level <= 20 ? 'text-destructive hover:bg-destructive/10' :
                    level <= 50 ? 'text-yellow-600 hover:bg-yellow-500/10' :
                    'text-primary hover:bg-primary/10'
                  }`}
                >
                  {level}%
                </Button>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">{t('estimated_range')}</div>
              <div className="font-semibold text-card-foreground text-sm">
                {Math.round(batteryLevel * 3.2)} km
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Status</div>
              <div className={`font-semibold text-sm ${
                batteryLevel <= 20 ? 'text-destructive' :
                batteryLevel <= 50 ? 'text-yellow-600' : 'text-primary'
              }`}>
                {batteryLevel <= 20 ? 'Low' : batteryLevel <= 50 ? 'Medium' : 'Good'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Battery Status Warning */}
      {batteryLevel <= 20 && (
        <div className="flex items-center space-x-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20 animate-pulse">
          <Zap className="w-4 h-4 text-destructive" />
          <span className="text-sm text-destructive font-medium">
            {t('low_battery_warning')}
          </span>
        </div>
      )}
    </div>
  );
}