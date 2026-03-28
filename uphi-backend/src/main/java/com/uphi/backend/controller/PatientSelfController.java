package com.uphi.backend.controller;

import com.uphi.backend.domain.Patient;
import com.uphi.backend.repository.PatientRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/my-profile")
public class PatientSelfController {

    private final PatientRepository patientRepository;

    public PatientSelfController(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<Patient> getMyProfile(Authentication authentication) {
        String username = authentication.getName();
        return patientRepository.findByAbhaAddress(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> updateMyProfile(@RequestBody Map<String, String> updates, Authentication authentication) {
        String username = authentication.getName();
        return patientRepository.findByAbhaAddress(username)
                .map(patient -> {
                    if (updates.containsKey("gender")) patient.setGender(updates.get("gender"));
                    if (updates.containsKey("dob")) patient.setDob(updates.get("dob"));
                    if (updates.containsKey("bloodGroup")) patient.setBloodGroup(updates.get("bloodGroup"));
                    if (updates.containsKey("phone")) patient.setPhone(updates.get("phone"));
                    if (updates.containsKey("email")) patient.setEmail(updates.get("email"));
                    patientRepository.save(patient);
                    return ResponseEntity.ok(patient);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
