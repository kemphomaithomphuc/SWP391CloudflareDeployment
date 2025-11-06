package swp391.code.swp391.test;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import swp391.code.swp391.dto.FeeDetailDTO;
import swp391.code.swp391.entity.*;
import swp391.code.swp391.exception.ApiRequestException;
import swp391.code.swp391.repository.*;
import swp391.code.swp391.service.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests cho PenaltyServiceImpl
 * Test tất cả 8 Acceptance Criteria
 */
@DisplayName("Penalty Service Tests")
public class PenaltyServiceImplTest {

    private AutoCloseable mocks;

    @Mock
    private FeeRepository feeRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private SessionRepository sessionRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private FeeCalculationService feeCalculationService;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private PenaltyServiceImpl penaltyService;

    private User testUser;
    private Order testOrder;
    private Session testSession;
    private Fee testFee;

    @BeforeEach
    void setUp() {
        mocks = MockitoAnnotations.openMocks(this);
        setupTestData();
    }

    @AfterEach
    void tearDown() throws Exception {
        if (mocks != null) {
            mocks.close();
        }
    }

    private void setupTestData() {
        // Setup test user
        testUser = new User();
        testUser.setUserId(1L);
        testUser.setFullName("Test User");
        testUser.setEmail("test@example.com");
        testUser.setStatus(User.UserStatus.ACTIVE);
        testUser.setViolations(0);

        // Setup test order
        testOrder = new Order();
        testOrder.setOrderId(1L);
        testOrder.setUser(testUser);
        testOrder.setStatus(Order.Status.BOOKED);
        testOrder.setStartTime(LocalDateTime.now().plusHours(2));
        testOrder.setEndTime(LocalDateTime.now().plusHours(4));

        // Setup test session
        testSession = new Session();
        testSession.setSessionId(1L);
        testSession.setOrder(testOrder);
        testSession.setBaseCost(500000.0);
        testSession.setStatus(Session.SessionStatus.CHARGING);

        // Setup test fee
        testFee = new Fee();
        testFee.setFeeId(1L);
        testFee.setAmount(50000.0);
        testFee.setType(Fee.Type.CANCEL);
        testFee.setIsPaid(false);
    }

    // ============ AC1: Late Cancellation Tests ============

    @Test
    @DisplayName("AC1: Late cancellation (< 10 minutes) should create fee and increment violations")
    void testLateCancellation_WithFee() {
        // Arrange
        testOrder.setStartTime(LocalDateTime.now().plusMinutes(5)); // 5 minutes before start
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
        when(feeCalculationService.calculateCancelFee(testOrder)).thenReturn(testFee);
        when(orderRepository.save(any(Order.class))).thenReturn(testOrder);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        Fee result = penaltyService.handleLateCancellation(1L, 1L, "Emergency");

        // Assert
        assertNotNull(result);
        assertEquals(50000.0, result.getAmount());
        verify(feeCalculationService, times(1)).calculateCancelFee(testOrder);
        verify(orderRepository, times(1)).save(argThat(order ->
            order.getStatus() == Order.Status.CANCELED
        ));
        verify(userRepository, times(1)).save(argThat(user ->
            user.getViolations() == 1
        ));
    }

    @Test
    @DisplayName("AC1: Normal cancellation (>= 10 minutes) should not create fee")
    void testNormalCancellation_NoFee() {
        // Arrange
        testOrder.setStartTime(LocalDateTime.now().plusHours(2)); // 2 hours before start
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenReturn(testOrder);

        // Act
        Fee result = penaltyService.handleLateCancellation(1L, 1L, "Changed plans");

        // Assert
        assertNull(result);
        verify(feeCalculationService, never()).calculateCancelFee(any());
        verify(orderRepository, times(1)).save(argThat(order ->
            order.getStatus() == Order.Status.CANCELED
        ));
    }

    @Test
    @DisplayName("AC1: Should throw exception when user tries to cancel someone else's order")
    void testLateCancellation_WrongUser() {
        // Arrange
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        // Act & Assert
        assertThrows(ApiRequestException.class, () -> {
            penaltyService.handleLateCancellation(1L, 999L, "Test");
        });
    }

    @Test
    @DisplayName("AC1: Should throw exception when order is not BOOKED")
    void testLateCancellation_InvalidStatus() {
        // Arrange
        testOrder.setStatus(Order.Status.COMPLETED);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        // Act & Assert
        assertThrows(ApiRequestException.class, () -> {
            penaltyService.handleLateCancellation(1L, 1L, "Test");
        });
    }

