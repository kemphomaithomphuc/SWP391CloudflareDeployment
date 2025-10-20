import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { motion } from "motion/react";
import { 
  ArrowLeft,
  Wallet,
  Plus,
  Eye,
  EyeOff,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  QrCode,
  Copy
} from "lucide-react";

interface WalletViewProps {
  onBack: () => void;
}

// Mock wallet data
const walletData = {
  balance: 2847500, // VND
  currency: "VND",
  lastUpdated: new Date().toISOString(),
  accountNumber: "1234567890",

  // Recent top-up transactions only
  transactions: [
    {
      id: "txn-1",
      type: "top_up",
      amount: 500000,
      description: "Wallet Top-up via QR Code",
      date: "2024-12-18T10:15:00Z",
      status: "completed",
      paymentMethod: "QR Code - VietcomBank"
    },
    {
      id: "txn-2", 
      type: "top_up",
      amount: 1000000,
      description: "Wallet Top-up via QR Code",
      date: "2024-12-15T14:30:00Z",
      status: "completed",
      paymentMethod: "QR Code - Techcombank"
    },
    {
      id: "txn-3",
      type: "top_up",
      amount: 300000,
      description: "Wallet Top-up via QR Code",
      date: "2024-12-12T09:20:00Z", 
      status: "completed",
      paymentMethod: "QR Code - BIDV"
    },
    {
      id: "txn-4",
      type: "top_up",
      amount: 750000,
      description: "Wallet Top-up via QR Code",
      date: "2024-12-08T16:45:00Z",
      status: "completed",
      paymentMethod: "QR Code - MBBank"
    },
    {
      id: "txn-5",
      type: "top_up",
      amount: 200000,
      description: "Wallet Top-up via QR Code",
      date: "2024-12-05T11:10:00Z",
      status: "completed",
      paymentMethod: "QR Code - VPBank"
    }
  ]
};

export default function WalletView({ onBack }: WalletViewProps) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  
  const [showBalance, setShowBalance] = useState(true);
  const [showTopUpDialog, setShowTopUpDialog] = useState(false);

  const formatCurrency = (amount: number) => {
    const absAmount = Math.abs(amount);
    return new Intl.NumberFormat('vi-VN').format(absAmount) + ' VND';
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      console.warn('Date formatting error:', error);
      return dateString;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "top_up":
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      default:
        return <ArrowUpRight className="w-4 h-4" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Generate QR Code data
  const generateQRData = () => {
    // In a real app, this would generate a payment QR code
    // For now, we'll use a simple format
    return `CHARGEHUB|${walletData.accountNumber}|TOP_UP`;
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
                {language === 'en' ? 'Back to Dashboard' : 'Về Dashboard'}
              </Button>
              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 via-green-500/90 to-green-500/70 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30 transform group-hover:scale-110 transition-transform duration-300">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="font-semibold text-foreground">
                    {language === 'en' ? 'My Wallet' : 'Ví Của Tôi'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Manage your balance and top-up' : 'Quản lý số dư và nạp tiền'}
                  </p>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              {language === 'en' ? 'Refresh' : 'Làm Mới'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Wallet Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-primary/20 border-primary/30 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">
                      {language === 'en' ? 'Wallet Balance' : 'Số Dư Ví'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'en' ? 'Available for charging' : 'Có thể sử dụng để sạc'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary mb-2">
                    {showBalance ? formatCurrency(walletData.balance) : '••••••••'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Last updated: ' : 'Cập nhật lần cuối: '}
                    {formatDate(walletData.lastUpdated)}
                  </p>
                </div>

                <div className="flex justify-center">
                  <Button 
                    className="bg-primary hover:bg-primary/90 px-8"
                    onClick={() => setShowTopUpDialog(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {language === 'en' ? 'Top Up Wallet' : 'Nạp Tiền'}
                  </Button>
                </div>

                <div className="bg-card/60 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <QrCode className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {language === 'en' ? 'Wallet ID: ' : 'Mã Ví: '}
                      {walletData.accountNumber}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(walletData.accountNumber)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top-Up History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-card/80 backdrop-blur-sm border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="w-5 h-5 text-primary" />
                <span>{language === 'en' ? 'Top-Up History' : 'Lịch Sử Nạp Tiền'}</span>
              </CardTitle>
              <CardDescription>
                {language === 'en' ? 'Your recent top-up transactions' : 'Các giao dịch nạp tiền gần đây'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {walletData.transactions.map((transaction) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{transaction.description}</p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>{formatDate(transaction.date)}</span>
                        <span>•</span>
                        <span>{transaction.paymentMethod}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      +{formatCurrency(transaction.amount)}
                    </p>
                    <Badge variant="default" className="text-xs">
                      {language === 'en' ? 'Completed' : 'Hoàn thành'}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Up Dialog with QR Code */}
      <Dialog open={showTopUpDialog} onOpenChange={setShowTopUpDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <QrCode className="w-5 h-5 text-primary" />
              <span>{language === 'en' ? 'Top Up Wallet' : 'Nạp Tiền Vào Ví'}</span>
            </DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? 'Scan the QR code below with your banking app to top up your wallet'
                : 'Quét mã QR bên dưới bằng ứng dụng ngân hàng để nạp tiền vào ví'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* QR Code Display */}
            <div className="flex flex-col items-center space-y-4">
              <div className="w-64 h-64 bg-white rounded-lg p-4 flex items-center justify-center border-2 border-primary/20">
                {/* QR Code placeholder - in production, use a real QR generator */}
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-primary/30" />
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  {language === 'en' ? 'Account Number' : 'Số Tài Khoản'}
                </p>
                <div className="flex items-center justify-center space-x-2 bg-muted/50 px-4 py-2 rounded-lg">
                  <code className="text-foreground font-mono">{walletData.accountNumber}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      copyToClipboard(walletData.accountNumber);
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Banking Instructions */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
              <p className="font-medium text-foreground">
                {language === 'en' ? 'Instructions:' : 'Hướng Dẫn:'}
              </p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>{language === 'en' ? 'Open your banking app' : 'Mở ứng dụng ngân hàng của bạn'}</li>
                <li>{language === 'en' ? 'Select QR Code payment' : 'Chọn thanh toán bằng mã QR'}</li>
                <li>{language === 'en' ? 'Scan the QR code above' : 'Quét mã QR ở trên'}</li>
                <li>{language === 'en' ? 'Enter the amount and confirm' : 'Nhập số tiền và xác nhận'}</li>
                <li>{language === 'en' ? 'Your wallet will be updated instantly' : 'Ví của bạn sẽ được cập nhật ngay lập tức'}</li>
              </ol>
            </div>


            {/* Close Button */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowTopUpDialog(false)}
            >
              {language === 'en' ? 'Close' : 'Đóng'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
