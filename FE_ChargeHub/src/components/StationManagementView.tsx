import React from 'react';
import { ArrowLeft, MapPin, Zap, Circle, AlertCircle, CheckCircle, Receipt, Bell, RefreshCw, Power, Clock, User, Download } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useStation } from '../contexts/StationContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface StationManagementViewProps {
  onBack: () => void;
}

// Use station data from context

// Mock charging pillars data
const chargingPillars = [
  { id: 'VFS-150KW-001', name: 'Pillar 1', status: 'available', power: 150, type: 'DC_FAST' },
  { id: 'VFS-150KW-002', name: 'Pillar 2', status: 'in_use', power: 150, type: 'DC_FAST', driverName: 'Nguyễn Văn An', timeRemaining: 35 },
  { id: 'VFS-200KW-003', name: 'Pillar 3', status: 'in_use', power: 200, type: 'DC_FAST', driverName: 'Nguyễn Văn An', timeRemaining: 45 },
  { id: 'VFS-120KW-004', name: 'Pillar 4', status: 'available', power: 120, type: 'DC_FAST' },
  { id: 'VFS-22KW-005', name: 'Pillar 5', status: 'offline', power: 22, type: 'AC_FAST' },
  { id: 'VFS-7KW-006', name: 'Pillar 6', status: 'available', power: 7, type: 'AC_SLOW' },
  { id: 'VFS-180KW-007', name: 'Pillar 7', status: 'available', power: 180, type: 'DC_FAST' },
  { id: 'VFS-150KW-008', name: 'Pillar 8', status: 'in_use', power: 150, type: 'DC_FAST', driverName: 'Nguyễn Văn An', timeRemaining: 15 }
];



// Mock recent invoices
const recentInvoices = [
  {
    id: 'INV-001',
    driverName: 'Nguyễn Văn An',
    vehicleId: 'VF8-001-HCM',
    amount: 165000,
    date: '2025-09-20',
    time: '09:15',
    status: 'auto_sent',
    pillarId: 'VFS-120KW-012'
  },
  {
    id: 'INV-002',
    driverName: 'Nguyễn Văn An',
    vehicleId: 'VF8-001-HCM',
    amount: 55000,
    date: '2025-09-18',
    time: '19:30',
    status: 'auto_sent',
    pillarId: 'SHL-7KW-021'
  },
  {
    id: 'INV-003',
    driverName: 'Nguyễn Văn An',
    vehicleId: 'VF8-001-HCM',
    amount: 135000,
    date: '2025-09-17',
    time: '11:20',
    status: 'auto_sent',
    pillarId: 'VFS-150KW-001'
  }
];

