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
    private Long id;
    @Column(name = "plate_number", nullable = false, unique = true)
    private String plateNumber;
    @Column(name = "brand", nullable = false)
    private String brand;
    @Column(name = "model", nullable = false)
    private String model;
    @Column(name = "capacity", nullable = false)
    private double capacity;
    @Column(name = "product_year", nullable = false)
    private int productYear;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "car_model_id")
    private CarModel carModel;

    @ManyToOne
    @JsonBackReference(value = "user-vehicle")
    private User user;

    @ManyToMany
    @JoinTable(
        name = "vehicle_connector_types",
        joinColumns = @JoinColumn(name = "plateNumber"),
        inverseJoinColumns = @JoinColumn(name = "connector_type_id")
    )
    private List<ConnectorType> connectorTypes;
}
