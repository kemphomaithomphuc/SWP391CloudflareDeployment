package swp391.code.swp391.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import swp391.code.swp391.dto.APIResponse;
import swp391.code.swp391.dto.FeeDetailDTO;
import swp391.code.swp391.entity.Fee;
import swp391.code.swp391.entity.Transaction;
import swp391.code.swp391.entity.User;
import swp391.code.swp391.repository.TransactionRepository;
import swp391.code.swp391.repository.UserRepository;
import swp391.code.swp391.service.PenaltyService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controller cho Penalty/Fee Management
 *
 * Endpoints:
 * - GET /api/penalties/user/{userId}/history - AC6: Xem lịch sử phí của user
 * - GET /api/penalties/session/{sessionId}/details - AC6: Xem chi tiết phí của session
 * - GET /api/penalties/user/{userId}/unpaid - Lấy fees chưa thanh toán
 * - POST /api/penalties/cancel/{orderId} - AC1: Hủy order (có thể có phí)
 * - GET /api/penalties/session/{sessionId}/total - AC4: Tính tổng số tiền thanh toán
 */
@RestController
@RequestMapping("/api/penalties")
@RequiredArgsConstructor
@Slf4j
public class PenaltyController {

    private final PenaltyService penaltyService;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    /**
     * AC6: Lấy lịch sử phí phạt của user
     * Hiển thị: loại phí, số tiền, lý do, thời gian
     */
    @GetMapping("/user/{userId}/history")
    @PreAuthorize("hasRole('DRIVER') or hasRole('ADMIN')")
    public ResponseEntity<APIResponse<List<FeeDetailDTO>>> getUserFeeHistory(@PathVariable Long userId) {
        try {
            log.info("Getting fee history for user {}", userId);
            List<FeeDetailDTO> feeHistory = penaltyService.getUserFeeHistory(userId);

            return ResponseEntity.ok(APIResponse.success(
                    String.format("Tìm thấy %d phí phạt", feeHistory.size()),
                    feeHistory
            ));

        } catch (Exception e) {
            log.error("Error getting user fee history: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(APIResponse.error("Lỗi khi lấy lịch sử phí: " + e.getMessage()));
        }
    }

    /**
     * AC6: Lấy chi tiết phí của session
     */
    @GetMapping("/session/{sessionId}/details")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER', 'STAFF')")
    public ResponseEntity<APIResponse<List<FeeDetailDTO>>> getSessionFeeDetails(@PathVariable Long sessionId) {
        try {
            log.info("Getting fee details for session {}", sessionId);
            List<FeeDetailDTO> feeDetails = penaltyService.getSessionFeeDetails(sessionId);

            return ResponseEntity.ok(APIResponse.success(
                    String.format("Tìm thấy %d phí phạt", feeDetails.size()),
                    feeDetails
            ));

        } catch (Exception e) {
            log.error("Error getting session fee details: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(APIResponse.error("Lỗi khi lấy chi tiết phí: " + e.getMessage()));
        }
    }

    /**
     * Lấy các phí chưa thanh toán của user + danh sách transactionId FAILED của user đó
     */
    @GetMapping("/user/{userId}/unpaid")
    @PreAuthorize("hasRole('DRIVER') or hasRole('ADMIN')")
    public ResponseEntity<APIResponse<Map<String, Object>>> getUnpaidFees(@PathVariable Long userId) {
        try {
            log.info("Getting unpaid fees for user {}", userId);
            List<Fee> unpaidFees = penaltyService.getUnpaidFees(userId);

            // Tổng tiền phí chưa thanh toán
            double totalUnpaidFees = unpaidFees.stream()
                    .mapToDouble(Fee::getAmount)
                    .sum();

            // Lấy danh sách transactionId FAILED của user
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User không tồn tại"));

            List<Long> failedTransactionIds = transactionRepository
                    .findByUserOrderByTransactionIdDesc(user)
                    .stream()
                    .filter(t -> t.getStatus() == Transaction.Status.FAILED)
                    .map(Transaction::getTransactionId)
                    .collect(Collectors.toList());

            Map<String, Object> data = new HashMap<>();
            data.put("unpaidFees", unpaidFees);                 // Danh sách phí chưa thanh toán
            data.put("totalUnpaidFees", totalUnpaidFees);       // Tổng tiền phí
            data.put("failedTransactionIds", failedTransactionIds); // Các transactionId thất bại
            data.put("totalFailedTransactions", failedTransactionIds.size()); // Số lượng transaction thất bại

            return ResponseEntity.ok(APIResponse.success(
                    String.format("Có %d phí chưa thanh toán (%,.0f VNĐ) và %d transaction thất bại",
                            unpaidFees.size(), totalUnpaidFees, failedTransactionIds.size()),
                    data
            ));

        } catch (Exception e) {
            log.error("Error getting unpaid fees: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(APIResponse.error("Lỗi khi lấy phí chưa thanh toán: " + e.getMessage()));
        }
    }

    /**
     * AC1: Hủy order - có thể bị tính phí nếu hủy muộn
     *
     * Request body: { "reason": "Lý do hủy" }
     */
    @PostMapping("/cancel/{orderId}")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<APIResponse<Map<String, Object>>> cancelOrder(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> requestBody,
            @RequestHeader("Authorization") String authHeader
    ) {
        try {
            String reason = requestBody.getOrDefault("reason", "Không có lý do");

            // TODO: Extract userId from JWT
            // Long userId = jwtUtil.getUserIdFromToken(authHeader);
            Long userId = 1L; // Placeholder

            log.info("User {} canceling order {} with reason: {}", userId, orderId, reason);

            Fee cancelFee = penaltyService.handleLateCancellation(orderId, userId, reason);

            if (cancelFee != null) {
                // Có phí hủy muộn
                return ResponseEntity.ok(APIResponse.success(
                        String.format("Đã hủy lịch. Phí hủy muộn: %,.0f VNĐ", cancelFee.getAmount()),
                        Map.of(
                                "canceled", true,
                                "hasLateFee", true,
                                "feeAmount", cancelFee.getAmount(),
                                "feeDescription", cancelFee.getDescription()
                        )
                ));
            } else {
                // Hủy bình thường, không có phí
                return ResponseEntity.ok(APIResponse.success(
                        "Đã hủy lịch thành công",
                        Map.of(
                                "canceled", true,
                                "hasLateFee", false
                        )
                ));
            }

        } catch (Exception e) {
            log.error("Error canceling order: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(APIResponse.error("Lỗi khi hủy lịch: " + e.getMessage()));
        }
    }

    /**
     * AC4: Tính tổng số tiền thanh toán (base cost + fees)
     */
    @GetMapping("/session/{sessionId}/total")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER', 'STAFF')")
    public ResponseEntity<APIResponse<Map<String, Object>>> calculateTotalPayment(@PathVariable Long sessionId) {
        try {
            log.info("Calculating total payment for session {}", sessionId);

            Double totalAmount = penaltyService.calculateTotalPaymentAmount(sessionId);
            List<FeeDetailDTO> feeDetails = penaltyService.getSessionFeeDetails(sessionId);

            Double totalFees = feeDetails.stream()
                    .mapToDouble(FeeDetailDTO::getAmount)
                    .sum();

            return ResponseEntity.ok(APIResponse.success(
                    "Tính toán thành công",
                    Map.of(
                            "totalAmount", totalAmount,
                            "baseCost", totalAmount - totalFees,
                            "totalFees", totalFees,
                            "feeCount", feeDetails.size(),
                            "fees", feeDetails
                    )
            ));

        } catch (Exception e) {
            log.error("Error calculating total payment: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(APIResponse.error("Lỗi khi tính tổng thanh toán: " + e.getMessage()));
        }
    }

    /**
     * Admin: Trigger manual no-show check for testing
     */
    @PostMapping("/admin/no-show/{orderId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<Fee>> triggerNoShow(@PathVariable Long orderId) {
        try {
            log.info("Admin triggering no-show for order {}", orderId);
            Fee noShowFee = penaltyService.handleNoShow(orderId);

            if (noShowFee != null) {
                return ResponseEntity.ok(APIResponse.success(
                        "No-show processed successfully",
                        noShowFee
                ));
            } else {
                return ResponseEntity.ok(APIResponse.success(
                        "No-show not applicable",
                        null
                ));
            }

        } catch (Exception e) {
            log.error("Error triggering no-show: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(APIResponse.error("Lỗi khi xử lý no-show: " + e.getMessage()));
        }
    }

    /**
     * Admin: Xem tất cả unpaid fees trong hệ thống
     */
    @GetMapping("/admin/unpaid-all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<List<Fee>>> getAllUnpaidFees() {
        try {
            log.info("Admin getting all unpaid fees");
            // TODO: Implement getAllUnpaidFees in service
            return ResponseEntity.ok(APIResponse.success("Feature in development", null));

        } catch (Exception e) {
            log.error("Error getting all unpaid fees: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(APIResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    /**
     * Thanh toán tất cả phí phạt và mở khóa tài khoản
     * POST /api/penalties/pay-and-unlock
     */
    @PostMapping("/pay-and-unlock")
    @PreAuthorize("hasRole('DRIVER') or hasRole('ADMIN')")
    public ResponseEntity<APIResponse<Map<String, Object>>> payAndUnlock(
            @RequestBody Map<String, Object> requestBody
    ) {
        try {
            log.info("📥 Received payment request: {}", requestBody);
            
            // Validate request body
            if (requestBody.get("userId") == null) {
                log.error("❌ userId is null");
                return ResponseEntity.badRequest()
                        .body(APIResponse.error("userId is required"));
            }
            
            if (requestBody.get("feeIds") == null) {
                log.error("❌ feeIds is null");
                return ResponseEntity.badRequest()
                        .body(APIResponse.error("feeIds is required"));
            }
            
            Long userId = Long.valueOf(requestBody.get("userId").toString());
            
            @SuppressWarnings("unchecked")
            List<Long> feeIds = ((List<?>) requestBody.get("feeIds")).stream()
                    .map(id -> Long.valueOf(id.toString()))
                    .collect(java.util.stream.Collectors.toList());

            log.info("User {} attempting to pay fees and unlock account. Fee IDs: {}", userId, feeIds);

            // Đánh dấu fees đã thanh toán
            penaltyService.markFeesAsPaid(feeIds);

            // Kiểm tra nếu không còn phí chưa thanh toán thì mở khóa
            boolean unlocked = penaltyService.unlockUserAfterPayment(userId);

            int remainingFees = penaltyService.getUnpaidFees(userId).size();

            if (unlocked) {
                return ResponseEntity.ok(APIResponse.success(
                        "Thanh toán thành công! Tài khoản đã được mở khóa.",
                        Map.of(
                                "unlocked", true,
                                "remainingFees", remainingFees
                        )
                ));
            } else {
                return ResponseEntity.ok(APIResponse.success(
                        "Thanh toán thành công! Vẫn còn phí chưa thanh toán.",
                        Map.of(
                                "unlocked", false,
                                "remainingFees", remainingFees
                        )
                ));
            }

        } catch (Exception e) {
            log.error("Error paying and unlocking: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(APIResponse.error("Lỗi khi thanh toán: " + e.getMessage()));
        }
    }

    /**
     * Kiểm tra user có thể mở khóa không
     * GET /api/penalties/user/{userId}/can-unlock
     */
    @GetMapping("/user/{userId}/can-unlock")
    @PreAuthorize("hasRole('DRIVER') or hasRole('ADMIN')")
    public ResponseEntity<APIResponse<Boolean>> canUnlockUser(@PathVariable Long userId) {
        try {
            log.info("Checking if user {} can be unlocked", userId);
            boolean canUnlock = penaltyService.canUnlockUser(userId);

            String message = canUnlock
                    ? "User có thể mở khóa (đã thanh toán hết phí)"
                    : "User chưa thể mở khóa (còn phí chưa thanh toán hoặc không bị banned)";

            return ResponseEntity.ok(APIResponse.success(message, canUnlock));

        } catch (Exception e) {
            log.error("Error checking unlock status: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(APIResponse.error("Lỗi: " + e.getMessage()));
        }
    }
}
