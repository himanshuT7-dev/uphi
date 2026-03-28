package com.uphi.backend.repository;

import com.uphi.backend.domain.Appointment;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface AppointmentRepository extends MongoRepository<Appointment, String> {
    List<Appointment> findByPatientId(String patientId);
    List<Appointment> findByDoctorId(String doctorId);
    List<Appointment> findByDate(String date);
    List<Appointment> findByDepartment(String department);
    List<Appointment> findByStatus(String status);
    List<Appointment> findByHospitalId(String hospitalId);
    List<Appointment> findByPatientIdAndHospitalId(String patientId, String hospitalId);
}
