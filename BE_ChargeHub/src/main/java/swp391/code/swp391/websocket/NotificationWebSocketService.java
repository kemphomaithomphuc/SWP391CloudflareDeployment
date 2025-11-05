package swp391.code.swp391.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import swp391.code.swp391.dto.NotificationDTO;
import swp391.code.swp391.entity.User;

@Service
@RequiredArgsConstructor
public class NotificationWebSocketService {

    private final SimpMessagingTemplate simpMessagingTemplate;

    public void sendNotificationToUser(User user, NotificationDTO dto) {
        if (user == null || dto == null) return;
        String username = user.getEmail() != null ? user.getEmail() : user.getPhone();
        if (username == null) return;
        try {
            simpMessagingTemplate.convertAndSendToUser(username, "/queue/notifications", dto);
        } catch (Exception ignored) {}
    }

    public void broadcastNotification(NotificationDTO dto) {
        if (dto == null) return;
        try {
            simpMessagingTemplate.convertAndSend("/topic/notifications", dto);
        } catch (Exception ignored) {}
    }
}

