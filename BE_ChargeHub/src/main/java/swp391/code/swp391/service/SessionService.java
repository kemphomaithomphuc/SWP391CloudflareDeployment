package swp391.code.swp391.service;


import swp391.code.swp391.dto.SessionProgressDTO;
import swp391.code.swp391.entity.Order;
import swp391.code.swp391.entity.Session;
import swp391.code.swp391.entity.Vehicle;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SessionService {

    boolean isValidTime(Long orderId,int maxStartDelayMinutes);

    public Long startSession(Long userId, Long orderId, Long vehicleId);

    SessionProgressDTO monitorSession(Long sessionId, Long userId);

    Double calculatePenaltyAmount(String type, Order order);

    long expectedMinutes(Vehicle vehicle, Double expectedBattery);

    Double calculateBatteryPercentage(Vehicle vehicle, Double kwh);
}
