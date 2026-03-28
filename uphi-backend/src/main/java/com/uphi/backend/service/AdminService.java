package com.uphi.backend.service;

import com.uphi.backend.domain.Role;
import com.uphi.backend.domain.User;
import com.uphi.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final OtpService otpService;
    private final PasswordEncoder passwordEncoder;

    public AdminService(UserRepository userRepository, OtpService otpService, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.otpService = otpService;
        this.passwordEncoder = passwordEncoder;
    }

    private User getAuthorizedAdmin(String requesterUsername, Role targetRole) {
        User requester = userRepository.findByUsername(requesterUsername)
                .orElseThrow(() -> new SecurityException("Requester not found."));

        if (requester.getRole() != Role.MAIN_ADMIN && requester.getRole() != Role.ADMIN) {
            throw new SecurityException("Insufficient privileges. Only Admins can invoke this.");
        }

        if (targetRole == Role.ADMIN && requester.getRole() != Role.MAIN_ADMIN) {
            throw new SecurityException("Strict Hierarchical Violation: Only MAIN_ADMIN can manage ADMINs.");
        }

        return requester;
    }

    public String generateStaffRegistrationOtp(String targetEmail) {
        return otpService.generateAndSendOtp(targetEmail);
    }


    public User registerStaff(String requesterUsername, String email, String otp, Role targetRole, String newUsername, String newPassword, String targetHospitalId) {
        getAuthorizedAdmin(requesterUsername, targetRole);

        // Verify the Email-based OTP manually in the backend
        if (!otpService.verifyOtp(email, otp)) {
            throw new IllegalArgumentException("Invalid or expired OTP code.");
        }

        if (userRepository.findByUsername(newUsername).isPresent()) {
            throw new IllegalArgumentException("Username is already taken.");
        }
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email address is already registered.");
        }

        User newUser = new User();
        
        // --- Multi-Tenancy Boundary Enforcement ---
        User requester = userRepository.findByUsername(requesterUsername).orElseThrow();
        if (requester.getRole() == Role.MAIN_ADMIN) {
            // MAIN_ADMIN can assign them to ANY requested hospital, or leave null for global access (not recommended for Doctors/Receptionists)
            newUser.setHospitalId(targetHospitalId);
        } else {
            // ADMIN can ONLY spawn staff in their own facility
            newUser.setHospitalId(requester.getHospitalId());
        }
        
        newUser.setUsername(newUsername);
        newUser.setEmail(email);
        newUser.setPasswordHash(passwordEncoder.encode(newPassword));
        newUser.setRole(targetRole);
        newUser.setCreatedAt(java.time.Instant.now());

        return userRepository.save(newUser);
    }


    public void removeStaff(String requesterUsername, String staffId) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Staff member not found."));
        
        getAuthorizedAdmin(requesterUsername, staff.getRole());

        userRepository.delete(staff);
    }

    public void updateStaffCredentials(String requesterUsername, String staffId, String newUsername, String newPassword) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Staff member not found."));
        
        getAuthorizedAdmin(requesterUsername, staff.getRole());

        if (newUsername != null && !newUsername.isBlank()) {
            Optional<User> existing = userRepository.findByUsername(newUsername);
            if (existing.isPresent() && !existing.get().getId().equals(staffId)) {
                throw new IllegalArgumentException("Username is already taken by another user.");
            }
            staff.setUsername(newUsername);
        }

        if (newPassword != null && !newPassword.isBlank()) {
            staff.setPasswordHash(passwordEncoder.encode(newPassword));
        }

        userRepository.save(staff);
    }

    public void updateUserCredentials(String requesterUsername, String userId, String newUsername, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // Security: Ensure requester is MAIN_ADMIN for universal overrides
        User requester = userRepository.findByUsername(requesterUsername)
                .orElseThrow(() -> new SecurityException("Requester not found."));
        
        if (requester.getRole() != Role.MAIN_ADMIN) {
             throw new SecurityException("Global Credentials Override: Only MAIN_ADMIN can perform universal resets.");
        }

        if (newUsername != null && !newUsername.isBlank()) {
            Optional<User> existing = userRepository.findByUsername(newUsername);
            if (existing.isPresent() && !existing.get().getId().equals(userId)) {
                throw new IllegalArgumentException("Username is already taken.");
            }
            user.setUsername(newUsername);
        }

        if (newPassword != null && !newPassword.isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(newPassword));
        }

        userRepository.save(user);
    }
}
