package com.uphi.backend.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "medical_records")
public class MedicalRecord {

    @Id
    private String id;

    @org.springframework.data.mongodb.core.index.Indexed
    private String patientId; // Reference to Patient collection
    
    @org.springframework.data.mongodb.core.index.Indexed
    private String hospitalId; // Reference to User collection (Role = HOSPITAL)

    private String hospitalName;
    private String type; // e.g. XRAY, ECG, LAB, PRESCRIPTION
    private Instant date;

    private String encryptedFileUrl;
    private String contentType;
    private String title;
    private String clinicalNotes;
    private String diagnosticSummary;

    public MedicalRecord() {
        this.date = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }
    
    public String getHospitalId() {
        return hospitalId;
    }

    public void setHospitalId(String hospitalId) {
        this.hospitalId = hospitalId;
    }

    public String getHospitalName() {
        return hospitalName;
    }

    public void setHospitalName(String hospitalName) {
        this.hospitalName = hospitalName;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Instant getDate() {
        return date;
    }

    public void setDate(Instant date) {
        this.date = date;
    }

    public String getEncryptedFileUrl() {
        return encryptedFileUrl;
    }

    public void setEncryptedFileUrl(String encryptedFileUrl) {
        this.encryptedFileUrl = encryptedFileUrl;
    }

    public String getDiagnosticSummary() {
        return diagnosticSummary;
    }

    public void setDiagnosticSummary(String diagnosticSummary) {
        this.diagnosticSummary = diagnosticSummary;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getClinicalNotes() {
        return clinicalNotes;
    }

    public void setClinicalNotes(String clinicalNotes) {
        this.clinicalNotes = clinicalNotes;
    }
}
