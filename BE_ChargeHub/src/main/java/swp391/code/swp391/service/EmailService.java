package swp391.code.swp391.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import swp391.code.swp391.dto.SendOTPRequest;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendOTPEmail(String toEmail, String otpCode, int expiryMinutes,
                             SendOTPRequest.OtpPurpose purpose) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);

            // Tùy form theo mục đích
            String subject;
            String content;

            switch (purpose) {
                case REGISTER -> {
                    subject = "Xác thực tài khoản - SWP391";
                    content = buildEmailTemplateRegister(otpCode, expiryMinutes);
                }
                case FORGOT_PASSWORD -> {
                    subject = "Đặt lại mật khẩu - SWP391";
                    content = buildEmailTemplateForgotPassword(otpCode, expiryMinutes);
                }
                case CHANGE_EMAIL -> {
                    subject = "Xác nhận đổi email - SWP391";
                    content = buildEmailTemplateChangeEmail(otpCode, expiryMinutes);
                }
                default -> throw new IllegalArgumentException("Loại OTP không hợp lệ");
            }

            helper.setSubject(subject);
            helper.setText(content, true);

            mailSender.send(message);
            log.info("Đã gửi OTP đến: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Lỗi gửi email đến {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Không thể gửi email OTP", e);
        }
    }

    private String buildEmailTemplateChangeEmail(String otpCode, int expiryMinutes) {
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { 
            background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 10px 10px 0 0; 
        }
        .content { 
            background: #f9f9f9; 
            padding: 30px; 
            border-radius: 0 0 10px 10px; 
        }
        .otp-box { 
            background: white; 
            padding: 20px; 
            text-align: center; 
            border-radius: 8px; 
            margin: 20px 0; 
            box-shadow: 0 2px 5px rgba(0,0,0,0.1); 
        }
        .otp-code { 
            font-size: 36px; 
            font-weight: bold; 
            color: #667eea; 
            letter-spacing: 8px; 
            margin: 10px 0; 
        }
        .warning { 
            color: #e74c3c; 
            font-size: 14px; 
            margin-top: 20px; 
        }
        .footer { 
            text-align: center; 
            margin-top: 20px; 
            color: #666; 
            font-size: 12px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Xác nhận thay đổi email</h1>
        </div>
        <div class="content">
            <p>Xin chào,</p>
            <p>Bạn vừa yêu cầu thay đổi địa chỉ email cho tài khoản SWP391 của mình.</p>
            <p>Để xác nhận địa chỉ email mới, vui lòng nhập mã OTP bên dưới:</p>
            
            <div class="otp-box">
                <p style="margin: 0; font-size: 14px; color: #666;">Mã OTP xác nhận của bạn</p>
                <div class="otp-code">%s</div>
                <p style="margin: 0; font-size: 14px; color: #666;">
                    Mã có hiệu lực trong <strong>%d phút</strong>.
                </p>
            </div>
            
            <p>Nếu bạn không thực hiện yêu cầu thay đổi email, vui lòng bỏ qua email này.</p>
            
            <div class="warning">
                ⚠️ <strong>Lưu ý bảo mật:</strong> Không chia sẻ mã OTP này với bất kỳ ai. 
                Đội ngũ SWP391 sẽ không bao giờ yêu cầu bạn cung cấp mã OTP.
            </div>
        </div>
        <div class="footer">
            <p>© 2025 SWP391 Project. All rights reserved.</p>
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
    </div>
</body>
</html>
""".formatted(otpCode, expiryMinutes);
    }




    private String buildEmailTemplateForgotPassword(String otpCode, int expiryMinutes) {
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { 
            background: linear-gradient(135deg, #00c6ff 0%%, #0072ff 100%%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 10px 10px 0 0; 
        }
        .content { 
            background: #f9f9f9; 
            padding: 30px; 
            border-radius: 0 0 10px 10px; 
        }
        .otp-box { 
            background: white; 
            padding: 20px; 
            text-align: center; 
            border-radius: 8px; 
            margin: 20px 0; 
            box-shadow: 0 2px 5px rgba(0,0,0,0.1); 
        }
        .otp-code { 
            font-size: 36px; 
            font-weight: bold; 
            color: #0072ff; 
            letter-spacing: 8px; 
            margin: 10px 0; 
        }
        .warning { 
            color: #e74c3c; 
            font-size: 14px; 
            margin-top: 20px; 
        }
        .footer { 
            text-align: center; 
            margin-top: 20px; 
            color: #666; 
            font-size: 12px; 
        }
        a.button {
            display: inline-block;
            background-color: #0072ff;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-weight: bold;
        }
        a.button:hover {
            background-color: #005ae0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Đặt lại mật khẩu</h1>
        </div>
        <div class="content">
            <p>Xin chào,</p>
            <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. 
               Vui lòng sử dụng mã OTP bên dưới để xác thực yêu cầu:</p>
            
            <div class="otp-box">
                <p style="margin: 0; font-size: 14px; color: #666;">Mã OTP của bạn:</p>
                <div class="otp-code">%s</div>
                <p style="margin: 0; font-size: 14px; color: #666;">
                    Mã này có hiệu lực trong <strong>%d phút</strong>.
                </p>
            </div>
            
            <p>Sau khi nhập mã OTP, bạn có thể tiếp tục đặt lại mật khẩu mới.</p>
            
            <div class="warning">
                ⚠️ <strong>Lưu ý:</strong> Không chia sẻ mã OTP này với bất kỳ ai. 
                Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
            </div>
        </div>
        <div class="footer">
            <p>© 2025 SWP391 Project. All rights reserved.</p>
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
    </div>
</body>
</html>
""".formatted(otpCode, expiryMinutes);
    }

    private String buildEmailTemplateRegister(String otpCode, int expiryMinutes) {
        return """
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { 
            background: linear-gradient(135deg, #4CAF50 0%%, #2E7D32 100%%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 10px 10px 0 0; 
        }
        .content { 
            background: #f9f9f9; 
            padding: 30px; 
            border-radius: 0 0 10px 10px; 
        }
        .otp-box { 
            background: white; 
            padding: 20px; 
            text-align: center; 
            border-radius: 8px; 
            margin: 20px 0; 
            box-shadow: 0 2px 5px rgba(0,0,0,0.1); 
        }
        .otp-code { 
            font-size: 36px; 
            font-weight: bold; 
            color: #4CAF50; 
            letter-spacing: 8px; 
            margin: 10px 0; 
        }
        .warning { 
            color: #e74c3c; 
            font-size: 14px; 
            margin-top: 20px; 
        }
        .footer { 
            text-align: center; 
            margin-top: 20px; 
            color: #666; 
            font-size: 12px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Chào mừng đến với SWP391</h1>
        </div>
        <div class="content">
            <p>Xin chào,</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản với hệ thống <strong>EV Charging Station Management</strong>.</p>
            <p>Để hoàn tất việc đăng ký, vui lòng xác thực tài khoản bằng mã OTP dưới đây:</p>
            
            <div class="otp-box">
                <p style="margin: 0; font-size: 14px; color: #666;">Mã OTP của bạn</p>
                <div class="otp-code">%s</div>
                <p style="margin: 0; font-size: 14px; color: #666;">
                    Mã có hiệu lực trong <strong>%d phút</strong>
                </p>
            </div>
            
            <p>Sau khi nhập mã OTP, tài khoản của bạn sẽ được kích hoạt.</p>
            
            <div class="warning">
                ⚠️ <strong>Lưu ý:</strong> Không chia sẻ mã OTP này với bất kỳ ai. 
                Nếu bạn không thực hiện đăng ký, vui lòng bỏ qua email này.
            </div>
        </div>
        <div class="footer">
            <p>© 2025 SWP391 Project. All rights reserved.</p>
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
    </div>
</body>
</html>
""".formatted(otpCode, expiryMinutes);
    }

}