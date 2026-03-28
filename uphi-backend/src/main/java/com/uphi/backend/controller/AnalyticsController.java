package com.uphi.backend.controller;

import com.uphi.backend.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.uphi.backend.domain.User;
import com.uphi.backend.repository.UserRepository;
import java.security.Principal;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final UserRepository userRepository;

    public AnalyticsController(AnalyticsService analyticsService, UserRepository userRepository) {
        this.analyticsService = analyticsService;
        this.userRepository = userRepository;
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAIN_ADMIN', 'HOSPITAL', 'DOCTOR')")
    public ResponseEntity<?> getSummary(Principal principal) {
        return userRepository.findByUsername(principal.getName())
                .map(user -> ResponseEntity.ok(analyticsService.getHospitalSummary(user.getHospitalId())))
                .orElse(ResponseEntity.status(401).build());
    }
}
