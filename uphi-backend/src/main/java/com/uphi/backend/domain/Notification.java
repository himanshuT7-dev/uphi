package com.uphi.backend.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    private String recipientId; // User ID or Patient ID
    private String title;
    private String message;
    private String type; // APPOINTMENT, RISK, RECORD, BILLING, UPLOAD_REQUEST
    private String metadata; // Actionable metadata (e.g. "RADIOLOGY")
    private boolean read = false;
    private Instant createdAt = Instant.now();

    public Notification() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getRecipientId() { return recipientId; }
    public void setRecipientId(String recipientId) { this.recipientId = recipientId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }
    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
