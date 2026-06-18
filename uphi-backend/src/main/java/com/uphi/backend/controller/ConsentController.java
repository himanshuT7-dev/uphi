package com.uphi.backend.controller;

import com.uphi.backend.domain.Consent;
import com.uphi.backend.service.ConsentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/consents")
public class ConsentController {

    private final ConsentService consentService;

    public ConsentController(ConsentService consentService) {
        this.consentService = consentService;
    }

    @GetMapping("/patient")
    public ResponseEntity<List<Consent>> getMyConsents(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(consentService.getMyConsents(authentication.getName()));
    }

    @GetMapping("/hospital")
    public ResponseEntity<List<Consent>> getHospitalConsents(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(consentService.getHospitalConsents(authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<Consent> requestConsent(@RequestBody Consent consent, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(consentService.createConsentRequest(consent, authentication.getName()));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Consent> updateConsentStatus(@PathVariable String id, @RequestParam String status, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        try {
            return consentService.updateConsentStatus(id, status, authentication.getName())
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (SecurityException e) {
            return ResponseEntity.status(403).build();
        }
    }

    @PostMapping("/direct-grant/{patientId}")
    public ResponseEntity<Consent> directGrant(@PathVariable String patientId, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(consentService.directGrantConsent(patientId, authentication.getName()));
    }
}
