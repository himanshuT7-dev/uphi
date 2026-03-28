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
            if (userRepository.findByUsername("admin").isPresent() || userRepository.findByUsername("main_admin").isPresent()) {
                logger.info("Database already initialized. Skipping wipe.");
                return;
            }

            logger.info("Initializing new database... Creating default users.");
            userRepository.deleteAll();
            patientRepository.deleteAll();
            medicalRecordRepository.deleteAll();

            // 1. Create Default ROOT Admin
            User admin = new User();
            admin.setUsername("Himanshu");
            admin.setMobile("9834408154");
            admin.setPasswordHash(passwordEncoder.encode("Welcome@123"));
            admin.setRole(Role.MAIN_ADMIN);
            admin.setCreatedAt(Instant.now());
            userRepository.save(admin);

            // 2. Create standard "admin" access
            User standardAdmin = new User();
            standardAdmin.setUsername("admin");
            standardAdmin.setPasswordHash(passwordEncoder.encode("admin123"));
            standardAdmin.setRole(Role.MAIN_ADMIN);
            standardAdmin.setCreatedAt(Instant.now());
            userRepository.save(standardAdmin);

            // 3. Create "main_admin" access (per user feedback)
            User mainAdmin = new User();
            mainAdmin.setUsername("main_admin");
            mainAdmin.setPasswordHash(passwordEncoder.encode("admin123"));
            mainAdmin.setRole(Role.MAIN_ADMIN);
            mainAdmin.setCreatedAt(Instant.now());
            userRepository.save(mainAdmin);

            // 4. Create default DOCTOR
            User doctor = new User();
            doctor.setUsername("doctor");
            doctor.setPasswordHash(passwordEncoder.encode("doctor123"));
            doctor.setRole(Role.DOCTOR);
            doctor.setCreatedAt(Instant.now());
            userRepository.save(doctor);

            // 5. Create default RECEPTIONIST
            User recep = new User();
            recep.setUsername("receptionist");
            recep.setPasswordHash(passwordEncoder.encode("recep123"));
            recep.setRole(Role.RECEPTIONIST);
            recep.setCreatedAt(Instant.now());
            userRepository.save(recep);

            logger.info("Clinical users created: doctor (pw: doctor123), receptionist (pw: recep123)");

            logger.info("Default Admin users created: Himanshu, admin, main_admin (pw: admin123)");

            logger.info("Data initialization complete. Testing data wiped. Ready for production.");
        };
    }
}
