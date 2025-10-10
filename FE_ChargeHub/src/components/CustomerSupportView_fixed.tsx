import { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  ArrowLeft,
  AlertTriangle,
  Zap,
  Wifi,
  CreditCard,
  Wrench,
  Shield,
  MapPin,
  Clock,
  User,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  Filter,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Search,
  FileText
} from "lucide-react";
import { Input } from "./ui/input";

interface CustomerSupportViewProps {
  onBack: () => void;
}

interface IssueReport {
  id: string;
  stationId: string;
  stationName: string;
  stationAddress: string;
  issues: string[];
  urgency: "low" | "medium" | "high";
  description: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  timestamp: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  assignedTo?: string;
  resolution?: string;
  resolutionDate?: string;
}

// Issue categories for reference
const issueCategories = [
  {
    id: "charger-malfunction",
    category: "Charger Malfunction",
    categoryVi: "Lỗi Trụ Sạc",
    icon: Zap,
    color: "text-red-500",
    issues: [
      { id: "no-power", label: "No power output", labelVi: "Không có điện ra" },
      { id: "slow-charging", label: "Charging slower than expected", labelVi: "Sạc chậm hơn bình thường" },
      { id: "stops-charging", label: "Charging stops unexpectedly", labelVi: "Ngừng sạc đột ngột" },
      { id: "error-display", label: "Error message on display", labelVi: "Hiển thị thông báo lỗi" },
      { id: "overheating", label: "Charger overheating", labelVi: "Trụ sạc quá nóng" }
    ]
  },
  {
    id: "connectivity",
    category: "Connectivity Issues", 
    categoryVi: "Lỗi Kết Nối",
    icon: Wifi,
    color: "text-blue-500",
    issues: [
      { id: "app-connection", label: "Cannot connect via app", labelVi: "Không kết nối được qua app" },
      { id: "wifi-issues", label: "WiFi connectivity problems", labelVi: "Lỗi kết nối WiFi" },
      { id: "network-timeout", label: "Network timeout", labelVi: "Mạng bị timeout" },
      { id: "qr-scan-failed", label: "QR code scanning failed", labelVi: "Quét mã QR thất bại" }
    ]
  },
  {
    id: "payment",
    category: "Payment Issues",
    categoryVi: "Lỗi Thanh Toán", 
    icon: CreditCard,
    color: "text-green-500",
    issues: [
      { id: "card-declined", label: "Credit card declined", labelVi: "Thẻ tín dụng bị từ chối" },
      { id: "payment-failed", label: "Payment processing failed", labelVi: "Xử lý thanh toán thất bại" },
      { id: "double-charged", label: "Double charged", labelVi: "Bị tính tiền 2 lần" },
      { id: "no-receipt", label: "No receipt received", labelVi: "Không nhận được hóa đơn" }
    ]
  },
  {
    id: "physical",
    category: "Physical Issues",
    categoryVi: "Lỗi Vật Lý",
    icon: Wrench,
    color: "text-orange-500", 
    issues: [
      { id: "cable-damaged", label: "Charging cable damaged", labelVi: "Cáp sạc bị hỏng" },
      { id: "connector-stuck", label: "Connector stuck in port", labelVi: "Đầu cắm bị kẹt" },
      { id: "display-broken", label: "Display screen broken", labelVi: "Màn hình bị vỡ" },
      { id: "dirty-station", label: "Station needs cleaning", labelVi: "Trạm cần vệ sinh" },
      { id: "parking-blocked", label: "Parking space blocked", labelVi: "Chỗ đỗ xe bị chặn" }
    ]
  },
  {
    id: "safety",
    category: "Safety Concerns",
    categoryVi: "Vấn Đề An Toàn",
    icon: Shield,
    color: "text-purple-500",
    issues: [
      { id: "electrical-sparks", label: "Electrical sparks observed", labelVi: "Thấy tia lửa điện" },
      { id: "burning-smell", label: "Burning smell", labelVi: "Mùi cháy khét" },
      { id: "water-damage", label: "Water damage visible", labelVi: "Thấy dấu hiệu ngấm nước" },
      { id: "loose-parts", label: "Loose or hanging parts", labelVi: "Phần tử lỏng lẻo" }
    ]
  }
];

