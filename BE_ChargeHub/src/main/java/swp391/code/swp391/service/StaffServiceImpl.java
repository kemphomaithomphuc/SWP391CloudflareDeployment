package swp391.code.swp391.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import swp391.code.swp391.dto.*;
import swp391.code.swp391.entity.*;
import swp391.code.swp391.entity.ChargingPoint.ChargingPointStatus;
import swp391.code.swp391.repository.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StaffServiceImpl implements StaffService {

    private final OrderRepository orderRepository;
    private final ChargingPointRepository chargingPointRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ChargingStationRepository chargingStationRepository;
    private final EmailService emailService;

    @Override
    @Transactional
    public ChangeChargingPointResponseDTO changeChargingPointForDriver(ChangeChargingPointRequestDTO request) {

        log.info("Starting change charging point process for order: {}", request.getOrderId());

        // 1. Validate Order
        Order order = orderRepository.findByOrderId(request.getOrderId());
        if (order == null) {
            throw new RuntimeException("Không tìm thấy đơn đặt chỗ với ID: " + request.getOrderId());
        }

        // 2. Kiểm tra trạng thái order (chỉ cho phép đổi khi BOOKED - chưa bắt đầu sạc)
        if (order.getStatus() != Order.Status.BOOKED) {
            throw new RuntimeException(
                    String.format("Không thể đổi trụ sạc cho đơn có trạng thái: %s. Chỉ cho phép đổi khi trạng thái BOOKED",
                            order.getStatus())
            );
        }

        // 3. Kiểm tra thời gian - chỉ cho phép đổi trước giờ bắt đầu
        if (LocalDateTime.now().isAfter(order.getStartTime())) {
            throw new RuntimeException("Không thể đổi trụ sạc sau thời gian bắt đầu đã đặt");
        }

        // 4. Validate Current Charging Point
        ChargingPoint currentPoint = chargingPointRepository.findById(request.getCurrentChargingPointId())
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy trụ sạc hiện tại với ID: " + request.getCurrentChargingPointId()));

        // 5. Kiểm tra current point có phải của order này không
        if (!order.getChargingPoint().getChargingPointId().equals(currentPoint.getChargingPointId())) {
            throw new RuntimeException(
                    String.format("Trụ sạc ID %d không phải là trụ sạc của đơn đặt chỗ này",
                            request.getCurrentChargingPointId())
            );
        }

        // 6. Validate New Charging Point
        ChargingPoint newPoint = chargingPointRepository.findById(request.getNewChargingPointId())
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy trụ sạc mới với ID: " + request.getNewChargingPointId()));

        // 7. Kiểm tra trụ mới có cùng station không
        if (!currentPoint.getStation().getStationId().equals(newPoint.getStation().getStationId())) {
            throw new RuntimeException(
                    String.format("Trụ sạc mới phải nằm trong cùng trạm sạc: %s",
                            currentPoint.getStation().getStationName())
            );
        }

        // 8. Kiểm tra trụ mới có cùng loại connector không
        if (!currentPoint.getConnectorType().getConnectorTypeId()
                .equals(newPoint.getConnectorType().getConnectorTypeId())) {
            throw new RuntimeException(
                    String.format("Trụ sạc mới phải có cùng loại connector: %s. Trụ bạn chọn có connector: %s",
                            currentPoint.getConnectorType().getTypeName(),
                            newPoint.getConnectorType().getTypeName())
            );
        }

        // 9. Kiểm tra trụ mới có available không
        if (newPoint.getStatus() != ChargingPointStatus.AVAILABLE) {
            throw new RuntimeException(
                    String.format("Trụ sạc mới không ở trạng thái AVAILABLE. Trạng thái hiện tại: %s",
                            newPoint.getStatus())
            );
        }

        // 10. Kiểm tra trụ mới có bị trùng thời gian với booking khác không
        List<Order> conflictingOrders = orderRepository.findConflictingOrders(
                newPoint.getChargingPointId(),
                order.getStartTime(),
                order.getEndTime(),
                order.getOrderId()
        );

        if (!conflictingOrders.isEmpty()) {
            throw new RuntimeException(
                    String.format("Trụ sạc mới đã có booking khác trong khung giờ %s - %s",
                            order.getStartTime(), order.getEndTime())
            );
        }

        // 11. Cập nhật Order với Charging Point mới
        ChargingPoint oldPoint = order.getChargingPoint();
        order.setChargingPoint(newPoint);
        orderRepository.save(order);

        log.info("Updated order {} from charging point {} to {}",
                order.getOrderId(), oldPoint.getChargingPointId(), newPoint.getChargingPointId());

        // 12. Cập nhật trạng thái các trụ sạc
        // Nếu current point đang RESERVED, đổi về AVAILABLE
        if (currentPoint.getStatus() == ChargingPointStatus.RESERVED) {
            currentPoint.setStatus(ChargingPointStatus.AVAILABLE);
            chargingPointRepository.save(currentPoint);
            log.info("Released charging point {} to AVAILABLE", currentPoint.getChargingPointId());
        }

        // Đặt trụ mới thành RESERVED
        newPoint.setStatus(ChargingPointStatus.RESERVED);
        chargingPointRepository.save(newPoint);
        log.info("Reserved new charging point {}", newPoint.getChargingPointId());

        // 13. Lấy thông tin Staff
        User staff = null;
        String staffName = "System";
        if (request.getStaffId() != null) {
            staff = userRepository.findById(request.getStaffId()).orElse(null);
            if (staff != null) {
                staffName = staff.getFullName();
            }
        }

        // 14. Gửi thông báo cho Driver
        String notificationContent = String.format(
                "🔄 Thông báo đổi trụ sạc\n\n" +
                        "Trụ sạc của bạn đã được thay đổi:\n" +
                        "• Từ: Trụ #%d\n" +
                        "• Sang: Trụ #%d\n" +
                        "• Trạm: %s\n" +
                        "• Loại connector: %s (%.1f kW)\n" +
                        "• Thời gian: %s - %s\n" +
                        "• Lý do: %s\n" +
                        "• Thực hiện bởi: %s\n\n" +
                        "Vui lòng đến đúng trụ sạc mới!",
                currentPoint.getChargingPointId(),
                newPoint.getChargingPointId(),
                newPoint.getStation().getStationName(),
                newPoint.getConnectorType().getTypeName(),
                newPoint.getConnectorType().getPowerOutput(),
                order.getStartTime(),
                order.getEndTime(),
                request.getReason() != null ? request.getReason() : "Driver trước chưa rút sạc ra",
                staffName
        );

        boolean notificationSent = false;
        try {
            notificationService.createGeneralNotification(
                    List.of(order.getUser().getUserId()),
                    "Đổi trụ sạc - Order #" + order.getOrderId(),
                    notificationContent
            );
            notificationSent = true;
            log.info("Notification sent to driver (User ID: {}) for order: {}",
                    order.getUser().getUserId(), order.getOrderId());
        } catch (Exception e) {
            log.error("Failed to send notification to driver: {}", e.getMessage());
        }

// 15. GỬI EMAIL CHO DRIVER ← THÊM MỚI
        boolean emailSent = false;
        try {
            String driverEmail = order.getUser().getEmail();
            if (driverEmail != null && !driverEmail.isEmpty()) {
                emailService.sendChargingPointChangeEmail(
                        driverEmail,
                        order.getUser().getFullName(),
                        order.getOrderId(),
                        String.format("Trụ #%d - %s", currentPoint.getChargingPointId(),
                                currentPoint.getConnectorType().getTypeName()),
                        String.format("Trụ #%d - %s", newPoint.getChargingPointId(),
                                newPoint.getConnectorType().getTypeName()),
                        newPoint.getStation().getStationName(),
                        request.getReason() != null ? request.getReason() : "Driver trước chưa rút sạc ra",
                        staffName
                );
                emailSent = true;
                log.info("Email sent to driver: {}", driverEmail);
            } else {
                log.warn("Driver email not found for user ID: {}", order.getUser().getUserId());
            }
        } catch (Exception e) {
            log.error("Failed to send email to driver: {}", e.getMessage());
        }

// 16. Tạo response ← CẬP NHẬT
        return ChangeChargingPointResponseDTO.builder()
                .orderId(order.getOrderId())
                .oldChargingPointId(currentPoint.getChargingPointId())
                .oldChargingPointInfo(String.format("Trụ #%d - %s - %.1f kW",
                        currentPoint.getChargingPointId(),
                        currentPoint.getConnectorType().getTypeName(),
                        currentPoint.getConnectorType().getPowerOutput()))
                .newChargingPointId(newPoint.getChargingPointId())
                .newChargingPointInfo(String.format("Trụ #%d - %s - %.1f kW",
                        newPoint.getChargingPointId(),
                        newPoint.getConnectorType().getTypeName(),
                        newPoint.getConnectorType().getPowerOutput()))
                .driverName(order.getUser().getFullName())
                .driverId(order.getUser().getUserId())
                .reason(request.getReason())
                .changedAt(LocalDateTime.now())
                .changedByStaff(staffName)
                .notificationSent(notificationSent)
                .message(buildSuccessMessage(notificationSent, emailSent)) // ← CẬP NHẬT
                .build();
    }

    private String buildSuccessMessage(boolean notificationSent, boolean emailSent) {
        if (notificationSent && emailSent) {
            return "Đổi trụ sạc thành công! Đã gửi thông báo và email cho driver";
        } else if (notificationSent) {
            return "Đổi trụ sạc thành công! Đã gửi thông báo in-app (email thất bại)";
        } else if (emailSent) {
            return "Đổi trụ sạc thành công! Đã gửi email (thông báo in-app thất bại)";
        } else {
            return "Đổi trụ sạc thành công nhưng gửi thông báo thất bại";
        }
    }

    @Override
    public List<ChargingPointDTO> findAlternativeChargingPoints(Long orderId, Long currentChargingPointId) {

        log.info("Finding alternative charging points for order: {}", orderId);

        // 1. Lấy thông tin order
        Order order = orderRepository.findByOrderId(orderId);
        if (order == null) {
            throw new RuntimeException("Không tìm thấy đơn đặt chỗ với ID: " + orderId);
        }

        // 2. Kiểm tra trạng thái order
        if (order.getStatus() != Order.Status.BOOKED) {
            throw new RuntimeException(
                    String.format("Không thể tìm trụ thay thế cho đơn có trạng thái: %s", order.getStatus())
            );
        }

        // 3. Lấy thông tin current charging point
        ChargingPoint currentPoint = chargingPointRepository.findById(currentChargingPointId)
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy trụ sạc với ID: " + currentChargingPointId));

        Long stationId = currentPoint.getStation().getStationId();
        Long connectorTypeId = currentPoint.getConnectorType().getConnectorTypeId();

        // 4. Tìm các trụ sạc thay thế: cùng station, cùng connector type, status = AVAILABLE
        List<ChargingPoint> allAvailablePoints = chargingPointRepository
                .findByStation_StationIdAndConnectorType_ConnectorTypeIdAndStatus(
                        stationId,
                        connectorTypeId,
                        ChargingPointStatus.AVAILABLE
                );

        // 5. Lọc ra các trụ không trùng thời gian với order khác
        List<ChargingPoint> alternativePoints = allAvailablePoints.stream()
                .filter(point -> {
                    // Loại bỏ trụ hiện tại
                    if (point.getChargingPointId().equals(currentChargingPointId)) {
                        return false;
                    }

                    // Kiểm tra xem trụ này có bị trùng lịch không
                    List<Order> conflicts = orderRepository.findConflictingOrders(
                            point.getChargingPointId(),
                            order.getStartTime(),
                            order.getEndTime(),
                            order.getOrderId()
                    );

                    return conflicts.isEmpty();
                })
                .collect(Collectors.toList());

        log.info("Found {} alternative charging points for order {}", alternativePoints.size(), orderId);

        // 6. Convert sang DTO - CHỈ TRẢ VỀ ID, KHÔNG TRẢ VỀ NESTED OBJECT
        return alternativePoints.stream()
                .map(point -> {
                    ChargingPointDTO dto = new ChargingPointDTO();
                    dto.setChargingPointId(point.getChargingPointId());
                    dto.setStatus(point.getStatus());
                    dto.setStationId(point.getStation().getStationId()); // CHỈ ID
                    dto.setConnectorTypeId(point.getConnectorType().getConnectorTypeId()); // CHỈ ID
                    dto.setTypeName(point.getConnectorType().getTypeName());
                    dto.setPowerOutput(point.getConnectorType().getPowerOutput());
                    dto.setPricePerKwh(point.getConnectorType().getPricePerKWh());
                    // KHÔNG SET station và connectorType object để tránh circular reference
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public StationConflictResponseDTO getConflictingOrdersByStation(Long stationId) {

        log.info("Finding conflicting orders for station: {}", stationId);

        // 1. Validate station
        ChargingStation station = chargingStationRepository.findById(stationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trạm sạc với ID: " + stationId));

        // 2. Lấy tất cả charging points của station
        List<ChargingPoint> chargingPoints = chargingPointRepository.findByStation_StationId(stationId);

        if (chargingPoints.isEmpty()) {
            return StationConflictResponseDTO.builder()
                    .stationId(stationId)
                    .stationName(station.getStationName())
                    .address(station.getAddress())
                    .totalConflicts(0)
                    .conflictGroups(new ArrayList<>())
                    .build();
        }

        // 3. Lấy tất cả orders BOOKED trong tương lai của station
        LocalDateTime now = LocalDateTime.now();
        List<Order> upcomingOrders = orderRepository.findUpcomingOrdersByStation(stationId, now);

        log.info("Found {} upcoming orders for station {}", upcomingOrders.size(), stationId);

        // 4. Group orders by charging point
        Map<Long, List<Order>> ordersByChargingPoint = upcomingOrders.stream()
                .collect(Collectors.groupingBy(o -> o.getChargingPoint().getChargingPointId()));

        // 5. Tìm conflicts cho từng charging point
        List<StationConflictResponseDTO.ConflictGroup> conflictGroups = new ArrayList<>();
        int totalConflicts = 0;

        for (ChargingPoint point : chargingPoints) {
            List<Order> pointOrders = ordersByChargingPoint.getOrDefault(
                    point.getChargingPointId(),
                    new ArrayList<>()
            );

            if (pointOrders.size() < 2) {
                continue; // Không có conflict nếu chỉ có 1 hoặc 0 order
            }

            // Sort orders by start time
            pointOrders.sort(Comparator.comparing(Order::getStartTime));

            // Tìm conflicts
            List<ConflictingOrderDTO> conflictingOrders = new ArrayList<>();

            for (int i = 0; i < pointOrders.size() - 1; i++) {
                Order current = pointOrders.get(i);
                Order next = pointOrders.get(i + 1);

                // Check if orders overlap
                if (current.getEndTime().isAfter(next.getStartTime())) {
                    // CONFLICT DETECTED!
                    long overlapMinutes = Duration.between(next.getStartTime(), current.getEndTime()).toMinutes();

                    String conflictType;
                    String conflictDescription;

                    if (overlapMinutes > 30) {
                        conflictType = "OVERLAP";
                        conflictDescription = String.format(
                                "Order #%d kết thúc lúc %s, nhưng Order #%d bắt đầu từ %s (đè %d phút)",
                                current.getOrderId(), current.getEndTime(),
                                next.getOrderId(), next.getStartTime(), overlapMinutes
                        );
                    } else if (overlapMinutes > 0) {
                        conflictType = "BACK_TO_BACK";
                        conflictDescription = String.format(
                                "Order #%d kết thúc lúc %s, Order #%d bắt đầu ngay sau đó (chỉ cách %d phút)",
                                current.getOrderId(), current.getEndTime(),
                                next.getOrderId(), next.getStartTime(), overlapMinutes
                        );
                    } else {
                        conflictType = "LATE_CHECKOUT";
                        conflictDescription = String.format(
                                "Order #%d có nguy cơ checkout trễ, ảnh hưởng Order #%d",
                                current.getOrderId(), next.getOrderId()
                        );
                    }

                    // Add current order to conflicts
                    conflictingOrders.add(ConflictingOrderDTO.builder()
                            .orderId(current.getOrderId())
                            .chargingPointId(point.getChargingPointId())
                            .chargingPointName("Trụ #" + point.getChargingPointId())
                            .driverName(current.getUser().getFullName())
                            .driverEmail(current.getUser().getEmail())
                            .driverPhone(current.getUser().getPhone())
                            .startTime(current.getStartTime())
                            .endTime(current.getEndTime())
                            .status(current.getStatus().toString())
                            .vehiclePlate(current.getVehicle().getPlateNumber())
                            .connectorType(point.getConnectorType().getTypeName())
                            .conflictWithOrderId(next.getOrderId())
                            .conflictType(conflictType)
                            .conflictDescription(conflictDescription)
                            .overlapMinutes((int) overlapMinutes)
                            .build());

                    // Add next order to conflicts (bị ảnh hưởng)
                    conflictingOrders.add(ConflictingOrderDTO.builder()
                            .orderId(next.getOrderId())
                            .chargingPointId(point.getChargingPointId())
                            .chargingPointName("Trụ #" + point.getChargingPointId())
                            .driverName(next.getUser().getFullName())
                            .driverEmail(next.getUser().getEmail())
                            .driverPhone(next.getUser().getPhone())
                            .startTime(next.getStartTime())
                            .endTime(next.getEndTime())
                            .status(next.getStatus().toString())
                            .vehiclePlate(next.getVehicle().getPlateNumber())
                            .connectorType(point.getConnectorType().getTypeName())
                            .conflictWithOrderId(current.getOrderId())
                            .conflictType(conflictType)
                            .conflictDescription("Bị ảnh hưởng bởi Order #" + current.getOrderId())
                            .overlapMinutes((int) overlapMinutes)
                            .build());

                    totalConflicts++;
                }
            }

            // Chỉ thêm vào conflict groups nếu có conflicts
            if (!conflictingOrders.isEmpty()) {
                conflictGroups.add(StationConflictResponseDTO.ConflictGroup.builder()
                        .chargingPointId(point.getChargingPointId())
                        .chargingPointName("Trụ #" + point.getChargingPointId())
                        .connectorType(point.getConnectorType().getTypeName())
                        .orders(conflictingOrders)
                        .conflictCount(conflictingOrders.size() / 2) // Mỗi conflict tính 2 orders
                        .build());
            }
        }

        log.info("Found {} conflicts in station {}", totalConflicts, stationId);

        return StationConflictResponseDTO.builder()
                .stationId(stationId)
                .stationName(station.getStationName())
                .address(station.getAddress())
                .totalConflicts(totalConflicts)
                .conflictGroups(conflictGroups)
                .build();
    }

    @Override
    public List<Long> getStationsManagedByStaff(Long staffId) {

        log.info("Finding stations managed by staff: {}", staffId);

        // Validate staff
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy staff với ID: " + staffId));

        if (staff.getRole() != User.UserRole.STAFF) {
            throw new RuntimeException("User này không phải là STAFF");
        }

        // Lấy danh sách stations
        List<ChargingStation> stations = chargingStationRepository.findByStaffIdContains(staffId);

        return stations.stream()
                .map(ChargingStation::getStationId)
                .collect(Collectors.toList());
    }
}