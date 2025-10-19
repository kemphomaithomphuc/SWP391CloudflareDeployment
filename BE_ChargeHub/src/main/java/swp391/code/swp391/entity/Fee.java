package swp391.code.swp391.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private Order order;  // For NO_SHOW and CANCEL fees

    @ManyToOne
    @JoinColumn(name = "session_id")
    private Session session;  // For CHARGING fees

    @Column(nullable = false)
    private Double amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type;

    @Column
    private String description; // Additional explanation for the fee

    @Column(nullable = false)
    private Boolean isPaid = false;

    @Column(nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private java.time.LocalDateTime createdAt;

    public enum Type {
        CHARGING, NO_SHOW, CANCEL
    }
}
