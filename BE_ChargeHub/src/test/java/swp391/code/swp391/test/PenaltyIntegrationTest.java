package swp391.code.swp391.test;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import swp391.code.swp391.entity.Fee;
import swp391.code.swp391.entity.Order;
import swp391.code.swp391.entity.Session;
import swp391.code.swp391.entity.User;
import swp391.code.swp391.repository.*;
import swp391.code.swp391.service.PenaltyService;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration Tests cho Penalty System
 * Test complete flows với real database
 */
@SpringBootTest
@ActiveProfiles("test")
@DisplayName("Penalty System Integration Tests")
public class PenaltyIntegrationTest {

    @Autowired
    private PenaltyService penaltyService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private FeeRepository feeRepository;

    private User testUser;
    private Order testOrder1;
    private Order testOrder2;
    private Order testOrder3;

    @BeforeEach
    void setUp() {
        // Cleanup
        feeRepository.deleteAll();
        sessionRepository.deleteAll();
        orderRepository.deleteAll();
        userRepository.deleteAll();

        // Create test user
        testUser = new User();
        testUser.setFullName("Integration Test User");
        testUser.setEmail("integration@test.com");
        testUser.setStatus(User.UserStatus.ACTIVE);
        testUser.setViolations(0);
        testUser = userRepository.save(testUser);

        // Create test orders
        createTestOrders();
    }

    private void createTestOrders() {
        testOrder1 = new Order();
        testOrder1.setUser(testUser);
        testOrder1.setStatus(Order.Status.BOOKED);
        testOrder1.setStartTime(LocalDateTime.now().plusMinutes(5));
        testOrder1.setEndTime(LocalDateTime.now().plusHours(2));
        testOrder1 = orderRepository.save(testOrder1);

        testOrder2 = new Order();
        testOrder2.setUser(testUser);
        testOrder2.setStatus(Order.Status.BOOKED);
        testOrder2.setStartTime(LocalDateTime.now().plusMinutes(3));
        testOrder2.setEndTime(LocalDateTime.now().plusHours(2));
        testOrder2 = orderRepository.save(testOrder2);

        testOrder3 = new Order();
        testOrder3.setUser(testUser);
        testOrder3.setStatus(Order.Status.BOOKED);
        testOrder3.setStartTime(LocalDateTime.now().plusMinutes(7));
        testOrder3.setEndTime(LocalDateTime.now().plusHours(2));
        testOrder3 = orderRepository.save(testOrder3);
    }

    // ============ Complete Flow Tests ============

    @Test
    @DisplayName("Integration: Complete flow from 3 violations to BANNED to payment to ACTIVE")
    @Transactional
    void testCompleteFlow_ThreeViolationsToUnlock() {
        // Violation 1: Late cancellation
        Fee fee1 = penaltyService.handleLateCancellation(
                testOrder1.getOrderId(),
                testUser.getUserId(),
                "Emergency 1"
        );
        assertNotNull(fee1);

        User user = userRepository.findById(testUser.getUserId()).orElseThrow();
        assertEquals(1, user.getViolations());
        assertEquals(User.UserStatus.ACTIVE, user.getStatus());

        // Violation 2: Late cancellation
        Fee fee2 = penaltyService.handleLateCancellation(
                testOrder2.getOrderId(),
                testUser.getUserId(),
                "Emergency 2"
        );
        assertNotNull(fee2);

        user = userRepository.findById(testUser.getUserId()).orElseThrow();
        assertEquals(2, user.getViolations());
        assertEquals(User.UserStatus.ACTIVE, user.getStatus());

        // Violation 3: Late cancellation → Auto BANNED
        Fee fee3 = penaltyService.handleLateCancellation(
                testOrder3.getOrderId(),
                testUser.getUserId(),
                "Emergency 3"
        );
        assertNotNull(fee3);

        user = userRepository.findById(testUser.getUserId()).orElseThrow();
        assertEquals(3, user.getViolations());
        assertEquals(User.UserStatus.BANNED, user.getStatus());
        assertTrue(user.getReasonReport().contains("vi phạm 3 lần"));

        // Check unpaid fees
        List<Fee> unpaidFees = penaltyService.getUnpaidFees(testUser.getUserId());
        assertEquals(3, unpaidFees.size());
        assertTrue(penaltyService.hasUnpaidFees(testUser.getUserId()));

        // Cannot unlock yet (has unpaid fees)
        assertFalse(penaltyService.canUnlockUser(testUser.getUserId()));

        // Mark all fees as paid
        List<Long> feeIds = List.of(fee1.getFeeId(), fee2.getFeeId(), fee3.getFeeId());
        penaltyService.markFeesAsPaid(feeIds);

        // Now can unlock
        assertTrue(penaltyService.canUnlockUser(testUser.getUserId()));

        // Unlock user
        boolean unlocked = penaltyService.unlockUserAfterPayment(testUser.getUserId());
        assertTrue(unlocked);

        // Verify user is ACTIVE
        user = userRepository.findById(testUser.getUserId()).orElseThrow();
        assertEquals(User.UserStatus.ACTIVE, user.getStatus());
        assertTrue(user.getReasonReport().contains("Mở khóa"));
    }

