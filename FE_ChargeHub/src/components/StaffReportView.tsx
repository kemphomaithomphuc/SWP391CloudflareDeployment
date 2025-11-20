import { useEffect, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
// removed unused dialog/separator imports
import axios from 'axios';
import { api } from '../services/api';
import { toast } from "sonner";
import { 
  ArrowLeft,
  AlertTriangle,
  Wrench,
  FileText,
  Send,
  CheckCircle,
  Clock,
  Eye,
  
} from "lucide-react";

interface StaffReportViewProps {
  onBack: () => void;
}

// removed mock Report type
interface ChargingStation {
  stationId: string;
  stationName: string;
  address: string;
}

interface ReceivedIssueReport {
  issueReportId: string;
  stationId: string;
  stationName: string;
  status: string;
  urgencyLevel: string;
  description: string;
}

interface PostIssueReport {
  stationId: string;
  status: string;
  urgencyLevel: string;
  description: string;
}

// Simple lists to aid form selections (can be wired to real APIs later)
const stations = [
  { id: 1, name: "Station A", location: "District 1" },
  { id: 2, name: "Station B", location: "District 3" }
];

const equipmentTypes = [
  "Type 2 Charger Port",
  "CCS Fast Charger",
  "Payment Terminal"
];

export default function StaffReportView({ onBack }: Readonly<StaffReportViewProps>) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("equipment");
  const [reportType, setReportType] = useState<'equipment' | 'other'>('equipment');
  const [equipmentSource, setEquipmentSource] = useState<'customer' | 'inspection'>('inspection');
  const [selectedStation, setSelectedStation] = useState("none");
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [photos, setPhotos] = useState<string[]>([]);



  const getAllReports = async() : Promise<ReceivedIssueReport[] | null> => {
    const token = localStorage.getItem("token");
    try {
      const res = await api.get(`/api/issue-reports`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(res.data);
      if (res.status === 200) {
        const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
        return (list as any[]).map((report: any) => ({
          issueReportId: String(report.issueReportId ?? report.id ?? ""),
          stationId: String(report.stationId ?? ""),
          stationName: String(report.stationName ?? ""),
          description: String(report.description ?? report.note ?? ""),
          status: String(report.status ?? "INBOX")
        })) as ReceivedIssueReport[]
      }
    } catch (err: any) {

    }
    return null;
  }

  const resolveIssueReport = async(reportIssueId: string) : Promise<boolean> => {
    const token = localStorage.getItem("token");
    try {
      const res = await api.put(
        `/api/issue-reports/${reportIssueId}/${"IN_PROGRESS"}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return res.status === 200 || res.status === 204;
    } catch (err: any) {
      console.error('Failed to resolve issue report', err);
      return false;
    }
  }

  const sendIssueReport = async (report: PostIssueReport): Promise<boolean> => {
    try {
      const token = localStorage.getItem("token");
      const payload = {
        stationId: Number(report.stationId),
        description: report.description,
        urgencyLevel: report.urgencyLevel,
        status: report.status || "INBOX"
      };
      const res = await api.post(
        `/api/issue-reports`,
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
  // state for real data
  const [inboxReports, setInboxReports] = useState<ReceivedIssueReport[]>([]);
  const [historyReports, setHistoryReports] = useState<ReceivedIssueReport[]>([]);

  useEffect(() => {
    (async () => {
      const data = await getAllReports();
      if (data) {
        setInboxReports(data.filter(r => String(r.status).toUpperCase() === 'INBOX'));
        setHistoryReports(data.filter(r => String(r.status).toUpperCase() === 'RESOLVED'));
      }
    })();
  }, []);

  const resetForm = () => {
    setReportTitle("");
    setReportDescription("");
    setSelectedStation("none");
    setSelectedEquipment("");
    setPriority("medium");
    setPhotos([]);
  };

  // removed unused helper functions

  const getLocalizedStatus = (status: string) => {
    const statuses = {
      'draft': language === 'vi' ? 'Bản nháp' : 'Draft',
      'submitted': language === 'vi' ? 'Đã gửi' : 'Submitted',
      'in-progress': language === 'vi' ? 'Đang xử lý' : 'In Progress',
      'resolved': language === 'vi' ? 'Đã giải quyết' : 'Resolved'
    };
    return statuses[status as keyof typeof statuses] || status;
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
                {t('back_to_dashboard')}
              </Button>
              <div>
                <h1 className="font-semibold text-foreground">{t('report_management')}</h1>
                <p className="text-sm text-muted-foreground">{t('submit_track_reports')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex space-x-1 mb-6 bg-muted/50 rounded-lg p-1">
          <Button
            variant={activeTab === "equipment" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("equipment")}
            className="flex-1"
          >
            <Wrench className="w-4 h-4 mr-2" />
            {t('equipment_reports')}
          </Button>

          <Button
            variant={activeTab === "history" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("history")}
            className="flex-1"
          >
            <FileText className="w-4 h-4 mr-2" />
            {t('report_history')}
          </Button>
        </div>

        {/* Equipment Reports Tab */}
        {activeTab === "equipment" && (
          <div className="space-y-6">
            {/* Customer Reports Section */}
            <Card>
              <CardHeader>
                <CardTitle>{t('customer_equipment_reports')}</CardTitle>
                <CardDescription>{t('review_customer_issues')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inboxReports.map((report) => (
                    <div key={report.issueReportId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div>
                            <h4 className="font-medium">{report.issueReportId}</h4>
                            <p className="text-sm text-muted-foreground">{report.stationName}</p>
                          </div>
                        </div>
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                          {t('customer_report')}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">{t('station')}: </span>
                          <span>{report.stationName}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('issue')}: </span>
                          <span>{report.description}</span>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-4">{report.description}</p>

                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setReportType("equipment");
                            setEquipmentSource("customer");
                            setSelectedStation(report.stationName);
                            setSelectedEquipment("");
                            setReportTitle(`Issue from ${report.stationName}`);
                            setReportDescription(`Customer Report: ${report.description}\n\nStaff Verification: `);
                            setPriority("high");
                          }}
                        >
                          <Wrench className="w-4 h-4 mr-2" />
                          {t('create_report')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={async () => {
                            const ok = await resolveIssueReport(report.issueReportId);
                            if (ok) {
                              setInboxReports(prev => prev.filter(r => r.issueReportId !== report.issueReportId));
                              setHistoryReports(prev => [...prev, { ...report, status: 'RESOLVED' }]);
                              toast.success(language === 'vi' ? 'Đã chuyển sang lịch sử' : 'Marked as resolved');
                            } else {
                              toast.error(language === 'vi' ? 'Xử lý thất bại' : 'Resolve failed');
                            }
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {language === 'vi' ? 'Resolve' : 'Resolve'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            
          </div>
        )}

      

        {/* Report History Tab */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('report_history')}</CardTitle>
                <CardDescription>{t('view_track_reports')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {historyReports.map((report) => (
                    <div key={report.issueReportId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100 dark:bg-green-900">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <h4 className="font-medium">{report.issueReportId}</h4>
                            <p className="text-sm text-muted-foreground">{report.stationName}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            {getLocalizedStatus('resolved')}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                        <div>
                          <span>{t('station')}: </span>
                          <span>{report.stationName}</span>
                        </div>
                        <div className="col-span-2">
                          <span>{t('issue')}: </span>
                          <span>{report.description}</span>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-4">{report.description}</p>

                      {/* related customer report removed for API shape */}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}