package com.uphi.backend.controller;

import com.uphi.backend.domain.Patient;
import com.uphi.backend.domain.Prescription;
import com.uphi.backend.service.PatientService;
import com.uphi.backend.repository.PrescriptionRepository;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import com.uphi.backend.service.PdfExportService;
import com.uphi.backend.service.PdfService;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientService patientService;
    private final PdfExportService pdfExportService;
    private final PdfService pdfService;
    private final PrescriptionRepository prescriptionRepository;

    public PatientController(PatientService patientService, PdfExportService pdfExportService, PdfService pdfService, PrescriptionRepository prescriptionRepository) {
        this.patientService = patientService;
        this.pdfExportService = pdfExportService;
        this.pdfService = pdfService;
        this.prescriptionRepository = prescriptionRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<Patient> getMyPatientProfile(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        return patientService.getPatientByUsername(authentication.getName())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'ADMIN', 'MAIN_ADMIN', 'PATIENT')")
    public ResponseEntity<List<Patient>> getAllPatients() {
        return ResponseEntity.ok(patientService.getAllPatients());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'ADMIN', 'MAIN_ADMIN', 'PATIENT')")
    public ResponseEntity<Patient> getPatientById(@PathVariable String id) {
        return patientService.getPatientById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Patient> getPatientByUserId(@PathVariable String userId) {
        return patientService.getPatientByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Patient> registerPatient(@RequestBody Patient patient) {
        try {
            return ResponseEntity.ok(patientService.registerPatient(patient));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/global/{identifier}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'ADMIN', 'MAIN_ADMIN')")
    public ResponseEntity<Patient> searchGlobalPatient(@PathVariable String identifier) {
        return patientService.getPatientById(identifier) // service might already fall back
                .map(ResponseEntity::ok)
                .orElseGet(() -> {
                    // Direct repo lookup for global scan if ID is abha or phone
                    java.util.Optional<Patient> globalPatient = ((com.uphi.backend.repository.PatientRepository) org.springframework.web.context.support.WebApplicationContextUtils
                            .getRequiredWebApplicationContext(
                                    ((org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder.getRequestAttributes()).getRequest().getServletContext()
                            ).getBean(com.uphi.backend.repository.PatientRepository.class))
                            .findFirstByIdOrAbhaAddressOrPhone(identifier);
                    if (globalPatient.isPresent()) {
                        return ResponseEntity.ok(globalPatient.get());
                    } else {
                        return ResponseEntity.notFound().build();
                    }
                });
    }

    @PostMapping("/{id}/link-hospital")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'ADMIN', 'MAIN_ADMIN')")
    public ResponseEntity<Patient> linkPatientToHospital(@PathVariable String id, Authentication authentication) {
        com.uphi.backend.repository.UserRepository userRepo = org.springframework.web.context.support.WebApplicationContextUtils
                .getRequiredWebApplicationContext(
                        ((org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder.getRequestAttributes()).getRequest().getServletContext()
                ).getBean(com.uphi.backend.repository.UserRepository.class);

        com.uphi.backend.repository.PatientRepository patientRepo = org.springframework.web.context.support.WebApplicationContextUtils
                .getRequiredWebApplicationContext(
                        ((org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder.getRequestAttributes()).getRequest().getServletContext()
                ).getBean(com.uphi.backend.repository.PatientRepository.class);

        return userRepo.findByUsername(authentication.getName())
            .flatMap(staff -> patientRepo.findById(id).map(patient -> {
                if (staff.getHospitalId() != null && !staff.getHospitalId().isEmpty()) {
                    if (patient.getAffiliatedHospitals() == null) {
                        patient.setAffiliatedHospitals(new java.util.HashSet<>());
                    }
                    patient.getAffiliatedHospitals().add(staff.getHospitalId());
                    patientRepo.save(patient);
                }
                return patient;
            }))
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'ADMIN', 'MAIN_ADMIN')")
    public ResponseEntity<Patient> updatePatient(@PathVariable String id, @RequestBody Patient updatedData) {
        return patientService.updatePatient(id, updatedData)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<byte[]> exportPatientProfilePdf(@PathVariable String id) {
        try {
            Patient patient = patientService.getPatientById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
            byte[] pdfBytes = pdfExportService.generatePatientProfilePdf(patient);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"UPHI_Profile_" + patient.getAbhaAddress() + ".pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}/id-card")
    public ResponseEntity<byte[]> getPatientIdCard(@PathVariable String id, Authentication authentication) {
        try {
            if (authentication == null) return ResponseEntity.status(401).build();
            Patient patient = patientService.getPatientById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
            boolean isSelf = patient.getAbhaAddress().equals(authentication.getName());
            boolean isStaff = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_RECEPTIONIST") || 
                                  a.getAuthority().equals("ROLE_DOCTOR") || 
                                  a.getAuthority().equals("ROLE_ADMIN") ||
                                  a.getAuthority().equals("ROLE_MAIN_ADMIN"));
            if (!isSelf && !isStaff) {
                return ResponseEntity.status(403).build();
            }
            byte[] pdfBytes = pdfService.generatePatientIdCard(patient);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=UPHI_ID_" + patient.getAbhaAddress() + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{id}/discharge-pdf")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'ADMIN', 'MAIN_ADMIN')")
    public ResponseEntity<byte[]> generateDischargePdf(@PathVariable String id, @RequestBody Map<String, String> dischargeData) {
        try {
            Patient patient = patientService.getPatientById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
            byte[] pdfBytes = pdfService.generateDischargeSummary(patient, dischargeData);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=UPHI_Discharge_" + patient.getAbhaAddress() + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}/prescription-pdf/{prescriptionId}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'ADMIN', 'MAIN_ADMIN', 'PATIENT')")
    public ResponseEntity<byte[]> generatePrescriptionPdf(@PathVariable String id, @PathVariable String prescriptionId) {
        try {
            Patient patient = patientService.getPatientById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
            Prescription prescription = prescriptionRepository.findById(prescriptionId)
                    .orElseThrow(() -> new IllegalArgumentException("Prescription not found"));
            byte[] pdfBytes = pdfService.generatePrescriptionPdf(patient, prescription);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=UPHI_Rx_" + prescriptionId + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
