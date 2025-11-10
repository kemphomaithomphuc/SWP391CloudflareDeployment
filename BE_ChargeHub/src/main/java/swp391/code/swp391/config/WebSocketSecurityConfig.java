package swp391.code.swp391.config;

// TEMPORARILY DISABLED - Not using WebSocket anymore, switching to SSE or polling
/*
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.config.annotation.web.socket.EnableWebSocketSecurity;
import org.springframework.security.messaging.access.intercept.MessageMatcherDelegatingAuthorizationManager;

@Configuration
@EnableWebSocketSecurity // Kích hoạt bảo mật cho WebSocket Messages
public class WebSocketSecurityConfig {

    @Bean
    AuthorizationManager<Message<?>> messageAuthorizationManager(
            MessageMatcherDelegatingAuthorizationManager.Builder messages
    ) {
        messages
                // Cho phép CONNECT - yêu cầu authentication
                .nullDestMatcher().authenticated()

                // Cho phép subscribe đến personal queues (authenticated users)
                .simpSubscribeDestMatchers("/user/queue/**").authenticated()

                // Cho phép subscribe đến public topics (authenticated users)
                .simpSubscribeDestMatchers("/topic/**").authenticated()

                // Cho phép gửi message qua /app destinations
                .simpDestMatchers("/app/**").authenticated()

                // Yêu cầu authentication cho tất cả message khác
                .anyMessage().authenticated();

        return messages.build();
    }
}
*/
