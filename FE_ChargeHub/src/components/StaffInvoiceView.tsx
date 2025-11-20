import { useEffect, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { api } from "../services/api";
import { 
  ArrowLeft,
  DollarSign,
  User,
  Loader2,
  Power,
  FileSpreadsheet,
  BarChart3,
  RefreshCw
} from "lucide-react";

interface StaffInvoiceViewProps {
  onBack: () => void;
}

interface StaffStationInfo {
  userId: number;
  fullName: string;
  email: string;
  dateOfBirth: string;
  address: string;
  role: string;
  status: string;
  stationId: number;
  stationName: string;
  stationAddress: string;
}

interface ChargingSession {
  sessionId: number;
  orderId: number;
  userId: number;
  userName: string;
  userPhone: string;
  chargingPointId: number;
  connectorType: string;
  powerOutput: number;
  startTime: string;
  endTime: string | null;
  powerConsumed: number;
  baseCost: number;
  status: string;
  isOvertime: boolean;
  overtimeMinutes: number | null;
}

export default function StaffInvoiceView({ onBack }: StaffInvoiceViewProps) {
  const { t, language } = useLanguage();
  const [staffInfo, setStaffInfo] = useState<StaffStationInfo | null>(null);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffRefreshKey, setStaffRefreshKey] = useState(0);
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [sessionsRefreshKey, setSessionsRefreshKey] = useState(0);
  const [processingSessionId, setProcessingSessionId] = useState<number | null>(null);

  useEffect(() => {
    const fetchStaffStation = async () => {
      setIsLoadingStaff(true);
      setStaffError(null);

      const storedUserId = localStorage.getItem("userId");
      if (!storedUserId) {
        const message =
          language === "vi"
            ? "Không tìm thấy thông tin nhân viên. Vui lòng đăng nhập lại."
            : "Staff information not found. Please log in again.";
        setStaffError(message);
        setIsLoadingStaff(false);
        return;
      }

      try {
        const response = await api.get(`/api/staff-management/staff/${storedUserId}`);
        if (response.data?.success && response.data?.data) {
          setStaffInfo(response.data.data as StaffStationInfo);
        } else {
          const message =
            response.data?.message ||
            (language === "vi"
              ? "Không thể tải thông tin nhân viên."
              : "Unable to load staff information.");
          setStaffError(message);
          toast.error(message);
        }
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          (language === "vi"
            ? "Đã xảy ra lỗi khi tải thông tin nhân viên."
            : "Failed to load staff information.");
        setStaffError(message);
        toast.error(message);
      } finally {
        setIsLoadingStaff(false);
      }
    };

    fetchStaffStation();
  }, [language, staffRefreshKey]);



  useEffect(() => {
    const fetchSessions = async () => {
      if (!staffInfo?.stationId) {
        return;
      }

      setIsLoadingSessions(true);
      setSessionsError(null);

      try {
        const response = await api.get(`/api/staff/station/${staffInfo.stationId}/sessions`);
        if (response.data?.success && Array.isArray(response.data?.data)) {
          setSessions(response.data.data as ChargingSession[]);
        } else {
          const message =
            response.data?.message ||
            (language === "vi"
              ? "Không thể tải danh sách phiên sạc."
              : "Unable to load charging sessions.");
          setSessionsError(message);
          toast.error(message);
        }
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          (language === "vi"
            ? "Đã xảy ra lỗi khi tải danh sách phiên sạc."
            : "Failed to load charging sessions.");
        setSessionsError(message);
        toast.error(message);
      } finally {
        setIsLoadingSessions(false);
      }
    };

    fetchSessions();
  }, [staffInfo?.stationId, language, sessionsRefreshKey]);

  const completedSessions = sessions.filter((session) => session.status === "COMPLETED");
  const totalEnergy = completedSessions.reduce((sum, session) => sum + session.powerConsumed, 0);
  const totalRevenue = completedSessions.reduce((sum, session) => sum + session.baseCost, 0);
  const visibleSessions = sessions.slice(0, 8);

  const formatCurrency = (value: number) => {
    return value.toLocaleString(language === "vi" ? "vi-VN" : "en-US", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    });
  };

  const formatDateTime = (isoDate: string | null) => {
    if (!isoDate) {
      return language === "vi" ? "Đang diễn ra" : "In progress";
    }
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
      return isoDate;
    }
    return date.toLocaleString(language === "vi" ? "vi-VN" : "en-US", {
      hour12: false,
    });
  };

  const handleOnsitePayment = async (sessionId: number) => {
    setProcessingSessionId(sessionId);
    try {
      const response = await api.post(`/api/staff/onsite-payment/${sessionId}`);
      const message =
        response.data?.message ||
        (language === "vi"
          ? "Thanh toán tại chỗ thành công."
          : "On-site payment completed successfully.");

      toast.success(message);
      setSessionsRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        (language === "vi"
          ? "Thanh toán tại chỗ thất bại. Vui lòng thử lại."
          : "On-site payment failed. Please try again.");
      toast.error(message);
    } finally {
      setProcessingSessionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-muted-foreground hover:text-foreground touch-manipulation min-h-[44px] px-2 sm:px-3"
              >
                <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="hidden sm:inline text-xs sm:text-sm">Back to Dashboard</span>
                <span className="sm:hidden text-xs">Back</span>
              </Button>
            </div>
            <div className="text-right flex-shrink-0">
              <h1 className="text-base sm:text-lg font-semibold text-foreground">{t('invoice_management')}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">{t('create_manage_invoices')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Staff & Station Info */}
      <div className="container mx-auto px-3 sm:px-4 pt-4 sm:pt-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              {language === "vi" ? "Thông tin nhân viên" : "Staff Information"}
            </CardTitle>
            <CardDescription>
              {language === "vi"
                ? "Thông tin được đồng bộ từ hệ thống quản lý nhân sự"
                : "Details fetched from staff management service"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStaff ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {language === "vi" ? "Đang tải dữ liệu nhân viên..." : "Loading staff data..."}
              </div>
            ) : staffError ? (
              <div className="flex flex-col items-center justify-center gap-4 py-6 text-sm text-muted-foreground">
                <p className="text-center max-w-lg">{staffError}</p>
                <Button variant="outline" onClick={() => setStaffRefreshKey((prev) => prev + 1)} className="touch-manipulation min-h-[36px] text-xs sm:text-sm px-3 sm:px-4">
                  {language === "vi" ? "Thử lại" : "Retry"}
                </Button>
              </div>
            ) : staffInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground">
                    {language === "vi" ? "Nhân viên" : "Staff"}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {language === "vi" ? "Họ tên" : "Full name"}
                      </span>
                      <span className="font-medium text-foreground">{staffInfo.fullName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium text-foreground">{staffInfo.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {language === "vi" ? "Ngày sinh" : "Date of birth"}
                      </span>
                      <span className="font-medium text-foreground">
                        {new Date(staffInfo.dateOfBirth).toLocaleDateString(
                          language === "vi" ? "vi-VN" : "en-US"
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {language === "vi" ? "Trạng thái" : "Status"}
                      </span>
                      <Badge variant="outline" className="uppercase">
                        {staffInfo.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground">
                    {language === "vi" ? "Trạm phụ trách" : "Assigned station"}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {language === "vi" ? "Mã trạm" : "Station ID"}
                      </span>
                      <span className="font-medium text-foreground">{staffInfo.stationId}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">
                        {language === "vi" ? "Tên trạm" : "Station name"}
                      </span>
                      <span className="font-medium text-foreground">{staffInfo.stationName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">
                        {language === "vi" ? "Địa chỉ trạm" : "Station address"}
                      </span>
                      <span className="font-medium text-foreground">{staffInfo.stationAddress}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Charging Sessions Overview */}
      <div className="container mx-auto px-3 sm:px-4 pt-3 sm:pt-4">
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                {language === "vi" ? "Phiên sạc tại trạm" : "Station charging sessions"}
              </CardTitle>
              <CardDescription>
                {language === "vi"
                  ? "Theo dõi hoạt động sạc tại trạm mà bạn phụ trách."
                  : "Monitor charging activity for your assigned station."}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSessionsRefreshKey((prev) => prev + 1)}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingSessions ? "animate-spin" : ""}`} />
                {language === "vi" ? "Làm mới" : "Refresh"}
              </Button>
              <Badge variant="secondary" className="uppercase">
                {staffInfo?.stationName || "Station"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {isLoadingSessions ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {language === "vi" ? "Đang tải dữ liệu phiên sạc..." : "Loading charging sessions..."}
              </div>
            ) : sessionsError ? (
              <div className="flex flex-col items-center justify-center gap-4 py-6 text-sm text-muted-foreground">
                <p className="text-center max-w-lg">{sessionsError}</p>
                <Button variant="outline" onClick={() => setSessionsRefreshKey((prev) => prev + 1)} className="touch-manipulation min-h-[36px] text-xs sm:text-sm px-3 sm:px-4">
                  {language === "vi" ? "Thử lại" : "Retry"}
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {language === "vi" ? "Tổng số phiên" : "Total sessions"}
                      </CardTitle>
                      <FileSpreadsheet className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground">{sessions.length}</div>
                      <p className="text-xs text-muted-foreground">
                        {language === "vi" ? "Bao gồm cả phiên đang diễn ra" : "Including in-progress sessions"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {language === "vi" ? "Tổng năng lượng" : "Total energy delivered"}
                      </CardTitle>
                      <Power className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground">
                        {(Math.round(totalEnergy * 10) / 10).toFixed(1)} kWh
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {language === "vi" ? "Chỉ tính các phiên hoàn tất" : "Completed sessions only"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {language === "vi" ? "Doanh thu ước tính" : "Estimated revenue"}
                      </CardTitle>
                      <DollarSign className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</div>
                      <p className="text-xs text-muted-foreground">
                        {language === "vi" ? "Không bao gồm phụ phí" : "Base cost only"}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-muted-foreground">
                      {language === "vi" ? "Phiên gần đây" : "Recent sessions"}
                    </h4>
                    {sessions.length > visibleSessions.length && (
                      <span className="text-xs text-muted-foreground">
                        {language === "vi"
                          ? `Hiển thị ${visibleSessions.length}/${sessions.length} phiên`
                          : `Showing ${visibleSessions.length}/${sessions.length} sessions`}
                      </span>
                    )}
                  </div>

                  <div className="overflow-x-auto -mx-3 sm:mx-0 rounded-lg border border-border/60">
                    <table className="min-w-full divide-y divide-border text-xs sm:text-sm">
                      <thead className="bg-muted/40 text-[10px] sm:text-xs uppercase text-muted-foreground">
                        <tr>
                          <th scope="col" className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">
                            {language === "vi" ? "Phiên" : "Session"}
                          </th>
                          <th scope="col" className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">
                            {language === "vi" ? "Khách hàng" : "Customer"}
                          </th>
                          <th scope="col" className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium hidden md:table-cell">
                            {language === "vi" ? "Bắt đầu" : "Start"}
                          </th>
                          <th scope="col" className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium hidden lg:table-cell">
                            {language === "vi" ? "Kết thúc" : "End"}
                          </th>
                          <th scope="col" className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium">
                            {language === "vi" ? "Điện năng" : "Energy"}
                          </th>
                          <th scope="col" className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium">
                            {language === "vi" ? "Chi phí" : "Cost"}
                          </th>
                          <th scope="col" className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium">
                            {language === "vi" ? "Hành động" : "Action"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-card/40">
                        {visibleSessions.map((session) => (
                          <tr key={session.sessionId} className="hover:bg-muted/40">
                            <td className="px-2 sm:px-4 py-2 sm:py-3">
                              <div className="font-medium text-foreground text-xs sm:text-sm">#{session.sessionId}</div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">
                                CP-{session.chargingPointId} • {session.connectorType}
                              </div>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3">
                              <div className="font-medium text-foreground text-xs sm:text-sm truncate">{session.userName}</div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground truncate">{session.userPhone}</div>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-foreground text-xs sm:text-sm hidden md:table-cell">{formatDateTime(session.startTime)}</td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-foreground text-xs sm:text-sm hidden lg:table-cell">{formatDateTime(session.endTime)}</td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium text-foreground text-xs sm:text-sm">
                              {session.powerConsumed.toFixed(1)}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium text-foreground text-xs sm:text-sm">
                              {formatCurrency(session.baseCost)}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                              <Button
                                size="sm"
                                onClick={() => handleOnsitePayment(session.sessionId)}
                                disabled={processingSessionId === session.sessionId}
                                className="touch-manipulation min-h-[36px] text-xs sm:text-sm px-2 sm:px-3"
                              >
                                {processingSessionId === session.sessionId ? (
                                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                                ) : (
                                  <>
                                    <span className="hidden sm:inline">{language === "vi" ? "Thanh toán tại chỗ" : "On-site payment"}</span>
                                    <span className="sm:hidden">{language === "vi" ? "Thanh toán" : "Pay"}</span>
                                  </>
                                )}
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {visibleSessions.length === 0 && (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-4 py-6 text-center text-sm text-muted-foreground"
                            >
                              {language === "vi"
                                ? "Chưa có phiên sạc nào được ghi nhận."
                                : "No charging sessions recorded yet."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>


    </div>
  );
}