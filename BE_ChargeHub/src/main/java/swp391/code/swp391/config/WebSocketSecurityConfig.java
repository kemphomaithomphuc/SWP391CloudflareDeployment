package swp391.code.swp391.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.config.annotation.web.socket.EnableWebSocketSecurity;
import org.springframework.security.messaging.access.intercept.MessageMatcherDelegatingAuthorizationManager;

@Configuration
@EnableWebSocketSecurity // (1) Kích hoạt bảo mật cho WebSocket Messages
public class WebSocketSecurityConfig {

    @Bean
    AuthorizationManager<Message<?>> messageAuthorizationManager(
            MessageMatcherDelegatingAuthorizationManager.Builder messages
    ) {
        messages
                .simpDestMatchers("/user/**").hasRole("USER")
                .anyMessage().authenticated();
        return messages.build();
//        return (authentication, message) -> {
//            // Require authentication for all WebSocket messages
//            return new AuthorizationDecision(authentication.get() != null && authentication.get().isAuthenticated());
//        };
    }
}
