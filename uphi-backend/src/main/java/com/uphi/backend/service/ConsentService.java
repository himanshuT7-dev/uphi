package com.uphi.backend.service;

import com.uphi.backend.domain.Consent;
import com.uphi.backend.domain.Patient;
import com.uphi.backend.domain.User;
import com.uphi.backend.repository.ConsentRepository;
import com.uphi.backend.repository.PatientRepository;
import com.uphi.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class ConsentService {

    private final ConsentRepository consentRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    public ConsentService(ConsentRepository consentRepository, PatientRepository patientRepository,
            UserRepository userRepository) {
        this.consentRepository = consentRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
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
            return consentRepository.findByHospitalId(userOpt.get().getId());
        }
        return Collections.emptyList();
    }

    public Consent createConsentRequest(Consent consent) {
        consent.setStatus("PENDING");
        return consentRepository.save(consent);
    }

    public Optional<Consent> updateConsentStatus(String consentId, String status, String username) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            Optional<Patient> patientOpt = patientRepository.findByUserId(userOpt.get().getId());
            if (patientOpt.isPresent()) {
                return consentRepository.findById(consentId).map(consent -> {
                    if (consent.getPatientId().equals(patientOpt.get().getId())) {
                        consent.setStatus(status);
                        return consentRepository.save(consent);
                    }
                    throw new SecurityException("Unauthorized consent modification");
                });
            }
        }
        return Optional.empty();
    }
}
