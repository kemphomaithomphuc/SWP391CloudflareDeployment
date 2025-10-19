package swp391.code.swp391.controller;

import com.nimbusds.jose.JOSEException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import swp391.code.swp391.entity.Notification;
import swp391.code.swp391.service.JwtService;
import swp391.code.swp391.service.NotificationService;

import java.text.ParseException;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtService jwtService;

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        String token = jwtService.getTokenFromRequestHeader(header);
        Long userId;
        try {
            userId = jwtService.getUserIdByTokenDecode(token);
        } catch (ParseException | JOSEException e) {
            throw new RuntimeException(e);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return ResponseEntity.ok(notificationService.getAllNotificationsForUser(userId));
    }

    @GetMapping("/unread/count")
    public ResponseEntity<Long> getUnreadCount(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        String token = jwtService.getTokenFromRequestHeader(header);
        Long userId;
        try {
            userId = jwtService.getUserIdByTokenDecode(token);
        } catch (ParseException | JOSEException e) {
            throw new RuntimeException(e);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return ResponseEntity.ok(notificationService.getUnreadCountForUser(userId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        String token = jwtService.getTokenFromRequestHeader(header);
        Long userId;
        try {
            userId = jwtService.getUserIdByTokenDecode(token);
        } catch (ParseException | JOSEException e) {
            throw new RuntimeException(e);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<Void> markAllAsRead(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        String token = jwtService.getTokenFromRequestHeader(header);
        Long userId;
        try {
            userId = jwtService.getUserIdByTokenDecode(token);
        } catch (ParseException | JOSEException e) {
            throw new RuntimeException(e);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }
}
