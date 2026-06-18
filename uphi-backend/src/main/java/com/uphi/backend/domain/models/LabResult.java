package com.uphi.backend.domain.models;

public class LabResult {
    private String test;
    private String value;
    private String ref;
    private String date;
    private String trend; // up, down, stable

    public LabResult() {}

    public LabResult(String test, String value, String ref, String date, String trend) {
        this.test = test;
        this.value = value;
        this.ref = ref;
        this.date = date;
        this.trend = trend;
    }

    public String getTest() { return test; }
    public void setTest(String test) { this.test = test; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
    public String getRef() { return ref; }
    public void setRef(String ref) { this.ref = ref; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getTrend() { return trend; }
    public void setTrend(String trend) { this.trend = trend; }
}
