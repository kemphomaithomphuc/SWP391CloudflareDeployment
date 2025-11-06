import { useNotifications } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import NotificationService from '../services/notificationService';
import PopupService from '../services/popupService';

export const useNotificationActions = () => {
    const { createNotification } = useNotifications();
    const { language } = useLanguage();

    // Create notification for booking confirmation
    const notifyBookingConfirmation = async (stationName: string, timeSlot: string) => {
        await NotificationService.createBookingConfirmationNotification(stationName, timeSlot, language);
    };

    // Create notification for charging started
    const notifyChargingStarted = async (stationName: string) => {
        await NotificationService.createChargingStartedNotification(stationName, language);
    };

    // Create notification for charging completed
    const notifyChargingCompleted = async (stationName: string, batteryLevel: number) => {
        await NotificationService.createChargingCompletedNotification(stationName, batteryLevel, language);
    };

    // Create notification for payment success
    const notifyPaymentSuccess = async (amount: number, sessionId: string) => {
        await NotificationService.createPaymentSuccessNotification(amount, sessionId, language);
    };

    // Create notification for wallet top-up
    const notifyWalletTopUp = async (amount: number, newBalance: number) => {
        await NotificationService.createWalletTopUpNotification(amount, newBalance, language);
    };

    // Create notification for penalty
    const notifyPenalty = async (penaltyAmount: number, reason: string) => {
        await NotificationService.createPenaltyNotification(penaltyAmount, reason, language);
    };

    // Create notification for maintenance
    const notifyMaintenance = async (maintenanceTime: string) => {
        await NotificationService.createMaintenanceNotification(maintenanceTime, language);
    };

    // Create notification for promotion
    const notifyPromotion = async (discountPercent: number, validUntil: string) => {
        await NotificationService.createPromotionNotification(discountPercent, validUntil, language);
    };

    // Create notification for report success
    const notifyReportSuccess = async (reportType: string) => {
        await NotificationService.createReportSuccessNotification(reportType, language);
    };

    // Show popup for booking failure
    const showBookingFailure = (reason: string, options?: any) => {
        PopupService.showBookingFailure(reason, language, options);
    };

    // Show popup for payment failure
    const showPaymentFailure = (reason: string, options?: any) => {
        PopupService.showPaymentFailure(reason, language, options);
    };

    // Show popup for charging failure
    const showChargingFailure = (reason: string, options?: any) => {
        PopupService.showChargingFailure(reason, language, options);
    };

    // Show popup for connection failure
    const showConnectionFailure = (options?: any) => {
        PopupService.showConnectionFailure(language, options);
    };

    // Show popup for validation error
    const showValidationError = (field: string, options?: any) => {
        PopupService.showValidationError(field, language, options);
    };

    // Show popup for session timeout
    const showSessionTimeout = (options?: any) => {
        PopupService.showSessionTimeout(language, options);
    };

    // Show popup for insufficient balance
    const showInsufficientBalance = (requiredAmount: number, currentBalance: number, options?: any) => {
        PopupService.showInsufficientBalance(requiredAmount, currentBalance, language, options);
    };

    // Show popup for station unavailable
    const showStationUnavailable = (stationName: string, options?: any) => {
        PopupService.showStationUnavailable(stationName, language, options);
    };

    // Show popup for vehicle not compatible
    const showVehicleNotCompatible = (vehicleModel: string, stationName: string, options?: any) => {
        PopupService.showVehicleNotCompatible(vehicleModel, stationName, language, options);
    };

    // Show general error popup
    const showError = (title: string, message: string, options?: any) => {
        PopupService.showError(title, message, options);
    };

    // Show success popup
    const showSuccess = (title: string, message: string, options?: any) => {
        PopupService.showSuccess(title, message, options);
    };

    // Show info popup
    const showInfo = (title: string, message: string, options?: any) => {
        PopupService.showInfo(title, message, options);
    };

    // Show warning popup
    const showWarning = (title: string, message: string, options?: any) => {
        PopupService.showWarning(title, message, options);
    };

    return {
        // Notification functions (save to database)
        notifyBookingConfirmation,
        notifyChargingStarted,
        notifyChargingCompleted,
        notifyPaymentSuccess,
        notifyWalletTopUp,
        notifyPenalty,
        notifyMaintenance,
        notifyPromotion,
        notifyReportSuccess,

        // Popup functions (temporary display)
        showBookingFailure,
        showPaymentFailure,
        showChargingFailure,
        showConnectionFailure,
        showValidationError,
        showSessionTimeout,
        showInsufficientBalance,
        showStationUnavailable,
        showVehicleNotCompatible,
        showError,
        showSuccess,
        showInfo,
        showWarning,
    };
};

export default useNotificationActions;





























































