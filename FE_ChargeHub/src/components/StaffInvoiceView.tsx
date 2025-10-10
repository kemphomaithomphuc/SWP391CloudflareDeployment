import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import PaymentQRView from "./PaymentQRView";
import InvoiceItemsView from "./InvoiceItemsView";
import QRCodeGenerator from "./QRCodeGenerator";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { toast } from "sonner@2.0.3";
import { 
  ArrowLeft,
  Plus,
  Receipt,
  CreditCard,
  DollarSign,
  User,
  Search,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Download,
  QrCode,
  Send,
  Mail
} from "lucide-react";

interface StaffInvoiceViewProps {
  onBack: () => void;
}

export default function StaffInvoiceView({ onBack }: StaffInvoiceViewProps) {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("detailed");
  const [showPaymentView, setShowPaymentView] = useState(false);
  const [showDetailedInvoice, setShowDetailedInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showQRModal, setShowQRModal] = useState(false);



  // Mock invoice data
  const invoices = [
    {
      id: "INV-001",
      customer: "Nguyen Van A",
      amount: 85000,
      status: "paid",
      date: "2024-01-15",
      dueDate: "2024-01-30",
      items: [
        { description: "Charging Session - 1 hour", quantity: 1, unitPrice: 25000, total: 25000 },
        { description: "Parking Fee", quantity: 1, unitPrice: 10000, total: 10000 },
        { description: "Service Fee", quantity: 1, unitPrice: 50000, total: 50000 }
      ]
    },
    {
      id: "INV-002", 
      customer: "Tran Thi B",
      amount: 120000,
      status: "pending",
      date: "2024-01-16",
      dueDate: "2024-01-31",
      items: [
        { description: "Fast Charging Session - 45 min", quantity: 1, unitPrice: 90000, total: 90000 },
        { description: "Premium Service", quantity: 1, unitPrice: 30000, total: 30000 }
      ]
    },
    {
      id: "INV-003",
      customer: "Le Van C", 
      amount: 75000,
      status: "overdue",
      date: "2024-01-10",
      dueDate: "2024-01-25",
      items: [
        { description: "Standard Charging - 2 hours", quantity: 2, unitPrice: 20000, total: 40000 },
        { description: "Equipment Rental", quantity: 1, unitPrice: 35000, total: 35000 }
      ]
    }
  ];



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handleDownloadPDF = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowQRModal(true);
  };

  const generateInvoicePDF = (includeQR: boolean = false) => {
    if (!selectedInvoice) return;
    
    // Simulate PDF generation with QR code
    const invoiceText = `
      CHARGEHUB INVOICE
      =================
      Invoice: ${selectedInvoice.id}
      Customer: ${selectedInvoice.customer}
      Date: ${selectedInvoice.date}
      Due: ${selectedInvoice.dueDate}
      
      Items:
      ${selectedInvoice.items.map((item: any) => 
        `- ${item.description} (${item.quantity}x) - ${item.total.toLocaleString()} VND`
      ).join('\n      ')}
      
      Total: ${selectedInvoice.amount.toLocaleString()} VND
      Status: ${selectedInvoice.status.toUpperCase()}
      
      ${includeQR ? 'QR Code: Scan to pay online\nPayment URL: https://chargehub.payment/' + selectedInvoice.id : ''}
    `;

    // Create and download the file
    const blob = new Blob([invoiceText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${selectedInvoice.id}${includeQR ? '_with_QR' : ''}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(
      language === 'vi' 
        ? `Hóa đơn ${selectedInvoice.id} đã được xuất thành công${includeQR ? ' với mã QR' : ''}!`
        : `Invoice ${selectedInvoice.id} exported successfully${includeQR ? ' with QR code' : ''}!`
    );
    
    setShowQRModal(false);
  };

  const sendInvoiceByEmail = () => {
    if (!selectedInvoice) return;
    
    // Simulate email sending
    toast.success(
      language === 'vi' 
        ? `Hóa đơn ${selectedInvoice.id} đã được gửi qua email thành công!`
        : `Invoice ${selectedInvoice.id} sent by email successfully!`
    );
    
    setShowQRModal(false);
  };



  if (showPaymentView && invoiceData) {
    return (
      <PaymentQRView
        onBack={() => setShowPaymentView(false)}
        invoiceData={invoiceData}
      />
    );
  }

  if (showDetailedInvoice) {
    return (
      <InvoiceItemsView
        onBack={() => setShowDetailedInvoice(false)}
      />
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
                {t('back_to_dashboard')}
              </Button>
              <div>
                <h1 className="font-semibold text-foreground">{t('invoice_management')}</h1>
                <p className="text-sm text-muted-foreground">{t('create_manage_invoices')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex space-x-1 mb-6 bg-muted/50 rounded-lg p-1">
          <Button
            variant={activeTab === "detailed" ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowDetailedInvoice(true)}
            className="flex-1 bg-gradient-to-r from-primary/10 to-chart-2/10 border border-primary/20 hover:bg-primary/20"
          >
            <FileText className="w-4 h-4 mr-2" />
            {t('create_invoice')}
          </Button>
          <Button
            variant={activeTab === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("list")}
            className="flex-1"
          >
            <Receipt className="w-4 h-4 mr-2" />
            {t('view_invoices')}
          </Button>
        </div>

        {/* Default Content - Redirects to Detailed Invoice */}
        {activeTab === "detailed" && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{t('create_detailed_invoice')}</h3>
              <p className="text-muted-foreground mb-6">
                {t('comprehensive_invoice_builder')}
              </p>
              <Button 
                onClick={() => setShowDetailedInvoice(true)}
                className="bg-gradient-to-r from-primary to-chart-2 hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('start_creating_invoice')}
              </Button>
            </div>
          </div>
        )}

        {/* Invoice List Tab */}
        {activeTab === "list" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('invoice_history')}</CardTitle>
                <CardDescription>{t('manage_existing_invoices')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Receipt className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">{invoice.id}</h4>
                            <p className="text-sm text-muted-foreground">{invoice.customer}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(invoice.status)}>
                            {getStatusIcon(invoice.status)}
                            <span className="ml-1 capitalize">{t(invoice.status)}</span>
                          </Badge>
                          <p className="font-semibold">{invoice.amount.toLocaleString()} VND</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                        <div>
                          <span>{t('date')}: </span>
                          <span>{invoice.date}</span>
                        </div>
                        <div>
                          <span>Due: </span>
                          <span>{invoice.dueDate}</span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {invoice.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.description} (x{item.quantity})</span>
                            <span>{item.total.toLocaleString()} VND</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadPDF(invoice)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {language === 'vi' ? 'Xuất PDF' : 'Export PDF'}
                        </Button>
                        {invoice.status === "pending" && (
                          <Button size="sm">
                            <CreditCard className="w-4 h-4 mr-2" />
                            {t('process_payment')}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* QR Code Export Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              {language === 'vi' ? 'Xuất Hóa Đơn' : 'Export Invoice'}
            </DialogTitle>
            <DialogDescription>
              {language === 'vi' 
                ? 'Chọn tùy chọn xuất hóa đơn với hoặc không có mã QR'
                : 'Choose export option with or without QR code'
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium mb-2">{selectedInvoice.id}</h4>
                <p className="text-sm text-muted-foreground">{selectedInvoice.customer}</p>
                <p className="font-semibold text-primary">{selectedInvoice.amount.toLocaleString()} VND</p>
              </div>

              {/* QR Code Preview */}
              <div className="text-center">
                <QRCodeGenerator 
                  value={`https://chargehub.payment/${selectedInvoice.id}`}
                  size={150}
                  className="mx-auto"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  {language === 'vi' ? 'Mã QR thanh toán trực tuyến' : 'Online payment QR code'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={() => generateInvoicePDF(true)}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {language === 'vi' ? 'Xuất PDF với mã QR' : 'Export PDF with QR Code'}
                </Button>
                
                <Button 
                  onClick={() => generateInvoicePDF(false)}
                  variant="outline"
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {language === 'vi' ? 'Xuất PDF thường' : 'Export Standard PDF'}
                </Button>

                <Button 
                  onClick={sendInvoiceByEmail}
                  variant="outline"
                  className="w-full"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {language === 'vi' ? 'Gửi qua Email' : 'Send by Email'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}