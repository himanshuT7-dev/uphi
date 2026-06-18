package com.uphi.backend.controller;

import com.uphi.backend.domain.Patient;
import com.uphi.backend.service.DataSeederService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class DataSeederController {

    private final DataSeederService dataSeederService;

    public DataSeederController(DataSeederService dataSeederService) {
        this.dataSeederService = dataSeederService;
    }

    @PostMapping("/seed-data/{hospitalId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAIN_ADMIN')")
    public ResponseEntity<List<Patient>> seedData(@PathVariable String hospitalId, @RequestParam(defaultValue = "10") int count) {
        List<Patient> seeded = dataSeederService.seedPatientsForHospital(hospitalId, count);
        return ResponseEntity.ok(seeded);
    }

    @PostMapping("/seed-golden-demo")
    @PreAuthorize("hasRole('MAIN_ADMIN')")
    public ResponseEntity<Map<String, String>> seedGoldenDemo() {
        dataSeederService.seedGoldenDemo();
        return ResponseEntity.ok(Map.of("message", "Golden Demo state initialized: 6 Hospitals, 30+ Staff, 20+ Patients with rich records."));
    }
}
