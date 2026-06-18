package com.uphi.backend.domain.models;

public class TimelineEvent {
    private String date;
    private String event;
    private String type; // admission, discharge, consult, lab
    private String facility;

    public TimelineEvent() {}

    public TimelineEvent(String date, String event, String type, String facility) {
        this.date = date;
        this.event = event;
        this.type = type;
        this.facility = facility;
    }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getEvent() { return event; }
    public void setEvent(String event) { this.event = event; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getFacility() { return facility; }
    public void setFacility(String facility) { this.facility = facility; }
}
