package swp391.code.swp391.controller;

import com.nimbusds.jose.JOSEException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import swp391.code.swp391.dto.APIResponse;
import swp391.code.swp391.dto.SessionProgressDTO;
import swp391.code.swp391.dto.StartSessionRequestDTO;
import swp391.code.swp391.util.JwtUtil;
import swp391.code.swp391.service.SessionService;

import java.text.ParseException;


@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;
    private final JwtUtil jwtUtil;

    // US10: POST /api/sessions/start
    @PostMapping("/start")
    public ResponseEntity<APIResponse<Long>> startSession(@Valid @RequestBody StartSessionRequestDTO request,
                                             HttpServletRequest httpServletRequest) {
        String header = httpServletRequest.getHeader("Authorization");
        String token = jwtUtil.getTokenFromHeader(header);
        Long sessionId;
        Long userId;
        try {
            userId = jwtUtil.getUserIdByTokenDecode(token);
            sessionId = sessionService.startSession(userId, request.getOrderId(), request.getVehicleId());
        } catch (ParseException | JOSEException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(APIResponse.error("Token parsing error"));
        } catch (RuntimeException e){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(APIResponse.error(e.getMessage()));
        } catch (Exception e){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(APIResponse.error(e.getMessage()));
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(APIResponse.success("Session started successfully", sessionId));
    }

    // US11: GET /api/sessions/{sessionId}/monitor
    @PutMapping("/{sessionId}/monitor")
    public ResponseEntity<APIResponse<SessionProgressDTO>> monitorSession(@PathVariable Long sessionId,
                                                             HttpServletRequest httpServletRequest) {
        String header = httpServletRequest.getHeader("Authorization");
        String token = jwtUtil.getTokenFromHeader(header);
        Long userId;
        SessionProgressDTO progress;
        try {
            userId = jwtUtil.getUserIdByTokenDecode(token);
            progress = sessionService.monitorSession(sessionId, userId);
        } catch (ParseException | JOSEException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(APIResponse.error("Token parsing error"));
        } catch (RuntimeException e){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(APIResponse.error(e.getMessage()));
        }catch (Exception e){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(APIResponse.error(e.getMessage()));
        }

        return ResponseEntity.ok(APIResponse.success("Session progress updated successfully", progress));
    }

    // US11: End charging session
    @PostMapping("/{sessionId}/end")
    public ResponseEntity<APIResponse<Long>> endSession(@PathVariable Long sessionId,
                                                      HttpServletRequest httpServletRequest) {
        String header = httpServletRequest.getHeader("Authorization");
        String token = jwtUtil.getTokenFromHeader(header);
        Long userId;
        try {
            userId = jwtUtil.getUserIdByTokenDecode(token);
            Long completedSessionId = sessionService.endSession(sessionId, userId);
            return ResponseEntity.ok(APIResponse.success("Session ended successfully", completedSessionId));
        } catch (ParseException | JOSEException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(APIResponse.error("Token parsing error"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(APIResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(APIResponse.error(e.getMessage()));
        }
    }
}
