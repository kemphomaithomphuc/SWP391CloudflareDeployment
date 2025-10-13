import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";  // Để decode claims
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Separator } from "./components/ui/separator";
import { Zap } from "lucide-react";
import { useLanguage } from "./contexts/LanguageContext";
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from "@react-oauth/google"; // Thêm import
import FacebookLogin from "@greatsumini/react-facebook-login"; // Thêm import

interface LoginProps {
    onSwitchToRegister: () => void;
    onLogin?: () => void;
    onStaffLogin?: () => void;
    onAdminLogin?: () => void;
}

export default function Login({ onSwitchToRegister, onLogin, onStaffLogin, onAdminLogin }: LoginProps) {
    const { t } = useLanguage();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");

        if (code && (state === "google" || state === "facebook")) {
            console.log("Detected OAuth callback:", state, code);

            (async () => {
                try {
                    setLoading(true);

                    const res = await axios.get(
                        `http://localhost:8080/api/auth/social/callback?code=${encodeURIComponent(
                            code
                        )}&state=${encodeURIComponent(state)}`
                    );

                    if (res.data?.success && res.data?.data?.accessToken) {
                        const { accessToken, refreshToken } = res.data.data;
                        localStorage.setItem("token", accessToken);
                        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

                        // Gọi API /me để lấy userId
                        const meRes = await axios.post(
                            "http://localhost:8080/api/auth/me",
                            null,
                            { headers: { Authorization: `Bearer ${accessToken}` } }
                        );

                        if (meRes.data?.success && meRes.data?.data) {
                            const userId = meRes.data.data;
                            localStorage.setItem("userId", String(userId));
                        }

                        // Decode JWT để lấy role & email
                        const decoded: any = jwtDecode(accessToken);
                        const role = decoded.role?.toLowerCase() || "driver";
                        localStorage.setItem("role", role);
                        localStorage.setItem("email", decoded?.sub || "");

                        // Điều hướng theo vai trò
                        if (role === "driver") onLogin?.();
                        else if (role === "staff") onStaffLogin?.();
                        else if (role === "admin") onAdminLogin?.();
                        else onLogin?.();

                        // Xóa query param trên URL
                        window.history.replaceState({}, document.title, window.location.pathname);
                    } else {
                        setError("Social login failed: Invalid response");
                    }
                } catch (err) {
                    console.error("OAuth callback error:", err);
                    setError("Failed to process social login callback");
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
            return;
        }
        if (!password.trim()) {
            setError("Enter your password");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await axios.post("http://localhost:8080/api/auth/login", {
                username: email.trim(),
                password: password.trim(),
            });

            console.log("Login response:", res.data);

            if (res.status === 200 && res.data?.success && res.data?.data) {
                const { accessToken, refreshToken } = res.data.data;

                if (!accessToken) throw new Error("Response Content Length Mismatch Error");

                localStorage.setItem("token", accessToken);
                localStorage.setItem("refreshToken", refreshToken || "");

                console.log("Token (first 50 chars):", accessToken.substring(0, 50) + "...");

                let effectiveRole = "driver";
                let userId = null;

                try {
                    const decoded: any = jwtDecode(accessToken);
                    console.log("Decoded JWT payload:", decoded);

                    userId = decoded.userId || decoded.id;
                    effectiveRole = decoded.role || "DRIVER";

                    if (userId) localStorage.setItem("userId", userId.toString());
                    localStorage.setItem("role", effectiveRole.toLowerCase());
                    localStorage.setItem("email", decoded.sub);
                } catch (decodeErr: any) {
                    console.error("JWT decode failed:", decodeErr);
                    localStorage.setItem("role", "driver");
                    localStorage.setItem("userId", "0");
                }

                const roleLower = effectiveRole.toLowerCase();
                if (roleLower === "driver") onLogin?.();
                else if (roleLower === "staff") onStaffLogin?.();
                else if (roleLower === "admin") onAdminLogin?.();
                else onLogin?.();
            } else {
                setError("Login Failed - Invalid response structure");
            }
        } catch (err: any) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                setError("Username or password is incorrect");
            } else if (err.response?.status === 500) {
                setError("Server error. Please try again later.");
            } else if (err.response?.status === 400) {
                setError("Bad request. Please check your input.");
            } else if (err.code === "ECONNREFUSED" || err.message?.includes("Network Error")) {
                setError("Cannot connect to server. Please try again later.");
            } else {
                setError("An unexpected error occurred. Please try again.");
                console.error("Login error:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    // GOOGLE LOGIN (redirect)
    const handleGoogleLogin = async () => {
        try {
            const res = await axios.get("http://localhost:8080/api/auth/social/login?loginType=google");
            if (res.data?.data) {
                window.location.href = res.data.data; // Redirect sang Google OAuth
            } else {
                setError("Không thể lấy URL đăng nhập Google");
            }
        } catch (err) {
            console.error("Google login error:", err);
            setError("Kết nối tới Google thất bại");
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
            }
        } catch (err) {
            console.error("Facebook login error:", err);
            setError("Kết nối tới Facebook thất bại");
        }
    };

    //Sau khi BE trả về JSON token (thay vì redirect FE), ta xử lý ở đây
    const handleSocialCallback = async (loginType: "google" | "facebook") => {
        try {
            // Gửi request callback đến BE
            const res = await axios.get(
                `http://localhost:8080/api/auth/social/callback?state=${loginType}&code=YOUR_CODE_HERE`
            );
            if (res.data?.success && res.data?.data?.accessToken) {
                const { accessToken, refreshToken } = res.data.data;
                localStorage.setItem("token", accessToken);
                if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

                // Lấy userId từ token
                const meRes = await axios.post(
                    "http://localhost:8080/api/auth/me",
                    null,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                if (meRes.data?.success && meRes.data?.data)
                    localStorage.setItem("userId", meRes.data.data.toString());

                // Decode JWT để lấy role
                const decoded: any = jwtDecode(accessToken);
                const role = decoded.role?.toLowerCase() || "driver";
                localStorage.setItem("role", role);
                localStorage.setItem("email", decoded.sub || "");

                // Điều hướng role
                if (role === "driver") onLogin?.();
                else if (role === "staff") onStaffLogin?.();
                else if (role === "admin") onAdminLogin?.();
                else onLogin?.();
            } else {
                setError("Social login failed: invalid response");
            }
        } catch (err) {
            console.error("Social callback error:", err);
            setError("Social login failed");
        }
    };

    const handleStaffLogin = () => onStaffLogin?.();
    const handleAdminLogin = () => onAdminLogin?.();

    return (
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
                                    className="h-12 bg-input-background/50 border-border/60 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/60"
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-foreground/90 font-medium">{t("Password")}</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t("Password")}
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

                    <div className="text-center pt-2 space-y-2">
                        <p className="text-muted-foreground/70">
                            {t("no_account")}{" "}
                            <button
                                onClick={onSwitchToRegister}
                                className="text-primary hover:text-primary/80 font-medium transition-colors duration-200 hover:underline underline-offset-4"
                            >
                                {t("Create account")}
                            </button>
                        </p>
                        <div className="relative">
                            <Separator className="bg-border/20" />
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3">
                                <span className="text-muted-foreground/50 text-xs">{t("or")}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Button
                                variant="outline"
                                onClick={handleStaffLogin}
                                className="w-full h-10 bg-secondary/30 border-border/40 hover:bg-secondary/50 hover:border-border rounded-lg transition-all duration-200 text-sm"
                            >
                                {t("Sign in to staff")}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleAdminLogin}
                                className="w-full h-10 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-700 rounded-lg transition-all duration-200 text-sm text-red-700 dark:text-red-300 font-medium"
                            >
                                {t("Sign in to admin")}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-8">
                    <p className="text-muted-foreground/50 text-sm">
                        {t("secure_fast_reliable")}
                    </p>
                </div>
            </div>
        </div>
    );
}