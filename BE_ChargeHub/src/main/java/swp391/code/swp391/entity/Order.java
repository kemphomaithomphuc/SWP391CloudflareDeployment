package swp391.code.swp391.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Long orderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @ToString.Exclude
    private User user;

    @ManyToOne
    @JoinColumn(name = "charging_point_id", nullable = false)
    @ToString.Exclude
    private ChargingPoint chargingPoint;

    @ManyToOne
    @JoinColumn(name = "vehicle_id", nullable = false)
    @ToString.Exclude
    private Vehicle vehicle;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime; // Thời gian dự kiến kết thúc

    private Double startedBattery;

    private Double expectedBattery;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.BOOKED;

    // Chi phí
    @Column(name = "price_per_kwh")
    private Double pricePerKwh; // Giá tại thời điểm đặt

    public enum Status {
        BOOKED, CANCELED, COMPLETED,CHARGING
    }
    LocalDateTime createdAt = LocalDateTime.now();

    public boolean isActive() {
        return status == Status.BOOKED;
    }
}
