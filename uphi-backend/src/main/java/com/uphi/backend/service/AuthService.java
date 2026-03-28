package com.uphi.backend.service;

import com.uphi.backend.domain.User;
import com.uphi.backend.domain.Patient;
import com.uphi.backend.domain.Role;
import com.uphi.backend.dto.AuthRequest;
import com.uphi.backend.dto.AuthResponse;
import com.uphi.backend.repository.UserRepository;
import com.uphi.backend.repository.PatientRepository;
import com.uphi.backend.security.JwtUtil;
import com.uphi.backend.security.CustomUserDetailsService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;
    private final CustomUserDetailsService userDetailsService;

    public AuthService(AuthenticationManager authenticationManager, JwtUtil jwtUtil,
            UserRepository userRepository, PatientRepository patientRepository, PasswordEncoder passwordEncoder,
            CustomUserDetailsService userDetailsService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.passwordEncoder = passwordEncoder;
        this.userDetailsService = userDetailsService;
    }

    public void register(AuthRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Username is already taken.");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());

        User savedUser = userRepository.save(user);

        if (Role.PATIENT.equals(request.getRole())) {
            Patient patient = new Patient();
            patient.setUserId(savedUser.getId());
            patient.setAbhaAddress(request.getUsername());
            patient.setFullName(request.getUsername());
            patient.setAge(0);
            patient.setGender("Not Specified");
            patient.setBloodGroup("Unknown");
            patient.setPhone("");
            patient.setEmail("");

            patientRepository.save(patient);
        }
    }

    public AuthResponse login(AuthRequest request) {
        String principalId = request.getUsername() != null ? request.getUsername().trim() : "";
        String originalId = principalId;

        // Universal Login: check if the provided string is actually a registered mobile number
        Optional<User> userOptional = userRepository.findByUsername(originalId);
        
        if (userOptional.isEmpty()) {
            userOptional = userRepository.findByMobile(originalId);
        }
        
        if (userOptional.isEmpty()) {
            userOptional = userRepository.findByEmail(originalId);
        }
        
        if (userOptional.isEmpty()) {
            // Try lowercase for email compatibility
            userOptional = userRepository.findByEmail(originalId.toLowerCase());
        }

        if (userOptional.isPresent()) {
            principalId = userOptional.get().getUsername(); // Map to standard Spring Security username
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(principalId, request.getPassword()));

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String jwt = jwtUtil.generateToken(userDetails);

        Optional<User> resolvedUserOpt = userRepository.findByUsername(userDetails.getUsername());
        String role = resolvedUserOpt.map(u -> u.getRole().name()).orElse("");
        String hospitalId = resolvedUserOpt.map(User::getHospitalId).orElse("");

        return new AuthResponse(jwt, userDetails.getUsername(), role, hospitalId);
    }

    public AuthResponse refreshToken(String currentUsername) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(currentUsername);
        String newToken = jwtUtil.generateToken(userDetails);
        Optional<User> userOpt = userRepository.findByUsername(currentUsername);
        String role = userOpt.map(u -> u.getRole().name()).orElse("");
        String hospitalId = userOpt.map(User::getHospitalId).orElse("");
        return new AuthResponse(newToken, currentUsername, role, hospitalId);
    }
}
