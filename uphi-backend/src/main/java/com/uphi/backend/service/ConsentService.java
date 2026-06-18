package com.uphi.backend.service;

import com.uphi.backend.domain.Consent;
import com.uphi.backend.domain.Patient;
import com.uphi.backend.domain.User;
import com.uphi.backend.repository.ConsentRepository;
import com.uphi.backend.repository.PatientRepository;
import com.uphi.backend.repository.UserRepository;
import com.uphi.backend.repository.HospitalRepository;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class ConsentService {

    private final ConsentRepository consentRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;
    private final com.uphi.backend.repository.NotificationRepository notificationRepository;

    public ConsentService(ConsentRepository consentRepository, PatientRepository patientRepository,
            UserRepository userRepository, HospitalRepository hospitalRepository,
            com.uphi.backend.repository.NotificationRepository notificationRepository) {
        this.consentRepository = consentRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.hospitalRepository = hospitalRepository;
        this.notificationRepository = notificationRepository;
    }

    public List<Consent> getMyConsents(String username) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            Optional<Patient> patientOpt = patientRepository.findByUserId(userOpt.get().getId());
            if (patientOpt.isPresent()) {
                return consentRepository.findByPatientId(patientOpt.get().getId());
            }
        }
        return Collections.emptyList();
    }

    public List<Consent> getHospitalConsents(String username) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            String hid = userOpt.get().getHospitalId();
            if (hid != null) {
                return consentRepository.findByHospitalId(hid);
            }
            return consentRepository.findByHospitalId(userOpt.get().getId());
        }
        return Collections.emptyList();
    }

    public Consent createConsentRequest(Consent consent, String requesterUsername) {
        userRepository.findByUsername(requesterUsername).ifPresent(user -> {
            consent.setDoctorName(user.getUsername());
            if (user.getHospitalId() != null) {
                consent.setHospitalId(user.getHospitalId());
                hospitalRepository.findById(user.getHospitalId()).ifPresent(h -> {
                    consent.setHospitalName(h.getName());
                });
            } else {
                consent.setHospitalId(user.getId());
                consent.setHospitalName("Direct Authority");
            }
        });
        consent.setStatus("PENDING");
        consent.setUpdatedAt(java.time.Instant.now());

        // Debounce: If a PENDING request already exists for this patient/hospital, return it
        if (consent.getHospitalId() != null) {
            List<Consent> existing = consentRepository.findByPatientIdAndHospitalIdAndStatus(
                consent.getPatientId(), consent.getHospitalId(), "PENDING");
            if (!existing.isEmpty()) {
                return existing.get(0);
            }
        }

        Consent saved = consentRepository.save(consent);

        // Send Notification to Patient Mobile
        patientRepository.findById(consent.getPatientId()).ifPresent(patient -> {
            if (patient.getUserId() != null) {
                com.uphi.backend.domain.Notification notification = new com.uphi.backend.domain.Notification();
                notification.setRecipientId(patient.getUserId());
                notification.setTitle("Clinical Access Request");
                notification.setMessage("Hospital " + (consent.getHospitalName() != null ? consent.getHospitalName() : "External Facility") + " is requesting access to your records.");
                notification.setType("CONSENT_REQUEST");
                notification.setMetadata(saved.getId());
                notification.setCreatedAt(java.time.Instant.now());
                notification.setRead(false);
                notificationRepository.save(notification);
            }
        });

        return saved;
    }

    public Optional<Consent> updateConsentStatus(String consentId, String status, String username) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            Optional<Patient> patientOpt = patientRepository.findByUserId(userOpt.get().getId());
            if (patientOpt.isPresent()) {
                return consentRepository.findById(consentId).map(consent -> {
                    if (consent.getPatientId().equals(patientOpt.get().getId())) {
                        consent.setStatus(status);
                        consent.setUpdatedAt(java.time.Instant.now());
                        return consentRepository.save(consent);
                    }
                    throw new SecurityException("Unauthorized consent modification");
                });
            }
        }
        return Optional.empty();
    }

    public boolean hasApprovedConsent(String patientId, String hospitalId) {
        return consentRepository.findByPatientId(patientId).stream()
                .anyMatch(c -> "APPROVED".equalsIgnoreCase(c.getStatus()) && hospitalId.equals(c.getHospitalId()));
    }

    public Consent directGrantConsent(String patientId, String username) {
        // For the demo: immediately grant access
        Consent consent = new Consent();
        consent.setPatientId(patientId);
        userRepository.findByUsername(username).ifPresent(user -> {
            consent.setDoctorName(user.getUsername());
            if (user.getHospitalId() != null) {
                consent.setHospitalId(user.getHospitalId());
                hospitalRepository.findById(user.getHospitalId()).ifPresent(h -> {
                    consent.setHospitalName(h.getName());
                });
            } else {
                consent.setHospitalId(user.getId());
                consent.setHospitalName("Direct Authority");
            }
        });
        consent.setPurpose("DIRECT_GRANT_DEMO");
        consent.setDuration("PERMANENT");
        consent.setStatus("APPROVED");
        consent.setUpdatedAt(java.time.Instant.now());
        return consentRepository.save(consent);
    }
}
