package swp391.code.swp391.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import swp391.code.swp391.dto.SessionProgressDTO;
import swp391.code.swp391.entity.*;
import swp391.code.swp391.repository.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class SessionServiceImpl implements SessionService {

    private final SessionRepository sessionRepository;
    private final OrderRepository orderRepository;
    private final ChargingPointRepository chargingPointRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final FeeRepository feeRepository;

    @Override
    public boolean isValidTime(Long orderId, int maxStartDelayMinutes) {
        maxStartDelayMinutes = 15; // Giới hạn thời gian bắt đầu sạc sau khi tạo order
        var order = orderRepository.findByOrderId(orderId);
        if (order == null) {
            return false; // Order not found, so time is not valid
        }
        LocalDateTime now = LocalDateTime.now();
        return now.isAfter(order.getStartTime()) && now.isBefore(order.getStartTime().plusMinutes(maxStartDelayMinutes));
    }

    // US10: Bắt đầu phiên sạc
    @Transactional
    @Override
    public Long startSession(Long userId, Long orderId, Long vehicleId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getStatus() != User.UserStatus.ACTIVE ||
                (user.getRole() != User.UserRole.DRIVER && user.getRole() != User.UserRole.STAFF)) {
            throw new RuntimeException("Invalid user account or role");
        }

        // Kiểm tra order - THÊM KIỂM TRA NULL
        Order order = orderRepository.findByOrderId(orderId);
        if (order == null) {
            throw new RuntimeException("Order not found");
        } else if (!order.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("User not authorized for this order");
        } else if (order.getStatus() != Order.Status.BOOKED) {
            throw new RuntimeException("Order not in BOOKED status");
        }

        if (!isValidTime(orderId,15)) { // Ví dụ khung giờ ±10p
            // Áp dụng phạt no-show
            applyPenalty(order, Fee.Type.NO_SHOW);
            order.setStatus(Order.Status.CANCELED);
            orderRepository.save(order);
            throw new RuntimeException("Out of booking time slot - Order canceled with penalty");
        }

        // Kiểm tra charging point
        ChargingPoint point = chargingPointRepository.findById(order.getChargingPoint().getChargingPointId())
                .orElseThrow(() -> new RuntimeException("Charging point not found"));
        if (point.getStatus() != ChargingPoint.ChargingPointStatus.AVAILABLE) {
            throw new RuntimeException("Charging point not available");
        }

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        // Kiểm tra connector type khớp hay không
        if (vehicle.getCarModel() == null || vehicle.getCarModel().getConnectorTypes() == null) {
            throw new RuntimeException("Vehicle car model or connector types not found");
        }

        if (!vehicle.getCarModel().getConnectorTypes().contains(point.getConnectorType())) {
            throw new RuntimeException("Vehicle connector type mismatch");
        }

        LocalDateTime startTime = LocalDateTime.now();

        // Cập nhật status charging point
        point.setStatus(ChargingPoint.ChargingPointStatus.OCCUPIED);
        chargingPointRepository.save(point);

        // Tạo session
        Session session = new Session();
        session.setOrder(order);
        session.setStartTime(startTime);
        session.setStatus(Session.SessionStatus.CHARGING);
        session.setBaseCost(0.0);
        session.setPowerConsumed(0.0);
        order.setStatus(Order.Status.CHARGING);
        orderRepository.save(order);
        session = sessionRepository.save(session);

        // Gửi notification
        notificationService.createBookingOrderNotification(orderId, NotificationServiceImpl.NotificationEvent.SESSION_START, null);

        return session.getSessionId();
    }


    // US11: Giám sát phiên sạc (Giả sử poll-based, cập nhật mỗi GET)
    @Override
    public SessionProgressDTO monitorSession(Long sessionId, Long userId) {

        //.1> Validate
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        // Kiểm tra ownership
        if (!session.getOrder().getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Not authorized to monitor this session");
        }

        if (session.getStatus() != Session.SessionStatus.CHARGING) {
            throw new RuntimeException("Session not active");
        }

        ConnectorType connectorType = session.getOrder().getChargingPoint().getConnectorType();
        // 2. Tính toán tiến trình sạc (chuẩn bị data trả về DTO)
        Vehicle vehicle = vehicleRepository.findById(session.getOrder().getVehicle().getId())
                .orElseThrow(() -> new RuntimeException("Vehicle not found for session"));
        double power = connectorType.getPowerOutput(); // kW
        LocalDateTime now = LocalDateTime.now();
        long minutesElapsed = ChronoUnit.MINUTES.between(session.getStartTime(), now);
        double powerConsumed = power * (minutesElapsed / 60.0); // Simplified

        // Tính cost (dựa trên BR12 formula, nhưng đơn giản hóa)
        //TODO: Chèn method tính giá tiền (US12) vào đây thay vì tự tính
        double basePrice = connectorType.getPricePerKWh();

//        PriceFactor factor = getPriceFactor(now); // Logic lấy factor theo giờ
        double priceFactor = 1.0; // Giả sử factor = 1.0
//        Double discount = getSubscriptionDiscount(session.getOrder().getUser());
        double discount = 0.0; // Giả sử không có subscription

        double cost = powerConsumed * basePrice * priceFactor * (1 - discount);
        //===============================================================
        session.setPowerConsumed(powerConsumed);
        session.setBaseCost(cost);

        // Kiểm tra nếu đạt expectedBattery
        double currentBattery = calculateBatteryPercentage(vehicle, powerConsumed) + session.getOrder().getStartedBattery();
        if (currentBattery >= session.getOrder().getExpectedBattery()) {
            if (currentBattery > 100) currentBattery = 100.0; // Chỉnh lại nếu vượt
            // Gui thong bao o day

            // Nếu tiếp tục sau đầy pin, áp phạt (giả sử check sau)
            if (minutesElapsed > expectedMinutes(vehicle, session.getOrder().getExpectedBattery())) {
                applyPenalty(session.getOrder(), Fee.Type.CHARGING);
            }
        } else {
            sessionRepository.save(session); // Cập nhật progress
        }

        // Trả về DTO
        return new SessionProgressDTO(currentBattery,powerConsumed,cost);
    }

    @Override
    @Transactional
    public Long endSession(Long sessionId, Long userId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        // Kiểm tra ownership
        if (!session.getOrder().getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Not authorized to end this session");
        }

        if (session.getStatus() != Session.SessionStatus.CHARGING) {
            throw new RuntimeException("Session not active");
        }

        ConnectorType connectorType = session.getOrder().getChargingPoint().getConnectorType();
        Vehicle vehicle = vehicleRepository.findById(session.getOrder().getVehicle().getId())
                .orElseThrow(() -> new RuntimeException("Vehicle not found for session"));

        LocalDateTime now = LocalDateTime.now();
        double power = connectorType.getPowerOutput();
        long minutesElapsed = ChronoUnit.MINUTES.between(session.getStartTime(), now);
        double powerConsumed = power * (minutesElapsed / 60.0);

        // Calculate cost
        double basePrice = connectorType.getPricePerKWh();
        double priceFactor = 1.0;
        double discount = 0.0;
        double cost = powerConsumed * basePrice * priceFactor * (1 - discount);

        // Update session
        session.setBaseCost(cost);
        session.setPowerConsumed(powerConsumed);
        session.setEndTime(now);
        session.setStatus(Session.SessionStatus.COMPLETED);

        // Update order status
        Order order = session.getOrder();
        order.setStatus(Order.Status.COMPLETED);
        orderRepository.save(order);

        // Update charging point status
        ChargingPoint chargingPoint = order.getChargingPoint();
        chargingPoint.setStatus(ChargingPoint.ChargingPointStatus.AVAILABLE);
        chargingPointRepository.save(chargingPoint);

        // Calculate final battery percentage
        double finalBattery = calculateBatteryPercentage(vehicle, powerConsumed) + session.getOrder().getStartedBattery();
        if (finalBattery > 100) {
            finalBattery = 100.0;
        }

        // Check for overtime penalty
        if (minutesElapsed > expectedMinutes(vehicle, session.getOrder().getExpectedBattery())) {
            applyPenalty(order, Fee.Type.CHARGING);
        }

        // Save session
        session = sessionRepository.save(session);

        // Send completion notification
        notificationService.createBookingOrderNotification(order.getOrderId(),
            NotificationServiceImpl.NotificationEvent.SESSION_COMPLETE, null);

        return session.getSessionId();
    }

    private void applyPenalty(Order order, Fee.Type type) { //Áp dụng phạt
        Fee fee = new Fee();
        fee.setOrder(order);
        fee.setType(type);
        fee.setAmount(calculatePenaltyAmount(type.toString(), order));
        fee.setAmount(fee.getAmount());
        fee.setIsPaid(false);
        fee.setCreatedAt(LocalDateTime.now());
        feeRepository.save(fee);

        // Gửi penalty notification
        NotificationServiceImpl.PenaltyEvent penaltyEvent;
        switch (type) {
            case NO_SHOW:
                penaltyEvent = NotificationServiceImpl.PenaltyEvent.NO_SHOW_PENALTY;
                break;
            case CANCEL:
                penaltyEvent = NotificationServiceImpl.PenaltyEvent.CANCEL_PENALTY;
                break;
            case CHARGING:
                penaltyEvent = NotificationServiceImpl.PenaltyEvent.OVERTIME_PENALTY;
                break;
            default:
                penaltyEvent = NotificationServiceImpl.PenaltyEvent.NO_SHOW_PENALTY;
        }
        notificationService.createPenaltyNotification(order.getOrderId(), penaltyEvent, fee.getAmount(), "Tự động áp dụng phạt");
    }

    @Override //US12
    public Double calculatePenaltyAmount(String type, Order order) {
        // Implement based on BR12 examples
        return 0.0; // Placeholder
    }

    @Override //US11
    public Double calculateBatteryPercentage(Vehicle vehicle, Double kwh) {
        return (kwh / vehicle.getCarModel().getCapacity()) * 100;
    }

    @Override //US11
    public long expectedMinutes(Vehicle vehicle, Double expectedBattery) {
        // Calculate based on power and capacity
        return 0;
    }

}
