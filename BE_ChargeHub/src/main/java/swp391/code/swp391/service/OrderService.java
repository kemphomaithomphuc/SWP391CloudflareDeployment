package swp391.code.swp391.service;

import org.springframework.stereotype.Service;
import swp391.code.swp391.entity.Order;

import java.time.LocalDateTime;
import java.util.List;


public interface OrderService {

    //Tinh toan thoi gian ket thuc phien sac dua tren current and expected Battery
    LocalDateTime calculateEndtime(Long orderId, Long vehicleId,Long connectorTypeId);
    Order getOrderById(Long orderId);
    Order createOrder(Order order);
    List<Order> getAllOrders();
    Order updateOrder(Order order);
    void deleteOrder(Long orderId);
}
