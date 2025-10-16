package swp391.code.swp391.service;

import swp391.code.swp391.entity.Notification;
import swp391.code.swp391.entity.User;

public interface NotificationService {

    public void sendNotification(User user, Notification.Type type, String content);
}
