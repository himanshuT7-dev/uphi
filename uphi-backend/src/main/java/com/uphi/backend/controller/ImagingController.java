package com.uphi.backend.controller;

import com.uphi.backend.domain.Patient;
import com.uphi.backend.domain.models.ImagingRecord;
import com.uphi.backend.domain.models.MedicalDocument;
import com.uphi.backend.service.AiService;
import com.uphi.backend.service.ReceptionistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/imaging")
public class ImagingController {

    @Autowired
    private ReceptionistService receptionistService;

    @Autowired
    private AiService aiService;

    @PostMapping("/scan/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'MAIN_ADMIN')")
    public ResponseEntity<?> scanImaging(
            @PathVariable String patientId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") String type,
            @RequestParam("doctorName") String doctorName) {
        
        try {
            // 1. Process and analyze with AI
            String analysisResult = aiService.analyzeClinicalImage(file, type);

            // 2. Persist lossless reference (mocking storage path for now)
            String imageUrl = "/uploads/imaging/" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
            // In a real system, we'd save the file to a secure high-resolution bucket here.

            ImagingRecord record = new ImagingRecord(type, imageUrl, analysisResult, doctorName);
            
            // 3. Update Patient record
            Patient patient = receptionistService.getPatientById(patientId);
            patient.getImagingRecords().add(record);
            receptionistService.updatePatient(patient); // Assuming updatePatient exists

            return ResponseEntity.ok(record);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Imaging Processing Failed: " + e.getMessage());
        }
    }

    @GetMapping("/history/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'PATIENT', 'MAIN_ADMIN')")
    public ResponseEntity<List<ImagingRecord>> getImagingHistory(@PathVariable String patientId) {
        try {
            Patient patient = receptionistService.getPatientById(patientId);
            return ResponseEntity.ok(patient.getImagingRecords());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/upload-doc/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'MAIN_ADMIN')")
    public ResponseEntity<?> uploadDocument(
            @PathVariable String patientId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("uploadedBy") String uploadedBy) {
        
        try {
            String fileUrl = "/uploads/docs/" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
            String type = file.getContentType().contains("pdf") ? "PDF" : "REPORT";

            MedicalDocument doc = new MedicalDocument(title, type, fileUrl, uploadedBy);
            
            Patient patient = receptionistService.getPatientById(patientId);
            patient.getMedicalDocuments().add(doc);
            receptionistService.updatePatient(patient);

            return ResponseEntity.ok(doc);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Document Upload Failed: " + e.getMessage());
        }
    }

    @GetMapping("/docs/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'PATIENT', 'MAIN_ADMIN')")
    public ResponseEntity<List<MedicalDocument>> getDocumentHistory(@PathVariable String patientId) {
        try {
            Patient patient = receptionistService.getPatientById(patientId);
            return ResponseEntity.ok(patient.getMedicalDocuments());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
