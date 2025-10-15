package swp391.code.swp391.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Long orderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @ToString.Exclude
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "charging_point_id", nullable = false)
    @ToString.Exclude
    private ChargingPoint chargingPoint;

    @ManyToOne
    @JoinColumn(name = "vehicle_id", nullable = false)
    @ToString.Exclude
    private Vehicle vehicle;

    @Column(name ="start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime; // Thời gian dự kiến kết thúc

    private Double startedBattery;

    private Double expectedBattery;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.BOOKED;

    public enum Status {
        BOOKED, CANCELED, COMPLETED,CHARGING
    }
    LocalDateTime createdAt = LocalDateTime.now();

    public boolean isActive() {
        return status == Status.BOOKED;
    }
}
