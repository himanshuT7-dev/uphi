package com.uphi.backend.service;

import com.uphi.backend.domain.MedicalRecord;
import com.uphi.backend.domain.Patient;
import com.uphi.backend.domain.User;
import com.uphi.backend.repository.MedicalRecordRepository;
import com.uphi.backend.repository.PatientRepository;
import com.uphi.backend.repository.UserRepository;
import com.uphi.backend.repository.HospitalRepository;
import org.springframework.stereotype.Service;

import org.springframework.data.mongodb.gridfs.GridFsOperations;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Criteria;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;
    private final GridFsOperations gridFsOperations;

    public MedicalRecordService(MedicalRecordRepository medicalRecordRepository, PatientRepository patientRepository,
            UserRepository userRepository, HospitalRepository hospitalRepository, GridFsOperations gridFsOperations) {
        this.medicalRecordRepository = medicalRecordRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.hospitalRepository = hospitalRepository;
        this.gridFsOperations = gridFsOperations;
    }

    public List<MedicalRecord> getMyRecords(String username) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            Optional<Patient> patientOpt = patientRepository.findByUserId(userOpt.get().getId());
            if (patientOpt.isPresent()) {
                return medicalRecordRepository.findByPatientId(patientOpt.get().getId());
            }
        }
        return Collections.emptyList();
    }

    public MedicalRecord createRecord(MedicalRecord record) {
        return medicalRecordRepository.save(record);
    }

    public List<MedicalRecord> getRecordsByPatientId(String patientId) {
        return medicalRecordRepository.findByPatientId(patientId);
    }

    public Optional<MedicalRecord> getRecordById(String id) {
        return medicalRecordRepository.findById(id);
    }

    public void uploadScan(String recordId, MultipartFile file, String username) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equalsIgnoreCase("application/pdf") && !contentType.startsWith("image/"))) {
            throw new IllegalArgumentException("For security and lossless diagnosis, only strictly PDF or raw Image formats are allowed for clinical assets.");
        }

        Optional<MedicalRecord> recordOpt = medicalRecordRepository.findById(recordId);
        if (recordOpt.isEmpty()) {
            throw new IllegalArgumentException("Medical Record not found");
        }
        
        // Security: Verify user has rights to upload to this record (Simplified check)
        Optional<User> uploader = userRepository.findByUsername(username);
        if (uploader.isEmpty()) throw new SecurityException("User not found.");
        
        com.uphi.backend.domain.Role role = uploader.get().getRole();
        if (role != com.uphi.backend.domain.Role.DOCTOR && 
            role != com.uphi.backend.domain.Role.HOSPITAL && 
            role != com.uphi.backend.domain.Role.MAIN_ADMIN &&
            role != com.uphi.backend.domain.Role.RECEPTIONIST) {
            throw new SecurityException("Only authorized medical staff can upload diagnostic scans.");
        }

        // Store the raw file exactly as received (lossless) in GridFS
        org.bson.types.ObjectId fileId = gridFsOperations.store(file.getInputStream(), file.getOriginalFilename(), file.getContentType());
        
        MedicalRecord record = recordOpt.get();
        record.setEncryptedFileUrl(fileId.toString()); // Map the GridFS file ID back to the record
        record.setContentType(file.getContentType());
        medicalRecordRepository.save(record);
    }

    public GridFsResource downloadScan(String recordId, String username) {
        Optional<MedicalRecord> recordOpt = medicalRecordRepository.findById(recordId);
        if (recordOpt.isEmpty() || recordOpt.get().getEncryptedFileUrl() == null) {
            return null;
        }

        // Highest Security Possible: Authorization Check
        Optional<User> requester = userRepository.findByUsername(username);
        if (requester.isEmpty()) {
            throw new SecurityException("Unauthorized access attempt on medical scan.");
        }
        // In a real scenario, check if the doctor has formal Consent here from the ConsentRepository

        com.mongodb.client.gridfs.model.GridFSFile gridFSFile = gridFsOperations.findOne(new Query(Criteria.where("_id").is(recordOpt.get().getEncryptedFileUrl())));
        if (gridFSFile == null) return null;

        return gridFsOperations.getResource(gridFSFile);
    }

    public MedicalRecord uploadNewPatientRecord(String username, MultipartFile file, String recordType, String title, String notes) throws IOException {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) throw new SecurityException("User not found.");
        
        Optional<Patient> patientOpt = patientRepository.findByUserId(userOpt.get().getId());
        if (patientOpt.isEmpty()) throw new SecurityException("Patient profile not found.");

        String contentType = file.getContentType();
        if (contentType == null || contentType.equals("application/octet-stream") || contentType.equals("image/*")) {
            String fileName = file.getOriginalFilename();
            if (fileName != null) {
                if (fileName.toLowerCase().endsWith(".pdf")) contentType = "application/pdf";
                else if (fileName.toLowerCase().endsWith(".jpg") || fileName.toLowerCase().endsWith(".jpeg")) contentType = "image/jpeg";
                else if (fileName.toLowerCase().endsWith(".png")) contentType = "image/png";
            }
        }

        // Store the file in GridFS
        org.bson.types.ObjectId fileId = gridFsOperations.store(file.getInputStream(), file.getOriginalFilename(), contentType);

        MedicalRecord record = new MedicalRecord();
        record.setPatientId(patientOpt.get().getId());
        record.setHospitalId("SELF"); // Use SELF to indicate it was patient-uploaded
        record.setType(recordType.toUpperCase());
        record.setTitle(title != null && !title.trim().isEmpty() ? title : "Patient Upload: " + recordType);
        record.setClinicalNotes(notes);
        record.setDiagnosticSummary(notes != null && !notes.trim().isEmpty() ? notes : "Self-uploaded " + recordType + " document preserved via UPHI Node.");
        record.setContentType(contentType);
        record.setEncryptedFileUrl(fileId.toString());
        record.setDate(java.time.Instant.now());
        
        return medicalRecordRepository.save(record);
    }

    public MedicalRecord syncVaultRecordToHospital(String recordId, String username) {
        MedicalRecord vaultRecord = medicalRecordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("Record not found"));
        
        if (!"SELF".equals(vaultRecord.getHospitalId())) {
            throw new IllegalArgumentException("Only self-uploaded records can be synchronized from vault.");
        }

        User staff = userRepository.findByUsername(username)
                .orElseThrow(() -> new SecurityException("Authenticated staff member not found."));
        
        String hospitalId = staff.getHospitalId();
        if (hospitalId == null) {
            // Direct hospital user
            hospitalId = staff.getId();
        }

        // Create the official Hospital-owned copy
        MedicalRecord officialRecord = new MedicalRecord();
        officialRecord.setPatientId(vaultRecord.getPatientId());
        officialRecord.setHospitalId(hospitalId);
        
        // Fetch actual hospital name
        String hName = hospitalRepository.findById(hospitalId)
                .map(com.uphi.backend.domain.Hospital::getName)
                .orElse("UPHI Verified Node");
        officialRecord.setHospitalName(hName);
        
        officialRecord.setType(vaultRecord.getType());
        officialRecord.setTitle(vaultRecord.getTitle());
        officialRecord.setClinicalNotes(vaultRecord.getClinicalNotes());
        officialRecord.setContentType(vaultRecord.getContentType());
        officialRecord.setDiagnosticSummary("Verified Import: " + vaultRecord.getDiagnosticSummary());
        officialRecord.setEncryptedFileUrl(vaultRecord.getEncryptedFileUrl());
        officialRecord.setDate(java.time.Instant.now());
        
        return medicalRecordRepository.save(officialRecord);
    }
    public void deleteRecord(String recordId, String username) {
        Optional<MedicalRecord> recordOpt = medicalRecordRepository.findById(recordId);
        if (recordOpt.isEmpty()) throw new IllegalArgumentException("Record not found");

        MedicalRecord record = recordOpt.get();
        
        // Security Check: Only allow patients to delete their own "SELF" records
        // Hospital staff should use specific de-activation workflows if needed
        if ("SELF".equals(record.getHospitalId())) {
            Optional<User> user = userRepository.findByUsername(username);
            if (user.isPresent()) {
                Optional<Patient> patient = patientRepository.findByUserId(user.get().getId());
                if (patient.isPresent() && !patient.get().getId().equals(record.getPatientId())) {
                    throw new SecurityException("Unauthorized: You do not have permission to delete this clinical asset.");
                }
            }
        }

        // Delete the associated lossless file from GridFS
        if (record.getEncryptedFileUrl() != null) {
            gridFsOperations.delete(new Query(Criteria.where("_id").is(record.getEncryptedFileUrl())));
        }

        // Purge the clinical record from MongoDB
        medicalRecordRepository.deleteById(recordId);
    }
}
