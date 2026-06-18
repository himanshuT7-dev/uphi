package com.uphi.backend.config;

import com.uphi.backend.repository.UserRepository;
import com.uphi.backend.domain.Role;
import com.uphi.backend.domain.User;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.uphi.backend.repository.PatientRepository;
import com.uphi.backend.repository.ConsentRepository;
import com.uphi.backend.repository.MedicalRecordRepository;

@Configuration
public class DataInitializer {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    public CommandLineRunner initData(UserRepository userRepository,
            PatientRepository patientRepository,
            ConsentRepository consentRepository,
            MedicalRecordRepository medicalRecordRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // ALWAYS ensure basic demo accounts exist
            // 1. Core Platform Admins
            ensureUser(userRepository, passwordEncoder, "uphi_master", "Master@123", Role.MAIN_ADMIN);
            ensureUser(userRepository, passwordEncoder, "admin", "admin123", Role.MAIN_ADMIN);
            ensureUser(userRepository, passwordEncoder, "Himanshu", "Welcome@123", Role.MAIN_ADMIN);
            ensureUser(userRepository, passwordEncoder, "main_admin", "admin123", Role.MAIN_ADMIN);

            // 2. Default Clinical Sample Roles (Standalone Mock)
            ensureUser(userRepository, passwordEncoder, "doctor", "doctor123", Role.DOCTOR);
            ensureUser(userRepository, passwordEncoder, "receptionist", "recep123", Role.RECEPTIONIST);

            logger.info("Data initialization complete. Core identities ready.");

        };
    }

    private void ensureUser(UserRepository repo, PasswordEncoder encoder, String user, String pass, Role role) {
        if (repo.findByUsername(user).isEmpty()) {
            User u = new User();
            u.setUsername(user);
            u.setPasswordHash(encoder.encode(pass));
            u.setRole(role);
            u.setCreatedAt(Instant.now());
            repo.save(u);
            logger.info("Created core user: {}", user);
        }
    }
}
