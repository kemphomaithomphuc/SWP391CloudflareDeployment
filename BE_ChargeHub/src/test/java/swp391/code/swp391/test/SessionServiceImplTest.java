package swp391.code.swp391.test;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import swp391.code.swp391.entity.*;
import swp391.code.swp391.repository.*;
import swp391.code.swp391.service.NotificationService;
import swp391.code.swp391.service.NotificationServiceImpl;
import swp391.code.swp391.service.SessionServiceImpl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class SessionServiceImplTest {

    private AutoCloseable mocks;

    @Mock
    private SessionRepository sessionRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private ChargingPointRepository chargingPointRepository;
    @Mock
    private VehicleRepository vehicleRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private FeeRepository feeRepository;

    @InjectMocks
    private SessionServiceImpl sessionService;

    @BeforeEach
    void setUp() {
        mocks = MockitoAnnotations.openMocks(this);
    }

    @AfterEach
    void tearDown() throws Exception {
        mocks.close();
    }

    //Mock test US10: startSession
    @Test
    void testStartSession_Success() {
        // Arrange
        Long userId = 1L, orderId = 1L, vehicleId = 1L;
        User user = new User();
        user.setUserId(userId);
        user.setStatus(User.UserStatus.ACTIVE);
        user.setRole(User.UserRole.DRIVER);

        Order order = new Order();
        order.setOrderId(orderId);
        order.setUser(user);
        order.setStatus(Order.Status.BOOKED);
        order.setStartTime(LocalDateTime.now().minusMinutes(5));

        ConnectorType ccs = new ConnectorType();
        ccs.setTypeName("CCS");

        ChargingPoint point = new ChargingPoint();
        point.setChargingPointId(1L);
        point.setConnectorType(ccs);
        order.setChargingPoint(point);

        Vehicle vehicle = new Vehicle();
        vehicle.setId(vehicleId);
        CarModel carModel = new CarModel();
        carModel.setConnectorTypes(List.of(ccs));
        vehicle.setCarModel(carModel);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(orderRepository.findByOrderId(orderId)).thenReturn(order);
        when(chargingPointRepository.findById(1L)).thenReturn(Optional.of(point));
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));

        Session mockSession = new Session();
        mockSession.setSessionId(1L);
        when(sessionRepository.save(any(Session.class))).thenReturn(mockSession);

        // Act
        Long sessionId = sessionService.startSession(userId, orderId, vehicleId);

        // Assert
        assertNotNull(sessionId);
        verify(orderRepository).save(order);
        verify(chargingPointRepository).save(point);
        verify(sessionRepository).save(any(Session.class));
        verify(notificationService).createBookingOrderNotification(eq(orderId), eq(NotificationServiceImpl.NotificationEvent.SESSION_START), isNull());
    }

    @Test
    void testStartSession_UserNotFound() {
        // Arrange
        Long userId = 1L, orderId = 1L, vehicleId = 1L;
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> sessionService.startSession(userId, orderId, vehicleId));
        assertEquals("User not found", exception.getMessage());
    }

    @Test
    void testStartSession_InvalidUserStatusOrRole() {
        // Arrange
        Long userId = 1L, orderId = 1L, vehicleId = 1L;
        User user = new User();
        user.setUserId(userId);
        user.setStatus(User.UserStatus.BANNED);
        user.setRole(User.UserRole.ADMIN);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> sessionService.startSession(userId, orderId, vehicleId));
        assertEquals("Invalid user account or role", exception.getMessage());
    }

    @Test
    void testStartSession_OrderNotFound() {
        // Arrange
        Long userId = 1L, orderId = 1L, vehicleId = 1L;
        User user = new User();
        user.setUserId(userId);
        user.setStatus(User.UserStatus.ACTIVE);
        user.setRole(User.UserRole.DRIVER);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(orderRepository.findByOrderId(orderId)).thenReturn(null);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> sessionService.startSession(userId, orderId, vehicleId));
        assertEquals("Order not found", exception.getMessage());
    }

    @Test
    void testStartSession_OrderNotAuthorized() {
        // Arrange
        Long userId = 1L, orderId = 1L, vehicleId = 1L;
        User user = new User();
        user.setUserId(userId);
        user.setStatus(User.UserStatus.ACTIVE);
        user.setRole(User.UserRole.DRIVER);

        Order order = new Order();
        order.setOrderId(orderId);
        order.setStatus(Order.Status.BOOKED);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(orderRepository.findByOrderId(orderId)).thenReturn(order);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> sessionService.startSession(userId, orderId, vehicleId));
        assertEquals("User not authorized for this order", exception.getMessage());
    }

    @Test
    void testStartSession_OrderNotBooked() {
        // Arrange
        Long userId = 1L, orderId = 1L, vehicleId = 1L;
        User user = new User();
        user.setUserId(userId);
        user.setStatus(User.UserStatus.ACTIVE);
        user.setRole(User.UserRole.DRIVER);

        Order order = new Order();
        order.setOrderId(orderId);
        order.setUser(user);
        order.setStatus(Order.Status.COMPLETED);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(orderRepository.findByOrderId(orderId)).thenReturn(order);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> sessionService.startSession(userId, orderId, vehicleId));
        assertEquals("Order not in BOOKED status", exception.getMessage());
    }

    @Test
    void testStartSession_OutOfTimeSlot_NoShowPenalty() {
        // Arrange
        Long userId = 1L, orderId = 1L, vehicleId = 1L;
        User user = new User();
        user.setUserId(userId);
        user.setStatus(User.UserStatus.ACTIVE);
        user.setRole(User.UserRole.DRIVER);

        Order order = new Order();
        order.setOrderId(orderId);
        order.setUser(user);
        order.setStatus(Order.Status.BOOKED);
        order.setStartTime(LocalDateTime.now().minusMinutes(20)); // Out of 15 min window

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(orderRepository.findByOrderId(orderId)).thenReturn(order);
        when(feeRepository.save(any(Fee.class))).thenReturn(new Fee());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> sessionService.startSession(userId, orderId, vehicleId));
        assertEquals("Out of booking time slot - Order canceled with penalty", exception.getMessage());
        verify(orderRepository).save(order);
        verify(feeRepository).save(any(Fee.class));
    }

    @Test
    void testStartSession_ChargingPointNotFound() {
        // Arrange
        Long userId = 1L, orderId = 1L, vehicleId = 1L;
        User user = new User();
        user.setUserId(userId);
        user.setStatus(User.UserStatus.ACTIVE);
        user.setRole(User.UserRole.DRIVER);

        Order order = new Order();
        order.setOrderId(orderId);
        order.setUser(user);
        order.setStatus(Order.Status.BOOKED);
        order.setStartTime(LocalDateTime.now().minusMinutes(5));

        ChargingPoint point = new ChargingPoint();
        point.setChargingPointId(1L);
        order.setChargingPoint(point);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(orderRepository.findByOrderId(orderId)).thenReturn(order);
        when(chargingPointRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> sessionService.startSession(userId, orderId, vehicleId));
        assertEquals("Charging point not found", exception.getMessage());
    }

    @Test
    void testStartSession_VehicleNotFound() {
        // Arrange
        Long userId = 1L, orderId = 1L, vehicleId = 1L;
        User user = new User();
        user.setUserId(userId);
        user.setStatus(User.UserStatus.ACTIVE);
        user.setRole(User.UserRole.DRIVER);

        Order order = new Order();
        order.setOrderId(orderId);
        order.setUser(user);
        order.setStatus(Order.Status.BOOKED);
        order.setStartTime(LocalDateTime.now().minusMinutes(5));

        ConnectorType ccs = new ConnectorType();
        ccs.setTypeName("CCS");

        ChargingPoint point = new ChargingPoint();
        point.setChargingPointId(1L);
        point.setConnectorType(ccs);
        order.setChargingPoint(point);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(orderRepository.findByOrderId(orderId)).thenReturn(order);
        when(chargingPointRepository.findById(1L)).thenReturn(Optional.of(point));
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> sessionService.startSession(userId, orderId, vehicleId));
        assertEquals("Vehicle not found", exception.getMessage());
    }

    @Test
    void testStartSession_VehicleCarModelNull() {
        // Arrange
        Long userId = 1L, orderId = 1L, vehicleId = 1L;
        User user = new User();
        user.setUserId(userId);
        user.setStatus(User.UserStatus.ACTIVE);
        user.setRole(User.UserRole.DRIVER);

        Order order = new Order();
        order.setOrderId(orderId);
        order.setUser(user);
        order.setStatus(Order.Status.BOOKED);
        order.setStartTime(LocalDateTime.now().minusMinutes(5));

        ConnectorType ccs = new ConnectorType();
        ccs.setTypeName("CCS");

        ChargingPoint point = new ChargingPoint();
        point.setChargingPointId(1L);
        point.setConnectorType(ccs);
        order.setChargingPoint(point);

        Vehicle vehicle = new Vehicle();
        vehicle.setId(vehicleId);
        vehicle.setCarModel(null);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(orderRepository.findByOrderId(orderId)).thenReturn(order);
        when(chargingPointRepository.findById(1L)).thenReturn(Optional.of(point));
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> sessionService.startSession(userId, orderId, vehicleId));
        assertEquals("Vehicle car model or connector types not found", exception.getMessage());
    }

    @Test
    void testStartSession_ConnectorTypeMismatch() {
        // Arrange
        Long userId = 1L, orderId = 1L, vehicleId = 1L;
        User user = new User();
        user.setUserId(userId);
        user.setStatus(User.UserStatus.ACTIVE);
        user.setRole(User.UserRole.DRIVER);

        Order order = new Order();
        order.setOrderId(orderId);
        order.setUser(user);
        order.setStatus(Order.Status.BOOKED);
        order.setStartTime(LocalDateTime.now().minusMinutes(5));

        ConnectorType ccs = new ConnectorType();
        ccs.setTypeName("CCS");

        ConnectorType chademo = new ConnectorType();
        chademo.setTypeName("CHADEMO");

        ChargingPoint point = new ChargingPoint();
        point.setChargingPointId(1L);
        point.setConnectorType(ccs);
        order.setChargingPoint(point);

        Vehicle vehicle = new Vehicle();
        vehicle.setId(vehicleId);
        CarModel carModel = new CarModel();
        carModel.setConnectorTypes(List.of(chademo)); // Mismatch
        vehicle.setCarModel(carModel);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(orderRepository.findByOrderId(orderId)).thenReturn(order);
        when(chargingPointRepository.findById(1L)).thenReturn(Optional.of(point));
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> sessionService.startSession(userId, orderId, vehicleId));
        assertEquals("Vehicle connector type mismatch", exception.getMessage());
    }

    //Mock test US11: updateSession

}
