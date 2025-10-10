import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { 
  ArrowLeft,
  Plus,
  AlertTriangle,
  Wrench,
  FileText,
  Send,
  Search,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings,
  Zap,
  Camera,
  Upload,
  Eye,
  Filter
} from "lucide-react";

interface StaffReportViewProps {
  onBack: () => void;
}

interface Report {
  id: string;
  type: 'equipment' | 'other';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'submitted' | 'in-progress' | 'resolved';
  station?: string;
  equipment?: string;
  reportedBy: string;
  date: string;
  photos?: string[];
  customerReportId?: string;
}

export default function StaffReportView({ onBack }: StaffReportViewProps) {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("equipment");
  const [reportType, setReportType] = useState<'equipment' | 'other'>('equipment');
  const [equipmentSource, setEquipmentSource] = useState<'customer' | 'inspection'>('inspection');
  const [selectedStation, setSelectedStation] = useState("none");
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [photos, setPhotos] = useState<string[]>([]);

  // Mock data
  const stations = [
    { id: 1, name: "ChargeHub Station Alpha", location: "District 1, HCMC" },
    { id: 2, name: "ChargeHub Station Beta", location: "District 3, HCMC" },
    { id: 3, name: "ChargeHub Station Gamma", location: "District 7, HCMC" },
    { id: 4, name: "ChargeHub Station Delta", location: "District 5, HCMC" }
  ];

  const equipmentTypes = [
    "Type 2 Charger Port",
    "CCS Fast Charger",
    "CHAdeMO Charger",
    "Display Screen",
    "Payment Terminal",
    "Cooling System",
    "Cable Management",
    "Safety Emergency Button",
    "Power Distribution Unit",
    "Network Router"
  ];

  const customerReports = [
    {
      id: "CR-001",
      customer: "Nguyen Van A",
      station: "ChargeHub Station Alpha",
      equipment: "Type 2 Charger Port",
      issue: "Port not responding to connection",
      description: "The charging port doesn't detect my vehicle cable connection. Tried multiple times but no response.",
      date: "2024-01-15",
      status: "pending"
    },
    {
      id: "CR-002", 
      customer: "Tran Thi B",
      station: "ChargeHub Station Beta",
      equipment: "Display Screen",
      issue: "Screen flickering and unreadable",
      description: "The main display screen is flickering constantly and showing garbled text. Cannot read charging information.",
      date: "2024-01-16",
      status: "pending"
    }
  ];

  const reports: Report[] = [
    {
      id: "REP-001",
      type: "equipment",
      title: "Faulty Charging Port - Type 2",
      description: "Port 3 at Station Alpha is not providing power output. Customer reported issue and confirmed during inspection.",
      priority: "high",
      status: "submitted",
      station: "ChargeHub Station Alpha",
      equipment: "Type 2 Charger Port",
      reportedBy: "Staff Member 1",
      date: "2024-01-15",
      customerReportId: "CR-001"
    },
    {
      id: "REP-002",
      type: "other",
      title: "Parking Area Lighting Issue",
      description: "Several parking area lights are not working, causing safety concerns during night hours.",
      priority: "medium",
      status: "in-progress",
      station: "ChargeHub Station Beta",
      reportedBy: "Staff Member 2", 
      date: "2024-01-14"
    },
    {
      id: "REP-003",
      type: "equipment",
      title: "Display Screen Malfunction",
      description: "Main display showing flickering and garbled text. Affects user experience.",
      priority: "high",
      status: "resolved",
      station: "ChargeHub Station Beta",
      equipment: "Display Screen",
      reportedBy: "Staff Member 1",
      date: "2024-01-13",
      customerReportId: "CR-002"
    }
  ];

  const resetForm = () => {
    setReportTitle("");
    setReportDescription("");
    setSelectedStation("none");
    setSelectedEquipment("");
    setPriority("medium");
    setPhotos([]);
  };

  const submitReport = () => {
    // Simulate form submission
    console.log("Submitting report:", {
      type: reportType,
      source: equipmentSource,
      station: selectedStation === "none" ? null : selectedStation,
      equipment: selectedEquipment,
      title: reportTitle,
      description: reportDescription,
      priority,
      photos
    });
    resetForm();
    alert(language === 'vi' ? "Báo cáo đã được gửi thành công!" : "Report submitted successfully!");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'submitted': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'in-progress': return <Clock className="w-4 h-4" />;
      case 'submitted': return <Send className="w-4 h-4" />;
      case 'draft': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getLocalizedPriority = (priority: string) => {
    const priorities = {
      'low': t('low'),
      'medium': t('medium'), 
      'high': t('high'),
      'critical': t('critical')
    };
    return priorities[priority as keyof typeof priorities] || priority;
  };

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
            variant={activeTab === "other" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("other")}
            className="flex-1"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            {t('other_issues')}
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
                  {customerReports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div>
                            <h4 className="font-medium">{report.id}</h4>
                            <p className="text-sm text-muted-foreground">{report.customer}</p>
                          </div>
                        </div>
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                          {t('customer_report')}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">{t('station')}: </span>
                          <span>{report.station}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('equipment')}: </span>
                          <span>{report.equipment}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('issue')}: </span>
                          <span>{report.issue}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('date')}: </span>
                          <span>{report.date}</span>
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
                            setSelectedStation(report.station);
                            setSelectedEquipment(report.equipment);
                            setReportTitle(`Equipment Issue: ${report.issue}`);
                            setReportDescription(`Customer Report: ${report.description}\n\nStaff Verification: `);
                            setPriority("high");
                          }}
                        >
                          <Wrench className="w-4 h-4 mr-2" />
                          {t('create_report')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Equipment Inspection Form */}
            <Card>
              <CardHeader>
                <CardTitle>{t('new_equipment_report')}</CardTitle>
                <CardDescription>{t('submit_equipment_report')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Report Source */}
                <div className="space-y-3">
                  <label className="font-medium">{t('report_source')}</label>
                  <Select value={equipmentSource} onValueChange={(value: 'customer' | 'inspection') => setEquipmentSource(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('select_report_source')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inspection">{t('staff_inspection')}</SelectItem>
                      <SelectItem value="customer">{t('customer_report_followup')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Station Selection */}
                <div className="space-y-3">
                  <label className="font-medium">{t('station')}</label>
                  <Select value={selectedStation} onValueChange={setSelectedStation}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('select_station')} />
                    </SelectTrigger>
                    <SelectContent>
                      {stations.map((station) => (
                        <SelectItem key={station.id} value={station.name}>
                          {station.name} - {station.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Equipment Selection */}
                <div className="space-y-3">
                  <label className="font-medium">{t('equipment_type')}</label>
                  <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('select_equipment')} />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentTypes.map((equipment) => (
                        <SelectItem key={equipment} value={equipment}>
                          {equipment}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Report Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="font-medium">{t('report_title')}</label>
                    <Input
                      placeholder={t('brief_description_issue')}
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="font-medium">{t('priority_level')}</label>
                    <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => setPriority(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">{t('low')}</SelectItem>
                        <SelectItem value="medium">{t('medium')}</SelectItem>
                        <SelectItem value="high">{t('high')}</SelectItem>
                        <SelectItem value="critical">{t('critical')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="font-medium">{t('detailed_description')}</label>
                  <Textarea
                    placeholder={t('equipment_issue_placeholder')}
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Photo Upload */}
                <div className="space-y-3">
                  <label className="font-medium">{t('photos_optional')}</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">{t('upload_photos_issue')}</p>
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      {t('choose_photos')}
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={resetForm}>
                    {t('reset_form')}
                  </Button>
                  <Button onClick={submitReport}>
                    <Send className="w-4 h-4 mr-2" />
                    {t('submit_report')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Other Issues Tab */}
        {activeTab === "other" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('report_other_issues')}</CardTitle>
                <CardDescription>{t('submit_non_equipment_reports')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Station Selection */}
                <div className="space-y-3">
                  <label className="font-medium">{t('station_optional')}</label>
                  <Select value={selectedStation} onValueChange={setSelectedStation}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('select_station_if_applicable')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('no_specific_station')}</SelectItem>
                      {stations.map((station) => (
                        <SelectItem key={station.id} value={station.name}>
                          {station.name} - {station.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Report Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="font-medium">{t('issue_title')}</label>
                    <Input
                      placeholder={t('brief_description_issue')}
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="font-medium">{t('priority_level')}</label>
                    <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => setPriority(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">{t('low')}</SelectItem>
                        <SelectItem value="medium">{t('medium')}</SelectItem>
                        <SelectItem value="high">{t('high')}</SelectItem>
                        <SelectItem value="critical">{t('critical')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="font-medium">{t('issue_description')}</label>
                  <Textarea
                    placeholder={t('other_issue_placeholder')}
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Photo Upload */}
                <div className="space-y-3">
                  <label className="font-medium">{t('photos_optional')}</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">{t('upload_photos_support')}</p>
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      {t('choose_photos')}
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={resetForm}>
                    {t('reset_form')}
                  </Button>
                  <Button onClick={submitReport}>
                    <Send className="w-4 h-4 mr-2" />
                    {t('submit_report')}
                  </Button>
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
                  {reports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            report.type === 'equipment' 
                              ? 'bg-blue-100 dark:bg-blue-900' 
                              : 'bg-purple-100 dark:bg-purple-900'
                          }`}>
                            {report.type === 'equipment' ? (
                              <Wrench className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">{report.id}</h4>
                            <p className="text-sm text-muted-foreground">{report.title}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(report.priority)}>
                            {getLocalizedPriority(report.priority).toUpperCase()}
                          </Badge>
                          <Badge className={getStatusColor(report.status)}>
                            {getStatusIcon(report.status)}
                            <span className="ml-1">{getLocalizedStatus(report.status)}</span>
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                        <div>
                          <span>{t('type')}: </span>
                          <span className="capitalize">
                            {report.type === 'equipment' ? t('equipment').toLowerCase() : t('other_issues').toLowerCase()}
                          </span>
                        </div>
                        <div>
                          <span>{t('date')}: </span>
                          <span>{report.date}</span>
                        </div>
                        {report.station && (
                          <div>
                            <span>{t('station')}: </span>
                            <span>{report.station}</span>
                          </div>
                        )}
                        {report.equipment && (
                          <div>
                            <span>{t('equipment')}: </span>
                            <span>{report.equipment}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-4">{report.description}</p>

                      {report.customerReportId && (
                        <div className="mb-4 p-2 bg-orange-50 dark:bg-orange-950 rounded border border-orange-200 dark:border-orange-800">
                          <p className="text-sm text-orange-800 dark:text-orange-200">
                            {t('related_customer_report')}: {report.customerReportId}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          {t('view_details')}
                        </Button>
                      </div>
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