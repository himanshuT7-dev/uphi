package com.uphi.backend.repository;

import com.uphi.backend.domain.Patient;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface PatientRepository extends MongoRepository<Patient, String> {
    Optional<Patient> findByUserId(String userId);

    Optional<Patient> findByAbhaAddress(String abhaAddress);
    

    java.util.List<Patient> findByAffiliatedHospitalsContaining(String hospitalId);
    
    // Global lookup for ID scanning
    @org.springframework.data.mongodb.repository.Query("{ '$or': [ { '_id': ?0 }, { 'abhaAddress': ?0 }, { 'phone': ?0 } ] }")
    java.util.Optional<Patient> findFirstByIdOrAbhaAddressOrPhone(String identifier);
}
