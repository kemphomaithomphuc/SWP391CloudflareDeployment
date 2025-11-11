import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { CreditCard, Wallet, AlertTriangle, ChevronRight, Info } from "lucide-react";

import { useLanguage } from "./contexts/LanguageContext";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import retryPayment, { type RetryPaymentRequest } from "./api/retryPayment";

type PaymentStatus = "pending" | "processing" | "success" | "failed";

interface PenaltySummary {
  failedTransactionIds: number[];
  totalFailedTransactions: number;
  totalFailedAmount: number;
  pendingTransactionIds: number[];
  totalPendingTransactions: number;
  totalPendingAmount: number;
}

interface PenaltyRetryInfo {
  totalAmount?: number;
  currency?: string;
  transactionId?: number;
  penalties?: Array<{
    penaltyId?: number;
    transactionId?: number;
    description?: string;
    amount?: number;
  }>;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

const loadPenaltySummary = (): PenaltySummary | null => {
  const raw = localStorage.getItem("penaltySummary");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return {
      failedTransactionIds: Array.isArray(parsed?.failedTransactionIds) ? parsed.failedTransactionIds : [],
      totalFailedTransactions: Number(parsed?.totalFailedTransactions) || 0,
      totalFailedAmount: Number(parsed?.totalFailedAmount) || 0,
      pendingTransactionIds: Array.isArray(parsed?.pendingTransactionIds) ? parsed.pendingTransactionIds : [],
      totalPendingTransactions: Number(parsed?.totalPendingTransactions) || 0,
      totalPendingAmount: Number(parsed?.totalPendingAmount) || 0,
    };
  } catch (error) {
    console.warn("Unable to parse penaltySummary", error);
    return null;
  }
};

const loadRetryInfo = (): PenaltyRetryInfo | null => {
  const raw = localStorage.getItem("penaltyRetryInfo");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Unable to parse penaltyRetryInfo", error);
    return null;
  }
};

