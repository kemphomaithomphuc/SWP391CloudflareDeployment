import { createNotification } from './api';

export interface NotificationData {
  title: string;
  content: string;
  type: 'booking' | 'payment' | 'issue' | 'penalty' | 'general' | 'invoice' | 'late_arrival' | 'charging_complete' | 'overstay_warning' | 'report_success' | 'booking_confirmed';
}

export class NotificationService {
  /**
   * Create a notification for booking confirmation
   */
  static async createBookingConfirmationNotification(
    stationName: string, 
    timeSlot: string, 
    language: 'en' | 'vi' = 'en'
  ): Promise<void> {
    try {
      await createNotification({
        title: language === 'vi' ? 'Đặt chỗ thành công' : 'Booking Confirmed',
        content: language === 'vi' 
          ? `Đặt chỗ sạc xe tại ${stationName} đã được xác nhận. Thời gian: ${timeSlot}`
          : `Your charging slot at ${stationName} has been reserved. Time: ${timeSlot}`,
        type: 'booking_confirmed'
      });
    } catch (error) {
      console.error('Failed to create booking confirmation notification:', error);
    }
  }

  /**
   * Create a notification for charging session started
   */
  static async createChargingStartedNotification(
    stationName: string,
    language: 'en' | 'vi' = 'en'
  ): Promise<void> {
    try {
      await createNotification({
        title: language === 'vi' ? 'Phiên sạc bắt đầu' : 'Charging Session Started',
        content: language === 'vi'
          ? `Phiên sạc tại ${stationName} đã bắt đầu. Vui lòng cắm xe vào trạm sạc.`
          : `Your charging session at ${stationName} has started. Please plug in your vehicle.`,
        type: 'charging_complete'
      });
    } catch (error) {
      console.error('Failed to create charging started notification:', error);
    }
  }

  /**
   * Create a notification for charging session completed
   */
  static async createChargingCompletedNotification(
    stationName: string,
    batteryLevel: number,
    language: 'en' | 'vi' = 'en'
  ): Promise<void> {
    try {
      await createNotification({
        title: language === 'vi' ? 'Phiên sạc hoàn thành' : 'Charging Session Completed',
        content: language === 'vi'
          ? `Phiên sạc tại ${stationName} đã hoàn thành. Pin đã sạc ${batteryLevel}%.`
          : `Your charging session at ${stationName} is complete. Battery charged to ${batteryLevel}%.`,
        type: 'charging_complete'
      });
    } catch (error) {
      console.error('Failed to create charging completed notification:', error);
    }
  }

  /**
   * Create a notification for payment success
   */
  static async createPaymentSuccessNotification(
    amount: number,
    sessionId: string,
    language: 'en' | 'vi' = 'en'
  ): Promise<void> {
    try {
      await createNotification({
        title: language === 'vi' ? 'Thanh toán thành công' : 'Payment Successful',
        content: language === 'vi'
          ? `Thanh toán ${amount.toLocaleString()} VND cho phiên sạc ${sessionId} đã thành công.`
          : `Payment of ${amount.toLocaleString()} VND for session ${sessionId} was successful.`,
        type: 'payment'
      });
    } catch (error) {
      console.error('Failed to create payment success notification:', error);
    }
  }

  /**
   * Create a notification for wallet top-up
   */
  static async createWalletTopUpNotification(
    amount: number,
    newBalance: number,
    language: 'en' | 'vi' = 'en'
  ): Promise<void> {
    try {
      await createNotification({
        title: language === 'vi' ? 'Nạp tiền thành công' : 'Wallet Top-up Successful',
        content: language === 'vi'
          ? `Đã nạp ${amount.toLocaleString()} VND vào ví thành công. Số dư hiện tại: ${newBalance.toLocaleString()} VND`
          : `Successfully topped up ${amount.toLocaleString()} VND to your wallet. Current balance: ${newBalance.toLocaleString()} VND`,
        type: 'payment'
      });
    } catch (error) {
      console.error('Failed to create wallet top-up notification:', error);
    }
  }

  /**
   * Create a notification for penalty fee
   */
  static async createPenaltyNotification(
    penaltyAmount: number,
    reason: string,
    language: 'en' | 'vi' = 'en'
  ): Promise<void> {
    try {
      await createNotification({
        title: language === 'vi' ? 'Phí phạt' : 'Penalty Fee',
        content: language === 'vi'
          ? `${reason}. Phí phạt: ${penaltyAmount.toLocaleString()} VND`
          : `${reason}. Penalty fee: ${penaltyAmount.toLocaleString()} VND`,
        type: 'penalty'
      });
    } catch (error) {
      console.error('Failed to create penalty notification:', error);
    }
  }

  /**
   * Create a notification for system maintenance
   */
  static async createMaintenanceNotification(
    maintenanceTime: string,
    language: 'en' | 'vi' = 'en'
  ): Promise<void> {
    try {
      await createNotification({
        title: language === 'vi' ? 'Bảo trì hệ thống' : 'System Maintenance',
        content: language === 'vi'
          ? `Hệ thống sẽ bảo trì từ ${maintenanceTime}. Một số tính năng có thể tạm thời không khả dụng.`
          : `System maintenance scheduled from ${maintenanceTime}. Some features may be temporarily unavailable.`,
        type: 'general'
      });
    } catch (error) {
      console.error('Failed to create maintenance notification:', error);
    }
  }

  /**
   * Create a notification for special promotion
   */
  static async createPromotionNotification(
    discountPercent: number,
    validUntil: string,
    language: 'en' | 'vi' = 'en'
  ): Promise<void> {
    try {
      await createNotification({
        title: language === 'vi' ? 'Khuyến mãi đặc biệt' : 'Special Promotion',
        content: language === 'vi'
          ? `Giảm ${discountPercent}% cho tất cả phiên sạc! Áp dụng đến ${validUntil}`
          : `${discountPercent}% off all charging sessions! Valid until ${validUntil}`,
        type: 'general'
      });
    } catch (error) {
      console.error('Failed to create promotion notification:', error);
    }
  }

  /**
   * Create a notification for report submission success
   */
  static async createReportSuccessNotification(
    reportType: string,
    language: 'en' | 'vi' = 'en'
  ): Promise<void> {
    try {
      await createNotification({
        title: language === 'vi' ? 'Báo cáo đã gửi' : 'Report Submitted',
        content: language === 'vi'
          ? `Báo cáo ${reportType} đã được gửi thành công. Chúng tôi sẽ xem xét và phản hồi sớm nhất.`
          : `Your ${reportType} report has been submitted successfully. We will review and respond as soon as possible.`,
        type: 'report_success'
      });
    } catch (error) {
      console.error('Failed to create report success notification:', error);
    }
  }
}

export default NotificationService;

