package com.uphi.backend.repository;

import com.uphi.backend.domain.Invoice;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface InvoiceRepository extends MongoRepository<Invoice, String> {
    List<Invoice> findByPatientId(String patientId);
    List<Invoice> findByStatus(String status);
    List<Invoice> findByHospitalId(String hospitalId);
    List<Invoice> findByPatientIdAndHospitalId(String patientId, String hospitalId);
}
