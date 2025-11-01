package swp391.code.swp391.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import swp391.code.swp391.dto.APIResponse;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class UserStatusFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Skip filter cho các public endpoints
        String requestURI = request.getRequestURI();
        if (isPublicEndpoint(requestURI)) {
            filterChain.doFilter(request, response);
            return;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = jwtAuth.getToken();
            String status = jwt.getClaimAsString("status");

            // Kiểm tra nếu user bị banned
            if ("BANNED".equals(status)) {
                sendBannedUserResponse(response);
                return;
            }

            // Kiểm tra nếu user inactive
            if ("INACTIVE".equals(status)) {
                sendInactiveUserResponse(response);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isPublicEndpoint(String requestURI) {
        return requestURI.startsWith("/api/auth/") ||
               requestURI.startsWith("/api/otp/") ||
               requestURI.startsWith("/api/payment/") ||
               requestURI.startsWith("/api/test/") ||
               requestURI.startsWith("/api/notifications/connection/ws/");
    }

    private void sendBannedUserResponse(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> errorData = new HashMap<>();
        errorData.put("reason", "USER_BANNED");

        APIResponse<Map<String, Object>> apiResponse = APIResponse.<Map<String, Object>>builder()
                .success(false)
                .message("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin để biết thêm chi tiết.")
                .data(errorData)
                .build();

        response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
    }

    private void sendInactiveUserResponse(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> errorData = new HashMap<>();
        errorData.put("reason", "USER_INACTIVE");

        APIResponse<Map<String, Object>> apiResponse = APIResponse.<Map<String, Object>>builder()
                .success(false)
                .message("Tài khoản của bạn chưa được kích hoạt")
                .data(errorData)
                .build();

        response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
    }
}

