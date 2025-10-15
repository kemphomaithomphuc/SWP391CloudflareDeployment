package swp391.code.swp391.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import swp391.code.swp391.entity.Order;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Order findByOrderId(Long orderId);
    /**
     * Tìm các orders trùng lặp thời gian với khoảng time slot cần kiểm tra
     *
     * Logic: Order trùng lặp khi:
     * - startTime của order < endTime của slot CẦN KIỂM TRA
     * - endTime của order > startTime của slot CẦN KIỂM TRA
     */
    @Query("""
        SELECT o FROM Order o 
        WHERE o.chargingPoint.chargingPointId = :chargingPointId
        AND o.status IN ('BOOKED')
        AND o.startTime < :endTime
        AND o.endTime > :startTime
        """)
    List<Order> findOverlappingOrders(
            @Param("chargingPointId") Long chargingPointId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );
    Order findByOrderIdAndUser_UserId(Long orderId, Long userId);

    // Add a method to find active orders by user
    /**
     * Tìm tất cả orders của một user
     */
    List<Order> findByUser_UserId(Long userId);

    /**
     * Tìm orders của user theo status
     */
    List<Order> findByUser_UserIdAndStatus(Long userId, Order.Status status);


    /**
     * Tìm orders của một trạm trong khoảng thời gian
     */
    @Query("""
        SELECT o FROM Order o 
        WHERE o.chargingPoint.station.stationId = :stationId
        AND o.startTime >= :startDate
        AND o.endTime <= :endDate
        ORDER BY o.startTime ASC
        """)
    List<Order> findOrdersByStationAndDateRange(
            @Param("stationId") Long stationId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    /**
     * Tìm orders active của một charging point
     */
    @Query("""
        SELECT o FROM Order o 
        WHERE o.chargingPoint.chargingPointId = :chargingPointId
        AND o.status IN ('BOOKED')
        AND o.endTime > :currentTime
        ORDER BY o.startTime ASC
        """)
    List<Order> findActiveOrdersByChargingPoint(
            @Param("chargingPointId") Long chargingPointId,
            @Param("currentTime") LocalDateTime currentTime
    );

    /**
     * Đếm số lượng orders của user trong tháng
     */
//    @Query("""
//        SELECT COUNT(o) FROM Order o
//        WHERE o.user.userId = :userId
//        AND YEAR(o.createdAt) = :year
//        AND MONTH(o.createdAt) = :month
//        AND o.status != 'CANCELLED'
//        """)
//    Long countUserOrdersInMonth(
//            @Param("userId") Long userId,
//            @Param("year") int year,
//            @Param("month") int month
//    );

    /**
     * Kiểm tra user có order nào trùng thời gian không (tránh double booking)
     */
    @Query("""
        SELECT COUNT(o) > 0 FROM Order o 
        WHERE o.user.userId = :userId
        AND o.status IN ('CONFIRMED', 'IN_PROGRESS')
        AND o.startTime < :endTime
        AND o.endTime > :startTime
        """)
    boolean hasUserOrderInTimeRange(
            @Param("userId") Long userId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );
}