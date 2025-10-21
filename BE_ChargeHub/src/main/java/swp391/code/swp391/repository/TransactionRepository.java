package swp391.code.swp391.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import swp391.code.swp391.entity.Session;
import swp391.code.swp391.entity.Transaction;
import swp391.code.swp391.entity.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    /**
     * Tìm transaction theo session và user
     */
    Optional<Transaction> findBySessionAndUser(Session session, User user);

    /**
     * Tìm tất cả transaction của user
     */
    List<Transaction> findByUserOrderByTransactionIdDesc(User user);

    /**
     * Tìm transaction theo trạng thái
     */
    List<Transaction> findByStatus(Transaction.Status status);

    /**
     * Tìm transaction theo phương thức thanh toán
     */
    List<Transaction> findByPaymentMethod(Transaction.PaymentMethod paymentMethod);
}