import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, TrendingUp, Clock, BarChart3, Filter, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import AdminLanguageThemeControls from './AdminLanguageThemeControls';
import { getPeakHours, type PeakHourDTO } from '../services/api';
import { toast } from 'sonner';

// Mock data for station frequency analysis
const stationFrequencyData = [
  {
    id: 'ST001',
    name: 'ChargeHub Hanoi Center',
    address: '123 Ba Dinh District, Hanoi',
    connectorTypes: ['CCS2', 'CHAdeMO', 'Type 2'],
    chargerCount: 8,
    status: 'online',
    totalSessions: 2450,
    weeklyGrowth: 15.2,
    location: 'hanoi',
    averageSessionTime: 35,
    utilizationRate: 78
  },
  {
    id: 'ST002',
    name: 'ChargeHub HCMC Mall',
    address: '456 District 1, Ho Chi Minh City',
    connectorTypes: ['CCS2', 'Type 2'],
    chargerCount: 12,
    status: 'online',
    totalSessions: 3120,
    weeklyGrowth: 22.5,
    location: 'hcm',
    averageSessionTime: 42,
    utilizationRate: 85
  },
  {
    id: 'ST003',
    name: 'ChargeHub Danang Airport',
    address: '789 Hai Chau, Da Nang',
    connectorTypes: ['CCS2', 'CHAdeMO'],
    chargerCount: 6,
    status: 'maintenance',
    totalSessions: 1890,
    weeklyGrowth: 8.7,
    location: 'danang',
    averageSessionTime: 28,
    utilizationRate: 65
  },
  {
    id: 'ST004',
    name: 'ChargeHub Hanoi North',
    address: '321 Dong Da District, Hanoi',
    connectorTypes: ['Type 2', 'CCS2'],
    chargerCount: 10,
    status: 'online',
    totalSessions: 2150,
    weeklyGrowth: 12.3,
    location: 'hanoi',
    averageSessionTime: 38,
    utilizationRate: 72
  },
  {
    id: 'ST005',
    name: 'ChargeHub HCMC South',
    address: '654 District 7, Ho Chi Minh City',
    connectorTypes: ['CCS2', 'Type 2', 'CHAdeMO'],
    chargerCount: 15,
    status: 'online',
    totalSessions: 2890,
    weeklyGrowth: 18.9,
    location: 'hcm',
    averageSessionTime: 45,
    utilizationRate: 88
  }
];

// Mock data fallback for peak hours analysis
const mockPeakHoursData = [
  { hour: '00:00', sessions: 12, avgDuration: 45 },
  { hour: '01:00', sessions: 8, avgDuration: 50 },
  { hour: '02:00', sessions: 5, avgDuration: 55 },
  { hour: '03:00', sessions: 3, avgDuration: 60 },
  { hour: '04:00', sessions: 4, avgDuration: 58 },
  { hour: '05:00', sessions: 8, avgDuration: 48 },
  { hour: '06:00', sessions: 25, avgDuration: 35 },
  { hour: '07:00', sessions: 45, avgDuration: 30 },
  { hour: '08:00', sessions: 68, avgDuration: 28 },
  { hour: '09:00', sessions: 52, avgDuration: 32 },
  { hour: '10:00', sessions: 38, avgDuration: 40 },
  { hour: '11:00', sessions: 42, avgDuration: 38 },
  { hour: '12:00', sessions: 55, avgDuration: 35 },
  { hour: '13:00', sessions: 48, avgDuration: 37 },
  { hour: '14:00', sessions: 35, avgDuration: 42 },
  { hour: '15:00', sessions: 40, avgDuration: 38 },
  { hour: '16:00', sessions: 65, avgDuration: 30 },
  { hour: '17:00', sessions: 85, avgDuration: 25 },
  { hour: '18:00', sessions: 95, avgDuration: 22 },
  { hour: '19:00', sessions: 78, avgDuration: 28 },
  { hour: '20:00', sessions: 62, avgDuration: 35 },
  { hour: '21:00', sessions: 45, avgDuration: 40 },
  { hour: '22:00', sessions: 32, avgDuration: 42 },
  { hour: '23:00', sessions: 20, avgDuration: 45 }
];

