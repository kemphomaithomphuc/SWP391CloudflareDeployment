package swp391.code.swp391.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Table(name = "[Transaction]")
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long transactionId;

    @ManyToOne //Liên kết với bảng Session
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    @ManyToOne //Liên kết với bảng User
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Double amount; //Giá tiền cuối cùng của Giao dịch

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    public enum PaymentMethod {
        VNPAY, CASH, QR
    }

    public enum Status {
        PENDING, SUCCESS, FAILED
    }
}
