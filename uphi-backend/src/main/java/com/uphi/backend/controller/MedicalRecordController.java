package com.uphi.backend.controller;

import com.uphi.backend.domain.MedicalRecord;
import com.uphi.backend.service.MedicalRecordService;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import java.util.List;

@RestController
@RequestMapping("/api/records")
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;
    private final com.uphi.backend.service.PdfService pdfService;
    private final com.uphi.backend.repository.PatientRepository patientRepository;
    private final com.uphi.backend.repository.HospitalRepository hospitalRepository;
    private final com.uphi.backend.service.ConsentService consentService;
    private final com.uphi.backend.repository.UserRepository userRepository;

    public MedicalRecordController(MedicalRecordService medicalRecordService, 
                                  com.uphi.backend.service.PdfService pdfService,
                                  com.uphi.backend.repository.PatientRepository patientRepository,
                                  com.uphi.backend.repository.HospitalRepository hospitalRepository,
                                  com.uphi.backend.service.ConsentService consentService,
                                  com.uphi.backend.repository.UserRepository userRepository) {
        this.medicalRecordService = medicalRecordService;
        this.pdfService = pdfService;
        this.patientRepository = patientRepository;
        this.hospitalRepository = hospitalRepository;
        this.consentService = consentService;
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<List<MedicalRecord>> getMyRecords(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(medicalRecordService.getMyRecords(authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<MedicalRecord> createRecord(@RequestBody MedicalRecord record) {
        return ResponseEntity.ok(medicalRecordService.createRecord(record));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<MedicalRecord>> getRecordsByPatientId(@PathVariable String patientId) {
        return ResponseEntity.ok(medicalRecordService.getRecordsByPatientId(patientId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MedicalRecord> getRecordById(@PathVariable String id) {
        return medicalRecordService.getRecordById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/scan")
    public ResponseEntity<String> uploadScan(@PathVariable String id, @RequestParam("file") MultipartFile file, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return ResponseEntity.status(401).build();
        try {
            medicalRecordService.uploadScan(id, file, authentication.getName());
            return ResponseEntity.ok("Scan uploaded successfully as PDF with zero data loss preserved securely.");
        } catch (IllegalArgumentException | SecurityException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error uploading raw scan file");
        }
    }

    @GetMapping("/{id}/scan")
    public ResponseEntity<byte[]> downloadScan(@PathVariable String id, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return ResponseEntity.status(401).build();
        try {
            MedicalRecord record = medicalRecordService.getRecordById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Record not found"));
            
            com.uphi.backend.domain.User currentUser = userRepository.findByUsername(authentication.getName())
                    .orElseThrow(() -> new SecurityException("User not found"));
            
            String hid = currentUser.getHospitalId() != null ? currentUser.getHospitalId() : currentUser.getId();

            // Check if patient is the requester
            boolean isOwner = false;
            java.util.Optional<com.uphi.backend.domain.Patient> patientOpt = patientRepository.findByUserId(currentUser.getId());
            if (patientOpt.isPresent() && patientOpt.get().getId().equals(record.getPatientId())) {
                isOwner = true;
            }

            // Check for consent if not owner
            if (!isOwner && !consentService.hasApprovedConsent(record.getPatientId(), hid)) {
                return ResponseEntity.status(403).build();
            }

            GridFsResource resource = medicalRecordService.downloadScan(id, authentication.getName());
            if (resource == null) return ResponseEntity.notFound().build();
            
            String contentType = record.getContentType() != null ? record.getContentType() : "application/pdf";
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource.getContentAsByteArray());
        } catch (SecurityException e) {
            return ResponseEntity.status(403).build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadBrandedReport(@PathVariable String id, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return ResponseEntity.status(401).build();
        try {
            MedicalRecord record = medicalRecordService.getRecordById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Record not found"));
            
            com.uphi.backend.domain.Patient patient = patientRepository.findById(record.getPatientId())
                    .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
            
            com.uphi.backend.domain.Hospital hospital = null;
            if (record.getHospitalId() != null && !record.getHospitalId().equals("SELF")) {
                hospital = hospitalRepository.findById(record.getHospitalId()).orElse(null);
            }

            byte[] pdf = pdfService.generateClinicalReportPdf(patient, record, hospital);
            
            String fileName = patient.getFullName() != null ? patient.getFullName().replaceAll("\\s+", "_") : patient.getAbhaAddress();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"UPHI_Report_" + fileName + "_" + id + ".pdf\"")
                    .body(pdf);
        } catch (Exception e) {
            System.err.println("PDF Generation Error: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadNewRecord(
            @RequestParam("file") MultipartFile file, 
            @RequestParam("type") String type, 
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "clinicalNotes", required = false) String clinicalNotes,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return ResponseEntity.status(401).build();
        try {
            MedicalRecord record = medicalRecordService.uploadNewPatientRecord(authentication.getName(), file, type, title, clinicalNotes);
            return ResponseEntity.ok(record);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Upload failed: " + e.getMessage());
        }
    }

    @GetMapping("/patient/{patientId}/self-uploaded")
    public ResponseEntity<List<MedicalRecord>> getSelfUploadedRecords(@PathVariable String patientId, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return ResponseEntity.status(401).build();
        
        com.uphi.backend.domain.User currentUser = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Logged in user not found"));
        
        String hospitalId = currentUser.getHospitalId();
        if (hospitalId == null) {
            // If they are a direct HOSPITAL user (not staff)
            hospitalId = currentUser.getId();
        }

        // Verify Consent
        if (!consentService.hasApprovedConsent(patientId, hospitalId)) {
            System.out.println("DEBUG: Consent Denied for patient " + patientId + " and hospital " + hospitalId);
            return ResponseEntity.status(403).build(); // No active consent for this hospital
        }

        List<MedicalRecord> all = medicalRecordService.getRecordsByPatientId(patientId);
        List<MedicalRecord> selfUploaded = all.stream()
                .filter(r -> "SELF".equals(r.getHospitalId()))
                .collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(selfUploaded);
    }

    @PostMapping("/sync-vault/{id}")
    public ResponseEntity<MedicalRecord> syncVaultRecord(@PathVariable String id, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return ResponseEntity.status(401).build();
        try {
            MedicalRecord official = medicalRecordService.syncVaultRecordToHospital(id, authentication.getName());
            return ResponseEntity.ok(official);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(403).build();
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecord(@PathVariable String id, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return ResponseEntity.status(401).build();
        try {
            medicalRecordService.deleteRecord(id, authentication.getName());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(403).build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
