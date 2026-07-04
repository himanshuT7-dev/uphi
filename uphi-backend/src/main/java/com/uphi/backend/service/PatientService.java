package com.uphi.backend.service;

import com.uphi.backend.domain.Patient;
import com.uphi.backend.repository.PatientRepository;
import com.uphi.backend.repository.UserRepository;
import com.uphi.backend.repository.HospitalRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;

    public PatientService(PatientRepository patientRepository, UserRepository userRepository, HospitalRepository hospitalRepository) {
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.hospitalRepository = hospitalRepository;
    }

    public Optional<Patient> getPatientByUsername(String username) {
        return userRepository.findByUsername(username)
                .flatMap(user -> patientRepository.findByUserId(user.getId())
                        .map(this::resolveHospitalNames));
    }

    private Patient resolveHospitalNames(Patient patient) {
        if (patient.getAffiliatedHospitals() != null) {
            java.util.Map<String, String> nameMap = new java.util.HashMap<>();
            for (String hospitalId : patient.getAffiliatedHospitals()) {
                hospitalRepository.findById(hospitalId)
                        .ifPresent(h -> nameMap.put(hospitalId, h.getName()));
            }
            patient.setAffiliatedHospitalNames(nameMap);
        }
        return patient;
    }

    public List<Patient> getAllPatients(String requesterUsername) {
        if (requesterUsername == null) return List.of();
        
        return userRepository.findByUsername(requesterUsername)
                .map(user -> {
                    // MAIN_ADMIN and DOCTOR always see all patients
                    // (Doctors need full clinical visibility — access is controlled by consent, not listing)
                    if (user.getRole() == com.uphi.backend.domain.Role.MAIN_ADMIN
                            || user.getRole() == com.uphi.backend.domain.Role.DOCTOR) {
                        return patientRepository.findAll();
                    }
                    // Staff with a hospitalId sees their hospital's affiliated patients
                    if (user.getHospitalId() != null && !user.getHospitalId().isEmpty()) {
                        return patientRepository.findByAffiliatedHospitalsContaining(user.getHospitalId());
                    }
                    // Standalone RECEPTIONIST without hospitalId — show all patients
                    if (user.getRole() == com.uphi.backend.domain.Role.RECEPTIONIST) {
                        return patientRepository.findAll();
                    }
                    return (List<Patient>) new java.util.ArrayList<Patient>();
                })
                .orElse(new java.util.ArrayList<>());
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
        if (patient.getEmail() != null && !patient.getEmail().trim().isEmpty()) {
            if (userRepository.findByEmail(patient.getEmail().trim().toLowerCase()).isPresent()) {
                throw new IllegalArgumentException("Email already registered");
            }
        }
        if (patient.getPhone() != null && !patient.getPhone().trim().isEmpty()) {
            if (userRepository.findByMobile(patient.getPhone().trim()).isPresent()) {
                throw new IllegalArgumentException("Phone number already registered");
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
            if (updatedData.getRiskScores() != null) existing.setRiskScores(updatedData.getRiskScores());
            if (updatedData.getDob() != null) existing.setDob(updatedData.getDob());
            if (updatedData.getLabResults() != null) existing.setLabResults(updatedData.getLabResults());
            if (updatedData.getTimeline() != null) existing.setTimeline(updatedData.getTimeline());
            if (updatedData.getImagingRecords() != null) existing.setImagingRecords(updatedData.getImagingRecords());
            if (updatedData.getMedicalDocuments() != null) existing.setMedicalDocuments(updatedData.getMedicalDocuments());
            return patientRepository.save(existing);
        });
    }
}
