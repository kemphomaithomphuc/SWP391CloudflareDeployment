package swp391.code.swp391.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PriceFactorDTO {
    private Long priceFactorId;
    private Long stationId;
    private Double factor;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String description;
}
