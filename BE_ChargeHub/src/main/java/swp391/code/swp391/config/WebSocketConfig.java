package swp391.code.swp391.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import swp391.code.swp391.util.JwtUtil;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;


@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final JwtUtil jwtUtil;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").withSockJS();
//        registry.addEndpoint("/gs-guide-websocket");
    } // WebSocket endpoint with SockJS fallback

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        //(Nơi Client gửi yêu cầu vào)
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");

        //(Nơi Server đẩy thông báo ra)
        registry.enableSimpleBroker("/topic", "/queue");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
                String token = accessor.getFirstNativeHeader("Authorization");

                if (token != null && token.startsWith("Bearer ")) {
                    String jwt = token.substring(7);

                    try {
                        String username = jwtUtil.extractUsername(jwt);
                        List<String> roles = jwtUtil.extractRole(jwt);
                        List<GrantedAuthority> authorities = roles.stream()
                                .map(SimpleGrantedAuthority::new)
                                .collect(Collectors.toList());
                        UsernamePasswordAuthenticationToken auth =
                                new UsernamePasswordAuthenticationToken(
                                        username,
                                        null,
                                        authorities
                                );
                        accessor.setUser(auth);
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    } catch (Exception e) {
                        throw new SecurityException("Invalid JWT token");
                    }
                }
                return message;
            }
        });
    }
}
