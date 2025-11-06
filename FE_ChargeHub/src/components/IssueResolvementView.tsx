import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ArrowLeft, CheckCircle, Check, History } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { toast } from "sonner";

interface IssueResolvementViewProps {
  onBack: () => void;
}

interface ReceivedIssueReport {
  issueReportId: string;
  stationId: string;
  stationName: string;
  status: string;
  urgencyLevel?: string;
  description: string;
}


export default function IssueResolvementView({ onBack }: Readonly<IssueResolvementViewProps>) {
  const { language } = useLanguage();
  const [inProgress, setInProgress] = useState<ReceivedIssueReport[]>([]);
  const [resolvedHistory, setResolvedHistory] = useState<ReceivedIssueReport[]>([]);
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(new Set());

  const fetchReports = async (): Promise<void> => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://localhost:8080/api/issue-reports", {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      const mapped: ReceivedIssueReport[] = list.map((r: any) => ({
        issueReportId: String(r.issueReportId ?? r.id ?? ""),
        stationId: String(r.stationId ?? ""),
        stationName: String(r.stationName ?? ""),
        status: String(r.status ?? "INBOX"),
        urgencyLevel: r.urgencyLevel,
        description: String(r.description ?? ""),
      }));
      setInProgress(mapped.filter((m) => m.status.toUpperCase() === "IN_PROGRESS"));
      setResolvedHistory(mapped.filter((m) => m.status.toUpperCase() === "RESOLVED"));
    } catch (e) {
      toast.error(language === "vi" ? "Tải danh sách sự cố thất bại" : "Failed to load issue reports");
    }
  };

  const resolveIssueReport = async(reportIssueId: string) : Promise<boolean> => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.put(
        `http://localhost:8080/api/issue-reports/${reportIssueId}/${"RESOLVED"}`,
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

  const handleResolve = async (reportIssueId: string) => {
    setResolvingIds((prev) => new Set(prev).add(reportIssueId));
    try {
      const success = await resolveIssueReport(reportIssueId);
      if (success) {
        toast.success(language === "vi" ? "Đã xử lý sự cố thành công" : "Issue resolved successfully");
        await fetchReports();
      } else {
        toast.error(language === "vi" ? "Xử lý sự cố thất bại" : "Failed to resolve issue");
      }
    } catch (error) {
      toast.error(language === "vi" ? "Xử lý sự cố thất bại" : "Failed to resolve issue");
    } finally {
      setResolvingIds((prev) => {
        const next = new Set(prev);
        next.delete(reportIssueId);
        return next;
      });
    }
  };

  useEffect(() => {
    void fetchReports();
  }, []);

  // Resolvement actions are disabled on this screen (history-only)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-accent/20">
      <div className="sticky top-0 z-40 bg-card/70 backdrop-blur-md border-b border-border/60 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === "en" ? "Back to Dashboard" : "Về Dashboard"}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* In Progress Issues */}
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{language === "en" ? "Issues In Progress" : "Sự cố đang xử lý"}</CardTitle>
                <CardDescription>{language === "en" ? "All reports marked as IN_PROGRESS" : "Tất cả báo cáo trạng thái IN_PROGRESS"}</CardDescription>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                IN_PROGRESS
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {inProgress.map((r) => (
                <div key={r.issueReportId} className="rounded-xl border border-border/60 bg-card/70 backdrop-blur-sm p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-medium leading-tight">{r.stationName}</h4>
                        <p className="text-xs text-muted-foreground">#{r.issueReportId}</p>
                      </div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">IN_PROGRESS</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{r.description}</p>
                  <Button
                    onClick={() => handleResolve(r.issueReportId)}
                    disabled={resolvingIds.has(r.issueReportId) || r.status.toUpperCase() === "RESOLVED"}
                    size="sm"
                    className="w-full"
                    variant={r.status.toUpperCase() === "RESOLVED" ? "secondary" : "default"}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {resolvingIds.has(r.issueReportId)
                      ? (language === "en" ? "Resolving..." : "Đang xử lý...")
                      : r.status.toUpperCase() === "RESOLVED"
                      ? (language === "en" ? "Resolved" : "Đã xử lý")
                      : (language === "en" ? "Resolve" : "Xử lý")}
                  </Button>
                </div>
              ))}
            </div>
            {inProgress.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                {language === "en" ? "No issues in progress" : "Chưa có sự cố đang xử lý"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resolved History */}
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  {language === "en" ? "Resolved History" : "Lịch sử đã xử lý"}
                </CardTitle>
                <CardDescription>{language === "en" ? "All reports marked as RESOLVED" : "Tất cả báo cáo trạng thái RESOLVED"}</CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                RESOLVED
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {resolvedHistory.map((r) => (
                <div key={r.issueReportId} className="rounded-xl border border-border/60 bg-card/70 backdrop-blur-sm p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium leading-tight">{r.stationName}</h4>
                        <p className="text-xs text-muted-foreground">#{r.issueReportId}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">RESOLVED</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">{r.description}</p>
                </div>
              ))}
            </div>
            {resolvedHistory.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                {language === "en" ? "No resolved reports" : "Chưa có báo cáo đã xử lý"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



