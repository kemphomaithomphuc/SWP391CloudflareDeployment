package swp391.code.swp391.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import swp391.code.swp391.dto.*;
import swp391.code.swp391.entity.*;
import swp391.code.swp391.exception.ApiRequestException;
import swp391.code.swp391.repository.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Duration;
import java.time.chrono.ChronoLocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final VehicleRepository vehicleRepository;
    private final ChargingStationRepository stationRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ChargingPointRepository chargingPointRepository;
    private final SubscriptionService subscriptionService;

    // ========== CẤU HÌNH SLOT ==========
    private static final int SLOT_DURATION_MINUTES = 120; // 2 giờ mỗi slot
    private static final int MIN_GAP_MINUTES = 30; // Thời gian tối thiểu cho mini-slot
    private static final LocalTime OPENING_TIME = LocalTime.of(0, 0);
    private static final LocalTime CLOSING_TIME = LocalTime.of(23, 30);

    /**
     * Tìm các slot khả dụng theo cơ chế mới:
     * 1. Chia ngày thành các slot cố định 2 tiếng
     * 2. Tìm các slot trống
     * 3. Tìm các mini-slot (khoảng trống < 2 tiếng từ các đơn kết thúc sớm)
     */
    @Transactional(readOnly = true)
    public AvailableSlotsResponseDTO findAvailableSlots(OrderRequestDTO request) {

        // 1. Lấy thông tin xe
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ApiRequestException("Không tìm thấy xe"));

        // 2. Lấy thông tin trạm sạc
        ChargingStation station = stationRepository.findByStationId(request.getStationId())
                .orElseThrow(() -> new ApiRequestException("Không tìm thấy trạm sạc"));

        // 3. Kiểm tra connector tương thích
        List<ConnectorType> compatibleConnectors = vehicle.getCarModel().getConnectorTypes();
        if (compatibleConnectors == null || compatibleConnectors.isEmpty()) {
            throw new ApiRequestException("Xe này không có thông tin connector type");
        }

        // 4. Tính thông tin sạc
        double batteryCapacity = vehicle.getCarModel().getCapacity();
        double batteryToCharge = request.getTargetBattery() - request.getCurrentBattery();
        double energyToCharge = (batteryToCharge / 100.0) * batteryCapacity;

        // 5. Lấy charging points tương thích
        List<ChargingPoint> compatiblePoints = station.getChargingPoint().stream()
                .filter(point -> point.getStatus() == ChargingPoint.ChargingPointStatus.AVAILABLE)
                .filter(point -> compatibleConnectors.contains(point.getConnectorType()))
                .toList();

        if (compatiblePoints.isEmpty()) {
            throw new ApiRequestException("Trạm này không có trụ sạc tương thích với xe của bạn");
        }

        // 6. Tìm slots khả dụng cho từng charging point
        List<ChargingPointAvailabilityDTO> chargingPointsAvailability = new ArrayList<>();
        for (ChargingPoint point : compatiblePoints) {
            int requiredMinutes = calculateChargingDuration(energyToCharge, point.getConnectorType().getPowerOutput());
            ChargingPointAvailabilityDTO availability = findAvailableSlotsForPoint(point, requiredMinutes, energyToCharge);
            if (!availability.getAvailableSlots().isEmpty()) {
                chargingPointsAvailability.add(availability);
            }
        }

        if (chargingPointsAvailability.isEmpty()) {
            throw new ApiRequestException("Không tìm thấy slot trống phù hợp trong ngày hôm nay");
        }

        // 7. Build response
        return AvailableSlotsResponseDTO.builder()
                .stationId(station.getStationId())
                .stationName(station.getStationName())
                .address(station.getAddress())
                .latitude(station.getLatitude())
                .longitude(station.getLongitude())
                .vehicleInfo(buildVehicleInfo(vehicle))
                .chargingInfo(AvailableSlotsResponseDTO.ChargingInfo.builder()
                        .currentBattery(request.getCurrentBattery())
                        .targetBattery(request.getTargetBattery())
                        .batteryToCharge(batteryToCharge)
                        .energyToCharge(energyToCharge)
                        .build())
                .chargingPoints(chargingPointsAvailability)
                .build();
    }

    /**
     * Tìm các slot khả dụng cho một charging point cụ thể
     * Bao gồm:
     * - Fixed slots (2 giờ): các slot cố định còn trống
     * - Mini slots (< 2 giờ): các khoảng trống từ đơn kết thúc sớm
     */
    private ChargingPointAvailabilityDTO findAvailableSlotsForPoint(ChargingPoint point, int requiredMinutes, double energyToCharge) {
        LocalDate today = LocalDate.now();
        LocalDateTime dayStart = LocalDateTime.of(today, OPENING_TIME);
        LocalDateTime dayEnd = LocalDateTime.of(today, CLOSING_TIME);

        // Lấy các đơn đang hoạt động
        List<Order> existingOrders = orderRepository.findActiveOrdersByChargingPoint(
                point.getChargingPointId(),
                LocalDateTime.now()
        );
        existingOrders.sort((o1, o2) -> o1.getStartTime().compareTo(o2.getStartTime()));

        // Tạo danh sách tất cả các slot trong ngày
        List<TimeSlot> allFixedSlots = generateFixedSlots(dayStart, dayEnd);

        // Đánh dấu slot nào đã bị book
        List<TimeSlot> availableFixedSlots = filterAvailableFixedSlots(allFixedSlots, existingOrders);

        // Tìm mini-slots (khoảng trống < 2 giờ)
        List<TimeSlot> miniSlots = findMiniSlots(existingOrders, dayStart, dayEnd);

        // Gộp tất cả slots và convert sang DTO
        List<TimeSlot> allAvailableSlots = new ArrayList<>();
        allAvailableSlots.addAll(availableFixedSlots);
        allAvailableSlots.addAll(miniSlots);

        // Lọc ra các slot đủ thời gian sạc
        List<AvailableTimeSlotDTO> sufficientSlots = allAvailableSlots.stream()
                .filter(slot -> slot.durationMinutes >= requiredMinutes)
                .map(slot -> createAvailableSlotDTO(point, slot, requiredMinutes, energyToCharge))
                .collect(Collectors.toList());

        int totalAvailableMinutes = sufficientSlots.stream()
                .mapToInt(AvailableTimeSlotDTO::getAvailableMinutes)
                .sum();

        ConnectorType connector = point.getConnectorType();

        return ChargingPointAvailabilityDTO.builder()
                .chargingPointId(point.getChargingPointId())
                .connectorTypeName(connector.getTypeName())
                .chargingPower(connector.getPowerOutput())
                .pricePerKwh(connector.getPricePerKWh())
                .requiredMinutes(requiredMinutes)
                .availableSlots(sufficientSlots)
                .totalAvailableMinutes(totalAvailableMinutes)
                .build();
    }

    /**
     * Tạo tất cả các slot cố định trong ngày (mỗi slot 2 giờ)
     * VD: 00:00-02:00, 02:00-04:00, 04:00-06:00, ...
     */
    private List<TimeSlot> generateFixedSlots(LocalDateTime dayStart, LocalDateTime dayEnd) {
        List<TimeSlot> slots = new ArrayList<>();
        LocalDateTime slotStart = dayStart;

        while (slotStart.plusMinutes(SLOT_DURATION_MINUTES).isBefore(dayEnd) ||
                slotStart.plusMinutes(SLOT_DURATION_MINUTES).isEqual(dayEnd)) {
            LocalDateTime slotEnd = slotStart.plusMinutes(SLOT_DURATION_MINUTES);
            slots.add(new TimeSlot(slotStart, slotEnd, SLOT_DURATION_MINUTES, SlotType.FIXED));
            slotStart = slotEnd;
        }

        return slots;
    }

    /**
     * Lọc ra các fixed slot còn trống (không bị order nào chiếm)
     */
    private List<TimeSlot> filterAvailableFixedSlots(List<TimeSlot> allSlots, List<Order> existingOrders) {
        LocalDateTime now = LocalDateTime.now();

        return allSlots.stream()
                .filter(slot -> slot.start.isAfter(now)) // Chỉ lấy slot trong tương lai
                .filter(slot -> !isSlotOccupied(slot, existingOrders))
                .collect(Collectors.toList());
    }

    /**
     * Kiểm tra slot có bị order nào chiếm không
     */
    private boolean isSlotOccupied(TimeSlot slot, List<Order> orders) {
        return orders.stream().anyMatch(order ->
                // Order overlap với slot nếu:
                // start < order.end && end > order.start
                slot.start.isBefore(order.getEndTime()) &&
                        slot.end.isAfter(order.getStartTime())
        );
    }

    /**
     * Tìm các mini-slot (khoảng trống < 2 giờ do đơn kết thúc sớm)
     * Phù hợp cho các đơn sạc nhanh
     */
    private List<TimeSlot> findMiniSlots(List<Order> existingOrders, LocalDateTime dayStart, LocalDateTime dayEnd) {
        List<TimeSlot> miniSlots = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime searchStart = now.isAfter(dayStart) ? now : dayStart;

        if (searchStart.isAfter(dayEnd) || searchStart.equals(dayEnd)) {
            return miniSlots;
        }

        if (existingOrders.isEmpty()) {
            return miniSlots; // Không có mini-slot nếu không có order nào
        }

        // Kiểm tra gap trước order đầu tiên
        Order firstOrder = existingOrders.get(0);
        if (searchStart.isBefore(firstOrder.getStartTime())) {
            int gapMinutes = (int) Duration.between(searchStart, firstOrder.getStartTime()).toMinutes();
            if (gapMinutes >= MIN_GAP_MINUTES && gapMinutes < SLOT_DURATION_MINUTES) {
                miniSlots.add(new TimeSlot(searchStart, firstOrder.getStartTime(), gapMinutes, SlotType.MINI));
            }
        }

        // Kiểm tra gap giữa các orders
        for (int i = 0; i < existingOrders.size() - 1; i++) {
            LocalDateTime gapStart = existingOrders.get(i).getEndTime();
            LocalDateTime gapEnd = existingOrders.get(i + 1).getStartTime();

            if (gapStart.isBefore(gapEnd)) {
                int gapMinutes = (int) Duration.between(gapStart, gapEnd).toMinutes();
                if (gapMinutes >= MIN_GAP_MINUTES && gapMinutes < SLOT_DURATION_MINUTES) {
                    miniSlots.add(new TimeSlot(gapStart, gapEnd, gapMinutes, SlotType.MINI));
                }
            }
        }

        // Kiểm tra gap sau order cuối cùng
        Order lastOrder = existingOrders.get(existingOrders.size() - 1);
        if (lastOrder.getEndTime().isBefore(dayEnd)) {
            int gapMinutes = (int) Duration.between(lastOrder.getEndTime(), dayEnd).toMinutes();
            if (gapMinutes >= MIN_GAP_MINUTES && gapMinutes < SLOT_DURATION_MINUTES) {
                miniSlots.add(new TimeSlot(lastOrder.getEndTime(), dayEnd, gapMinutes, SlotType.MINI));
            }
        }

        return miniSlots;
    }

    /**
     * Tạo AvailableTimeSlotDTO từ TimeSlot
     */
    private AvailableTimeSlotDTO createAvailableSlotDTO(ChargingPoint point, TimeSlot slot, int requiredMinutes, double energyToCharge) {
        ConnectorType connector = point.getConnectorType();
        double estimatedCost = energyToCharge * connector.getPricePerKWh();

        return AvailableTimeSlotDTO.builder()
                .freeFrom(slot.start)
                .freeTo(slot.end)
                .availableMinutes(slot.durationMinutes)
                .requiredMinutes(requiredMinutes)
                .estimatedCost(estimatedCost)
                .slotType(slot.type.name()) // "FIXED" hoặc "MINI"
                .build();
    }

    /**
     * Tính thời gian sạc cần thiết
     */
    private int calculateChargingDuration(double energyToChargeKwh, double chargingPowerKw) {
        double theoreticalHours = energyToChargeKwh / chargingPowerKw;
        double adjustedHours = theoreticalHours * 1.15; // Thêm 15% buffer
        return (int) Math.ceil(adjustedHours * 60);
    }

    /**
     * Xác nhận đặt chỗ
     * User có thể book 1 hoặc nhiều slot liên tiếp
     */
    @Transactional
    public OrderResponseDTO confirmOrder(ConfirmOrderDTO request) {
        // ===== 1. VALIDATE USER =====
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ApiRequestException("Không tìm thấy user"));

        // ===== 2. KIỂM TRA SUBSCRIPTION - ĐẶT LỊCH TRƯỚC =====
        if (!subscriptionService.canBookOnDate(user.getUserId(), request.getStartTime())) {
            int advanceDays = subscriptionService.getAdvanceBookingDays(user.getUserId());
            throw new ApiRequestException("Gói của bạn chỉ cho phép đặt lịch trước " + advanceDays + " ngày. " +
                    "Nâng cấp lên gói PLUS hoặc PRO để đặt sớm hơn!");
        }

        // ===== 3. KIỂM TRA GIỚI HẠN ĐƠN ĐẶT CHỖ =====
        int currentActiveOrder = orderRepository.countActiveOrdersByUser(user);
        if (!subscriptionService.canCreateMoreOrder(user.getUserId(), currentActiveOrder)) {
            throw new ApiRequestException("Bạn đã đạt giới hạn đơn đặt chỗ hiện tại. " +
                    "Nâng cấp lên gói PLUS hoặc PRO để được đặt nhiều hơn!");
        }

        // ===== 4. VALIDATE VEHICLE =====
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ApiRequestException("Không tìm thấy xe"));

        if (!vehicle.getUser().getUserId().equals(user.getUserId())) {
            throw new ApiRequestException("Xe này không thuộc về bạn");
        }

        // ===== 5. VALIDATE STATION =====
        ChargingStation station = stationRepository.findById(request.getStationId())
                .orElseThrow(() -> new ApiRequestException("Không tìm thấy trạm sạc"));

        // ===== 6. LOCK VÀ VALIDATE CHARGING POINT =====
        ChargingPoint chargingPoint = chargingPointRepository.findByIdWithLock(request.getChargingPointId())
                .orElseThrow(() -> new ApiRequestException("Không tìm thấy điểm sạc"));

        if (!chargingPoint.getStation().getStationId().equals(station.getStationId())) {
            throw new ApiRequestException("Điểm sạc không thuộc về trạm này");
        }

        if (chargingPoint.getStatus() != ChargingPoint.ChargingPointStatus.AVAILABLE) {
            throw new ApiRequestException("Điểm sạc không khả dụng");
        }

        // ===== 7. VALIDATE SLOT BOOKING =====
        // Kiểm tra thời gian đặt có hợp lệ với slot system không
        validateSlotBooking(request.getStartTime(), request.getEndTime());

        // ===== 8. KIỂM TRA TRÙNG LỊCH - DOUBLE CHECK SAU KHI LOCK =====
        List<Order> overlappingOrders = orderRepository.findOverlappingOrders(
                chargingPoint.getChargingPointId(),
                request.getStartTime(),
                request.getEndTime()
        );

        boolean hasConflict = overlappingOrders.stream()
                .anyMatch(order -> order.getStatus() == Order.Status.BOOKED ||
                        order.getStatus() == Order.Status.CHARGING);

        if (hasConflict) {
            throw new ApiRequestException("Slot này đã có người đặt. Vui lòng chọn slot khác.");
        }

        // ===== 9. KIỂM TRA USER ĐÃ CÓ ORDER TRÙNG THỜI GIAN CHƯA =====
        if (orderRepository.hasUserOrderInTimeRange(user.getUserId(), request.getStartTime(), request.getEndTime())) {
            throw new ApiRequestException("Bạn đã có đơn đặt chỗ trong khung giờ này");
        }

        // ===== 10. TẠO ORDER MỚI =====
        Order order = Order.builder()
                .user(user)
                .vehicle(vehicle)
                .chargingPoint(chargingPoint)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(Order.Status.BOOKED)
                .startedBattery(request.getCurrentBattery())
                .expectedBattery(request.getTargetBattery())
                .createdAt(LocalDateTime.now())
                .build();

        order = orderRepository.save(order);

        return order.getOrderId() != null ? convertToDTO(order) : null;
    }

    /**
     * Validate booking time có hợp lệ với slot system không
     * - Nếu là fixed slot: phải trùng khớp với slot boundary
     * - Nếu là mini slot: có thể linh động hơn
     */
    private void validateSlotBooking(LocalDateTime startTime, LocalDateTime endTime) {
        LocalDateTime now = LocalDateTime.now();

        // Không được book trong quá khứ
        if (startTime.isBefore(now)) {
            throw new ApiRequestException("Không thể đặt lịch trong quá khứ");
        }

        // Kiểm tra trong giờ mở cửa
        if (startTime.toLocalTime().isBefore(OPENING_TIME) ||
                endTime.toLocalTime().isAfter(CLOSING_TIME)) {
            throw new ApiRequestException("Thời gian đặt phải trong giờ hoạt động của trạm");
        }

        // Kiểm tra thời gian tối thiểu
        int bookingMinutes = (int) Duration.between(startTime, endTime).toMinutes();
        if (bookingMinutes < MIN_GAP_MINUTES) {
            throw new ApiRequestException("Thời gian đặt tối thiểu là " + MIN_GAP_MINUTES + " phút");
        }
    }

    /**
     * Hủy đơn đặt chỗ
     */
    @Override
    @Transactional
    public OrderResponseDTO cancelOrder(CancelOrderDTO request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ApiRequestException("Không tìm thấy đơn đặt chỗ"));

        if (!order.getUser().getUserId().equals(request.getUserId())) {
            throw new ApiRequestException("Bạn không có quyền hủy đơn đặt chỗ này");
        }

        if (!order.canBeCancelled()) {
            throw new ApiRequestException("Không thể hủy đơn đặt chỗ với trạng thái: " + order.getStatus());
        }

        // Kiểm tra thời gian hủy theo subscription
        double cancellationHours = subscriptionService.getCancelationHour(request.getUserId());
        LocalDateTime cancellationDeadline = order.getStartTime().minusHours((long)cancellationHours);

        if(LocalDateTime.now().isAfter(cancellationDeadline)) {
            throw new ApiRequestException(
                    String.format("Không thể hủy đơn đặt chỗ trước %.1f giờ trước khi bắt đầu sạc. " +
                            "Nâng cấp lên gói PLUS hoặc PRO để được hủy đơn đặt chỗ linh hoạt hơn!", cancellationHours)
            );
        }

        order.setStatus(Order.Status.CANCELED);
        order.setCanceledAt(LocalDateTime.now());
        order.setCancellationReason(
                request.getReason() != null && !request.getReason().isBlank()
                        ? request.getReason()
                        : "Người dùng hủy"
        );

        order = orderRepository.save(order);
        return convertToDTO(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponseDTO> getUserOrders(Long userId, Order.Status status) {
        List<Order> orders;

        if (status != null) {
            orders = orderRepository.findByUser_UserIdAndStatus(userId, status);
        } else {
            orders = orderRepository.findByUser_UserId(userId);
        }

        return orders.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<OrderResponseDTO> getStationOrders(Long stationId) {
        List<Order> orders = orderRepository.findByChargingPoint_Station_StationId(stationId);

        List<OrderResponseDTO> orderDTOs = orders.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return orderDTOs.isEmpty() ? null : orderDTOs;
    }

    private AvailableSlotsResponseDTO.VehicleInfo buildVehicleInfo(Vehicle vehicle) {
        List<String> compatibleConnectors = vehicle.getCarModel().getConnectorTypes()
                .stream()
                .map(ConnectorType::getTypeName)
                .collect(Collectors.toList());

        return AvailableSlotsResponseDTO.VehicleInfo.builder()
                .vehicleId(vehicle.getId())
                .brand(vehicle.getCarModel().getBrand())
                .model(vehicle.getCarModel().getModel())
                .batteryCapacity(vehicle.getCarModel().getCapacity())
                .compatibleConnectors(compatibleConnectors)
                .build();
    }

    public OrderResponseDTO convertToDTO(Order order) {
        if (order == null) return null;

        int estimatedDuration = calculateChargingDuration(
                (order.getExpectedBattery() - order.getStartedBattery()) / 100.0 * order.getVehicle().getCarModel().getCapacity(),
                order.getChargingPoint().getConnectorType().getPowerOutput());

        double energyToCharge = order.getExpectedBattery() - order.getStartedBattery();
        double estimatedCost = energyToCharge * order.getChargingPoint().getConnectorType().getPricePerKWh();

        return OrderResponseDTO.builder()
                .orderId(order.getOrderId())
                .stationName(order.getChargingPoint().getStation() != null ? order.getChargingPoint().getStation().getStationName() : null)
                .stationAddress(order.getChargingPoint().getStation() != null ? order.getChargingPoint().getStation().getAddress() : null)
                .connectorType(order.getChargingPoint().getConnectorType() != null ? order.getChargingPoint().getConnectorType().getTypeName() : null)
                .startTime(order.getStartTime())
                .endTime(order.getEndTime())
                .estimatedDuration(estimatedDuration)
                .energyToCharge(energyToCharge)
                .chargingPower(order.getChargingPoint().getConnectorType().getPowerOutput())
                .pricePerKwh(order.getChargingPoint().getConnectorType().getPricePerKWh())
                .estimatedCost(estimatedCost)
                .status(order.getStatus() != null ? order.getStatus().name() : null)
                .createdAt(order.getCreatedAt())
                .build();
    }

    // ========== HELPER CLASSES ==========

    /**
     * Đại diện cho một time slot
     */
    @lombok.AllArgsConstructor
    private static class TimeSlot {
        LocalDateTime start;
        LocalDateTime end;
        int durationMinutes;
        SlotType type;
    }

    /**
     * Loại slot
     */
    private enum SlotType {
        FIXED,  // Slot cố định 2 giờ
        MINI    // Slot ngắn hơn (từ khoảng trống)
    }
}