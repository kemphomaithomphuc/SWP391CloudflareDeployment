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
import java.time.format.DateTimeFormatter;
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
    private final IssueReportRepository issueReportRepository;
    private final SessionRepository sessionRepository;
    private final OrderService orderService;
    private final VehicleRepository vehicleRepository;
    private final TransactionRepository transactionRepository;

    @Override
    @Transactional
    public ChangeChargingPointResponseDTO changeChargingPointForDriver(ChangeChargingPointRequestDTO request) {

        log.info("Starting change charging point process for order: {}", request.getOrderId());

        // 1. Validate Order
        Order order = orderRepository.findByOrderId(request.getOrderId());
        if (order == null) {
            throw new RuntimeException("Không tìm thấy đơn đặt chỗ với ID: " + request.getOrderId());
        }

        // 2. Kiểm tra trạng thái order (cho phép đổi khi BOOKED hoặc CHARGING)
        if (order.getStatus() != Order.Status.BOOKED && order.getStatus() != Order.Status.CHARGING) {
            throw new RuntimeException(
                    String.format("Không thể đổi trụ sạc cho đơn có trạng thái: %s. Chỉ cho phép đổi khi trạng thái BOOKED hoặc CHARGING",
                            order.getStatus())
            );
        }

        // 3. Không kiểm tra thời gian - cho phép đổi trụ bất cứ lúc nào khi order đang BOOKED hoặc CHARGING

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

        // 10. Kiểm tra trụ mới có bị trùng thời gian với booking khác không (chỉ check khi BOOKED)
        if (order.getStatus() == Order.Status.BOOKED) {
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
        } else if (order.getStatus() == Order.Status.CHARGING) {
            // Kiểm tra dựa trên pin hiện tại và thời gian sạc còn lại
            validateNoTimeOverlap(order, newPoint, request.getCurrentBatteryLevel());

            log.info("No time overlap detected for CHARGING order.");
        }

        // 11. Cập nhật Order với Charging Point mới
        ChargingPoint oldPoint = order.getChargingPoint();
        order.setChargingPoint(newPoint);
        orderRepository.save(order);

        log.info("Updated order {} from charging point {} to {}",
                order.getOrderId(), oldPoint.getChargingPointId(), newPoint.getChargingPointId());

        // 12. Cập nhật trạng thái các trụ sạc dựa trên trạng thái hiện tại
        // Lưu trạng thái hiện tại của trụ cũ để biết cần set trạng thái gì cho trụ mới
        ChargingPointStatus oldPointCurrentStatus = currentPoint.getStatus();

        // Cập nhật trụ cũ về AVAILABLE (khi đang RESERVED hay OCCUPIED)
        if (currentPoint.getStatus() == ChargingPointStatus.RESERVED ||
                currentPoint.getStatus() == ChargingPointStatus.OCCUPIED) {
            currentPoint.setStatus(ChargingPointStatus.AVAILABLE);
            chargingPointRepository.save(currentPoint);
            log.info("Released charging point {} from {} to AVAILABLE",
                    currentPoint.getChargingPointId(), oldPointCurrentStatus);
        }

        // Set trạng thái cho trụ mới dựa trên trạng thái của trụ cũ
        // Nếu trụ cũ đang OCCUPIED (đang sạc) -> set trụ mới thành OCCUPIED
        // Nếu trụ cũ đang RESERVED (đã book) -> set trụ mới thành RESERVED
        if (oldPointCurrentStatus == ChargingPointStatus.OCCUPIED) {
            newPoint.setStatus(ChargingPointStatus.OCCUPIED);
            chargingPointRepository.save(newPoint);
            log.info("Set new charging point {} to OCCUPIED (old point was OCCUPIED)",
                    newPoint.getChargingPointId());
        } else if (oldPointCurrentStatus == ChargingPointStatus.RESERVED) {
            newPoint.setStatus(ChargingPointStatus.RESERVED);
            chargingPointRepository.save(newPoint);
            log.info("Set new charging point {} to RESERVED (old point was RESERVED)",
                    newPoint.getChargingPointId());
        }

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
                "Thông báo đổi trụ sạc\n\n" +
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

        // 15. GỬI EMAIL CHO DRIVER
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

        // 16. Tạo response
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
                .message(buildSuccessMessage(notificationSent, emailSent))
                .build();
    }

     // Kiểm tra overlap thời gian sạc với các order khác của trụ mới
     private void validateNoTimeOverlap(Order currentOrder, ChargingPoint newPoint, Double currentBatteryLevel) {
         LocalDateTime estimatedStartTime = LocalDateTime.now();
         LocalDateTime estimatedEndTime = calculateEstimatedEndTime(currentOrder, newPoint, currentBatteryLevel);

         List<Order> existingOrders = orderRepository.findByChargingPointAndStatusIn(
                         newPoint,
                         List.of(Order.Status.BOOKED, Order.Status.CHARGING)
                 ).stream()
                 .filter(o -> !o.getOrderId().equals(currentOrder.getOrderId()))
                 .collect(Collectors.toList());

         // Định dạng ngày giờ
         DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

         // Pin hiện tại
         Double actualCurrentBattery = (currentBatteryLevel != null && currentBatteryLevel > 0)
                 ? currentBatteryLevel
                 : currentOrder.getStartedBattery();

         long estimatedDurationMins = Duration.between(estimatedStartTime, estimatedEndTime).toMinutes();

         for (Order existingOrder : existingOrders) {
             LocalDateTime existingStart = existingOrder.getStartTime();
             LocalDateTime existingEnd = existingOrder.getEndTime();

             boolean isOverlap = estimatedStartTime.isBefore(existingEnd) && existingStart.isBefore(estimatedEndTime);

             if (isOverlap) {
                 throw new RuntimeException(
                         String.format(
                                 "Không thể đổi sang trụ #%d vì bị trùng với booking khác.\n" +
                                         "Order trùng: #%d (%s → %s, trạng thái: %s, khách hàng: %s)\n" +
                                         "• Pin hiện tại: %.1f%%\n" +
                                         "• Thời gian còn lại dự kiến: %d phút\n" +
                                         "• Thời gian hoàn thành phiên sạc dự kiến: %s",
                                 newPoint.getChargingPointId(),
                                 existingOrder.getOrderId(),
                                 existingStart.format(formatter),
                                 existingEnd.format(formatter),
                                 existingOrder.getStatus(),
                                 existingOrder.getUser() != null ? existingOrder.getUser().getFullName() : "N/A",
                                 actualCurrentBattery != null ? actualCurrentBattery : 0.0,
                                 estimatedDurationMins,
                                 estimatedEndTime.format(formatter)
                         )
                 );
             }
         }
     }

     //Tính thời gian kết thúc
    private LocalDateTime calculateEstimatedEndTime(Order order, ChargingPoint chargingPoint, Double currentBatteryLevel) {
        // Lấy thông tin vehicle
        Vehicle vehicle = order.getVehicle();
        if (vehicle == null || vehicle.getCarModel() == null) {
            log.warn("Vehicle info not available for order {}, using order's endTime", order.getOrderId());
            return order.getEndTime();
        }

        Double batteryCapacity = vehicle.getCarModel().getCapacity(); // kWh
        if (batteryCapacity == null || batteryCapacity == 0) {
            log.warn("Battery capacity not available, using order's endTime");
            return order.getEndTime();
        }

        Double expectedBattery = order.getExpectedBattery(); // % pin mong muốn

        Double actualCurrentBattery = (currentBatteryLevel != null && currentBatteryLevel > 0)
                ? currentBatteryLevel
                : order.getStartedBattery();

        if (actualCurrentBattery == null || expectedBattery == null) {
            log.warn("Battery levels not available (current: {}, expected: {}), using order's endTime",
                    actualCurrentBattery, expectedBattery);
            return order.getEndTime();
        }

        if (expectedBattery <= actualCurrentBattery) {
            log.warn("Expected battery ({:.1f}%) must be > current battery ({:.1f}%). Using order's endTime",
                    expectedBattery, actualCurrentBattery);
            return order.getEndTime();
        }

        // Validate: Pin trong khoảng hợp lệ (0-100%)
        if (actualCurrentBattery < 0 || actualCurrentBattery > 100 || expectedBattery < 0 || expectedBattery > 100) {
            log.warn("Battery levels out of range (current: {:.1f}%, expected: {:.1f}%). Using order's endTime",
                    actualCurrentBattery, expectedBattery);
            return order.getEndTime();
        }

        // Tính pin cần sạc còn lại (từ pin hiện tại đến pin mong muốn)
        double batteryToCharge = expectedBattery - actualCurrentBattery; // %
        double energyToChargeKwh = (batteryToCharge / 100.0) * batteryCapacity; // kWh

        Double powerOutput = chargingPoint.getConnectorType().getPowerOutput(); // kW
        if (powerOutput == null || powerOutput == 0) {
            log.warn("Power output not available, using order's endTime");
            return order.getEndTime();
        }

        int chargingDurationMinutes = calculateChargingDuration(energyToChargeKwh, powerOutput);

        // Thời gian bắt đầu = HIỆN TẠI (thời điểm đổi trụ)
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime estimatedEndTime = now.plusMinutes(chargingDurationMinutes);

        log.info("Calculated charging details:");
        log.info("   • Battery: {:.1f}% → {:.1f}% (+{:.1f}%)",
                actualCurrentBattery, expectedBattery, batteryToCharge);
        log.info("   • Energy needed: {:.2f} kWh", energyToChargeKwh);
        log.info("   • Charging power: {:.1f} kW", powerOutput);
        log.info("   • Duration: {} minutes", chargingDurationMinutes);
        log.info("   • Start time (NOW): {}", now);
        log.info("   • Estimated end: {}", estimatedEndTime);

        return estimatedEndTime;
    }

     // Tính thời gian sạc cần thiết
    private int calculateChargingDuration(double energyToChargeKwh, double chargingPowerKw) {
        double theoreticalHours = energyToChargeKwh / chargingPowerKw;
        double adjustedHours = theoreticalHours * 1.15; 
        int durationMinutes = (int) Math.ceil(adjustedHours * 60); // Convert to minutes

        log.debug("Charging duration calculation: {:.2f} kWh / {:.1f} kW * 1.15 * 60 = {} minutes",
                energyToChargeKwh, chargingPowerKw, durationMinutes);

        return durationMinutes;
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

        // 2. Kiểm tra trạng thái order (cho phép cả BOOKED và CHARGING)
        if (order.getStatus() != Order.Status.BOOKED && order.getStatus() != Order.Status.CHARGING) {
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

                    // Nếu order đang CHARGING, không cần check conflict, chỉ cần AVAILABLE
                    if (order.getStatus() == Order.Status.CHARGING) {
                        return true;
                    }

                    // Nếu order đang BOOKED, kiểm tra xem trụ này có bị trùng lịch không
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
                    dto.setChargingPointName(point.getChargingPointName());
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
                            .chargingPointName(point.getChargingPointName())
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
                            .chargingPointName(point.getChargingPointName())
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
                        .chargingPointName(point.getChargingPointName())
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

    @Override
    public Long createIssueReport(IssueReportDTO dto, Long staffId) {
        // Lấy staff từ CSDL
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy staff với ID: " + staffId));

        if (staff.getRole() != User.UserRole.STAFF) {
            throw new RuntimeException("User này không phải là STAFF");
        }

        // Lấy trạm sạc từ CSDL
        ChargingStation station = chargingStationRepository.findById(dto.getStationId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trạm sạc với ID: " + dto.getStationId()));

        // Tạo IssueReport entity
        IssueReport issueReport = new IssueReport();
        issueReport.setStation(station);
        issueReport.setReporter(staff);
        issueReport.setDescription(dto.getDescription());
        issueReport.setStatus(IssueReport.Status.IN_PROGRESS);
        issueReport.setReportedTime(LocalDateTime.now());

        // Lưu vào CSDL
        IssueReport savedReport = issueReportRepository.save(issueReport);

        log.info("Staff {} created issue report {} for station {}",
                staff.getFullName(), savedReport.getIssueReportId(), station.getStationName());

        // Tạo thông báo cho admin
        notificationService.createIssueNotification(
                station.getStationId(),
                NotificationServiceImpl.IssueEvent.STATION_ERROR_STAFF,
                "New issue reported by staff: " + dto.getDescription()
        );

        // Tạo thông báo cho staff reporter
        try {
            notificationService.createGeneralNotification(
                    List.of(staffId),
                    "Báo cáo sự cố đã được ghi nhận",
                    String.format("Bạn đã báo cáo cho quản trị viên vấn đề: %s tại trạm %s. Mã báo cáo: #%d",
                            dto.getDescription(),
                            station.getStationName(),
                            savedReport.getIssueReportId())
            );
        } catch (Exception e) {
            log.error("Lỗi khi tạo thông báo cho staff: {}", e.getMessage());
        }

        return savedReport.getIssueReportId();
    }

    @Override
    public List<SessionListDTO> getSessionsByStation(Long stationId) {
        log.info("Getting sessions for station: {}", stationId);

        // Validate station exists
        ChargingStation station = chargingStationRepository.findById(stationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trạm sạc với ID: " + stationId));

        // Lấy tất cả sessions của trạm sạc
        List<Session> sessions = sessionRepository.findByOrderChargingPointStationStationId(stationId);

        // Convert sang DTO
        return sessions.stream()
                .map(session -> {
                    Order order = session.getOrder();
                    User user = order.getUser();
                    ChargingPoint chargingPoint = order.getChargingPoint();
                    ConnectorType connectorType = chargingPoint.getConnectorType();

                    return SessionListDTO.builder()
                            .sessionId(session.getSessionId())
                            .orderId(order.getOrderId())
                            .userId(user.getUserId())
                            .userName(user.getFullName())
                            .userPhone(user.getPhone())
                            .chargingPointId(chargingPoint.getChargingPointId())
                            .connectorType(connectorType.getTypeName())
                            .powerOutput(connectorType.getPowerOutput())
                            .startTime(session.getStartTime())
                            .endTime(session.getEndTime())
                            .powerConsumed(session.getPowerConsumed())
                            .baseCost(session.getBaseCost())
                            .status(session.getStatus().name())
                            .isOvertime(false) // Deprecated - no longer tracking overtime
                            .overtimeMinutes(null) // Deprecated - replaced by parking fees
                            .build();
                })
                .sorted(Comparator.comparing(SessionListDTO::getStartTime).reversed()) // Mới nhất lên đầu
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Object createImmediateSession(OrderRequestDTO request) {
        log.info("Creating immediate session for driver {} at station {}", request.getUserId(), request.getStationId());

        // 1. Validate driver
        User driver = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy driver với ID: " + request.getUserId()));

        // 2. Validate vehicle
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy xe với ID: " + request.getVehicleId()));

        if (!vehicle.getUser().getUserId().equals(driver.getUserId())) {
            throw new RuntimeException("Xe này không thuộc về driver");
        }

        // 3. Validate station
        ChargingStation station = chargingStationRepository.findById(request.getStationId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trạm sạc với ID: " + request.getStationId()));

        // 4. Validate battery
        if (request.getCurrentBattery() >= request.getTargetBattery()) {
            throw new RuntimeException("Target battery phải lớn hơn current battery");
        }

        // 5. TẬN DỤNG OrderService.findAvailableSlots() để kiểm tra slot trống
        AvailableSlotsResponseDTO availableSlots;
        try {
            availableSlots = orderService.findAvailableSlots(request);
        } catch (Exception e) {
            log.error("Error finding available slots: {}", e.getMessage());
            throw new RuntimeException("Không tìm thấy slot khả dụng: " + e.getMessage());
        }

        // 6. Nếu không chỉ định charging point, lấy point đầu tiên có slot
        ChargingPoint chargingPoint;
        if (request.getChargingPointId() != null) {
            chargingPoint = chargingPointRepository.findById(request.getChargingPointId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy trụ sạc với ID: " + request.getChargingPointId()));

            if (!chargingPoint.getStation().getStationId().equals(station.getStationId())) {
                throw new RuntimeException("Trụ sạc không thuộc về trạm này");
            }
        } else {
            if (availableSlots.getChargingPoints().isEmpty()) {
                // Trả về available slots để frontend suggest
                return availableSlots;
            }
            ChargingPointAvailabilityDTO firstAvailable = availableSlots.getChargingPoints().get(0);
            chargingPoint = chargingPointRepository.findById(firstAvailable.getChargingPointId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy trụ sạc"));
        }

        // 7. Tìm charging point availability trong response
        final Long finalChargingPointId = chargingPoint.getChargingPointId();
        ChargingPointAvailabilityDTO pointAvailability = availableSlots.getChargingPoints().stream()
                .filter(cp -> cp.getChargingPointId().equals(finalChargingPointId))
                .findFirst()
                .orElse(null);

        if (pointAvailability == null || pointAvailability.getAvailableSlots().isEmpty()) {
            // Trả về available slots để frontend suggest thời gian khác
            return availableSlots;
        }

        // 8. Kiểm tra có slot "ngay lập tức" không (bắt đầu trong vòng 5 phút)
        LocalDateTime now = LocalDateTime.now();
        AvailableTimeSlotDTO immediateSlot = pointAvailability.getAvailableSlots().stream()
                .filter(slot -> !slot.getFreeFrom().isAfter(now.plusMinutes(5)))
                .findFirst()
                .orElse(null);

        if (immediateSlot == null) {
            // Không có slot ngay lập tức, trả về available slots
            log.info("No immediate slot available. Returning suggestions.");
            return availableSlots;
        }

        // 9. TẬN DỤNG OrderService.confirmOrder() để tạo order và tự động chuyển sang CHARGING
        LocalDateTime startTime = now;
        LocalDateTime endTime = startTime.plusMinutes(immediateSlot.getRequiredMinutes());

        ConfirmOrderDTO confirmRequest = ConfirmOrderDTO.builder()
                .userId(driver.getUserId())
                .vehicleId(vehicle.getId())
                .stationId(station.getStationId())
                .chargingPointId(chargingPoint.getChargingPointId())
                .startTime(startTime)
                .endTime(endTime)
                .currentBattery(request.getCurrentBattery())
                .targetBattery(request.getTargetBattery())
                .build();

        OrderResponseDTO createdOrder;
        try {
            createdOrder = orderService.confirmOrder(confirmRequest);
        } catch (Exception e) {
            log.error("Error confirming order: {}", e.getMessage());
            throw new RuntimeException("Không thể tạo order: " + e.getMessage());
        }

        // 10. Gửi thông báo cho driver
        try {
            String staffName = "Staff";
            if (request.getStaffId() != null) {
                User staff = userRepository.findById(request.getStaffId()).orElse(null);
                if (staff != null) {
                    staffName = staff.getFullName();
                }
            }

            notificationService.createGeneralNotification(
                    List.of(driver.getUserId()),
                    "Phiên sạc được tạo bởi Staff",
                    String.format(" Staff %s đã tạo phiên sạc cho bạn tại %s - Trụ #%d\n" +
                                    "Thời gian: %s - %s\n" +
                                    "Vui lòng đến trạm và bắt đầu sạc!",
                            staffName,
                            station.getStationName(),
                            chargingPoint.getChargingPointId(),
                            startTime,
                            endTime)
            );
        } catch (Exception e) {
            log.error("Failed to send notification: {}", e.getMessage());
        }

        // 11. Trả về OrderResponseDTO
        log.info("Successfully created immediate session. Order ID: {}", createdOrder.getOrderId());
        return createdOrder;
    }

    @Override
    public List<ChargingPointDTO> getChargingPointsByStation(Long stationId) {
        log.info("Getting charging points for station: {}", stationId);

        // Validate station
        ChargingStation station = chargingStationRepository.findById(stationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trạm sạc với ID: " + stationId));

        // Lấy tất cả charging points của trạm
        List<ChargingPoint> chargingPoints = chargingPointRepository.findByStation_StationId(stationId);

        // Convert sang DTO
        return chargingPoints.stream()
                .map(point -> {
                    ChargingPointDTO dto = new ChargingPointDTO();
                    dto.setChargingPointId(point.getChargingPointId());
                    dto.setChargingPointName(point.getChargingPointName());
                    dto.setStatus(point.getStatus());
                    dto.setStationId(point.getStation().getStationId());
                    dto.setConnectorTypeId(point.getConnectorType().getConnectorTypeId());
                    dto.setTypeName(point.getConnectorType().getTypeName());
                    dto.setPowerOutput(point.getConnectorType().getPowerOutput());
                    dto.setPricePerKwh(point.getConnectorType().getPricePerKWh());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<TransactionHistoryDTO> getTransactionHistoryByStation(Long stationId) {
        log.info("Getting transaction history for station: {}", stationId);

        // Validate station
        ChargingStation station = chargingStationRepository.findById(stationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trạm sạc với ID: " + stationId));

        // Lấy tất cả transactions của trạm
        List<Transaction> transactions = transactionRepository
                .findBySessionOrderChargingPointStationStationIdOrderByCreatedAtDesc(stationId);

        // Convert sang DTO
        return transactions.stream()
                .map(tx -> {
                    Session session = tx.getSession();
                    Order order = session.getOrder();
                    User user = order.getUser();

                    return TransactionHistoryDTO.builder()
                            .transactionId(tx.getTransactionId())
                            .amount(java.math.BigDecimal.valueOf(tx.getAmount()))
                            .paymentMethod(tx.getPaymentMethod())
                            .status(tx.getStatus())
                            .createdAt(tx.getCreatedAt())
                            .paymentTime(tx.getPaymentTime())
                            .userId(user.getUserId())
                            .userName(user.getFullName())
                            .userEmail(user.getEmail())
                            .sessionId(session.getSessionId())
                            .sessionStartTime(session.getStartTime())
                            .sessionEndTime(session.getEndTime())
                            .powerConsumed(java.math.BigDecimal.valueOf(session.getPowerConsumed()))
                            .stationName(station.getStationName())
                            .stationAddress(station.getAddress())
                            .vnpayTransactionNo(tx.getVnpayTransactionNo())
                            .vnpayBankCode(tx.getVnpayBankCode())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TransactionHistoryDTO processOnsitePayment(Long sessionId, Long staffId) {
        log.info("Processing onsite payment for session: {} by staff: {}", sessionId, staffId);

        // 1. Validate staff
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy staff với ID: " + staffId));

        if (staff.getRole() != User.UserRole.STAFF) {
            throw new RuntimeException("User này không phải là STAFF");
        }

        // 2. Lấy session (trực tiếp từ sessionId)
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên sạc với ID: " + sessionId));

        Order order = session.getOrder();
        if (order == null) {
            throw new RuntimeException("Session không có order liên kết");
        }

        // 2.5. Kiểm tra staff có được phân công vào trạm này không
        ChargingStation station = order.getChargingPoint().getStation();
        if (station.getStaffId() == null) {
            throw new RuntimeException("Trạm này chưa có staff được phân công");
        }

        if (!station.getStaffId().equals(staffId)) {
            throw new RuntimeException(
                    String.format("Staff không được phân công vào trạm này. " +
                            "Chỉ staff được phân công (ID: %d) mới có thể xử lý thanh toán tại chỗ tại trạm %s",
                            station.getStaffId(), station.getStationName())
            );
        }
        // 3. Kiểm tra session đã hoàn thành chưa
        if (session.getStatus() != Session.SessionStatus.COMPLETED) {
            throw new RuntimeException("Phiên sạc chưa hoàn thành. Status hiện tại: " + session.getStatus());
        }

        // 4. Kiểm tra đã có transaction chưa
        Optional<Transaction> existingTx = transactionRepository.findBySessionAndUser(session, order.getUser());
        if (existingTx.isPresent()) {
            Transaction existing = existingTx.get();
            if (existing.getStatus() == Transaction.Status.SUCCESS) {
                throw new RuntimeException("Phiên sạc này đã được thanh toán rồi");
            }
        }

        // 5. Tính tổng tiền phải trả (baseCost + fees)
        double totalAmount = session.getBaseCost();
        if (session.getFees() != null && !session.getFees().isEmpty()) {
            totalAmount += session.getFees().stream()
                    .mapToDouble(Fee::getAmount)
                    .sum();
        }

        // 6. Tạo transaction mới với payment method = CASH
        Transaction transaction = new Transaction();
        transaction.setSession(session);
        transaction.setUser(order.getUser());
        transaction.setAmount(totalAmount);
        transaction.setPaymentMethod(Transaction.PaymentMethod.CASH);
        transaction.setStatus(Transaction.Status.SUCCESS);
        transaction.setPaymentTime(LocalDateTime.now());
        transaction.setCreatedAt(LocalDateTime.now());

        transaction = transactionRepository.save(transaction);

        log.info("Created onsite payment transaction: {} for session: {}", transaction.getTransactionId(), sessionId);

        // 7. Gửi thông báo cho driver
        try {
            notificationService.createGeneralNotification(
                    List.of(order.getUser().getUserId()),
                    "Thanh toán tại chỗ thành công",
                    String.format(" Staff %s đã xác nhận thanh toán tại chỗ\n" +
                                    "Số tiền: %.0f VND\n" +
                                    "Trạm: %s\n" +
                                    "Cảm ơn bạn đã s��� dụng dịch vụ!",
                            staff.getFullName(),
                            totalAmount,
                            order.getChargingPoint().getStation().getStationName())
            );
        } catch (Exception e) {
            log.error("Failed to send notification: {}", e.getMessage());
        }

        // 8. Convert sang DTO và return
        return TransactionHistoryDTO.builder()
                .transactionId(transaction.getTransactionId())
                .amount(java.math.BigDecimal.valueOf(transaction.getAmount()))
                .paymentMethod(transaction.getPaymentMethod())
                .status(transaction.getStatus())
                .createdAt(transaction.getCreatedAt())
                .paymentTime(transaction.getPaymentTime())
                .userId(order.getUser().getUserId())
                .userName(order.getUser().getFullName())
                .userEmail(order.getUser().getEmail())
                .sessionId(session.getSessionId())
                .sessionStartTime(session.getStartTime())
                .sessionEndTime(session.getEndTime())
                .powerConsumed(java.math.BigDecimal.valueOf(session.getPowerConsumed()))
                .stationName(order.getChargingPoint().getStation().getStationName())
                .stationAddress(order.getChargingPoint().getStation().getAddress())
                .vnpayTransactionNo(transaction.getVnpayTransactionNo())
                .vnpayBankCode(transaction.getVnpayBankCode())
                .build();
    }

}
