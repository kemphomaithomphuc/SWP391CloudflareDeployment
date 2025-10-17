import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Checkbox } from "./components/ui/checkbox";
import { Zap, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "./contexts/LanguageContext";
import { useState } from "react";
import { toast } from "sonner";
import axios from "axios";

interface RegisterProps {
  onSwitchToLogin: () => void;
  onSwitchToRoleSelection: () => void;
  onLogin?: () => void;
  onStaffLogin?: () => void;
  onAdminLogin?: () => void;
}

export default function Register({
  onSwitchToLogin,
  onSwitchToRoleSelection,
}: RegisterProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Google: gọi BE lấy URL Google OAuth, rồi chuyển hướng
  const callApiForGoogleRegister = async (): Promise<void> => {
    try {
      const res = await axios.get(
        "http://localhost:8080/api/auth/social/login?loginType=google"
      );
      const oauthUrl = res?.data?.data as string | undefined;
      if (res.status === 200 && oauthUrl) {
        // Thêm source parameter để phân biệt nguồn gốc
        const urlWithSource = oauthUrl + (oauthUrl.includes('?') ? '&' : '?') + 'source=register';
        window.location.href = urlWithSource;
        return;
      }
      throw new Error("Missing OAuth URL from backend");
    } catch (err) {
      console.error("Failed to start Google OAuth:", err);
      setError("Failed to initiate Google registration");
    }
  };

  // Facebook: sửa đúng loginType=Facebook
  const callApiForFacebookRegister = async (): Promise<void> => {
    try {
      const res = await axios.get(
        "http://localhost:8080/api/auth/social/login?loginType=facebook"
      );
      const oauthUrl = res?.data?.data as string | undefined;
      if (res.status === 200 && oauthUrl) {
        // Thêm source parameter để phân biệt nguồn gốc
        const urlWithSource = oauthUrl + (oauthUrl.includes('?') ? '&' : '?') + 'source=register';
        window.location.href = urlWithSource;
        return;
      }
      throw new Error("Missing OAuth URL from backend");
    } catch (err) {
      console.error("Failed to start Facebook OAuth:", err);
      setError("Failed to initiate Facebook registration");
    }
  };

  // OAuth redirect logic đã được chuyển sang App.tsx để xử lý tập trung

  const callApiForRegister = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        fullName: firstName.trim() + " " + lastName.trim(),
        email: email.trim(),
        password: password.trim(),
        confirmedPassword: confirmedPassword.trim(),
      };

      const res = await axios.post(
        "http://localhost:8080/api/auth/register",
        payload
      );

      if (res.status === 200 || res.status === 201) {
        const successMsg = res.data?.message || "Registered successfully";
        toast.success(successMsg);
        const userId = res.data?.data;
        localStorage.setItem("registeredUserId", userId);
        onSwitchToRoleSelection();
        return;
      }
      throw new Error("Register failed");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Registration failed";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() === "" || email == null) {
      const errMsg = "Email is not allowed to empty";
      setError(errMsg);
      toast.error(errMsg);
      return;
    }
    if (firstName.trim() === "" || firstName == null) {
      const errMsg = "First Name is not allowed to empty";
      setError(errMsg);
      toast.error(errMsg);
      return;
    }
    if (lastName.trim() === "" || lastName == null) {
      const errMsg = "Last Name is not allowed to empty";
      setError(errMsg);
      toast.error(errMsg);
      return;
    }
    if (password.trim() === "" || password == null) {
      const errMsg = "Password is not allowed to empty";
      setError(errMsg);
      toast.error(errMsg);
      return;
    }
    if (password.length < 8) {
      const errMsg = "Password length must be at least 8 characters";
      setError(errMsg);
      toast.error(errMsg);
      return;
    }
    if (confirmedPassword.trim() === "" || confirmedPassword == null) {
      const errMsg = "Confirmed Password is not allowed to empty";
      setError(errMsg);
      toast.error(errMsg);
      return;
    }
    if (confirmedPassword.length < 8) {
      const errMsg = "Confirmed Password length must be at least 8 characters";
      setError(errMsg);
      toast.error(errMsg);
      return;
    }
    if (password !== confirmedPassword) {
      const errMsg = "Confirmed Password does not match";
      setError(errMsg);
      toast.error(errMsg);
      return;
    }
    try {
      await callApiForRegister();
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-2xl shadow-primary/5 p-8 space-y-8">
          <div className="flex justify-start -mt-2">
            <button
              onClick={onSwitchToLogin}
              className="flex items-center space-x-1.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors duration-300 p-1 -ml-1 text-sm opacity-75 hover:opacity-100"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t("back")}</span>
            </button>
          </div>

          <div className="text-center space-y-6">
            <div className="flex items-center justify-center">
              <div className="relative group">
                <div className="absolute -inset-8 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent animate-pulse"></div>
                <div
                  className="absolute -inset-6 rounded-full bg-gradient-to-r from-primary/15 via-primary/8 to-transparent animate-pulse"
                  style={{ animationDelay: "0.5s" }}
                ></div>

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

                  <div className="absolute -top-2 -right-2 w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="absolute -bottom-1 -left-2 w-0.5 h-0.5 bg-accent-foreground rounded-full animate-bounce" style={{ animationDelay: "0.8s" }}></div>
                  <div className="absolute top-1/2 -right-4 w-0.5 h-0.5 bg-primary/60 rounded-full animate-pulse"></div>
                </div>

                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-1/2 w-0.5 h-8 bg-gradient-to-t from-primary/40 to-transparent transform -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute bottom-0 left-1/2 w-0.5 h-6 bg-gradient-to-b from-primary/40 to-transparent transform -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ transitionDelay: "0.1s" }}></div>
                  <div className="absolute left-0 top-1/2 h-0.5 w-6 bg-gradient-to-l from-primary/40 to-transparent transform -translate-y-1/2 -translate-x-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ transitionDelay: "0.2s" }}></div>
                  <div className="absolute right-0 top-1/2 h-0.5 w-8 bg-gradient-to-r from-primary/40 to-transparent transform -translate-y-1/2 translate-x-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ transitionDelay: "0.3s" }}></div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-foreground tracking-tight bg-gradient-to-r from-foreground via-primary/80 to-foreground bg-clip-text">
                {t("chargehub")}
              </h1>
              <div className="relative">
                <p className="text-muted-foreground/90 font-medium">
                  {t("join_future_charging")}
                </p>
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
              </div>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-foreground/90 font-medium"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Nhập địa chỉ email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-input-background/50 border-border/60 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label
                    htmlFor="firstName"
                    className="text-foreground/90 font-medium"
                  >
                    {t("first_name")}
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder={t("enter_first_name")}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-12 bg-input-background/50 border-border/60 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="lastName"
                    className="text-foreground/90 font-medium"
                  >
                    {t("last_name")}
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder={t("enter_last_name")}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-12 bg-input-background/50 border-border/60 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-foreground/90 font-medium"
                >
                  {t("password")}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("create_strong_password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-input-background/50 border-border/60 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/60 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-foreground/90 font-medium"
                >
                  {t("confirm_password")}
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t("confirm_your_password")}
                    value={confirmedPassword}
                    onChange={(e) => setConfirmedPassword(e.target.value)}
                    className="h-12 bg-input-background/50 border-border/60 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/60 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-start space-x-3 pt-2">
                <Checkbox id="terms" className="mt-1" />
                <div className="text-sm leading-relaxed">
                  <Label
                    htmlFor="terms"
                    className="text-muted-foreground/80 font-normal cursor-pointer"
                  >
                    {t("i_agree_to_the")}{" "}
                    <button className="text-primary hover:text-primary/80 font-medium transition-colors duration-200 hover:underline underline-offset-4">
                      {t("terms_of_service")}
                    </button>{" "}
                    {t("and")}{" "}
                    <button className="text-primary hover:text-primary/80 font-medium transition-colors duration-200 hover:underline underline-offset-4">
                      {t("privacy_policy")}
                    </button>
                  </Label>
                </div>
              </div>
            </div>

            <Button
              className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20 rounded-xl transition-all duration-200 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5"
              type="submit"
              disabled={loading}
            >
              {t("create_chargehub_account")}
            </Button>
          </form>

          {loading && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-primary text-sm flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span>Processing social login...</span>
            </div>
          )}


          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm">
              {error}
            </div>
          )}

          <Button
            variant="outline"
            onClick={callApiForGoogleRegister}
            className="w-full h-12 bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex items-center justify-center space-x-3 text-gray-700 font-medium"
            style={{
              boxShadow:
                "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-medium">Sign up with Google</span>
          </Button>

          <Button
            variant="outline"
            onClick={callApiForFacebookRegister}
            className="w-full h-12 bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex items-center justify-center space-x-3 text-gray-700 font-medium"
            style={{
              boxShadow:
                "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#1877F2"
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
              />
            </svg>
            <span className="font-medium">Sign up with Facebook</span>
          </Button>

          <div className="text-center pt-2">
            <p className="text-muted-foreground/70">
              {t("already_have_account")}{" "}
              <button
                onClick={onSwitchToLogin}
                className="text-primary hover:text-primary/80 font-medium transition-colors duration-200 hover:underline underline-offset-4"
              >
                {t("sign_in_here")}
              </button>
            </p>
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