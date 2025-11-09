import { Button } from "./components/ui/button";
import { ArrowLeft, Zap } from "lucide-react";
import { useLanguage } from "./contexts/LanguageContext";
import { useState } from "react";
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
  const { t, language, setLanguage } = useLanguage();
  const [providerLoading, setProviderLoading] = useState<"google" | "facebook" | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const startSocialRegister = async (provider: "google" | "facebook") => {
    setProviderLoading(provider);
    setErrorKey(null);
    try {
      const res = await axios.get(
        `http://localhost:8080/api/auth/social/login?loginType=${provider}`
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
      </div>
    </div>
  );
}