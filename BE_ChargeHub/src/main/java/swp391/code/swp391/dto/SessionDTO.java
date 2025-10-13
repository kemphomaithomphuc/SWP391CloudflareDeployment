package swp391.code.swp391.dto;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Valid
public class SessionDTO {


    private Long chargingPointId;
    private Long orderId;
    private Long vehicleId;
    private LocalDateTime startTime;
    private LocalDateTime expectedEndTime;
    private double currentBattery;
    private double expectedBattery;
    private Long connectorTypeId;
}
