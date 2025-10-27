package swp391.code.swp391.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response cho danh sách lịch sử giao dịch (có pagination)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionHistoryResponse {

    // Danh sách giao dịch
    private List<TransactionHistoryDTO> transactions;

    // Thông tin pagination
    private Integer currentPage;
    private Integer totalPages;
    private Long totalElements;
    private Integer pageSize;

    // Thống kê tổng quan
    private TransactionSummary summary;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransactionSummary {
        private Long totalTransactions;
        private BigDecimal totalAmount;
        private BigDecimal totalSuccess;
        private BigDecimal totalFailed;
        private BigDecimal totalPending;
    }
}