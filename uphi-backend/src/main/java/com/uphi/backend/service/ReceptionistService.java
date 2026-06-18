package com.uphi.backend.service;

import com.uphi.backend.domain.Role;
import com.uphi.backend.domain.User;
import com.uphi.backend.domain.Patient;
import com.uphi.backend.domain.models.Condition;
import com.uphi.backend.domain.models.RelatedPerson;
import com.uphi.backend.repository.UserRepository;
import com.uphi.backend.repository.PatientRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;


@Service
public class ReceptionistService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final OtpService otpService;
    private final PasswordEncoder passwordEncoder;

    public ReceptionistService(UserRepository userRepository, PatientRepository patientRepository, OtpService otpService, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.otpService = otpService;
        this.passwordEncoder = passwordEncoder;
    }

    private User verifyReceptionistOrAdmin(String requesterUsername) {
        if ("SELF".equals(requesterUsername)) return null; // Allow self-registration
        
        User requester = userRepository.findByUsername(requesterUsername)
                .orElseThrow(() -> new SecurityException("Requester not found."));

        if (requester.getRole() != Role.RECEPTIONIST && requester.getRole() != Role.ADMIN && requester.getRole() != Role.MAIN_ADMIN) {
            throw new SecurityException("Insufficient privileges. Only Receptionists or Admins can manage Patients.");
        }
        return requester;
    }

    public String requestPatientOtp(String targetEmail) {
        return otpService.generateAndSendOtp(targetEmail);
    }
 
    public String requestPatientSmsOtp(String phone) {
        return otpService.generateAndSendSmsOtp(phone);
    }
 
    public boolean validateOtpOnly(String identity, String otp) {
        return otpService.validateOtp(identity, otp, false);
    }


    public Patient registerPatient(String requesterUsername, String email, String phone, String otp, String fullName, String dob, String gender, String bloodGroup, String address, String aadhaar, String abha, List<Condition> oldDiagnosis) {
        User requester = null;
        if (!"SELF".equals(requesterUsername)) {
             requester = verifyReceptionistOrAdmin(requesterUsername);
        }

        // Verify the Email-based OTP manually
        if (!otpService.verifyOtp(email, otp)) {
            throw new IllegalArgumentException("Invalid or expired OTP code.");
        }

        java.util.Optional<User> existingUserOpt = userRepository.findByEmail(email);
        java.util.Optional<Patient> existingPatientOpt = (abha != null && !abha.isEmpty()) ? patientRepository.findByAbhaAddress(abha) : java.util.Optional.empty();

        if (existingUserOpt.isPresent() || existingPatientOpt.isPresent()) {
            Patient existingPatient = existingPatientOpt.orElseGet(() -> patientRepository.findByUserId(existingUserOpt.get().getId()).orElseThrow());
            existingPatient.setFullName(fullName);
            existingPatient.setPhone(phone);
            existingPatient.setDob(dob);
            existingPatient.setGender(gender);
            existingPatient.setBloodGroup(bloodGroup);
            if (oldDiagnosis != null && !oldDiagnosis.isEmpty()) {
                existingPatient.setConditions(oldDiagnosis);
            }
            if (existingPatient.getAffiliatedHospitals() == null) {
                existingPatient.setAffiliatedHospitals(new java.util.HashSet<>());
            }
            if (requester != null && requester.getHospitalId() != null) {
                existingPatient.getAffiliatedHospitals().add(requester.getHospitalId());
            }
            return patientRepository.save(existingPatient);
        }

        String generatedAbha = (abha != null && !abha.isEmpty()) ? abha : "ABHA-" + System.currentTimeMillis();

        User newUser = new User();
        newUser.setUsername(generatedAbha);
        newUser.setEmail(email);
        newUser.setPasswordHash(passwordEncoder.encode("PatientSecure@" + email.split("@")[0])); // Default secure pass

        newUser.setRole(Role.PATIENT);
        newUser.setMobile(phone); // Save phone for universal login
        newUser.setCreatedAt(java.time.Instant.now());
        User savedUser = userRepository.save(newUser);

        Patient patient = new Patient();
        patient.setUserId(savedUser.getId());
        patient.setAbhaAddress(generatedAbha);
        patient.setFullName(fullName);
        patient.setEmail(email);
        patient.setPhone(phone);
        patient.setDob(dob);
        patient.setGender(gender);
        patient.setBloodGroup(bloodGroup);
        patient.setAadhaar(aadhaar);
        patient.setConditions(oldDiagnosis != null ? oldDiagnosis : List.of());
        // Address could be stored in ContactInfo if we expand the model, storing mock for now or mapping it:
        // We will store it in the email field temporarily as address isn't in base Patient.java yet, or just skip.
        
        // Multi-Tenancy Patient Siphoning
        if (patient.getAffiliatedHospitals() == null) {
            patient.setAffiliatedHospitals(new java.util.HashSet<>());
        }
        if (requester != null && requester.getHospitalId() != null) {
             patient.getAffiliatedHospitals().add(requester.getHospitalId());
        }

        return patientRepository.save(patient);
    }

    public void removePatient(String requesterUsername, String patientId) {
        verifyReceptionistOrAdmin(requesterUsername);
        
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found."));
                
        patientRepository.delete(patient);
        userRepository.deleteById(patient.getUserId());
    }

    public Patient getPatientById(String id) {
        return patientRepository.findById(id)
                .or(() -> patientRepository.findByAbhaAddress(id))
                .orElseThrow(() -> new IllegalArgumentException("Patient not found with ID or ABHA: " + id));
    }

    public Patient updatePatient(Patient patient) {
        return patientRepository.save(patient);
    }

    public List<Patient> getAllPatients(String requesterUsername) {
        User requester = userRepository.findByUsername(requesterUsername)
            .orElseThrow(() -> new SecurityException("User not found"));
            
        if (requester.getRole() == Role.MAIN_ADMIN) {
            return patientRepository.findAll();
        } else if (requester.getHospitalId() != null) {
            return patientRepository.findByAffiliatedHospitalsContaining(requester.getHospitalId());
        } else {
            return List.of(); // User has no hospital ID, cannot see patients
        }
    }

    public void addRelatedPerson(String patientId, RelatedPerson relative, String otp) {
        // Verification step
        if (!otpService.verifyOtp(relative.getEmail(), otp)) {
            throw new IllegalArgumentException("Invalid or expired Security OTP for relative.");
        }

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Primary patient record not found."));

        relative.setVerified(true);
        patient.getRelatedPersons().add(relative);
        patientRepository.save(patient);
    }
}

