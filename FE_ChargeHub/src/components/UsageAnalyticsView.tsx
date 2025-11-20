import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, TrendingUp, Clock, BarChart3, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import AdminLanguageThemeControls from './AdminLanguageThemeControls';
import axios from 'axios';
import { apiBaseUrl } from '../services/api';


interface UsageAnalyticsViewProps {
  onBack: () => void;
}

interface PeakHour {
  hour: number;
  timeRange: string;
  sessionCount: number;
  totalEnergy: number;
  averageEnergy: number;
  totalRevenue: number;
  peakLevel: string;
  percentageOfDaily: number;
}

interface Trend {
  date: string;
  period: string;
  totalSessions: number;
  totalEnergy: number;
  totalRevenue: number;
  averageSessionDuration: number;
  averageEnergyPerSession: number;
  uniqueUsers: number;
  peakHour: number;
}

interface DashBoard {
  sessionId: number;
  userId: number;
  userName: number;
  stationId: number;
  stationName: string;
  chargingPointId: number;
  connectorType: string;
  startTime: string;
  endTime: string;
  energyConsumed: number;
  totalCost: number;
  status: string;
  duration: number;
  vehicleModel: string;
}

export default function UsageAnalyticsView({ onBack }: Readonly<UsageAnalyticsViewProps>) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('week');
  const [selectedStation, setSelectedStation] = useState('ST001');
  // removed legacy trendPeriod (mock)
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [peakChartData, setPeakChartData] = useState<Array<{ timeRange: string; sessions: number; totalEnergy: number; averageEnergy: number }>>([]);
  const [topTimeRange, setTopTimeRange] = useState<string>('');
  const [topSessions, setTopSessions] = useState<number>(0);
  const [trendRaw, setTrendRaw] = useState<Trend[]>([]);
  const [trendFilter, setTrendFilter] = useState<'yesterday' | 'lastWeek' | 'lastMonth' | 'lastYear'>('lastWeek');
  const [trendFiltered, setTrendFiltered] = useState<Trend[]>([]);

  const isVietnamese = language === 'vi';

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

  // Dashboard stations derived from analyzeDashboard
  type StationAgg = {
    stationId: number;
    stationName: string;
    totalSessions: number;
    totalEnergy: number;
    totalRevenue: number;
    uniqueUsers: number;
    connectorTypes: string[];
    averageSessionDuration: number;
    lastActive: string;
  };
  const [dashboardStations, setDashboardStations] = useState<StationAgg[]>([]);

  // Filter by stationName from dashboardStations
  const filteredStations = selectedLocation === 'all'
    ? dashboardStations
    : dashboardStations.filter(st => st.stationName === selectedLocation);

  // Sort by totalSessions desc
  const sortedStations = [...filteredStations].sort((a, b) => b.totalSessions - a.totalSessions);

  // For header subtitle in Peak Hours, use the first selected station (if any)
  const selectedStationData = sortedStations[0];

  // Removed mock trend aggregation; using real trendFiltered data below
  
  //call Api
  const analyzePeakHour = async() : Promise<PeakHour[] | null> => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`${apiBaseUrl}/api/analytics/peak-hours`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (res.status === 200) {
        const raw = (res.data?.data ?? res.data) as any[];
        return raw.map((peakHour) => ({
          hour: Number(peakHour.hour ?? 0),
          timeRange: String(peakHour.timeRange ?? ''),
          sessionCount: Number(peakHour.sessionCount ?? 0),
          totalEnergy: Number(peakHour.totalEnergy ?? 0),
          averageEnergy: Number(peakHour.averageEnergy ?? 0),
          totalRevenue: Number(peakHour.totalRevenue ?? 0),
          peakLevel: String(peakHour.peakLevel ?? ''),
          percentageOfDaily: Number(peakHour.percentageOfDaily ?? 0)
        })) as PeakHour[]
      }
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('analyzePeakHour failed', err);
      return null;
    }
    return null;
  }

  // Build dashboard station aggregates from recentSessions
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const recent = await analyzeDashboard();
      if (!isMounted || !recent) return;
      const byStation = new Map<number, {
        stationName: string;
        totalSessions: number;
        totalEnergy: number;
        totalRevenue: number;
        userIds: Set<number>;
        connectorTypes: Set<string>;
        durationSum: number;
        count: number;
        lastActive: string;
      }>();
      for (const s of recent) {
        const cur = byStation.get(s.stationId) ?? {
          stationName: s.stationName,
          totalSessions: 0,
          totalEnergy: 0,
          totalRevenue: 0,
          userIds: new Set<number>(),
          connectorTypes: new Set<string>(),
          durationSum: 0,
          count: 0,
          lastActive: ''
        };
        cur.totalSessions += 1;
        cur.totalEnergy += Number(s.energyConsumed || 0);
        cur.totalRevenue += Number(s.totalCost || 0);
        cur.userIds.add(Number(s.userId || 0));
        if (s.connectorType) cur.connectorTypes.add(String(s.connectorType));
        cur.durationSum += Number(s.duration || 0);
        cur.count += 1;
        const endTime = String(s.endTime || s.startTime || '');
        if (!cur.lastActive || (endTime && new Date(endTime) > new Date(cur.lastActive))) {
          cur.lastActive = endTime;
        }
        byStation.set(s.stationId, cur);
      }
      const agg: StationAgg[] = Array.from(byStation.entries()).map(([stationId, v]) => ({
        stationId,
        stationName: v.stationName,
        totalSessions: v.totalSessions,
        totalEnergy: Number(v.totalEnergy.toFixed(2)),
        totalRevenue: Number(v.totalRevenue.toFixed(2)),
        uniqueUsers: v.userIds.size,
        connectorTypes: Array.from(v.connectorTypes),
        averageSessionDuration: v.count ? Number((v.durationSum / v.count).toFixed(1)) : 0,
        lastActive: v.lastActive
      }));
      setDashboardStations(agg);
    })();
    return () => { isMounted = false };
  }, []);

  const analyzeTrend = async() : Promise<Trend[] | null> => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`${apiBaseUrl}/api/analytics/trends`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.status === 200) {
        const raw = (res.data?.data ?? res.data) as any[];
        return raw.map((trend) => ({
          date: String(trend.date),
          period: String(trend.period ?? ''),
          totalSessions: Number(trend.totalSessions ?? 0),
          totalEnergy: Number(trend.totalEnergy ?? 0),
          totalRevenue: Number(trend.totalRevenue ?? 0),
          averageSessionDuration: Number(trend.averageSessionDuration ?? 0),
          averageEnergyPerSession: Number(trend.averageEnergyPerSession ?? 0),
          uniqueUsers: Number(trend.uniqueUsers ?? 0),
          peakHour: Number(trend.peakHour ?? 0)
        })) as Trend[]
      }
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('analyzeTrend failed', err);
    }
    return null;
  }

  const analyzeDashboard = async() : Promise<DashBoard[] | null> => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`${apiBaseUrl}/api/analytics/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (res.status === 200) {
        const data = res.data?.data ?? res.data;
        const recent = Array.isArray(data?.recentSessions) ? data.recentSessions : [];
        const mapped: DashBoard[] = recent.map((s: any) => ({
          sessionId: Number(s.sessionId ?? 0),
          userId: Number(s.userId ?? 0),
          userName: String(s.userName ?? ''),
          stationId: Number(s.stationId ?? 0),
          stationName: String(s.stationName ?? ''),
          chargingPointId: Number(s.chargingPointId ?? 0),
          connectorType: String(s.connectorType ?? ''),
          startTime: String(s.startTime ?? ''),
          endTime: String(s.endTime ?? ''),
          energyConsumed: Number(s.energyConsumed ?? 0),
          totalCost: Number(s.totalCost ?? 0),
          status: String(s.status ?? ''),
          duration: Number(s.duration ?? 0),
          vehicleModel: String(s.vehicleModel ?? '')
        }));
        return mapped;
      }
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('analyzeDashboard failed', err);
      return null;
    }
    return null;
  }

  const filterTrendsByDate = (data: Trend[], key: 'yesterday' | 'lastWeek' | 'lastMonth' | 'lastYear'): Trend[] => {
    const today = new Date();
    let start: Date;
    switch (key) {
      case 'yesterday': {
        const d = new Date(today);
        d.setDate(d.getDate() - 1);
        start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
        return data.filter(t => {
          const td = new Date(t.date);
          return td >= start && td < end;
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }
      case 'lastWeek': {
        start = new Date(today);
        start.setDate(start.getDate() - 7);
        break;
      }
      case 'lastMonth': {
        start = new Date(today);
        start.setMonth(start.getMonth() - 1);
        break;
      }
      case 'lastYear': {
        start = new Date(today);
        start.setFullYear(start.getFullYear() - 1);
        break;
      }
      default: {
        start = new Date(today);
        start.setDate(start.getDate() - 7);
      }
    }
    return data
      .filter(t => new Date(t.date) >= start)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const peak = await analyzePeakHour();
      if (!isMounted || !peak) return;
      // Gộp theo timeRange để lấy tần suất (sessions) và năng lượng
      const byRange = new Map<string, { sessions: number; totalEnergy: number; avgSum: number; count: number }>();
      for (const p of peak) {
        const key = p.timeRange || '';
        const cur = byRange.get(key) ?? { sessions: 0, totalEnergy: 0, avgSum: 0, count: 0 };
        cur.sessions += Number(p.sessionCount || 0);
        cur.totalEnergy += Number(p.totalEnergy || 0);
        cur.avgSum += Number(p.averageEnergy || 0);
        cur.count += 1;
        byRange.set(key, cur);
      }
      const chart = Array.from(byRange.entries()).map(([timeRange, v]) => ({
        timeRange,
        sessions: v.sessions,
        totalEnergy: Number(v.totalEnergy.toFixed(2)),
        averageEnergy: v.count ? Number((v.avgSum / v.count).toFixed(2)) : 0,
      })).sort((a, b) => a.timeRange.localeCompare(b.timeRange));

      // timeRange xuất hiện nhiều nhất theo sessions
      let top = '';
      let topSess = 0;
      for (const item of chart) {
        if (item.sessions > topSess) {
          topSess = item.sessions;
          top = item.timeRange;
        }
      }
      setPeakChartData(chart);
      setTopTimeRange(top);
      setTopSessions(topSess);
    })();
    return () => { isMounted = false };
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const t = await analyzeTrend();
      if (!isMounted || !t) return;
      const sorted = [...t].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setTrendRaw(sorted);
      setTrendFiltered(filterTrendsByDate(sorted, trendFilter));
    })();
    return () => { isMounted = false };
  }, []);

  useEffect(() => {
    if (!trendRaw.length) return;
    setTrendFiltered(filterTrendsByDate(trendRaw, trendFilter));
  }, [trendFilter, trendRaw]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-950">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-blue-200 dark:border-blue-800 p-3 sm:p-4">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/30 touch-manipulation min-h-[44px] px-2 sm:px-3"
              >
                <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline text-xs sm:text-sm">{translations.back}</span>
                <span className="sm:hidden text-xs">Back</span>
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-900 dark:text-blue-100 truncate">{translations.title}</h1>
                <p className="text-blue-600 dark:text-blue-400 text-xs sm:text-sm hidden sm:block">{translations.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-blue-600 hover:bg-blue-700 text-white touch-manipulation min-h-[44px] text-xs sm:text-sm px-3 sm:px-4"
              >
                <RefreshCw className={`mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{translations.refreshData}</span>
                <span className="sm:hidden">Refresh</span>
              </Button>
              <AdminLanguageThemeControls />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="container mx-auto p-3 sm:p-4 md:p-6">
        <Card className="mb-6 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-blue-900 dark:text-blue-100">
                  {translations.station}
                </label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="border-blue-200 dark:border-blue-800 h-10 sm:h-11 text-sm sm:text-base touch-manipulation" aria-label="Station Filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{translations.allLocations}</SelectItem>
                    {dashboardStations.map(st => (
                      <SelectItem key={st.stationId} value={st.stationName}>{st.stationName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              

              <div>
                <label className="block text-sm font-medium mb-2 text-blue-900 dark:text-blue-100">
                  Analytics Period
                </label>
                <Select value={trendFilter} onValueChange={(v: 'yesterday' | 'lastWeek' | 'lastMonth' | 'lastYear') => setTrendFilter(v)}>
                  <SelectTrigger className="border-blue-200 dark:border-blue-800 h-10 sm:h-11 text-sm sm:text-base touch-manipulation" aria-label="Analytics Period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="lastWeek">Last Week</SelectItem>
                    <SelectItem value="lastMonth">Last Month</SelectItem>
                    <SelectItem value="lastYear">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Analytics Sections */}
        <div className="space-y-6">
          {/* 1. Station Frequency Section (from analyzeDashboard) */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {sortedStations.map((station, index) => (
                  <div key={station.stationId} className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-bold text-blue-900 dark:text-blue-100">#{index + 1}</span>
                          <Badge variant="secondary">{station.stationName}</Badge>
                        </div>
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">{station.stationName}</h4>
                        {station.lastActive && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">Last active: {new Date(station.lastActive).toLocaleString()}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700 dark:text-blue-300">{translations.totalSessions}</span>
                        <span className="font-bold text-blue-900 dark:text-blue-100">{station.totalSessions.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700 dark:text-blue-300">Total Energy</span>
                        <span className="font-medium text-blue-900 dark:text-blue-100">{station.totalEnergy.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700 dark:text-blue-300">Revenue</span>
                        <span className="font-medium text-blue-900 dark:text-blue-100">{station.totalRevenue.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700 dark:text-blue-300">Unique Users</span>
                        <span className="font-medium text-blue-900 dark:text-blue-100">{station.uniqueUsers}</span>
                      </div>

                      <div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">{translations.connectorTypes}</p>
                        <div className="flex flex-wrap gap-1">
                          {station.connectorTypes.length > 0 ? (
                            station.connectorTypes.map((type) => (
                              <Badge key={type} variant="outline" className="text-xs">{type}</Badge>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-xs">N/A</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700 dark:text-blue-300">Avg. Session Time</span>
                        <span className="font-medium text-blue-900 dark:text-blue-100">{station.averageSessionDuration} min</span>
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
                {translations.peakHoursAnalysis}: {selectedStationData?.stationName}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Peak Hours Chart - Sessions by timeRange */}
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-4">{translations.chargingSessions}</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={peakChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e40af' : '#93c5fd'} />
                      <XAxis 
                        dataKey="timeRange" 
                        stroke={theme === 'dark' ? '#60a5fa' : '#1e40af'}
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
                      <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
                        {peakChartData.map((entry) => (
                          <Cell key={`cell-${entry.timeRange}`} fill={entry.timeRange === topTimeRange ? '#1d4ed8' : '#2563eb'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Energy Chart - Total Energy with Average Energy overlay */}
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-4">Energy</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={peakChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e40af' : '#93c5fd'} />
                      <XAxis 
                        dataKey="timeRange" 
                        stroke={theme === 'dark' ? '#60a5fa' : '#1e40af'}
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
                      {/* totalEnergy as bars behind the line for a richer look */}
                      <Bar dataKey="totalEnergy" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Line 
                        type="monotone" 
                        dataKey="averageEnergy" 
                        stroke="#16a34a" 
                        strokeWidth={3}
                        dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Peak Hours Summary */}
              <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{topTimeRange || '-'}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Peak Range</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{topSessions}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Max Sessions</p>
                </div>
                {(() => {
                  const avgEnergy = peakChartData.length
                    ? (peakChartData.reduce((s, i) => s + i.averageEnergy, 0) / peakChartData.length)
                    : 0;
                  const totalEnergy = peakChartData.reduce((s, i) => s + i.totalEnergy, 0);
                  return (
                    <>
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalEnergy.toFixed(0)}</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Total Energy</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{avgEnergy.toFixed(1)}</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Avg Energy</p>
                      </div>
                    </>
                  );
                })()}
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
              <p className="text-sm text-blue-600 dark:text-blue-400">{`Period: ${trendFilter}`}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Charts area */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Sessions over Date */}
                  <div className="p-3 sm:p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">Total Sessions</h4>
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={trendFiltered}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e40af' : '#93c5fd'} />
                        <XAxis dataKey="date" stroke={theme === 'dark' ? '#60a5fa' : '#1e40af'} />
                        <YAxis stroke={theme === 'dark' ? '#60a5fa' : '#1e40af'} />
                        <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1e3a8a' : '#dbeafe', border: `1px solid ${theme === 'dark' ? '#3b82f6' : '#2563eb'}`, borderRadius: '8px', color: theme === 'dark' ? '#ffffff' : '#1e40af' }} />
                        <Line type="monotone" dataKey="totalSessions" stroke="#2563eb" strokeWidth={3} dot={{ r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Energy over Date */}
                  <div className="p-3 sm:p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">Total Energy</h4>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={trendFiltered}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e40af' : '#93c5fd'} />
                        <XAxis dataKey="date" stroke={theme === 'dark' ? '#60a5fa' : '#1e40af'} />
                        <YAxis stroke={theme === 'dark' ? '#60a5fa' : '#1e40af'} />
                        <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1e3a8a' : '#dbeafe', border: `1px solid ${theme === 'dark' ? '#3b82f6' : '#2563eb'}`, borderRadius: '8px', color: theme === 'dark' ? '#ffffff' : '#1e40af' }} />
                        <Bar dataKey="totalEnergy" fill="#22c55e" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Unique Users over Date */}
                  <div className="p-3 sm:p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">Unique Users</h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={trendFiltered}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e40af' : '#93c5fd'} />
                        <XAxis dataKey="date" stroke={theme === 'dark' ? '#60a5fa' : '#1e40af'} />
                        <YAxis stroke={theme === 'dark' ? '#60a5fa' : '#1e40af'} />
                        <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1e3a8a' : '#dbeafe', border: `1px solid ${theme === 'dark' ? '#3b82f6' : '#2563eb'}`, borderRadius: '8px', color: theme === 'dark' ? '#ffffff' : '#1e40af' }} />
                        <Line type="monotone" dataKey="uniqueUsers" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Summary / KPIs */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">{translations.summary}</h4>
                  </div>

                  {(() => {
                    const len = trendFiltered.length;
                    const first = len > 0 ? trendFiltered[0] : undefined;
                    const last = len > 1 ? trendFiltered[len - 1] : first;
                    const sessionGrowth = first && last && first.totalSessions !== 0
                      ? ((last.totalSessions - first.totalSessions) / first.totalSessions) * 100
                      : 0;
                    const revenueGrowth = first && last && first.totalRevenue !== 0
                      ? ((last.totalRevenue - first.totalRevenue) / first.totalRevenue) * 100
                      : 0;
                    const avgSessionDuration = len ? (trendFiltered.reduce((s, i) => s + i.averageSessionDuration, 0) / len) : 0;
                    const avgEnergyPerSession = len ? (trendFiltered.reduce((s, i) => s + i.averageEnergyPerSession, 0) / len) : 0;
                    return (
                      <>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                          <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Session Growth Rate</p>
                          <p className={`text-xl font-bold ${sessionGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>{sessionGrowth >= 0 ? '+' : ''}{sessionGrowth.toFixed(1)}%</p>
                        </div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                          <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Revenue Growth Rate</p>
                          <p className={`text-xl font-bold ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>{revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%</p>
                        </div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                          <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Avg Session Duration</p>
                          <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{avgSessionDuration.toFixed(1)}</p>
                        </div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                          <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Avg Energy / Session</p>
                          <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{avgEnergyPerSession.toFixed(2)}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}