package swp391.code.swp391.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import swp391.code.swp391.entity.Order;

import java.util.List;


@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Order findByOrderIdAndUser_UserId(Long orderId, Long userId);

    // Add a method to find active orders by user
    List<Order> findByUser_UserIdAndStatus(Long userId, Order.Status status);
}
