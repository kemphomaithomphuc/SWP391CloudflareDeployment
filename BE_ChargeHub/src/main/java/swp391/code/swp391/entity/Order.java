package swp391.code.swp391.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long orderId;

    @ManyToOne
//    @JoinColumn(name = "user_id", nullable = false)
     @JoinColumn(name = "user_id")

    private User user;

    @ManyToOne
//    @JoinColumn(name = "charging_point_id", nullable = false)
    @JoinColumn(name = "charging_point_id")
    private ChargingPoint chargingPoint;

    @ManyToOne
    @JoinColumn(name = "vehicle_id") //, nullable = false)
    private Vehicle vehicle;

    @Column(nullable = false)
    private LocalDateTime startTime;

    private Double startedBattery;

    private Double expectedBattery;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.BOOKED;

    public enum Status {
        BOOKED, CANCELED
    }
}
