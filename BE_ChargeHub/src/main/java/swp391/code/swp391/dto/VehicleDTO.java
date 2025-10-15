package swp391.code.swp391.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import swp391.code.swp391.entity.CarModel;
import swp391.code.swp391.entity.ConnectorType;
import swp391.code.swp391.entity.User;
import swp391.code.swp391.entity.Vehicle;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL) // Chỉ include field không null khi serialize
public class VehicleDTO {

    @NotBlank(message = "Plate number is required")
    @Size(max = 20, message = "Plate number must not exceed 20 characters")
    private String plateNumber;

    // Cho input: chỉ cần userId
    private Long userId;

    // Cho output: full User object
    private User user;


    // cho output: full carModel object
    private CarModel carModel;


    public VehicleDTO(Vehicle vehicle) {
        this.plateNumber = vehicle.getPlateNumber();
        this.carModel = vehicle.getCarModel();

        // Set IDs
        if (vehicle.getUser() != null) {
            this.userId = vehicle.getUser().getUserId();
        }
    }
}
