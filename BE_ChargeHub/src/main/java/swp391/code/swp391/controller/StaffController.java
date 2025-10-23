package swp391.code.swp391.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import swp391.code.swp391.dto.APIResponse;
import swp391.code.swp391.dto.ChangeChargingPointRequestDTO;
import swp391.code.swp391.dto.ChangeChargingPointResponseDTO;
import swp391.code.swp391.dto.ChargingPointDTO;
import swp391.code.swp391.service.StaffService;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StaffController {

    private final StaffService staffService;

    /**
     * API đổi trụ sạc cho driver
     * Endpoint: POST /api/staff/change-charging-point
     */
    @PostMapping("/change-charging-point")
    // @PreAuthorize("hasRole('STAFF')") // Uncomment khi có security
    public ResponseEntity<APIResponse<ChangeChargingPointResponseDTO>> changeChargingPoint(
            @Valid @RequestBody ChangeChargingPointRequestDTO request) {

        try {
            ChangeChargingPointResponseDTO response = staffService.changeChargingPointForDriver(request);

            return ResponseEntity.ok(
                    APIResponse.<ChangeChargingPointResponseDTO>builder()
                            .success(true)
                            .message("Đổi trụ sạc thành công!")
                            .data(response)
                            .build()
            );
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    APIResponse.<ChangeChargingPointResponseDTO>builder()
                            .success(false)
                            .message("Lỗi: " + e.getMessage())
                            .data(null)
                            .build()
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    APIResponse.<ChangeChargingPointResponseDTO>builder()
                            .success(false)
                            .message("Lỗi hệ thống: " + e.getMessage())
                            .data(null)
                            .build()
            );
        }
    }

    /**
     * API tìm trụ sạc thay thế
     * Endpoint: GET /api/staff/find-alternative-points
     */
    @GetMapping("/find-alternative-points")
    // @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<APIResponse<List<ChargingPointDTO>>> findAlternativePoints(
            @RequestParam Long orderId,
            @RequestParam Long currentChargingPointId) {

        try {
            List<ChargingPointDTO> alternatives = staffService.findAlternativeChargingPoints(
                    orderId, currentChargingPointId);

            return ResponseEntity.ok(
                    APIResponse.<List<ChargingPointDTO>>builder()
                            .success(true)
                            .message("Tìm thấy " + alternatives.size() + " trụ sạc thay thế")
                            .data(alternatives)
                            .build()
            );
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    APIResponse.<List<ChargingPointDTO>>builder()
                            .success(false)
                            .message("Lỗi: " + e.getMessage())
                            .data(null)
                            .build()
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    APIResponse.<List<ChargingPointDTO>>builder()
                            .success(false)
                            .message("Lỗi hệ thống: " + e.getMessage())
                            .data(null)
                            .build()
            );
        }
    }
}