package swp391.code.swp391.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;
import swp391.code.swp391.dto.*;
import swp391.code.swp391.entity.CustomUserDetails;
import swp391.code.swp391.entity.User;
import swp391.code.swp391.service.OTPService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import swp391.code.swp391.service.PasswordResetTokenService;
import swp391.code.swp391.service.UserServiceImpl;

import java.util.Optional;

@RestController
@RequestMapping("/api/otp")
@RequiredArgsConstructor
@Tag(name = "OTP", description = "API xác thực OTP")
public class OTPController {

    private final OTPService otpService;
    private final UserServiceImpl userServiceImpl;
    private final PasswordResetTokenService passwordResetTokenService;

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

        try {
            Long userId = getUserIdFromAuth(authentication);
            boolean isValid = otpService.verifyOTPForEmailChange(request.getEmail(), userId, request.getOtpCode());

            if (isValid) {
                userServiceImpl.changeEmail(userId, request.getEmail());
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

        } catch (ResponseStatusException e) {
            // Lỗi có chủ đích từ service
            return ResponseEntity.status(e.getStatusCode())
                    .body(new OTPResponse(false, e.getReason(), request.getEmail()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new OTPResponse(false, "Lỗi hệ thống: " + e.getMessage(), request.getEmail()));
        }
    }

        private Long getUserIdFromAuth(Authentication authentication) {
            if (authentication == null) {
                throw new RuntimeException("Chưa đăng nhập");
            }

            String email;
            Object principal = authentication.getPrincipal();
            if (principal instanceof CustomUserDetails userDetails) {
                // Khi dùng UsernamePasswordAuthenticationToken (login thường)
                email = userDetails.getUsername();
            } else if (principal instanceof Jwt jwt) {
                // Khi dùng ResourceServer (JWT token)
                email = jwt.getClaimAsString("sub");
            } else {
                email = null;
                throw new RuntimeException("Không xác định được người dùng từ Authentication principal: "
                        + principal.getClass().getName());
            }

            Optional<User> user = userServiceImpl.getUserByEmail(email);

            return user.map(User::getUserId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với email: " + email));
        }

        @PostMapping("/send/forgot-password")
        @Operation(summary = "Gửi OTP quên mật khẩu")
        public ResponseEntity<OTPResponse> sendOTPForForgotPassword(
                @Valid @RequestBody SendOTPRequest request) {
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
        @PostMapping("/verify/forgot-password")
        @Operation(summary = "Xác thực OTP quên mật khẩu")
        public ResponseEntity<OTPResponse> verifyOTPForForgotPassword(
                @Valid @RequestBody VerifyOTPRequest request) {
            boolean isValid = otpService.verifyOTPForRegistration(request.getEmail(), request.getOtpCode());

            if (isValid) {
                String resetToken = passwordResetTokenService.createToken(request.getEmail());
                return ResponseEntity.ok(new OTPResponse(
                        true,
                        "Xác thực OTP thành công",
                        resetToken // Trả về resetToken thay vì email
                ));
            } else {
                return ResponseEntity.badRequest().body(new OTPResponse(
                        false,
                        "Mã OTP không đúng hoặc đã hết hạn",
                        request.getEmail()
                ));
            }
        }
        @PostMapping("/reset-password")
        @Operation(summary = "Đặt lại mật khẩu")
        public ResponseEntity<OTPResponse> resetPassword(
                @Valid @RequestBody ResetPasswordRequest request) {
            try {
                String email = passwordResetTokenService.validateTokenAndGetEmail(request.getResetToken());
                userServiceImpl.resetPassword(email, request.getNewPassword());
                // Sau khi đổi mật khẩu thành công, vô hiệu hóa token
                passwordResetTokenService.deleteToken(request.getResetToken());

                return ResponseEntity.ok(new OTPResponse(
                        true,
                        "Đặt lại mật khẩu thành công",
                        email
                ));
            } catch (ResponseStatusException e) {
                return ResponseEntity.status(e.getStatusCode())
                        .body(new OTPResponse(false, e.getReason(), null));
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new OTPResponse(false, "Lỗi hệ thống: " + e.getMessage(), null));
            }
        }
    }

