package com.uphi.backend.controller;

import com.uphi.backend.domain.Patient;
import com.uphi.backend.domain.models.Condition;
import com.uphi.backend.domain.models.RelatedPerson;
import com.uphi.backend.service.PdfService;
import com.uphi.backend.service.ReceptionistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/receptionist/patients")
public class ReceptionistController {

    @Autowired
    private ReceptionistService receptionistService;

    @Autowired
    private PdfService pdfService;


    public ReceptionistController(ReceptionistService receptionistService) {
        this.receptionistService = receptionistService;
    }

    @PostMapping("/otp/generate")
    public ResponseEntity<?> generateOtp(@RequestBody Map<String, String> request) {
        // Publicly accessible for patient registration flow
        try {
            String email = request.get("email");
            String phone = request.get("phone");
            
            if (phone != null && !phone.isEmpty()) {
                receptionistService.requestPatientSmsOtp(phone);
                return ResponseEntity.ok("Patient OTP dispatched to phone.");
            } else if (email != null && !email.isEmpty()) {
                receptionistService.requestPatientOtp(email);
                return ResponseEntity.ok("Patient OTP dispatched to email.");
            } else {
                return ResponseEntity.badRequest().body("Neither email nor phone provided for OTP.");
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
 
    @PostMapping("/otp/verify")
    public ResponseEntity<?> verifyOtpOnly(@RequestBody Map<String, String> request) {
        // Publicly accessible to unblock registration flow
        try {
            String identity = request.get("email");
            if (identity == null) identity = request.get("phone");
            String otp = request.get("otp");
            
            boolean valid = receptionistService.validateOtpOnly(identity, otp);
            if (valid) return ResponseEntity.ok("OTP Verified successfully.");
            else return ResponseEntity.badRequest().body("Invalid or expired OTP.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    @PostMapping("/register")
    public ResponseEntity<?> registerPatient(@RequestBody RegistrationRequest request, Authentication authentication) {
        String registrantId = (authentication != null && authentication.isAuthenticated()) 
                ? authentication.getName() 
                : "SELF";
        try {
            Patient created = receptionistService.registerPatient(
                    registrantId,
                    request.getEmail(),
                    request.getPhone(),
                    request.getOtp(),
                    request.getFullName(),
                    request.getDob(),
                    request.getGender(),
                    request.getBloodGroup(),
                    request.getAddress(),
                    request.getAadhaar(),
                    request.getAbha(),
                    request.getOldDiagnosis()
            );

            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException | SecurityException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("An error occurred during Receptionist onboarding.");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> removePatient(@PathVariable String id, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return ResponseEntity.status(401).build();
        try {
            receptionistService.removePatient(authentication.getName(), id);
            return ResponseEntity.ok("Patient fully unregistered.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Static nested class to cleanly handle the complex JSON body from Frontend
    public static class RegistrationRequest {
        private String email;
        private String phone;
        private String otp;
        private String fullName;
        private String dob;
        private String gender;
        private String bloodGroup;
        private String address;
        private String aadhaar;
        private String abha;
        private List<Condition> oldDiagnosis;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }

        public String getOtp() { return otp; }
        public void setOtp(String otp) { this.otp = otp; }
        
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }

        public String getDob() { return dob; }
        public void setDob(String dob) { this.dob = dob; }

        public String getGender() { return gender; }
        public void setGender(String gender) { this.gender = gender; }

        public String getBloodGroup() { return bloodGroup; }
        public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getAadhaar() { return aadhaar; }
        public void setAadhaar(String aadhaar) { this.aadhaar = aadhaar; }
        public String getAbha() { return abha; }
        public void setAbha(String abha) { this.abha = abha; }
        public List<Condition> getOldDiagnosis() { return oldDiagnosis; }
        public void setOldDiagnosis(List<Condition> oldDiagnosis) { this.oldDiagnosis = oldDiagnosis; }
    }

    @GetMapping("/{id}/id-card")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'ADMIN', 'MAIN_ADMIN')")
    public ResponseEntity<byte[]> getPatientIdCard(@PathVariable String id) {
        try {
            Patient patient = receptionistService.getPatientById(id);
            byte[] pdfBytes = pdfService.generatePatientIdCard(patient);
            
            String fileName = patient.getFullName() != null ? patient.getFullName().replaceAll("\\s+", "_") : patient.getAbhaAddress();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"UPHI_ID_" + fileName + ".pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(("Error generating ID card: " + e.getMessage()).getBytes());
        }
    }

    @GetMapping("/{id}/id-card/download")
    public ResponseEntity<byte[]> downloadPatientIdCard(@PathVariable String id, @RequestParam("token") String token) {
        try {
            com.uphi.backend.security.JwtUtil jwtUtil = org.springframework.web.context.support.WebApplicationContextUtils
                .getRequiredWebApplicationContext(
                    ((org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder.getRequestAttributes()).getRequest().getServletContext()
                ).getBean(com.uphi.backend.security.JwtUtil.class);
            
            String username = jwtUtil.extractUsername(token);
            if (username == null) {
                return ResponseEntity.status(401).body("Invalid token".getBytes());
            }
            
            Patient patient = receptionistService.getPatientById(id);
            byte[] pdfBytes = pdfService.generatePatientIdCard(patient);
            
            String fileName = patient.getFullName() != null ? patient.getFullName().replaceAll("\\s+", "_") : patient.getAbhaAddress();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"UPHI_ID_" + fileName + ".pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(("Error: " + e.getMessage()).getBytes());
        }
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN', 'MAIN_ADMIN')")
    public ResponseEntity<List<Patient>> getAllPatients(Authentication authentication) {
        try {
            if (authentication == null) return ResponseEntity.status(401).build();
            return ResponseEntity.ok(receptionistService.getAllPatients(authentication.getName()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{id}/relatives")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN', 'MAIN_ADMIN')")
    public ResponseEntity<?> addRelatedPerson(
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        try {
            String otp = (String) request.get("otp");
            @SuppressWarnings("unchecked")
            Map<String, String> relativeData = (Map<String, String>) request.get("relative");
            
            RelatedPerson rp = new RelatedPerson();
            rp.setFullName(relativeData.get("fullName"));
            rp.setRelationship(relativeData.get("relationship"));
            rp.setPhone(relativeData.get("phone"));
            rp.setEmail(relativeData.get("email"));
            rp.setAbhaAddress(relativeData.get("abhaAddress"));

            receptionistService.addRelatedPerson(id, rp, otp);
            return ResponseEntity.ok("Relative linked successfully.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}


