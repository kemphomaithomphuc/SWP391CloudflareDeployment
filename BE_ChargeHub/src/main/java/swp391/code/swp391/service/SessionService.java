package swp391.code.swp391.service;


import swp391.code.swp391.dto.SessionProgressDTO;
import swp391.code.swp391.entity.Order;
import swp391.code.swp391.entity.Vehicle;

public interface SessionService {

    boolean isValidTime(Long orderId,int maxStartDelayMinutes);

    Long startSession(Long userId, Long orderId, Long vehicleId);

    Long endSession(Long sessionId, Long userId);

    SessionProgressDTO monitorSession(Long sessionId, Long userId);

    Double calculatePenaltyAmount(String type, Order order);

    long expectedMinutes(Vehicle vehicle, Double expectedBattery);

    Double calculateBatteryPercentage(Vehicle vehicle, Double kwh);
}
