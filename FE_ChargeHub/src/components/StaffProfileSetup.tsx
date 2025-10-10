import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { ArrowLeft, ArrowRight, User, Mail, Phone, MapPin, Calendar, FileText } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { countries } from "../data/locationData";

interface StaffProfileSetupProps {
  onNext: () => void;
  onBack: () => void;
}

export default function StaffProfileSetup({ onNext, onBack }: StaffProfileSetupProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    country: "",
    state: "",
    address: "",
    bio: "",
    emergencyContact: "",
    emergencyPhone: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Reset state when country changes
      ...(field === 'country' ? { state: '' } : {})
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'country'];
    const hasEmptyFields = requiredFields.some(field => !formData[field as keyof typeof formData]);
    
    if (!hasEmptyFields) {
      onNext();
    }
  };

  const getStatesForCountry = (countryCode: string) => {
    const country = countries.find(c => c.name === countryCode);
    return country ? country.provinces : [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl flex items-center justify-center shadow-xl shadow-secondary/20">
                <User className="w-8 h-8 text-secondary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <FileText className="w-3 h-3 text-primary-foreground" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('staff_profile_setup')}
          </h1>
          <p className="text-muted-foreground">
            {t('complete_staff_profile')}
          </p>
        </div>

        {/* Form Card */}
        <Card className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-2xl shadow-secondary/5 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <User className="w-5 h-5 text-secondary" />
                <h3 className="text-lg font-semibold text-foreground">{t('personal_information')}</h3>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-foreground/90 font-medium">
                    {t('first_name')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="h-12 bg-input-background/50 border-border/60 rounded-xl focus:border-secondary/50 focus:ring-secondary/20"
                    placeholder={t('enter_first_name')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-foreground/90 font-medium">
                    {t('last_name')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="h-12 bg-input-background/50 border-border/60 rounded-xl focus:border-secondary/50 focus:ring-secondary/20"
                    placeholder={t('enter_last_name')}
                    required
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground/90 font-medium flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>{t('email')} <span className="text-destructive">*</span></span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="h-12 bg-input-background/50 border-border/60 rounded-xl focus:border-secondary/50 focus:ring-secondary/20"
                    placeholder={t('enter_email')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground/90 font-medium flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>{t('phone')} <span className="text-destructive">*</span></span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="h-12 bg-input-background/50 border-border/60 rounded-xl focus:border-secondary/50 focus:ring-secondary/20"
                    placeholder={t('enter_phone')}
                    required
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-foreground/90 font-medium flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{t('date_of_birth')}</span>
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="h-12 bg-input-background/50 border-border/60 rounded-xl focus:border-secondary/50 focus:ring-secondary/20"
                />
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="w-5 h-5 text-secondary" />
                <h3 className="text-lg font-semibold text-foreground">{t('location_information')}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-foreground/90 font-medium">
                    {t('country')} <span className="text-destructive">*</span>
                  </Label>
                  <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                    <SelectTrigger className="h-12 bg-input-background/50 border-border/60 rounded-xl focus:border-secondary/50 focus:ring-secondary/20">
                      <SelectValue placeholder={t('select_country')} />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.name}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-foreground/90 font-medium">
                    {t('state_province')}
                  </Label>
                  <Select 
                    value={formData.state} 
                    onValueChange={(value) => handleInputChange('state', value)}
                    disabled={!formData.country}
                  >
                    <SelectTrigger className="h-12 bg-input-background/50 border-border/60 rounded-xl focus:border-secondary/50 focus:ring-secondary/20">
                      <SelectValue placeholder={t('select_state')} />
                    </SelectTrigger>
                    <SelectContent>
                      {getStatesForCountry(formData.country).map((province) => (
                        <SelectItem key={province.code} value={province.name}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-foreground/90 font-medium">
                  {t('address')}
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="min-h-[80px] bg-input-background/50 border-border/60 rounded-xl focus:border-secondary/50 focus:ring-secondary/20 resize-none"
                  placeholder={t('enter_address')}
                />
              </div>
            </div>

            {/* Emergency Contact Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Phone className="w-5 h-5 text-secondary" />
                <h3 className="text-lg font-semibold text-foreground">{t('emergency_contact')}</h3>
                <span className="text-xs text-muted-foreground">({t('optional')})</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact" className="text-foreground/90 font-medium">
                    {t('contact_name')}
                  </Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    className="h-12 bg-input-background/50 border-border/60 rounded-xl focus:border-secondary/50 focus:ring-secondary/20"
                    placeholder={t('enter_contact_name')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone" className="text-foreground/90 font-medium">
                    {t('contact_phone')}
                  </Label>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                    className="h-12 bg-input-background/50 border-border/60 rounded-xl focus:border-secondary/50 focus:ring-secondary/20"
                    placeholder={t('enter_contact_phone')}
                  />
                </div>
              </div>
            </div>

            {/* Bio Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-5 h-5 text-secondary" />
                <h3 className="text-lg font-semibold text-foreground">{t('professional_bio')}</h3>
                <span className="text-xs text-muted-foreground">({t('optional')})</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-foreground/90 font-medium">
                  {t('bio_description')}
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="min-h-[100px] bg-input-background/50 border-border/60 rounded-xl focus:border-secondary/50 focus:ring-secondary/20 resize-none"
                  placeholder={t('enter_bio')}
                  maxLength={500}
                />
                <div className="text-right text-xs text-muted-foreground">
                  {formData.bio.length}/500
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex items-center justify-center space-x-2 h-12 bg-card/50 border-border/60 hover:bg-accent/50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('back')}</span>
              </Button>
              
              <Button
                type="submit"
                className="flex-1 h-12 bg-gradient-to-r from-secondary to-secondary/90 hover:from-secondary/90 hover:to-secondary shadow-lg shadow-secondary/20 text-secondary-foreground flex items-center justify-center space-x-2"
              >
                <span>{t('continue_to_education')}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </Card>

        {/* Progress Indicator */}
        <div className="flex justify-center mt-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-2 bg-secondary rounded-full"></div>
            <div className="w-8 h-2 bg-muted rounded-full"></div>
            <div className="w-8 h-2 bg-muted rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}