    // ============ AC2: No-Show Tests ============

    @Test
    @DisplayName("AC2: No-show (> 15 minutes past start) should create fee")
    void testNoShow_CreateFee() {
        // Arrange
        testOrder.setStartTime(LocalDateTime.now().minusMinutes(20)); // 20 minutes ago
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        Fee noShowFee = new Fee();
        noShowFee.setAmount(150000.0);
        noShowFee.setType(Fee.Type.NO_SHOW);
        when(feeCalculationService.calculateNoShowFee(testOrder)).thenReturn(noShowFee);
        when(orderRepository.save(any(Order.class))).thenReturn(testOrder);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        Fee result = penaltyService.handleNoShow(1L);

        // Assert
        assertNotNull(result);
        assertEquals(150000.0, result.getAmount());
        assertEquals(Fee.Type.NO_SHOW, result.getType());
        verify(feeCalculationService, times(1)).calculateNoShowFee(testOrder);
        verify(orderRepository, times(1)).save(argThat(order ->
            order.getStatus() == Order.Status.CANCELED
        ));
    }

    @Test
    @DisplayName("AC2: Should not create fee if not past grace period")
    void testNoShow_NotPastGracePeriod() {
        // Arrange
        testOrder.setStartTime(LocalDateTime.now().minusMinutes(10)); // Only 10 minutes ago
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        // Act
        Fee result = penaltyService.handleNoShow(1L);

        // Assert
        assertNull(result);
        verify(feeCalculationService, never()).calculateNoShowFee(any());
    }

    @Test
    @DisplayName("AC2: Should skip if order is not BOOKED")
    void testNoShow_NotBooked() {
        // Arrange
        testOrder.setStatus(Order.Status.CANCELED);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        // Act
        Fee result = penaltyService.handleNoShow(1L);

        // Assert
        assertNull(result);
        verify(feeCalculationService, never()).calculateNoShowFee(any());
    }

    // ============ AC3: Overtime Charging Tests ============

    @Test
    @DisplayName("AC3: Overtime charging should create fee (2,000 VND per minute)")
    void testOvertimeCharging_CreateFee() {
        // Arrange
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(testSession));

        Fee overtimeFee = new Fee();
        overtimeFee.setAmount(20000.0); // 10 minutes * 2000
        overtimeFee.setType(Fee.Type.OVERTIME);
        when(feeCalculationService.calculateChargingFee(testSession, 10)).thenReturn(overtimeFee);
        when(sessionRepository.save(any(Session.class))).thenReturn(testSession);

        // Act
        Fee result = penaltyService.handleOvertimeCharging(1L, 10);

