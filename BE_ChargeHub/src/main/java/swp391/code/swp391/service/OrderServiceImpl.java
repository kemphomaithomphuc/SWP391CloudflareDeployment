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

    private static final LocalTime OPENING_TIME = LocalTime.of(0, 0);
    private static final LocalTime CLOSING_TIME = LocalTime.of(23, 30);
    private final SubscriptionService subscriptionService;

    @Transactional(readOnly = true)
    public AvailableSlotsResponseDTO findAvailableSlots(OrderRequestDTO request) {

        // 1. Lấy thông tin xe
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ApiRequestException("Không tìm thấy xe"));

        // 2. Lấy thông tin trạm sạc
        ChargingStation station = stationRepository.findByStationId(request.getStationId())
                .orElseThrow(() -> new ApiRequestException("Không tìm thấy trạm sạc"));


        // 3. Lấy danh sách connector types tương thích với xe
        List<ConnectorType> compatibleConnectors = vehicle.getCarModel().getConnectorTypes();
        if (compatibleConnectors == null || compatibleConnectors.isEmpty()) {
            throw new ApiRequestException("Xe này không có thông tin connector type");
        }

        // 4. Tính thông tin sạc
        double batteryCapacity = vehicle.getCarModel().getCapacity();
        double batteryToCharge = request.getTargetBattery() - request.getCurrentBattery();
        double energyToCharge = (batteryToCharge / 100.0) * batteryCapacity;

        // 5. Lấy tất cả charging points của trạm có connector tương thích
        List<ChargingPoint> compatiblePoints = station.getChargingPoint().stream()
                .filter(point -> point.getStatus() == ChargingPoint.ChargingPointStatus.AVAILABLE)
                .filter(point -> compatibleConnectors.contains(point.getConnectorType()))
                .toList();

        if (compatiblePoints.isEmpty()) {
            throw new ApiRequestException("Trạm này không có trụ sạc tương thích với xe của bạn");
        }


        // 6. Tìm gaps đủ thời gian cho từng charging point
        List<ChargingPointAvailabilityDTO> chargingPointsAvailability = new ArrayList<>();
        for (ChargingPoint point : compatiblePoints) {
            int requiredMinutes = calculateChargingDuration(energyToCharge, point.getConnectorType().getPowerOutput());
            ChargingPointAvailabilityDTO availability = findAvailableGap(point, requiredMinutes, energyToCharge);
            if (!availability.getAvailableSlots().isEmpty()) {
                chargingPointsAvailability.add(availability);
            }
        }

        if (chargingPointsAvailability.isEmpty()) {
            throw new ApiRequestException("Không tìm thấy khoảng thời gian trống đủ để sạc trong ngày hôm nay");
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

    private int calculateChargingDuration(double energyToChargeKwh, double chargingPowerKw) {
        double theoreticalHours = energyToChargeKwh / chargingPowerKw;
        double adjustedHours = theoreticalHours * 1.15;
        return (int) Math.ceil(adjustedHours * 60);
    }

    private ChargingPointAvailabilityDTO findAvailableGap(ChargingPoint point, int requiredMinutes, double energyToCharge) {
        LocalDate today = LocalDate.now();
        LocalDateTime dayStart = LocalDateTime.of(today, OPENING_TIME);
        LocalDateTime dayEnd = LocalDateTime.of(today, CLOSING_TIME);

        List<Order> existingOrders = orderRepository.findActiveOrdersByChargingPoint(point.getChargingPointId(), LocalDateTime.now());
        existingOrders.sort((o1, o2) -> o1.getStartTime().compareTo(o2.getStartTime()));

        List<TimeGap> allGaps = findAllGaps(existingOrders, dayStart, dayEnd);

        List<AvailableTimeSlotDTO> sufficientGaps = allGaps.stream()
                .filter(gap -> gap.durationMinutes >= requiredMinutes)
                .map(gap -> createAvailableSlot(point, gap, requiredMinutes, energyToCharge))
                .collect(Collectors.toList());

        int totalAvailableMinutes = sufficientGaps.stream().mapToInt(AvailableTimeSlotDTO::getAvailableMinutes).sum();

        ConnectorType connector = point.getConnectorType();

        return ChargingPointAvailabilityDTO.builder()
                .chargingPointId(point.getChargingPointId())
                .connectorTypeName(connector.getTypeName())
                .chargingPower(connector.getPowerOutput())
                .pricePerKwh(connector.getPricePerKWh())
                .requiredMinutes(requiredMinutes)
                .availableSlots(sufficientGaps)
                .totalAvailableMinutes(totalAvailableMinutes)
                .build();
    }

    private List<TimeGap> findAllGaps(List<Order> existingOrders, LocalDateTime dayStart, LocalDateTime dayEnd) {
        List<TimeGap> gaps = new ArrayList<>();
        LocalDateTime currentTime = LocalDateTime.now();
        LocalDateTime searchStart = currentTime.isBefore(dayStart) ? dayStart : currentTime;

        if (searchStart.toLocalTime().isAfter(CLOSING_TIME) || searchStart.toLocalTime().equals(CLOSING_TIME)) {
            return gaps;
        }

        if (existingOrders.isEmpty()) {
            gaps.add(new TimeGap(searchStart, dayEnd, (int) Duration.between(searchStart, dayEnd).toMinutes()));
        } else {
            Order firstOrder = existingOrders.get(0);
            if (searchStart.isBefore(firstOrder.getStartTime())) {
                gaps.add(new TimeGap(searchStart, firstOrder.getStartTime(), (int) Duration.between(searchStart, firstOrder.getStartTime()).toMinutes()));
            }
            for (int i = 0; i < existingOrders.size() - 1; i++) {
                LocalDateTime gapStart = existingOrders.get(i).getEndTime();
                LocalDateTime gapEnd = existingOrders.get(i + 1).getStartTime();
                if (gapStart.isBefore(gapEnd)) {
                    gaps.add(new TimeGap(gapStart, gapEnd, (int) Duration.between(gapStart, gapEnd).toMinutes()));
                }
            }
            Order lastOrder = existingOrders.get(existingOrders.size() - 1);
            if (lastOrder.getEndTime().isBefore(dayEnd)) {
                gaps.add(new TimeGap(lastOrder.getEndTime(), dayEnd, (int) Duration.between(lastOrder.getEndTime(), dayEnd).toMinutes()));
            }
        }
        return gaps;
    }

    private AvailableTimeSlotDTO createAvailableSlot(ChargingPoint point, TimeGap gap, int requiredMinutes, double energyToCharge) {
        ConnectorType connector = point.getConnectorType();
        double estimatedCost = energyToCharge * connector.getPricePerKWh();

        return AvailableTimeSlotDTO.builder()
                //.chargingPointId(point.getChargingPointId())
                //.connectorTypeName(connector.getTypeName())
                //.chargingPower(connector.getPowerOutput())
                //.pricePerKwh(connector.getPricePerKWh())
                .freeFrom(gap.start)
                .freeTo(gap.end)
                .availableMinutes(gap.durationMinutes)
                .requiredMinutes(requiredMinutes)
                .estimatedCost(estimatedCost)
                .build();
    }

    @Transactional
    public OrderResponseDTO confirmOrder(ConfirmOrderDTO request) {
        // ===== BƯỚC 1: VALIDATE USER =====
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

        // ===== 6. LOCK VÀ VALIDATE CHARGING POINT - QUAN TRỌNG ĐỂ TRÁNH RACE CONDITION =====
        // Sử dụng pessimistic lock để đảm bảo chỉ 1 transaction có thể book charging point tại 1 thời điểm
        ChargingPoint chargingPoint = chargingPointRepository.findByIdWithLock(request.getChargingPointId())
                .orElseThrow(() -> new ApiRequestException("Không tìm thấy điểm sạc"));

        // Kiểm tra charging point có thuộc station không
        if (!chargingPoint.getStation().getStationId().equals(station.getStationId())) {
            throw new ApiRequestException("Điểm sạc không thuộc về trạm này");
        }

        // Kiểm tra status của charging point
        if (chargingPoint.getStatus() != ChargingPoint.ChargingPointStatus.AVAILABLE) {
            throw new ApiRequestException("Điểm sạc không khả dụng");
        }

        // ===== 7. KIỂM TRA TRÙNG LỊCH - DOUBLE CHECK SAU KHI LOCK =====
        // Kiểm tra lại xem có order nào trùng thời gian không (sau khi đã lock)
        List<Order> overlappingOrders = orderRepository.findOverlappingOrders(
                chargingPoint.getChargingPointId(),
                request.getStartTime(),
                request.getEndTime()
        );

        // Nếu có order BOOKED hoặc CHARGING thì không cho đặt
        boolean hasConflict = overlappingOrders.stream()
                .anyMatch(order -> order.getStatus() == Order.Status.BOOKED ||
                                  order.getStatus() == Order.Status.CHARGING);

        if (hasConflict) {
            throw new ApiRequestException("Khung giờ này đã có người đặt. Vui lòng chọn thời gian khác.");
        }

        // ===== 8. KIỂM TRA USER ĐÃ CÓ ORDER TRÙNG THỜI GIAN CHƯA =====
        if (orderRepository.hasUserOrderInTimeRange(user.getUserId(), request.getStartTime(), request.getEndTime())) {
            throw new ApiRequestException("Bạn đã có đơn đặt chỗ trong khung giờ này");
        }

        // ===== 9. TẠO ORDER MỚI =====
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

    @lombok.AllArgsConstructor
    private static class TimeGap {
        LocalDateTime start;
        LocalDateTime end;
        int durationMinutes;
    }
    public OrderResponseDTO convertToDTO(Order order) {
        if (order == null) return null;
        int estimatedDuration =  calculateChargingDuration(
                (order.getExpectedBattery() - order.getStartedBattery()) / 100.0 * order.getVehicle().getCarModel().getCapacity(),
                order.getChargingPoint().getConnectorType().getPowerOutput());
        double energyToCharge = -order.getStartedBattery() + order.getExpectedBattery();
        double estimatedCost = energyToCharge * order.getChargingPoint().getConnectorType().getPricePerKWh();
        return OrderResponseDTO.builder()
                .orderId(order.getOrderId())
                .stationName(order.getChargingPoint().getStation() != null ? order.getChargingPoint().getStation().getStationName() : null)
                .stationAddress(order.getChargingPoint().getStation() != null ? order.getChargingPoint().getStation().getAddress() : null)
                .connectorType(order.getChargingPoint().getConnectorType() != null ? order.getChargingPoint().getConnectorType().getTypeName() : null)
                .startTime(order.getStartTime())
                .endTime(order.getEndTime())
                .estimatedDuration(estimatedDuration)
                .energyToCharge(-order.getStartedBattery()+ order.getExpectedBattery())
                .chargingPower(order.getChargingPoint().getConnectorType().getPowerOutput())
                .pricePerKwh(order.getChargingPoint().getConnectorType().getPricePerKWh())
                .estimatedCost(estimatedCost)
                .status(order.getStatus() != null ? order.getStatus().name() : null)
                .createdAt(order.getCreatedAt())
                .build();
    }


    /**
     * Hủy đơn đặt chỗ
     */
    @Override
    @Transactional
    public OrderResponseDTO cancelOrder(CancelOrderDTO request) {

        // 1. Validate order tồn tại
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ApiRequestException("Không tìm thấy đơn đặt chỗ"));

        // 2. Kiểm tra quyền sở hữu
        if (!order.getUser().getUserId().equals(request.getUserId())) {
            throw new ApiRequestException("Bạn không có quyền hủy đơn đặt chỗ này");
        }

        // 3. Kiểm tra trạng thái có thể hủy không
        if (!order.canBeCancelled()) {
            throw new ApiRequestException(
                    "Không thể hủy đơn đặt chỗ với trạng thái: " + order.getStatus()
            );
        }

        // KIỂM TRA THỜI GIAN HỦY DỰA THEO SUBSCRIPTION
        // 4. Kiểm tra thời gian hủy (phải hủy trước 1 giờ)(MẶC ĐỊNH)
        double cancellationHours = subscriptionService.getCancelationHour(request.getUserId());
        LocalDateTime cancellationDeadline = order.getStartTime().minusHours((long)cancellationHours);
        if(LocalDateTime.now().isAfter(cancellationDeadline)) {
            throw new ApiRequestException(
                    String.format("Không thể hủy đơn đặt chỗ trước %.1f giờ trước khi bắt đầu sạc" +
                    "Nâng cấp lên gói PLUS hoặc PRO để được hủy đơn đặt chỗ linh hoạt hơn!", cancellationHours)
            );
        }
//        if (order.isPastCancellationDeadline()) {
//            throw new ApiRequestException(
//                    "Không thể hủy đơn đặt chỗ trong vòng 1 giờ trước khi bắt đầu sạc"
//            );
//        }

        // 5. Cập nhật trạng thái
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

    public List<OrderResponseDTO> getStationOrders(Long stationId) {
        List<Order> orders = orderRepository.findByChargingPoint_Station_StationId(stationId);

        List<OrderResponseDTO> orderDTOs = orders.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return orderDTOs.isEmpty() ? null : orderDTOs;
    }
}
