package com.uphi.backend.domain.models;

import java.time.Instant;

public class MedicalDocument {
    private String title;
    private String type; // PDF, IMAGE, REPORT
    private String fileUrl;
    private String uploadedBy;
    private Instant date;

    public MedicalDocument() {
        this.date = Instant.now();
    }

    public MedicalDocument(String title, String type, String fileUrl, String uploadedBy) {
        this.title = title;
        this.type = type;
        this.fileUrl = fileUrl;
        this.uploadedBy = uploadedBy;
        this.date = Instant.now();
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public String getUploadedBy() {
        return uploadedBy;
    }

    public void setUploadedBy(String uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public Instant getDate() {
        return date;
    }

    public void setDate(Instant date) {
        this.date = date;
    }
}
