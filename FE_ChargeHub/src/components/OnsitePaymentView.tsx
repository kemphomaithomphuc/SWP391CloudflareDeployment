import { useEffect, useState } from 'react';
import { ArrowLeft, Search, CreditCard, Clock, CheckCircle, AlertCircle, Zap, Car, User, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { toast } from "sonner";
import { Toaster } from './ui/sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import AdminLanguageThemeControls from './AdminLanguageThemeControls';
import { getMyStations, getStationSessions, processOnsitePayment, ChargingStation, ChargingSession } from '../api/onsitePayment';

interface OnsitePaymentViewProps {
  onBack: () => void;
}

const stations = [
  { id: 'all', name: 'All Stations', nameVi: 'Tất cả trạm' },
];

const statusOptions = [
  { id: 'all', name: 'All Status', nameVi: 'Tất cả trạng thái' },
  { id: 'ACTIVE', name: 'Charging', nameVi: 'Đang sạc' },
  { id: 'COMPLETED', name: 'Completed', nameVi: 'Hoàn thành' },
  { id: 'PAID', name: 'Paid', nameVi: 'Đã thanh toán' },
  { id: 'UNPAID', name: 'Unpaid', nameVi: 'Chưa thanh toán' },
];

export default function OnsitePaymentView({ onBack }: OnsitePaymentViewProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStation, setSelectedStation] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSession, setSelectedSession] = useState<ChargingSession | null>(null);
  const [sessionsList, setSessionsList] = useState<ChargingSession[]>([]);
  const [stationsList, setStationsList] = useState<ChargingStation[]>([]);
  const [stationOptions, setStationOptions] = useState<Array<{ id: string; name: string; nameVi: string }>>([
    { id: 'all', name: 'All Stations', nameVi: 'Tất cả trạm' },
  ]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSession, setPaymentSession] = useState<ChargingSession | null>(null);

  const isVietnamese = language === 'vi';

  const translations = {
    title: isVietnamese ? 'Thanh Toán Tại Chỗ' : 'Onsite Payment',
    subtitle: isVietnamese ? 'Quản lý và xử lý thanh toán cho các phiên sạc tại trạm' : 'Manage and process payments for charging sessions at stations',
    searchPlaceholder: isVietnamese ? 'Tìm kiếm phiên sạc...' : 'Search sessions...',
    filterByStation: isVietnamese ? 'Lọc theo trạm' : 'Filter by Station',
    filterByStatus: isVietnamese ? 'Lọc theo trạng thái' : 'Filter by Status',
    stt: isVietnamese ? 'STT' : 'No.',
    sessionId: isVietnamese ? 'Mã phiên' : 'Session ID',
    userName: isVietnamese ? 'Người dùng' : 'User',
    vehicle: isVietnamese ? 'Phương tiện' : 'Vehicle',
    station: isVietnamese ? 'Trạm' : 'Station',
    startTime: isVietnamese ? 'Thời gian bắt đầu' : 'Start Time',
    duration: isVietnamese ? 'Thời lượng' : 'Duration',
    energy: isVietnamese ? 'Năng lượng' : 'Energy',
    cost: isVietnamese ? 'Chi phí' : 'Cost',
    status: isVietnamese ? 'Trạng thái' : 'Status',
    paymentStatus: isVietnamese ? 'Thanh toán' : 'Payment',
    actions: isVietnamese ? 'Thao tác' : 'Actions',
    viewDetails: isVietnamese ? 'Xem chi tiết' : 'View Details',
    processPayment: isVietnamese ? 'Thanh toán' : 'Process Payment',
    sessionDetails: isVietnamese ? 'Chi tiết phiên sạc' : 'Session Details',
    confirmPayment: isVietnamese ? 'Xác nhận thanh toán' : 'Confirm Payment',
    paymentConfirmMessage: isVietnamese
      ? 'Bạn có chắc chắn muốn xử lý thanh toán cho phiên sạc này?'
      : 'Are you sure you want to process payment for this session?',
    back: isVietnamese ? 'Quay lại' : 'Back',
    totalSessions: isVietnamese ? 'Tổng phiên' : 'Total Sessions',
    activeSessions: isVietnamese ? 'Đang sạc' : 'Active Sessions',
    completedSessions: isVietnamese ? 'Hoàn thành' : 'Completed',
    paidSessions: isVietnamese ? 'Đã thanh toán' : 'Paid',
    unpaidSessions: isVietnamese ? 'Chưa thanh toán' : 'Unpaid',
    charging: isVietnamese ? 'Đang sạc' : 'Charging',
    completed: isVietnamese ? 'Hoàn thành' : 'Completed',
    paid: isVietnamese ? 'Đã thanh toán' : 'Paid',
    unpaid: isVietnamese ? 'Chưa thanh toán' : 'Unpaid',
    pending: isVietnamese ? 'Chờ xử lý' : 'Pending',
    processing: isVietnamese ? 'Đang xử lý...' : 'Processing...',
    paymentSuccessful: isVietnamese ? 'Thanh toán thành công' : 'Payment successful',
    paymentFailed: isVietnamese ? 'Thanh toán thất bại' : 'Payment failed',
    noSessionsFound: isVietnamese ? 'Không tìm thấy phiên sạc nào' : 'No sessions found',
    confirm: isVietnamese ? 'Xác nhận' : 'Confirm',
    cancel: isVietnamese ? 'Hủy' : 'Cancel',
  };

  // Filter sessions data
  const filteredSessions = sessionsList.filter(session => {
    const matchesSearch = session.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.sessionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStation = selectedStation === 'all' || session.stationId === selectedStation;
    const matchesStatus = selectedStatus === 'all' ||
                         (selectedStatus === 'ACTIVE' && session.status === 'ACTIVE') ||
                         (selectedStatus === 'COMPLETED' && session.status === 'COMPLETED') ||
                         (selectedStatus === 'PAID' && session.paymentStatus === 'PAID') ||
                         (selectedStatus === 'UNPAID' && session.paymentStatus === 'PENDING');

    return matchesSearch && matchesStation && matchesStatus;
  });

  // Statistics
  const totalSessions = sessionsList.length;
  const activeSessions = sessionsList.filter(s => s.status === 'ACTIVE').length;
  const completedSessions = sessionsList.filter(s => s.status === 'COMPLETED').length;
  const paidSessions = sessionsList.filter(s => s.paymentStatus === 'PAID').length;
  const unpaidSessions = sessionsList.filter(s => s.status === 'COMPLETED' && s.paymentStatus === 'PENDING').length;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return isVietnamese
      ? date.toLocaleString('vi-VN')
      : date.toLocaleString('en-US');
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatEnergy = (energy?: number) => {
    if (!energy) return '--';
    return `${energy.toFixed(2)} kWh`;
  };

  const formatCost = (cost?: number) => {
    if (!cost) return '--';
    return new Intl.NumberFormat(isVietnamese ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: 'VND'
    }).format(cost);
  };

  const getStatusColor = (status: string, paymentStatus: string) => {
    if (status === 'ACTIVE') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (status === 'COMPLETED' && paymentStatus === 'PAID') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (status === 'COMPLETED' && paymentStatus === 'PENDING') return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const getStatusText = (status: string, paymentStatus: string) => {
    if (status === 'ACTIVE') return translations.charging;
    if (status === 'COMPLETED' && paymentStatus === 'PAID') return translations.paid;
    if (status === 'COMPLETED' && paymentStatus === 'PENDING') return translations.unpaid;
    return status;
  };

  const fetchStations = async (): Promise<ChargingStation[] | null> => {
    try {
      return await getMyStations(isVietnamese ? 'vi' : 'en');
    } catch (err: any) {
      toast.error(err.message || translations.paymentFailed);
      return null;
    }
  };

  const fetchSessions = async (stationId?: string): Promise<void> => {
    try {
      let allSessions: ChargingSession[] = [];

      if (stationId && stationId !== 'all') {
        const sessions = await getStationSessions(stationId, isVietnamese ? 'vi' : 'en');
        if (sessions) allSessions = sessions;
      } else {
        // Fetch from all stations
        for (const station of stationsList) {
          const sessions = await getStationSessions(station.stationId, isVietnamese ? 'vi' : 'en');
          if (sessions) allSessions = [...allSessions, ...sessions];
        }
      }

      setSessionsList(allSessions);
    } catch (err: any) {
      toast.error(err.message || (isVietnamese ? 'Lấy danh sách phiên thất bại' : 'Failed to get sessions'));
    }
  };

  const handleProcessPayment = async () => {
    if (!paymentSession) return;

    setProcessingPayment(true);
    try {
      const result = await processOnsitePayment(paymentSession.sessionId, isVietnamese ? 'vi' : 'en');
      if (result) {
        // Update session status
        setSessionsList(prev => prev.map(s =>
          s.sessionId === paymentSession.sessionId
            ? { ...s, paymentStatus: 'PAID' as const }
            : s
        ));
        toast.success(translations.paymentSuccessful);
        setIsPaymentDialogOpen(false);
        setPaymentSession(null);
      }
    } catch (err: any) {
      toast.error(err.message || translations.paymentFailed);
    } finally {
      setProcessingPayment(false);
    }
  };

  const openPaymentDialog = (session: ChargingSession) => {
    setPaymentSession(session);
    setIsPaymentDialogOpen(true);
  };

  useEffect(() => {
    const loadData = async () => {
      const stations = await fetchStations();
      if (stations) {
        setStationsList(stations);
        const opts = stations.map(s => ({
          id: s.stationId,
          name: s.stationName,
          nameVi: s.stationName, // Assuming station names are already in appropriate language
        }));
        setStationOptions([{ id: 'all', name: 'All Stations', nameVi: 'Tất cả trạm' }, ...opts]);

        // Load sessions from all stations initially
        await fetchSessions();
      }
    };

    loadData();
  }, []);

  // Reload sessions when station filter changes
  useEffect(() => {
    if (selectedStation !== 'all' || sessionsList.length === 0) {
      fetchSessions(selectedStation === 'all' ? undefined : selectedStation);
    }
  }, [selectedStation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-red-50/30 dark:to-red-950/20">
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
                {translations.back}
              </Button>
              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 via-green-500/90 to-green-500/70 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30 transform group-hover:scale-110 transition-transform duration-300">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="font-semibold text-foreground">
                    {translations.title}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {translations.subtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Admin Language Theme Controls */}
            <AdminLanguageThemeControls />
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-7xl">
        {/* Main Content */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-800 dark:from-green-400 dark:to-green-600 bg-clip-text text-transparent mb-2">
              {translations.title}
            </h1>
            <p className="text-muted-foreground text-lg">{translations.subtitle}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">{translations.totalSessions}</p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-200">{totalSessions}</p>
                </div>
                <Zap className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{translations.activeSessions}</p>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{activeSessions}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">{translations.completedSessions}</p>
                  <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">{completedSessions}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">{translations.paidSessions}</p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-200">{paidSessions}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">{translations.unpaidSessions}</p>
                  <p className="text-2xl font-bold text-red-800 dark:text-red-200">{unpaidSessions}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-8 border-green-200 dark:border-green-800 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={translations.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-green-200 dark:border-green-800 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={selectedStation} onValueChange={(value: string) => setSelectedStation(value)}>
                  <SelectTrigger className="w-full sm:w-48 border-green-200 dark:border-green-800 focus:ring-green-500">
                    <SelectValue placeholder={translations.filterByStation} />
                  </SelectTrigger>
                  <SelectContent>
                    {stationOptions.map((station) => (
                      <SelectItem key={station.id} value={station.id}>
                        {isVietnamese ? station.nameVi : station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={(value: string) => setSelectedStatus(value)}>
                  <SelectTrigger className="w-full sm:w-48 border-green-200 dark:border-green-800 focus:ring-green-500">
                    <SelectValue placeholder={translations.filterByStatus} />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {isVietnamese ? status.nameVi : status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions Table */}
        <Card className="border-green-200 dark:border-green-800 shadow-lg">
          <CardHeader className="border-b border-green-200 dark:border-green-800">
            <CardTitle className="text-green-800 dark:text-green-200">
              {translations.title} ({filteredSessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-green-200 dark:border-green-800 hover:bg-green-50/50 dark:hover:bg-green-950/20">
                    <TableHead className="text-green-700 dark:text-green-300 w-16">{translations.stt}</TableHead>
                    <TableHead className="text-green-700 dark:text-green-300">{translations.sessionId}</TableHead>
                    <TableHead className="text-green-700 dark:text-green-300">{translations.userName}</TableHead>
                    <TableHead className="text-green-700 dark:text-green-300">{translations.vehicle}</TableHead>
                    <TableHead className="text-green-700 dark:text-green-300">{translations.station}</TableHead>
                    <TableHead className="text-green-700 dark:text-green-300">{translations.startTime}</TableHead>
                    <TableHead className="text-green-700 dark:text-green-300">{translations.duration}</TableHead>
                    <TableHead className="text-green-700 dark:text-green-300">{translations.energy}</TableHead>
                    <TableHead className="text-green-700 dark:text-green-300">{translations.cost}</TableHead>
                    <TableHead className="text-green-700 dark:text-green-300">{translations.status}</TableHead>
                    <TableHead className="text-green-700 dark:text-green-300 text-center">{translations.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session, index) => (
                    <TableRow
                      key={session.sessionId}
                      className="border-green-100 dark:border-green-900 hover:bg-green-50/30 dark:hover:bg-green-950/10"
                    >
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-green-300 text-green-700 dark:border-green-700 dark:text-green-300">
                          {session.sessionId}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={undefined} />
                            <AvatarFallback className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                              {session.userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{session.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{session.vehicleModel}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{session.stationName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatDateTime(session.startTime)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDuration(session.duration)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-muted-foreground" />
                          {formatEnergy(session.energyConsumed)}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCost(session.cost)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getStatusColor(session.status, session.paymentStatus)}
                        >
                          {getStatusText(session.status, session.paymentStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedSession(session)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/30"
                              >
                                <User className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle className="text-green-800 dark:text-green-200">
                                  {translations.sessionDetails}
                                </DialogTitle>
                                <DialogDescription>
                                  {session.sessionId}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedSession && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="font-medium text-muted-foreground">{translations.userName}:</p>
                                      <p>{selectedSession.userName}</p>
                                    </div>
                                    <div>
                                      <p className="font-medium text-muted-foreground">{translations.vehicle}:</p>
                                      <p>{selectedSession.vehicleModel}</p>
                                    </div>
                                    <div className="col-span-2">
                                      <p className="font-medium text-muted-foreground">{translations.station}:</p>
                                      <p>{selectedSession.stationName}</p>
                                    </div>
                                    <div>
                                      <p className="font-medium text-muted-foreground">{translations.startTime}:</p>
                                      <p>{formatDateTime(selectedSession.startTime)}</p>
                                    </div>
                                    <div>
                                      <p className="font-medium text-muted-foreground">{translations.duration}:</p>
                                      <p>{formatDuration(selectedSession.duration)}</p>
                                    </div>
                                    <div>
                                      <p className="font-medium text-muted-foreground">{translations.energy}:</p>
                                      <p>{formatEnergy(selectedSession.energyConsumed)}</p>
                                    </div>
                                    <div>
                                      <p className="font-medium text-muted-foreground">{translations.cost}:</p>
                                      <p className="font-semibold">{formatCost(selectedSession.cost)}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={session.status !== 'COMPLETED' || session.paymentStatus === 'PAID'}
                            onClick={() => openPaymentDialog(session)}
                            className={session.status === 'COMPLETED' && session.paymentStatus !== 'PAID'
                              ? "text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950/30"
                              : "text-muted-foreground"
                            }
                            title={session.status === 'COMPLETED' && session.paymentStatus !== 'PAID'
                              ? translations.processPayment
                              : (session.paymentStatus === 'PAID'
                                ? translations.paid
                                : translations.pending)
                            }
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredSessions.length === 0 && (
              <div className="text-center py-12">
                <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {translations.noSessionsFound}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Confirmation Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-green-800 dark:text-green-200">
                {translations.confirmPayment}
              </DialogTitle>
              <DialogDescription>
                {translations.paymentConfirmMessage}
              </DialogDescription>
            </DialogHeader>
            {paymentSession && (
              <div className="py-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={undefined} />
                    <AvatarFallback className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      {paymentSession.userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{paymentSession.userName}</h4>
                    <p className="text-sm text-muted-foreground">{paymentSession.sessionId}</p>
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatCost(paymentSession.cost)}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)} disabled={processingPayment}>
                {translations.cancel}
              </Button>
              <Button
                onClick={handleProcessPayment}
                disabled={processingPayment || !paymentSession}
                className="bg-green-600 hover:bg-green-700"
              >
                {processingPayment ? translations.processing : translations.confirm}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Toaster />
    </div>
  );
}
