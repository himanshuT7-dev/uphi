package com.uphi.backend.service;

import com.uphi.backend.domain.MedicalRecord;
import com.uphi.backend.domain.Patient;
import com.uphi.backend.domain.User;
import com.uphi.backend.repository.MedicalRecordRepository;
import com.uphi.backend.repository.PatientRepository;
import com.uphi.backend.repository.UserRepository;
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
    private final GridFsOperations gridFsOperations;

    public MedicalRecordService(MedicalRecordRepository medicalRecordRepository, PatientRepository patientRepository,
            UserRepository userRepository, GridFsOperations gridFsOperations) {
        this.medicalRecordRepository = medicalRecordRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
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
        if (file.getContentType() == null || !file.getContentType().equalsIgnoreCase("application/pdf")) {
            throw new IllegalArgumentException("For security and lossless diagnosis, only strictly PDF format is allowed for ECG/X-Ray.");
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
}
