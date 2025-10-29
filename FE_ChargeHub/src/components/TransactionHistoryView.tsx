import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  CreditCard,
  Clock,
  MapPin,
  Zap,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Eye,
  Receipt
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { getTransactionHistory } from "../services/api";

interface Transaction {
  id: string;
  date: string;
  time: string;
  stationName: string;
  location: string;
  amount: number;
  energyConsumed: number;
  duration: number;
  status: 'completed' | 'pending' | 'cancelled';
  paymentMethod: string;
  transactionType: 'charging' | 'subscription' | 'refund';
}

interface TransactionHistoryViewProps {
  onBack: () => void;
}

export default function TransactionHistoryView({ onBack }: TransactionHistoryViewProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  const { language, t } = useLanguage();
  const { theme } = useTheme();

  // Mock data - fallback if API không trả về
  // const mockTransactions: Transaction[] = [
  //   {
  //     id: "TXN001",
  //     date: "2024-01-15",
  //     time: "14:30",
  //     stationName: "EV Station Central",
  //     location: "123 Main St, Ho Chi Minh City",
  //     amount: 125000,
  //     energyConsumed: 25.5,
  //     duration: 45,
  //     status: "completed",
  //     paymentMethod: "Credit Card",
  //     transactionType: "charging"
  //   },
  //   {
  //     id: "TXN002",
  //     date: "2024-01-14",
  //     time: "09:15",
  //     stationName: "Green Energy Hub",
  //     location: "456 Nguyen Hue Blvd, District 1",
  //     amount: 89000,
  //     energyConsumed: 18.2,
  //     duration: 32,
  //     status: "completed",
  //     paymentMethod: "Wallet",
  //     transactionType: "charging"
  //   },
  //   {
  //     id: "TXN003",
  //     date: "2024-01-13",
  //     time: "16:45",
  //     stationName: "EcoCharge Station",
  //     location: "789 Le Loi St, District 3",
  //     amount: 0,
  //     energyConsumed: 0,
  //     duration: 0,
  //     status: "cancelled",
  //     paymentMethod: "Credit Card",
  //     transactionType: "charging"
  //   },
  //   {
  //     id: "TXN004",
  //     date: "2024-01-12",
  //     time: "11:20",
  //     stationName: "Premium Subscription",
  //     location: "Online",
  //     amount: 500000,
  //     energyConsumed: 0,
  //     duration: 0,
  //     status: "completed",
  //     paymentMethod: "Credit Card",
  //     transactionType: "subscription"
  //   },
  //   {
  //     id: "TXN005",
  //     date: "2024-01-11",
  //     time: "13:10",
  //     stationName: "FastCharge Terminal",
  //     location: "321 Dong Khoi St, District 1",
  //     amount: 156000,
  //     energyConsumed: 31.8,
  //     duration: 28,
  //     status: "completed",
  //     paymentMethod: "Wallet",
  //     transactionType: "charging"
  //   },
  //   {
  //     id: "TXN006",
  //     date: "2024-01-10",
  //     time: "08:30",
  //     stationName: "Refund Processing",
  //     location: "System",
  //     amount: -25000,
  //     energyConsumed: 0,
  //     duration: 0,
  //     status: "completed",
  //     paymentMethod: "Wallet",
  //     transactionType: "refund"
  //   }
  // ];

  useEffect(() => {
    const loadTransactions = async () => {
      console.log("loadTransactions");
      try {
        setIsLoading(true);
        const userIdStr = localStorage.getItem("userId") || localStorage.getItem("registeredUserId");
        const userId = userIdStr ? parseInt(userIdStr, 10) : undefined;
        console.log("[TXN] userId", userId);
        if (!userId || Number.isNaN(userId)) {
          console.log('[TXN] Missing userId, skip API.');
          // setTransactions([]);
          // setTotalPages(1);
          // setIsLoading(false);
          return;
        }



        const res = await getTransactionHistory({
          userId,
          page,
          size,
          sortBy: 'createdAt',
          sortDirection: sortOrder === 'desc' ? 'DESC' : 'ASC'
        });
        console.log("[TXN] res", res);
        const payload: any = res?.data;
        const list: any[] = Array.isArray(payload) 
          ? payload 
          : (payload?.content ?? payload?.transactions ?? payload?.items ?? []);
        console.log('[TXN] payload type:', Array.isArray(payload) ? 'array' : typeof payload, 'list length:', list.length, 'totalPages:', payload?.totalPages);
        setTotalPages((payload?.totalPages as number) || 1);

        const mapped: Transaction[] = list.map((it: any) => {
          const created = it?.createdAt || it?.date || it?.startTime || new Date().toISOString();
          const dateObj = new Date(created);
          const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const rawStatus = (it?.status || '').toString().toLowerCase();
          const status: Transaction['status'] = rawStatus.includes('cancel')
            ? 'cancelled'
            : rawStatus.includes('complete') || rawStatus.includes('success')
              ? 'completed'
              : 'pending';

          return {
            id: String(it?.id ?? it?.transactionId ?? Math.random()),
            date: created,
            time,
            stationName: it?.stationName ?? 'EV Station',
            location: it?.stationAddress ?? it?.location ?? 'N/A',
            amount: Number(it?.amount ?? it?.totalAmount ?? 0),
            energyConsumed: Number(it?.energyConsumed ?? it?.kwh ?? 0),
            duration: Number(it?.duration ?? it?.durationMinutes ?? 0),
            status,
            paymentMethod: it?.paymentMethod ?? 'Wallet',
            transactionType: (it?.transactionType as Transaction['transactionType']) || 'charging',
          };
        });

        console.log('[TXN] mapped length:', mapped.length);
        setTransactions(mapped);
      } catch (e) {
        console.error('[TXN] error fetching transactions:', e);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, [page, size, sortOrder]);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.stationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || transaction.status === filterStatus;
    const matchesType = filterType === "all" || transaction.transactionType === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case "date":
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case "amount":
        comparison = a.amount - b.amount;
        break;
      case "energy":
        comparison = a.energyConsumed - b.energyConsumed;
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { color: "bg-green-100 text-green-800", text: language === 'vi' ? 'Hoàn thành' : 'Completed' },
      pending: { color: "bg-yellow-100 text-yellow-800", text: language === 'vi' ? 'Đang xử lý' : 'Pending' },
      cancelled: { color: "bg-red-100 text-red-800", text: language === 'vi' ? 'Đã hủy' : 'Cancelled' }
    };
    
    return (
      <Badge className={`${statusConfig[status as keyof typeof statusConfig].color} border-0`}>
        {statusConfig[status as keyof typeof statusConfig].text}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "charging":
        return <Zap className="w-4 h-4 text-blue-500" />;
      case "subscription":
        return <CreditCard className="w-4 h-4 text-purple-500" />;
      case "refund":
        return <Receipt className="w-4 h-4 text-green-500" />;
      default:
        return <CreditCard className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US');
  };

  const toggleTransactionExpansion = (transactionId: string) => {
    setExpandedTransaction(expandedTransaction === transactionId ? null : transactionId);
  };

  const exportTransactions = () => {
    // In real app, this would generate and download CSV/PDF
    console.log("Exporting transactions...");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'vi' ? 'Quay lại' : 'Back'}</span>
            </Button>
            <h1 className="text-xl font-semibold text-foreground">
              {t('transaction_history')}
            </h1>
          </div>
          
          <Button
            onClick={exportTransactions}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{t('export')}</span>
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Search and Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>{t('search_filter')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t('search_transactions')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="all">{t('all_status')}</option>
                  <option value="completed">{t('completed')}</option>
                  <option value="pending">{t('pending')}</option>
                  <option value="cancelled">{t('cancelled')}</option>
                </select>

                {/* Type Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="all">{t('all_types')}</option>
                  <option value="charging">{t('charging')}</option>
                  <option value="subscription">{t('subscription')}</option>
                  <option value="refund">{t('refund')}</option>
                </select>

                {/* Sort */}
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const parts = e.target.value.split('-');
                    const field = parts[0] || 'date';
                    const order = (parts[1] as "asc" | "desc") || 'desc';
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="date-desc">{t('newest_first')}</option>
                  <option value="date-asc">{t('oldest_first')}</option>
                  <option value="amount-desc">{t('highest_amount')}</option>
                  <option value="amount-asc">{t('lowest_amount')}</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">
                {t('loading')}
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedTransactions.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      {t('no_transactions_found')}
                    </h3>
                    <p className="text-muted-foreground">
                      {t('try_adjusting_filters')}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                sortedTransactions.map((transaction) => (
                  <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {getTypeIcon(transaction.transactionType)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium text-foreground">
                                {transaction.stationName}
                              </h3>
                              {getStatusBadge(transaction.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {transaction.location}
                            </p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-sm text-muted-foreground flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {formatDate(transaction.date)}
                              </span>
                              <span className="text-sm text-muted-foreground flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {transaction.time}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className={`font-semibold ${transaction.amount < 0 ? 'text-green-600' : 'text-foreground'}`}>
                              {formatCurrency(transaction.amount)}
                            </div>
                            {transaction.transactionType === 'charging' && transaction.energyConsumed > 0 && (
                              <div className="text-sm text-muted-foreground">
                                {transaction.energyConsumed} kWh
                              </div>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTransactionExpansion(transaction.id)}
                            className="flex items-center space-x-1"
                          >
                            <span className="text-sm">
                              {t('details')}
                            </span>
                            {expandedTransaction === transaction.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedTransaction === transaction.id && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <h4 className="font-medium text-foreground">
                                {t('transaction_info')}
                              </h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    {t('transaction_id')}:
                                  </span>
                                  <span className="font-mono">{transaction.id}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    {t('payment_method')}:
                                  </span>
                                  <span>{transaction.paymentMethod}</span>
                                </div>
                                {transaction.transactionType === 'charging' && (
                                  <>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        {t('charging_duration')}:
                                      </span>
                                      <span>{transaction.duration} {t('minutes')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        {t('energy_consumed')}:
                                      </span>
                                      <span>{transaction.energyConsumed} kWh</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h4 className="font-medium text-foreground">
                                {t('charging_station')}
                              </h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex items-start space-x-2">
                                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                                  <span>{transaction.location}</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h4 className="font-medium text-foreground">
                                {t('actions')}
                              </h4>
                              <div className="space-y-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full flex items-center space-x-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span>{t('view_receipt')}</span>
                                </Button>
                                {transaction.status === 'completed' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full flex items-center space-x-2"
                                  >
                                    <Download className="w-4 h-4" />
                                    <span>{t('download_receipt')}</span>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Summary Stats */}
          {!isLoading && sortedTransactions.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>
                  {t('summary')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {sortedTransactions.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('total_transactions')}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(
                        sortedTransactions
                          .filter(t => t.status === 'completed')
                          .reduce((sum, t) => sum + t.amount, 0)
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('total_spent')}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {sortedTransactions
                        .filter(t => t.transactionType === 'charging')
                        .reduce((sum, t) => sum + t.energyConsumed, 0)
                        .toFixed(1)} kWh
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('total_energy')}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(
                        sortedTransactions
                          .filter(t => t.transactionType === 'charging')
                          .reduce((sum, t) => sum + t.duration, 0) / 60
                      )}h
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('total_time')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagination Controls */}
          {!isLoading && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                {language === 'vi' ? 'Trang trước' : 'Previous'}
              </Button>
              <span className="text-sm text-muted-foreground">
                {language === 'vi' ? 'Trang' : 'Page'} {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
              >
                {language === 'vi' ? 'Trang sau' : 'Next'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
