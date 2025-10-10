import { useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { ArrowLeft, Upload, User } from "lucide-react";
import DatePicker from "./components/DatePicker";
import { countries, getProvincesByCountry, Province } from "./data/locationData";
import { useLanguage } from "./contexts/LanguageContext";

interface ProfileSetupProps {
  onNext: () => void;
  onBack: () => void;
}

export default function ProfileSetup({ onNext, onBack }: ProfileSetupProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    identification: "",
    dateOfBirth: "",
    phone: "",
    country: "",
    province: "",
    address: ""
  });

  const [availableProvinces, setAvailableProvinces] = useState<Province[]>([]);

  const handleCountryChange = (countryCode: string) => {
    setFormData({
      ...formData,
      country: countryCode,
      province: "" // Reset province when country changes
    });
    
    // Update available provinces based on selected country
    const provinces = getProvincesByCountry(countryCode);
    setAvailableProvinces(provinces);
  };

  const handleProvinceChange = (provinceCode: string) => {
    setFormData({
      ...formData,
      province: provinceCode
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side - Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-foreground">{t('profile_setup')}</h1>
                <p className="text-muted-foreground">{t('complete_profile_to_start')}</p>
              </div>

              <div className="space-y-5">
                {/* Identification */}
                <div className="space-y-2">
                  <Label htmlFor="identification" className="text-sm font-medium text-foreground">
                    {t('identification')}
                  </Label>
                  <Input
                    id="identification"
                    type="text"
                    value={formData.identification}
                    onChange={(e) => setFormData({ ...formData, identification: e.target.value })}
                    placeholder={t('enter_id_number')}
                    className="h-11 border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary bg-input-background"
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-sm font-medium text-foreground">
                    {t('date_of_birth')}
                  </Label>
                  <DatePicker
                    placeholder={t('select_date_of_birth')}
                    className="w-full"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                    {t('phone')}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={t('enter_phone_number')}
                    className="h-11 border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary bg-input-background"
                  />
                </div>

                {/* Country and Province Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-medium text-foreground">
                      {t('country')}
                    </Label>
                    <select
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="h-11 w-full border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary bg-input-background px-3 text-sm text-foreground"
                    >
                      <option value="">{t('select_country')}</option>
                      {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province" className="text-sm font-medium text-foreground">
                      {t('province_state')}
                    </Label>
                    <select
                      id="province"
                      value={formData.province}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      disabled={!formData.country}
                      className={`h-11 w-full border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary bg-input-background px-3 text-sm text-foreground ${
                        !formData.country ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''
                      }`}
                    >
                      <option value="">
                        {!formData.country ? t('select_country_first') : t('select_province_state')}
                      </option>
                      {availableProvinces.map((province) => (
                        <option key={province.code} value={province.code}>
                          {province.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-foreground">
                    {t('address')}
                  </Label>
                  <Input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder={t('street_address_placeholder')}
                    className="h-11 border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary bg-input-background"
                  />
                </div>
              </div>
            </div>

            {/* Right Side - Avatar Upload */}
            <div className="flex flex-col items-center justify-start space-y-4 pt-12">
              {/* Avatar Placeholder */}
              <div className="relative">
                <div className="w-32 h-32 bg-muted rounded-full border-2 border-border flex items-center justify-center">
                  <User className="w-12 h-12 text-muted-foreground" />
                </div>
                {/* Upload indicator */}
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                  <Upload className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>

              {/* Upload Button */}
              <Button
                variant="outline"
                className="px-6 py-2 border-border text-foreground hover:bg-accent rounded-lg"
              >
                {t('upload_image')}
              </Button>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="flex justify-between items-center mt-12 pt-6 border-t border-border">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground px-4 py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('back')}</span>
            </Button>

            {/* Next Button */}
            <Button
              onClick={onNext}
              className="px-8 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
            >
              {t('next')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}