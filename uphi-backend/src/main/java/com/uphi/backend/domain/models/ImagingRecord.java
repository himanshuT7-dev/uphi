package com.uphi.backend.domain.models;

import java.time.Instant;

public class ImagingRecord {
    private String type; // X-RAY, ECG, CT, MRI
    private String imageUrl;
    private String analysis;
    private String doctorName;
    private Instant date;

    public ImagingRecord() {
        this.date = Instant.now();
    }

    public ImagingRecord(String type, String imageUrl, String analysis, String doctorName) {
        this.type = type;
        this.imageUrl = imageUrl;
        this.analysis = analysis;
        this.doctorName = doctorName;
        this.date = Instant.now();
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getAnalysis() {
        return analysis;
    }

    public void setAnalysis(String analysis) {
        this.analysis = analysis;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public Instant getDate() {
        return date;
    }

    public void setDate(Instant date) {
        this.date = date;
    }
}
