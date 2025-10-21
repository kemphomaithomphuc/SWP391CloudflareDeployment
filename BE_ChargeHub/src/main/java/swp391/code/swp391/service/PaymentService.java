package swp391.code.swp391.service;

import swp391.code.swp391.dto.PaymentDetailDTO;
import swp391.code.swp391.dto.PaymentRequestDTO;
import swp391.code.swp391.dto.PaymentResponseDTO;
import swp391.code.swp391.entity.Transaction;

import java.math.BigDecimal;

public interface PaymentService {

    /**
     * Tính tổng số tiền thanh toán cho một phiên sạc
     * Công thức: baseCost + totalFees
     * Trong đó baseCost = powerConsumed × basePrice × priceFactor × (1 - subscriptionDiscount)
     */
    BigDecimal calculatePaymentAmount(Long sessionId, Long userId);

    /**
     * Lấy chi tiết thanh toán để hiển thị trước khi thanh toán
     */
    PaymentDetailDTO getPaymentDetail(Long sessionId, Long userId);

    /**
     * Khởi tạo quá trình thanh toán
     * - Với CASH: xử lý thanh toán trực tiếp
     * - Với VNPAY: trả về URL thanh toán
     */
    PaymentResponseDTO initiatePayment(PaymentRequestDTO request);

    /**
     * Xử lý thanh toán bằng tiền mặt
     */
    PaymentResponseDTO processCashPayment(Long sessionId, Long userId);

    /**
     * Hoàn tất thanh toán sau khi giao dịch thành công
     */
    void completePayment(Long transactionId);

    /**
     * Xử lý thanh toán thất bại
     */
    void handleFailedPayment(Long transactionId, String reason);

    /**
     * Gửi hóa đơn qua email sau khi thanh toán thành công
     */
    void sendInvoiceEmail(Long transactionId);

    /**
     * Lấy thông tin giao dịch theo ID
     */
    Transaction getTransaction(Long transactionId);
}