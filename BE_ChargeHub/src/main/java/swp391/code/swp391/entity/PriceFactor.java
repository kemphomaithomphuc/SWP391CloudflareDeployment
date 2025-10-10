package swp391.code.swp391.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "PriceFactor")
@NoArgsConstructor
@AllArgsConstructor
public class PriceFactor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long priceFactorId;

    @ManyToOne
    @JoinColumn(name = "station_id", nullable = false)
    private ChargingStation station;

    private Double factor;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private String description;
}