    @Test
    @DisplayName("Integration: Partial payment should not unlock user")
    @Transactional
    void testPartialPayment_NoUnlock() {
        // Create 3 violations
        Fee fee1 = penaltyService.handleLateCancellation(testOrder1.getOrderId(), testUser.getUserId(), "Test 1");
        Fee fee2 = penaltyService.handleLateCancellation(testOrder2.getOrderId(), testUser.getUserId(), "Test 2");
        Fee fee3 = penaltyService.handleLateCancellation(testOrder3.getOrderId(), testUser.getUserId(), "Test 3");

        User user = userRepository.findById(testUser.getUserId()).orElseThrow();
        assertEquals(User.UserStatus.BANNED, user.getStatus());

        // Pay only 2 fees
        penaltyService.markFeesAsPaid(List.of(fee1.getFeeId(), fee2.getFeeId()));

        // Should still have unpaid fees
        assertTrue(penaltyService.hasUnpaidFees(testUser.getUserId()));
        assertFalse(penaltyService.canUnlockUser(testUser.getUserId()));

        // Cannot unlock
        boolean unlocked = penaltyService.unlockUserAfterPayment(testUser.getUserId());
        assertFalse(unlocked);

        // User still BANNED
        user = userRepository.findById(testUser.getUserId()).orElseThrow();
        assertEquals(User.UserStatus.BANNED, user.getStatus());
    }

    @Test
    @DisplayName("Integration: No-show should create fee and increment violations")
    @Transactional
    void testNoShow_Integration() {
        // Create order in the past
        Order pastOrder = new Order();
        pastOrder.setUser(testUser);
        pastOrder.setStatus(Order.Status.BOOKED);
        pastOrder.setStartTime(LocalDateTime.now().minusMinutes(20));
        pastOrder.setEndTime(LocalDateTime.now().plusMinutes(60));
        pastOrder = orderRepository.save(pastOrder);

        // Process no-show
        Fee noShowFee = penaltyService.handleNoShow(pastOrder.getOrderId());

        // Verify
        assertNotNull(noShowFee);
        assertEquals(Fee.Type.NO_SHOW, noShowFee.getType());

        User user = userRepository.findById(testUser.getUserId()).orElseThrow();
        assertEquals(1, user.getViolations());

        Order updatedOrder = orderRepository.findById(pastOrder.getOrderId()).orElseThrow();
        assertEquals(Order.Status.CANCELED, updatedOrder.getStatus());
        assertTrue(updatedOrder.getCancellationReason().contains("No-show"));
    }

