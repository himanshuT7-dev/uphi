package com.uphi.backend.repository;

import com.uphi.backend.domain.Hospital;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HospitalRepository extends MongoRepository<Hospital, String> {
    Optional<Hospital> findByName(String name);
    Optional<Hospital> findByAbhaFacilityId(String abhaFacilityId);
}
