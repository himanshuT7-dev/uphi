package com.uphi.backend.controller;

import com.uphi.backend.domain.Appointment;
import com.uphi.backend.domain.Prescription;
import com.uphi.backend.repository.AppointmentRepository;
import com.uphi.backend.repository.PrescriptionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class SchedulingController {

    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;

    public SchedulingController(AppointmentRepository appointmentRepository, PrescriptionRepository prescriptionRepository) {
        this.appointmentRepository = appointmentRepository;
        this.prescriptionRepository = prescriptionRepository;
    }

    // --- Appointments ---
    @GetMapping("/appointments")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'HOSPITAL', 'ADMIN', 'MAIN_ADMIN')")
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    @GetMapping("/appointments/date/{date}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'HOSPITAL', 'ADMIN', 'MAIN_ADMIN')")
    public List<Appointment> getByDate(@PathVariable String date) {
        return appointmentRepository.findByDate(date);
    }

    @GetMapping("/appointments/patient/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'HOSPITAL', 'ADMIN', 'MAIN_ADMIN')")
    public List<Appointment> getByPatient(@PathVariable String patientId) {
        return appointmentRepository.findByPatientId(patientId);
    }

    @PostMapping("/appointments")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'HOSPITAL', 'ADMIN', 'MAIN_ADMIN')")
    public Appointment createAppointment(@RequestBody Appointment appointment) {
        return appointmentRepository.save(appointment);
    }

    @PutMapping("/appointments/{id}/status")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'HOSPITAL', 'ADMIN', 'MAIN_ADMIN')")
    public ResponseEntity<?> updateStatus(@PathVariable String id, @RequestBody java.util.Map<String, String> body) {
        return appointmentRepository.findById(id).map(apt -> {
            apt.setStatus(body.get("status"));
            return ResponseEntity.ok(appointmentRepository.save(apt));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/appointments/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'HOSPITAL', 'ADMIN', 'MAIN_ADMIN')")
    public ResponseEntity<?> deleteAppointment(@PathVariable String id) {
        appointmentRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // --- Prescriptions ---
    @GetMapping("/prescriptions/patient/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'HOSPITAL', 'ADMIN', 'MAIN_ADMIN')")
    public List<Prescription> getPatientPrescriptions(@PathVariable String patientId) {
        return prescriptionRepository.findByPatientId(patientId);
    }

    @PostMapping("/prescriptions")
    @PreAuthorize("hasAnyRole('DOCTOR', 'HOSPITAL')")
    public Prescription createPrescription(@RequestBody Prescription prescription) {
        return prescriptionRepository.save(prescription);
    }

    @GetMapping("/prescriptions")
    @PreAuthorize("hasAnyRole('DOCTOR', 'HOSPITAL', 'ADMIN', 'MAIN_ADMIN')")
    public List<Prescription> getAllPrescriptions() {
        return prescriptionRepository.findAll();
    }
}
