package swp391.code.swp391.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import swp391.code.swp391.entity.Subscription;
import swp391.code.swp391.entity.User;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    /**
     * Tìm các gói đăng ký còn hiệu lực của user
     */
    List<Subscription> findByUserAndEndDateAfter(User user, LocalDateTime currentDate);

    /**
     * Tìm tất cả gói đăng ký của user
     */
    List<Subscription> findByUserOrderByEndDateDesc(User user);

    /**
     * Tìm gói đăng ký theo loại
     */
    List<Subscription> findByType(Subscription.Type type);
}