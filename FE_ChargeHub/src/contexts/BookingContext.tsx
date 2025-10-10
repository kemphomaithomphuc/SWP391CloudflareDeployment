import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Booking {
  id: string;
  stationName: string;
  stationAddress: string;
  date: string;
  time: string;
  duration: number;
  status: 'confirmed' | 'active' | 'completed' | 'cancelled';
  estimatedCost: number;
  chargerType: 'DC_FAST' | 'AC_SLOW' | 'AC_FAST';
  power: number;
  targetBattery: number;
  currentBattery: number;
  createdAt: string;
  qrCode?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  penaltyFees?: {
    lateArrival?: number;
    overstay?: number;
    total: number;
  };
}

export interface Notification {
  id: string;
  type: "invoice" | "late_arrival" | "charging_complete" | "overstay_warning" | "report_success" | "booking_confirmed";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  requiresAction?: boolean;
  actionData?: {
    sessionId: string;
    minutesLate?: number;
    penaltyAmount?: number;
    location?: string;
  };
  bookingId?: string;
}

interface BookingContextType {
  bookings: Booking[];
  notifications: Notification[];
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => void;
  updateBookingStatus: (bookingId: string, status: Booking['status']) => void;
  startChargingSession: (bookingId: string, actualStartTime: string) => void;
  endChargingSession: (bookingId: string, actualEndTime: string) => void;
  calculatePenaltyFees: (booking: Booking) => { lateArrival?: number; overstay?: number; total: number };
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  getUnreadNotificationsCount: () => number;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

interface BookingProviderProps {
  children: ReactNode;
}

export const BookingProvider: React.FC<BookingProviderProps> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: 'booking-sample-1',
      stationName: 'VinFast Charging Station',
      stationAddress: '123 Đường Nguyễn Văn Linh, Quận 7, TP.HCM',
      date: '2025-09-22',
      time: '14:30',
      duration: 45,
      status: 'confirmed',
      estimatedCost: 85000,
      chargerType: 'DC_FAST',
      power: 150,
      targetBattery: 85,
      currentBattery: 35,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      qrCode: 'VFS-150KW-001'
    },
    {
      id: 'booking-sample-2',
      stationName: 'Shell Recharge Station',
      stationAddress: '456 Đường Lê Văn Việt, Quận 9, TP.HCM',
      date: '2025-09-21',
      time: '16:45',
      duration: 60,
      status: 'active',
      estimatedCost: 120000,
      chargerType: 'DC_FAST',
      power: 200,
      targetBattery: 90,
      currentBattery: 30,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      qrCode: 'SHL-200KW-007'
    },
    {
      id: 'booking-sample-3',
      stationName: 'VinFast Charging Station',
      stationAddress: '789 Đường Võ Văn Tần, Quận 3, TP.HCM',
      date: '2025-09-20',
      time: '09:15',
      duration: 90,
      status: 'completed',
      estimatedCost: 165000,
      chargerType: 'DC_FAST',
      power: 120,
      targetBattery: 95,
      currentBattery: 20,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      qrCode: 'VFS-120KW-012'
    },
    {
      id: 'booking-sample-4',
      stationName: 'VinFast Charging Station',
      stationAddress: '321 Đường Cao Thắng, Quận 10, TP.HCM',
      date: '2025-09-23',
      time: '08:00',
      duration: 120,
      status: 'confirmed',
      estimatedCost: 200000,
      chargerType: 'DC_FAST',
      power: 180,
      targetBattery: 100,
      currentBattery: 15,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      qrCode: 'VFS-180KW-003'
    },
    {
      id: 'booking-sample-5',
      stationName: 'Shell Recharge Station',
      stationAddress: '987 Đường Phan Văn Trị, Quận Gò Vấp, TP.HCM',
      date: '2025-09-18',
      time: '19:30',
      duration: 30,
      status: 'completed',
      estimatedCost: 55000,
      chargerType: 'AC_SLOW',
      power: 7,
      targetBattery: 65,
      currentBattery: 55,
      createdAt: new Date(Date.now() - 345600000).toISOString(),
      qrCode: 'SHL-7KW-021'
    }
  ]);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'notification-sample-1',
      title: 'Đặt chỗ thành công!',
      message: 'Bạn đã đặt chỗ tại VinFast Charging Station lúc 14:30 ngày 2025-09-22. Vui lòng đến đúng giờ.',
      type: 'booking_confirmed',
      timestamp: new Date(Date.now() - 3600000).toLocaleString('vi-VN'),
      isRead: false,
      bookingId: 'booking-sample-1'
    },
    {
      id: 'notification-sample-2',
      title: 'Hóa đơn đã được gửi',
      message: 'Hóa đơn thanh toán phiên sạc tại VinFast Charging Station (165,000đ) đã được gửi đến email nguyenvana@gmail.com. Vui lòng kiểm tra hộp thư.',
      type: 'invoice',
      timestamp: new Date(Date.now() - 172800000).toLocaleString('vi-VN'),
      isRead: false,
      bookingId: 'booking-sample-3'
    },
    {
      id: 'notification-sample-3',
      title: 'Bạn đã trễ giờ đặt chỗ',
      message: 'Bạn đã trễ 15 phút so với giờ đặt chỗ tại Shell Recharge Station. Bạn có muốn hủy đặt chỗ (mất phí giữ chỗ 20,000đ) hay tiếp tục sạc (tính thêm phí trễ giờ 30,000đ)?',
      type: 'late_arrival',
      timestamp: new Date(Date.now() - 900000).toLocaleString('vi-VN'),
      isRead: false,
      requiresAction: true,
      actionData: {
        sessionId: 'booking-sample-2',
        minutesLate: 15,
        penaltyAmount: 30000,
        location: 'Shell Recharge Station'
      },
      bookingId: 'booking-sample-2'
    },
    {
      id: 'notification-sample-4',
      title: 'Phiên sạc đã hoàn thành',
      message: 'Phiên sạc tại VinFast Charging Station đã hoàn thành thành công. Pin đã được sạc từ 20% lên 95%. Cảm ơn bạn đã sử dụng dịch vụ.',
      type: 'charging_complete',
      timestamp: new Date(Date.now() - 172800000).toLocaleString('vi-VN'),
      isRead: true,
      bookingId: 'booking-sample-3'
    },
    {
      id: 'notification-sample-5',
      title: 'Báo cáo sự cố đã được gửi thành công',
      message: 'Báo cáo sự cố "Màn hình bị hỏng" tại Shell Recharge Station đã được gửi đến đội ngũ kỹ thuật. Chúng tôi sẽ xử lý trong vòng 24 giờ.',
      type: 'report_success',
      timestamp: new Date(Date.now() - 259200000).toLocaleString('vi-VN'),
      isRead: true
    },
    {
      id: 'notification-sample-6',
      title: 'Cảnh báo vượt quá thời gian',
      message: 'Bạn đã sử dụng trạm sạc vượt quá 10 phút so với thời gian đặt chỗ tại VinFast Charging Station. Phí phạt 15,000đ sẽ được tính thêm.',
      type: 'overstay_warning',
      timestamp: new Date(Date.now() - 1800000).toLocaleString('vi-VN'),
      isRead: false,
      actionData: {
        sessionId: 'booking-sample-4',
        penaltyAmount: 15000,
        location: 'VinFast Charging Station'
      },
      bookingId: 'booking-sample-4'
    },
    {
      id: 'notification-sample-7',
      title: 'Chào mừng đến với ChargeHub!',
      message: 'Cảm ơn bạn đã đăng ký sử dụng dịch vụ của chúng tôi. Hãy bắt đầu trải nghiệm sạc xe điện thông minh và tiện lợi với VinFast VF8 của bạn.',
      type: 'booking_confirmed',
      timestamp: new Date(Date.now() - 86400000).toLocaleString('vi-VN'),
      isRead: true
    }
  ]);

  const addBooking = (bookingData: Omit<Booking, 'id' | 'createdAt'>) => {
    const newBooking: Booking = {
      ...bookingData,
      id: `booking-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    setBookings(prev => [newBooking, ...prev]);
    
    // Add success notification
    addNotification({
      title: 'Đặt chỗ thành công!',
      message: `Bạn đã đặt chỗ tại ${bookingData.stationName} lúc ${bookingData.time} ngày ${bookingData.date}. Vui lòng đến đúng giờ.`,
      type: 'booking_confirmed',
      bookingId: newBooking.id
    });
  };

  const updateBookingStatus = (bookingId: string, status: Booking['status']) => {
    setBookings(prev => 
      prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status }
          : booking
      )
    );

    // Add notification for status change
    const statusMessages = {
      active: 'Phiên sạc đã bắt đầu',
      completed: 'Phiên sạc đã hoàn thành',
      cancelled: 'Đặt chỗ đã bị hủy'
    };

    if (status !== 'confirmed') {
      addNotification({
        title: 'Cập nhật trạng thái đặt chỗ',
        message: statusMessages[status] || 'Trạng thái đặt chỗ đã được cập nhật',
        type: status === 'completed' ? 'charging_complete' : 'booking_confirmed',
        bookingId
      });
    }
  };

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: `notification-${Date.now()}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      isRead: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const getUnreadNotificationsCount = () => {
    return notifications.filter(notification => !notification.isRead).length;
  };

  // Auto penalty fee calculation
  const calculatePenaltyFees = (booking: Booking) => {
    let lateArrival = 0;
    let overstay = 0;

    // Convert booking time to Date for comparison
    const scheduledDateTime = new Date(`${booking.date}T${booking.time}`);
    const actualStartTime = booking.actualStartTime ? new Date(booking.actualStartTime) : null;
    const actualEndTime = booking.actualEndTime ? new Date(booking.actualEndTime) : null;

    // Late arrival penalty (after 10 minutes grace period)
    if (actualStartTime) {
      const lateMinutes = Math.max(0, (actualStartTime.getTime() - scheduledDateTime.getTime()) / (1000 * 60) - 10);
      if (lateMinutes > 0) {
        // 2,000 VND per minute late after 10 minutes grace period
        lateArrival = Math.ceil(lateMinutes) * 2000;
      }
    }

    // Overstay penalty (after 15 minutes grace period)
    if (actualStartTime && actualEndTime) {
      const scheduledEndTime = new Date(scheduledDateTime.getTime() + booking.duration * 60 * 1000);
      const overstayMinutes = Math.max(0, (actualEndTime.getTime() - scheduledEndTime.getTime()) / (1000 * 60) - 15);
      if (overstayMinutes > 0) {
        // 1,500 VND per minute overstay after 15 minutes grace period
        overstay = Math.ceil(overstayMinutes) * 1500;
      }
    }

    return {
      ...(lateArrival > 0 && { lateArrival }),
      ...(overstay > 0 && { overstay }),
      total: lateArrival + overstay
    };
  };

  const startChargingSession = (bookingId: string, actualStartTime: string) => {
    setBookings(prev => 
      prev.map(booking => {
        if (booking.id === bookingId) {
          const updatedBooking = { 
            ...booking, 
            status: 'active' as const,
            actualStartTime 
          };
          
          // Calculate and apply late arrival penalty
          const penalties = calculatePenaltyFees(updatedBooking);
          if (penalties.lateArrival && penalties.lateArrival > 0) {
            addNotification({
              title: 'Phí trễ giờ được áp dụng',
              message: `Bạn đã trễ ${Math.ceil((new Date(actualStartTime).getTime() - new Date(`${booking.date}T${booking.time}`).getTime()) / (1000 * 60) - 10)} phút. Phí phạt ${penalties.lateArrival.toLocaleString('vi-VN')}đ đã được tự động áp dụng.`,
              type: 'late_arrival',
              requiresAction: false,
              actionData: {
                sessionId: bookingId,
                minutesLate: Math.ceil((new Date(actualStartTime).getTime() - new Date(`${booking.date}T${booking.time}`).getTime()) / (1000 * 60)),
                penaltyAmount: penalties.lateArrival,
                location: booking.stationName
              },
              bookingId
            });
          }
          
          return {
            ...updatedBooking,
            penaltyFees: penalties
          };
        }
        return booking;
      })
    );
  };

  const endChargingSession = (bookingId: string, actualEndTime: string) => {
    setBookings(prev => 
      prev.map(booking => {
        if (booking.id === bookingId) {
          const updatedBooking = { 
            ...booking, 
            status: 'completed' as const,
            actualEndTime 
          };
          
          // Calculate and apply all penalties including overstay
          const penalties = calculatePenaltyFees(updatedBooking);
          
          if (penalties.overstay && penalties.overstay > 0) {
            const scheduledDateTime = new Date(`${booking.date}T${booking.time}`);
            const scheduledEndTime = new Date(scheduledDateTime.getTime() + booking.duration * 60 * 1000);
            const overstayMinutes = Math.ceil((new Date(actualEndTime).getTime() - scheduledEndTime.getTime()) / (1000 * 60) - 15);
            
            addNotification({
              title: 'Phí vượt thời gian được áp dụng',
              message: `Bạn đã sử dụng trạm vượt ${overstayMinutes} phút so với thời gian đặt chỗ. Phí phạt ${penalties.overstay.toLocaleString('vi-VN')}đ đã được tự động áp dụng.`,
              type: 'overstay_warning',
              actionData: {
                sessionId: bookingId,
                penaltyAmount: penalties.overstay,
                location: booking.stationName
              },
              bookingId
            });
          }
          
          return {
            ...updatedBooking,
            penaltyFees: penalties
          };
        }
        return booking;
      })
    );
  };

  const value: BookingContextType = {
    bookings,
    notifications,
    addBooking,
    updateBookingStatus,
    startChargingSession,
    endChargingSession,
    calculatePenaltyFees,
    addNotification,
    markNotificationAsRead,
    getUnreadNotificationsCount
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};