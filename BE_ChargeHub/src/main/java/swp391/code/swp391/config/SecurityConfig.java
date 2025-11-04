package swp391.code.swp391.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationEntryPoint;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import swp391.code.swp391.entity.User;
import swp391.code.swp391.filter.AuthorizationFilter;
import swp391.code.swp391.filter.JwtBlacklistFilter;
import swp391.code.swp391.service.CustomUserDetailService;

import java.util.List;


@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
@EnableMethodSecurity
public class SecurityConfig {

    private final String[] PUBLIC_URLS = {
            "/api/auth/**",
            "/api/otp/send/forgot-password",
            "/api/otp/verify/forgot-password",
            "/api/otp/reset-password",
            "/api/payment/**",
            "/api/staff/**",
            "/api/transactions/**",
            "/api/admin/revenue/**",
            "/api/test/**" // them de test thoi, khong dung nua thi xoa
    };
    private final JwtDecoder jwtDecoder; // Tự động được Spring inject JwtDecoderConfig
    private final CustomUserDetailService userDetailsService;
    private final JwtBlacklistFilter jwtBlacklistFilter;
    private final AuthorizationFilter authorizeationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .addFilterBefore(jwtBlacklistFilter, BearerTokenAuthenticationFilter.class)
                .addFilterAfter(authorizeationFilter,BearerTokenAuthenticationFilter.class)
                .oauth2ResourceServer((oauth2) -> oauth2
                        .jwt(jwtConfigurer -> jwtConfigurer.decoder(jwtDecoder)
                                .jwtAuthenticationConverter(jwtAuthenticationConverter())
                        )
                        .authenticationEntryPoint(new BearerTokenAuthenticationEntryPoint())
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_URLS).permitAll()
                        .requestMatchers("/api/admin/**").hasRole(User.UserRole.ADMIN.name())
                        .requestMatchers("/api/staff/**").hasAnyRole( "STAFF", "ADMIN")
                        .requestMatchers("/api/staff-management/**").hasAnyRole( "STAFF", "ADMIN")
                        .requestMatchers("/api/analytics/**").hasAnyRole( "STAFF", "ADMIN")
                        .anyRequest().authenticated()
                );
        return http.build();
    }

    //Publish AuthenticationManager bean for Custom Authentication
    @Bean
    public AuthenticationManager authenticationManager() {
        DaoAuthenticationProvider authenticationProvider = new DaoAuthenticationProvider(userDetailsService);
        authenticationProvider.setPasswordEncoder(passwordEncoder());

        return new ProviderManager(authenticationProvider);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        JwtGrantedAuthoritiesConverter authoritiesConverter = new JwtGrantedAuthoritiesConverter();
        authoritiesConverter.setAuthorityPrefix(""); // Remove default "ROLE_" prefix
        authoritiesConverter.setAuthoritiesClaimName("roles"); // Map "roles" claim
        converter.setJwtGrantedAuthoritiesConverter(authoritiesConverter);
        return converter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("http://localhost:3000"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}