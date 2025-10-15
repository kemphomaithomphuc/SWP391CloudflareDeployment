package swp391.code.swp391.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import swp391.code.swp391.entity.Order;
import swp391.code.swp391.entity.Vehicle;
import swp391.code.swp391.repository.ConnectorTypeRepository;
import swp391.code.swp391.repository.OrderRepository;
import swp391.code.swp391.repository.VehicleRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final VehicleRepository vehicleRepository;
    private final ConnectorTypeRepository connectorTypeRepository;

    @Override
    public Order createOrder(Order order) {
        return orderRepository.save(order);
    }

    @Override
    public Order getOrderById(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
    }

    @Override
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Override
    public Order updateOrder(Order order) {
        if (order.getOrderId() == null || !orderRepository.existsById(order.getOrderId())) {
            throw new RuntimeException("Order not found");
        }
        return orderRepository.save(order);
    }

    @Override
    public void deleteOrder(Long orderId) {
        if (!orderRepository.existsById(orderId)) {
            throw new RuntimeException("Order not found with id: " + orderId);
        }
        orderRepository.deleteById(orderId);
    }


}
