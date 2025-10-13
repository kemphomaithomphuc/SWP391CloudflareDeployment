package swp391.code.swp391.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import swp391.code.swp391.entity.Session;
import swp391.code.swp391.repository.SessionRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SessionServiceImpl implements SessionService {

    private final OrderService orderService;
    private final SessionRepository sessionRepository;

    @Override
    public boolean isValidTime(Long orderId, int maxStartDelayMinutes) {
        maxStartDelayMinutes = 15; // Giới hạn thời gian bắt đầu sạc sau khi tạo order
        var order = orderService.getOrderById(orderId);
        LocalDateTime now = LocalDateTime.now();
        return now.isAfter(order.getStartTime()) && now.isBefore(order.getStartTime().plusMinutes(maxStartDelayMinutes));
    }

    //CRUD cho Session
    @Override
    public Session getSessionById(Long sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found with id: " + sessionId));
    }
    
    @Override
    public List<Session> getAllSessions() {
        return sessionRepository.findAll();
    }

    @Override
    public Session updateSession(Session session) {
        if (session.getSessionId() == null || !sessionRepository.existsById(session.getSessionId())) {
            throw new RuntimeException("Session not found");
        }
        return sessionRepository.save(session);
    }

    @Override
    public void deleteSession(Long sessionId) {
        if (!sessionRepository.existsById(sessionId)) {
            throw new RuntimeException("Session not found with id: " + sessionId);
        }
        sessionRepository.deleteById(sessionId);
    }

    @Override
    public Optional<Session> createSession(Long orderId) {
        Session session = new Session();
        session.setOrder(orderService.getOrderById(orderId));
        session.setStartTime(LocalDateTime.now());
        session.setEndTime(null); // End time will be set when the session ends
        session.setPowerConsumed(0.0); // Initial power consumed is 0
        session.setCost(0.0); // Initial cost is 0

        return Optional.of(session);
    }
}
