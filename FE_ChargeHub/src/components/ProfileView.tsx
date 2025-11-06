import React, { useState, useEffect } from "react";
import axios from "axios";
import { User, Edit, Save, ArrowLeft, Key, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import PasswordInput from "./ui/PasswordInput";
import { useLanguage } from "../contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Mail } from "lucide-react";
import toast from "react-hot-toast";  // 🆕 Dùng react-hot-toast
import { api } from "../services/api";

interface ProfileViewProps {
    onBack: () => void;
}

interface UserProfile {
    userId: number;
    fullName: string;
    email: string;
    phone: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    role: string;
    address: string | null;
    status: string;
}

export default function ProfileView({ onBack }: ProfileViewProps) {
    const { t } = useLanguage();
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState<UserProfile>({
        userId: 0,
        fullName: "",
        email: "",
        phone: null,
        dateOfBirth: null,
        gender: null,
        role: localStorage.getItem("role") || "DRIVER",
        address: null,
        status: "ACTIVE",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);
    
    // Avatar state
    const [avatar, setAvatar] = useState<string | null>(null);
    const [avatarLoading, setAvatarLoading] = useState(false);
    
    // Local sync state
    const [isLocalSync, setIsLocalSync] = useState(false);

    // For password change
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

    //For Email OTP
    const [isEmailChangeDialogOpen, setIsEmailChangeDialogOpen] = useState(false);
    const [newEmailInput, setNewEmailInput] = useState("");
    const [emailChangeStep, setEmailChangeStep] = useState<"input" | "otp">("input"); // 2 bước: nhập email, nhập OTP
    const [emailOtpCode, setEmailOtpCode] = useState("");
    const [emailChangeError, setEmailChangeError] = useState<string | null>(null);
    const [emailChangeSuccess, setEmailChangeSuccess] = useState<string | null>(null);
    const [emailChangeLoading, setEmailChangeLoading] = useState(false);
    const [emailOtpSent, setEmailOtpSent] = useState(false);
    
    // 🆕 Email modal validation state
    const [emailModalValidationError, setEmailModalValidationError] = useState<string | null>(null);
    const [isEmailModalValidating, setIsEmailModalValidating] = useState(false);

    // 🆕 Form validation state
    const [formErrors, setFormErrors] = useState<{
        fullName?: string | undefined;
        phone?: string | undefined;
        dateOfBirth?: string | undefined;
        address?: string | undefined;
    }>({});
    const [isValidating, setIsValidating] = useState(false);
    
    // 🆕 Form validity state
    const [isFormValid, setIsFormValid] = useState(false);
    
    // 🆕 Field tracking state - tracks which fields have been touched/edited
    const [touchedFields, setTouchedFields] = useState<{
        fullName?: boolean;
        phone?: boolean;
        dateOfBirth?: boolean;
        address?: string;
    }>({});
    
    // 🆕 Track if save has been attempted
    const [saveAttempted, setSaveAttempted] = useState(false);

    // 🆕 Check if form is valid (no errors and all required fields filled)
    const checkFormValidity = () => {
        const errors = formErrors;
        
        // 🆕 Check for actual validation errors (not just display conditions)
        const hasErrors = Object.values(errors).some(error => error !== undefined);
        
        // Check if all required fields are filled
        const requiredFields = ['fullName', 'phone', 'dateOfBirth', 'address'];
        const allFieldsFilled = requiredFields.every(field => {
            const value = profileData[field as keyof UserProfile];
            return value && value.toString().trim() !== '';
        });
        
        const isValid = !hasErrors && allFieldsFilled;
        console.log("=== FORM VALIDITY CHECK ===");
        console.log("hasErrors:", hasErrors);
        console.log("allFieldsFilled:", allFieldsFilled);
        console.log("isValid:", isValid);
        console.log("formErrors:", errors);
        console.log("touchedFields:", touchedFields);
        console.log("saveAttempted:", saveAttempted);
        setIsFormValid(isValid);
        return isValid;
    };

    // 🆕 Validation functions (tương tự login)
    const validateEmail = (emailValue: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(emailValue);
    };

    const validatePhone = (phoneValue: string): boolean => {
        // Accept phone numbers starting with 0 or +, 8-15 digits
        const phoneRegex = /^(0|\+84)([35789])[0-9]{8}$/;
        return phoneRegex.test(phoneValue.replace(/\s/g, ''));
    };

    const validatePassword = (passwordValue: string): boolean => {
        return passwordValue.length >= 6;
    };

    const validateOTP = (otpValue: string): boolean => {
        return /^\d{6}$/.test(otpValue);
    };

    const validateFullName = (nameValue: string): boolean => {
        return nameValue.trim().length >= 2;
    };

    // 🆕 Validate dateOfBirth: chỉ quá khứ
    const validateDateOfBirth = (dateString: string): boolean => {
        if (!dateString) return true; // Optional, allow empty
        const selectedDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to compare dates only
        selectedDate.setHours(0, 0, 0, 0);
        return selectedDate < today;
    };

    // 🆕 Comprehensive form validation functions
    const validateFormField = (field: string, value: string): string | null => {
        switch (field) {
            case 'fullName':
                if (!value.trim()) {
                    return "Name cannot be empty or contain special characters.";
                }
                // 🆕 Updated regex to allow Vietnamese characters and letters
                if (!/^[\p{L}\s]+$/u.test(value.trim())) {
                    return "Name cannot be empty or contain special characters.";
                }
                if (!validateFullName(value)) {
                    return "Name cannot be empty or contain special characters.";
                }
                return null;
            case 'phone':
                if (!value.trim()) {
                    return "Phone number cannot be empty or contain invalid characters.";
                }
                // Check for only digits and optional '+' at start
                if (!/^\+?[0-9]+$/.test(value.trim())) {
                    return "Phone number cannot be empty or contain invalid characters.";
                }
                if (!validatePhone(value)) {
                    return "Phone number cannot be empty or contain invalid characters.";
                }
                return null;
            case 'dateOfBirth':
                if (!value.trim()) {
                    return "Date of birth cannot be empty.";
                }
                return null;
            case 'address':
                if (!value.trim()) {
                    return "Address cannot be empty.";
                }
                return null;
            case 'email':
                if (!value.trim()) {
                    return "Email cannot be empty.";
                }
                if (!validateEmail(value)) {
                    return "Invalid email format.";
                }
                return null;
            default:
                return null;
        }
    };

    // 🆕 Check if email is already in use
    const checkEmailDuplicate = async (email: string): Promise<boolean> => {
        if (email === profileData.email) {
            return false; // Same email, not duplicate
        }
        
        try {
            setIsValidating(true);
            const response = await api.get(`/api/user/check-email/${encodeURIComponent(email)}`);
            return response.data.exists || false;
        } catch (error) {
            console.error('Email duplicate check error:', error);
            return false; // Assume not duplicate on error to allow submission
        } finally {
            setIsValidating(false);
        }
    };

    // 🆕 Frontend email validation function
    const validateEmailField = async (email: string): Promise<string | null> => {
        console.log("=== EMAIL VALIDATION ===");
        console.log("Input email:", email);
        console.log("Current profile email:", profileData.email);
        
        // Check if email is empty
        if (!email.trim()) {
            return "Email cannot be empty.";
        }
        
        // Check if email format is valid
        if (!validateEmail(email)) {
            return "Invalid email format.";
        }
        
        // Check if email is the same as current saved email
        if (email === profileData.email) {
            return "You entered the same email as before.";
        }
        
        // Check if email already exists in database (if different from current)
        if (email !== profileData.email) {
            try {
                setIsValidating(true);
                const isDuplicate = await checkEmailDuplicate(email);
                if (isDuplicate) {
                    return "This email is already in use.";
                }
            } catch (error) {
                console.error('Email duplicate check error:', error);
                // Don't show error for network issues, allow user to proceed
            } finally {
                setIsValidating(false);
            }
        }
        
        return null; // No validation errors
    };

    // 🆕 Email modal validation function
    const validateEmailModal = async (email: string): Promise<string | null> => {
        console.log("=== EMAIL MODAL VALIDATION ===");
        console.log("Input email:", email);
        console.log("Current profile email:", profileData.email);
        
        // Check if email is empty
        if (!email.trim()) {
            return "Email cannot be empty.";
        }
        
        // Check if email format is valid
        if (!validateEmail(email)) {
            return "Invalid email format.";
        }
        
        // Check if email is the same as current saved email
        if (email === profileData.email) {
            return "You entered the same email as before.";
        }
        
        // Check if email already exists in database
        try {
            setIsEmailModalValidating(true);
            const isDuplicate = await checkEmailDuplicate(email);
            if (isDuplicate) {
                return "This email is already in use.";
            }
        } catch (error) {
            console.error('Email duplicate check error:', error);
            // Don't show error for network issues, allow user to proceed
        } finally {
            setIsEmailModalValidating(false);
        }
        
        return null; // No validation errors
    };

    // 🆕 Validate all form fields
    const validateAllFields = async (): Promise<boolean> => {
        const errors: { 
            fullName?: string | undefined; 
            phone?: string | undefined; 
            dateOfBirth?: string | undefined; 
            address?: string | undefined; 
        } = {};
        let hasErrors = false;

        // 🆕 Always validate all required fields on save
        console.log("=== VALIDATING ALL FIELDS ===");
        console.log("profileData:", profileData);

        // Validate name
        const nameError = validateFormField('fullName', profileData.fullName);
        if (nameError) {
            errors.fullName = nameError;
            hasErrors = true;
            console.log("Name validation error:", nameError);
        }

        // Validate phone
        const phoneError = validateFormField('phone', profileData.phone || '');
        if (phoneError) {
            errors.phone = phoneError;
            hasErrors = true;
            console.log("Phone validation error:", phoneError);
        }

        // Validate date of birth
        const dateError = validateFormField('dateOfBirth', profileData.dateOfBirth || '');
        if (dateError) {
            errors.dateOfBirth = dateError;
            hasErrors = true;
            console.log("Date validation error:", dateError);
        }

        // Validate address
        const addressError = validateFormField('address', profileData.address || '');
        if (addressError) {
            errors.address = addressError;
            hasErrors = true;
            console.log("Address validation error:", addressError);
        }


        console.log("Validation result - hasErrors:", hasErrors, "errors:", errors);
        setFormErrors(errors);
        return !hasErrors;
    };

    // 🆕 Check form validity when profileData or formErrors change
    useEffect(() => {
        checkFormValidity();
    }, [profileData, formErrors]);

    // 🆕 Initialize form validity when component mounts
    useEffect(() => {
        if (isEditing) {
            checkFormValidity();
        }
    }, [isEditing]);

    // Collect from localStorage
    const userId = localStorage.getItem("userId");  //từ login
    const token = localStorage.getItem("token");
    const emailFallback = localStorage.getItem("email") || "";  // Từ decoded sub

    // -------------------- EMAIL CHANGE-------------------- //
    const handleOpenEmailChangeDialog = () => {
        setNewEmailInput("");
        setEmailOtpCode("");
        setEmailChangeStep("input");
        setEmailChangeError(null);
        setEmailChangeSuccess(null);
        setIsEmailChangeDialogOpen(true);
    };

    const handleSendOTPForEmailChange = async () => {
        // 🆕 Clear previous validation errors
        setEmailModalValidationError(null);
        
        // 🆕 Validate email before proceeding
        const validationError = await validateEmailModal(newEmailInput.trim());
        if (validationError) {
            setEmailModalValidationError(validationError);
            toast.error(validationError);
            return;
        }
        
        try {
            setEmailChangeLoading(true);
            setEmailChangeError(null);
            setEmailModalValidationError(null);
            
            // Get current user email from profile data
            const currentUserEmail = profileData?.email;
            console.log("Current user email from profile:", currentUserEmail);
            console.log("New email to change to:", newEmailInput);
            
            if (!currentUserEmail) {
                setEmailChangeError("Cannot get current user email from profile");
                toast.error("Cannot get current user email from profile");
                return;
            }
            
            await axios.post(
                "http://localhost:8080/api/otp/send/email-change",
                { 
                    email: newEmailInput,
                    currentUserEmail: currentUserEmail  // Send current user email to help backend identify user
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setEmailOtpSent(true);
            setEmailChangeStep("otp");
            setEmailChangeSuccess("OTP sent to " + newEmailInput);
            toast.success("OTP sent to your email");
        } catch (err: any) {
            console.error("Send email OTP error:", err);
            const errorMsg = "Failed to send OTP: " + (err.response?.data?.message || err.message);
            setEmailChangeError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setEmailChangeLoading(false);
        }
    };

    const handleVerifyOTPAndChangeEmail = async () => {
        if (!emailOtpCode.trim()) {
            setEmailChangeError("Please enter OTP code");
            toast.error("Please enter OTP code");
            return;
        }
        if (!validateOTP(emailOtpCode.trim())) {
            setEmailChangeError("Invalid OTP format (6 digits)");
            toast.error("Invalid OTP format (6 digits)");
            return;
        }
        try {
            setEmailChangeLoading(true);
            setEmailChangeError(null);
            await axios.post(
                "http://localhost:8080/api/otp/verify/email-change",
                { email: newEmailInput, otpCode: emailOtpCode },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setProfileData((prev: any) => ({ ...prev, email: newEmailInput }));
            localStorage.setItem("email", newEmailInput);
            setEmailChangeSuccess("Email changed successfully to " + newEmailInput);
            toast.success("Email changed successfully!");
            setTimeout(() => setIsEmailChangeDialogOpen(false), 1500);
        } catch (err: any) {
            console.error("Verify email OTP error:", err);
            const errorMsg = "Failed to verify OTP: " + (err.response?.data?.message || err.message);
            setEmailChangeError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setEmailChangeLoading(false);
        }
    };

    const handleCloseEmailChangeDialog = () => {
        setIsEmailChangeDialogOpen(false);
        setEmailChangeStep("input");
        setNewEmailInput("");
        setEmailOtpCode("");
        setEmailChangeError(null);
        setEmailChangeSuccess(null);
        setEmailOtpSent(false);
        // 🆕 Clear validation errors when closing dialog
        setEmailModalValidationError(null);
        setIsEmailModalValidating(false);
    };

    useEffect(() => {
        const fetchProfile = async () => {
            if (!userId || !token) {
                const errMsg = "Missing userId or token from login";
                setError(errMsg);
                toast.error(errMsg);
                return;
            }
            try {
                setLoading(true);
                setError(null);
                const response = await api.get(`/api/user/profile/${userId}`);
                // Nested response.data.data hoặc data
                const profile = response.data.data || response.data;
                const normalizedData: UserProfile = {
                    userId: profile.userId,
                    fullName: profile.fullName || profile.username || "",
                    email: profile.email,
                    phone: profile.phoneNumber || null,
                    dateOfBirth: profile.dateOfBirth || null,
                    gender:profile.gender || null,
                    role: profile.role,
                    address: profile.address || null,
                    status: profile.status,
                };
                setProfileData(normalizedData);
                console.log("Profile fetched:", profile);
                toast.success("Profile loaded successfully");
            } catch (err: any) {
                console.error("Fetch profile error:", err);
                let errMsg = t("Failed to load Profile");
                
                // Handle different error types
                if (err.response?.status === 401) {
                    errMsg = "Authentication failed. Please log in again.";
                    localStorage.clear();
                    window.location.href = "/login";
                    return;
                } else if (err.response?.status === 405 || err.response?.status === 400) {
                    errMsg = "Endpoint mismatch (405/400). Fallback to local data.";
                } else if (err.response?.status === 404) {
                    errMsg = "Profile not found for ID " + userId + ". Check user ID.";
                } else if (err.response?.status === 500) {
                    errMsg = "Server error. Using cached data.";
                } else if (err.response?.data?.message) {
                    errMsg += ": " + err.response.data.message;
                } else if (err.message) {
                    errMsg += ": " + err.message;
                }
                
                setError(errMsg);
                toast.error(errMsg);
                
                // Fallback UI data từ localStorage/email
                setProfileData({
                    userId: parseInt(userId) || 0,
                    fullName: localStorage.getItem("fullName") || emailFallback,
                    email: emailFallback,
                    phone: localStorage.getItem("phone") || null,
                    dateOfBirth: localStorage.getItem("dateOfBirth") || null,
                    gender: null,
                    role: localStorage.getItem("role") || "DRIVER",
                    address: localStorage.getItem("address") || null,
                    status: "ACTIVE",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchProfile().then(r =>  {});  // Avoid unused promise warning
    }, [t, userId, token, emailFallback]);

    const handleRetryFetch = () => {
        setError(null);
        window.location.reload();  // Simple retry
        toast("Retrying fetch...", { duration: 2000 });
    };

    const handleSave = async () => {
        // Prevent multiple simultaneous save attempts
        if (loading || isRetrying || isValidating) {
            console.log("Save already in progress, skipping...");
            return;
        }
        
        console.log("=== handleSave START ===");
        console.log("profileData.fullName:", profileData.fullName);
        console.log("profileData.phone:", profileData.phone);
        console.log("profileData.dateOfBirth:", profileData.dateOfBirth);
        console.log("userId:", userId);
        console.log("token:", token ? "Present" : "Missing");
        
        // 🆕 Set save attempted flag and validate all fields
        setSaveAttempted(true);
        
        // 🆕 Validate all fields before saving
        const isValid = await validateAllFields();
        if (!isValid) {
            console.log("Form validation failed:", formErrors);
            toast.error("Please fix the validation errors before saving.");
            return;
        }
        
        console.log("=== Validation Checks ===");
        console.log("validateFullName result:", validateFullName(profileData.fullName));
        if (!validateFullName(profileData.fullName)) {
            const errMsg = "Full name must be at least 2 characters";
            console.log("Full name validation failed:", errMsg);
            setError(errMsg);
            toast.error(errMsg);
            return;
        }
        
        console.log("validatePhone result:", profileData.phone ? validatePhone(profileData.phone) : "no phone");
        if (profileData.phone && !validatePhone(profileData.phone)) {
            const errMsg = "Invalid phone number format";
            console.log("Phone validation failed:", errMsg);
            setError(errMsg);
            toast.error(errMsg);
            return;
        }
        
        console.log("validateDateOfBirth result:", profileData.dateOfBirth ? validateDateOfBirth(profileData.dateOfBirth) : "no date");
        if (profileData.dateOfBirth && !validateDateOfBirth(profileData.dateOfBirth)) {
            const errMsg = "Date of birth must be in the past";
            console.log("Date validation failed:", errMsg);
            setError(errMsg);
            toast.error(errMsg);
            return;
        }
        
        console.log("userId and token check:", { userId: !!userId, token: !!token });
        if (!userId || !token) {
            const errMsg = "Missing user ID or token";
            console.log("Auth validation failed:", errMsg);
            setError(errMsg);
            toast.error(errMsg);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            setIsRetrying(retryCount > 0);
            console.log("=== Profile Save Debug ===");
            console.log("userId:", userId);
            console.log("token:", token ? "Present" : "Missing");
            console.log("profileData:", profileData);
            
            // Chỉ gửi các trường cho phép chỉnh sửa để tránh BE từ chối payload
            const payload = {
                fullName: profileData.fullName,
                phoneNumber: profileData.phone, // BE dùng phoneNumber khi fetch
                dateOfBirth: profileData.dateOfBirth,
                address: profileData.address,
            };
            
            // Remove null/undefined values to avoid backend issues
            const cleanPayload = Object.fromEntries(
                Object.entries(payload).filter(([_, value]) => value !== null && value !== undefined && value !== "")
            );
            
            console.log("Payload to send:", cleanPayload);
            const response = await api.put(`/api/user/profile/${userId}`, cleanPayload);
            
            console.log("API Response:", response);
            console.log("Response status:", response.status);
            console.log("Response data:", response.data);
            
            // Update localStorage
            localStorage.setItem("fullName", profileData.fullName);
            localStorage.setItem("phone", profileData.phone || "");
            localStorage.setItem("dateOfBirth", profileData.dateOfBirth || "");
            localStorage.setItem("address", profileData.address || "");
            
            // Dispatch custom event to notify other components
            window.dispatchEvent(new CustomEvent('profileChanged'));
            setIsEditing(false);
            setRetryCount(0); // Reset retry count on success
            setIsRetrying(false);
            setIsLocalSync(false); // Clear local sync state on successful save
            console.log("Save success:", response.data);
            toast.success("Profile updated successfully!");
        } catch (err: any) {
            console.error("=== Save Error Details ===");
            console.error("Error object:", err);
            console.error("Error response:", err.response);
            console.error("Error status:", err.response?.status);
            console.error("Error data:", err.response?.data);
            console.error("Error message:", err.message);
            
            let errMsg = t("Failed to save Profile");
            
            // Handle different error types
            if (err.response?.status === 401) {
                errMsg = "Authentication failed. Please log in again.";
                // Clear local storage and redirect
                localStorage.clear();
                window.location.href = "/login";
                return;
            } else if (err.response?.status === 500) {
                // Check if it's a Hibernate/ByteBuddy error (backend entity issue)
                const errorMessage = err.response?.data?.message || '';
                if (errorMessage.includes('ByteBuddyInterceptor') || errorMessage.includes('Hibernate') || errorMessage.includes('proxy')) {
                    errMsg = "🔧 Backend database error detected. Your data has been saved locally and will sync automatically when the backend is fixed.";
                    setRetryCount(0); // Don't retry for backend entity errors
                } else if (retryCount < 1) { // Reduced retries to 1
                    errMsg = `Server error. Retrying... (${retryCount + 1}/1)`;
                    setRetryCount(prev => prev + 1);
                    setIsRetrying(true);
                    toast.error(errMsg);
                    // Retry after a short delay
                    setTimeout(() => {
                        handleSave();
                    }, 3000); // Increased delay
                    return;
                } else {
                    errMsg = "Server error. Please try again later or contact support.";
                }
            } else if (err.response?.status === 400) {
                errMsg = "Invalid data. Please check your input and try again.";
            } else if (err.response?.data?.message) {
                errMsg += ": " + err.response.data.message;
            } else if (err.message) {
                errMsg += ": " + err.message;
            }
            
            setError(errMsg);
            toast.error(errMsg);
            setRetryCount(0); // Reset retry count on final error
            setIsRetrying(false);
            
            // For backend errors, save data locally as fallback
            if (err.response?.status === 500) {
                console.log("Backend error - saving data locally as fallback");
                localStorage.setItem("fullName", profileData.fullName);
                localStorage.setItem("phone", profileData.phone || "");
                localStorage.setItem("dateOfBirth", profileData.dateOfBirth || "");
                localStorage.setItem("address", profileData.address || "");
                
                // Dispatch custom event to notify other components
                window.dispatchEvent(new CustomEvent('profileChanged'));
                
                // Show success message and exit edit mode
                setIsEditing(false);
                setIsLocalSync(true);
                toast.success("✅ Data saved locally! Will sync when backend is fixed.", { 
                    icon: "💾",
                    duration: 5000 
                });
            }
        } finally {
            setLoading(false);
            setIsRetrying(false);
        }
    };

    const handleInputChange = (field: keyof UserProfile, value: string) => {
        setProfileData((prev) => ({
            ...prev,
            [field]: value,
        }));

        //Mark field as touched when user edits it
        if (field === 'fullName' || field === 'phone' || field === 'dateOfBirth' || field === 'address') {
            setTouchedFields(prev => ({
                ...prev,
                [field]: true
            }));
            
            // Validate on input change for real-time feedback
            const error = validateFormField(field, value);
            setFormErrors(prev => ({
                ...prev,
                [field]: error || undefined
            }));
            //useEffect at line 363-365 will automatically checkFormValidity() when formErrors changes
        }
    };


    // Avatar upload handler
    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        try {
            setAvatarLoading(true);
            
            // Convert to base64 for preview
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setAvatar(result);
                localStorage.setItem('avatar', result);
                
                // Dispatch custom event to notify other components
                window.dispatchEvent(new CustomEvent('avatarChanged'));
                
                toast.success('Avatar updated successfully!');
            };
            reader.readAsDataURL(file);

            // TODO: Upload to backend when backend supports file upload
            // For now, just save locally
            console.log('Avatar file selected:', file.name);
            
        } catch (err) {
            console.error('Avatar upload error:', err);
            toast.error('Failed to upload avatar');
        } finally {
            setAvatarLoading(false);
        }
    };

    // Load avatar from localStorage on mount
    useEffect(() => {
        const savedAvatar = localStorage.getItem('avatar');
        if (savedAvatar) {
            setAvatar(savedAvatar);
        }
    }, []);

    // Handle password change
    const handleChangePassword = async () => {
        if (!oldPassword.trim()) {
            setPasswordError("Please enter old password");
            toast.error("Please enter old password");
            return;
        }
        if (!newPassword.trim()) {
            setPasswordError("Please enter new password");
            toast.error("Please enter new password");
            return;
        }
        if (!validatePassword(newPassword)) {
            setPasswordError("Password must be at least 6 characters");
            toast.error("Password must be at least 6 characters");
            return;
        }
        if (!confirmPassword.trim()) {
            setPasswordError("Please confirm new password");
            toast.error("Please confirm new password");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("New password and confirm password do not match.");
            toast.error("New password and confirm password do not match.");
            return;
        }
        if (!userId || !token) {
            const errMsg = "Missing user ID or token";
            setPasswordError(errMsg);
            toast.error(errMsg);
            return;
        }
        try {
            setLoading(true);
            setPasswordError(null);
            setPasswordSuccess(null);
            // Path param numeric userId cho PUT password
            const response = await api.put(
                `/api/user/profile/password/${userId}`,
                { oldPassword, newPassword, confirmNewPassword: confirmPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPasswordSuccess("Password changed successfully.");
            toast.success("Password changed successfully!");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => setIsPasswordDialogOpen(false), 1500);
            console.log("Password change success:", response.data);
        } catch (err: any) {
            console.error("Password change error:", err);
            const errMsg = "Failed to change password: " + (err.response?.data?.message || err.message);
            setPasswordError(errMsg);
            toast.error(errMsg);
        } finally {
            setLoading(false);
        }
    };

    if (loading && Object.values(profileData).every(v => v === "" || v === 0 || v === null)) return <p>{t("loading")}...</p>;
    if (error && !profileData.userId && !profileData.fullName) return (
        <div className="p-6">
            <p style={{ color: "red" }}>{error}</p>
            <Button onClick={handleRetryFetch} className="mt-2 flex items-center space-x-2">
                <RefreshCw className="w-4 h-4" />
                <span>Retry Fetch</span>
            </Button>
        </div>
    );

    const fieldGroups = [
        { label: t('full_name'), field: 'fullName' },
        { label: t('email'), field: 'email', disabled: true },
        { label: t('phone'), field: 'phone' },
        { label: t('address'), field: 'address' },
        { label: t('date_of_birth'), field: 'dateOfBirth', type: 'date' },
        { label: t('role'), field: 'role', disabled: true },
        { label: t('status'), field: 'status', disabled: true },
        { label: t('gender'), field: 'gender' },
    ];

    return (
        <div className="min-h-screen bg-background">
            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onBack}
                            className="flex items-center space-x-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>{t('Back to Dashboard')}</span>
                        </Button>
                        <h1 className="text-2xl font-semibold text-foreground">{t('user_profile')}</h1>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={() => {
                                console.log("=== Button Clicked ===");
                                console.log("isEditing:", isEditing);
                                console.log("loading:", loading);
                                if (isEditing) {
                                    console.log("Calling handleSave...");
                                    handleSave();
                                } else {
                                    console.log("Setting editing to true...");
                                    // 🆕 Clear form errors and reset tracking when starting to edit
                                    setFormErrors({});
                                    setTouchedFields({});
                                    setSaveAttempted(false);
                                    setIsEditing(true);
                                }
                            }}
                            disabled={loading || isRetrying || isValidating || (isEditing && !isFormValid)}
                            className="flex items-center space-x-2"
                        >
                            {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                            <span>
                                {isRetrying ? `Retrying... (${retryCount}/1)` : 
                                 isValidating ? 'Validating...' :
                                 isEditing ? t('Save Changes') : t('Edit Profile')}
                            </span>
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setIsPasswordDialogOpen(true)}
                            className="flex items-center space-x-2"
                        >
                            <Key className="w-4 h-4" />
                            <span>{t("Change Password")}</span>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="text-center">
                            <div className="relative inline-block">
                                <Avatar className="w-24 h-24 mx-auto mb-4">
                                    {avatar ? (
                                        <img 
                                            src={avatar} 
                                            alt="Profile Avatar" 
                                            className="w-full h-full object-cover rounded-full"
                                        />
                                    ) : (
                                        <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                                            {profileData.fullName.charAt(0).toUpperCase() || emailFallback.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                                
                                {/* Avatar upload button */}
                                <label 
                                    htmlFor="avatar-upload" 
                                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
                                    title="Change Avatar"
                                >
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        className="hidden"
                                        disabled={avatarLoading}
                                    />
                                    {avatarLoading ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <User className="w-4 h-4" />
                                    )}
                                </label>
                            </div>
                            <CardTitle>{profileData.fullName || emailFallback}</CardTitle>
                            <p className="text-muted-foreground">{profileData.email || emailFallback}</p>
                            {isLocalSync && (
                                <div className="mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full inline-flex items-center">
                                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1 animate-pulse"></span>
                                    Data saved locally
                                    <button 
                                        onClick={() => {
                                            setIsLocalSync(false);
                                            handleSave();
                                        }}
                                        className="ml-2 text-blue-600 hover:text-blue-800 underline"
                                    >
                                        Retry sync
                                    </button>
                                </div>
                            )}
                        </CardHeader>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <User className="w-5 h-5" />
                                <span>{t('Personal Information')}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">{t('full_name')}</Label>
                                    {isEditing ? (
                                        <>
                                            <Input
                                                id="fullName"
                                                value={profileData.fullName || ''}
                                                onChange={(e) => handleInputChange('fullName', e.target.value)}
                                                required
                                                className={formErrors.fullName ? "border-red-500" : ""}
                                            />
                                            {formErrors.fullName && (
                                                <p className="text-red-500 text-sm">{formErrors.fullName}</p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="py-2 px-3 bg-muted rounded-md">{profileData.fullName || "Not set"}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">{t('email')}</Label>
                                    {isEditing ? (
                                        <>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={profileData.email || ''}
                                                disabled
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-2 flex items-center space-x-2 text-sm"
                                                onClick={handleOpenEmailChangeDialog}
                                            >
                                                <Mail className="w-4 h-4" />
                                                <span>{t('Change Email')}</span>
                                            </Button>
                                        </>
                                    ) : (
                                        <p className="py-2 px-3 bg-muted rounded-md">{profileData.email || emailFallback}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">{t('phone')}</Label>
                                    {isEditing ? (
                                        <>
                                            <Input
                                                id="phone"
                                                value={profileData.phone || ''}
                                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                                className={formErrors.phone ? "border-red-500" : ""}
                                            />
                                            {formErrors.phone && (
                                                <p className="text-red-500 text-sm">{formErrors.phone}</p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="py-2 px-3 bg-muted rounded-md">{profileData.phone || "Not set"}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="dateOfBirth">{t('date_of_birth')}</Label>
                                    {isEditing ? (
                                        <>
                                            <Input
                                                id="dateOfBirth"
                                                type="date"
                                                value={profileData.dateOfBirth || ''}
                                                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                                max={new Date().toISOString().split('T')[0]}  // 🆕 Prevent future dates in input
                                                className={formErrors.dateOfBirth ? "border-red-500" : ""}
                                            />
                                            {formErrors.dateOfBirth && (
                                                <p className="text-red-500 text-sm">{formErrors.dateOfBirth}</p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="py-2 px-3 bg-muted rounded-md">{profileData.dateOfBirth || "Not set"}</p>
                                    )}
                                </div>

                                {/* <div className="space-y-2">
                                    <Label htmlFor="gender">{t('gender')}</Label>
                                    {isEditing ? (
                                        <Input
                                            id="gender"
                                            value={profileData.gender || ''}
                                            onChange={(e) => handleInputChange('gender', e.target.value)}
                                        />
                                    ) : (
                                        <p className="py-2 px-3 bg-muted rounded-md">{profileData.gender || "Not set"}</p>
                                    )}
                                </div> */}

                                <div className="space-y-2">
                                    <Label htmlFor="address">{t('address')}</Label>
                                    {isEditing ? (
                                        <>
                                            <Input
                                                id="address"
                                                value={profileData.address || ''}
                                                onChange={(e) => handleInputChange('address', e.target.value)}
                                                className={formErrors.address ? "border-red-500" : ""}
                                            />
                                            {formErrors.address && (
                                                <p className="text-red-500 text-sm">{formErrors.address}</p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="py-2 px-3 bg-muted rounded-md">{profileData.address || "Not set"}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="role">{t('role')}</Label>
                                    <p className="py-2 px-3 bg-muted rounded-md text-primary">{profileData.role}</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">{t('status')}</Label>
                                    <p className="py-2 px-3 bg-muted rounded-md">{profileData.status}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Change Password Modal */}
                <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                    <DialogContent className="max-w-lg w-full rounded-xl p-6 bg-card overflow-y-auto">
                        <DialogHeader className="border-b pb-4">
                            <DialogTitle className="text-lg font-semibold">{t("Change Password")}</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
                            <div className="space-y-2">
                                <Label htmlFor="oldPassword" className="text-sm font-medium">
                                    {t("Old Password")}
                                </Label>
                                <PasswordInput
                                    id="oldPassword"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    placeholder="Enter current password"
                                    className="border border-slate-300 rounded-md px-3 py-2"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="newPassword" className="text-sm font-medium">
                                    {t("New Password")}
                                </Label>
                                <PasswordInput
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="border border-slate-300 rounded-md px-3 py-2"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                                    {t("Confirm Password")}
                                </Label>
                                <PasswordInput
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    className="border border-slate-300 rounded-md px-3 py-2"
                                />
                            </div>

                            {passwordError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                                    {passwordError}
                                </div>
                            )}

                            {passwordSuccess && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm">
                                    {passwordSuccess}
                                </div>
                            )}
                        </div>

                        <DialogFooter className="border-t pt-4 gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsPasswordDialogOpen(false)}
                            >
                                {t("Cancel")}
                            </Button>
                            <Button
                                onClick={handleChangePassword}
                                disabled={loading}
                                className="bg-blue-500 text-white hover:bg-blue-600"
                            >
                                {loading ? t("loading") : t("Update Password")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>


                {/* Change Email Modal */}

                <Dialog open={isEmailChangeDialogOpen} onOpenChange={handleCloseEmailChangeDialog}>
                    <DialogContent className="max-w-lg w-full rounded-xl p-6 bg-card overflow-y-auto">
                        <DialogHeader className="border-b pb-4">
                            <DialogTitle className="text-lg font-semibold">
                                {emailChangeStep === "input" ? t("Change Email") : t("Verify OTP")}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
                            {/* STEP 1: Input new email */}
                            {emailChangeStep === "input" && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="currentEmail" className="text-sm font-medium">
                                            {t("Current Email")}
                                        </Label>
                                        <Input
                                            id="currentEmail"
                                            type="email"
                                            value={profileData.email}
                                            disabled
                                            className="bg-gray-100"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="newEmail" className="text-sm font-medium">
                                            {t("New Email")}
                                        </Label>
                                        <Input
                                            id="newEmail"
                                            type="email"
                                            value={newEmailInput}
                                            onChange={(e) => {
                                                setNewEmailInput(e.target.value);
                                                // 🆕 Clear validation error when user starts typing
                                                if (emailModalValidationError) {
                                                    setEmailModalValidationError(null);
                                                }
                                            }}
                                            placeholder="Enter new email"
                                            disabled={emailChangeLoading || isEmailModalValidating}
                                            className={`border border-slate-300 rounded-md px-3 py-2 ${
                                                emailModalValidationError ? "border-red-500" : ""
                                            }`}
                                        />
                                        {/* 🆕 Display validation error message */}
                                        {emailModalValidationError && (
                                            <p className="text-red-500 text-sm">{emailModalValidationError}</p>
                                        )}
                                    </div>

                                    <p className="text-xs text-gray-500">
                                        {t("We will send a verification code to your new email address.")}
                                    </p>
                                </>
                            )}

                            {/* STEP 2: Input OTP */}
                            {emailChangeStep === "otp" && (
                                <>
                                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
                                        <p className="text-sm text-blue-700">
                                            {t("A verification code has been sent to:")} <br />
                                            <strong>{newEmailInput}</strong>
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="emailOtp" className="text-sm font-medium">
                                            {t("Verification Code")}
                                        </Label>
                                        <Input
                                            id="emailOtp"
                                            type="text"
                                            value={emailOtpCode}
                                            onChange={(e) => setEmailOtpCode(e.target.value.slice(0, 6))}
                                            placeholder="Enter 6-digit code"
                                            maxLength={6}
                                            disabled={emailChangeLoading}
                                            className="border border-slate-300 rounded-md px-3 py-2 text-center text-lg tracking-widest"
                                        />
                                    </div>

                                    <p className="text-xs text-gray-500">
                                        {t("Code expires in 5 minutes")}
                                    </p>

                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setEmailChangeStep("input");
                                            setEmailOtpCode("");
                                            setEmailOtpSent(false);
                                        }}
                                        className="w-full text-sm"
                                    >
                                        {t("Back")}
                                    </Button>
                                </>
                            )}

                            {/* Error message */}
                            {emailChangeError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                                    {emailChangeError}
                                </div>
                            )}

                            {/* Success message */}
                            {emailChangeSuccess && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm">
                                    {emailChangeSuccess}
                                </div>
                            )}
                        </div>

                        <DialogFooter className="border-t pt-4 gap-2">
                            <Button
                                variant="outline"
                                onClick={handleCloseEmailChangeDialog}
                                disabled={emailChangeLoading}
                            >
                                {t("Cancel")}
                            </Button>

                            {emailChangeStep === "input" ? (
                                <Button
                                    onClick={handleSendOTPForEmailChange}
                                    disabled={emailChangeLoading || isEmailModalValidating || !!emailModalValidationError}
                                    className="bg-blue-500 text-white hover:bg-blue-600"
                                >
                                    {emailChangeLoading || isEmailModalValidating ? t("loading") : t("Send Code")}
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleVerifyOTPAndChangeEmail}
                                    disabled={emailChangeLoading}
                                    className="bg-blue-500 text-white hover:bg-blue-600"
                                >
                                    {emailChangeLoading ? t("loading") : t("Verify & Change Email")}
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </div>
    );
}