import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { motion } from "motion/react";
import { 
  ArrowLeft,
  Wallet,
  CreditCard,
  Building2,
  Plus,
  Star,
  Eye,
  EyeOff,
  History,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  AlertTriangle,
  Settings,
  DollarSign,
  Smartphone,
  QrCode,
  Copy,
  RefreshCw,
  Shield,
  Calendar,
  Target,
  Banknote,
  Clock,
  Zap,
  CreditCardIcon,
  Info,
  Bell,
  Timer,
  Gift,
  Sparkles,
  HandCoins,
  WalletCards,
  CircleDollarSign,
  Filter,
  Search,
  Download,
  FileText,
  Receipt,
  X
} from "lucide-react";
import { Separator } from "./ui/separator";

interface WalletViewProps {
  onBack: () => void;
}

// Vietnamese Banks supported
const vietnameseBanks = [
  { code: "VCB", name: "Vietcombank", fullName: "Ngân hàng TMCP Ngoại thương Việt Nam", logo: "🏦" },
  { code: "TCB", name: "Techcombank", fullName: "Ngân hàng TMCP Kỹ thương Việt Nam", logo: "🏧" },
  { code: "BIDV", name: "BIDV", fullName: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam", logo: "🌟" },
  { code: "VPB", name: "VPBank", fullName: "Ngân hàng TMCP Việt Nam Thịnh vượng", logo: "💎" },
  { code: "TPB", name: "TPBank", fullName: "Ngân hàng TMCP Tiên Phong", logo: "🚀" },
  { code: "ACB", name: "ACB", fullName: "Ngân hàng TMCP Á Châu", logo: "🔷" },
  { code: "SHB", name: "SHB", fullName: "Ngân hàng TMCP Sài Gòn - Hà Nội", logo: "⭐" },
  { code: "MSB", name: "MSB", fullName: "Ngân hàng TMCP Hàng Hải", logo: "⚓" },
  { code: "VIB", name: "VIB", fullName: "Ngân hàng TMCP Quốc tế Việt Nam", logo: "🌐" },
  { code: "STB", name: "Sacombank", fullName: "Ngân hàng TMCP Sài Gòn Thương Tín", logo: "🏛️" },
  { code: "MB", name: "MBBank", fullName: "Ngân hàng TMCP Quân đội", logo: "🛡️" },
  { code: "OCB", name: "OCB", fullName: "Ngân hàng TMCP Phương Đông", logo: "🌅" },
  { code: "EIB", name: "Eximbank", fullName: "Ngân hàng TMCP Xuất Nhập khẩu Việt Nam", logo: "📦" },
  { code: "ABB", name: "ABBANK", fullName: "Ngân hàng TMCP An Bình", logo: "🕊️" },
  { code: "VAB", name: "VietABank", fullName: "Ngân hàng TMCP Việt Á", logo: "🌸" }
];

// Mock wallet data
const walletData = {
  balance: 2847500, // VND
  currency: "VND",
  lastUpdated: new Date().toISOString(),
  accountNumber: "1234567890",

  // ATM Cards Vietnam
  atmCards: [
    {
      id: "atm-1",
      bankName: "Vietcombank",
      bankCode: "VCB",
      cardNumber: "**** **** **** 1234",
      fullCardNumber: "9704010000001234567",
      holderName: "NGUYEN VAN A",
      expiryDate: "12/27",
      cardType: "ATM",
      isDefault: true,
      status: "active",
      addedDate: "2024-01-15T00:00:00Z",
      logo: "🏦"
    },
    {
      id: "atm-2", 
      bankName: "Techcombank",
      bankCode: "TCB",
      cardNumber: "**** **** **** 5678",
      fullCardNumber: "9704010000005678901",
      holderName: "NGUYEN VAN A",
      expiryDate: "08/26",
      cardType: "ATM",
      isDefault: false,
      status: "active",
      addedDate: "2024-02-20T00:00:00Z",
      logo: "🏧"
    },
    {
      id: "atm-3",
      bankName: "BIDV",
      bankCode: "BIDV", 
      cardNumber: "**** **** **** 9012",
      fullCardNumber: "9704010000009012345",
      holderName: "NGUYEN VAN A",
      expiryDate: "06/28",
      cardType: "ATM",
      isDefault: false,
      status: "active",
      addedDate: "2024-03-10T00:00:00Z",
      logo: "🌟"
    }
  ],

  // Pay Later data - like MoMo's wallet credit feature
  payLater: {
    available: true,
    creditLimit: 5000000, // 5 million VND credit limit
    currentDebt: 1240000, // Current outstanding amount
    availableCredit: 3760000, // Available credit to use
    dueDate: "2024-12-25T00:00:00Z", // Next payment due date
    minimumPayment: 200000, // Minimum monthly payment
    interestRate: 0, // 0% interest for promotional period
    payLaterTransactions: [
      {
        id: "pl-1",
        type: "pay_later_charge",
        amount: -350000,
        description: "Fast charging at Station Delta - Pay Later",
        date: "2024-12-15T11:30:00Z",
        status: "pending_payment",
        dueDate: "2024-12-25T00:00:00Z",
        location: "Station Delta"
      },
      {
        id: "pl-2", 
        type: "pay_later_charge",
        amount: -890000,
        description: "Emergency charging at Station Gamma - Pay Later",
        date: "2024-12-12T18:45:00Z",
        status: "pending_payment", 
        dueDate: "2024-12-25T00:00:00Z",
        location: "Station Gamma"
      },
      {
        id: "pl-3",
        type: "pay_later_payment",
        amount: 1500000,
        description: "Pay Later debt settlement",
        date: "2024-11-25T14:20:00Z",
        status: "completed",
        paymentMethod: "VietcomBank ****1234"
      }
    ]
  },

  // Recent transactions
  transactions: [
    {
      id: "txn-1",
      type: "charge",
      amount: -85400,
      description: "Charging at Station Alpha",
      date: "2024-12-14T14:30:00Z",
      status: "completed",
      paymentMethod: "Visa ****4242"
    },
    {
      id: "txn-2", 
      type: "top_up",
      amount: 500000,
      description: "Wallet Top-up",
      date: "2024-12-13T10:15:00Z",
      status: "completed",
      paymentMethod: "VietcomBank ****1234"
    },
    {
      id: "txn-3",
      type: "charge",
      amount: -120300,
      description: "Charging at Station Beta",
      date: "2024-12-12T16:45:00Z", 
      status: "completed",
      paymentMethod: "Wallet Balance"
    },
    {
      id: "txn-4",
      type: "refund",
      amount: 85400,
      description: "Refund for cancelled session",
      date: "2024-12-11T09:20:00Z",
      status: "completed",
      paymentMethod: "Wallet Balance"
    }
  ]
};

export default function WalletView({ onBack }: WalletViewProps) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState("wallet");
  
  // ATM Card Management states
  const [showATMCards, setShowATMCards] = useState(false);
  const [showAddATMCard, setShowAddATMCard] = useState(false);
  const [showTopUpDialog, setShowTopUpDialog] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [selectedATMCard, setSelectedATMCard] = useState("");
  const [newATMCardNumber, setNewATMCardNumber] = useState("");
  const [newATMBank, setNewATMBank] = useState("");
  const [newATMHolderName, setNewATMHolderName] = useState("");
  const [atmCardToRemove, setAtmCardToRemove] = useState<string | null>(null);
  
  // Pay Later states
  const [showPayLaterDialog, setShowPayLaterDialog] = useState(false);
  const [payLaterPaymentAmount, setPayLaterPaymentAmount] = useState("");
  const [selectedPaymentCard, setSelectedPaymentCard] = useState("");

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
      case "charge":
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case "top_up":
      case "refund":
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      default:
        return <ArrowUpRight className="w-4 h-4" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // ATM Card Management Functions
  const handleAddATMCard = () => {
    if (!newATMCardNumber || !newATMBank || !newATMHolderName) return;
    
    if (newATMCardNumber.length < 16) {
      alert(language === 'en' ? 'Card number must be at least 16 digits' : 'Số thẻ phải có ít nhất 16 số');
      return;
    }
    
    const newCard = {
      id: `atm-${Date.now()}`,
      bankName: vietnameseBanks.find(b => b.code === newATMBank)?.name || newATMBank,
      bankCode: newATMBank,
      cardNumber: `**** **** **** ${newATMCardNumber.slice(-4)}`,
      fullCardNumber: newATMCardNumber,
      holderName: newATMHolderName.toUpperCase(),
      expiryDate: "12/29",
      cardType: "ATM",
      isDefault: walletData.atmCards.length === 0,
      status: "active",
      addedDate: new Date().toISOString(),
      logo: vietnameseBanks.find(b => b.code === newATMBank)?.logo || "🏦"
    };
    
    walletData.atmCards.push(newCard);
    
    setNewATMCardNumber("");
    setNewATMBank("");
    setNewATMHolderName("");
    setShowAddATMCard(false);
    
    console.log("ATM Card added:", newCard);
  };

  const handleRemoveATMCard = (cardId: string) => {
    const cardIndex = walletData.atmCards.findIndex(card => card.id === cardId);
    if (cardIndex > -1) {
      walletData.atmCards.splice(cardIndex, 1);
      console.log("ATM Card removed:", cardId);
    }
    setAtmCardToRemove(null);
  };

  const setDefaultATMCard = (cardId: string) => {
    walletData.atmCards.forEach(card => {
      card.isDefault = card.id === cardId;
    });
    console.log("Default ATM card set:", cardId);
  };

  const handleTopUp = () => {
    if (!topUpAmount || !selectedATMCard) return;
    
    const amount = parseFloat(topUpAmount);
    if (amount < 10000) {
      alert(language === 'en' ? 'Minimum top-up amount is 10,000 VND' : 'Số tiền nạp tối thiểu là 10,000 VND');
      return;
    }
    
    if (amount > 50000000) {
      alert(language === 'en' ? 'Maximum top-up amount is 50,000,000 VND' : 'Số tiền nạp tối đa là 50,000,000 VND');
      return;
    }
    
    const selectedCard = walletData.atmCards.find(card => card.id === selectedATMCard);
    console.log("Processing top-up:", {
      amount: amount,
      card: selectedCard,
      timestamp: new Date().toISOString()
    });
    
    walletData.balance += amount;
    
    const newTransaction = {
      id: `txn-${Date.now()}`,
      type: "top_up" as const,
      amount: amount,
      description: `Wallet Top-up via ${selectedCard?.bankName}`,
      date: new Date().toISOString(),
      status: "completed" as const,
      paymentMethod: `${selectedCard?.bankName} ${selectedCard?.cardNumber}`
    };
    
    walletData.transactions.unshift(newTransaction);
    
    setTopUpAmount("");
    setSelectedATMCard("");
    setShowTopUpDialog(false);
    
    alert(language === 'en' ? 'Top-up successful!' : 'Nạp tiền thành công!');
  };

  // Pay Later payment function
  const handlePayLaterPayment = () => {
    if (!payLaterPaymentAmount || !selectedPaymentCard) return;
    
    const amount = parseFloat(payLaterPaymentAmount);
    if (amount < 50000) {
      alert(language === 'en' ? 'Minimum payment amount is 50,000 VND' : 'Số tiền thanh toán tối thiểu là 50,000 VND');
      return;
    }
    
    if (amount > walletData.payLater.currentDebt) {
      alert(language === 'en' ? 'Payment amount cannot exceed current debt' : 'Số tiền thanh toán không thể vượt quá nợ hiện tại');
      return;
    }
    
    const selectedCard = walletData.atmCards.find(card => card.id === selectedPaymentCard);
    console.log("Processing Pay Later payment:", {
      amount: amount,
      card: selectedCard,
      currentDebt: walletData.payLater.currentDebt,
      timestamp: new Date().toISOString()
    });
    
    // Update debt and available credit
    walletData.payLater.currentDebt -= amount;
    walletData.payLater.availableCredit += amount;
    
    const newTransaction = {
      id: `pl-pay-${Date.now()}`,
      type: "pay_later_payment" as const,
      amount: amount,
      description: `Pay Later debt payment via ${selectedCard?.bankName}`,
      date: new Date().toISOString(),
      status: "completed" as const,
      paymentMethod: `${selectedCard?.bankName} ${selectedCard?.cardNumber}`
    };
    
    walletData.payLater.payLaterTransactions.unshift(newTransaction);
    
    setPayLaterPaymentAmount("");
    setSelectedPaymentCard("");
    setShowPayLaterDialog(false);
    
    alert(language === 'en' ? 'Pay Later payment successful!' : 'Thanh toán trả sau thành công!');
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
                    {language === 'en' ? 'Manage your balance and payment methods' : 'Quản lý số dư và phương thức thanh toán'}
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="wallet" className="flex items-center space-x-2">
                <Wallet className="w-4 h-4" />
                <span>{language === 'en' ? 'Wallet' : 'Ví'}</span>
              </TabsTrigger>
              <TabsTrigger value="pay_later" className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{t('pay_later')}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="wallet" className="space-y-8">
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

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      className="flex-1 bg-primary hover:bg-primary/90"
                      onClick={() => setShowTopUpDialog(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {language === 'en' ? 'Top Up Wallet' : 'Nạp Tiền'}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setShowATMCards(true)}
                    >
                      <WalletCards className="w-4 h-4 mr-2" />
                      {language === 'en' ? 'Manage ATM Cards' : 'Quản Lý Thẻ ATM'}
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

          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-card/80 backdrop-blur-sm border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="w-5 h-5 text-primary" />
                  <span>{language === 'en' ? 'Recent Transactions' : 'Giao Dịch Gần Đây'}</span>
                </CardTitle>
                <CardDescription>
                  {language === 'en' ? 'Your latest wallet activities' : 'Hoạt động gần đây của ví'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {walletData.transactions.slice(0, 5).map((transaction) => (
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
                      <p className={`font-semibold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </p>
                      <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {transaction.status === 'completed' 
                          ? (language === 'en' ? 'Completed' : 'Hoàn thành')
                          : (language === 'en' ? 'Pending' : 'Đang xử lý')
                        }
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
          </TabsContent>

          {/* Pay Later Tab */}
          <TabsContent value="pay_later" className="space-y-8">
            {/* Pay Later Balance Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-orange-500/20 border-orange-500/30 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                        <Clock className="w-6 h-6 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">
                          {t('pay_later_wallet')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {t('pay_later_description')}
                        </p>
                      </div>
                    </div>
                    <Badge variant={walletData.payLater.available ? "default" : "secondary"} className="bg-orange-500 text-white">
                      {walletData.payLater.available 
                        ? (language === 'en' ? 'Active' : 'Hoạt động') 
                        : (language === 'en' ? 'Inactive' : 'Không hoạt động')
                      }
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">{t('credit_limit')}</p>
                      <p className="text-xl font-bold text-orange-600">
                        {formatCurrency(walletData.payLater.creditLimit)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">{t('current_debt')}</p>
                      <p className="text-xl font-bold text-red-600">
                        {formatCurrency(walletData.payLater.currentDebt)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">{t('available_credit')}</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(walletData.payLater.availableCredit)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-card/60 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{t('due_date')}</p>
                        <p className="font-medium">{formatDate(walletData.payLater.dueDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t('minimum_payment')}</p>
                        <p className="font-medium">{formatCurrency(walletData.payLater.minimumPayment)}</p>
                      </div>
                    </div>
                  </div>

                  {walletData.payLater.currentDebt > 0 && (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        className="flex-1 bg-orange-500 hover:bg-orange-600"
                        onClick={() => setShowPayLaterDialog(true)}
                      >
                        <HandCoins className="w-4 h-4 mr-2" />
                        {t('pay_debt')}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          setPayLaterPaymentAmount(walletData.payLater.currentDebt.toString());
                          setShowPayLaterDialog(true);
                        }}
                      >
                        <CircleDollarSign className="w-4 h-4 mr-2" />
                        {t('full_payment')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Pay Later History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="bg-card/80 backdrop-blur-sm border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <History className="w-5 h-5 text-orange-500" />
                    <span>{t('pay_later_history')}</span>
                  </CardTitle>
                  <CardDescription>
                    {language === 'en' ? 'Your Pay Later transactions and payments' : 'Giao dịch trả sau và thanh toán của bạn'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {walletData.payLater.payLaterTransactions.map((transaction) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center">
                          {transaction.type === 'pay_later_charge' ? (
                            <ArrowUpRight className="w-4 h-4 text-orange-500" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{transaction.description}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>{formatDate(transaction.date)}</span>
                            {transaction.paymentMethod && (
                              <>
                                <span>•</span>
                                <span>{transaction.paymentMethod}</span>
                              </>
                            )}
                            {transaction.dueDate && transaction.status === 'pending_payment' && (
                              <>
                                <span>•</span>
                                <span>{language === 'en' ? 'Due: ' : 'Đáo hạn: '}{formatDate(transaction.dueDate)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                        </p>
                        <Badge 
                          variant={transaction.status === 'completed' ? 'default' : 'secondary'} 
                          className={`text-xs ${
                            transaction.status === 'pending_payment' ? 'bg-orange-100 text-orange-800' : ''
                          }`}
                        >
                          {transaction.status === 'completed' 
                            ? (language === 'en' ? 'Completed' : 'Hoàn thành')
                            : transaction.status === 'pending_payment'
                            ? (language === 'en' ? 'Pending Payment' : 'Chờ thanh toán')
                            : (language === 'en' ? 'Pending' : 'Đang xử lý')
                          }
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Pay Later Payment Dialog */}
      <Dialog open={showPayLaterDialog} onOpenChange={setShowPayLaterDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <HandCoins className="w-5 h-5 text-orange-500" />
              <span>{t('pay_debt')}</span>
            </DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? 'Pay your Pay Later debt using your ATM card'
                : 'Thanh toán nợ trả sau bằng thẻ ATM của bạn'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Current Debt Info */}
            <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-800 dark:text-orange-300">{t('current_debt')}</p>
                  <p className="text-xl font-bold text-orange-900 dark:text-orange-200">
                    {formatCurrency(walletData.payLater.currentDebt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-orange-800 dark:text-orange-300">{t('minimum_payment')}</p>
                  <p className="font-medium text-orange-900 dark:text-orange-200">
                    {formatCurrency(walletData.payLater.minimumPayment)}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('payment_amount')} (VND)
              </label>
              <Input
                type="number"
                placeholder={language === 'en' ? 'Enter amount...' : 'Nhập số tiền...'}
                value={payLaterPaymentAmount}
                onChange={(e) => setPayLaterPaymentAmount(e.target.value)}
                min="50000"
                max={walletData.payLater.currentDebt.toString()}
              />
              <p className="text-xs text-muted-foreground">
                {language === 'en' 
                  ? `Min: 50,000 VND - Max: ${formatCurrency(walletData.payLater.currentDebt)}`
                  : `Tối thiểu: 50,000 VND - Tối đa: ${formatCurrency(walletData.payLater.currentDebt)}`
                }
              </p>
            </div>

            {/* Select Payment Card */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('select_payment_card')}
              </label>
              <Select value={selectedPaymentCard} onValueChange={setSelectedPaymentCard}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'en' ? 'Choose payment card...' : 'Chọn thẻ thanh toán...'} />
                </SelectTrigger>
                <SelectContent>
                  {walletData.atmCards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      <div className="flex items-center space-x-2">
                        <span>{card.logo}</span>
                        <span>{card.bankName} {card.cardNumber}</span>
                        {card.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            {language === 'en' ? 'Default' : 'Mặc định'}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quick payment buttons */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'en' ? 'Quick payments' : 'Thanh toán nhanh'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPayLaterPaymentAmount(walletData.payLater.minimumPayment.toString())}
                  className="text-xs"
                >
                  {t('minimum_payment')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPayLaterPaymentAmount(walletData.payLater.currentDebt.toString())}
                  className="text-xs"
                >
                  {t('full_payment')}
                </Button>
              </div>
            </div>

            {/* No cards message */}
            {walletData.atmCards.length === 0 && (
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  {language === 'en' 
                    ? 'No ATM cards linked. Add one to continue.'
                    : 'Chưa có thẻ ATM nào. Thêm thẻ để tiếp tục.'
                  }
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setShowPayLaterDialog(false);
                    setShowAddATMCard(true);
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {language === 'en' ? 'Add ATM Card' : 'Thêm Thẻ ATM'}
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowPayLaterDialog(false)}
              >
                {language === 'en' ? 'Cancel' : 'Hủy'}
              </Button>
              <Button 
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                onClick={handlePayLaterPayment}
                disabled={!payLaterPaymentAmount || !selectedPaymentCard || walletData.atmCards.length === 0}
              >
                <HandCoins className="w-4 h-4 mr-2" />
                {t('pay_now')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Top Up Dialog */}
      <Dialog open={showTopUpDialog} onOpenChange={setShowTopUpDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-primary" />
              <span>{language === 'en' ? 'Top Up Wallet' : 'Nạp Tiền Vào Ví'}</span>
            </DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? 'Add money to your wallet using your ATM card'
                : 'Thêm tiền vào ví của bạn bằng thẻ ATM'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Top-up Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'en' ? 'Amount (VND)' : 'Số tiền (VND)'}
              </label>
              <Input
                type="number"
                placeholder={language === 'en' ? 'Enter amount...' : 'Nhập số tiền...'}
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                min="10000"
                max="50000000"
              />
              <p className="text-xs text-muted-foreground">
                {language === 'en' 
                  ? 'Min: 10,000 VND - Max: 50,000,000 VND'
                  : 'Tối thiểu: 10,000 VND - Tối đa: 50,000,000 VND'
                }
              </p>
            </div>

            {/* Select ATM Card */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'en' ? 'Select ATM Card' : 'Chọn thẻ ATM'}
              </label>
              <Select value={selectedATMCard} onValueChange={setSelectedATMCard}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'en' ? 'Choose ATM card...' : 'Chọn thẻ ATM...'} />
                </SelectTrigger>
                <SelectContent>
                  {walletData.atmCards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      <div className="flex items-center space-x-2">
                        <span>{card.logo}</span>
                        <span>{card.bankName} {card.cardNumber}</span>
                        {card.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            {language === 'en' ? 'Default' : 'Mặc định'}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quick amount buttons */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'en' ? 'Quick amounts' : 'Số tiền nhanh'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[50000, 100000, 200000, 500000, 1000000, 2000000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setTopUpAmount(amount.toString())}
                    className="text-xs"
                  >
                    {new Intl.NumberFormat('vi-VN').format(amount)}
                  </Button>
                ))}
              </div>
            </div>

            {/* No cards message */}
            {walletData.atmCards.length === 0 && (
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  {language === 'en' 
                    ? 'No ATM cards linked. Add one to continue.'
                    : 'Chưa có thẻ ATM nào. Thêm thẻ để tiếp tục.'
                  }
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setShowTopUpDialog(false);
                    setShowAddATMCard(true);
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {language === 'en' ? 'Add ATM Card' : 'Thêm Thẻ ATM'}
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowTopUpDialog(false)}
              >
                {language === 'en' ? 'Cancel' : 'Hủy'}
              </Button>
              <Button 
                className="flex-1"
                onClick={handleTopUp}
                disabled={!topUpAmount || !selectedATMCard || walletData.atmCards.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                {language === 'en' ? 'Top Up' : 'Nạp Tiền'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ATM Cards Management Dialog */}
      <Dialog open={showATMCards} onOpenChange={setShowATMCards}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <WalletCards className="w-5 h-5 text-primary" />
              <span>{language === 'en' ? 'Manage ATM Cards' : 'Quản Lý Thẻ ATM'}</span>
            </DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? 'Add, remove or set default ATM cards for easy top-ups'
                : 'Thêm, xóa hoặc đặt thẻ ATM mặc định để nạp tiền dễ dàng'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* Add New Card Button */}
            <Button 
              onClick={() => setShowAddATMCard(true)}
              className="w-full"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              {language === 'en' ? 'Add New ATM Card' : 'Thêm Thẻ ATM Mới'}
            </Button>

            {/* ATM Cards List */}
            <div className="space-y-3">
              {walletData.atmCards.map((card) => (
                <Card key={card.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{card.logo}</div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{card.bankName}</span>
                          {card.isDefault && (
                            <Badge variant="default" className="text-xs">
                              {language === 'en' ? 'Default' : 'Mặc định'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{card.cardNumber}</p>
                        <p className="text-xs text-muted-foreground">{card.holderName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {!card.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDefaultATMCard(card.id)}
                        >
                          <Star className="w-3 h-3 mr-1" />
                          {language === 'en' ? 'Set Default' : 'Đặt mặc định'}
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAtmCardToRemove(card.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              
              {walletData.atmCards.length === 0 && (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {language === 'en' ? 'No ATM cards added yet' : 'Chưa có thẻ ATM nào'}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setShowATMCards(false)}>
              {language === 'en' ? 'Close' : 'Đóng'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add ATM Card Dialog */}
      <Dialog open={showAddATMCard} onOpenChange={setShowAddATMCard}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-primary" />
              <span>{language === 'en' ? 'Add ATM Card' : 'Thêm Thẻ ATM'}</span>
            </DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? 'Link your Vietnamese ATM card for easy top-ups'
                : 'Liên kết thẻ ATM Việt Nam để nạp tiền dễ dàng'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Bank Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'en' ? 'Select Bank' : 'Chọn ngân hàng'}
              </label>
              <Select value={newATMBank} onValueChange={setNewATMBank}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'en' ? 'Choose your bank...' : 'Chọn ngân hàng...'} />
                </SelectTrigger>
                <SelectContent>
                  {vietnameseBanks.map((bank) => (
                    <SelectItem key={bank.code} value={bank.code}>
                      <div className="flex items-center space-x-2">
                        <span>{bank.logo}</span>
                        <div>
                          <div className="font-medium">{bank.name}</div>
                          <div className="text-xs text-muted-foreground">{bank.fullName}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Card Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'en' ? 'Card Number' : 'Số thẻ'}
              </label>
              <Input
                type="text"
                placeholder={language === 'en' ? 'Enter your ATM card number...' : 'Nhập số thẻ ATM...'}
                value={newATMCardNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 19);
                  setNewATMCardNumber(value);
                }}
                maxLength={19}
              />
              <p className="text-xs text-muted-foreground">
                {language === 'en' 
                  ? 'Enter the 16-19 digit number on your ATM card'
                  : 'Nhập số 16-19 chữ số trên thẻ ATM của bạn'
                }
              </p>
            </div>

            {/* Cardholder Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'en' ? 'Cardholder Name' : 'Tên chủ thẻ'}
              </label>
              <Input
                type="text"
                placeholder={language === 'en' ? 'Enter name as on card...' : 'Nhập tên như trên thẻ...'}
                value={newATMHolderName}
                onChange={(e) => setNewATMHolderName(e.target.value)}
                style={{ textTransform: 'uppercase' }}
              />
              <p className="text-xs text-muted-foreground">
                {language === 'en' 
                  ? 'Name must match exactly as printed on your ATM card'
                  : 'Tên phải khớp chính xác như in trên thẻ ATM'
                }
              </p>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <div className="flex items-start space-x-2">
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-xs text-blue-800 dark:text-blue-300">
                  <p className="font-medium mb-1">
                    {language === 'en' ? 'Security Notice' : 'Thông báo bảo mật'}
                  </p>
                  <p>
                    {language === 'en' 
                      ? 'Your card details are encrypted and securely stored. We never store your PIN or CVV.'
                      : 'Thông tin thẻ được mã hóa và lưu trữ an toàn. Chúng tôi không bao giờ lưu mã PIN hoặc CVV.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowAddATMCard(false);
                  setNewATMCardNumber("");
                  setNewATMBank("");
                  setNewATMHolderName("");
                }}
              >
                {language === 'en' ? 'Cancel' : 'Hủy'}
              </Button>
              <Button 
                className="flex-1"
                onClick={handleAddATMCard}
                disabled={!newATMCardNumber || !newATMBank || !newATMHolderName}
              >
                <Plus className="w-4 h-4 mr-2" />
                {language === 'en' ? 'Add Card' : 'Thêm thẻ'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove ATM Card Confirmation Dialog */}
      <Dialog open={!!atmCardToRemove} onOpenChange={() => setAtmCardToRemove(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span>{language === 'en' ? 'Remove ATM Card' : 'Gỡ Liên Kết Thẻ ATM'}</span>
            </DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? 'Are you sure you want to remove this ATM card? This action cannot be undone.'
                : 'Bạn có chắc chắn muốn gỡ liên kết thẻ ATM này không? Hành động này không thể hoàn tác.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {atmCardToRemove && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {walletData.atmCards.find(c => c.id === atmCardToRemove)?.logo}
                </div>
                <div>
                  <p className="font-medium">
                    {walletData.atmCards.find(c => c.id === atmCardToRemove)?.bankName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {walletData.atmCards.find(c => c.id === atmCardToRemove)?.cardNumber}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex space-x-3 pt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setAtmCardToRemove(null)}
            >
              {language === 'en' ? 'Cancel' : 'Hủy'}
            </Button>
            <Button 
              variant="destructive"
              className="flex-1"
              onClick={() => handleRemoveATMCard(atmCardToRemove!)}
            >
              <X className="w-4 h-4 mr-2" />
              {language === 'en' ? 'Remove' : 'Gỡ bỏ'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}