    @Test
    @DisplayName("Integration: Overtime charging should accumulate fees")
    @Transactional
    void testOvertimeCharging_Integration() {
        // Create session
        Session session = new Session();
        session.setOrder(testOrder1);
        session.setBaseCost(500000.0);
        session.setStartTime(LocalDateTime.now());
        session.setStatus(Session.SessionStatus.CHARGING);
        session.setPowerConsumed(0.0);
        session = sessionRepository.save(session);

        // Add overtime charges
        Fee overtime1 = penaltyService.handleOvertimeCharging(session.getSessionId(), 5);
        assertNotNull(overtime1);
        assertEquals(10000.0, overtime1.getAmount()); // 5 min * 2000

        Fee overtime2 = penaltyService.handleOvertimeCharging(session.getSessionId(), 10);
        assertNotNull(overtime2);
        assertEquals(20000.0, overtime2.getAmount()); // 10 min * 2000

        // Calculate total
        Double total = penaltyService.calculateTotalPaymentAmount(session.getSessionId());
        assertEquals(530000.0, total); // 500000 + 10000 + 20000

        // Verify session status
        Session updatedSession = sessionRepository.findById(session.getSessionId()).orElseThrow();
        assertEquals(Session.SessionStatus.OVERTIME, updatedSession.getStatus());
    }

    @Test
    @DisplayName("Integration: Fee history should show all fees")
    @Transactional
    void testFeeHistory_Integration() {
        // Create multiple fees
        penaltyService.handleLateCancellation(testOrder1.getOrderId(), testUser.getUserId(), "Test 1");
        penaltyService.handleLateCancellation(testOrder2.getOrderId(), testUser.getUserId(), "Test 2");

        // Get history
        var history = penaltyService.getUserFeeHistory(testUser.getUserId());

        // Verify
        assertNotNull(history);
        assertEquals(2, history.size());

        // Should be sorted by newest first
        assertTrue(history.get(0).getCreatedAt().isAfter(history.get(1).getCreatedAt()) ||
                   history.get(0).getCreatedAt().isEqual(history.get(1).getCreatedAt()));
    }

    @Test
    @DisplayName("Integration: Auto-ban at exactly 3 violations")
    @Transactional
    void testAutoBan_ExactlyThreeViolations() {
        // Set user to 2 violations
        testUser.setViolations(2);
        testUser = userRepository.save(testUser);

        // Create one more violation
        Fee fee = penaltyService.handleLateCancellation(
                testOrder1.getOrderId(),
                testUser.getUserId(),
                "Final violation"
        );

        assertNotNull(fee);

        // User should be BANNED
        User user = userRepository.findById(testUser.getUserId()).orElseThrow();
        assertEquals(3, user.getViolations());
        assertEquals(User.UserStatus.BANNED, user.getStatus());
    }

    @Test
    @DisplayName("Integration: Cannot unlock ACTIVE user")
    @Transactional
    void testUnlock_ActiveUser() {
        // User is already ACTIVE
        assertEquals(User.UserStatus.ACTIVE, testUser.getStatus());

        // Try to unlock
        boolean result = penaltyService.unlockUserAfterPayment(testUser.getUserId());

        // Should fail
        assertFalse(result);
    }

    @Test
    @DisplayName("Integration: Multiple cycles of ban and unlock")
    @Transactional
    void testMultipleCycles() {
        // Cycle 1: Ban → Unlock → Ban again
        penaltyService.handleLateCancellation(testOrder1.getOrderId(), testUser.getUserId(), "Cycle 1-1");
        penaltyService.handleLateCancellation(testOrder2.getOrderId(), testUser.getUserId(), "Cycle 1-2");
        Fee fee3 = penaltyService.handleLateCancellation(testOrder3.getOrderId(), testUser.getUserId(), "Cycle 1-3");

        User user = userRepository.findById(testUser.getUserId()).orElseThrow();
        assertEquals(User.UserStatus.BANNED, user.getStatus());

        // Pay and unlock
        List<Fee> allFees = penaltyService.getUnpaidFees(testUser.getUserId());
        penaltyService.markFeesAsPaid(allFees.stream().map(Fee::getFeeId).toList());
        penaltyService.unlockUserAfterPayment(testUser.getUserId());

        user = userRepository.findById(testUser.getUserId()).orElseThrow();
        assertEquals(User.UserStatus.ACTIVE, user.getStatus());

        // Verify violations remain
        assertEquals(3, user.getViolations());
    }
}
