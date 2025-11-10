// TEMPORARILY DISABLED - Not using WebSocket anymore, switching to SSE or polling
/*
package swp391.code.swp391.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
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

import java.util.List;
import java.util.stream.Collectors;


@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final JwtUtil jwtUtil;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/api/notifications/connection/ws")
                .setAllowedOriginPatterns("*") // Cho phép tất cả origins (dev), production nên chỉ định cụ thể domain FE
                .addInterceptors(new org.springframework.web.socket.server.HandshakeInterceptor() {
                    @Override
                    public boolean beforeHandshake(
                            org.springframework.http.server.ServerHttpRequest request,
                            org.springframework.http.server.ServerHttpResponse response,
                            org.springframework.web.socket.WebSocketHandler wsHandler,
                            java.util.Map<String, Object> attributes) throws Exception {

                        String uri = request.getURI().toString();
                        System.out.println("🔍 WebSocket Handshake Request: " + uri);

                        // SockJS /info endpoint doesn't need authentication
                        if (uri.contains("/info")) {
                            System.out.println("ℹ️ SockJS info request - allowing without authentication");
                            return true;
                        }

                        // Extract token from query parameter
                        if (request instanceof org.springframework.http.server.ServletServerHttpRequest) {
                            org.springframework.http.server.ServletServerHttpRequest servletRequest =
                                    (org.springframework.http.server.ServletServerHttpRequest) request;
                            String token = servletRequest.getServletRequest().getParameter("token");

                            System.out.println("🔑 Token from query: " + (token != null ? "Present" : "MISSING"));

                            if (token != null && !token.isEmpty()) {
                                try {
                                    String username = jwtUtil.extractUsername(token);
                                    List<String> roles = jwtUtil.extractRole(token);

                                    System.out.println("✅ Token validated - User: " + username);

                                    if (username != null && !username.isEmpty()) {
                                        // ✅ Store all necessary info in attributes
                                        attributes.put("token", token);
                                        attributes.put("username", username);
                                        attributes.put("roles", roles);

                                        // ✅ IMPORTANT: Create authentication and set in SecurityContext
                                        List<GrantedAuthority> authorities = roles.stream()
                                                .map(SimpleGrantedAuthority::new)
                                                .collect(Collectors.toList());

                                        UsernamePasswordAuthenticationToken auth =
                                                new UsernamePasswordAuthenticationToken(
                                                        username,
                                                        null,
                                                        authorities
                                                );

                                        // Store authentication in attributes for later use
                                        attributes.put("SPRING_SECURITY_CONTEXT", auth);

                                        System.out.println("✅ Handshake approved for user: " + username);
                                        return true;
                                    }
                                } catch (Exception e) {
                                    System.err.println("❌ Token validation failed: " + e.getMessage());
                                    e.printStackTrace();
                                    return false;
                                }
                            }
                        }

                        System.err.println("❌ Handshake rejected - no valid token");
                        return false;
                    }

                    @Override
                    public void afterHandshake(
                            org.springframework.http.server.ServerHttpRequest request,
                            org.springframework.http.server.ServerHttpResponse response,
                            org.springframework.web.socket.WebSocketHandler wsHandler,
                            Exception exception) {
                        // No action needed after handshake
                    }
                })
                .withSockJS(); // Thêm hỗ trợ SockJS để dự phòng khi WebSocket không khả dụng
    } // WebSocket endpoint with SockJS fallback and token validation

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

                // ✅ Log để debug
                System.out.println("📨 Incoming STOMP Message Type: " + accessor.getCommand());
                System.out.println("📨 Session Attributes: " + accessor.getSessionAttributes());

                // Skip authentication for CONNECT messages (already handled in handshake)
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    System.out.println("⏭️ Skipping auth for CONNECT - will use session attributes");
                    return message;
                }

                String jwt = null;

                // 1. Try Authorization header
                String authHeader = accessor.getFirstNativeHeader("Authorization");
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    jwt = authHeader.substring(7);
                    System.out.println("✅ Token from Authorization header");
                }

                // 2. Try session attributes (from handshake)
                if (jwt == null && accessor.getSessionAttributes() != null) {
                    Object tokenFromSession = accessor.getSessionAttributes().get("token");
                    if (tokenFromSession != null) {
                        jwt = tokenFromSession.toString();
                        System.out.println("✅ Token from session attributes");
                    }
                }

                // 3. If still no token, check if user already authenticated
                if (jwt == null && accessor.getUser() != null) {
                    System.out.println("✅ User already authenticated: " + accessor.getUser().getName());
                    return message;
                }

                // ✅ Authenticate if we have a token
                if (jwt != null && !jwt.isEmpty()) {
                    try {
                        String username = jwtUtil.extractUsername(jwt);
                        List<String> roles = jwtUtil.extractRole(jwt);

                        System.out.println("🔑 Authenticating user: " + username + ", roles: " + roles);

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

                        System.out.println("✅ User authenticated successfully");

                    } catch (Exception e) {
                        System.err.println("❌ JWT validation failed: " + e.getMessage());
                        throw new MessagingException("Invalid JWT token: " + e.getMessage());
                    }
                } else {
                    // ⚠️ No token and no existing user - reject
                    System.err.println("❌ No authentication found for message");
                    throw new MessagingException("Authentication required");
                }

                return message;
            }
        });
    }
}
*/
