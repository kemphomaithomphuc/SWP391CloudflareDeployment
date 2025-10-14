package swp391.code.swp391.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class OrderResponseDTO {
    private Long orderId;

    // Thông tin trạm và điểm sạc
    private String stationName;
    private String stationAddress;
    private String connectorType;

    // Thông tin thời gian
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer estimatedDuration; // phút

    // Thông tin sạc
    private Double energyToCharge;     // kWh
    private Double chargingPower;      // kW
    private Double pricePerKwh;
    private Double estimatedCost;

    // Trạng thái
    private String status;

    // Thời gian tạo đơn
    private LocalDateTime createdAt;
}