export default function CustomerSupportView({ onBack }: CustomerSupportViewProps) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  
  const [reports, setReports] = useState<IssueReport[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [resolution, setResolution] = useState("");

  // Load reports from localStorage
  useEffect(() => {
    const loadReports = () => {
      const savedReports = JSON.parse(localStorage.getItem("issueReports") || "[]");
      setReports(savedReports);
    };

    loadReports();
    // Refresh every 30 seconds to check for new reports
    const interval = setInterval(loadReports, 30000);
    return () => clearInterval(interval);
  }, []);

  // Save reports to localStorage
  const saveReports = (updatedReports: IssueReport[]) => {
    setReports(updatedReports);
    localStorage.setItem("issueReports", JSON.stringify(updatedReports));
  };

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.stationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || report.status.toLowerCase().replace(" ", "") === statusFilter;
    const matchesUrgency = urgencyFilter === "all" || report.urgency === urgencyFilter;
    
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  // Get issue label
  const getIssueLabel = (issueId: string) => {
    for (const category of issueCategories) {
      const issue = category.issues.find(i => i.id === issueId);
      if (issue) {
        return language === 'en' ? issue.label : issue.labelVi;
      }
    }
    return issueId;
  };

  // Update report status
  const updateReportStatus = (reportId: string, newStatus: string, resolutionText?: string) => {
    const updatedReports = reports.map(report => {
      if (report.id === reportId) {
        const updated = {
          ...report,
          status: newStatus as IssueReport['status'],
          assignedTo: "Current Staff Member" // In real app, this would be the logged-in staff
        };
        
        if (newStatus === "Resolved" && resolutionText) {
          updated.resolution = resolutionText;
          updated.resolutionDate = new Date().toISOString();
        }
        
        return updated;
      }
      return report;
    });
    
    saveReports(updatedReports);
    setResolution("");
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "In Progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Get urgency color
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Calculate statistics
  const totalReports = reports.length;
  const openReports = reports.filter(r => r.status === "Open").length;
  const inProgressReports = reports.filter(r => r.status === "In Progress").length;
  const resolvedReports = reports.filter(r => r.status === "Resolved").length;
  const highUrgencyReports = reports.filter(r => r.urgency === "high").length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(language === 'en' ? 'en-US' : 'vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'en' ? 'Back to Staff Dashboard' : 'Về Staff Dashboard'}
              </Button>
              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-500/90 to-blue-500/70 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 transform group-hover:scale-110 transition-transform duration-300">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="font-semibold text-foreground">
                    {language === 'en' ? 'Customer Support' : 'Hỗ Trợ Khách Hàng'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Manage station issue reports' : 'Quản lý báo cáo sự cố trạm sạc'}
                  </p>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const savedReports = JSON.parse(localStorage.getItem("issueReports") || "[]");
                setReports(savedReports);
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {language === 'en' ? 'Refresh' : 'Làm Mới'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="bg-card/80 backdrop-blur-sm border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Total Reports' : 'Tổng Báo Cáo'}
                  </p>
                  <p className="text-2xl font-bold text-foreground">{totalReports}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Open' : 'Mở'}
                  </p>
                  <p className="text-2xl font-bold text-foreground">{openReports}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'In Progress' : 'Đang Xử Lý'}
                  </p>
                  <p className="text-2xl font-bold text-foreground">{inProgressReports}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Resolved' : 'Đã Giải Quyết'}
                  </p>
                  <p className="text-2xl font-bold text-foreground">{resolvedReports}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'High Urgency' : 'Khẩn Cấp Cao'}
                  </p>
                  <p className="text-2xl font-bold text-foreground">{highUrgencyReports}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/60 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={language === 'en' ? "Search by station, contact name, or report ID..." : "Tìm theo trạm, tên liên hệ, hoặc mã báo cáo..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-input-background border-border/60 rounded-xl"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-input-background border-border/60 rounded-xl">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === 'en' ? 'All Status' : 'Tất Cả Trạng Thái'}
                  </SelectItem>
                  <SelectItem value="open">
                    {language === 'en' ? 'Open' : 'Mở'}
                  </SelectItem>
                  <SelectItem value="inprogress">
                    {language === 'en' ? 'In Progress' : 'Đang Xử Lý'}
                  </SelectItem>
                  <SelectItem value="resolved">
                    {language === 'en' ? 'Resolved' : 'Đã Giải Quyết'}
                  </SelectItem>
                  <SelectItem value="closed">
                    {language === 'en' ? 'Closed' : 'Đã Đóng'}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-48 bg-input-background border-border/60 rounded-xl">
                  <SelectValue placeholder="Filter by urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === 'en' ? 'All Urgency' : 'Tất Cả Mức Độ'}
                  </SelectItem>
                  <SelectItem value="high">
                    {language === 'en' ? 'High' : 'Cao'}
                  </SelectItem>
                  <SelectItem value="medium">
                    {language === 'en' ? 'Medium' : 'Trung Bình'}
                  </SelectItem>
                  <SelectItem value="low">
                    {language === 'en' ? 'Low' : 'Thấp'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground">
              {language === 'en' 
                ? `Showing ${filteredReports.length} of ${totalReports} reports` 
                : `Hiển thị ${filteredReports.length} / ${totalReports} báo cáo`}
            </h3>
          </div>

          {filteredReports.length === 0 ? (
            <Card className="bg-card/80 backdrop-blur-sm border-border/60">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground mb-2">
                  {language === 'en' ? 'No reports found' : 'Không tìm thấy báo cáo nào'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' 
                    ? 'No customer issue reports match your current filters.' 
                    : 'Không có báo cáo sự cố nào khớp với bộ lọc hiện tại.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredReports
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((report) => (
                <Card 
                  key={report.id}
                  className="bg-card/80 backdrop-blur-sm border-border/60 hover:shadow-lg transition-all duration-200"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-foreground">{report.stationName}</h4>
                          <Badge className={`text-xs ${getStatusColor(report.status)}`}>
                            {report.status}
                          </Badge>
                          <Badge className={`text-xs ${getUrgencyColor(report.urgency)}`}>
                            {report.urgency.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>{report.stationAddress}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(report.timestamp)}</span>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="text-sm font-medium text-primary">
                          {report.id}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          by {report.contactName}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">Issues reported:</p>
                      <div className="flex flex-wrap gap-2">
                        {report.issues.map((issueId) => (
                          <Badge key={issueId} variant="outline" className="text-xs">
                            {getIssueLabel(issueId)}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span>{report.contactName}</span>
                        </div>
                        {report.contactPhone && (
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            <span>{report.contactPhone}</span>
                          </div>
                        )}
                        {report.contactEmail && (
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            <span>{report.contactEmail}</span>
                          </div>
                        )}
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {language === 'en' ? 'View Details' : 'Xem Chi Tiết'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              {language === 'en' ? 'Issue Report Details' : 'Chi Tiết Báo Cáo Sự Cố'}
                            </DialogTitle>
                            <DialogDescription>
                              Report ID: {report.id}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-6">
                            {/* Station Info */}
                            <div className="bg-muted/50 rounded-lg p-4">
                              <h4 className="font-medium mb-2">
                                {language === 'en' ? 'Station Information' : 'Thông Tin Trạm Sạc'}
                              </h4>
                              <p className="text-sm"><strong>Name:</strong> {report.stationName}</p>
                              <p className="text-sm"><strong>Address:</strong> {report.stationAddress}</p>
                            </div>

                            {/* Issues */}
                            <div className="bg-muted/50 rounded-lg p-4">
                              <h4 className="font-medium mb-2">
                                {language === 'en' ? 'Reported Issues' : 'Sự Cố Được Báo Cáo'}
                              </h4>
                              <div className="space-y-2">
                                {report.issues.map((issueId) => (
                                  <Badge key={issueId} variant="outline" className="mr-2">
                                    {getIssueLabel(issueId)}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {/* Description */}
                            {report.description && (
                              <div className="bg-muted/50 rounded-lg p-4">
                                <h4 className="font-medium mb-2">
                                  {language === 'en' ? 'Description' : 'Mô Tả'}
                                </h4>
                                <p className="text-sm">{report.description}</p>
                              </div>
                            )}

                            {/* Contact Info */}
                            <div className="bg-muted/50 rounded-lg p-4">
                              <h4 className="font-medium mb-2">
                                {language === 'en' ? 'Contact Information' : 'Thông Tin Liên Hệ'}
                              </h4>
                              <p className="text-sm"><strong>Name:</strong> {report.contactName}</p>
                              {report.contactPhone && (
                                <p className="text-sm"><strong>Phone:</strong> {report.contactPhone}</p>
                              )}
                              {report.contactEmail && (
                                <p className="text-sm"><strong>Email:</strong> {report.contactEmail}</p>
                              )}
                            </div>

                            {/* Status & Urgency */}
                            <div className="bg-muted/50 rounded-lg p-4">
                              <h4 className="font-medium mb-2">
                                {language === 'en' ? 'Status & Priority' : 'Trạng Thái & Độ Ưu Tiên'}
                              </h4>
                              <div className="flex space-x-4">
                                <Badge className={getStatusColor(report.status)}>
                                  {report.status}
                                </Badge>
                                <Badge className={getUrgencyColor(report.urgency)}>
                                  {report.urgency.toUpperCase()} URGENCY
                                </Badge>
                              </div>
                              <p className="text-sm mt-2">
                                <strong>Reported:</strong> {formatDate(report.timestamp)}
                              </p>
                              {report.assignedTo && (
                                <p className="text-sm">
                                  <strong>Assigned to:</strong> {report.assignedTo}
                                </p>
                              )}
                            </div>

                            {/* Resolution (if resolved) */}
                            {report.resolution && (
                              <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
                                <h4 className="font-medium mb-2 text-green-700 dark:text-green-400">
                                  {language === 'en' ? 'Resolution' : 'Giải Pháp'}
                                </h4>
                                <p className="text-sm text-green-700 dark:text-green-400">
                                  {report.resolution}
                                </p>
                                {report.resolutionDate && (
                                  <p className="text-xs text-green-600 dark:text-green-500 mt-2">
                                    Resolved on: {formatDate(report.resolutionDate)}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="space-y-4">
                              {report.status === "Open" && (
                                <div className="flex space-x-2">
                                  <Button 
                                    onClick={() => updateReportStatus(report.id, "In Progress")}
                                    className="flex-1"
                                    variant="outline"
                                  >
                                    <Clock className="w-4 h-4 mr-2" />
                                    {language === 'en' ? 'Start Working' : 'Bắt Đầu Xử Lý'}
                                  </Button>
                                </div>
                              )}

                              {report.status === "In Progress" && (
                                <div className="space-y-3">
                                  <Textarea
                                    placeholder={language === 'en' 
                                      ? "Describe how the issue was resolved..." 
                                      : "Mô tả cách giải quyết sự cố..."}
                                    value={resolution}
                                    onChange={(e) => setResolution(e.target.value)}
                                    className="min-h-20"
                                  />
                                  <Button 
                                    onClick={() => updateReportStatus(report.id, "Resolved", resolution)}
                                    disabled={!resolution.trim()}
                                    className="w-full"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    {language === 'en' ? 'Mark as Resolved' : 'Đánh Dấu Đã Giải Quyết'}
                                  </Button>
                                </div>
                              )}

                              {report.status === "Resolved" && (
                                <Button 
                                  onClick={() => updateReportStatus(report.id, "Closed")}
                                  variant="outline"
                                  className="w-full"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  {language === 'en' ? 'Close Report' : 'Đóng Báo Cáo'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      </div>
    </div>
  );
}