// Mock data for trend analysis
const trendAnalysisData = {
  weekOverWeek: [
    { period: 'Week 1', currentWeek: 1250, previousWeek: 1180, growth: 5.9 },
    { period: 'Week 2', currentWeek: 1320, previousWeek: 1250, growth: 5.6 },
    { period: 'Week 3', currentWeek: 1450, previousWeek: 1320, growth: 9.8 },
    { period: 'Week 4', currentWeek: 1380, previousWeek: 1450, growth: -4.8 }
  ],
  monthOverMonth: [
    { period: 'Jan', currentYear: 4850, previousYear: 4200, growth: 15.5 },
    { period: 'Feb', currentYear: 5200, previousYear: 4500, growth: 15.6 },
    { period: 'Mar', currentYear: 5650, previousYear: 4850, growth: 16.5 },
    { period: 'Apr', currentYear: 6100, previousYear: 5200, growth: 17.3 },
    { period: 'May', currentYear: 6450, previousYear: 5400, growth: 19.4 },
    { period: 'Jun', currentYear: 6800, previousYear: 5650, growth: 20.4 }
  ]
};

interface UsageAnalyticsViewProps {
  onBack: () => void;
}

export default function UsageAnalyticsView({ onBack }: UsageAnalyticsViewProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('week');
  const [selectedStation, setSelectedStation] = useState('ST001');
  const [trendPeriod, setTrendPeriod] = useState('week');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Peak hours state
  const [peakHoursData, setPeakHoursData] = useState<any[]>([]);
  const [loadingPeakHours, setLoadingPeakHours] = useState(false);
  const [useMockData, setUseMockData] = useState(true); // Fallback to mock if API fails

  const isVietnamese = language === 'vi';
  
  // Load peak hours from API
  useEffect(() => {
    if (selectedStation && selectedStation !== 'all') {
      loadPeakHours();
    }
  }, [selectedStation]);
  
  const loadPeakHours = async () => {
    setLoadingPeakHours(true);
    try {
      // Calculate date range (last 30 days)
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Extract station ID from selectedStation (format: 'ST001' -> try to parse)
      const stationIdMatch = selectedStation.match(/\d+/);
      const stationId = stationIdMatch ? parseInt(stationIdMatch[0]) : undefined;
      
      const response = await getPeakHours(startDate, endDate, stationId);
      
      if (response.success && response.data && response.data.length > 0) {
        // Transform API data to chart format
        const chartData = response.data.map((item: PeakHourDTO) => ({
          hour: item.timeRange.split(' - ')[0] || `${String(item.hour).padStart(2, '0')}:00`,
          sessions: item.sessionCount,
          avgDuration: item.averageEnergy > 0 ? Math.round((item.averageEnergy / 22) * 60) : 30, // Estimate duration
          energy: item.totalEnergy,
          revenue: item.totalRevenue
        }));
        setPeakHoursData(chartData);
        setUseMockData(false);
      } else {
        // No data from API, use mock
        setUseMockData(true);
      }
    } catch (error) {
      console.error('Error loading peak hours:', error);
      setUseMockData(true); // Fallback to mock data
    } finally {
      setLoadingPeakHours(false);
    }
  };

  const translations = {
    title: isVietnamese ? 'Phân Tích Sử Dụng' : 'Usage Analytics',
    subtitle: isVietnamese ? 'Dashboard phân tích chi tiết sử dụng trạm sạc' : 'Detailed Charging Station Usage Analytics Dashboard',
    refreshData: isVietnamese ? 'Cập nhật dữ liệu' : 'Refresh Data',
    back: isVietnamese ? 'Quay lại' : 'Back',
    
    // Filters
    location: isVietnamese ? 'Vị trí' : 'Location',
    timeRange: isVietnamese ? 'Khoảng thời gian' : 'Time Range',
    station: isVietnamese ? 'Trạm sạc' : 'Station',
    allLocations: isVietnamese ? 'Tất cả vị trí' : 'All Locations',
    hanoi: isVietnamese ? 'Hà Nội' : 'Hanoi',
    hcm: isVietnamese ? 'TP.HCM' : 'Ho Chi Minh',
    danang: isVietnamese ? 'Đà Nẵng' : 'Da Nang',
    lastWeek: isVietnamese ? 'Tuần qua' : 'Last Week',
    lastMonth: isVietnamese ? 'Tháng qua' : 'Last Month',
    last3Months: isVietnamese ? '3 tháng qua' : 'Last 3 Months',

    // Station Frequency Section
    stationFrequency: isVietnamese ? 'Tần Suất Sử Dụng Trạm' : 'Station Frequency',
    mostUsedStations: isVietnamese ? 'Trạm được sử dụng nhiều nhất' : 'Most Used Stations',
    totalSessions: isVietnamese ? 'Tổng phiên sạc' : 'Total Sessions',
    weeklyGrowth: isVietnamese ? 'Tăng trưởng tuần' : 'Weekly Growth',
    chargers: isVietnamese ? 'Bộ sạc' : 'Chargers',
    utilizationRate: isVietnamese ? 'Tỷ lệ sử dụng' : 'Utilization Rate',
    connectorTypes: isVietnamese ? 'Loại connector' : 'Connector Types',
    averageTime: isVietnamese ? 'Thời gian TB' : 'Avg. Time',

    // Peak Hours Section
    peakHours: isVietnamese ? 'Giờ Cao Điểm' : 'Peak Hours',
    peakHoursAnalysis: isVietnamese ? 'Phân tích giờ cao điểm cho trạm được chọn' : 'Peak hours analysis for selected station',
    chargingSessions: isVietnamese ? 'Phiên sạc' : 'Charging Sessions',
    sessionDuration: isVietnamese ? 'Thời lượng phiên (phút)' : 'Session Duration (min)',

    // Trend Analysis Section
    trendAnalysis: isVietnamese ? 'Phân Tích Xu Hướng' : 'Trend Analysis',
    weekOverWeek: isVietnamese ? 'Tuần qua tuần' : 'Week-over-Week',
    monthOverMonth: isVietnamese ? 'Tháng qua tháng' : 'Month-over-Month',
    currentPeriod: isVietnamese ? 'Kỳ hiện tại' : 'Current Period',
    previousPeriod: isVietnamese ? 'Kỳ trước' : 'Previous Period',
    growth: isVietnamese ? 'Tăng trưởng' : 'Growth',
    summary: isVietnamese ? 'Tổng quan' : 'Summary',
    avgGrowthRate: isVietnamese ? 'Tỷ lệ tăng trưởng TB' : 'Avg. Growth Rate',
    totalIncrease: isVietnamese ? 'Tổng tăng' : 'Total Increase',

    // Status
    online: isVietnamese ? 'Hoạt động' : 'Online',
    offline: isVietnamese ? 'Ngoại tuyến' : 'Offline',
    maintenance: isVietnamese ? 'Bảo trì' : 'Maintenance'
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  // Filter stations by location
  const filteredStations = selectedLocation === 'all' 
    ? stationFrequencyData 
    : stationFrequencyData.filter(station => station.location === selectedLocation);

  // Sort stations by total sessions
  const sortedStations = [...filteredStations].sort((a, b) => b.totalSessions - a.totalSessions);

  // Get selected station data for peak hours
  const selectedStationData = stationFrequencyData.find(station => station.id === selectedStation);

  // Get trend data based on selected period
  const currentTrendData = trendPeriod === 'week' ? trendAnalysisData.weekOverWeek : trendAnalysisData.monthOverMonth;

  // Calculate summary statistics
  const avgGrowthRate = currentTrendData.reduce((sum, item) => sum + item.growth, 0) / currentTrendData.length;
  const totalCurrentPeriod = currentTrendData.reduce((sum, item) => sum + item.currentWeek || item.currentYear, 0);
  const totalPreviousPeriod = currentTrendData.reduce((sum, item) => sum + item.previousWeek || item.previousYear, 0);
  const totalIncrease = ((totalCurrentPeriod - totalPreviousPeriod) / totalPreviousPeriod * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-950">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-blue-200 dark:border-blue-800 p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/30"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {translations.back}
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100">{translations.title}</h1>
                <p className="text-blue-600 dark:text-blue-400 text-sm">{translations.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {translations.refreshData}
              </Button>
              <AdminLanguageThemeControls />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="container mx-auto p-6">
        <Card className="mb-6 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-blue-900 dark:text-blue-100">
                  {translations.location}
                </label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="border-blue-200 dark:border-blue-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{translations.allLocations}</SelectItem>
                    <SelectItem value="hanoi">{translations.hanoi}</SelectItem>
                    <SelectItem value="hcm">{translations.hcm}</SelectItem>
                    <SelectItem value="danang">{translations.danang}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-blue-900 dark:text-blue-100">
                  {translations.timeRange}
                </label>
                <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                  <SelectTrigger className="border-blue-200 dark:border-blue-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">{translations.lastWeek}</SelectItem>
                    <SelectItem value="month">{translations.lastMonth}</SelectItem>
                    <SelectItem value="quarter">{translations.last3Months}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-blue-900 dark:text-blue-100">
                  {translations.station} ({translations.peakHours})
                </label>
                <Select value={selectedStation} onValueChange={setSelectedStation}>
                  <SelectTrigger className="border-blue-200 dark:border-blue-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stationFrequencyData.map((station) => (
                      <SelectItem key={station.id} value={station.id}>
                        {station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-blue-900 dark:text-blue-100">
                  {translations.trendAnalysis}
                </label>
                <Select value={trendPeriod} onValueChange={setTrendPeriod}>
                  <SelectTrigger className="border-blue-200 dark:border-blue-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">{translations.weekOverWeek}</SelectItem>
                    <SelectItem value="month">{translations.monthOverMonth}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Analytics Sections */}
        <div className="space-y-6">
          {/* 1. Station Frequency Section */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {translations.stationFrequency}
              </CardTitle>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {translations.mostUsedStations} ({filteredStations.length} stations)
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {sortedStations.map((station, index) => (
                  <div key={station.id} className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-bold text-blue-900 dark:text-blue-100">#{index + 1}</span>
                          <Badge variant={
                            station.status === 'online' ? 'default' :
                            station.status === 'offline' ? 'destructive' : 'secondary'
                          }>
                            {isVietnamese ? 
                              (station.status === 'online' ? 'Hoạt động' : 
                               station.status === 'offline' ? 'Ngoại tuyến' : 'Bảo trì') :
                              station.status
                            }
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">{station.name}</h4>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">{station.address}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700 dark:text-blue-300">{translations.totalSessions}</span>
                        <span className="font-bold text-blue-900 dark:text-blue-100">{station.totalSessions.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700 dark:text-blue-300">{translations.chargers}</span>
                        <span className="font-medium text-blue-900 dark:text-blue-100">{station.chargerCount}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700 dark:text-blue-300">{translations.averageTime}</span>
                        <span className="font-medium text-blue-900 dark:text-blue-100">{station.averageSessionTime}min</span>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-blue-700 dark:text-blue-300">{translations.utilizationRate}</span>
                          <span className="font-medium text-blue-900 dark:text-blue-100">{station.utilizationRate}%</span>
                        </div>
                        <Progress value={station.utilizationRate} className="h-2" />
                      </div>

                      <div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">{translations.connectorTypes}</p>
                        <div className="flex flex-wrap gap-1">
                          {station.connectorTypes.map((type) => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-700 dark:text-blue-300">{translations.weeklyGrowth}</span>
                          <span className={`font-medium ${station.weeklyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {station.weeklyGrowth >= 0 ? '+' : ''}{station.weeklyGrowth}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 2. Peak Hours Section */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {translations.peakHours}
              </CardTitle>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {translations.peakHoursAnalysis}: {selectedStationData?.name}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Peak Hours Chart */}
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-4">
                    {translations.chargingSessions}
                    {!useMockData && <Badge variant="outline" className="ml-2 text-xs">Real Data</Badge>}
                  </h4>
                  {loadingPeakHours ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={useMockData ? mockPeakHoursData : peakHoursData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e40af' : '#93c5fd'} />
                      <XAxis 
                        dataKey="hour" 
                        stroke={theme === 'dark' ? '#60a5fa' : '#1e40af'}
                        interval={2}
                      />
                      <YAxis stroke={theme === 'dark' ? '#60a5fa' : '#1e40af'} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#1e3a8a' : '#dbeafe',
                          border: `1px solid ${theme === 'dark' ? '#3b82f6' : '#2563eb'}`,
                          borderRadius: '8px',
                          color: theme === 'dark' ? '#ffffff' : '#1e40af'
                        }}
                      />
                      <Bar dataKey="sessions" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  )}
                </div>

                {/* Session Duration Chart */}
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-4">{translations.sessionDuration}</h4>
                  {loadingPeakHours ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={useMockData ? mockPeakHoursData : peakHoursData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e40af' : '#93c5fd'} />
                      <XAxis 
                        dataKey="hour" 
                        stroke={theme === 'dark' ? '#60a5fa' : '#1e40af'}
                        interval={2}
                      />
                      <YAxis stroke={theme === 'dark' ? '#60a5fa' : '#1e40af'} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#1e3a8a' : '#dbeafe',
                          border: `1px solid ${theme === 'dark' ? '#3b82f6' : '#2563eb'}`,
                          borderRadius: '8px',
                          color: theme === 'dark' ? '#ffffff' : '#1e40af'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avgDuration" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Peak Hours Summary */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">18:00</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Peak Hour</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">95</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Max Sessions</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">22</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Min Duration (min)</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">37</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Avg Duration (min)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Trend Analysis Section */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {translations.trendAnalysis}
              </CardTitle>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {trendPeriod === 'week' ? translations.weekOverWeek : translations.monthOverMonth} comparison
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trend Chart */}
                <div className="lg:col-span-2">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={currentTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e40af' : '#93c5fd'} />
                      <XAxis dataKey="period" stroke={theme === 'dark' ? '#60a5fa' : '#1e40af'} />
                      <YAxis stroke={theme === 'dark' ? '#60a5fa' : '#1e40af'} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#1e3a8a' : '#dbeafe',
                          border: `1px solid ${theme === 'dark' ? '#3b82f6' : '#2563eb'}`,
                          borderRadius: '8px',
                          color: theme === 'dark' ? '#ffffff' : '#1e40af'
                        }}
                      />
                      <Bar 
                        dataKey={trendPeriod === 'week' ? 'currentWeek' : 'currentYear'} 
                        fill="#2563eb" 
                        name={translations.currentPeriod}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey={trendPeriod === 'week' ? 'previousWeek' : 'previousYear'} 
                        fill="#93c5fd" 
                        name={translations.previousPeriod}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Summary Statistics */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">{translations.summary}</h4>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">{translations.avgGrowthRate}</p>
                    <p className={`text-xl font-bold ${avgGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {avgGrowthRate >= 0 ? '+' : ''}{avgGrowthRate.toFixed(1)}%
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">{translations.totalIncrease}</p>
                    <p className={`text-xl font-bold ${totalIncrease >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalIncrease >= 0 ? '+' : ''}{totalIncrease.toFixed(1)}%
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">{translations.currentPeriod}</p>
                    <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                      {totalCurrentPeriod.toLocaleString()}
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">{translations.previousPeriod}</p>
                    <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                      {totalPreviousPeriod.toLocaleString()}
                    </p>
                  </div>

                  {/* Growth Rate for each period */}
                  <div className="space-y-2">
                    {currentTrendData.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-900/30 rounded">
                        <span className="text-sm text-blue-700 dark:text-blue-300">{item.period}</span>
                        <span className={`text-sm font-medium ${item.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.growth >= 0 ? '+' : ''}{item.growth}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}