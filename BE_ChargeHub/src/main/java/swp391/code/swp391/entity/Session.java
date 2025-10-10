package swp391.code.swp391.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@Entity
@Table(name = "session")
@NoArgsConstructor
@AllArgsConstructor
public class Session {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long sessionId;

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(nullable = false)
    private Date startTime;

    private Date endTime;

    @Column(nullable = false)
    private Double powerConsumed; //Số kwh đã sạc

    @Column(nullable = false)
    private Double cost; //tiền phải trả cho phiên sạc

    @ManyToOne
    @JoinColumn(name = "fee_id")
    private Fee fee; //Phí phát sinh (nếu có)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status = SessionStatus.CHARGING;

    public enum SessionStatus {
        CHARGING, COMPLETED
    }
}
