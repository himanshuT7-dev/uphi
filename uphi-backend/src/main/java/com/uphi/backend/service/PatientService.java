package com.uphi.backend.service;

import com.uphi.backend.domain.Patient;
import com.uphi.backend.domain.User;
import com.uphi.backend.repository.PatientRepository;
import com.uphi.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    public PatientService(PatientRepository patientRepository, UserRepository userRepository) {
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
    }

    public Optional<Patient> getPatientByUsername(String username) {
        return userRepository.findByUsername(username)
                .flatMap(user -> patientRepository.findByUserId(user.getId()));
    }

    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    public Optional<Patient> getPatientById(String id) {
        return patientRepository.findById(id);
    }

    public Optional<Patient> getPatientByUserId(String userId) {
        return patientRepository.findByUserId(userId);
    }

    public Patient registerPatient(Patient patient) {
        if (patient.getAbhaAddress() != null && !patient.getAbhaAddress().isEmpty()) {
            Optional<Patient> existing = patientRepository.findByAbhaAddress(patient.getAbhaAddress());
            if (existing.isPresent()) {
                throw new IllegalArgumentException("ABHA Address already exists");
            }
        }
        return patientRepository.save(patient);
    }

    public Optional<Patient> updatePatient(String id, Patient updatedData) {
        return patientRepository.findById(id).map(existing -> {
            if (updatedData.getFullName() != null) existing.setFullName(updatedData.getFullName());
            if (updatedData.getAge() > 0) existing.setAge(updatedData.getAge());
            if (updatedData.getGender() != null) existing.setGender(updatedData.getGender());
            if (updatedData.getBloodGroup() != null) existing.setBloodGroup(updatedData.getBloodGroup());
            if (updatedData.getPhone() != null) existing.setPhone(updatedData.getPhone());
            if (updatedData.getEmail() != null) existing.setEmail(updatedData.getEmail());
            if (updatedData.getAllergies() != null) existing.setAllergies(updatedData.getAllergies());
            if (updatedData.getConditions() != null) existing.setConditions(updatedData.getConditions());
            if (updatedData.getMedications() != null) existing.setMedications(updatedData.getMedications());
            if (updatedData.getVitals() != null) existing.setVitals(updatedData.getVitals());
            if (updatedData.getContactInfo() != null) existing.setContactInfo(updatedData.getContactInfo());
            if (updatedData.getEmergencyContact() != null) existing.setEmergencyContact(updatedData.getEmergencyContact());
            if (updatedData.getRisk() != null) existing.setRisk(updatedData.getRisk());
            return patientRepository.save(existing);
        });
    }
}
