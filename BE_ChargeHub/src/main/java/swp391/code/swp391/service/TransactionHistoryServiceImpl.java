package swp391.code.swp391.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import swp391.code.swp391.dto.*;
import swp391.code.swp391.entity.*;
import swp391.code.swp391.repository.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionHistoryServiceImpl implements TransactionHistoryService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final FeeRepository feeRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentService paymentService;

    @Override
    @Transactional(readOnly = true)
    public TransactionHistoryResponse getTransactionHistory(TransactionFilterRequest filter) {
        log.info("Lấy lịch sử giao dịch với filter: {}", filter);

        // Tạo Pageable
        int page = filter.getPage() != null ? filter.getPage() : 0;
        int size = filter.getSize() != null ? filter.getSize() : 10;
        String sortBy = filter.getSortBy() != null ? filter.getSortBy() : "createdAt";
        String sortDirection = filter.getSortDirection() != null ? filter.getSortDirection() : "DESC";

        Sort sort = sortDirection.equalsIgnoreCase("ASC")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        // Tìm transactions theo filter
        Page<Transaction> transactionPage = findTransactionsByFilter(filter, pageable);

        // Convert sang DTO
        List<TransactionHistoryDTO> historyDTOs = transactionPage.getContent().stream()
                .map(this::convertToHistoryDTO)
                .collect(Collectors.toList());

        // Tính thống kê
        TransactionHistoryResponse.TransactionSummary summary = calculateSummary(filter);

        return TransactionHistoryResponse.builder()
                .transactions(historyDTOs)
                .currentPage(page)
                .totalPages(transactionPage.getTotalPages())
                .totalElements(transactionPage.getTotalElements())
                .pageSize(size)
                .summary(summary)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionDetailDTO getTransactionDetail(Long transactionId, Long userId) {
        log.info("Lấy chi tiết giao dịch: {}, user: {}", transactionId, userId);

        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch với ID: " + transactionId));

        // Kiểm tra quyền: chỉ admin/staff hoặc chủ giao dịch mới xem được
        if (userId != null && !transaction.getUser().getUserId().equals(userId)) {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null || (user.getRole() != User.UserRole.ADMIN && user.getRole() != User.UserRole.STAFF)) {
                throw new RuntimeException("Bạn không có quyền xem giao dịch này");
            }
        }

        return convertToDetailDTO(transaction);
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionHistoryResponse getUserTransactionHistory(Long userId, Integer page, Integer size) {
        log.info("Lấy lịch sử giao dịch của user: {}", userId);

        TransactionFilterRequest filter = TransactionFilterRequest.builder()
                .userId(userId)
                .page(page != null ? page : 0)
                .size(size != null ? size : 10)
                .sortBy("createdAt")
                .sortDirection("DESC")
                .build();

        return getTransactionHistory(filter);
    }

    /**
     * Tìm transactions theo các điều kiện filter
     */
    private Page<Transaction> findTransactionsByFilter(TransactionFilterRequest filter, Pageable pageable) {
        // Nếu có userId
        if (filter.getUserId() != null) {
            User user = userRepository.findById(filter.getUserId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

            // Nếu có cả status và paymentMethod
            if (filter.getStatus() != null && filter.getPaymentMethod() != null) {
                return transactionRepository.findByUserAndStatusAndPaymentMethod(
                        user, filter.getStatus(), filter.getPaymentMethod(), pageable);
            }
            // Nếu chỉ có status
            else if (filter.getStatus() != null) {
                return transactionRepository.findByUserAndStatus(user, filter.getStatus(), pageable);
            }
            // Nếu chỉ có paymentMethod
            else if (filter.getPaymentMethod() != null) {
                return transactionRepository.findByUserAndPaymentMethod(user, filter.getPaymentMethod(), pageable);
            }
            // Nếu có date range
            else if (filter.getFromDate() != null && filter.getToDate() != null) {
                return transactionRepository.findByUserAndCreatedAtBetween(
                        user, filter.getFromDate(), filter.getToDate(), pageable);
            }
            // Chỉ filter theo user
            else {
                return transactionRepository.findByUser(user, pageable);
            }
        }

        // Nếu filter theo status
        if (filter.getStatus() != null) {
            return transactionRepository.findByStatus(filter.getStatus(), pageable);
        }

        // Nếu filter theo paymentMethod
        if (filter.getPaymentMethod() != null) {
            return transactionRepository.findByPaymentMethod(filter.getPaymentMethod(), pageable);
        }

        // Nếu filter theo date range
        if (filter.getFromDate() != null && filter.getToDate() != null) {
            return transactionRepository.findByCreatedAtBetween(
                    filter.getFromDate(), filter.getToDate(), pageable);
        }

        // Mặc định: lấy tất cả
        return transactionRepository.findAll(pageable);
    }

    /**
     * Convert Transaction entity sang TransactionHistoryDTO
     */
    private TransactionHistoryDTO convertToHistoryDTO(Transaction transaction) {
        Session session = transaction.getSession();
        User user = transaction.getUser();

        String stationName = "N/A";
        String stationAddress = "N/A";

        if (session != null && session.getOrder() != null &&
                session.getOrder().getChargingPoint() != null &&
                session.getOrder().getChargingPoint().getStation() != null) {
            ChargingStation station = session.getOrder().getChargingPoint().getStation();
            stationName = station.getStationName();
            stationAddress = station.getAddress();
        }

        return TransactionHistoryDTO.builder()
                .transactionId(transaction.getTransactionId())
                .amount(BigDecimal.valueOf(transaction.getAmount()))
                .paymentMethod(transaction.getPaymentMethod())
                .status(transaction.getStatus())
                .createdAt(transaction.getCreatedAt())
                .paymentTime(transaction.getPaymentTime())
                .userId(user.getUserId())
                .userName(user.getFullName())
                .userEmail(user.getEmail())
                .sessionId(session != null ? session.getSessionId() : null)
                .sessionStartTime(session != null ? session.getStartTime() : null)
                .sessionEndTime(session != null ? session.getEndTime() : null)
                .powerConsumed(session != null ? BigDecimal.valueOf(session.getPowerConsumed()) : BigDecimal.ZERO)
                .stationName(stationName)
                .stationAddress(stationAddress)
                .vnpayTransactionNo(transaction.getVnpayTransactionNo())
                .vnpayBankCode(transaction.getVnpayBankCode())
                .build();
    }

    /**
     * Convert Transaction entity sang TransactionDetailDTO
     */
    private TransactionDetailDTO convertToDetailDTO(Transaction transaction) {
        Session session = transaction.getSession();
        User user = transaction.getUser();

        // Lấy payment detail
        PaymentDetailDTO paymentDetail = paymentService.getPaymentDetail(
                session.getSessionId(),
                user.getUserId()
        );

        // Lấy thông tin xe
        String vehiclePlateNumber = null;
        String vehicleBrand = null;
        String vehicleModel = null;

        if (session.getOrder() != null && session.getOrder().getVehicle() != null) {
            Vehicle vehicle = session.getOrder().getVehicle();
            vehiclePlateNumber = vehicle.getPlateNumber();
            if (vehicle.getCarModel() != null) {
                vehicleBrand = vehicle.getCarModel().getBrand();
                vehicleModel = vehicle.getCarModel().getModel();
            }
        }

        // Lấy thông tin connector type
        String connectorTypeName = null;
        if (session.getOrder() != null &&
                session.getOrder().getChargingPoint() != null &&
                session.getOrder().getChargingPoint().getConnectorType() != null) {
            connectorTypeName = session.getOrder().getChargingPoint().getConnectorType().getTypeName();
        }

        return TransactionDetailDTO.builder()
                .transactionId(transaction.getTransactionId())
                .amount(BigDecimal.valueOf(transaction.getAmount()))
                .paymentMethod(transaction.getPaymentMethod())
                .status(transaction.getStatus())
                .createdAt(transaction.getCreatedAt())
                .paymentTime(transaction.getPaymentTime())
                .userId(user.getUserId())
                .userName(user.getFullName())
                .userEmail(user.getEmail())
                .userPhone(user.getPhone())
                .sessionId(session.getSessionId())
                .sessionStartTime(session.getStartTime())
                .sessionEndTime(session.getEndTime())
                .powerConsumed(paymentDetail.getPowerConsumed())
                .baseCost(paymentDetail.getBaseCost())
                .stationId(session.getOrder().getChargingPoint().getStation().getStationId())
                .stationName(paymentDetail.getStationName())
                .stationAddress(paymentDetail.getStationAddress())
                .connectorTypeName(connectorTypeName)
                .basePrice(paymentDetail.getBasePrice())
                .priceFactor(paymentDetail.getPriceFactor())
                .subscriptionDiscount(paymentDetail.getSubscriptionDiscount())
                .fees(paymentDetail.getFees())
                .totalFees(paymentDetail.getTotalFees())
                .vnpayTransactionNo(transaction.getVnpayTransactionNo())
                .vnpayBankCode(transaction.getVnpayBankCode())
                .vnpayCardType(transaction.getVnpayCardType())
                .vehiclePlateNumber(vehiclePlateNumber)
                .vehicleBrand(vehicleBrand)
                .vehicleModel(vehicleModel)
                .build();
    }

    /**
     * Tính thống kê tổng quan
     */
    private TransactionHistoryResponse.TransactionSummary calculateSummary(TransactionFilterRequest filter) {
        List<Transaction> allTransactions;

        if (filter.getUserId() != null) {
            User user = userRepository.findById(filter.getUserId()).orElse(null);
            allTransactions = user != null ? transactionRepository.findByUserOrderByTransactionIdDesc(user) : List.of();
        } else {
            allTransactions = transactionRepository.findAll();
        }

        long totalCount = allTransactions.size();

        BigDecimal totalAmount = allTransactions.stream()
                .map(t -> BigDecimal.valueOf(t.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalSuccess = allTransactions.stream()
                .filter(t -> t.getStatus() == Transaction.Status.SUCCESS)
                .map(t -> BigDecimal.valueOf(t.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalFailed = allTransactions.stream()
                .filter(t -> t.getStatus() == Transaction.Status.FAILED)
                .map(t -> BigDecimal.valueOf(t.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPending = allTransactions.stream()
                .filter(t -> t.getStatus() == Transaction.Status.PENDING)
                .map(t -> BigDecimal.valueOf(t.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return TransactionHistoryResponse.TransactionSummary.builder()
                .totalTransactions(totalCount)
                .totalAmount(totalAmount)
                .totalSuccess(totalSuccess)
                .totalFailed(totalFailed)
                .totalPending(totalPending)
                .build();
    }
}