package swp391.code.swp391.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import swp391.code.swp391.dto.SessionProgressDTO;
import swp391.code.swp391.entity.*;
import swp391.code.swp391.repository.SessionRepository;
import swp391.code.swp391.repository.VehicleRepository;
import swp391.code.swp391.websocket.SessionWebSocketService;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Scheduled service to automatically push session progress via WebSocket
 * for all active charging sessions without requiring client polling
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SessionProgressScheduler {

    private final SessionRepository sessionRepository;
    private final VehicleRepository vehicleRepository;
    private final SessionWebSocketService sessionWebSocketService;

    /**
     * Auto-push session progress every 10 seconds for all CHARGING sessions
     * Pure WebSocket push - no client polling required
     */
    @Scheduled(fixedRate = 1000*10) // 10 seconds
    public void pushActiveSessionsProgress() {
        try {
            // Find all active charging sessions
            List<Session> activeSessions = sessionRepository.findByStatus(Session.SessionStatus.CHARGING);

            if (activeSessions.isEmpty()) {
                return; // No active sessions
            }

            log.debug("Auto-pushing progress for {} active sessions", activeSessions.size());

            for (Session session : activeSessions) {
                try {
                    pushSessionProgress(session);
                } catch (Exception e) {
                    log.error("Failed to push progress for session {}: {}",
                        session.getSessionId(), e.getMessage());
                }
            }

        } catch (Exception e) {
            log.error("Error in session progress scheduler: {}", e.getMessage());
        }
    }

    /**
     * Calculate and push progress for a single session
     */
    private void pushSessionProgress(Session session) {
        Order order = session.getOrder();
        if (order == null || order.getUser() == null) {
            return;
        }

        ConnectorType connectorType = order.getChargingPoint().getConnectorType();
        Vehicle vehicle = vehicleRepository.findById(order.getVehicle().getId()).orElse(null);
        if (vehicle == null) {
            return;
        }

        // Calculate progress
        LocalDateTime now = LocalDateTime.now();
        long minutesElapsed = ChronoUnit.MINUTES.between(session.getStartTime(), now);

        double power = connectorType.getPowerOutput(); // kW
        double powerConsumed = power * (minutesElapsed / 60.0);

        double basePrice = connectorType.getPricePerKWh();
        double cost = powerConsumed * basePrice;

        double currentBattery = calculateBatteryPercentage(vehicle, powerConsumed) + order.getStartedBattery();
        if (currentBattery > 100) {
            currentBattery = 100.0;
        }

        long estimatedTotalMinutes = expectedMinutes(vehicle, order.getExpectedBattery(), power);
        long remainingMinutes = estimatedTotalMinutes > minutesElapsed
            ? estimatedTotalMinutes - minutesElapsed
            : 0L;

        // Build DTO
        SessionProgressDTO dto = new SessionProgressDTO(
            currentBattery,
            powerConsumed,
            cost,
            minutesElapsed,
            remainingMinutes,
            session.getStartTime(),
            now
        );

        // Push via WebSocket
        sessionWebSocketService.sendSessionProgressToUser(order.getUser(), dto);

        log.debug("Pushed progress for session {}: {}% battery, {} minutes elapsed",
            session.getSessionId(), currentBattery, minutesElapsed);
    }

    /**
     * Calculate battery percentage from kWh consumed
     */
    private Double calculateBatteryPercentage(Vehicle vehicle, Double kwh) {
        if (vehicle == null || vehicle.getCarModel() == null) {
            return 0.0;
        }
        Double capacity = vehicle.getCarModel().getCapacity();
        if (capacity == null || capacity == 0) {
            return 0.0;
        }
        return (kwh / capacity) * 100;
    }

    /**
     * Calculate expected minutes to reach target battery
     */
    private long expectedMinutes(Vehicle vehicle, Double expectedBattery, double powerKw) {
        if (vehicle == null || vehicle.getCarModel() == null || expectedBattery == null) {
            return 0L;
        }
        Double capacity = vehicle.getCarModel().getCapacity();
        if (capacity == null || capacity == 0 || powerKw == 0) {
            return 0L;
        }

        double batteryToCharge = expectedBattery; // assuming started from 0 for simplicity
        double kwhNeeded = (batteryToCharge / 100.0) * capacity;
        double hoursNeeded = kwhNeeded / powerKw;

        return Math.round(hoursNeeded * 60); // convert to minutes
    }
}

