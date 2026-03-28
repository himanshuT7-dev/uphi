package com.uphi.backend.repository;

import com.uphi.backend.domain.Prescription;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface PrescriptionRepository extends MongoRepository<Prescription, String> {
    List<Prescription> findByPatientId(String patientId);
    List<Prescription> findByDoctorId(String doctorId);
    
    List<Prescription> findByHospitalId(String hospitalId);
    List<Prescription> findByPatientIdAndHospitalId(String patientId, String hospitalId);
}
