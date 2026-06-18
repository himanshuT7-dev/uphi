package com.uphi.backend.service;

import com.uphi.backend.domain.Hospital;
import com.uphi.backend.domain.Role;
import com.uphi.backend.domain.User;
import com.uphi.backend.repository.HospitalRepository;
import com.uphi.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class HospitalService {

    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public HospitalService(HospitalRepository hospitalRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.hospitalRepository = hospitalRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Hospital registerHospitalWithAdmin(Hospital hospital, String adminUsername, String adminPassword, String adminEmail) {
        // 1. Save Hospital
        Hospital savedHospital = hospitalRepository.save(hospital);

        // 2. Create Admin User for this Hospital
        User adminUser = new User();
        adminUser.setUsername(adminUsername);
        adminUser.setEmail(adminEmail);
        adminUser.setPasswordHash(passwordEncoder.encode(adminPassword));
        adminUser.setRole(Role.ADMIN);
        adminUser.setHospitalId(savedHospital.getId());
        adminUser.setCreatedAt(Instant.now());
        
        userRepository.save(adminUser);

        return savedHospital;
    }
}
