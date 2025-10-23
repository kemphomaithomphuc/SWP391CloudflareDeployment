package swp391.code.swp391.controller;

import com.nimbusds.jose.JOSEException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import swp391.code.swp391.dto.NotificationDTO;
import swp391.code.swp391.entity.Notification;
import swp391.code.swp391.entity.User;
import swp391.code.swp391.service.JwtService;
import swp391.code.swp391.service.NotificationService;

import java.text.ParseException;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtService jwtService;

    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getNotifications(HttpServletRequest request) {
        User user;
        try {
            user = jwtService.getUserByTokenThroughSecurityContext();
        } catch (ParseException | JOSEException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return ResponseEntity.ok(notificationService.getNotificationDTOs(user.getUserId()));
    }

    @GetMapping("/unread/count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Long> getUnreadCount() {
        User user;
        try {
            user = jwtService.getUserByTokenThroughSecurityContext();
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
            user  = jwtService.getUserByTokenThroughSecurityContext();
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
