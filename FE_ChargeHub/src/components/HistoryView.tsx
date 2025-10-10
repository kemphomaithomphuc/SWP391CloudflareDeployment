import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { 
  ArrowLeft,
  Search,
  Calendar,
  MapPin,
  Zap,
  Clock,
  DollarSign,
  Filter,
  Receipt,
  Star,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp
} from "lucide-react";

interface BookingHistory {
  id: string;
  stationName: string;
  stationAddress: string;
  date: string;
  time: string;
  duration: string;
  energyDelivered: string;
  totalCost: string;
  pricePerKwh: string;
  status: "Completed" | "Cancelled" | "In Progress";
  chargerType: string;
  paymentMethod: string;
  receipt: string;
  rating?: number;
  notes?: string;
}

interface HistoryViewProps {
  onBack: () => void;
}

export default function HistoryView({ onBack }: HistoryViewProps) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all-status");
  const [timeFilter, setTimeFilter] = useState("all-time");


  // Mock booking history data
  const bookingHistory: BookingHistory[] = [
    {
      id: "BK001",
      stationName: "ChargeHub Station Alpha",
      stationAddress: "123 Nguyen Hue, District 1, Ho Chi Minh City",
      date: "2024-01-15",
      time: "14:30",
      duration: "2h 15m",
      energyDelivered: "45.2 kWh",
      totalCost: "158,200 VND",
      pricePerKwh: "3,500 VND",
      status: "Completed",
      chargerType: "CCS",
      paymentMethod: "Credit Card",
      receipt: "RC-20240115-001",
      rating: 5,
      notes: "Fast charging, clean station"
    },
    {
      id: "BK002",
      stationName: "ChargeHub Station Beta",
      stationAddress: "456 Le Loi, District 3, Ho Chi Minh City",
      date: "2024-01-12",
      time: "09:45",
      duration: "1h 30m",
      energyDelivered: "28.7 kWh",
      totalCost: "91,840 VND",
      pricePerKwh: "3,200 VND",
      status: "Completed",
      chargerType: "Type 2",
      paymentMethod: "Digital Wallet",
      receipt: "RC-20240112-002",
      rating: 4,
      notes: "Good location, slightly slow"
    },
    {
      id: "BK003",
      stationName: "ChargeHub Station Gamma",
      stationAddress: "789 Dong Khoi, District 1, Ho Chi Minh City",
      date: "2024-01-10",
      time: "18:20",
      duration: "0h 45m",
      energyDelivered: "0 kWh",
      totalCost: "0 VND",
      pricePerKwh: "3,800 VND",
      status: "Cancelled",
      chargerType: "Type 2",
      paymentMethod: "Credit Card",
      receipt: "RC-20240110-003",
      notes: "Station malfunction"
    },
    {
      id: "BK004",
      stationName: "ChargeHub Station Delta",
      stationAddress: "321 Vo Van Tan, District 3, Ho Chi Minh City",
      date: "2024-01-08",
      time: "11:15",
      duration: "3h 10m",
      energyDelivered: "52.8 kWh",
      totalCost: "174,240 VND",
      pricePerKwh: "3,300 VND",
      status: "Completed",
      chargerType: "CHAdeMO",
      paymentMethod: "Credit Card",
      receipt: "RC-20240108-004",
      rating: 5,
      notes: "Excellent service, shopping nearby"
    },
    {
      id: "BK005",
      stationName: "ChargeHub Station Echo",
      stationAddress: "654 Hai Ba Trung, District 1, Ho Chi Minh City",
      date: "2024-01-05",
      time: "16:00",
      duration: "1h 45m",
      energyDelivered: "32.1 kWh",
      totalCost: "115,560 VND",
      pricePerKwh: "3,600 VND",
      status: "Completed",
      chargerType: "CCS",
      paymentMethod: "Digital Wallet",
      receipt: "RC-20240105-005",
      rating: 4,
      notes: "Convenient location"
    },
    {
      id: "BK006",
      stationName: "ChargeHub Station Alpha",
      stationAddress: "123 Nguyen Hue, District 1, Ho Chi Minh City",
      date: "2024-01-03",
      time: "13:30",
      duration: "Ongoing",
      energyDelivered: "15.2 kWh",
      totalCost: "53,200 VND",
      pricePerKwh: "3,500 VND",
      status: "In Progress",
      chargerType: "CCS",
      paymentMethod: "Credit Card",
      receipt: "RC-20240103-006",
      notes: "Currently charging"
    }
  ];

  // Filter bookings based on search and filters
  const filteredBookings = bookingHistory.filter(booking => {
    const matchesSearch = booking.stationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         booking.stationAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         booking.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all-status" || booking.status.toLowerCase() === statusFilter;
    
    const matchesTime = timeFilter === "all-time" || 
                       (timeFilter === "this-month" && new Date(booking.date).getMonth() === new Date().getMonth()) ||
                       (timeFilter === "last-month" && new Date(booking.date).getMonth() === new Date().getMonth() - 1) ||
                       (timeFilter === "this-year" && new Date(booking.date).getFullYear() === new Date().getFullYear());
    
    return matchesSearch && matchesStatus && matchesTime;
  });

  // Calculate statistics
  const completedBookings = bookingHistory.filter(b => b.status === "Completed");
  const totalSpent = completedBookings.reduce((sum, booking) => {
    const cost = parseFloat(booking.totalCost.replace(/[^0-9]/g, ''));
    return sum + cost;
  }, 0);
  const totalEnergy = completedBookings.reduce((sum, booking) => {
    const energy = parseFloat(booking.energyDelivered.replace(/[^0-9.]/g, ''));
    return sum + energy;
  }, 0);
  const averageRating = completedBookings
    .filter(b => b.rating)
    .reduce((sum, booking) => sum + (booking.rating || 0), 0) / 
    completedBookings.filter(b => b.rating).length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "Cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "In Progress":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "In Progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
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
                {language === 'en' ? 'Back to Dashboard' : 'Về Dashboard'}
              </Button>
              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 transform group-hover:scale-110 transition-transform duration-300">
                    <Receipt className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h1 className="font-semibold text-foreground">
                    {language === 'en' ? 'Booking History' : 'Lịch Sử Đặt Chỗ'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'View your charging sessions' : 'Xem các phiên sạc của bạn'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/80 backdrop-blur-sm border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Total Sessions' : 'Tổng Phiên'}
                  </p>
                  <p className="text-2xl font-bold text-foreground">{bookingHistory.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Total Spent' : 'Tổng Chi Tiêu'}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {totalSpent.toLocaleString('vi-VN')} VND
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Total Energy' : 'Tổng Năng Lượng'}
                  </p>
                  <p className="text-2xl font-bold text-foreground">{totalEnergy.toFixed(1)} kWh</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Avg Rating' : 'Đánh Giá TB'}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {averageRating ? averageRating.toFixed(1) : 'N/A'}
                  </p>
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
                  placeholder={language === 'en' ? "Search by station name, address, or booking ID..." : "Tìm theo tên trạm, địa chỉ, hoặc mã đặt chỗ..."}
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
                  <SelectItem value="all-status">
                    {language === 'en' ? 'All Status' : 'Tất Cả Trạng Thái'}
                  </SelectItem>
                  <SelectItem value="completed">
                    {language === 'en' ? 'Completed' : 'Hoàn Thành'}
                  </SelectItem>
                  <SelectItem value="cancelled">
                    {language === 'en' ? 'Cancelled' : 'Đã Hủy'}
                  </SelectItem>
                  <SelectItem value="in progress">
                    {language === 'en' ? 'In Progress' : 'Đang Tiến Hành'}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-48 bg-input-background border-border/60 rounded-xl">
                  <SelectValue placeholder="Filter by time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-time">
                    {language === 'en' ? 'All Time' : 'Tất Cả'}
                  </SelectItem>
                  <SelectItem value="this-month">
                    {language === 'en' ? 'This Month' : 'Tháng Này'}
                  </SelectItem>
                  <SelectItem value="last-month">
                    {language === 'en' ? 'Last Month' : 'Tháng Trước'}
                  </SelectItem>
                  <SelectItem value="this-year">
                    {language === 'en' ? 'This Year' : 'Năm Này'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Booking History List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground">
              {language === 'en' 
                ? `Showing ${filteredBookings.length} results` 
                : `Hiển thị ${filteredBookings.length} kết quả`}
            </h3>
            {filteredBookings.length > 0 && (
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                {language === 'en' ? 'Export' : 'Xuất'}
              </Button>
            )}
          </div>

          {filteredBookings.length === 0 ? (
            <Card className="bg-card/80 backdrop-blur-sm border-border/60">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground mb-2">
                  {language === 'en' ? 'No bookings found' : 'Không tìm thấy đặt chỗ nào'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' 
                    ? 'Try adjusting your search or filters.' 
                    : 'Thử điều chỉnh tìm kiếm hoặc bộ lọc.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredBookings.map((booking) => (
              <Card 
                key={booking.id}
                className="bg-card/80 backdrop-blur-sm border-border/60 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-foreground">{booking.stationName}</h4>
                        <Badge className={`text-xs ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          <span className="ml-1">
                            {language === 'en' ? booking.status : 
                             booking.status === 'Completed' ? 'Hoàn Thành' :
                             booking.status === 'Cancelled' ? 'Đã Hủy' : 'Đang Tiến Hành'}
                          </span>
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{booking.stationAddress}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(booking.date)} at {booking.time}</span>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-lg font-semibold text-primary">
                        {booking.totalCost}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {booking.id}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{language === 'en' ? 'Duration' : 'Thời Gian'}</p>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{booking.duration}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{language === 'en' ? 'Energy' : 'Năng Lượng'}</p>
                      <div className="flex items-center space-x-1">
                        <Zap className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{booking.energyDelivered}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{language === 'en' ? 'Charger' : 'Sạc'}</p>
                      <span className="text-sm font-medium">{booking.chargerType}</span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{language === 'en' ? 'Payment' : 'Thanh Toán'}</p>
                      <span className="text-sm font-medium">{booking.paymentMethod === 'Credit Card' 
                          ? (language === 'en' ? 'Credit Card' : 'Thẻ Tín Dụng')
                          : booking.paymentMethod === 'Digital Wallet'
                          ? (language === 'en' ? 'Digital Wallet' : 'Ví Điện Tử')
                          : booking.paymentMethod}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {booking.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{booking.rating}</span>
                        </div>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {booking.pricePerKwh}/kWh
                      </span>
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
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>
                            {language === 'en' ? 'Booking Details' : 'Chi Tiết Đặt Chỗ'}
                          </DialogTitle>
                          <DialogDescription>
                            {language === 'en' ? 'Complete information about your charging session' : 'Thông tin đầy đủ về phiên sạc của bạn'}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                {language === 'en' ? 'Booking ID:' : 'Mã Đặt Chỗ:'}
                              </span>
                              <span className="font-medium">{booking.id}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                {language === 'en' ? 'Receipt:' : 'Hóa Đơn:'}
                              </span>
                              <span className="font-medium">{booking.receipt}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                {language === 'en' ? 'Station:' : 'Trạm Sạc:'}
                              </span>
                              <span className="font-medium">{booking.stationName}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                {language === 'en' ? 'Date & Time:' : 'Ngày & Giờ:'}
                              </span>
                              <span className="font-medium">
                                {formatDate(booking.date)} {booking.time}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                {language === 'en' ? 'Duration:' : 'Thời Gian:'}
                              </span>
                              <span className="font-medium">{booking.duration}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                {language === 'en' ? 'Energy:' : 'Năng Lượng:'}
                              </span>
                              <span className="font-medium">{booking.energyDelivered}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                {language === 'en' ? 'Total Cost:' : 'Tổng Chi Phí:'}
                              </span>
                              <span className="font-medium text-primary">{booking.totalCost}</span>
                            </div>
                          </div>
                          
                          {booking.notes && (
                            <div className="bg-muted/30 rounded-lg p-3">
                              <p className="text-sm text-muted-foreground mb-1">
                                {language === 'en' ? 'Notes:' : 'Ghi Chú:'}
                              </p>
                              <p className="text-sm">{booking.notes}</p>
                            </div>
                          )}
                          
                          <div className="flex space-x-2">
                            <Button variant="outline" className="flex-1">
                              <Download className="w-4 h-4 mr-2" />
                              {language === 'en' ? 'Download Receipt' : 'Tải Hóa Đơn'}
                            </Button>
                            <Button className="flex-1">
                              <Receipt className="w-4 h-4 mr-2" />
                              {language === 'en' ? 'View Receipt' : 'Xem Hóa Đơn'}
                            </Button>
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