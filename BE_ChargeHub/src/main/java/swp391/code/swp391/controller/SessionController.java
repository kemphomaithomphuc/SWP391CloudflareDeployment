package swp391.code.swp391.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import swp391.code.swp391.dto.APIResponse;
import swp391.code.swp391.entity.Session;
import swp391.code.swp391.service.SessionService;


@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;
    //Tao session moi khi bat dau sac
    @PostMapping("/start")
    public ResponseEntity<APIResponse<Session>> startSession(@RequestParam Long orderId, @RequestParam Long userId) {
        // Logic to start a session using the data from sessionDTO
        int maxStartDelayMinutes = 15; // Example: maximum allowed start delay is 15 minutes
        try {
            if (!sessionService.isValidTime(orderId,maxStartDelayMinutes)){ //Check if user is late
                //Send notification to user here
                //respond to charge user
                return ResponseEntity.badRequest().body(APIResponse.error("Invalid start time for session"));
            }
            Session session = sessionService.createSession(orderId).orElseThrow(() -> new RuntimeException("Failed to create session"));
            //Send notification here
            //respond (successfully)
            return ResponseEntity.ok(APIResponse.success("Session started successfully", session));
        } catch (RuntimeException e) {
            throw new RuntimeException(e);
        }
    }

//    @PostMapping("{sessionId}")
//    public ResponseEntity updateSession(@PathVariable Long sessionId,
//                                          @RequestParam(required = false) Long feeId) {
//        try {
////            Session updatedSession = sessionService.updateSession(sessionIdfeeId);
//            return ResponseEntity.ok(updatedSession);
//        } catch (RuntimeException e) {
//            throw new RuntimeException(e);
//        }
//    }
}
