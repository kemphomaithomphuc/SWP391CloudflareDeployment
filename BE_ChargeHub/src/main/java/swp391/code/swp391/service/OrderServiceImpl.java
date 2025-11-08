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
import java.util.Comparator;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final VehicleRepository vehicleRepository;
    private final ChargingStationRepository stationRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ChargingPointRepository chargingPointRepository;
    private final SubscriptionService subscriptionService;
    private final NotificationService notificationService;
    private final SessionRepository sessionRepository;

    // ========== CẤU HÌNH SLOT ==========
    private static final int SLOT_DURATION_MINUTES = 120; // 2 giờ mỗi slot
    private static final int MIN_GAP_MINUTES = 30; // Thời gian tối thiểu cho mini-slot
    private static final LocalTime OPENING_TIME = LocalTime.of(0, 30);
    // NOTE: CLOSING_TIME là 00:00 ngày hôm sau để slot 22:00-00:00 (24:00) được tạo
    private static final LocalTime CLOSING_TIME = LocalTime.of(0, 0);
    // Nếu người dùng chọn "book now" (bắt đầu trong khoảng ngắn), chuyển trạng thái ngay thành CHARGING
    private static final int IMMEDIATE_START_THRESHOLD_MINUTES = 5; // start <= now + 5 minutes sẽ được coi là "book now"

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
            ChargingPointAvailabilityDTO availability = findAvailableSlotsForPoint(point, requiredMinutes);
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
     *
     * THAY ĐỔI: Không lọc theo requiredMinutes, trả về TẤT CẢ slots trống
     */
    private ChargingPointAvailabilityDTO findAvailableSlotsForPoint(ChargingPoint point, int requiredMinutes) {
        LocalDate today = LocalDate.now();
        LocalDateTime dayStart = LocalDateTime.of(today, OPENING_TIME);

        // CLOSING_TIME là 00:00, nên cần +1 ngày để đến 00:00 ngày hôm sau
        LocalDateTime dayEnd = CLOSING_TIME.equals(LocalTime.MIDNIGHT)
                ? LocalDateTime.of(today.plusDays(1), CLOSING_TIME)
                : LocalDateTime.of(today, CLOSING_TIME);

        // Lấy các đơn đang hoạt động
        List<Order> existingOrders = orderRepository.findActiveOrdersByChargingPoint(
                point.getChargingPointId(),
                LocalDateTime.now()
        );
        existingOrders.sort(Comparator.comparing(Order::getStartTime));

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

        // Convert TẤT CẢ slots sang DTO (không lọc theo requiredMinutes)
        List<AvailableTimeSlotDTO> slotDTOs = allAvailableSlots.stream()
                .map(slot -> createAvailableSlotDTO(point, slot, requiredMinutes))
                .collect(Collectors.toList());

        ConnectorType connector = point.getConnectorType();

        return ChargingPointAvailabilityDTO.builder()
                .chargingPointId(point.getChargingPointId())
                .connectorTypeName(connector.getTypeName())
                .chargingPower(connector.getPowerOutput())
                .pricePerKwh(connector.getPricePerKWh())
                .availableSlots(slotDTOs)
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
     * THAY ĐỔI: Tính giá cho toàn bộ slot
     */
    private AvailableTimeSlotDTO createAvailableSlotDTO(ChargingPoint point, TimeSlot slot, int requiredMinutes) {
        ConnectorType connector = point.getConnectorType();

        // Tính giá cho toàn bộ slot
        // Giả sử sạc liên tục với công suất tối đa trong suốt slot
        double slotHours = slot.durationMinutes / 60.0;
        double maxEnergyInSlot = connector.getPowerOutput() * slotHours; // kWh
        double slotPrice = maxEnergyInSlot * connector.getPricePerKWh(); // VND

        // Tạo slot ID để frontend có thể reference khi order
        String slotId = generateSlotId(slot);

        // Build DTO via setters to avoid potential Lombok builder method resolution issues in tooling
        AvailableTimeSlotDTO dto = new AvailableTimeSlotDTO();
        dto.setSlotId(slotId);
        dto.setSlotStart(slot.start);
        dto.setSlotEnd(slot.end);
        dto.setSlotDurationMinutes(slot.durationMinutes);
        dto.setSlotPrice(slotPrice);
        dto.setSlotType(slot.type.name()); // "FIXED" hoặc "MINI"

        // Backward-compatible fields for other consumers
        dto.setFreeFrom(slot.start);
        dto.setFreeTo(slot.end);
        dto.setAvailableMinutes(slot.durationMinutes);
        dto.setRequiredMinutes(requiredMinutes);
        dto.setEstimatedCost(slotPrice);

        return dto;
    }

    /**
     * Tạo slot ID duy nhất
     */
    private String generateSlotId(TimeSlot slot) {
        String timeRange = slot.start.toLocalTime().toString() + "_" + slot.end.toLocalTime().toString();
        return slot.type.name() + "_" + timeRange;
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

        // ===== 7.1. VALIDATE SLOT IDs - THÊM MỚI =====
        // Kiểm tra các slot IDs có hợp lệ, liên tiếp và khả dụng không
        validateSlotIds(request.getSlotIds(), request.getStartTime(), request.getEndTime(), chargingPoint);

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

        // ===== 11. Nếu người dùng bấm "Book Now" (start time gần bằng hiện tại), chuyển trạng thái ngay sang CHARGING =====
        LocalDateTime now = LocalDateTime.now();
        if (!request.getStartTime().isAfter(now.plusMinutes(IMMEDIATE_START_THRESHOLD_MINUTES))) {

            // NEW: Kiểm tra xe đã đang trong phiên CHARGING hay chưa
            boolean vehicleCharging = orderRepository.isVehicleCurrentlyCharging(vehicle.getId());
            if (vehicleCharging) {
                // Nếu xe đang CHARGING thì rollback bằng cách hủy order mới tạo và báo lỗi
                order.setStatus(Order.Status.CANCELED);
                order.setCanceledAt(LocalDateTime.now());
                order.setCancellationReason("Xe đang trong phiên sạc khác. Không thể book now.");
                orderRepository.save(order);
                throw new ApiRequestException("Xe này đang sạc. Không thể 'Book Now'. Vui lòng đặt lịch (Schedule) thay thế.");
            }

            order.setStatus(Order.Status.CHARGING);
            // Persist change so frontend immediately sees CHARGING
            order = orderRepository.save(order);

            // ===== TẠO SESSION NGAY KHI BOOK NOW =====
            Session session = new Session();
            session.setOrder(order);
            session.setStartTime(now); // Bắt đầu ngay
            session.setPowerConsumed(0.0); // Chưa sạc gì
            session.setBaseCost(0.0); // Chi phí ban đầu = 0, sẽ tính sau
            session.setStatus(Session.SessionStatus.CHARGING);
            sessionRepository.save(session);

            // ===== CẬP NHẬT TRẠNG THÁI CHARGING POINT =====
            chargingPoint.setStatus(ChargingPoint.ChargingPointStatus.OCCUPIED);
            chargingPointRepository.save(chargingPoint);

            // Gửi notification (best-effort)
            try {
                notificationService.createBookingOrderNotification(
                        order.getOrderId(),
                        NotificationServiceImpl.NotificationEvent.BOOKING_SUCCESS,
                        null
                );
            } catch (Exception e) {
                System.err.println("Lỗi khi tạo notification cho charging start: " + e.getMessage());
            }
        } else {
            // ===== 11. TẠO NOTIFICATION CHO USER (booked nhưng chưa bắt đầu)
            if (order.getOrderId() != null) {
                try {
                    notificationService.createBookingOrderNotification(
                            order.getOrderId(),
                            NotificationServiceImpl.NotificationEvent.BOOKING_SUCCESS,
                            null
                    );
                } catch (Exception e) {
                    // Log lỗi nhưng không làm fail transaction nếu notification thất bại
                    System.err.println("Lỗi khi tạo notification cho booking: " + e.getMessage());
                }
            }
        }

        return order.getOrderId() != null ? convertToDTO(order) : null;
    }

    /**
     * Validate booking time có hợp lệ với slot system không
     * THAY ĐỔI: Kiểm tra thời gian order phải khớp với slot boundaries
     */
    private void validateSlotBooking(LocalDateTime startTime, LocalDateTime endTime) {
        LocalDateTime now = LocalDateTime.now();

        // Không được book trong quá khứ
        if (startTime.isBefore(now)) {
            throw new ApiRequestException("Không thể đặt lịch trong quá khứ");
        }

        // Kiểm tra startTime trong giờ mở cửa
        if (startTime.toLocalTime().isBefore(OPENING_TIME)) {
            throw new ApiRequestException("Thời gian bắt đầu phải sau " + OPENING_TIME);
        }

        // Kiểm tra endTime:
        // - Nếu CLOSING_TIME = 00:00, cho phép endTime là 00:00 ngày hôm sau (slot 22:00-00:00)
        // - Nếu endTime.toLocalTime() > CLOSING_TIME và CLOSING_TIME != 00:00, báo lỗi
        LocalTime endLocalTime = endTime.toLocalTime();
        if (CLOSING_TIME.equals(LocalTime.MIDNIGHT)) {
            // Cho phép endTime là 00:00 của ngày hôm sau (hoặc cùng ngày nếu là slot đầu tiên)
            // Kiểm tra endTime không được quá 1 ngày
            if (endTime.isAfter(startTime.plusDays(1))) {
                throw new ApiRequestException("Thời gian order không được quá 1 ngày");
            }
        } else {
            // CLOSING_TIME khác 00:00 (VD: 23:59)
            if (endLocalTime.isAfter(CLOSING_TIME)) {
                throw new ApiRequestException("Thời gian kết thúc phải trước " + CLOSING_TIME);
            }
        }

        // Kiểm tra thời gian tối thiểu
        int bookingMinutes = (int) Duration.between(startTime, endTime).toMinutes();
        if (bookingMinutes < MIN_GAP_MINUTES) {
            throw new ApiRequestException("Thời gian đặt tối thiểu là " + MIN_GAP_MINUTES + " phút");
        }

        // THÊM: Kiểm tra thời gian order phải là bội số của slot duration hoặc khớp với mini slot
        // (Validation chi tiết hơn sẽ được thực hiện ở validateSlotIds)
    }

    /**
     * Validate danh sách slot IDs có hợp lệ không
     * - Các slot phải liên tiếp
     * - Các slot phải khả dụng
     * - Thời gian start/end phải khớp với slot boundaries
     * - Hỗ trợ STAFF slot ID (cho walk-in booking)
     */
    private void validateSlotIds(List<String> slotIds, LocalDateTime startTime, LocalDateTime endTime, ChargingPoint point) {
        if (slotIds == null || slotIds.isEmpty()) {
            throw new ApiRequestException("Phải chọn ít nhất 1 slot");
        }

        // Kiểm tra nếu là STAFF slot (walk-in booking), skip validation chi tiết
        if (slotIds.size() == 1 && slotIds.get(0).startsWith("STAFF_")) {
            // Staff booking được phép linh hoạt hơn, chỉ cần kiểm tra overlap
            List<Order> existingOrders = orderRepository.findActiveOrdersByChargingPoint(
                    point.getChargingPointId(),
                    LocalDateTime.now()
            );

            TimeSlot staffSlot = new TimeSlot(startTime, endTime,
                    (int) Duration.between(startTime, endTime).toMinutes(), SlotType.MINI);

            if (isSlotOccupied(staffSlot, existingOrders)) {
                throw new ApiRequestException("Thời gian này đã có người đặt");
            }
            return; // Skip rest of validation for staff booking
        }

        // Parse slot IDs để lấy thông tin slot
        List<TimeSlot> requestedSlots = new ArrayList<>();
        for (String slotId : slotIds) {
            TimeSlot slot = parseSlotId(slotId, startTime.toLocalDate());
            if (slot == null) {
                throw new ApiRequestException("Slot ID không hợp lệ: " + slotId);
            }
            requestedSlots.add(slot);
        }

        // Sắp xếp theo thời gian
        requestedSlots.sort(Comparator.comparing(slot -> slot.start));

        // Kiểm tra các slot phải liên tiếp
        for (int i = 0; i < requestedSlots.size() - 1; i++) {
            TimeSlot current = requestedSlots.get(i);
            TimeSlot next = requestedSlots.get(i + 1);

            if (!current.end.equals(next.start)) {
                throw new ApiRequestException("Các slot phải liên tiếp nhau");
            }
        }

        // Kiểm tra thời gian start/end phải khớp với slot boundaries
        TimeSlot firstSlot = requestedSlots.get(0);
        TimeSlot lastSlot = requestedSlots.get(requestedSlots.size() - 1);

        if (!startTime.equals(firstSlot.start) || !endTime.equals(lastSlot.end)) {
            throw new ApiRequestException("Thời gian order phải khớp với thời gian của slot");
        }

        // Kiểm tra các slot có khả dụng không
        List<Order> existingOrders = orderRepository.findActiveOrdersByChargingPoint(
                point.getChargingPointId(),
                LocalDateTime.now()
        );

        for (TimeSlot slot : requestedSlots) {
            if (isSlotOccupied(slot, existingOrders)) {
                throw new ApiRequestException("Slot " + generateSlotId(slot) + " đã có người đặt");
            }
        }
    }

    /**
     * Parse slot ID thành TimeSlot object
     * Format: "FIXED_02:00_04:00" hoặc "MINI_09:30_10:45" hoặc "STAFF_HH:mm_HH:mm"
     */
    private TimeSlot parseSlotId(String slotId, LocalDate date) {
        try {
            String[] parts = slotId.split("_");
            if (parts.length != 3) {
                return null;
            }

            String typeString = parts[0];
            SlotType type;

            // Xử lý STAFF slot type
            if ("STAFF".equals(typeString)) {
                type = SlotType.MINI; // Staff slots được coi như MINI slots
            } else {
                type = SlotType.valueOf(typeString);
            }

            LocalTime startTime = LocalTime.parse(parts[1]);
            LocalTime endTime = LocalTime.parse(parts[2]);

            LocalDateTime start = LocalDateTime.of(date, startTime);
            LocalDateTime end = LocalDateTime.of(date, endTime);
            int durationMinutes = (int) Duration.between(start, end).toMinutes();

            return new TimeSlot(start, end, durationMinutes, type);
        } catch (Exception e) {
            return null;
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

        // Filter chỉ lấy orders có status BOOKED hoặc CHARGING
        List<OrderResponseDTO> orderDTOs = orders.stream()
                .filter(order -> {
                    Order.Status status = order.getStatus();
                    return status == Order.Status.BOOKED || status == Order.Status.CHARGING;
                })
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

                // Station info
                .stationId(order.getChargingPoint().getStation() != null ?
                        order.getChargingPoint().getStation().getStationId() : null)
                .stationName(order.getChargingPoint().getStation() != null ?
                        order.getChargingPoint().getStation().getStationName() : null)
                .stationAddress(order.getChargingPoint().getStation() != null ?
                        order.getChargingPoint().getStation().getAddress() : null)

                // Charging point info
                .chargingPointId(order.getChargingPoint() != null ?
                        order.getChargingPoint().getChargingPointId() : null)
                .connectorType(order.getChargingPoint().getConnectorType() != null ?
                        order.getChargingPoint().getConnectorType().getTypeName() : null)
                .chargingPower(order.getChargingPoint().getConnectorType() != null ?
                        order.getChargingPoint().getConnectorType().getPowerOutput() : null)
                .pricePerKwh(order.getChargingPoint().getConnectorType() != null ?
                        order.getChargingPoint().getConnectorType().getPricePerKWh() : null)

                // User info
                .userId(order.getUser() != null ? order.getUser().getUserId() : null)
                .userName(order.getUser() != null ? order.getUser().getFullName() : null)
                .userPhone(order.getUser() != null ? order.getUser().getPhone() : null)

                // Vehicle info - Hiển thị PLATE NUMBER cho Vehicle ID
                .vehicleId(order.getVehicle() != null ? order.getVehicle().getId() : null)
                .vehiclePlate(order.getVehicle() != null ? order.getVehicle().getPlateNumber() : null)
                .vehicleModel(order.getVehicle() != null && order.getVehicle().getCarModel() != null ?
                        order.getVehicle().getCarModel().getModel() : null)

                // Battery info
                .startedBattery(order.getStartedBattery())
                .expectedBattery(order.getExpectedBattery())
                // Time and cost
                .startTime(order.getStartTime())
                .endTime(order.getEndTime())
                .estimatedDuration(estimatedDuration)
                .energyToCharge(energyToCharge)
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

    /**
     * Kiểm tra xe có đang trong phiên sạc (CHARGING) hay không
     */
    @Override
    public boolean isVehicleCurrentlyCharging(Long vehicleId) {
        return orderRepository.isVehicleCurrentlyCharging(vehicleId);
    }
}
