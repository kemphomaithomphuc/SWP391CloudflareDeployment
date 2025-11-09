package swp391.code.swp391.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import swp391.code.swp391.dto.*;
import swp391.code.swp391.entity.*;
import swp391.code.swp391.exception.ApiRequestException;
import swp391.code.swp391.repository.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    // Thời gian sạc tối thiểu (phút) - có thể đổi thành @Value nếu cần config từ application.properties
    private static final int MINIMUM_CHARGING_TIME_MINUTES = 30;

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final FeeRepository feeRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final FeeCalculationService feeCalculationService;
    private final NotificationService notificationService;
    private final VNPayService vnPayService;
    private final JavaMailSender mailSender;
    private final PenaltyService penaltyService;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Override
    public BigDecimal calculatePaymentAmount(Long sessionId, Long userId) {
        log.info("Đang tính toán số tiền thanh toán cho session: {}, user: {}", sessionId, userId);

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phien sạc với ID: " + sessionId));

        // Kiểm tra session đã hoàn thành chưa
        if (session.getStatus() != Session.SessionStatus.COMPLETED) {
            throw new RuntimeException("Phiên sạc chưa hoàn thành, không thể thanh toán");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        // Bước 1: Tính chi phí cơ bản (baseCost)
        BigDecimal baseCost = calculateBaseCost(session, user);

        // Bước 2: Tính tổng các khoản phí
        List<Fee> fees = feeCalculationService.getSessionFees(sessionId);
        BigDecimal totalFees = feeCalculationService.calculateTotalFees(fees);

        // Tổng số tiền = baseCost + totalFees
        BigDecimal totalAmount = baseCost.add(totalFees);

        log.info("Tính toán hoàn tất - Base Cost: {}, Total Fees: {}, Total Amount: {}",
                baseCost, totalFees, totalAmount);

        return totalAmount.setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Tính chi phí cơ bản của phiên sạc
     * Công thức: powerConsumed × basePrice × (1 - subscriptionDiscount)
     *
     * ÁP DỤNG THỜI GIAN SẠC TỐI THIỂU:
     * - Nếu thời gian sạc < minimum (mặc định 30 phút), tính theo minimum
     * - Nếu thời gian sạc >= minimum, tính như bình thường
     */
    private BigDecimal calculateBaseCost(Session session, User user) {
        // 1. Lấy lượng điện tiêu thụ thực tế (kWh)
        BigDecimal actualPowerConsumed = BigDecimal.valueOf(session.getPowerConsumed());

        // 2. Lấy giá cơ bản từ ConnectorType (VND/kWh)
        BigDecimal basePrice = getBasePrice(session);

        // 3. Áp dụng thời gian sạc tối thiểu
        BigDecimal billablePowerConsumed = applyMinimumChargingTime(session, actualPowerConsumed);

        // 4. Lấy giảm giá theo gói đăng ký (subscriptionDiscount)
        BigDecimal subscriptionDiscount = getSubscriptionDiscount(user);

        // Tính toán: billablePowerConsumed × basePrice × (1 - subscriptionDiscount)
        // ĐÃ XÓA: priceFactor không còn được áp dụng
        BigDecimal baseCost = billablePowerConsumed
                .multiply(basePrice)
                .multiply(BigDecimal.ONE.subtract(subscriptionDiscount))
                .setScale(2, RoundingMode.HALF_UP);

        log.info("Chi tiết tính baseCost - Actual Power: {} kWh, Billable Power: {} kWh, BasePrice: {} VND/kWh, Discount: {}%, Result: {} VND",
                actualPowerConsumed, billablePowerConsumed, basePrice, subscriptionDiscount.multiply(new BigDecimal("100")), baseCost);

        return baseCost;
    }

    private BigDecimal applyMinimumChargingTime(Session session, BigDecimal actualPowerConsumed) {
        if (session.getStartTime() == null || session.getEndTime() == null) {
            return actualPowerConsumed;
        }
        long actualMinutes = java.time.Duration.between(session.getStartTime(), session.getEndTime()).toMinutes();
        int minimumMinutes = MINIMUM_CHARGING_TIME_MINUTES;

        if (actualMinutes >= minimumMinutes) {
            return actualPowerConsumed;
        }

        BigDecimal ratio = BigDecimal.valueOf(minimumMinutes)
                .divide(BigDecimal.valueOf(actualMinutes), 4, RoundingMode.HALF_UP);

        BigDecimal billablePowerConsumed = actualPowerConsumed.multiply(ratio)
                .setScale(3, RoundingMode.HALF_UP);
        return billablePowerConsumed;
    }

    /**
     * Lấy giá cơ bản từ ConnectorType
     */
    private BigDecimal getBasePrice(Session session) {
        if (session.getOrder() == null ||
                session.getOrder().getChargingPoint() == null ||
                session.getOrder().getChargingPoint().getConnectorType() == null) {
            throw new RuntimeException("Không tìm thấy thông tin ConnectorType cho session");
        }

        Double pricePerKWh = session.getOrder().getChargingPoint()
                .getConnectorType().getPricePerKWh();

        return BigDecimal.valueOf(pricePerKWh);
    }



    /**
     * Lấy mức giảm giá theo gói đăng ký
     * - BASIC: 0% (không giảm giá)
     * - PLUS: 10% (giảm 10%)
     * - PREMIUM: 20% (giảm 20%)
     */
    private BigDecimal getSubscriptionDiscount(User user) {
        List<Subscription> subscriptions = subscriptionRepository.findByUserAndEndDateAfter(
                user, LocalDateTime.now());

        if (subscriptions.isEmpty()) {
            log.info("Người dùng không có gói đăng ký - không giảm giá");
            return BigDecimal.ZERO;
        }

        // Lấy gói đăng ký cao nhất
        Subscription activeSubscription = subscriptions.stream()
                .max((s1, s2) -> s1.getType().compareTo(s2.getType()))
                .orElse(null);

        if (activeSubscription == null) {
            return BigDecimal.ZERO;
        }

        BigDecimal discount = switch (activeSubscription.getType()) {
            case PREMIUM -> new BigDecimal("0.20"); // 20%
            case PLUS -> new BigDecimal("0.10");    // 10%
            case BASIC -> BigDecimal.ZERO;          // 0%
        };

        log.info("Áp dụng giảm giá gói {}: {}%",
                activeSubscription.getType(),
                discount.multiply(new BigDecimal("100")));

        return discount;
    }

    @Override
    public PaymentDetailDTO getPaymentDetail(Long sessionId, Long userId) {
        log.info("Lấy chi tiết thanh toán cho session: {}, user: {}", sessionId, userId);

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên sạc"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        // Tính toán các giá trị
        BigDecimal basePrice = getBasePrice(session);
        BigDecimal subscriptionDiscount = getSubscriptionDiscount(user);
        BigDecimal baseCost = calculateBaseCost(session, user);

        List<Fee> fees = feeCalculationService.getSessionFees(sessionId);
        BigDecimal totalFees = feeCalculationService.calculateTotalFees(fees);

        List<FeeDetailDTO> feeDetails = fees.stream()
                .map(fee -> FeeDetailDTO.builder()
                        .feeType(fee.getType())
                        .amount(fee.getAmount())
                        .description(fee.getDescription())
                        .build())
                .collect(Collectors.toList());

        BigDecimal totalAmount = baseCost.add(totalFees);

        // Lấy thông tin trạm sạc
        String stationName = "N/A";
        String stationAddress = "N/A";
        if (session.getOrder() != null &&
                session.getOrder().getChargingPoint() != null &&
                session.getOrder().getChargingPoint().getStation() != null) {
            ChargingStation station = session.getOrder().getChargingPoint().getStation();
            stationName = station.getStationName();
            stationAddress = station.getAddress();
        }

        return PaymentDetailDTO.builder()
                .userName(user.getFullName())
                .userEmail(user.getEmail())
                .stationName(stationName)
                .stationAddress(stationAddress)
                .sessionStartTime(session.getStartTime())
                .sessionEndTime(session.getEndTime())
                .powerConsumed(BigDecimal.valueOf(session.getPowerConsumed()))
                .basePrice(basePrice)
                // ĐÃ XÓA: .priceFactor(priceFactor)
                .subscriptionDiscount(subscriptionDiscount)
                .baseCost(baseCost)
                .fees(feeDetails)
                .totalFees(totalFees)
                .totalAmount(totalAmount)
                .build();
    }

    @Override
    @Transactional
    public PaymentResponseDTO createPayment(PaymentRequestDTO request) {
        log.info("Khởi tạo thanh toán - Session: {}, User: {}, Method: {}",
                request.getSessionId(), request.getUserId(), request.getPaymentMethod());

        // Kiểm tra session
        Session session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phien sạc"));

        if (session.getStatus() != Session.SessionStatus.COMPLETED) {
            throw new RuntimeException("Phiên sạc chưa hoàn thành, không thể thanh toán");
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        // Tính số tiền thanh toán
        BigDecimal amount = calculatePaymentAmount(request.getSessionId(), request.getUserId());

        // Tạo Transaction với trạng thái PENDING
        Transaction transaction = new Transaction();
        transaction.setSession(session);
        transaction.setUser(user);
        transaction.setAmount(amount.doubleValue());
        transaction.setPaymentMethod(request.getPaymentMethod());
        transaction.setStatus(Transaction.Status.PENDING);

        transaction = transactionRepository.save(transaction);

        // Xử lý theo phương thức thanh toán
        if (request.getPaymentMethod() == Transaction.PaymentMethod.CASH) {
            return processCashPayment(request.getSessionId(), request.getUserId());
        } else if (request.getPaymentMethod() == Transaction.PaymentMethod.VNPAY) {
            // Tạo URL thanh toán VNPay
            String paymentUrl = vnPayService.createPaymentUrl(
                    transaction.getTransactionId(),
                    amount,
                    "Thanh toan phien sac #" + session.getSessionId(),
                    request.getReturnUrl(),
                    request.getBankCode()
            );

            return PaymentResponseDTO.builder()
                    .transactionId(transaction.getTransactionId())
                    .sessionId(session.getSessionId())
                    .amount(amount)
                    .paymentMethod(Transaction.PaymentMethod.VNPAY)
                    .status(Transaction.Status.PENDING)
                    .message("Đang chuyển hướng đến cổng thanh toán VNPay")
                    .paymentUrl(paymentUrl)
                    .createdAt(LocalDateTime.now())
                    .build();
        }

        throw new RuntimeException("Phương thức thanh toán không được hỗ trợ");
    }

    @Override
    @Transactional
    public PaymentResponseDTO processCashPayment(Long sessionId, Long userId) {
        log.info("Xử lý thanh toán tiền mặt - Session: {}, User: {}", sessionId, userId);

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên sạc"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        BigDecimal amount = calculatePaymentAmount(sessionId, userId);

        // Tìm hoặc tạo transaction
        Transaction transaction = transactionRepository
                .findBySessionAndUser(session, user)
                .orElseGet(() -> {
                    Transaction newTrans = new Transaction();
                    newTrans.setSession(session);
                    newTrans.setUser(user);
                    newTrans.setAmount(amount.doubleValue());
                    newTrans.setPaymentMethod(Transaction.PaymentMethod.CASH);
                    newTrans.setStatus(Transaction.Status.PENDING);
                    return transactionRepository.save(newTrans);
                });

        // Cập nhật trạng thái thành công
        transaction.setStatus(Transaction.Status.SUCCESS);
        transactionRepository.save(transaction);

        // Đánh dấu các khoản phí đã thanh toán
        List<Fee> fees = feeCalculationService.getSessionFees(sessionId);
        fees.forEach(fee -> {
            fee.setIsPaid(true);
            feeRepository.save(fee);
        });

        // Gọi completePayment để thực hiện logic chung (auto-unlock, notifications, etc.)
        completePayment(transaction.getTransactionId());

        PaymentDetailDTO paymentDetail = getPaymentDetail(sessionId, userId);

        return PaymentResponseDTO.builder()
                .transactionId(transaction.getTransactionId())
                .sessionId(sessionId)
                .amount(amount)
                .paymentMethod(Transaction.PaymentMethod.CASH)
                .status(Transaction.Status.SUCCESS)
                .message("Thanh toán tiền mặt thành công")
                .createdAt(LocalDateTime.now())
                .paymentDetail(paymentDetail)
                .build();
    }

    // ============================================================
    // ========== RETRY PAYMENT - THANH TOÁN LẠI ================
    // ============================================================

    @Override
    @Transactional
    public RetryPaymentResponseDTO retryPayment(RetryPaymentRequestDTO request) {
        log.info("🔄 Retry payment - TransactionId: {}, UserId: {}, PaymentMethod: {}",
                request.getTransactionId(), request.getUserId(), request.getPaymentMethod());

        // ===== 1. VALIDATE TRANSACTION =====
        Transaction transaction = transactionRepository.findById(request.getTransactionId())
                .orElseThrow(() -> new ApiRequestException("Không tìm thấy giao dịch #" + request.getTransactionId()));

        // Kiểm tra transaction phải có status FAILED
        if (transaction.getStatus() != Transaction.Status.FAILED) {
            throw new ApiRequestException("Chỉ có thể thanh toán lại các giao dịch thất bại. " +
                    "Trạng thái hiện tại: " + transaction.getStatus());
        }

        // ===== 2. VALIDATE USER =====
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ApiRequestException("Không tìm thấy người dùng #" + request.getUserId()));

        // Kiểm tra transaction có thuộc về user này không
        if (!transaction.getUser().getUserId().equals(user.getUserId())) {
            throw new ApiRequestException("Bạn không có quyền thanh toán giao dịch này");
        }

        // ===== 3. LẤY THÔNG TIN SESSION =====
        Session session = transaction.getSession();
        if (session == null) {
            throw new ApiRequestException("Không tìm thấy phiên sạc cho giao dịch này");
        }

        BigDecimal amount = BigDecimal.valueOf(transaction.getAmount());

        log.info("Transaction #{} - Amount: {}, Session: {}",
                transaction.getTransactionId(), amount, session.getSessionId());

        // ===== 4. XỬ LÝ THEO PHƯƠNG THỨC THANH TOÁN =====
        if (request.getPaymentMethod() == Transaction.PaymentMethod.CASH) {
            return retryPaymentWithCash(transaction, user, amount);
        } else if (request.getPaymentMethod() == Transaction.PaymentMethod.VNPAY) {
            return retryPaymentWithVNPay(transaction, user, amount, request.getReturnUrl(), request.getBankCode());
        } else if (request.getPaymentMethod() == Transaction.PaymentMethod.QR) {
            throw new ApiRequestException("Phương thức thanh toán QR chưa được hỗ trợ");
        }

        throw new ApiRequestException("Phương thức thanh toán không hợp lệ");
    }

    /**
     * Retry payment với CASH
     * Changed from private to protected to allow @Transactional
     */
    @Transactional
    protected RetryPaymentResponseDTO retryPaymentWithCash(Transaction transaction, User user, BigDecimal amount) {
        log.info("🔄 Retry payment with CASH - TransactionId: {}", transaction.getTransactionId());

        // Cập nhật payment method và status
        transaction.setPaymentMethod(Transaction.PaymentMethod.CASH);
        transaction.setStatus(Transaction.Status.SUCCESS);
        transaction.setPaymentTime(LocalDateTime.now());
        transactionRepository.save(transaction);

        // Đánh dấu các khoản phí đã thanh toán
        List<Fee> fees = feeCalculationService.getSessionFees(transaction.getSession().getSessionId());
        fees.forEach(fee -> {
            fee.setIsPaid(true);
            feeRepository.save(fee);
        });

        // Gọi completePayment để thực hiện logic chung (auto-unlock, notifications, etc.)
        completePayment(transaction.getTransactionId());

        PaymentDetailDTO paymentDetail = getPaymentDetail(
                transaction.getSession().getSessionId(),
                user.getUserId()
        );

        log.info("✅ Retry payment with CASH successful - TransactionId: {}", transaction.getTransactionId());

        return RetryPaymentResponseDTO.builder()
                .transactionId(transaction.getTransactionId())
                .sessionId(transaction.getSession().getSessionId())
                .amount(amount)
                .paymentMethod(Transaction.PaymentMethod.CASH)
                .status(Transaction.Status.SUCCESS)
                .message("Thanh toán lại bằng tiền mặt thành công")
                .createdAt(LocalDateTime.now())
                .paymentDetail(paymentDetail)
                .build();
    }

    /**
     * Retry payment với VNPAY
     * Changed from private to protected to allow @Transactional
     */
    @Transactional
    protected RetryPaymentResponseDTO retryPaymentWithVNPay(
            Transaction transaction,
            User user,
            BigDecimal amount,
            String returnUrl,
            String bankCode) {

        log.info("🔄 Retry payment with VNPAY - TransactionId: {}", transaction.getTransactionId());

        // Cập nhật payment method và reset status về PENDING
        transaction.setPaymentMethod(Transaction.PaymentMethod.VNPAY);
        transaction.setStatus(Transaction.Status.PENDING);
        transactionRepository.save(transaction);

        // Tạo URL thanh toán VNPay
        String paymentUrl = vnPayService.createPaymentUrl(
                transaction.getTransactionId(),
                amount,
                "Thanh toan lai phien sac #" + transaction.getSession().getSessionId(),
                returnUrl,
                bankCode
        );

        log.info("✅ Retry payment URL created - TransactionId: {}", transaction.getTransactionId());

        return RetryPaymentResponseDTO.builder()
                .transactionId(transaction.getTransactionId())
                .sessionId(transaction.getSession().getSessionId())
                .amount(amount)
                .paymentMethod(Transaction.PaymentMethod.VNPAY)
                .status(Transaction.Status.PENDING)
                .message("Đang chuyển hướng đến cổng thanh toán VNPay")
                .paymentUrl(paymentUrl)
                .createdAt(LocalDateTime.now())
                .build();
    }

    // ============================================================
    // ========== END RETRY PAYMENT ==============================
    // ============================================================

    @Override
    @Transactional
    public void completePayment(Long transactionId) {
        log.info("Hoàn tất thanh toán cho transaction: {}", transactionId);

        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));

        transaction.setStatus(Transaction.Status.SUCCESS);
        transactionRepository.save(transaction);

        // Đánh dấu các khoản phí đã thanh toán
        List<Fee> fees = feeCalculationService.getSessionFees(transaction.getSession().getSessionId());
        fees.forEach(fee -> {
            fee.setIsPaid(true);
            feeRepository.save(fee);
        });

        // ============ TỰ ĐỘNG MỞ KHÓA TÀI KHOẢN ============
        Long userId = transaction.getUser().getUserId();

        // Kiểm tra và tự động mở khóa tài khoản nếu user đã thanh toán hết phí
        if (penaltyService.canUnlockUser(userId)) {
            boolean unlocked = penaltyService.unlockUserAfterPayment(userId);
            if (unlocked) {
                log.info("Auto-unlocked user account after payment: {}", userId);

                // Gửi thông báo về việc mở khóa
                notificationService.createGeneralNotification(
                        List.of(userId),
                        "Tài khoản đã được mở khóa",
                        "Tài khoản của bạn đã được mở khóa tự động sau khi thanh toán phí phạt. " +
                                "Bạn có thể tiếp tục sử dụng dịch vụ."
                );
            }
        }

        // Gửi notification
        notificationService.createPaymentNotification(
                transaction.getUser().getUserId(),
                NotificationServiceImpl.PaymentEvent.PAYMENT_SUCCESS,
                transaction.getAmount(),
                "Thanh toán thành công qua " + transaction.getPaymentMethod()
        );

        // Gửi hóa đơn
        sendInvoiceEmail(transactionId);
    }

    @Override
    @Transactional
    public void handleFailedPayment(Long transactionId, String reason) {
        log.error("Thanh toán thất bại cho transaction: {}, lý do: {}", transactionId, reason);

        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));

        transaction.setStatus(Transaction.Status.FAILED);
        transactionRepository.save(transaction);

        // Gửi notification
        notificationService.createPaymentNotification(
                transaction.getUser().getUserId(),
                NotificationServiceImpl.PaymentEvent.PAYMENT_FAILED,
                transaction.getAmount(),
                reason != null ? reason : "Thanh toán thất bại"
        );
    }

    @Override
    public void sendInvoiceEmail(Long transactionId) {
        log.info("Đang gửi hóa đơn qua email cho transaction: {}", transactionId);

        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));

        if (transaction.getStatus() != Transaction.Status.SUCCESS) {
            log.warn("Giao dịch chưa thành công, không gửi hóa đơn");
            return;
        }

        User user = transaction.getUser();
        if (user.getEmail() == null || user.getEmail().isEmpty()) {
            log.warn("Người dùng không có email, không thể gửi hóa đơn");
            return;
        }

        PaymentDetailDTO paymentDetail = getPaymentDetail(
                transaction.getSession().getSessionId(),
                user.getUserId()
        );

        paymentDetail.setPaymentMethod(transaction.getPaymentMethod().toString());
        paymentDetail.setTransactionId(transaction.getTransactionId().toString());
        paymentDetail.setPaymentTime(LocalDateTime.now());

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(user.getEmail());
            helper.setSubject("Hóa đơn thanh toán phiên sạc #" + transaction.getSession().getSessionId());
            helper.setText(buildInvoiceEmailTemplate(paymentDetail), true);

            mailSender.send(message);
            log.info("Đã gửi hóa đơn thành công đến: {}", user.getEmail());
        } catch (MessagingException e) {
            log.error("Lỗi khi gửi hóa đơn qua email: {}", e.getMessage());
            throw new RuntimeException("Không thể gửi hóa đơn qua email", e);
        }
    }

    /**
     * Tạo template HTML cho email hóa đơn
     */
    private String buildInvoiceEmailTemplate(PaymentDetailDTO detail) {
        StringBuilder feesHtml = new StringBuilder();
        if (detail.getFees() != null && !detail.getFees().isEmpty()) {
            for (FeeDetailDTO fee : detail.getFees()) {
                feesHtml.append(String.format(
                        "<tr><td>%s</td><td style='text-align: right;'>%,.0f VNĐ</td></tr>",
                        fee.getDescription(),
                        fee.getAmount()
                ));
            }
        } else {
            feesHtml.append("<tr><td colspan='2' style='text-align: center;'>Không có phí phát sinh</td></tr>");
        }

        return String.format("""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { 
            background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 10px 10px 0 0; 
        }
        .content { 
            background: #f9f9f9; 
            padding: 30px; 
            border-radius: 0 0 10px 10px; 
        }
        .invoice-box { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
            box-shadow: 0 2px 5px rgba(0,0,0,0.1); 
        }
        table { width: 100%%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .total { font-size: 18px; font-weight: bold; color: #667eea; }
        .footer { 
            text-align: center; 
            margin-top: 20px; 
            color: #666; 
            font-size: 12px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>HÓA ĐƠN THANH TOÁN</h1>
            <p>EV Charging Station Management</p>
        </div>
        <div class="content">
            <div class="invoice-box">
                <h2>Thông tin khách hàng</h2>
                <p><strong>Họ tên:</strong> %s</p>
                <p><strong>Email:</strong> %s</p>
                
                <h2>Thông tin trạm sạc</h2>
                <p><strong>Tên trạm:</strong> %s</p>
                <p><strong>Địa chỉ:</strong> %s</p>
                
                <h2>Thông tin phiên sạc</h2>
                <table>
                    <tr>
                        <td><strong>Thời gian bắt đầu:</strong></td>
                        <td>%s</td>
                    </tr>
                    <tr>
                        <td><strong>Thời gian kết thúc:</strong></td>
                        <td>%s</td>
                    </tr>
                    <tr>
                        <td><strong>Lượng điện tiêu thụ:</strong></td>
                        <td>%,.2f kWh</td>
                    </tr>
                </table>
                
                <h2>Chi tiết thanh toán</h2>
                <table>
                    <tr>
                        <td><strong>Giá cơ bản:</strong></td>
                        <td style='text-align: right;'>%,.0f VNĐ/kWh</td>
                    </tr>
                    <tr>
                        <td><strong>Giảm giá gói:</strong></td>
                        <td style='text-align: right;'>-%,.0f%%</td>
                    </tr>
                    <tr style='background-color: #f0f0f0;'>
                        <td><strong>Chi phí cơ bản:</strong></td>
                        <td style='text-align: right;'><strong>%,.0f VNĐ</strong></td>
                    </tr>
                </table>
                
                <h2>Phí phát sinh</h2>
                <table>
                    %s
                    <tr style='background-color: #f0f0f0;'>
                        <td><strong>Tổng phí:</strong></td>
                        <td style='text-align: right;'><strong>%,.0f VNĐ</strong></td>
                    </tr>
                </table>
                
                <table>
                    <tr class='total'>
                        <td>TỔNG THANH TOÁN:</td>
                        <td style='text-align: right;'>%,.0f VNĐ</td>
                    </tr>
                </table>
                
                <h2>Thông tin thanh toán</h2>
                <p><strong>Phương thức:</strong> %s</p>
                <p><strong>Mã giao dịch:</strong> %s</p>
                <p><strong>Thời gian thanh toán:</strong> %s</p>
                <p style='color: #4CAF50; font-weight: bold;'>✓ Thanh toán thành công</p>
            </div>
            
            <p style='text-align: center; color: #666;'>
                Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!
            </p>
        </div>
        <div class="footer">
            <p>© 2025 EV Charging Station Management. All rights reserved.</p>
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
    </div>
</body>
</html>
""",
                detail.getUserName(),
                detail.getUserEmail(),
                detail.getStationName(),
                detail.getStationAddress(),
                detail.getSessionStartTime(),
                detail.getSessionEndTime(),
                detail.getPowerConsumed(),
                detail.getBasePrice(),
                detail.getSubscriptionDiscount().multiply(new BigDecimal("100")),
                detail.getBaseCost(),
                feesHtml.toString(),
                detail.getTotalFees(),
                detail.getTotalAmount(),
                detail.getPaymentMethod(),
                detail.getTransactionId(),
                detail.getPaymentTime()
        );
    }

    @Override
    public Transaction getTransaction(Long transactionId) {
        return transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch với ID: " + transactionId));
    }
}