package swp391.code.swp391.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "Fee")
@NoArgsConstructor
@AllArgsConstructor
public class Fee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long feeId;

    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;

    @ManyToOne
    @JoinColumn(name = "session_id")
    private Session session;

    @Column(nullable = false)
    private Double amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Boolean isPaid = false;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Type {
        CHARGING,  // Phí sạc quá giờ khi pin đầy
        NO_SHOW,   // Phí không đến theo lịch
        CANCEL     // Phí hủy muộn
    }
}