export default function StationManagementView({ onBack }: StationManagementViewProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { currentStation } = useStation();

  const translations = {
    title: language === 'vi' ? 'Quản Lý Trạm Sạc' : 'Station Management',
    subtitle: language === 'vi' ? 'Quản lý trạm sạc và hóa đơn' : 'Manage charging station and invoices',
    managePillars: language === 'vi' ? 'Quản Lý Cột Sạc' : 'Manage Charging Pillars',
    available: language === 'vi' ? 'Sẵn sàng' : 'Available',
    inUse: language === 'vi' ? 'Đang sử dụng' : 'In Use',
    offline: language === 'vi' ? 'Ngoại tuyến' : 'Offline',

    invoices: language === 'vi' ? 'Hóa Đơn' : 'Invoices',
    autoSent: language === 'vi' ? 'Tự động gửi qua thông báo' : 'Auto-sent to driver via notification',

    timeRemaining: language === 'vi' ? 'Thời gian còn lại' : 'Time Remaining',
    minutes: language === 'vi' ? 'phút' : 'minutes',
    refresh: language === 'vi' ? 'Làm mới' : 'Refresh',
    viewInvoice: language === 'vi' ? 'Xem hóa đơn' : 'View Invoice',
    power: language === 'vi' ? 'Công suất' : 'Power',
    type: language === 'vi' ? 'Loại' : 'Type',
    pillar: language === 'vi' ? 'Cột' : 'Pillar',
    summary: language === 'vi' ? 'Tóm tắt' : 'Summary'
  };

  // Calculate pillar stats
  const availablePillars = chargingPillars.filter(p => p.status === 'available').length;
  const totalPillars = chargingPillars.length;
  const inUsePillars = chargingPillars.filter(p => p.status === 'in_use').length;
  const offlinePillars = chargingPillars.filter(p => p.status === 'offline').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-600 dark:text-green-400';
      case 'in_use':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'offline':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_use':
        return <Clock className="w-4 h-4" />;
      case 'offline':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      available: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
      in_use: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300',
      offline: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300'
    };
    
    const labels = {
      available: translations.available,
      in_use: translations.inUse,
      offline: translations.offline
    };

    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };



  const formatCurrency = (amount: number) => {
    return language === 'vi' 
      ? `${amount.toLocaleString('vi-VN')}đ`
      : `$${amount.toFixed(2)}`;
  };

  const getTypeLabel = (type: string) => {
    const types = {
      'DC_FAST': 'DC Fast',
      'AC_FAST': 'AC Fast',
      'AC_SLOW': 'AC Slow'
    };
    return types[type as keyof typeof types] || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-blue-950 dark:to-green-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="p-2 hover:bg-primary/10 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            {/* Station Info */}
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Power className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">{currentStation.name}</h1>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {currentStation.address}
                </div>
              </div>
            </div>
            
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              {translations.refresh}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Charging Pillars Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                {translations.managePillars}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-green-600 dark:text-green-400">{availablePillars}</span>
                {language === 'vi' ? ' sẵn sàng trên tổng ' : ' available out of '}
                <span className="font-medium">{totalPillars}</span>
                {language === 'vi' ? ' cột' : ' total pillars'}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300">{translations.available}</p>
                    <p className="text-2xl font-semibold text-green-800 dark:text-green-200">{availablePillars}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">{translations.inUse}</p>
                    <p className="text-2xl font-semibold text-yellow-800 dark:text-yellow-200">{inUsePillars}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="text-sm text-red-700 dark:text-red-300">{translations.offline}</p>
                    <p className="text-2xl font-semibold text-red-800 dark:text-red-200">{offlinePillars}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {chargingPillars.map((pillar) => (
                <div key={pillar.id} className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 ${getStatusColor(pillar.status)}`}>
                        {getStatusIcon(pillar.status)}
                        <span className="font-medium">{pillar.name}</span>
                      </div>
                    </div>
                    {getStatusBadge(pillar.status)}
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>ID: {pillar.id}</div>
                    <div>{translations.power}: {pillar.power}kW</div>
                    <div>{translations.type}: {getTypeLabel(pillar.type)}</div>
                    
                    {pillar.status === 'in_use' && pillar.driverName && (
                      <div className="mt-2 p-2 bg-muted rounded border-l-2 border-yellow-500">
                        <div className="flex items-center gap-1 text-sm">
                          <User className="w-3 h-3" />
                          {pillar.driverName}
                        </div>
                        {pillar.timeRemaining && (
                          <div className="text-xs text-muted-foreground">
                            {translations.timeRemaining}: {pillar.timeRemaining} {translations.minutes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Invoices Section */}
        <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                {translations.invoices}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bell className="w-4 h-4" />
                {translations.autoSent}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{invoice.id}</div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300">
                        <Bell className="w-3 h-3 mr-1" />
                        {language === 'vi' ? 'Đã gửi' : 'Sent'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-2">
                      <div>{invoice.driverName}</div>
                      <div>{invoice.vehicleId}</div>
                      <div>{invoice.date} • {invoice.time}</div>
                      <div>{invoice.pillarId}</div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{formatCurrency(invoice.amount)}</div>
                      <Button variant="outline" size="sm">
                        <Download className="w-3 h-3 mr-1" />
                        {translations.viewInvoice}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}