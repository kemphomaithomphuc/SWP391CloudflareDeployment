import React, { useState } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, Zap, Battery, QrCode, Phone, Navigation, MoreHorizontal, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useBooking, Booking } from '../contexts/BookingContext';
import PenaltyFeeDisplay from './PenaltyFeeDisplay';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { toast } from 'sonner@2.0.3';
import { Separator } from './ui/separator';

interface MyBookingViewProps {
  onBack: () => void;
  onStartCharging?: (bookingId: string) => void;
}

export default function MyBookingView({ onBack, onStartCharging }: MyBookingViewProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { bookings, updateBookingStatus } = useBooking();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const translations = {
    title: language === 'vi' ? 'Đặt chỗ của tôi' : 'My Bookings',
    upcoming: language === 'vi' ? 'Sắp tới' : 'Upcoming',
    active: language === 'vi' ? 'Đang sạc' : 'Active',
    history: language === 'vi' ? 'Lịch sử' : 'History',
    noBookings: language === 'vi' ? 'Chưa có đặt chỗ nào' : 'No bookings yet',
    bookingDetails: language === 'vi' ? 'Chi tiết đặt chỗ' : 'Booking Details',
    cancel: language === 'vi' ? 'Hủy đặt chỗ' : 'Cancel Booking',
    confirmCancel: language === 'vi' ? 'Xác nhận hủy' : 'Confirm Cancellation',
    cancelMessage: language === 'vi' ? 'Bạn có chắc chắn muốn hủy đặt chỗ này không?' : 'Are you sure you want to cancel this booking?',
    navigate: language === 'vi' ? 'Chỉ đường' : 'Navigate',
    showQR: language === 'vi' ? 'Hiển thị QR' : 'Show QR',
    contact: language === 'vi' ? 'Liên hệ' : 'Contact',
    startCharging: language === 'vi' ? 'Bắt đầu sạc' : 'Start Charging',
    estimatedCost: language === 'vi' ? 'Chi phí ước tính' : 'Estimated Cost',
    duration: language === 'vi' ? 'Thời lượng' : 'Duration',
    chargerType: language === 'vi' ? 'Loại sạc' : 'Charger Type',
    targetBattery: language === 'vi' ? 'Pin mục tiêu' : 'Target Battery',
    currentBattery: language === 'vi' ? 'Pin hiện tại' : 'Current Battery',
    minutes: language === 'vi' ? 'phút' : 'minutes',
    hours: language === 'vi' ? 'giờ' : 'hours',
    status: {
      confirmed: language === 'vi' ? 'Đã xác nhận' : 'Confirmed',
      active: language === 'vi' ? 'Đang sạc' : 'Active',
      completed: language === 'vi' ? 'Hoàn thành' : 'Completed',
      cancelled: language === 'vi' ? 'Đã hủy' : 'Cancelled'
    }
  };

  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'active':
        return <Zap className="w-4 h-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300';
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300';
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} ${translations.minutes}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 
      ? `${hours} ${translations.hours} ${remainingMinutes} ${translations.minutes}`
      : `${hours} ${translations.hours}`;
  };

  const formatDateTime = (date: string, time: string) => {
    return `${date} • ${time}`;
  };

  const formatCurrency = (amount: number) => {
    return language === 'vi' 
      ? `${amount.toLocaleString('vi-VN')}đ`
      : `$${amount.toFixed(2)}`;
  };

  const handleCancelBooking = (bookingId: string) => {
    updateBookingStatus(bookingId, 'cancelled');
    toast.success(language === 'vi' ? 'Đã hủy đặt chỗ thành công' : 'Booking cancelled successfully');
  };

  const upcomingBookings = bookings.filter(booking => booking.status === 'confirmed');
  const activeBookings = bookings.filter(booking => booking.status === 'active');
  const historyBookings = bookings.filter(booking => ['completed', 'cancelled'].includes(booking.status));

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium">{booking.stationName}</h3>
              <Badge variant="outline" className={`${getStatusColor(booking.status)} flex items-center gap-1`}>
                {getStatusIcon(booking.status)}
                {translations.status[booking.status]}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <MapPin className="w-4 h-4" />
              <span>{booking.stationAddress}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDateTime(booking.date, booking.time)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(booking.duration)}</span>
              </div>
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedBooking(booking)}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{translations.bookingDetails}</DialogTitle>
              </DialogHeader>
              {selectedBooking && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">{translations.estimatedCost}</p>
                      <p className="font-medium">{formatCurrency(selectedBooking.estimatedCost)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">{translations.chargerType}</p>
                      <p className="font-medium">{selectedBooking.chargerType}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">{translations.currentBattery}</p>
                      <p className="font-medium flex items-center gap-1">
                        <Battery className="w-4 h-4" />
                        {selectedBooking.currentBattery}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">{translations.targetBattery}</p>
                      <p className="font-medium flex items-center gap-1">
                        <Battery className="w-4 h-4" />
                        {selectedBooking.targetBattery}%
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Navigation className="w-4 h-4 mr-2" />
                      {translations.navigate}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <QrCode className="w-4 h-4 mr-2" />
                      {translations.showQR}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Phone className="w-4 h-4 mr-2" />
                      {translations.contact}
                    </Button>
                  </div>
                  
                  {selectedBooking.status === 'confirmed' && (
                    <>
                      <Separator />
                      <div className="flex gap-2">
                        {onStartCharging && (
                          <Button 
                            onClick={() => onStartCharging(selectedBooking.id)}
                            size="sm" 
                            className="flex-1"
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            {translations.startCharging}
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="flex-1">
                              <XCircle className="w-4 h-4 mr-2" />
                              {translations.cancel}
                            </Button>
                          </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{translations.confirmCancel}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {translations.cancelMessage}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {language === 'vi' ? 'Không' : 'No'}
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleCancelBooking(selectedBooking.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {language === 'vi' ? 'Có, hủy đặt chỗ' : 'Yes, cancel booking'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>{booking.power}kW</span>
            </div>
            <div className="flex items-center gap-1">
              <Battery className="w-4 h-4 text-blue-500" />
              <span>{booking.currentBattery}% → {booking.targetBattery}%</span>
            </div>
          </div>
          <span className="font-medium text-primary">
            {formatCurrency(booking.estimatedCost)}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
        <Calendar className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-blue-950 dark:to-green-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="p-2 hover:bg-primary/10 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{translations.title}</h1>
              <p className="text-sm text-muted-foreground">
                {language === 'vi' ? 'Quản lý các đặt chỗ trạm sạc của bạn' : 'Manage your charging station bookings'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-gray-900">
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {translations.upcoming}
              {upcomingBookings.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                  {upcomingBookings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              {translations.active}
              {activeBookings.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                  {activeBookings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {translations.history}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            ) : (
              <EmptyState message={translations.noBookings} />
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {activeBookings.length > 0 ? (
              activeBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            ) : (
              <EmptyState message={language === 'vi' ? 'Không có phiên sạc nào đang hoạt động' : 'No active charging sessions'} />
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {historyBookings.length > 0 ? (
              historyBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            ) : (
              <EmptyState message={language === 'vi' ? 'Chưa có lịch sử đặt ch��' : 'No booking history'} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}