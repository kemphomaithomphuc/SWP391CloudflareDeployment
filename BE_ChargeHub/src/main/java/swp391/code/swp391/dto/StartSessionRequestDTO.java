package swp391.code.swp391.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;


@Data
public class StartSessionRequestDTO {

    @NotNull(message = "Order ID cannot be null")
    private Long orderId;
    @NotNull(message = "Vehicle ID cannot be null")
    private Long vehicleId;
}
