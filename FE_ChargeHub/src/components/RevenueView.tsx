import { useState } from 'react';
import { ArrowLeft, Download, BarChart3, Calendar, MapPin, Building2, TrendingUp, Users, Zap, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import AdminLanguageThemeControls from './AdminLanguageThemeControls';

// Mock data for revenue analytics
const revenueData = [
  { month: 'Jan', revenue: 45000, sessions: 1250, users: 890 },
  { month: 'Feb', revenue: 52000, sessions: 1380, users: 945 },
  { month: 'Mar', revenue: 48000, sessions: 1290, users: 920 },
  { month: 'Apr', revenue: 61000, sessions: 1520, users: 1080 },
  { month: 'May', revenue: 55000, sessions: 1410, users: 1020 },
  { month: 'Jun', revenue: 67000, sessions: 1680, users: 1180 },
];

const regionData = [
  { id: 'all', name: 'All Regions', nameVi: 'Tất cả khu vực' },
  { id: 'north', name: 'Northern Region', nameVi: 'Miền Bắc' },
  { id: 'central', name: 'Central Region', nameVi: 'Miền Trung' },
  { id: 'south', name: 'Southern Region', nameVi: 'Miền Nam' },
];

const stationData = [
  { id: 'all', name: 'All Stations', nameVi: 'Tất cả trạm' },
  { id: 'station-1', name: 'ChargeHub Center', nameVi: 'ChargeHub Trung tâm' },
  { id: 'station-2', name: 'ChargeHub Mall', nameVi: 'ChargeHub TTTM' },
  { id: 'station-3', name: 'ChargeHub Airport', nameVi: 'ChargeHub Sân bay' },
];

const timeRangeData = [
  { id: 'week', name: 'Last 7 days', nameVi: '7 ngày qua' },
  { id: 'month', name: 'Last 30 days', nameVi: '30 ngày qua' },
  { id: 'quarter', name: 'Last 3 months', nameVi: '3 tháng qua' },
  { id: 'year', name: 'Last 12 months', nameVi: '12 tháng qua' },
];

interface RevenueViewProps {
  onBack: () => void;
}

export default function RevenueView({ onBack }: RevenueViewProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedStation, setSelectedStation] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('month');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');

  const isVietnamese = language === 'vi';

  const translations = {
    title: isVietnamese ? 'Doanh Thu' : 'Revenue',
    subtitle: isVietnamese ? 'Phân tích doanh thu và hiệu suất trạm sạc' : 'Revenue analytics and charging station performance',
    chooseRegion: isVietnamese ? 'Chọn Khu vực' : 'Choose Region',
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
    back: isVietnamese ? 'Quay lại' : 'Back',
    barChart: isVietnamese ? 'Biểu đồ cột' : 'Bar Chart',
    lineChart: isVietnamese ? 'Biểu đồ đường' : 'Line Chart',
    areaChart: isVietnamese ? 'Biểu đồ vùng' : 'Area Chart',
  };

  // Calculate summary statistics
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalSessions = revenueData.reduce((sum, item) => sum + item.sessions, 0);
  const totalUsers = revenueData.reduce((sum, item) => sum + item.users, 0);
  const avgRevenuePerSession = totalRevenue / totalSessions;

  const handleExport = () => {
    const currentDate = new Date().toLocaleString();
    const exportData = {
      region: regionData.find(r => r.id === selectedRegion)?.name || 'All Regions',
      station: stationData.find(s => s.id === selectedStation)?.name || 'All Stations',
      timeRange: timeRangeData.find(t => t.id === selectedTimeRange)?.name || 'Last 30 days',
      totalRevenue,
      totalSessions,
      totalUsers,
      avgRevenuePerSession: Math.round(avgRevenuePerSession),
      exportTimestamp: currentDate,
    };
    
    console.log('Export Data:', exportData);
    // In a real app, this would trigger a file download
  };

  const renderChart = () => {
    const commonProps = {
      width: '100%',
      height: 300,
      data: revenueData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333' : '#e0e0e0'} />
              <XAxis dataKey="month" stroke={theme === 'dark' ? '#fff' : '#333'} />
              <YAxis stroke={theme === 'dark' ? '#fff' : '#333'} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
                  border: `1px solid ${theme === 'dark' ? '#333' : '#e0e0e0'}`,
                  borderRadius: '8px',
                  color: theme === 'dark' ? '#fff' : '#333'
                }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#dc2626" strokeWidth={3} dot={{ fill: '#dc2626', strokeWidth: 2, r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333' : '#e0e0e0'} />
              <XAxis dataKey="month" stroke={theme === 'dark' ? '#fff' : '#333'} />
              <YAxis stroke={theme === 'dark' ? '#fff' : '#333'} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
                  border: `1px solid ${theme === 'dark' ? '#333' : '#e0e0e0'}`,
                  borderRadius: '8px',
                  color: theme === 'dark' ? '#fff' : '#333'
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#dc2626" fill="url(#revenueGradient)" strokeWidth={2} />
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333' : '#e0e0e0'} />
              <XAxis dataKey="month" stroke={theme === 'dark' ? '#fff' : '#333'} />
              <YAxis stroke={theme === 'dark' ? '#fff' : '#333'} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
                  border: `1px solid ${theme === 'dark' ? '#333' : '#e0e0e0'}`,
                  borderRadius: '8px',
                  color: theme === 'dark' ? '#fff' : '#333'
                }}
              />
              <Bar dataKey="revenue" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

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
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 via-red-500/90 to-red-500/70 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 transform group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-6 h-6 text-white" />
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-800 dark:from-red-400 dark:to-red-600 bg-clip-text text-transparent mb-2">
              {translations.title}
            </h1>
            <p className="text-muted-foreground text-lg">{translations.subtitle}</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8 border-red-200 dark:border-red-800 shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {translations.chooseRegion}
                </label>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="border-red-200 dark:border-red-800 focus:ring-red-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {regionData.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {isVietnamese ? region.nameVi : region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {translations.chooseStation}
                </label>
                <Select value={selectedStation} onValueChange={setSelectedStation}>
                  <SelectTrigger className="border-red-200 dark:border-red-800 focus:ring-red-500">
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
                <label className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {translations.chooseTimeRange}
                </label>
                <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                  <SelectTrigger className="border-red-200 dark:border-red-800 focus:ring-red-500">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">{translations.totalRevenue}</p>
                  <p className="text-2xl font-bold text-red-800 dark:text-red-200">${totalRevenue.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-red-600 dark:text-red-400" />
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
                  className={chartType === 'bar' ? 'bg-red-600 hover:bg-red-700' : 'border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30'}
                >
                  {translations.barChart}
                </Button>
                <Button
                  variant={chartType === 'line' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('line')}
                  className={chartType === 'line' ? 'bg-red-600 hover:bg-red-700' : 'border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30'}
                >
                  {translations.lineChart}
                </Button>
                <Button
                  variant={chartType === 'area' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('area')}
                  className={chartType === 'area' ? 'bg-red-600 hover:bg-red-700' : 'border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30'}
                >
                  {translations.areaChart}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-80 w-full">
              {renderChart()}
            </div>
          </CardContent>
        </Card>

        {/* Export Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-red-200 dark:border-red-800 shadow-lg">
            <CardHeader className="border-b border-red-200 dark:border-red-800">
              <CardTitle className="text-red-800 dark:text-red-200 flex items-center gap-2">
                <Download className="h-5 w-5" />
                {translations.export}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center">
                <Button
                  onClick={handleExport}
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg"
                >
                  <Download className="mr-2 h-5 w-5" />
                  {translations.export}
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  {isVietnamese 
                    ? 'Xuất dữ liệu doanh thu dưới định dạng CSV hoặc Excel' 
                    : 'Export revenue data in CSV or Excel format'
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