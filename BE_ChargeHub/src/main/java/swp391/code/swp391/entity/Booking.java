package swp391.code.swp391.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Date;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "booking")
public class Booking {

    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    @Column(name = "booking_id")
    private Long bookingId;

    @Column(nullable = false,name = "start_time")
    private LocalDateTime startTime;

    @Column(nullable = false,name="end_time")
    private LocalDateTime endTime;

    @Column(nullable = false,name ="order_id")
    private String orderId;

    @ManyToOne
    @JoinColumn(name = "charging_point_id")
    private ChargingPoint chargingPoint;
}
