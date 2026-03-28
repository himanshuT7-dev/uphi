package com.uphi.backend.controller;

import com.uphi.backend.domain.User;
import com.uphi.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final com.uphi.backend.repository.UserRepository userRepository;
    private final com.uphi.backend.repository.HospitalRepository hospitalRepository;

    public UserController(UserService userService, com.uphi.backend.repository.UserRepository userRepository, com.uphi.backend.repository.HospitalRepository hospitalRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.hospitalRepository = hospitalRepository;
    }

    @GetMapping("/staff")
    public ResponseEntity<List<User>> getStaff() {
        return ResponseEntity.ok(userService.getStaff());
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(org.springframework.security.core.Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return ResponseEntity.status(401).build();
        java.util.Optional<User> userOpt = userRepository.findByUsername(auth.getName());
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();
        User u = userOpt.get();
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("id", u.getId());
        response.put("username", u.getUsername());
        response.put("role", u.getRole());
        response.put("hospitalId", u.getHospitalId());
        
        if (u.getHospitalId() != null && !u.getHospitalId().isEmpty()) {
            hospitalRepository.findById(u.getHospitalId()).ifPresent(h -> {
                response.put("hospitalName", h.getName());
            });
        }
        return ResponseEntity.ok(response);
    }
}
