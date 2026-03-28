package com.uphi.backend.domain.models;

import java.time.LocalDate;

public class Condition {
    private String name;
    private LocalDate diagnosedDate;
    private String status; // ACTIVE, RESOLVED, CHRONIC

    public Condition() {}

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDate getDiagnosedDate() {
        return diagnosedDate;
    }

    public void setDiagnosedDate(LocalDate diagnosedDate) {
        this.diagnosedDate = diagnosedDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
