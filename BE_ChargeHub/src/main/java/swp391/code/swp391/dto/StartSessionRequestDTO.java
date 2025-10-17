package swp391.code.swp391.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class StartSessionRequestDTO {
        private Long orderId;
        private Long vehicleId;
}