export default function PayUnpaid() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PenaltySummary | null>(null);
  const [retryInfo, setRetryInfo] = useState<PenaltyRetryInfo | null>(null);
  const [primaryTransactionId, setPrimaryTransactionId] = useState<number | null>(null);

  const userId = useMemo(() => {
    const rawUserId = localStorage.getItem("userId");
    if (!rawUserId) return 0;
    const parsed = Number(rawUserId);
    return Number.isFinite(parsed) ? parsed : 0;
  }, []);

  useEffect(() => {
    if (userId === 0) {
      toast.error(
        language === "vi"
          ? "Không xác định được thông tin người dùng. Vui lòng đăng nhập lại."
          : "Unable to identify user information. Please log in again."
      );
      navigate("/login", { replace: true });
      return;
    }

    let primaryFromSources: number | null = null;

    const paramTransactionId = Number(searchParams.get("transactionId"));
    if (Number.isFinite(paramTransactionId) && paramTransactionId > 0) {
      primaryFromSources = paramTransactionId;
    }

    const summaryData = loadPenaltySummary();
    const retryData = loadRetryInfo();

    if (summaryData) {
      setSummary(summaryData);
      const primary =
        summaryData.failedTransactionIds[0] ??
        summaryData.pendingTransactionIds[0] ??
        null;
      const numericPrimary = Number(primary);
      if (primary != null && Number.isFinite(numericPrimary) && numericPrimary > 0) {
        primaryFromSources = numericPrimary;
      }
    }

    if (retryData) {
      setRetryInfo(retryData);
      const retryTransactionId = Number(retryData.transactionId);
      if (
        retryData.transactionId != null &&
        Number.isFinite(retryTransactionId) &&
        retryTransactionId > 0
      ) {
        primaryFromSources = retryTransactionId;
      } else if (retryData?.penalties?.length) {
        const penalty = retryData.penalties.find((item) =>
          Number.isFinite(Number(item.transactionId ?? item.penaltyId)) &&
          Number(item.transactionId ?? item.penaltyId) > 0
        );
        const fallback =
          penalty?.transactionId ??
          penalty?.penaltyId ??
          null;
        const numericFallback = Number(fallback);
        if (fallback != null && Number.isFinite(numericFallback) && numericFallback > 0) {
          primaryFromSources = numericFallback;
        }
      }
    }

    if (
      primaryFromSources != null &&
      Number.isFinite(primaryFromSources) &&
      primaryFromSources > 0
    ) {
      setPrimaryTransactionId(primaryFromSources);
    }

    if (!summaryData && !retryData) {
      toast(
        language === "vi"
          ? "Không tìm thấy dữ liệu phí phạt cần thanh toán. Vui lòng thử lại sau."
          : "No outstanding penalty data found. Please try again later."
      );
    }

    setLoading(false);
  }, [language, navigate, userId, searchParams]);

  const totalDue = retryInfo?.totalAmount ?? summary?.totalFailedAmount ?? 0;

  const handlePayNow = async () => {
    if (!primaryTransactionId) {
      toast.error(
        language === "vi"
          ? "Không tìm thấy giao dịch cần thanh toán. Vui lòng thử lại."
          : "Unable to determine the transaction to pay. Please try again."
      );
      return;
    }

    setPaymentStatus("processing");

    const payload: RetryPaymentRequest = {
      transactionId: primaryTransactionId,
      userId,
      paymentMethod: "VNPAY",
    };

    try {
      const response = await retryPayment(payload);
      if (response?.success) {
        const paymentUrl =
          response.data?.paymentUrl ??
          (typeof response.data?.paymentDetail === "object" &&
            response.data?.paymentDetail !== null &&
            (response.data?.paymentDetail as any).paymentUrl);

        if (paymentUrl) {
          try {
            localStorage.setItem("penaltyPaymentUrl", paymentUrl);
          } catch (error) {
            console.warn("Unable to cache penaltyPaymentUrl", error);
          }
          window.location.href = paymentUrl;
          return;
        }

        setPaymentStatus("success");
        toast.success(
          language === "vi"
            ? "Khởi tạo thanh toán thành công! Vui lòng hoàn tất giao dịch."
            : "Payment initialized successfully! Please complete the transaction."
        );

        setTimeout(() => navigate("/my-bookings", { replace: true }), 2500);
      } else {
        throw new Error(
          response?.message ||
            (language === "vi" ? "Thanh toán thất bại" : "Payment failed")
        );
      }
    } catch (error: any) {
      console.error("[PayUnpaid] Payment error:", error);
      const backendMessage =
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        error?.message ??
        null;

      setPaymentStatus("failed");
      toast.error(
        language === "vi"
          ? `Thanh toán thất bại: ${backendMessage ?? "Vui lòng thử lại"}`
          : `Payment failed: ${backendMessage ?? "Please try again"}`
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {language === "vi" ? "Đang tải thông tin..." : "Loading information..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 p-4">
      <div className="max-w-3xl mx-auto pt-8 space-y-6">
        <Card className="bg-card/80 backdrop-blur-md border-border/40 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Wallet className="w-6 h-6 text-primary" />
              <span>
                {language === "vi"
                  ? "Thanh toán các giao dịch chưa hoàn tất"
                  : "Complete Outstanding Transactions"}
              </span>
            </CardTitle>
            <CardDescription className="text-base">
              {language === "vi"
                ? "Hoàn tất các giao dịch chưa thanh toán để tiếp tục sử dụng đầy đủ dịch vụ."
                : "Complete pending transactions to continue using all services."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="p-4 rounded-lg border border-border/60 bg-muted/40">
                <p className="text-xs text-muted-foreground uppercase mb-1 tracking-wide">
                  {language === "vi" ? "Giao dịch chính" : "Primary Transaction"}
                </p>
                <p className="text-lg font-semibold">
                  {primaryTransactionId ?? "—"}
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border/60 bg-muted/40">
                <p className="text-xs text-muted-foreground uppercase mb-1 tracking-wide">
                  {language === "vi" ? "Tổng số tiền" : "Total Amount"}
                </p>
                <p className="text-lg font-semibold text-primary">
                  {formatCurrency(totalDue)}
                </p>
              </div>
            </div>

            {summary && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="p-4 rounded-lg border border-border/50 bg-background">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="font-medium text-sm">
                      {language === "vi" ? "Giao dịch thất bại" : "Failed Transactions"}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      {language === "vi"
                        ? `${summary.totalFailedTransactions} giao dịch`
                        : `${summary.totalFailedTransactions} transaction(s)`}
                    </p>
                    <p className="font-semibold text-foreground">
                      {formatCurrency(summary.totalFailedAmount)}
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-border/50 bg-background">
                  <div className="flex items-center gap-2 mb-2">
                    <ChevronRight className="w-4 h-4 text-sky-600" />
                    <span className="font-medium text-sm">
                      {language === "vi" ? "Giao dịch đang chờ" : "Pending Transactions"}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      {language === "vi"
                        ? `${summary.totalPendingTransactions} giao dịch`
                        : `${summary.totalPendingTransactions} transaction(s)`}
                    </p>
                    <p className="font-semibold text-foreground">
                      {formatCurrency(summary.totalPendingAmount)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {retryInfo?.penalties?.length ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  {language === "vi"
                    ? "Chi tiết khoản phí"
                    : "Penalty details"}
                </p>
                <div className="space-y-2">
                  {retryInfo.penalties.map((penalty, index) => (
                    <div
                      key={penalty.penaltyId ?? index}
                      className="flex items-center justify-between rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-sm"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {language === "vi"
                            ? `Phí ${penalty.penaltyId ?? index + 1}`
                            : `Penalty ${penalty.penaltyId ?? index + 1}`}
                        </span>
                        {penalty.description && (
                          <span className="text-muted-foreground text-xs">
                            {penalty.description}
                          </span>
                        )}
                      </div>
                      <Badge variant="outline">
                        {formatCurrency(Number(penalty.amount ?? 0))}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-lg border border-amber-400/60 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-800 dark:text-amber-200">
              <p className="font-semibold mb-1">
                {language === "vi" ? "Lưu ý" : "Reminder"}
              </p>
              <p>
                {language === "vi"
                  ? "Sau khi thanh toán, hệ thống sẽ tự động cập nhật trạng thái trong vài phút."
                  : "Once the payment is completed, the system will update your status within a few minutes."}
              </p>
            </div>

            <div className="space-y-3">
              {paymentStatus === "pending" && (
                <Button
                  onClick={handlePayNow}
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  {language === "vi" ? "Thanh toán ngay" : "Pay Now"}
                </Button>
              )}

              {paymentStatus === "processing" && (
                <Button disabled size="lg" className="w-full">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-b-transparent border-current rounded-full animate-spin" />
                    <span>
                      {language === "vi"
                        ? "Đang khởi tạo thanh toán..."
                        : "Initializing payment..."}
                    </span>
                  </div>
                </Button>
              )}

              {paymentStatus === "success" && (
                <div className="rounded-lg border border-green-500/60 bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-700 dark:text-green-200">
                  <p className="font-semibold mb-1">
                    {language === "vi"
                      ? "Khởi tạo thanh toán thành công!"
                      : "Payment initialized successfully!"}
                  </p>
                  <p>
                    {language === "vi"
                      ? "Bạn sẽ được chuyển đến trang giao dịch. Nếu không, vui lòng kiểm tra email hoặc lịch sử giao dịch."
                      : "You will be redirected to the payment gateway. If not, please check your email or transaction history."}
                  </p>
                </div>
              )}

              {paymentStatus === "failed" && (
                <div className="rounded-lg border border-red-500/60 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-200 space-y-2">
                  <p className="font-semibold">
                    {language === "vi"
                      ? "Thanh toán thất bại"
                      : "Payment failed"}
                  </p>
                  <p>
                    {language === "vi"
                      ? "Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề tiếp tục xảy ra."
                      : "Please try again or contact support if the issue persists."}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setPaymentStatus("pending")}>
                      {language === "vi" ? "Thử lại" : "Retry"}
                    </Button>
                    <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                      {language === "vi" ? "Về trang chủ" : "Back to Home"}
                    </Button>
                  </div>
                </div>
              )}

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate("/dashboard")}
              >
                {language === "vi" ? "Quay lại trang chủ" : "Back to Dashboard"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background border-border/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              <span>{language === "vi" ? "Hỗ trợ & Liên hệ" : "Support & Contact"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              {language === "vi"
                ? "Nếu bạn gặp vấn đề trong quá trình thanh toán, vui lòng liên hệ đội ngũ hỗ trợ của ChargeHub."
                : "If you encounter issues during the payment process, please contact ChargeHub support."}
            </p>
            <p className="font-medium text-foreground">
              support@chargehub.com
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

