import { useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { ArrowLeft, Upload, User, X } from "lucide-react";
import DatePicker from "./components/DatePicker";
import { countries, getProvincesByCountry, Province } from "./data/locationData";
import { useLanguage } from "./contexts/LanguageContext";
import { api } from "./services/api";


interface ProfileSetupProps {
  onNext: () => void;
  onBack: () => void;
}
interface RegisterUser {
  userId: string;
  dateOfBirth: string;
  phone: string;
  country: string;
  province: string;
  address: string;
}

export default function ProfileSetup({ onNext, onBack }: ProfileSetupProps) {
  const { t, language, setLanguage } = useLanguage();
  const [formData, setFormData] = useState({
    dateOfBirth: "",
    phone: "",
    country: "",
    province: "",
    address: ""
  });
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null); // Raw error từ API

  const [availableProvinces, setAvailableProvinces] = useState<Province[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // Validation functions
  const validatePhone = (phone: string): boolean => {
    // 10 số, số đầu phải là 0
    const phoneRegex = /^0\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };
  
  const validateAge = (dateOfBirth: string): boolean => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 18;
    }
    return age >= 18;
  };
  
  const validateDateInPast = (date: string): boolean => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate < today;
  };

  const callApiForProfileSetup = async (data: RegisterUser) => {
    setLoading(true);
    setError(null);
    setErrorKey(null);
    try {
      // Try to get userId from different sources
      const userId = localStorage.getItem("registeredUserId") || localStorage.getItem("userId") || "";
      console.log("Submitting profile for userId:", userId);
      
      if (!userId) {
        setErrorKey('User ID not found');
        setLoading(false);
        return;
      }
      
      const res = await api.put(`/api/user/profile/${userId}`, {
        userId: parseInt(userId),
        phoneNumber: data.phone,
        address: data.address + (data.province ? `, ${data.province}` : '') + (data.country ? `, ${data.country}` : ''),
        dateOfBirth: data.dateOfBirth
      });
      console.log("Profile submission response:", res);
      if (res.status === 200 || res.status === 201) {
        console.log("Profile submitted successfully");
        setLoading(false);
        onNext();
      } else {
        setErrorKey('Error submitting profile');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Profile submission error:', err);
      const apiError = err?.response?.data?.message;
      if (apiError) {
        setError(apiError); // Raw message từ API
      } else {
        setErrorKey('Error submitting profile');
      }
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    // Reset errors
    setErrorKey(null);
    setError(null);
    
    // Validate date of birth
    if (!formData.dateOfBirth) {
      setErrorKey('Date of birth is required');
      return;
    }
    if (!validateDateInPast(formData.dateOfBirth)) {
      setErrorKey('Date of birth must be in the past');
      return;
    }
    if (!validateAge(formData.dateOfBirth)) {
      setErrorKey('You must be at least 18 years old');
      return;
    }
    
    // Validate phone
    if (!formData.phone.trim()) {
      setErrorKey('Phone number is required');
      return;
    }
    if (!validatePhone(formData.phone)) {
      setErrorKey('Phone must be 10 digits and start with 0');
      return;
    }
    
    // Validate country
    if (!formData.country) {
      setErrorKey('Country is required');
      return;
    }
    
    // Validate province
    if (!formData.province) {
      setErrorKey('Province is required');
      return;
    }
    
    // Validate address
    if (!formData.address.trim()) {
      setErrorKey('Address is required');
      return;
    }
    if (formData.address.length > 500) {
      setErrorKey('Address must not exceed 500 characters');
      return;
    }

    // Prepare data for API
    const profileData: RegisterUser = {
      userId: localStorage.getItem("registeredUserId") || "",
      dateOfBirth: formData.dateOfBirth,
      phone: formData.phone,
      country: formData.country,
      province: formData.province,
      address: formData.address
    };

    callApiForProfileSetup(profileData);
  };

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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type - chỉ cho phép ảnh
      if (!file.type.startsWith('image/')) {
        setErrorKey('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorKey('Image file is too large');
        return;
      }

      // Clear any previous errors
      setErrorKey(null);
      
      // Đọc file và chuyển thành base64 để hiển thị
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          {/* Language Switcher - Top Right */}
          <div className="flex justify-end mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                  language === "en"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("vi")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                  language === "vi"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                VI
              </button>
            </div>
          </div>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side - Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-foreground">{t('profile_setup')}</h1>
                <p className="text-muted-foreground">
                  {localStorage.getItem("token") ? t('complete_profile_to_continue') : t('complete_profile_to_start')}
                </p>
                
                {/* Error Display */}
                {(error || errorKey) && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mt-2">
                    {error || (errorKey && t(errorKey))}
                  </div>
                )}
              </div>

              <div className="space-y-5">
                {/* Date of Birth */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-sm font-medium text-foreground">
                    {t('date_of_birth')}
                  </Label>
                  <DatePicker
                    placeholder={t('select_date_of_birth')}
                    className="w-full"
                    value={formData.dateOfBirth}
                    onChange={(date) => setFormData({ ...formData, dateOfBirth: date })}
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
                      aria-label={t('country')}
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
                      aria-label={t('province_state')}
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
              {/* Avatar Display */}
              <div className="relative">
                <div className="w-32 h-32 bg-muted rounded-full border-2 border-border flex items-center justify-center overflow-hidden">
                  {profileImage ? (
                    <img 
                      src={profileImage} 
                      alt="Profile" 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                
                {/* Upload indicator or Remove button */}
                {profileImage ? (
                  <button
                    onClick={handleRemoveImage}
                    aria-label={t('Remove image')}
                    title={t('Remove image')}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                ) : (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                    <Upload className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                id="profile-image-upload"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                aria-label={t('Upload profile image')}
              />

              {/* Upload Button */}
              <Button
                variant="outline"
                onClick={() => document.getElementById('profile-image-upload')?.click()}
                className="px-6 py-2 border-border text-foreground hover:bg-accent rounded-lg"
              >
                {profileImage ? t('change_image') : t('upload_image')}
              </Button>
              
              {/* File info */}
              <div className="text-center space-y-1">
                <p className="text-xs text-muted-foreground max-w-32">
                  {t('supported_formats')}<br/>
                  {t('max_size')}
                </p>
                <p className="text-xs text-primary/70 italic max-w-40">
                  {t('Avatar can be updated later')}
                </p>
              </div>
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
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg disabled:opacity-50"
            >
              {loading ? t('submitting_profile') : t('next')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}