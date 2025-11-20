import { useState, useEffect } from 'react';
import type { JSX } from 'react';
import { ArrowLeft, Download, BarChart3, Calendar, Building2, TrendingUp, Users, Zap, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import AdminLanguageThemeControls from './AdminLanguageThemeControls';
import { getRevenueData, RevenueData, RevenueFilters, exportRevenueToExcel, exportRevenueToPDF, ExportRevenueFilters, getAllChargingStations, ChargingStationDTO, RevenueAPIResponse } from '../services/api';
import { toast } from 'sonner';

interface StationOption {
  id: string;
  name: string;
  nameVi: string;
  stationId?: number;
}

const timeRangeData = [
  { id: 'week', name: 'Last 7 days', nameVi: '7 ngày qua' },
  { id: 'month', name: 'Last 30 days', nameVi: '30 ngày qua' },
  { id: 'quarter', name: 'Last 3 months', nameVi: '3 tháng qua' },
  { id: 'year', name: 'Last 12 months', nameVi: '12 tháng qua' },
];

interface RevenueViewProps {
  onBack: () => void;
}

export default function RevenueView({ onBack }: RevenueViewProps): JSX.Element {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [selectedStation, setSelectedStation] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('month');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [avgRevenuePerSession, setAvgRevenuePerSession] = useState(0);
  const [stationData, setStationData] = useState<StationOption[]>([
    { id: 'all', name: 'All Stations', nameVi: 'Tất cả trạm' }
  ]);

  const isVietnamese = language === 'vi';

  // Fetch stations from API
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await getAllChargingStations();
        if (response && response.length > 0) {
          const stations: StationOption[] = [
            { id: 'all', name: 'All Stations', nameVi: 'Tất cả trạm' },
            ...response.map((station: ChargingStationDTO) => ({
              id: `station-${station.stationId}`,
              name: station.stationName || `Station ${station.stationId}`,
              nameVi: station.stationName || `Trạm ${station.stationId}`,
              stationId: station.stationId,
            }))
          ];
          setStationData(stations);
        }
      } catch (error) {
        console.error('Error fetching stations:', error);
        // Keep default station data on error
      }
    };

    fetchStations();
  }, []);

  // Generate mock revenue data
  const generateMockData = () => {
    const data = [];
    const daysCount = selectedTimeRange === 'week' ? 7 : selectedTimeRange === 'month' ? 30 : selectedTimeRange === 'quarter' ? 90 : 365;

    for (let i = daysCount - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Generate random but realistic data
      const baseRevenue = 500 + Math.random() * 1500;
      const baseSessions = 10 + Math.random() * 40;
      const baseUsers = 5 + Math.random() * 20;

      // Add some variation based on day of week (weekends higher)
      const dayOfWeek = date.getDay();
      const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.3 : 1;

      const revenue = Math.round(baseRevenue * weekendMultiplier);
      const sessions = Math.round(baseSessions * weekendMultiplier);
      const users = Math.round(baseUsers * weekendMultiplier);

      // Format date for display
      const displayDate = date.toLocaleDateString(isVietnamese ? 'vi-VN' : 'en-US', {
        month: 'short',
        day: 'numeric'
      });

      data.push({
        month: displayDate,
        date: date.toISOString().split('T')[0],
        revenue: revenue,
        sessions: sessions,
        users: users,
      });
    }

    return data;
  };

  // Fetch revenue data when filters change
  useEffect(() => {
    const fetchRevenueData = async () => {
      setIsLoading(true);
      try {
        // Calculate date range based on selectedTimeRange
        const getDateRange = () => {
          const toDate = new Date();
          const fromDate = new Date();
          
          switch (selectedTimeRange) {
            case 'week':
              fromDate.setDate(toDate.getDate() - 7);
              break;
            case 'month':
              fromDate.setMonth(toDate.getMonth() - 1);
              fromDate.setDate(toDate.getDate());
              break;
            case 'quarter':
              fromDate.setMonth(toDate.getMonth() - 3);
              fromDate.setDate(toDate.getDate());
              break;
            case 'year':
              fromDate.setFullYear(toDate.getFullYear() - 1);
              fromDate.setMonth(toDate.getMonth());
              fromDate.setDate(toDate.getDate());
              break;
            default:
              fromDate.setMonth(toDate.getMonth() - 1);
              fromDate.setDate(toDate.getDate());
          }
          
          // Set time to start of day for fromDate and end of day for toDate
          fromDate.setHours(0, 0, 0, 0);
          toDate.setHours(23, 59, 59, 999);
          
          return {
            fromDate: fromDate.toISOString().split('.')[0], // Format: YYYY-MM-DDTHH:mm:ss
            toDate: toDate.toISOString().split('.')[0], // Format: YYYY-MM-DDTHH:mm:ss
          };
        };
        
        const { fromDate, toDate } = getDateRange();
        
        const filters: RevenueFilters = {};
        // Old format for backward compatibility
        if (selectedStation !== 'all') {
          filters.station = selectedStation;
        }
        filters.timeRange = selectedTimeRange;

        // New format with date range and stationId
        if (fromDate) filters.fromDate = fromDate;
        if (toDate) filters.toDate = toDate;
        if (selectedStation !== 'all') {
          // Find stationId from stationData
          const selectedStationData = stationData.find(s => s.id === selectedStation);
          if (selectedStationData?.stationId) {
            filters.stationId = selectedStationData.stationId;
          } else {
            // Fallback: try to parse from id format "station-{id}"
            const stationIdMatch = selectedStation.match(/\d+/);
            if (stationIdMatch) {
              filters.stationId = parseInt(stationIdMatch[0]);
            }
          }
        }
        filters.groupBy = 'day'; // Default group by day
        
        console.log('Fetching revenue with filters:', filters);
        
        const response: RevenueAPIResponse = await getRevenueData(filters);
        
        // Process chart data from API response
        const chartData = response.data?.chartData || [];
        
        // Process and normalize data format for display
        const processedData = chartData.map((item: any) => {
          // Normalize date/month field for chart display
          let displayDate = item.period || item.date || '';
          
          // Format date string if needed
          if (displayDate) {
            try {
              // Try parsing ISO datetime string or date string
              if (displayDate.includes('T') || displayDate.match(/^\d{4}-\d{2}-\d{2}/)) {
                const date = new Date(displayDate);
                if (!isNaN(date.getTime())) {
                  // Format based on groupBy
                  if (filters.groupBy === 'day' || filters.groupBy === 'date') {
                    displayDate = date.toLocaleDateString(isVietnamese ? 'vi-VN' : 'en-US', {
                      month: 'short',
                      day: 'numeric'
                    });
                  } else if (filters.groupBy === 'week') {
                    displayDate = `Week ${Math.ceil(date.getDate() / 7)}`;
                  } else if (filters.groupBy === 'month') {
                    displayDate = date.toLocaleDateString(isVietnamese ? 'vi-VN' : 'en-US', {
                      month: 'short',
                      year: 'numeric'
                    });
                  } else {
                    displayDate = date.toLocaleDateString(isVietnamese ? 'vi-VN' : 'en-US', {
                      month: 'short',
                      day: 'numeric'
                    });
                  }
                }
              }
            } catch (e) {
              // Keep original value if parsing fails
              console.warn('Failed to parse date:', displayDate, e);
            }
          }
          
          return {
            month: displayDate, // Use 'month' as standard key for chart
            date: item.date || item.period,
            revenue: Number(item.revenue || 0),
            sessions: Number(item.transactionCount || 0),
            users: 0, // Not provided per period in API
          };
        });
        
        setRevenueData(processedData);
        
        // Set summary statistics from API response
        const summary = response.data?.summary;
        if (summary) {
          setTotalRevenue(Number(summary.totalRevenue || 0));
          setTotalSessions(Number(summary.totalTransactions || 0));
          setTotalUsers(Number(summary.successfulTransactions || 0)); // Using successfulTransactions as proxy
          setAvgRevenuePerSession(Number(summary.averageTransactionAmount || 0));
        } else {
          // Fallback: calculate from chart data
          const totalRevenue = processedData.reduce((sum: number, item: any) => sum + (item.revenue || 0), 0);
          const totalSessions = processedData.reduce((sum: number, item: any) => sum + (item.sessions || 0), 0);
          setTotalRevenue(totalRevenue);
          setTotalSessions(totalSessions);
          setTotalUsers(0);
          setAvgRevenuePerSession(totalSessions > 0 ? totalRevenue / totalSessions : 0);
        }
        
      } catch (error: any) {
        console.error('Error fetching revenue data:', error);
        toast.error(
          isVietnamese 
            ? 'Không thể tải dữ liệu doanh thu. Vui lòng thử lại sau.' 
            : 'Failed to load revenue data. Please try again later.'
        );
        // Set empty data on error
        setRevenueData([]);
        setTotalRevenue(0);
        setTotalSessions(0);
        setTotalUsers(0);
        setAvgRevenuePerSession(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRevenueData();
  }, [selectedStation, selectedTimeRange, isVietnamese, stationData]);

  const translations = {
    title: isVietnamese ? 'Doanh Thu' : 'Revenue',
    subtitle: isVietnamese ? 'Phân tích doanh thu và hiệu suất trạm sạc' : 'Revenue analytics and charging station performance',
    chooseStation: isVietnamese ? 'Chọn Trạm' : 'Choose Station',
    chooseTimeRange: isVietnamese ? 'Chọn Khoảng thời gian' : 'Choose Range Time',
    chart: isVietnamese ? 'Biểu đồ' : 'Chart',
    export: isVietnamese ? 'Xuất dữ liệu' : 'Export',
    exportInfo: isVietnamese ? 'Thông tin xuất' : 'Export Information',
    totalRevenue: isVietnamese ? 'Tổng doanh thu' : 'Total Revenue',
    totalSessions: isVietnamese ? 'Tổng phiên sạc' : 'Total Sessions',
    uniqueUsers: isVietnamese ? 'Người dùng duy nhất' : 'Unique Users',
    avgRevenue: isVietnamese ? 'Doanh thu TB/phiên' : 'Avg Revenue/Session',
    stationName: isVietnamese ? 'Tên trạm/khu vực' : 'Station/region name',
    revenueAmount: isVietnamese ? 'Số tiền doanh thu' : 'Revenue amount',
    numSessions: isVietnamese ? 'Số phiên sạc' : 'Number of charging sessions',
    numUsers: isVietnamese ? 'Số người dùng duy nhất' : 'Number of unique users/customers',
    exportTime: isVietnamese ? 'Thời gian xuất' : 'Timestamp of export',
    back: isVietnamese ? 'Quay lại trang chính' : 'Back to Dashboard',
    barChart: isVietnamese ? 'Biểu đồ cột' : 'Bar Chart',
    lineChart: isVietnamese ? 'Biểu đồ đường' : 'Line Chart',
    areaChart: isVietnamese ? 'Biểu đồ vùng' : 'Area Chart',
  };


  // Helper function to get date range
  const getDateRange = () => {
    const toDate = new Date();
    const fromDate = new Date();
    
    switch (selectedTimeRange) {
      case 'week':
        fromDate.setDate(toDate.getDate() - 7);
        break;
      case 'month':
        fromDate.setMonth(toDate.getMonth() - 1);
        break;
      case 'quarter':
        fromDate.setMonth(toDate.getMonth() - 3);
        break;
      case 'year':
        fromDate.setFullYear(toDate.getFullYear() - 1);
        break;
      default:
        fromDate.setMonth(toDate.getMonth() - 1);
    }
    
    // Set time to start of day for fromDate and end of day for toDate
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
    
    return {
      fromDate: fromDate.toISOString().split('.')[0], // Format: YYYY-MM-DDTHH:mm:ss
      toDate: toDate.toISOString().split('.')[0], // Format: YYYY-MM-DDTHH:mm:ss
    };
  };

  // Helper function to download file
  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExportExcel = async () => {
    try {
      setIsLoading(true);
      
      const { fromDate, toDate } = getDateRange();
      
      const filters: ExportRevenueFilters = {};
      if (fromDate) filters.fromDate = fromDate;
      if (toDate) filters.toDate = toDate;
      if (selectedStation !== 'all') {
        filters.stationId = parseInt(selectedStation.replace('station-', ''));
      }
      filters.groupBy = 'day'; // Default group by day

      console.log('Exporting to Excel with filters:', filters);
      
      const blob = await exportRevenueToExcel(filters);
      
      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      downloadFile(blob, `revenue-export-${currentDate}.xlsx`);
      
      toast.success(
        isVietnamese 
          ? 'Xuất dữ liệu Excel thành công!' 
          : 'Excel export successful!'
      );
    } catch (error: any) {
      console.error('Error exporting revenue to Excel:', error);
      toast.error(
        isVietnamese 
          ? 'Không thể xuất dữ liệu Excel. Vui lòng thử lại sau.' 
          : 'Failed to export Excel. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsLoading(true);
      
      const { fromDate, toDate } = getDateRange();
      
      const filters: ExportRevenueFilters = {};
      if (fromDate) filters.fromDate = fromDate;
      if (toDate) filters.toDate = toDate;
      if (selectedStation !== 'all') {
        filters.stationId = parseInt(selectedStation.replace('station-', ''));
      }
      filters.groupBy = 'day'; // Default group by day

      console.log('Exporting to PDF with filters:', filters);
      
      const blob = await exportRevenueToPDF(filters);
      
      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      downloadFile(blob, `revenue-export-${currentDate}.pdf`);
      
      toast.success(
        isVietnamese 
          ? 'Xuất dữ liệu PDF thành công!' 
          : 'PDF export successful!'
      );
    } catch (error: any) {
      console.error('Error exporting revenue to PDF:', error);
      toast.error(
        isVietnamese 
          ? 'Không thể xuất dữ liệu PDF. Vui lòng thử lại sau.' 
          : 'Failed to export PDF. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderChart = () => {
    const commonProps = {
      width: '100%',
      height: 350,
      data: revenueData,
      margin: { top: 10, right: 30, left: 20, bottom: 70 },
    };

    // Custom tooltip formatter
    const customTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
            <p className="font-semibold mb-2">{label}</p>
            <div className="space-y-1 text-sm">
              <p className="text-sky-600 dark:text-emerald-400">
                {translations.totalRevenue}: <span className="font-bold">${data.revenue?.toLocaleString() || 0}</span>
              </p>
              <p className="text-emerald-600 dark:text-emerald-400">
                {translations.totalSessions}: <span className="font-bold">{data.sessions?.toLocaleString() || 0}</span>
              </p>
              {data.users !== undefined && (
                <p className="text-sky-500 dark:text-emerald-300">
                  {translations.uniqueUsers}: <span className="font-bold">{data.users?.toLocaleString() || 0}</span>
                </p>
              )}
            </div>
          </div>
        );
      }
      return null;
    };

    // Format Y-axis for revenue (currency)
    const formatYAxis = (value: number) => {
      if (value >= 1000) {
        return `$${(value / 1000).toFixed(1)}k`;
      }
      return `$${value}`;
    };

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1f2937' : '#d0f0f4'} />
              <XAxis 
                dataKey="month" 
                stroke={theme === 'dark' ? '#e0f2fe' : '#0f172a'}
                angle={-45}
                textAnchor="end"
                height={80}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke={theme === 'dark' ? '#e0f2fe' : '#0f172a'}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={customTooltip} />
              <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={3} dot={{ fill: '#34d399', strokeWidth: 2, r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1f2937' : '#d0f0f4'} />
              <XAxis 
                dataKey="month" 
                stroke={theme === 'dark' ? '#e0f2fe' : '#0f172a'}
                angle={-45}
                textAnchor="end"
                height={80}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke={theme === 'dark' ? '#e0f2fe' : '#0f172a'}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={customTooltip} />
              <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" fill="url(#revenueGradient)" strokeWidth={2} />
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0.15} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1f2937' : '#d0f0f4'} />
              <XAxis 
                dataKey="month" 
                stroke={theme === 'dark' ? '#e0f2fe' : '#0f172a'}
                angle={-45}
                textAnchor="end"
                height={80}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke={theme === 'dark' ? '#e0f2fe' : '#0f172a'}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={customTooltip} />
              <Bar dataKey="revenue" fill="#38bdf8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-sky-50/40 dark:to-emerald-950/20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-muted-foreground hover:text-foreground touch-manipulation min-h-[44px] px-2 sm:px-3"
              >
                <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="hidden sm:inline text-xs sm:text-sm">{translations.back}</span>
                <span className="sm:hidden text-xs">Back</span>
              </Button>
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="relative group flex-shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-sky-400 via-sky-400/90 to-emerald-400/70 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-sky-400/30 transform group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-50" />
                  </div>
                </div>
                <div className="min-w-0">
                  <h1 className="font-semibold text-foreground text-sm sm:text-base md:text-lg truncate">
                    {translations.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
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

      <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-7xl">
        {/* Filters */}
        <Card className="mb-8 border-sky-200 dark:border-emerald-800 shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-sky-700 dark:text-emerald-300 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {translations.chooseStation}
                </label>
                <Select value={selectedStation} onValueChange={setSelectedStation}>
                  <SelectTrigger className="border-sky-200 dark:border-emerald-800 focus:ring-sky-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stationData.map((station) => (
                      <SelectItem key={station.id} value={station.id}>
                        {isVietnamese ? station.nameVi : station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-sky-700 dark:text-emerald-300 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {translations.chooseTimeRange}
                </label>
                <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                  <SelectTrigger className="border-sky-200 dark:border-emerald-800 focus:ring-sky-500 h-10 sm:h-11 text-sm sm:text-base touch-manipulation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeRangeData.map((range) => (
                      <SelectItem key={range.id} value={range.id}>
                        {isVietnamese ? range.nameVi : range.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-red-700 dark:text-red-300 truncate">{translations.totalRevenue}</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-800 dark:text-red-200 truncate">${totalRevenue.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 dark:text-red-400 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">{translations.totalSessions}</p>
                  <p className="text-2xl font-bold text-red-800 dark:text-red-200">{totalSessions.toLocaleString()}</p>
                </div>
                <Zap className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">{translations.uniqueUsers}</p>
                  <p className="text-2xl font-bold text-red-800 dark:text-red-200">{totalUsers.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">{translations.avgRevenue}</p>
                  <p className="text-2xl font-bold text-red-800 dark:text-red-200">${Math.round(avgRevenuePerSession)}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart Section */}
        <Card className="mb-8 border-red-200 dark:border-red-800 shadow-lg">
          <CardHeader className="border-b border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-red-800 dark:text-red-200 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {translations.chart}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={chartType === 'bar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('bar')}
                  className={`touch-manipulation min-h-[36px] text-xs sm:text-sm px-2 sm:px-3 ${chartType === 'bar' ? 'bg-red-600 hover:bg-red-700' : 'border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30'}`}
                >
                  {translations.barChart}
                </Button>
                <Button
                  variant={chartType === 'line' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('line')}
                  className={`touch-manipulation min-h-[36px] text-xs sm:text-sm px-2 sm:px-3 ${chartType === 'line' ? 'bg-red-600 hover:bg-red-700' : 'border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30'}`}
                >
                  {translations.lineChart}
                </Button>
                <Button
                  variant={chartType === 'area' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('area')}
                  className={`touch-manipulation min-h-[36px] text-xs sm:text-sm px-2 sm:px-3 ${chartType === 'area' ? 'bg-red-600 hover:bg-red-700' : 'border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30'}`}
                >
                  {translations.areaChart}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 md:p-6">
            <div className="h-[300px] sm:h-[350px] md:h-[400px] w-full">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">
                      {isVietnamese ? 'Đang tải dữ liệu...' : 'Loading data...'}
                    </p>
                  </div>
                </div>
              ) : revenueData.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    {isVietnamese ? 'Không có dữ liệu' : 'No data available'}
                  </p>
                </div>
              ) : (
                renderChart()
              )}
            </div>
          </CardContent>
        </Card>

        {/* Export Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          <Card className="border-red-200 dark:border-red-800 shadow-lg">
            <CardHeader className="border-b border-red-200 dark:border-red-800">
              <CardTitle className="text-red-800 dark:text-red-200 flex items-center gap-2">
                <Download className="h-5 w-5" />
                {translations.export}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={handleExportExcel}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    {isVietnamese ? 'Xuất Excel' : 'Export Excel'}
                  </Button>
                  <Button
                    onClick={handleExportPDF}
                    disabled={isLoading}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    {isVietnamese ? 'Xuất PDF' : 'Export PDF'}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isVietnamese 
                    ? 'Xuất dữ liệu doanh thu dưới định dạng Excel hoặc PDF' 
                    : 'Export revenue data in Excel or PDF format'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800 shadow-lg">
            <CardHeader className="border-b border-red-200 dark:border-red-800">
              <CardTitle className="text-red-800 dark:text-red-200 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {translations.exportInfo}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-red-100 dark:border-red-900 pb-2">
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">{translations.stationName}:</span>
                  <Badge variant="outline" className="border-red-300 text-red-700 dark:border-red-700 dark:text-red-300">
                    {isVietnamese 
                      ? stationData.find(s => s.id === selectedStation)?.nameVi 
                      : stationData.find(s => s.id === selectedStation)?.name
                    }
                  </Badge>
                </div>
                <div className="flex items-center justify-between border-b border-red-100 dark:border-red-900 pb-2">
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">{translations.revenueAmount}:</span>
                  <span className="font-semibold text-red-800 dark:text-red-200">${totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-b border-red-100 dark:border-red-900 pb-2">
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">{translations.numSessions}:</span>
                  <span className="font-semibold text-red-800 dark:text-red-200">{totalSessions.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-b border-red-100 dark:border-red-900 pb-2">
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">{translations.numUsers}:</span>
                  <span className="font-semibold text-red-800 dark:text-red-200">{totalUsers.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">{translations.exportTime}:</span>
                  <span className="font-semibold text-red-800 dark:text-red-200">{new Date().toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}