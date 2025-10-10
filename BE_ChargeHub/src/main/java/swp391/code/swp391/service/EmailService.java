package swp391.code.swp391.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendOTPEmail(String toEmail, String otpCode, int expiryMinutes) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Mã xác thực OTP - SWP391");
            helper.setText(buildEmailTemplate(otpCode, expiryMinutes), true);

            mailSender.send(message);
            log.info("Đã gửi OTP đến: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Lỗi gửi email đến {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Không thể gửi email OTP", e);
        }
    }

    private String buildEmailTemplate(String otpCode, int expiryMinutes) {
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
            <h1>Xác thực OTP</h1>
        </div>
        <div class="content">
            <p>Xin chào,</p>
            <p>Bạn đã yêu cầu mã OTP để xác thực tài khoản. Vui lòng sử dụng mã dưới đây:</p>
            
            <div class="otp-box">
                <p style="margin: 0; font-size: 14px; color: #666;">Mã OTP của bạn</p>
                <div class="otp-code">%s</div>
                <p style="margin: 0; font-size: 14px; color: #666;">
                    Mã có hiệu lực trong <strong>%d phút</strong>
                </p>
            </div>
            
            <p>Vui lòng nhập mã này vào trang xác thực để hoàn tất quá trình.</p>
            
            <div class="warning">
                ⚠️ <strong>Lưu ý:</strong> Không chia sẻ mã OTP này với bất kỳ ai. 
                Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.
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