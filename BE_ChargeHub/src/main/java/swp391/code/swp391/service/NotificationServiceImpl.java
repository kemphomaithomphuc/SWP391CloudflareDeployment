package swp391.code.swp391.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import swp391.code.swp391.entity.Notification;
import swp391.code.swp391.entity.User;
import swp391.code.swp391.repository.NotificationRepository;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    // Giả sử integrate với email service
    @Override
    public void sendNotification(User user, Notification.Type type, String content) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setContent(content);
        notification.setSentTime(LocalDateTime.now());
        notificationRepository.save(notification);

        // Send email/push (placeholder)
        System.out.println("Sending notification to " + user.getEmail() + ": " + content);
    }
}
