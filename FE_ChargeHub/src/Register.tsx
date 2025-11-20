import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Separator } from "./components/ui/separator";
import PasswordInput from "./components/ui/PasswordInput";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./components/ui/dialog";
import { ArrowLeft, Zap } from "lucide-react";
import { useLanguage } from "./contexts/LanguageContext";
import { useState } from "react";
import { api } from "./services/api";

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
  const { t, language, setLanguage } = useLanguage();
  const [providerLoading, setProviderLoading] = useState<"google" | "facebook" | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmedPassword, setConfirmedPassword] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [showOtpDialog, setShowOtpDialog] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>("");
  const [otpError, setOtpError] = useState<string | null>(null);

  const startSocialRegister = async (provider: "google" | "facebook") => {
    setProviderLoading(provider);
    setErrorKey(null);
    try {
      const res = await api.get(
        `/api/auth/social/login?loginType=${provider}`
      );
      const oauthUrl = res?.data?.data as string | undefined;
      if (res.status === 200 && oauthUrl) {
        const urlWithSource =
          oauthUrl + (oauthUrl.includes("?") ? "&" : "?") + "source=register";
        window.location.href = urlWithSource;
        return;
      }
      throw new Error("Missing OAuth URL from backend");
    } catch (error) {
      console.error(`Failed to start ${provider} OAuth:`, error);
      setErrorKey(
        provider === "google"
          ? "Failed to initiate Google registration"
          : "Failed to initiate Facebook registration"
      );
    } finally {
      setProviderLoading(null);
    }
  };

  void onSwitchToRoleSelection; // navigation handled after social login callback in App.tsx

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setOtpError(null);

    if (!fullName || !email || !password || !confirmedPassword) {
      setFormError(language === "vi" ? "Vui lòng nhập đầy đủ thông tin." : "Please fill in all fields.");
      return;
    }
    if (password !== confirmedPassword) {
      setFormError(language === "vi" ? "Mật khẩu xác nhận không khớp." : "Confirmed password does not match.");
      return;
    }

    try {
      setSubmitting(true);

      // Gửi OTP đăng ký trước
      try {
        const otpRes = await api.post(`/api/otp/send/registration`, { email });
        if (!(otpRes.status >= 200 && otpRes.status < 300)) {
          throw new Error("OTP send failed");
        }
        // Mở popup nhập OTP và dừng tại đây, chờ người dùng xác nhận OTP
        setShowOtpDialog(true);
        return;
      } catch (otpErr: any) {
        const message =
          otpErr?.response?.data?.message ||
          (language === "vi" ? "Gửi OTP thất bại. Vui lòng thử lại." : "Failed to send OTP. Please try again.");
        setFormError(message);
        return;
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        (language === "vi" ? "Đăng ký thất bại. Vui lòng thử lại." : "Registration failed. Please try again.");
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmOtp = async () => {
    setOtpError(null);
    if (!/^\d{6}$/.test(otpCode)) {
      setOtpError(language === "vi" ? "Mã OTP phải gồm 6 chữ số." : "OTP must be 6 digits.");
      return;
    }

    try {
      setSubmitting(true);

      // 1) Xác thực OTP
      const verifyRes = await api.post(`/api/otp/verify/registration`, {
        email,
        otpCode,
      });

      const isSuccess = verifyRes?.data?.success === true;
      const verifiedEmail = verifyRes?.data?.email;
      if (!isSuccess || !verifiedEmail) {
        const msg =
          verifyRes?.data?.message ||
          (language === "vi" ? "Xác thực OTP thất bại. Vui lòng thử lại." : "OTP verification failed. Please try again.");
        setOtpError(msg);
        return;
      }

      // 2) Gọi đăng ký sau khi OTP OK
      const res = await api.post(`/api/auth/register`, {
        fullName,
        email: verifiedEmail || email,
        password,
        confirmedPassword,
      });

      if (res.status >= 200 && res.status < 300) {
        setFormSuccess(language === "vi" ? "Đăng ký thành công! Vui lòng đăng nhập." : "Registration successful! Please log in.");
        setShowOtpDialog(false);
        setOtpCode("");
        // Điều hướng sang chọn vai trò
        onSwitchToRoleSelection();
      } else {
        setFormError(language === "vi" ? "Đăng ký thất bại. Vui lòng thử lại." : "Registration failed. Please try again.");
      }
    } catch (err: any) {
      const message = err?.response?.data?.message;
      if (message && message.toLowerCase().includes("otp")) {
        setOtpError(message);
      } else {
        setFormError(
          message ||
            (language === "vi" ? "Đăng ký thất bại. Vui lòng thử lại." : "Registration failed. Please try again.")
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-2xl shadow-primary/5 p-8 space-y-8">
          <div className="flex justify-between items-center">
            <button
              onClick={() => {
                onSwitchToLogin();
              }}
              className="flex items-center space-x-1.5 text-muted-foreground/70 hover:text-foreground transition-colors text-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t("back")}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  language === "en"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("vi")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  language === "vi"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                VI
              </button>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Zap className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-foreground">
                {t("chargehub")}
              </h1>
              <p className="text-muted-foreground">
                {language === "vi"
                  ? "Đăng ký nhanh chóng bằng tài khoản Google hoặc Facebook."
                  : "Register instantly with your Google or Facebook account."}
              </p>
            </div>
          </div>

          {errorKey && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm">
              {t(errorKey)}
            </div>
          )}

          <form className="space-y-4 pt-2" onSubmit={handleEmailRegister}>
            <div className="space-y-2">
              <Label htmlFor="fullName">{language === "vi" ? "Họ và tên" : "Full name"}</Label>
              <Input
                id="fullName"
                placeholder={language === "vi" ? "Nhập họ và tên" : "Enter full name"}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{language === "vi" ? "Email" : "Email"}</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{language === "vi" ? "Mật khẩu" : "Password"}</Label>
              <PasswordInput
                id="password"
                placeholder={language === "vi" ? "Nhập mật khẩu" : "Enter password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmedPassword">{language === "vi" ? "Xác nhận mật khẩu" : "Confirm password"}</Label>
              <PasswordInput
                id="confirmedPassword"
                placeholder={language === "vi" ? "Nhập lại mật khẩu" : "Re-enter password"}
                value={confirmedPassword}
                onChange={(e) => setConfirmedPassword(e.target.value)}
                disabled={submitting}
              />
            </div>

            {formError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-emerald-600 text-sm">
                {formSuccess}
              </div>
            )}

            <Button type="submit" className="w-full h-11" disabled={submitting}>
              {submitting
                ? language === "vi"
                  ? "Đang đăng ký..."
                  : "Registering..."
                : language === "vi"
                ? "Đăng ký bằng email"
                : "Register with Email"}
            </Button>
          </form>

          <div className="mt-6">
            <Separator />
          </div>

          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={() => startSocialRegister("google")}
              disabled={providerLoading !== null}
              className="w-full h-12 flex items-center justify-center gap-3 bg-white text-gray-700 border border-border hover:bg-gray-50"
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
              <span className="font-medium">
                {language === "vi" ? "Xác thực email với Google" : "Verify email with Google"}
              </span>
            </Button>

            <Button
              variant="outline"
              onClick={() => startSocialRegister("facebook")}
              disabled={providerLoading !== null}
              className="w-full h-12 flex items-center justify-center gap-3 bg-white text-gray-700 border border-border hover:bg-gray-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#1877F2"
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
              </svg>
              <span className="font-medium">
                {language === "vi" ? "Xác thực email với Facebook" : "Verify email with Facebook"}
              </span>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              {language === "vi"
                ? "Email sẽ được xác thực và chuyển thẳng đến bước tiếp theo."
                : "Your email will be verified and sent straight to the next step."}
            </p>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-muted-foreground/60 text-sm">
            {t("secure_fast_reliable")}
          </p>
        </div>

        <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{language === "vi" ? "Nhập mã OTP" : "Enter OTP code"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {language === "vi"
                  ? "Chúng tôi đã gửi mã OTP gồm 6 chữ số đến email của bạn."
                  : "We sent a 6-digit OTP code to your email."}
              </p>
              <Input
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                placeholder={language === "vi" ? "Nhập 6 số OTP" : "Enter 6-digit OTP"}
                value={otpCode}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtpCode(v);
                }}
                autoFocus
              />
              {otpError && <div className="text-destructive text-sm">{otpError}</div>}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowOtpDialog(false);
                  setOtpCode("");
                }}
                disabled={submitting}
              >
                {language === "vi" ? "Hủy" : "Cancel"}
              </Button>
              <Button type="button" onClick={handleConfirmOtp} disabled={submitting || otpCode.length !== 6}>
                {submitting
                  ? language === "vi" ? "Đang xác nhận..." : "Confirming..."
                  : language === "vi" ? "Xác nhận OTP" : "Confirm OTP"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}