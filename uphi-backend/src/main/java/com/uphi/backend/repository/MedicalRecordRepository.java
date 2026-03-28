package com.uphi.backend.repository;

import com.uphi.backend.domain.MedicalRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface MedicalRecordRepository extends MongoRepository<MedicalRecord, String> {
    List<MedicalRecord> findByPatientId(String patientId);

    List<MedicalRecord> findByHospitalId(String hospitalId);
}
