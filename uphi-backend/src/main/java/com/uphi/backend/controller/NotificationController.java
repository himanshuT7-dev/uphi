package com.uphi.backend.controller;

import com.uphi.backend.domain.Notification;
import com.uphi.backend.repository.NotificationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    public NotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<Notification> getMyNotifications(Authentication authentication) {
        String userId = authentication.getName();
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public long getUnreadCount(Authentication authentication) {
        String userId = authentication.getName();
        return notificationRepository.countByRecipientIdAndRead(userId, false);
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> markAsRead(@PathVariable String id) {
        return notificationRepository.findById(id).map(n -> {
            n.setRead(true);
            return ResponseEntity.ok(notificationRepository.save(n));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'ADMIN')")
    public Notification sendNotification(@RequestBody Notification notification) {
        notification.setCreatedAt(java.time.Instant.now());
        notification.setRead(false);
        return notificationRepository.save(notification);
    }

    @PostMapping("/mark-all-read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> markAllRead(Authentication authentication) {
        String userId = authentication.getName();
        List<Notification> unread = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
        return ResponseEntity.ok().build();
    }
}
