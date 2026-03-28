package com.uphi.backend.controller;

import com.uphi.backend.domain.Role;
import com.uphi.backend.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @PostMapping("/otp/generate")
    public ResponseEntity<?> generateOtp(@RequestBody Map<String, String> request, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return ResponseEntity.status(401).build();
        try {
            adminService.generateStaffRegistrationOtp(request.get("email"));
            return ResponseEntity.ok("OTP fired successfully to the email address.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    @PostMapping("/staff")
    public ResponseEntity<?> registerStaff(@RequestBody Map<String, String> request, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return ResponseEntity.status(401).build();
        try {
            String email = request.get("email");
            String otp = request.get("otp");
            Role role = Role.valueOf(request.get("role"));
            String username = request.get("username");
            String password = request.get("password");
            String targetHospitalId = request.get("hospitalId");

            adminService.registerStaff(authentication.getName(), email, otp, role, username, password, targetHospitalId);
            return ResponseEntity.ok("Staff member highly-secure registration complete.");
        } catch (IllegalArgumentException | SecurityException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("An error occurred during secure registration.");
        }
    }


    @DeleteMapping("/staff/{id}")
    public ResponseEntity<?> removeStaff(@PathVariable String id, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return ResponseEntity.status(401).build();
        try {
            adminService.removeStaff(authentication.getName(), id);
            return ResponseEntity.ok("Staff member permanently removed.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/staff/{id}/credentials")
    public ResponseEntity<?> updateCredentials(@PathVariable String id, @RequestBody Map<String, String> request, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return ResponseEntity.status(401).build();
        try {
            adminService.updateStaffCredentials(
                    authentication.getName(),
                    id,
                    request.get("newUsername"),
                    request.get("newPassword")
            );
            return ResponseEntity.ok("Credentials overridden securely.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/users/{userId}/credentials")
    public ResponseEntity<?> globalCredentialReset(@PathVariable String userId, @RequestBody Map<String, String> request, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return ResponseEntity.status(401).build();
        try {
            adminService.updateUserCredentials(
                    authentication.getName(),
                    userId,
                    request.get("newUsername"),
                    request.get("newPassword")
            );
            return ResponseEntity.ok("Global Security Override Successful: Credentials Overwritten.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
