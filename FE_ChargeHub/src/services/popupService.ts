import { toast } from 'sonner';

export interface PopupOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export class PopupService {
  /**
   * Show booking failure popup
   */
  static showBookingFailure(
    reason: string,
    language: 'en' | 'vi' = 'en',
    options?: PopupOptions
  ): void {
    toast.error(
      language === 'vi' ? 'Đặt chỗ thất bại' : 'Booking Failed',
      {
        description: reason,
        duration: options?.duration || 5000,
        action: options?.action ? {
          label: options.action.label,
          onClick: options.action.onClick
        } : undefined
      }
    );
  }

  /**
   * Show payment failure popup
   */
  static showPaymentFailure(
    reason: string,
    language: 'en' | 'vi' = 'en',
    options?: PopupOptions
  ): void {
    toast.error(
      language === 'vi' ? 'Thanh toán thất bại' : 'Payment Failed',
      {
        description: reason,
        duration: options?.duration || 5000,
        action: options?.action ? {
          label: options.action.label,
          onClick: options.action.onClick
        } : undefined
      }
    );
  }

  /**
   * Show charging failure popup
   */
  static showChargingFailure(
    reason: string,
    language: 'en' | 'vi' = 'en',
    options?: PopupOptions
  ): void {
    toast.error(
      language === 'vi' ? 'Sạc xe thất bại' : 'Charging Failed',
      {
        description: reason,
        duration: options?.duration || 5000,
        action: options?.action ? {
          label: options.action.label,
          onClick: options.action.onClick
        } : undefined
      }
    );
  }

  /**
   * Show connection failure popup
   */
  static showConnectionFailure(
    language: 'en' | 'vi' = 'en',
    options?: PopupOptions
  ): void {
    toast.error(
      language === 'vi' ? 'Lỗi kết nối' : 'Connection Error',
      {
        description: language === 'vi' 
          ? 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.'
          : 'Unable to connect to server. Please check your internet connection.',
        duration: options?.duration || 5000,
        action: options?.action ? {
          label: options.action.label,
          onClick: options.action.onClick
        } : undefined
      }
    );
  }

  /**
   * Show validation error popup
   */
  static showValidationError(
    field: string,
    language: 'en' | 'vi' = 'en',
    options?: PopupOptions
  ): void {
    toast.error(
      language === 'vi' ? 'Lỗi xác thực' : 'Validation Error',
      {
        description: language === 'vi' 
          ? `Vui lòng kiểm tra thông tin ${field}`
          : `Please check your ${field} information`,
        duration: options?.duration || 4000,
        action: options?.action ? {
          label: options.action.label,
          onClick: options.action.onClick
        } : undefined
      }
    );
  }

  /**
   * Show session timeout popup
   */
  static showSessionTimeout(
    language: 'en' | 'vi' = 'en',
    options?: PopupOptions
  ): void {
    toast.error(
      language === 'vi' ? 'Phiên đã hết hạn' : 'Session Expired',
      {
        description: language === 'vi' 
          ? 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.'
          : 'Your login session has expired. Please log in again.',
        duration: options?.duration || 6000,
        action: options?.action ? {
          label: options.action.label,
          onClick: options.action.onClick
        } : undefined
      }
    );
  }

  /**
   * Show insufficient balance popup
   */
  static showInsufficientBalance(
    requiredAmount: number,
    currentBalance: number,
    language: 'en' | 'vi' = 'en',
    options?: PopupOptions
  ): void {
    toast.error(
      language === 'vi' ? 'Số dư không đủ' : 'Insufficient Balance',
      {
        description: language === 'vi' 
          ? `Cần ${requiredAmount.toLocaleString()} VND nhưng chỉ có ${currentBalance.toLocaleString()} VND. Vui lòng nạp thêm tiền.`
          : `Required ${requiredAmount.toLocaleString()} VND but only have ${currentBalance.toLocaleString()} VND. Please top up your wallet.`,
        duration: options?.duration || 6000,
        action: options?.action ? {
          label: options.action.label,
          onClick: options.action.onClick
        } : undefined
      }
    );
  }

  /**
   * Show station unavailable popup
   */
  static showStationUnavailable(
    stationName: string,
    language: 'en' | 'vi' = 'en',
    options?: PopupOptions
  ): void {
    toast.error(
      language === 'vi' ? 'Trạm không khả dụng' : 'Station Unavailable',
      {
        description: language === 'vi' 
          ? `Trạm ${stationName} hiện không khả dụng. Vui lòng chọn trạm khác.`
          : `Station ${stationName} is currently unavailable. Please select another station.`,
        duration: options?.duration || 5000,
        action: options?.action ? {
          label: options.action.label,
          onClick: options.action.onClick
        } : undefined
      }
    );
  }

  /**
   * Show vehicle not compatible popup
   */
  static showVehicleNotCompatible(
    vehicleModel: string,
    stationName: string,
    language: 'en' | 'vi' = 'en',
    options?: PopupOptions
  ): void {
    toast.error(
      language === 'vi' ? 'Xe không tương thích' : 'Vehicle Not Compatible',
      {
        description: language === 'vi' 
          ? `${vehicleModel} không tương thích với trạm ${stationName}. Vui lòng chọn trạm khác.`
          : `${vehicleModel} is not compatible with station ${stationName}. Please select another station.`,
        duration: options?.duration || 5000,
        action: options?.action ? {
          label: options.action.label,
          onClick: options.action.onClick
        } : undefined
      }
    );
  }

  /**
   * Show general error popup
   */
  static showError(
    title: string,
    message: string,
    options?: PopupOptions
  ): void {
    toast.error(title, {
      description: message,
      duration: options?.duration || 5000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined
    });
  }

  /**
   * Show success popup
   */
  static showSuccess(
    title: string,
    message: string,
    options?: PopupOptions
  ): void {
    toast.success(title, {
      description: message,
      duration: options?.duration || 3000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined
    });
  }

  /**
   * Show info popup
   */
  static showInfo(
    title: string,
    message: string,
    options?: PopupOptions
  ): void {
    toast.info(title, {
      description: message,
      duration: options?.duration || 4000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined
    });
  }

  /**
   * Show warning popup
   */
  static showWarning(
    title: string,
    message: string,
    options?: PopupOptions
  ): void {
    toast(title, {
      icon: "⚠️",
      description: message,
      duration: options?.duration || 4000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined
    });
  }
}

export default PopupService;

