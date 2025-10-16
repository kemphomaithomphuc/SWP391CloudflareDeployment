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
    private final FeeRepository feeRepository; // Nếu cần phạt

    @Override
    public boolean isValidTime(Long orderId, int maxStartDelayMinutes) {
        maxStartDelayMinutes = 15; // Giới hạn thời gian bắt đầu sạc sau khi tạo order
        var order = orderRepository.findByOrderId(orderId);
        LocalDateTime now = LocalDateTime.now();
        return now.isAfter(order.getStartTime()) && now.isBefore(order.getStartTime().plusMinutes(maxStartDelayMinutes));
    }

    // US10: Bắt đầu phiên sạc
    @Transactional
    @Override
    public Long startSession(Long userId, Long orderId, Long vehicleId, LocalDateTime startTime) {
        // Xác thực user (giả sử SecurityContextHolder đã check JWT)
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getStatus() != User.UserStatus.ACTIVE ||
            (user.getRole() != User.UserRole.DRIVER && user.getRole() != User.UserRole.STAFF)) {
            throw new RuntimeException("Invalid user account or role");
        }

        // Kiểm tra order - THÊM KIỂM TRA NULL
        Order order = orderRepository.findByOrderIdAndUser_UserId(orderId, userId);
        if (order == null) {
            throw new RuntimeException("Order not found or does not belong to user");
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

        // Kiểm tra vehicle connector type khớp
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        // Kiểm tra connector type khớp hay không
        if (vehicle.getCarModel() == null || vehicle.getCarModel().getConnectorTypes() == null) {
            throw new RuntimeException("Vehicle car model or connector types not found");
        }

        if (!vehicle.getCarModel().getConnectorTypes().contains(point.getConnectorType())) {
            throw new RuntimeException("Vehicle connector type mismatch");
        }

        // Cập nhật status charging point
        point.setStatus(ChargingPoint.ChargingPointStatus.OCCUPIED);
        chargingPointRepository.save(point);

        // Tạo session
        Session session = new Session();
        session.setOrder(order);
        session.setStartTime(startTime);
        session.setStatus(Session.SessionStatus.CHARGING);
        session.setCost(0.0);
        session.setPowerConsumed(0.0);
        order.setStatus(Order.Status.CHARGING);
        orderRepository.save(order);
        session = sessionRepository.save(session);

        // Gửi notification
        notificationService.sendNotification(user, Notification.Type.BOOKING, "Charging session start successful for order " + orderId);

        return session.getSessionId();
    }


    // US11: Giám sát phiên sạc (Giả sử poll-based, cập nhật mỗi GET)
    @Override
    public SessionProgressDTO monitorSession(Long sessionId, Long userId) {
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
        // Tính toán progress giả sử dựa trên thời gian và công suất
        Vehicle vehicle = vehicleRepository.findById(session.getOrder().getVehicle().getId()).get(); // Giả sử luôn có
        double power = connectorType.getPowerOutput(); // kW
        LocalDateTime now = LocalDateTime.now();
        long minutesElapsed = ChronoUnit.MINUTES.between(session.getStartTime(), now);
        double powerConsumed = power * (minutesElapsed / 60.0); // Simplified
        session.setPowerConsumed(powerConsumed);

        // Tính cost (dựa trên BR12 formula, nhưng đơn giản hóa)
        //TODO: Chèn method tính giá tiền (US12) vào đây thay vì tự tính
        double basePrice = connectorType.getPricePerKWh();

//        PriceFactor factor = getPriceFactor(now); // Logic lấy factor theo giờ
        double priceFactor = 1.0; // Giả sử factor = 1.0
//        Double discount = getSubscriptionDiscount(session.getOrder().getUser());
        double discount = 0.0; // Giả sử không có subscription

        double cost = powerConsumed * basePrice * priceFactor * (1 - discount);
        session.setCost(cost);
        //===============================================================

        // Kiểm tra nếu đạt expectedBattery
        double currentBattery = calculateBatteryPercentage(vehicle, powerConsumed) + session.getOrder().getStartedBattery();
        if (currentBattery >= session.getOrder().getExpectedBattery()) {
            // Kết thúc session
            if (currentBattery > 100) currentBattery = 100.0; // Chỉnh lại nếu vượt
            session.setEndTime(now);
            session.setStatus(Session.SessionStatus.COMPLETED);
            sessionRepository.save(session);
            session.getOrder().setStatus(Order.Status.COMPLETED);
            orderRepository.save(session.getOrder());
            notificationService.sendNotification(session.getOrder().getUser(), Notification.Type.PAYMENT, "Phiên sạc hoàn tất, chi phí: " + cost);

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

    private void applyPenalty(Order order, Fee.Type type) { //Áp dụng phạt
        Fee fee = new Fee();
        fee.setType(type);
        fee.setAmount(calculatePenaltyAmount(type.toString(), order)); // Logic tính phí, e.g., 30% estimated cost for NO_SHOW
        feeRepository.save(fee);
        notificationService.sendNotification(order.getUser(), Notification.Type.PENALTY, "Áp dụng phí phạt: " + fee.getAmount());
    }

    @Override //US12
    public Double calculatePenaltyAmount(String type, Order order) {
        // Implement based on BR12 examples
        return 0.0; // Placeholder
    }

    @Override //US11
    public Double calculateBatteryPercentage(Vehicle vehicle, Double kwh) { //US11
        return (kwh / vehicle.getCarModel().getCapacity()) * 100;
    }

    @Override //US11
    public long expectedMinutes(Vehicle vehicle, Double expectedBattery) {
        // Calculate based on power and capacity
        return 0;
    }

}
