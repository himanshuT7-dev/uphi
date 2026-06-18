package com.uphi.backend.controller;

import com.uphi.backend.domain.StaffMessage;
import com.uphi.backend.repository.StaffMessageRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/staff-messages")
@PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'ADMIN')")
public class StaffMessageController {

    private final StaffMessageRepository staffMessageRepository;

    public StaffMessageController(StaffMessageRepository staffMessageRepository) {
        this.staffMessageRepository = staffMessageRepository;
    }

    @GetMapping
    public List<StaffMessage> getMessages() {
        return staffMessageRepository.findByOrderByCreatedAtDesc();
    }

    @GetMapping("/active-staff")
    public List<java.util.Map<String, String>> getActiveStaff() {
        // Mock list of active staff for the demo
        return List.of(
            java.util.Map.of("username", "receptionist_apollo", "role", "RECEPTIONIST"),
            java.util.Map.of("username", "doctor_mehta", "role", "DOCTOR"),
            java.util.Map.of("username", "doctor_sarah", "role", "DOCTOR"),
            java.util.Map.of("username", "uphi_admin", "role", "ADMIN")
        );
    }

    @PostMapping
    public StaffMessage sendMessage(@RequestBody StaffMessage message) {
        message.setCreatedAt(java.time.Instant.now());
        return staffMessageRepository.save(message);
    }
}
