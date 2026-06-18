package com.uphi.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final CustomUserDetailsService userDetailsService;
    private final SecurityLoggingFilter securityLogger;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter, CustomUserDetailsService userDetailsService, SecurityLoggingFilter securityLogger) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
        this.securityLogger = securityLogger;
    }

    @Bean
    public org.springframework.security.web.AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, authException) -> {
            System.err.println("AUTHENTICATION DENIAL: " + request.getMethod() + " " + request.getRequestURI() + " -> " + authException.getMessage());
            response.sendError(401, "Unauthorized: Token Missing or Invalid");
        };
    }

    @Bean
    public org.springframework.security.web.access.AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            System.err.println("ACCESS DENIED: " + request.getMethod() + " " + request.getRequestURI() + " -> " + accessDeniedException.getMessage());
            response.sendError(403, "Forbidden: Insufficient Permissions");
        };
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(authenticationEntryPoint())
                        .accessDeniedHandler(accessDeniedHandler())
                )
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/receptionist/patients/register").permitAll()
                        .requestMatchers("/api/receptionist/patients/otp/**").permitAll()
                        .requestMatchers("/api/verify/**").permitAll()
                        .requestMatchers("/api/receptionist/patients/*/id-card/download").permitAll()
                        .requestMatchers("/api/patients/*/id-card/download").permitAll()
                        .requestMatchers("/api/hospitals/*/id-card").permitAll()
                        .requestMatchers("/api/users/*/id-card").permitAll()
                        // Publicly accessible frontend static files & routes (SPA)
                        .requestMatchers("/", "/index.html", "/static/**", "/assets/**", "/*.js", "/*.css", "/*.png", "/*.ico", "/*.svg").permitAll()
                        .requestMatchers("/hospital**", "/patient**", "/admin**").permitAll() 
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        .anyRequest().authenticated())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(securityLogger, org.springframework.security.web.context.SecurityContextHolderFilter.class)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Allow all origins for mobile app (Expo Go) connections
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
