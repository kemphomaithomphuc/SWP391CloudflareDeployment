package swp391.code.swp391.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SessionProgressDTO {


    private Double currentBattery; //(%)
    private Double powerConsumed; //(kWh)
    private Double cost; //(VND)
}
