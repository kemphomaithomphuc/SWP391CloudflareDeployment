import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { 
  ArrowLeft,
  AlertTriangle,
  Zap,
  Wifi,
  CreditCard,
  Car,
  Wrench,
  Clock,
  Shield,
  MapPin,

  CheckCircle,
  Send,
  FileText,
  Camera
} from "lucide-react";

interface ReportIssueViewProps {
  onBack: () => void;
}

// Common charging station issues
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

// Mock stations for selection
const stations = [
  { id: "alpha", name: "ChargeHub Station Alpha", address: "123 Nguyen Hue, District 1, Ho Chi Minh City" },
  { id: "beta", name: "ChargeHub Station Beta", address: "456 Le Loi, District 3, Ho Chi Minh City" },
  { id: "gamma", name: "ChargeHub Station Gamma", address: "789 Dong Khoi, District 1, Ho Chi Minh City" },
  { id: "delta", name: "ChargeHub Station Delta", address: "321 Vo Van Tan, District 3, Ho Chi Minh City" },
  { id: "echo", name: "ChargeHub Station Echo", address: "654 Hai Ba Trung, District 1, Ho Chi Minh City" }
];

export default function ReportIssueView({ onBack }: ReportIssueViewProps) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  
  const [selectedStation, setSelectedStation] = useState("");
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [urgencyLevel, setUrgencyLevel] = useState("");
  const [description, setDescription] = useState("");

  const [showSuccess, setShowSuccess] = useState(false);

  const handleIssueToggle = (issueId: string) => {
    setSelectedIssues(prev => 
      prev.includes(issueId) 
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    );
  };

  const handleSubmit = () => {
    if (!selectedStation || selectedIssues.length === 0) return;
    
    // Create report data
    const reportData = {
      id: `RPT-${Date.now()}`,
      stationId: selectedStation,
      stationName: stations.find(s => s.id === selectedStation)?.name || "",
      stationAddress: stations.find(s => s.id === selectedStation)?.address || "",
      issues: selectedIssues,
      urgency: urgencyLevel,
      description,

      timestamp: new Date().toISOString(),
      status: "Open"
    };

    // Store in localStorage for staff dashboard to access
    const existingReports = JSON.parse(localStorage.getItem("issueReports") || "[]");
    existingReports.push(reportData);
    localStorage.setItem("issueReports", JSON.stringify(existingReports));

    setShowSuccess(true);
  };

  const getIssueLabel = (categoryId: string, issueId: string) => {
    const category = issueCategories.find(c => c.id === categoryId);
    if (!category) return "";
    
    const issue = category.issues.find(i => i.id === issueId);
    return language === 'en' ? issue?.label || "" : issue?.labelVi || "";
  };

  const isFormValid = selectedStation && selectedIssues.length > 0 && urgencyLevel;

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-card/80 backdrop-blur-sm border-border/60">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              {language === 'en' ? 'Report Submitted Successfully' : 'Báo Cáo Đã Được Gửi'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {language === 'en' 
                ? 'Thank you for reporting this issue. Our technical team will investigate and resolve it as soon as possible.' 
                : 'Cảm ơn bạn đã báo cáo vấn đề này. Đội ngũ kỹ thuật sẽ kiểm tra và giải quyết sớm nhất có thể.'}
            </p>
            <Button onClick={onBack} className="w-full">
              {language === 'en' ? 'Back to Dashboard' : 'Về Dashboard'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                {language === 'en' ? 'Back to Dashboard' : 'Về Dashboard'}
              </Button>
              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 via-red-500/90 to-red-500/70 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 transform group-hover:scale-110 transition-transform duration-300">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="font-semibold text-foreground">
                    {language === 'en' ? 'Report Issue' : 'Báo Cáo Sự Cố'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Help us improve by reporting station issues' : 'Giúp chúng tôi cải thiện bằng cách báo cáo sự cố'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Station Selection */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span>{language === 'en' ? 'Select Station' : 'Chọn Trạm Sạc'}</span>
              </CardTitle>
              <CardDescription>
                {language === 'en' 
                  ? 'Which charging station are you experiencing issues with?' 
                  : 'Bạn gặp sự cố ở trạm sạc nào?'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedStation} onValueChange={setSelectedStation}>
                <SelectTrigger className="w-full bg-input-background border-border/60 rounded-xl">
                  <SelectValue placeholder={language === 'en' ? "Choose a station..." : "Chọn trạm sạc..."} />
                </SelectTrigger>
                <SelectContent>
                  {stations.map((station) => (
                    <SelectItem key={station.id} value={station.id}>
                      <div>
                        <p className="font-medium">{station.name}</p>
                        <p className="text-xs text-muted-foreground">{station.address}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Issue Categories */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>{language === 'en' ? 'Issue Categories' : 'Loại Sự Cố'}</span>
              </CardTitle>
              <CardDescription>
                {language === 'en' 
                  ? 'Select all issues that apply (you can select multiple)' 
                  : 'Chọn tất cả sự cố liên quan (có thể chọn nhiều)'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {issueCategories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <div key={category.id} className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <IconComponent className={`w-5 h-5 ${category.color}`} />
                      <h4 className="font-medium">
                        {language === 'en' ? category.category : category.categoryVi}
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-7">
                      {category.issues.map((issue) => (
                        <div key={issue.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={issue.id}
                            checked={selectedIssues.includes(issue.id)}
                            onCheckedChange={() => handleIssueToggle(issue.id)}
                          />
                          <label
                            htmlFor={issue.id}
                            className="text-sm cursor-pointer"
                          >
                            {language === 'en' ? issue.label : issue.labelVi}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Urgency Level */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-primary" />
                <span>{language === 'en' ? 'Urgency Level' : 'Mức Độ Khẩn Cấp'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { 
                    value: "low", 
                    label: language === 'en' ? "Low" : "Thấp", 
                    desc: language === 'en' ? "Minor issue, can wait" : "Vấn đề nhỏ, có thể chờ",
                    color: "border-green-500 bg-green-500/10"
                  },
                  { 
                    value: "medium", 
                    label: language === 'en' ? "Medium" : "Trung Bình", 
                    desc: language === 'en' ? "Affects functionality" : "Ảnh hưởng chức năng",
                    color: "border-yellow-500 bg-yellow-500/10"
                  },
                  { 
                    value: "high", 
                    label: language === 'en' ? "High" : "Cao", 
                    desc: language === 'en' ? "Safety concern or unusable" : "Nguy hiểm hoặc không dùng được",
                    color: "border-red-500 bg-red-500/10"
                  }
                ].map((urgency) => (
                  <div
                    key={urgency.value}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      urgencyLevel === urgency.value 
                        ? urgency.color 
                        : "border-border hover:border-border/80"
                    }`}
                    onClick={() => setUrgencyLevel(urgency.value)}
                  >
                    <h4 className="font-medium mb-1">{urgency.label}</h4>
                    <p className="text-xs text-muted-foreground">{urgency.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/60">
            <CardHeader>
              <CardTitle>
                {language === 'en' ? 'Additional Details' : 'Chi Tiết Bổ Sung'}
              </CardTitle>
              <CardDescription>
                {language === 'en' 
                  ? 'Please provide any additional information that might help us resolve the issue faster' 
                  : 'Vui lòng cung cấp thông tin bổ sung để chúng tôi giải quyết nhanh hơn'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder={language === 'en' 
                  ? "Describe what happened, when it occurred, any error messages you saw, etc..." 
                  : "Mô tả điều gì đã xảy ra, khi nào xảy ra, thông báo lỗi bạn thấy, v.v..."}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-24 bg-input-background border-border/60 rounded-xl"
              />
            </CardContent>
          </Card>



          {/* Summary & Submit */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/60">
            <CardHeader>
              <CardTitle>
                {language === 'en' ? 'Report Summary' : 'Tóm Tắt Báo Cáo'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedStation && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">
                    {language === 'en' ? 'Station:' : 'Trạm Sạc:'}
                  </h4>
                  <p className="text-sm">
                    {stations.find(s => s.id === selectedStation)?.name}
                  </p>
                </div>
              )}

              {selectedIssues.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">
                    {language === 'en' ? 'Issues:' : 'Sự Cố:'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedIssues.map((issueId) => {
                      const category = issueCategories.find(c => 
                        c.issues.some(i => i.id === issueId)
                      );
                      const issue = category?.issues.find(i => i.id === issueId);
                      return (
                        <Badge key={issueId} variant="secondary" className="text-xs">
                          {language === 'en' ? issue?.label : issue?.labelVi}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="flex-1"
                >
                  {language === 'en' ? 'Cancel' : 'Hủy'}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid}
                  className="flex-1"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {language === 'en' ? 'Submit Report' : 'Gửi Báo Cáo'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}