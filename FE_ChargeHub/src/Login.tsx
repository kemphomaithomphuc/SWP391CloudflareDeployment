import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";  // Để decode claims
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Separator } from "./components/ui/separator";
import PasswordInput from "./components/ui/PasswordInput";
import { Zap } from "lucide-react";
import { useLanguage } from "./contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./components/ui/dialog";
import toast from "react-hot-toast";  // 🆕 Dùng react-hot-toast
import { api } from "./services/api";

interface LoginProps {
    onSwitchToRegister: () => void;
    onLogin?: () => void;
    onStaffLogin?: () => void; // used for auto-redirect after role detection (no separate staff login button)
    onAdminLogin?: () => void;
    onSwitchToRoleSelection? : () => void;
    onSwitchToVehicleSetup?: () => void;
}

export default function Login({ onSwitchToRegister, onLogin, onStaffLogin, onAdminLogin, onSwitchToRoleSelection, onSwitchToVehicleSetup }: LoginProps) {
    const { t } = useLanguage();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 🆕 Forgot password popup state
    const [showForgotPopup, setShowForgotPopup] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [resetMessage, setResetMessage] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [isResetStep, setIsResetStep] = useState(false);

    // 🆕 Validation functions
    const validateEmail = (emailValue: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(emailValue);
    };

    const validatePhone = (phoneValue: string): boolean => {
        const phoneRegex = /^(0|\+84)([35789])[0-9]{8}$/;
        return phoneRegex.test(phoneValue.replace(/\s/g, ''));
    };

    const validateUsername = (usernameValue: string): boolean => {
        return validateEmail(usernameValue) || validatePhone(usernameValue);
    };

    const validatePassword = (passwordValue: string): boolean => {
        return passwordValue.length >= 6;
    };

    const validateOTP = (otpValue: string): boolean => {
        return /^\d{6}$/.test(otpValue);
    };

    //handle social
    useEffect(() => {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");

        if (code && (state === "google" || state === "facebook")) {
            console.log("Detected OAuth callback:", state, code);
            setLoading(true);

            (async () => {
                try {
                    const res = await axios.get(
                        `http://localhost:8080/api/auth/social/callback?code=${encodeURIComponent(
                            code
                        )}&state=${encodeURIComponent(state)}`
                    );

                    if (res.data?.success && res.data?.data?.accessToken) {
                        const { accessToken, refreshToken } = res.data.data;

                        //Lưu token
                        localStorage.setItem("token", accessToken);
                        if (refreshToken)
                            localStorage.setItem("refreshToken", refreshToken);

                        //userId
                        const meRes = await axios.post(
                            "http://localhost:8080/api/auth/me",
                            null,
                            { headers: { Authorization: `Bearer ${accessToken}` } }
                        );

                        if (meRes.data?.success && meRes.data?.data) {
                            localStorage.setItem("userId", String(meRes.data.data));
                        }

                        //Decode JWT
                        const decoded: any = jwtDecode(accessToken);
                        const role = decoded.role?.toLowerCase() || "driver";
                        const userId = meRes.data?.data;
                        localStorage.setItem("role", role);
                        localStorage.setItem("email", decoded.sub || "");

                        await getUserProfileToContinue(userId);

                        // 🧹 Xóa query để URL sạch
                        window.history.replaceState({}, document.title, "/login");
                    } else {
                        setError("Social login failed: Invalid response");
                        toast.error("Social login failed: Invalid response");
                    }
                } catch (err) {
                    console.error("OAuth callback error:", err);
                    setError("Failed to process social login callback");
                    toast.error("Failed to process social login callback");
                } finally {
                    setLoading(false);
                }
            })();
        }
    }, [onLogin, onStaffLogin, onAdminLogin]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            setError("Enter your email or phone number");
            toast.error(t("Enter your email or phone number"));
            return;
        }
        if (!validateUsername(email.trim())) {
            setError("Invalid email or phone number format");
            toast.error("Invalid email or phone number format");
            return;
        }
        if (!password.trim()) {
            setError("Enter your password");
            toast.error(t("Enter your password"));
            return;
        }
        if (!validatePassword(password.trim())) {
            setError("Password must be at least 6 characters");
            toast.error("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await axios.post("http://localhost:8080/api/auth/login", {
                username: email.trim(),
                password: password.trim(),
            });


            if (res.status === 200 && res.data?.success && res.data?.data) {
                const { accessToken, refreshToken } = res.data.data;

                if (!accessToken) throw new Error("Response Content Length Mismatch Error");

                let userId = null;

                const meRes = await axios.post(
                    "http://localhost:8080/api/auth/me",
                    null,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                if (meRes.data?.success && meRes.data?.data) {
                    localStorage.setItem("userId", String(meRes.data.data));
                }

                userId = meRes.data?.data || null;
                // Lưu token vào localStorage
                localStorage.setItem("token", accessToken);
                localStorage.setItem("refreshToken", refreshToken || "");

                let effectiveRole = "driver";

                try {

                    if (userId) {
                        
                        localStorage.setItem("userId", userId.toString())

                        localStorage.setItem("registeredUserId", userId.toString());
                    };
                    localStorage.setItem("role", effectiveRole.toLowerCase());
                    
                    // Check user profile to determine next step
                    console.log("Checking user profile for userId:", userId);
                    await getUserProfileToContinue(userId);
                } catch (decodeErr: any) {
                    console.error("JWT decode failed:", decodeErr);
                    localStorage.setItem("role", "driver");
                    localStorage.setItem("userId", "0");
                    
                    // Fallback to default login flow
                    onLogin?.();
                }
            } else {
                setError("Login Failed - Invalid response structure");
                toast.error("Login Failed - Invalid response structure");
            }
        } catch (err: any) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                setError("Username or password is incorrect");
                toast.error("Username or password is incorrect");
            } else if (err.response?.status === 500) {
                setError("Server error. Please try again later.");
                toast.error("Server error. Please try again later.");
            } else if (err.response?.status === 400) {
                setError("Bad request. Please check your input.");
                toast.error("Bad request. Please check your input.");
            } else if (err.code === "ECONNREFUSED" || err.message?.includes("Network Error")) {
                setError("Cannot connect to server. Please try again later.");
                toast.error("Cannot connect to server. Please try again later.");
            } else {
                setError("An unexpected error occurred. Please try again.");
                toast.error("An unexpected error occurred. Please try again.");
                console.error("Login error:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    const getUserProfileToContinue = async (userId: string) => {
        setLoading(true);
        setError(null);
        localStorage.setItem("registeredUserId", userId);
        try {
            const res = await api.get(`/api/user/profile/${userId}?include=vehicles`);
            console.log("User profile response:", res.data);
            
            if (res.status === 200 && res.data) {
                const userProfile = res.data;
                console.log("Fetched user profile:", userProfile);
                
                // Store user profile data in localStorage
                if (userProfile.data) {
                    if (userProfile.data.fullName) {
                        localStorage.setItem("fullName", userProfile.data.fullName);
                        console.log("Stored fullName:", userProfile.data.fullName);
                    }
                    if (userProfile.data.email) {
                        localStorage.setItem("email", userProfile.data.email);
                        console.log("Stored email:", userProfile.data.email);
                    }
                }
                
                // Check if user needs to complete profile setup
                if (!userProfile.data.dateOfBirth) {
                    console.log("User needs profile completion");
                    onSwitchToRoleSelection?.();
                    return;
                }
                else if (!userProfile.data.vehicles || userProfile.data.vehicles.length === 0) {
                    console.log("User needs vehicle setup");
                    onSwitchToVehicleSetup?.(); //Muốn sang dashboard thì chỉnh thành onLogin
                    return;
                } 
                else {
                    // Decide dashboard by role; store stationId for staff
                    const role = (userProfile.data.role || localStorage.getItem("role") || "driver").toLowerCase();
                    if (role === "staff") {
                        const stationId = userProfile.data.station?.stationId || userProfile.data.stationId;
                        if (stationId) localStorage.setItem("stationId", String(stationId));
                        onStaffLogin?.();
                        return;
                    } else if (role === "admin") {
                        onAdminLogin?.();
                        return;
                    } else {
                        onLogin?.();
                        return;
                    }
                }
                
                // User profile is complete, proceed with normal login flow
                console.log("User profile is complete, proceeding with login");
                const role = localStorage.getItem("role")?.toLowerCase() || "driver";
                
                // if (role === "driver") {
                //     onLogin?.();
                // } else if (role === "staff") {
                //     onStaffLogin?.();
                // } else if (role === "admin") {
                //     onAdminLogin?.();
                // } else {
                //     onLogin?.();
                // }
            } else {
                console.log("Invalid profile response, proceeding with default login");
                // Fallback to default login flow
                const role = localStorage.getItem("role")?.toLowerCase() || "driver";
                if (role === "staff") onStaffLogin?.();
                else if (role === "admin") onAdminLogin?.();
                else onLogin?.();
            }
        } catch (err: any) {
            console.error("Error getting user profile:", err);
            console.log("Profile check failed, proceeding with default login");
            
            // Fallback to default login flow when profile check fails
            const role = localStorage.getItem("role")?.toLowerCase() || "driver";
            if (role === "staff") onStaffLogin?.();
            else if (role === "admin") onAdminLogin?.();
            else onLogin?.();
        } finally {
            setLoading(false);
        }
    }

    // GOOGLE LOGIN (redirect)
    const handleGoogleLogin = async () => {
        try {
            const res = await axios.get("http://localhost:8080/api/auth/social/login?loginType=google");
            if (res.data?.data) {
                window.location.href = res.data.data; // Redirect sang Google OAuth
            } else {
                setError("Không thể lấy URL đăng nhập Google");
                toast.error("Không thể lấy URL đăng nhập Google");
            }
        } catch (err) {
            console.error("Google login error:", err);
            setError("Kết nối tới Google thất bại");
            toast.error("Kết nối tới Google thất bại");
        }
    };

    // FACEBOOK LOGIN (redirect)
    const handleFacebookLogin = async () => {
        try {
            const res = await axios.get("http://localhost:8080/api/auth/social/login?loginType=facebook");
            if (res.data?.data) {
                window.location.href = res.data.data;
            } else {
                setError("Không thể lấy URL đăng nhập Facebook");
                toast.error("Không thể lấy URL đăng nhập Facebook");
            }
        } catch (err) {
            console.error("Facebook login error:", err);
            setError("Kết nối tới Facebook thất bại");
            toast.error("Kết nối tới Facebook thất bại");
        }
    };

    // 🆕 handle send OTP for reset password
    const handleSendResetOTP = async () => {
        if (!resetEmail.trim()) {
            setResetMessage("Please enter your registered email");
            toast.error(t("Enter your registered email"));
            return;
        }
        if (!validateEmail(resetEmail.trim())) {
            setResetMessage("Invalid email format");
            toast.error("Bạn nhập sai format email");
            return;
        }
        try {
            setResetMessage("Sending OTP...");
            const res = await axios.post("http://localhost:8080/api/otp/send/forgot-password", { email: resetEmail });
            if (res.data?.success) {
                setOtpSent(true);
                setResetMessage("OTP sent to your email");
                toast.success("OTP sent to your email");
            } else {
                const errorMsg = res.data?.message || "Failed to send OTP";
                setResetMessage(errorMsg);
                if (errorMsg.includes("not found") || errorMsg.includes("unregistered")) {
                    toast.error("Email chưa đăng ký với hệ thống");
                } else {
                    toast.error(errorMsg);
                }
            }
        } catch (err: any) {
            const errorMsg = "Error sending OTP: " + (err.response?.data?.message || err.message);
            setResetMessage(errorMsg);
            if (err.response?.data?.message?.includes("not found") || err.response?.data?.message?.includes("unregistered")) {
                toast.error("Email chưa đăng ký với hệ thống");
            } else {
                toast.error(errorMsg);
            }
        }
    };

    const handleVerifyResetOTP = async () => {
        if (!otpCode.trim()) {
            setResetMessage("Please enter OTP code");
            toast.error("Please enter OTP code");
            return;
        }
        if (!validateOTP(otpCode.trim())) {
            setResetMessage("Invalid OTP format (6 digits)");
            toast.error("Invalid OTP format (6 digits)");
            return;
        }
        try {
            const res = await axios.post("http://localhost:8080/api/otp/verify/forgot-password", {
                email: resetEmail,
                otpCode,
            });

            console.log("OTP verify response:", res.data);

            if (res.data?.success) {
                //Nhận resetToken từ BE và mở popup đặt lại mật khẩu
                const resetToken = res.data.data || res.data.email;
                setResetToken(resetToken);
                setResetMessage("OTP verified successfully!");
                toast.success("OTP verified successfully!");
                setIsResetStep(true);
            } else {
                setResetMessage("Invalid or expired OTP.");
                toast.error("Invalid or expired OTP.");
            }
        } catch (err: any) {
            setResetMessage("Verification failed.");
            toast.error("Verification failed.");
        }
    };


    function ResetPasswordForm({
                                   resetToken,
                                   setShowForgotPopup,
                               }: {
        resetToken: string;
        setShowForgotPopup: (open: boolean) => void;
    }) {
        const [newPassword, setNewPassword] = useState("");
        const [confirmPassword, setConfirmPassword] = useState("");
        const [message, setMessage] = useState("");
        const [loading, setLoading] = useState(false);

        const handleResetPassword = async () => {
            if (!newPassword || !confirmPassword) {
                setMessage("Please fill in all fields.");
                toast.error("Please fill in all fields.");
                return;
            }
            if (newPassword !== confirmPassword) {
                setMessage("Passwords do not match.");
                toast.error("Passwords do not match.");
                return;
            }
            if (!validatePassword(newPassword)) {
                setMessage("Password must be at least 6 characters");
                toast.error("Password must be at least 6 characters");
                return;
            }

            try {
                setLoading(true);
                const res = await axios.post("http://localhost:8080/api/otp/reset-password", {
                    resetToken,
                    newPassword,
                });

                if (res.data?.success) {
                    setMessage("Password reset successfully!");
                    toast.success("Password reset successfully!");
                    setTimeout(() => setShowForgotPopup(false), 2000);
                } else {
                    setMessage(res.data?.message || "Failed to reset password.");
                    toast.error(res.data?.message || "Failed to reset password.");
                }
            } catch (err: any) {
                const errorMsg = "Error resetting password: " + (err.response?.data?.message || err.message);
                setMessage(errorMsg);
                toast.error(errorMsg);
            } finally {
                setLoading(false);
            }
        };

        return (
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Enter your new password</p>
                <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password"
                    autoComplete="new-password"
                    className="w-full bg-input-background/50 border-border/60 rounded-xl"
                />
                <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    autoComplete="new-password"
                    className="w-full bg-input-background/50 border-border/60 rounded-xl"
                />
                <Button
                    onClick={handleResetPassword}
                    disabled={loading}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    {loading ? "Resetting..." : "Reset Password"}
                </Button>
                {message && <p className="text-sm text-red-600 text-center">{message}</p>}
            </div>
        );
    }

    const handleAdminLogin = () => onAdminLogin?.();

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-2xl shadow-primary/5 p-8 space-y-8">
                        <div className="text-center space-y-6">
                            <div className="flex items-center justify-center">
                                <div className="relative group">
                                    <div className="absolute -inset-8 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent animate-pulse"></div>
                                    <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-primary/15 via-primary/8 to-transparent animate-pulse" style={{ animationDelay: "0.5s" }}></div>

                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/70 rounded-3xl transform rotate-6 scale-110 opacity-20"></div>
                                        <div className="absolute inset-0 bg-gradient-to-tl from-secondary via-accent to-primary/30 rounded-3xl transform -rotate-3 scale-105 opacity-15"></div>

                                        <div className="relative w-20 h-20 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30 transform rotate-12 group-hover:rotate-0 transition-all duration-500 border-2 border-primary/20">
                                            <div className="absolute inset-2 bg-gradient-to-br from-primary-foreground/20 to-transparent rounded-2xl"></div>
                                            <div className="relative">
                                                <Zap className="w-10 h-10 text-primary-foreground filter drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300" />
                                                <div className="absolute inset-0 w-10 h-10">
                                                    <Zap className="w-10 h-10 text-primary-foreground/30 blur-sm" />
                                                </div>
                                            </div>
                                            <div className="absolute top-1 right-1 w-2 h-2 bg-primary-foreground/40 rounded-full"></div>
                                            <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-primary-foreground/30 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h1 className="text-4xl font-bold text-foreground tracking-tight bg-gradient-to-r from-foreground via-primary/80 to-foreground bg-clip-text">
                                    {t("chargehub")}
                                </h1>
                                <div className="relative">
                                    <p className="text-muted-foreground/90 font-medium">{t("power_journey")}</p>
                                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-foreground/90 font-medium">{t("username_email")}</Label>
                                    <Input
                                        id="email"
                                        type="text"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Email or Phone"
                                        autoComplete="username"
                                        className="h-12 bg-input-background/50 border-border/60 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/60"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-foreground/90 font-medium">{t("Password")}</Label>
                                    <PasswordInput
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={t("Password")}
                                        autoComplete="current-password"
                                        className="h-12 bg-input-background/50 border-border/60 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/60"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <Button
                                className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20 rounded-xl transition-all duration-200 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? "Login ..." : t("Sign in")}
                            </Button>
                        </form>

                    <div className="relative">
                        <Separator className="bg-border/30" />
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-4">
                            <span className="text-muted-foreground/70 font-medium">{t("Continue with")}</span>
                        </div>
                    </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                onClick={handleGoogleLogin}
                                className="h-12 bg-card/50 border-border/60 hover:bg-accent/50 hover:border-border rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span className="font-medium">Google</span>
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleFacebookLogin}
                                className="h-12 bg-card/50 border-border/60 hover:bg-accent/50 hover:border-border rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                <span className="font-medium">Facebook</span>
                            </Button>
                        </div>

                        <div className="text-center space-y-4">
                            <div className="flex items-center justify-center space-x-6">
                                {/* Create account*/}
                                <button
                                    onClick={onSwitchToRegister}
                                    className="text-primary hover:text-primary/80 font-medium transition-colors duration-200 hover:underline underline-offset-4"
                                >
                                    Create account
                                </button>

                                {/* Forgot password*/}
                                <button
                                    onClick={() => setShowForgotPopup(true)}
                                    className="text-primary hover:text-primary/80 font-medium transition-colors duration-200 hover:underline underline-offset-4"
                                >
                                    Forgot password
                                </button>
                            </div>

                            <div className="relative mt-3">
                                <Separator className="bg-border/20" />
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3">
                                    <span className="text-muted-foreground/50 text-xs">{t("or")}</span>
                                </div>
                            </div>

                            {/* Admin button removed: admins are auto-redirected after login based on role */}
                        </div>
                    </div>

                    {/* 🆕 Forgot Password Dialog */}
                    <Dialog open={showForgotPopup} onOpenChange={(open : boolean) => {
                        setShowForgotPopup(open);
                        if (!open) {
                            setOtpSent(false);
                            setIsResetStep(false);
                            setResetMessage("");
                            setResetEmail("");
                            setOtpCode("");
                        }
                    }}>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">
                                    {isResetStep ? t("Set New Password") : t("Reset Password")}
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4">
                                {/* Step 1: Nhập email */}
                                {!otpSent && !isResetStep && (
                                    <>
                                        <p className="text-sm text-muted-foreground">{t("Enter your registered email")}</p>
                                        <Input
                                            type="email"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            placeholder="Email"
                                            autoComplete="Your Email"
                                            className="w-full bg-input-background/50 border-border/60 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/60"
                                        />
                                        <Button
                                            onClick={handleSendResetOTP}
                                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                                        >
                                            {t("Send OTP")}
                                        </Button>
                                    </>
                                )}

                                {/* Step 2: Nhập OTP */}
                                {otpSent && !isResetStep && (
                                    <>
                                        <p className="text-sm text-muted-foreground">{t("Enter OTP code sent to your email")}</p>
                                        <Input
                                            type="text"
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value)}
                                            placeholder="OTP Code"
                                            autoComplete="One Time Password"
                                            className="w-full bg-input-background/50 border-border/60 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/60"
                                        />
                                        <Button
                                            onClick={handleVerifyResetOTP}
                                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                                        >
                                            {t("Verify OTP")}
                                        </Button>
                                    </>
                                )}

                                {/* Step 3: Nhập mật khẩu mới */}
                                {isResetStep && (
                                    <ResetPasswordForm
                                        resetToken={resetToken}
                                        setShowForgotPopup={setShowForgotPopup}
                                    />
                                )}

                                {resetMessage && (
                                    <p className="text-sm text-red-600 mt-2 text-center">{resetMessage}</p>
                                )}
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowForgotPopup(false)}>
                                    {t("Close")}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <div className="text-center mt-8">
                        <p className="text-muted-foreground/50 text-sm">
                            {t("secure_fast_reliable")}
                        </p>
                    </div>
                </div>
            </div>
            {/* 🆕 Không cần <Toaster /> ở đây vì đã global ở layout */}
        </>
    );
}