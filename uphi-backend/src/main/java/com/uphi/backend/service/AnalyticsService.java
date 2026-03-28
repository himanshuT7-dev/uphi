package com.uphi.backend.service;

import com.uphi.backend.domain.Appointment;
import com.uphi.backend.repository.AppointmentRepository;
import com.uphi.backend.repository.PatientRepository;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;

    public AnalyticsService(AppointmentRepository appointmentRepository, PatientRepository patientRepository) {
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
    }

    public Map<String, Object> getHospitalSummary(String hospitalId) {
        List<Appointment> appointments = appointmentRepository.findByHospitalId(hospitalId);
        long patientCount = patientRepository.findAll().stream()
                .filter(p -> p.getAffiliatedHospitals().contains(hospitalId))
                .count();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalPatients", patientCount);
        summary.put("totalAppointments", appointments.size());
        
        // Weekly Check-ins (Current Week)
        LocalDate today = LocalDate.now();
        LocalDate startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        
        Map<String, Long> weeklyCheckins = new LinkedHashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        
        for (int i = 0; i < 7; i++) {
            LocalDate date = startOfWeek.plusDays(i);
            String dateStr = date.format(formatter);
            String dayLabel = date.getDayOfWeek().name().substring(0, 3);
            long count = appointments.stream()
                    .filter(a -> dateStr.equals(a.getDate()))
                    .count();
            weeklyCheckins.put(dayLabel, count);
        }
        summary.put("weeklyCheckins", weeklyCheckins);

        // Department Distribution
        Map<String, Long> deptDist = appointments.stream()
                .collect(Collectors.groupingBy(Appointment::getDepartment, Collectors.counting()));
        summary.put("departmentDistribution", deptDist);

        // Mock placeholders for complex metrics (to be implemented later)
        summary.put("medErrorsPrevented", 12 + (new Random().nextInt(5)));
        summary.put("aiAccuracy", 94.5 + (new Random().nextDouble() * 2));
        summary.put("duplicateTestsAvoided", 45 + (new Random().nextInt(10)));

        return summary;
    }
}