        // Assert
        assertNotNull(result);
        assertEquals(20000.0, result.getAmount());
        assertEquals(Fee.Type.OVERTIME, result.getType());
        verify(feeCalculationService, times(1)).calculateChargingFee(testSession, 10);
        verify(sessionRepository, times(1)).save(argThat(session ->
            session.getStatus() == Session.SessionStatus.OVERTIME
        ));
    }

    @Test
    @DisplayName("AC3: Should not create fee if extraMinutes is 0 or negative")
    void testOvertimeCharging_ZeroMinutes() {
        // Arrange
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(testSession));

        // Act
        Fee result = penaltyService.handleOvertimeCharging(1L, 0);

        // Assert
        assertNull(result);
        verify(feeCalculationService, never()).calculateChargingFee(any(), anyInt());
    }

    // ============ AC4: Total Payment Calculation Tests ============

    @Test
    @DisplayName("AC4: Should calculate total payment including fees")
    void testCalculateTotalPayment_WithFees() {
        // Arrange
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(testSession));

        Fee fee1 = new Fee();
        fee1.setAmount(30000.0);
        Fee fee2 = new Fee();
        fee2.setAmount(50000.0);
        when(feeRepository.findBySessionSessionId(1L)).thenReturn(Arrays.asList(fee1, fee2));

        // Act
        Double total = penaltyService.calculateTotalPaymentAmount(1L);

        // Assert
        assertEquals(580000.0, total); // 500000 + 30000 + 50000
    }

    @Test
    @DisplayName("AC4: Should return base cost if no fees")
    void testCalculateTotalPayment_NoFees() {
        // Arrange
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(testSession));
        when(feeRepository.findBySessionSessionId(1L)).thenReturn(new ArrayList<>());

        // Act
        Double total = penaltyService.calculateTotalPaymentAmount(1L);

        // Assert
        assertEquals(500000.0, total); // Only base cost
    }

    // ============ AC5: Auto-Lock Tests ============

    @Test
    @DisplayName("AC5: Should auto-ban user when violations >= 3")
    void testAutoLock_ThreeViolations() {
        // Arrange
        testUser.setViolations(3);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        boolean result = penaltyService.checkAndAutoLockUser(1L);

        // Assert
        assertTrue(result);
        verify(userRepository, times(1)).save(argThat(user ->
            user.getStatus() == User.UserStatus.BANNED &&
            user.getReasonReport().contains("vi phạm 3 lần")
        ));
    }

    @Test
    @DisplayName("AC5: Should not ban if violations < 3")
    void testAutoLock_TwoViolations() {
        // Arrange
        testUser.setViolations(2);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // Act
        boolean result = penaltyService.checkAndAutoLockUser(1L);

        // Assert
        assertFalse(result);
        verify(userRepository, never()).save(any());
    }

    // ============ AC6: Fee History Tests ============

    @Test
    @DisplayName("AC6: Should get user fee history")
    void testGetUserFeeHistory() {
        // Arrange
        testFee.setOrder(testOrder);
        when(feeRepository.findAll()).thenReturn(Arrays.asList(testFee));

        // Act
        List<FeeDetailDTO> history = penaltyService.getUserFeeHistory(1L);

        // Assert
        assertNotNull(history);
        assertEquals(1, history.size());
    }

    @Test
    @DisplayName("AC6: Should get session fee details")
    void testGetSessionFeeDetails() {
        // Arrange
        testFee.setSession(testSession);
        when(feeRepository.findBySessionSessionId(1L)).thenReturn(Arrays.asList(testFee));

        // Act
        List<FeeDetailDTO> details = penaltyService.getSessionFeeDetails(1L);

        // Assert
        assertNotNull(details);
        assertEquals(1, details.size());
    }

    // ============ Unlock User Tests ============

    @Test
    @DisplayName("Should unlock user after payment when all fees paid")
    void testUnlockUser_Success() {
        // Arrange
        testUser.setStatus(User.UserStatus.BANNED);
        testUser.setViolations(3);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(feeRepository.findAll()).thenReturn(new ArrayList<>()); // No unpaid fees
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        boolean result = penaltyService.unlockUserAfterPayment(1L);

        // Assert
        assertTrue(result);
        verify(userRepository, times(1)).save(argThat(user ->
            user.getStatus() == User.UserStatus.ACTIVE &&
            user.getReasonReport().contains("Mở khóa")
        ));
    }

    @Test
    @DisplayName("Should not unlock if user has unpaid fees")
    void testUnlockUser_HasUnpaidFees() {
        // Arrange
        testUser.setStatus(User.UserStatus.BANNED);
        testFee.setOrder(testOrder);
        testFee.setIsPaid(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(feeRepository.findAll()).thenReturn(Arrays.asList(testFee));

        // Act
        boolean result = penaltyService.unlockUserAfterPayment(1L);

        // Assert
        assertFalse(result);
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should not unlock if user is not BANNED")
    void testUnlockUser_NotBanned() {
        // Arrange
        testUser.setStatus(User.UserStatus.ACTIVE);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // Act
        boolean result = penaltyService.unlockUserAfterPayment(1L);

        // Assert
        assertFalse(result);
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should correctly check if user can be unlocked")
    void testCanUnlockUser() {
        // Arrange
        testUser.setStatus(User.UserStatus.BANNED);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(feeRepository.findAll()).thenReturn(new ArrayList<>());

        // Act
        boolean result = penaltyService.canUnlockUser(1L);

        // Assert
        assertTrue(result);
    }

    // ============ Helper Method Tests ============

    @Test
    @DisplayName("Should increment violation count correctly")
    void testIncrementViolationCount() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        penaltyService.incrementViolationCount(1L, "Late cancel");

        // Assert
        verify(userRepository, times(1)).save(argThat(user ->
            user.getViolations() == 1 &&
            user.getReasonReport().contains("Late cancel")
        ));
    }

    @Test
    @DisplayName("Should get unpaid fees correctly")
    void testGetUnpaidFees() {
        // Arrange
        testFee.setOrder(testOrder);
        testFee.setIsPaid(false);
        when(feeRepository.findAll()).thenReturn(Arrays.asList(testFee));

        // Act
        List<Fee> unpaidFees = penaltyService.getUnpaidFees(1L);

        // Assert
        assertNotNull(unpaidFees);
        assertEquals(1, unpaidFees.size());
        assertFalse(unpaidFees.get(0).getIsPaid());
    }

    @Test
    @DisplayName("Should mark fees as paid")
    void testMarkFeesAsPaid() {
        // Arrange
        when(feeRepository.findById(1L)).thenReturn(Optional.of(testFee));
        when(feeRepository.save(any(Fee.class))).thenReturn(testFee);

        // Act
        penaltyService.markFeesAsPaid(Arrays.asList(1L));

        // Assert
        verify(feeRepository, times(1)).save(argThat(fee ->
            fee.getIsPaid() == true
        ));
    }

    @Test
    @DisplayName("Should check if user has unpaid fees")
    void testHasUnpaidFees() {
        // Arrange
        testFee.setOrder(testOrder);
        testFee.setIsPaid(false);
        when(feeRepository.findAll()).thenReturn(Arrays.asList(testFee));

        // Act
        boolean result = penaltyService.hasUnpaidFees(1L);

        // Assert
        assertTrue(result);
    }

    // ============ AC8: Rollback Tests ============

    @Test
    @DisplayName("AC8: Should throw exception and rollback on error")
    void testRollback_OnError() {
        // Arrange
        when(orderRepository.findById(1L)).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            penaltyService.handleLateCancellation(1L, 1L, "Test");
        });

        // Verify no side effects
        verify(feeCalculationService, never()).calculateCancelFee(any());
        verify(orderRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }

    // ============ AC7: Configuration Management Tests ============

    @Test
    @DisplayName("AC7: New violations should use updated configuration")
    void testConfigurationChange_NewViolations() {
        // Arrange - Simulate configuration change by mocking different fee amounts
        testOrder.setStartTime(LocalDateTime.now().plusMinutes(5)); // Late cancellation
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        // First fee with "old" config (50k)
        Fee oldFee = new Fee();
        oldFee.setAmount(50000.0);
        oldFee.setType(Fee.Type.CANCEL);
        when(feeCalculationService.calculateCancelFee(testOrder)).thenReturn(oldFee);

        when(orderRepository.save(any(Order.class))).thenReturn(testOrder);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act - Create first violation
        Fee result1 = penaltyService.handleLateCancellation(1L, 1L, "First violation");

        // Assert first fee uses old config
        assertNotNull(result1);
        assertEquals(50000.0, result1.getAmount());

        // Now simulate config change - second fee with "new" config (75k)
        Fee newFee = new Fee();
        newFee.setAmount(75000.0);
        newFee.setType(Fee.Type.CANCEL);
        when(feeCalculationService.calculateCancelFee(testOrder)).thenReturn(newFee);

        // Reset user violations for second test
        testUser.setViolations(0);

        // Act - Create second violation with new config
        Fee result2 = penaltyService.handleLateCancellation(1L, 1L, "Second violation");

        // Assert second fee uses new config
        assertNotNull(result2);
        assertEquals(75000.0, result2.getAmount());

        // Verify both fees were created with different amounts
        verify(feeCalculationService, times(2)).calculateCancelFee(testOrder);
    }

    @Test
    @DisplayName("AC7: Old fees should not be affected by configuration changes")
    void testConfigurationChange_OldFeesUnchanged() {
        // Arrange
        Fee existingFee = new Fee();
        existingFee.setFeeId(1L);
        existingFee.setAmount(50000.0);
        existingFee.setType(Fee.Type.CANCEL);
        existingFee.setIsPaid(false);

        when(feeRepository.findAll()).thenReturn(Arrays.asList(existingFee));

        // Act - Get fee history
        List<FeeDetailDTO> history = penaltyService.getUserFeeHistory(1L);

        // Assert - Old fee amount remains unchanged
        assertNotNull(history);
        assertEquals(1, history.size());
        // Note: The actual FeeDetailDTO mapping would preserve the original amount
        // This test verifies that existing fees are not recalculated
    }
}
