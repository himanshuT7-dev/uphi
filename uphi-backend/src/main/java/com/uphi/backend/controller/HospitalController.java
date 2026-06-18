package com.uphi.backend.controller;

import com.uphi.backend.domain.Hospital;
import com.uphi.backend.repository.HospitalRepository;
import com.uphi.backend.service.HospitalService;
import com.uphi.backend.service.PdfService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hospitals")
public class HospitalController {

    private final HospitalRepository hospitalRepository;
    private final HospitalService hospitalService;
    private final PdfService pdfService;

    public HospitalController(HospitalRepository hospitalRepository, HospitalService hospitalService, PdfService pdfService) {
        this.hospitalRepository = hospitalRepository;
        this.hospitalService = hospitalService;
        this.pdfService = pdfService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MAIN_ADMIN', 'ADMIN')")
    public ResponseEntity<List<Hospital>> getAllHospitals() {
        return ResponseEntity.ok(hospitalRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('MAIN_ADMIN')")
    public ResponseEntity<Hospital> createHospital(@RequestBody Hospital hospital) {
        return ResponseEntity.ok(hospitalRepository.save(hospital));
    }

    @PostMapping("/register-with-admin")
    @PreAuthorize("hasRole('MAIN_ADMIN')")
    public ResponseEntity<Hospital> registerWithAdmin(@RequestBody Map<String, Object> request) {
        try {
            Hospital h = new Hospital();
            h.setName((String) request.get("name"));
            h.setAbhaFacilityId((String) request.get("abhaFacilityId"));
            h.setAddress((String) request.get("address"));
            h.setContactPhone((String) request.get("contactPhone"));
            h.setEmail((String) request.get("email"));

            Hospital saved = hospitalService.registerHospitalWithAdmin(
                    h,
                    (String) request.get("adminUsername"),
                    (String) request.get("adminPassword"),
                    (String) request.get("adminEmail")
            );
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Hospital> getHospitalById(@PathVariable String id) {
        return hospitalRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/id-card")
    public ResponseEntity<byte[]> getHospitalIdCard(@PathVariable String id) {
        try {
            Hospital h = hospitalRepository.findById(id).orElseThrow();
            byte[] pdf = pdfService.generateHospitalIdCard(h);
            String fileName = h.getName() != null ? h.getName().replaceAll("\\s+", "_") : id;
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"UPHI_Facility_ID_" + fileName + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
