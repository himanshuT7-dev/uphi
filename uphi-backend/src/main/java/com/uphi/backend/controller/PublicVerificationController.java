package com.uphi.backend.controller;

import com.uphi.backend.repository.HospitalRepository;
import com.uphi.backend.repository.PatientRepository;
import com.uphi.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/verify")
public class PublicVerificationController {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;

    public PublicVerificationController(PatientRepository patientRepository, 
                                      UserRepository userRepository, 
                                      HospitalRepository hospitalRepository) {
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.hospitalRepository = hospitalRepository;
    }

    @GetMapping("/patient/{abhaId}")
    public ResponseEntity<?> verifyPatient(@PathVariable String abhaId) {
        return patientRepository.findByAbhaAddress(abhaId)
                .map(p -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("type", "PATIENT");
                    data.put("name", p.getFullName());
                    data.put("id", p.getAbhaAddress());
                    data.put("dob", p.getDob());
                    data.put("gender", p.getGender());
                    data.put("bloodGroup", p.getBloodGroup());
                    data.put("status", "ACTIVE_VERIFIED");
                    data.put("network", "UPHI GLOBAL");
                    return ResponseEntity.ok(data);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/staff/{username}")
    public ResponseEntity<?> verifyStaff(@PathVariable String username) {
        return userRepository.findByUsername(username)
                .map(u -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("type", u.getRole().toString());
                    data.put("name", u.getFullName() != null ? u.getFullName() : u.getUsername());
                    data.put("id", u.getRegistrationId() != null ? u.getRegistrationId() : "V-" + u.getUsername());
                    data.put("specialization", u.getSpecialization());
                    data.put("status", "LICENSED_VERIFIED");
                    
                    if (u.getHospitalId() != null) {
                        hospitalRepository.findById(u.getHospitalId()).ifPresent(h -> data.put("facility", h.getName()));
                    }
                    return ResponseEntity.ok(data);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/hospital/{id}")
    public ResponseEntity<?> verifyHospital(@PathVariable String id) {
        return hospitalRepository.findById(id)
                .map(h -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("type", "HOSPITAL_FACILITY");
                    data.put("name", h.getName());
                    data.put("id", h.getAbhaFacilityId());
                    data.put("address", h.getAddress());
                    data.put("status", "ACCREDITED_NODE");
                    return ResponseEntity.ok(data);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
