package com.uphi.backend.controller;

import com.uphi.backend.domain.User;
import com.uphi.backend.repository.HospitalRepository;
import com.uphi.backend.repository.UserRepository;
import com.uphi.backend.service.PdfService;
import com.uphi.backend.service.UserService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;
    private final PdfService pdfService;

    public UserController(UserService userService, UserRepository userRepository, HospitalRepository hospitalRepository, PdfService pdfService) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.hospitalRepository = hospitalRepository;
        this.pdfService = pdfService;
    }

    @GetMapping("/staff")
    public ResponseEntity<List<User>> getStaff() {
        return ResponseEntity.ok(userService.getStaff());
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return ResponseEntity.status(401).build();
        Optional<User> userOpt = userRepository.findByUsername(auth.getName());
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();
        User u = userOpt.get();
        Map<String, Object> response = new HashMap<>();
        response.put("id", u.getId());
        response.put("username", u.getUsername());
        response.put("role", u.getRole());
        response.put("hospitalId", u.getHospitalId());
        response.put("fullName", u.getFullName());
        
        if (u.getHospitalId() != null && !u.getHospitalId().isEmpty()) {
            hospitalRepository.findById(u.getHospitalId()).ifPresent(h -> {
                response.put("hospitalName", h.getName());
            });
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{username}/id-card")
    public ResponseEntity<byte[]> getStaffIdCard(@PathVariable String username) {
        try {
            User user = userRepository.findByUsername(username).orElseThrow();
            com.uphi.backend.domain.Hospital hospital = user.getHospitalId() != null 
                ? hospitalRepository.findById(user.getHospitalId()).orElse(null) 
                : null;
            byte[] pdf = pdfService.generateStaffIdCard(user, hospital);
            String fileName = user.getFullName() != null ? user.getFullName().replaceAll("\\s+", "_") : username;
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"UPHI_Staff_ID_" + fileName + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
