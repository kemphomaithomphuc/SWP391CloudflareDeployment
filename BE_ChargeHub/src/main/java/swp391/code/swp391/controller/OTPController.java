package swp391.code.swp391.controller;

import swp391.code.swp391.dto.OTPResponse;
import swp391.code.swp391.dto.SendOTPRequest;
import swp391.code.swp391.dto.VerifyOTPRequest;
import swp391.code.swp391.service.OTPService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/otp")
@RequiredArgsConstructor
@Tag(name = "OTP", description = "API xác thực OTP")
public class OTPController {

    private final OTPService otpService;

    @PostMapping("/send/registration")
    @Operation(summary = "Gửi OTP đăng ký")
    public ResponseEntity<OTPResponse> sendOTPForRegistration(@Valid @RequestBody SendOTPRequest request) {
        try {
            otpService.generateAndSendOTPForRegistration(request.getEmail());
            return ResponseEntity.ok(new OTPResponse(
                    true,
                    "Mã OTP đã được gửi đến email của bạn",
                    request.getEmail()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new OTPResponse(
                    false,
                    "Không thể gửi OTP: " + e.getMessage(),
                    request.getEmail()
            ));
        }
    }

    @PostMapping("/verify/registration")
    @Operation(summary = "Xác thực OTP đăng ký")
    public ResponseEntity<OTPResponse> verifyOTPForRegistration(@Valid @RequestBody VerifyOTPRequest request) {
        boolean isValid = otpService.verifyOTPForRegistration(request.getEmail(), request.getOtpCode());

        if (isValid) {
            return ResponseEntity.ok(new OTPResponse(
                    true,
                    "Xác thực OTP thành công",
                    request.getEmail()
            ));
        } else {
            return ResponseEntity.badRequest().body(new OTPResponse(
                    false,
                    "Mã OTP không đúng hoặc đã hết hạn",
                    request.getEmail()
            ));
        }
    }

    @PostMapping("/send/email-change")
    @Operation(summary = "Gửi OTP thay đổi email")
    public ResponseEntity<OTPResponse> sendOTPForEmailChange(
            @Valid @RequestBody SendOTPRequest request,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            otpService.generateAndSendOTPForEmailChange(request.getEmail(), userId);
            return ResponseEntity.ok(new OTPResponse(
                    true,
                    "Mã OTP đã được gửi đến email mới",
                    request.getEmail()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new OTPResponse(
                    false,
                    "Không thể gửi OTP: " + e.getMessage(),
                    request.getEmail()
            ));
        }
    }

    @PostMapping("/verify/email-change")
    @Operation(summary = "Xác thực OTP thay đổi email")
    public ResponseEntity<OTPResponse> verifyOTPForEmailChange(
            @Valid @RequestBody VerifyOTPRequest request,
            Authentication authentication) {

        Long userId = getUserIdFromAuth(authentication);
        boolean isValid = otpService.verifyOTPForEmailChange(request.getEmail(), userId, request.getOtpCode());

        if (isValid) {
            return ResponseEntity.ok(new OTPResponse(
                    true,
                    "Xác thực OTP thành công. Email đã được cập nhật.",
                    request.getEmail()
            ));
        } else {
            return ResponseEntity.badRequest().body(new OTPResponse(
                    false,
                    "Mã OTP không đúng hoặc đã hết hạn",
                    request.getEmail()
            ));
        }
    }

    private Long getUserIdFromAuth(Authentication authentication) {
        if (authentication == null) {
            throw new RuntimeException("Chưa đăng nhập");
        }
        // TODO: Implement theo cấu trúc User của bạn
        // Ví dụ: return ((CustomUserDetails) authentication.getPrincipal()).getId();

        return 1L;
    }
}