package com.uphi.backend.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.List;

@Document(collection = "consents")
public class Consent {

    @Id
    private String id;
    
    @org.springframework.data.mongodb.core.index.Indexed
    private String patientId; // Ref to Patient
    
    @org.springframework.data.mongodb.core.index.Indexed
    private String hospitalId; // Ref to User (HOSPITAL)

    private String hospitalName;
    private String doctorName;
    private String purpose;
    private String status; // PENDING, APPROVED, DENIED
    private String duration;
    private Instant expirationDate;
    private List<String> dataTypes; 
    private String metadata; // Stores requested document types for DOCUMENT_REQUEST consents

    private Instant createdAt;
    private Instant updatedAt;

    public Consent() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        this.status = "PENDING";
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

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public Instant getExpirationDate() {
        return expirationDate;
    }

    public void setExpirationDate(Instant expirationDate) {
        this.expirationDate = expirationDate;
    }

    public List<String> getDataTypes() {
        return dataTypes;
    }

    public void setDataTypes(List<String> dataTypes) {
        this.dataTypes = dataTypes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getMetadata() {
        return metadata;
    }

    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }
}
