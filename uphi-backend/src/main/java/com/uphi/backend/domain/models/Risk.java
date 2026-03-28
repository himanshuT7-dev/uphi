package com.uphi.backend.domain.models;

import java.util.List;

public class Risk {
    private String level; // LOW, MEDIUM, HIGH
    private List<String> factors;

    public Risk() {}

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public List<String> getFactors() {
        return factors;
    }

    public void setFactors(List<String> factors) {
        this.factors = factors;
    }
}
