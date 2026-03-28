package com.uphi.backend.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class SecurityLoggingFilter implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(SecurityLoggingFilter.class);

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        chain.doFilter(request, response);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = (auth != null) ? auth.getName() : "Anonymous";
        String roles = (auth != null) ? auth.getAuthorities().toString() : "None";

        if (res.getStatus() == 403 || res.getStatus() == 401) {
            logger.warn("SECURITY DENIAL: {} {} -> Status {} | User: {} | Roles: {}", 
                req.getMethod(), req.getRequestURI(), res.getStatus(), username, roles);
        }
    }
}
