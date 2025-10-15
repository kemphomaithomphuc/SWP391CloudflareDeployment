package swp391.code.swp391.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "vehicles")
@NoArgsConstructor
@AllArgsConstructor
@Data
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vehicle_id")
    private int id;
    @Column(name = "plate_number", nullable = false, unique = true)
    private String plateNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "car_model_id")
    private CarModel carModel;

    @ManyToOne
    @JsonBackReference(value = "user-vehicle")
    private User user;

}
