import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ArrowLeft, Users, Car, Zap, ShieldCheck, Wrench, GraduationCap } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface RoleSelectionProps {
  onSelectRole: (role: 'driver' | 'staff') => void;
  onBack: () => void;
}

export default function RoleSelection({ onSelectRole, onBack }: RoleSelectionProps) {
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<'driver' | 'staff' | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      onSelectRole(selectedRole);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative group">
              <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent animate-pulse"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('choose_your_role')}
          </h1>
          <p className="text-muted-foreground">
            {t('select_account_type')}
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Driver Card */}
          <Card 
            className={`p-8 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 border-2 ${
              selectedRole === 'driver' 
                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20' 
                : 'border-border/50 bg-card/80 backdrop-blur-sm'
            }`}
            onClick={() => setSelectedRole('driver')}
          >
            <div className="text-center space-y-4">
              {/* Icon */}
              <div className={`relative mx-auto w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                selectedRole === 'driver'
                  ? 'bg-primary shadow-lg shadow-primary/30'
                  : 'bg-muted'
              }`}>
                <Car className={`w-10 h-10 transition-colors duration-300 ${
                  selectedRole === 'driver' ? 'text-primary-foreground' : 'text-muted-foreground'
                }`} />
                {selectedRole === 'driver' && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Zap className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {t('driver_account')}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {t('driver_description')}
                </p>
              </div>

              {/* Features */}
              <div className="space-y-2 text-left">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span className="text-muted-foreground">{t('find_charging_stations')}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span className="text-muted-foreground">{t('book_charging_slots')}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span className="text-muted-foreground">{t('manage_vehicles')}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span className="text-muted-foreground">{t('payment_history')}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Staff Card */}
          <Card 
            className={`p-8 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-secondary/10 hover:-translate-y-1 border-2 ${
              selectedRole === 'staff' 
                ? 'border-secondary bg-secondary/5 shadow-lg shadow-secondary/20' 
                : 'border-border/50 bg-card/80 backdrop-blur-sm'
            }`}
            onClick={() => setSelectedRole('staff')}
          >
            <div className="text-center space-y-4">
              {/* Icon */}
              <div className={`relative mx-auto w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                selectedRole === 'staff'
                  ? 'bg-secondary shadow-lg shadow-secondary/30'
                  : 'bg-muted'
              }`}>
                <ShieldCheck className={`w-10 h-10 transition-colors duration-300 ${
                  selectedRole === 'staff' ? 'text-secondary-foreground' : 'text-muted-foreground'
                }`} />
                {selectedRole === 'staff' && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-secondary rounded-full flex items-center justify-center">
                    <GraduationCap className="w-3 h-3 text-secondary-foreground" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {t('staff_account')}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {t('staff_description')}
                </p>
              </div>

              {/* Features */}
              <div className="space-y-2 text-left">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-1.5 h-1.5 bg-secondary rounded-full"></div>
                  <span className="text-muted-foreground">{t('manage_stations')}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-1.5 h-1.5 bg-secondary rounded-full"></div>
                  <span className="text-muted-foreground">{t('customer_support')}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-1.5 h-1.5 bg-secondary rounded-full"></div>
                  <span className="text-muted-foreground">{t('maintenance_reports')}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-1.5 h-1.5 bg-secondary rounded-full"></div>
                  <span className="text-muted-foreground">{t('analytics_dashboard')}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center justify-center space-x-2 h-12 bg-card/50 border-border/60 hover:bg-accent/50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('back')}</span>
          </Button>
          
          <Button
            onClick={handleContinue}
            disabled={!selectedRole}
            className={`flex-1 h-12 transition-all duration-200 ${
              selectedRole === 'driver'
                ? 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20'
                : selectedRole === 'staff'
                ? 'bg-gradient-to-r from-secondary to-secondary/90 hover:from-secondary/90 hover:to-secondary shadow-lg shadow-secondary/20 text-secondary-foreground'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            {selectedRole ? t('continue_as') + ' ' + (selectedRole === 'driver' ? t('driver') : t('staff')) : t('select_role_to_continue')}
          </Button>
        </div>

        {/* Info Footer */}
        <div className="text-center mt-8">
          <p className="text-muted-foreground/70 text-sm">
            {t('role_change_note')}
          </p>
        </div>
      </div>
    </div>
  );
}