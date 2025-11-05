package swp391.code.swp391.controller;

import com.nimbusds.jose.JOSEException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import swp391.code.swp391.dto.NotificationDTO;
import swp391.code.swp391.entity.User;
import swp391.code.swp391.util.JwtUtil;
import swp391.code.swp391.service.NotificationService;

import java.text.ParseException;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getNotifications(HttpServletRequest request) {
        User user;
        try {
            user = jwtUtil.getUserByTokenThroughSecurityContext();
        } catch (ParseException | JOSEException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return ResponseEntity.ok(notificationService.getNotificationDTOs(user.getUserId()));
    }

    @GetMapping("/unread/count")
    public ResponseEntity<Long> getUnreadCount() {
        User user;
        try {
            user = jwtUtil.getUserByTokenThroughSecurityContext();
        } catch (ParseException | JOSEException e) {
            throw new RuntimeException(e);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return ResponseEntity.ok(notificationService.getUnreadCountForUser(user.getUserId()));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, HttpServletRequest request) {
        User user;
        try {
            user  = jwtUtil.getUserByTokenThroughSecurityContext();
        } catch (ParseException | JOSEException e) {
            throw new RuntimeException(e);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        notificationService.markAsRead(id, user.getUserId());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<Void> markAllAsRead(HttpServletRequest request) {
        String token = jwtUtil.getTokenFromRequestHeader(request);
        Long userId;
        try {
            userId = jwtUtil.getUserIdByTokenDecode(token);
        } catch (ParseException | JOSEException e) {
            throw new RuntimeException(e);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }
}
