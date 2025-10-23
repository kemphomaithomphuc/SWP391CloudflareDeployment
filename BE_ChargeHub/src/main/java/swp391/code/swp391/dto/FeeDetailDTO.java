package swp391.code.swp391.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import swp391.code.swp391.entity.Fee;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeeDetailDTO {

    private Fee.Type type;
    private BigDecimal amount;
    private String description;
}