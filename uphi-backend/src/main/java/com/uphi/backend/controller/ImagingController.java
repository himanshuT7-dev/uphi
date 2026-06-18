package com.uphi.backend.controller;

import com.uphi.backend.domain.Patient;
import com.uphi.backend.domain.models.ImagingRecord;
import com.uphi.backend.domain.models.MedicalDocument;
import com.uphi.backend.service.AiService;
import com.uphi.backend.service.ReceptionistService;
import com.uphi.backend.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Path;
import java.net.MalformedURLException;
import java.util.List;

@RestController
@RequestMapping("/api/imaging")
public class ImagingController {

    @Autowired
    private ReceptionistService receptionistService;

    @Autowired
    private AiService aiService;

    @Autowired
    private FileStorageService fileStorageService;

    @PostMapping("/scan/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'MAIN_ADMIN', 'PATIENT')")
    public ResponseEntity<?> scanImaging(
            @PathVariable String patientId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") String type,
            @RequestParam("doctorName") String doctorName) {
        
        try {
            // 1. Process and analyze with AI
            String analysisResult = aiService.analyzeClinicalImage(file, type);

            // 2. Persist lossless reference using FileStorageService
            String fileName = fileStorageService.storeFile(file);
            String imageUrl = "/api/imaging/raw/" + fileName;

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
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'MAIN_ADMIN', 'PATIENT')")
    public ResponseEntity<?> uploadDocument(
            @PathVariable String patientId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("uploadedBy") String uploadedBy) {
        
        try {
            String fileName = fileStorageService.storeFile(file);
            String fileUrl = "/api/imaging/raw/" + fileName;
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

    @GetMapping("/raw/{filename:.+}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'MAIN_ADMIN', 'PATIENT')")
    public ResponseEntity<Resource> getRawFile(@PathVariable String filename) {
        try {
            Path filePath = fileStorageService.getFilePath(filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                String contentType = "application/octet-stream";
                try {
                    contentType = java.nio.file.Files.probeContentType(filePath);
                } catch (java.io.IOException e) {
                    // fall back
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
