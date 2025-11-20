import { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import axios from 'axios';
import { apiBaseUrl } from '../services/api';

import { 
  ArrowLeft,
  AlertTriangle,
  Clock,
  MapPin,

  CheckCircle,
  Send,
  
} from "lucide-react";

interface ReportIssueViewProps {
  onBack: () => void;
}
interface ChargingStation {
  stationId: string;
  stationName: string;
  address: string;
}

interface IssueReport {
  stationId: string;
  status: string;
  urgencyLevel: string;
  description: string;
}
// Issue categories removed from UI

// Real stations will be fetched from backend

export default function ReportIssueView({ onBack }: Readonly<ReportIssueViewProps>) {
  const { language } = useLanguage();
  
  const [selectedStation, setSelectedStation] = useState("");
  // Issues removed from UI; keep minimal report fields
  const [urgencyLevel, setUrgencyLevel] = useState("");
  const [description, setDescription] = useState("");
  const [stations, setStations] = useState<ChargingStation[]>([]);

  const [showSuccess, setShowSuccess] = useState(false);


  const getChargingStations = async() :  Promise< ChargingStation[] | null> => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${apiBaseUrl}/api/charging-stations`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (res.status === 200 || res.status === 203) {
        return (res.data as any[]).map(station => ({
          stationId: station.stationId,
          stationName: station.stationName,
          address: station.address
        })) as ChargingStation[]
      }

    } catch (err: any) {
      console.error("Failed to fetch charging stations", err);
    }
    return null;
  }

  const sendIssueReport = async (report: IssueReport): Promise<boolean> => {
    try {
      const token = localStorage.getItem("token");
      const payload = {
        stationId: Number(report.stationId),
        description: report.description,
        urgencyLevel: report.urgencyLevel,
        status: report.status || "INBOX"
      };
      const res = await axios.post(
        `${apiBaseUrl}/api/issue-reports`,
        payload,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            'Content-Type': 'application/json'
          }
        }
      );
      console.log("Mewmew: ", res)
      return res.status === 200 || res.status === 201;
    } catch (err) {
      console.error("Failed to send issue report", err);
      return false;
    }
  }
  

  

  useEffect(() => {
    (async () => {
      const list = await getChargingStations();
      if (list) setStations(list);
    })();
  }, []);

  // Issues selection removed

  const handleSubmit = () => {
    if (!selectedStation) return;
    
    // Create report data
    const reportData = {
      id: `RPT-${Date.now()}`,
      stationId: selectedStation,
      stationName: stations.find(s => s.stationId === selectedStation)?.stationName || "",
      stationAddress: stations.find(s => s.stationId === selectedStation)?.address || "",
      urgency: urgencyLevel,
      description,

      timestamp: new Date().toISOString(),
      status: "Open"
    };

    // Send to backend
    void sendIssueReport({
      stationId: selectedStation,
      description,
      urgencyLevel,
      status: "INBOX"
    });

    // Store in localStorage for staff dashboard to access
    const existingReports = JSON.parse(localStorage.getItem("issueReports") || "[]");
    existingReports.push(reportData);
    localStorage.setItem("issueReports", JSON.stringify(existingReports));

    setShowSuccess(true);
  };

  // removed unused getIssueLabel

  const isFormValid = Boolean(selectedStation && urgencyLevel && description.trim().length > 0);

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
                <SelectTrigger className="w-full h-12 bg-input-background border-border/60 rounded-xl text-left">
                  <SelectValue placeholder={language === 'en' ? "Choose a station..." : "Chọn trạm sạc..."} />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {stations.map((station) => (
                    <SelectItem key={station.stationId} value={station.stationId} className="py-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{station.stationName}</span>
                        <span className="text-xs text-muted-foreground">{station.address}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Issue Categories removed */}

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
                    {stations.find(s => s.stationId === selectedStation)?.stationName}
                  </p>
                </div>
              )}

              {/* Issues summary removed */}

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