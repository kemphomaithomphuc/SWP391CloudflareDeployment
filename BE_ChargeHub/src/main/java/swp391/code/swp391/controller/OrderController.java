package swp391.code.swp391.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import swp391.code.swp391.dto.*;
import swp391.code.swp391.entity.Order;
import swp391.code.swp391.service.OrderServiceImpl;

import java.util.List;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Order", description = "API quản lý đặt chỗ sạc xe")
public class OrderController {

    private final OrderServiceImpl orderServiceImpl;

    /**
     * API 1: Find available slots - Tìm các khung giờ trống có đủ thời gian sạc
     */
    @PostMapping("/find-available-slots")
    @Operation(summary = "Tìm các khoảng thời gian trống có đủ để sạc")
    public ResponseEntity<APIResponse<AvailableSlotsResponseDTO>> findAvailableSlots(
            @Valid @RequestBody OrderRequestDTO request) {

        AvailableSlotsResponseDTO response = orderServiceImpl.findAvailableSlots(request);

        int totalSlots = response.getChargingPoints().stream()
                .mapToInt(cp -> cp.getAvailableSlots().size())
                .sum();

        return ResponseEntity.ok(
                APIResponse.<AvailableSlotsResponseDTO>builder()
                        .success(true)
                        .message("Tìm thấy " + totalSlots + " khung giờ khả dụng")
                        .data(response)
                        .build()
        );
    }

    /**
     * API 2: Confirm order - Xác nhận đặt chỗ
     */
    @PostMapping("/confirm")
    @Operation(summary = "Xác nhận đặt chỗ")
    public ResponseEntity<APIResponse<OrderResponseDTO>> confirmBooking(
            @Valid @RequestBody ConfirmOrderDTO request) {

        OrderResponseDTO order = orderServiceImpl.confirmOrder(request);

        return ResponseEntity.ok(
                APIResponse.<OrderResponseDTO>builder()
                        .success(true)
                        .message("Đặt chỗ thành công! Mã đơn: " + order.getOrderId())
                        .data(order)
                        .build()
        );
    }

    /**
     * API 3: Get fake battery level - Giả lập lấy % pin hiện tại
     */
    @GetMapping("/fake-battery/{vehicleId}")
    @Operation(summary = "Lấy % pin hiện tại của xe (Demo)")
    public ResponseEntity<APIResponse<BatteryLevelDTO>> getFakeBatteryLevel(
            @PathVariable Integer vehicleId) {

        // Giả lập random battery level từ 10% - 90%
        double batteryLevel = 10 + (Math.random() * 80);
        batteryLevel = Math.round(batteryLevel * 10.0) / 10.0;

        BatteryLevelDTO dto = BatteryLevelDTO.builder()
                .vehicleId(vehicleId)
                .currentBatteryPercent(batteryLevel)
                .batteryStatus(getBatteryStatus(batteryLevel))
                .needsChargingSoon(batteryLevel < 20)
                .build();

        return ResponseEntity.ok(
                APIResponse.<BatteryLevelDTO>builder()
                        .success(true)
                        .message("Lấy thông tin pin thành công")
                        .data(dto)
                        .build()
        );
    }

    /**
     * API 4: Get user's orders - Lấy danh sách đơn đặt chỗ của người dùng
     */
    @GetMapping("/my-orders")
    @Operation(summary = "Lấy danh sách đơn đặt chỗ của tôi")
    public ResponseEntity<APIResponse<List<OrderResponseDTO>>> getMyOrders(
            @RequestParam Long userId,
            @RequestParam(required = false) Order.Status status) {

        List<OrderResponseDTO> orders = orderServiceImpl.getUserOrders(userId, status);

        return ResponseEntity.ok(
                APIResponse.<List<OrderResponseDTO>>builder()
                        .success(true)
                        .message("Tìm thấy " + orders.size() + " đơn đặt chỗ")
                        .data(orders)
                        .build()
        );
    }

    // Helper method
    private String getBatteryStatus(double batteryLevel) {
        if (batteryLevel < 20) return "LOW";
        if (batteryLevel < 50) return "MEDIUM";
        if (batteryLevel < 80) return "GOOD";
        return "EXCELLENT";
    }

}
