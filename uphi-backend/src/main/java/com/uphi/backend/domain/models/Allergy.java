package com.uphi.backend.domain.models;

public class Allergy {
    private String name;
    private String severity; // LOW, MODERATE, HIGH, SEVERE

    public Allergy() {}

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }
}
