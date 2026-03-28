package com.uphi.backend.controller;

import com.uphi.backend.domain.Patient;
import com.uphi.backend.service.AiService;
import com.uphi.backend.service.PatientService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;
    private final PatientService patientService;

    public AiController(AiService aiService, PatientService patientService) {
        this.aiService = aiService;
        this.patientService = patientService;
    }

    @GetMapping("/summary/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'HOSPITAL', 'ADMIN', 'MAIN_ADMIN')")
    public ResponseEntity<?> getClinicalSummary(@PathVariable String patientId) {
        return patientService.getPatientById(patientId)
                .map(patient -> {
                    String summary = aiService.generateClinicalSummary(patient);
                    return ResponseEntity.ok(Map.of("summary", summary));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/risk/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'HOSPITAL', 'ADMIN', 'MAIN_ADMIN')")
    public ResponseEntity<?> getRiskAssessment(@PathVariable String patientId) {
        return patientService.getPatientById(patientId)
                .map(patient -> {
                    Map<String, Object> risk = aiService.assessPatientRisk(patient);
                    return ResponseEntity.ok(risk);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/drug-check")
    @PreAuthorize("hasAnyRole('DOCTOR', 'HOSPITAL', 'ADMIN', 'MAIN_ADMIN')")
    public ResponseEntity<?> checkDrugInteractions(@RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<String> currentMeds = (List<String>) request.get("currentMeds");
        String proposedMed = (String) request.get("proposedMed");
        String result = aiService.checkDrugInteractions(currentMeds, proposedMed);
        return ResponseEntity.ok(Map.of("result", result));
    }

    @PostMapping("/triage")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'HOSPITAL', 'ADMIN', 'MAIN_ADMIN')")
    public ResponseEntity<?> triagePatient(@RequestBody Map<String, Object> request) {
        String symptoms = (String) request.get("symptoms");
        int age = (int) request.get("age");
        String gender = (String) request.get("gender");
        Map<String, Object> result = aiService.triagePatient(symptoms, age, gender);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/discharge/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'HOSPITAL', 'MAIN_ADMIN')")
    public ResponseEntity<?> generateDischargeSummary(@PathVariable String patientId, @RequestBody Map<String, String> request) {
        return patientService.getPatientById(patientId)
                .map(patient -> {
                    String summary = aiService.generateDischargeSummary(patient, request.get("diagnosis"), request.get("treatmentNotes"));
                    return ResponseEntity.ok(Map.of("summary", summary));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/alerts/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'HOSPITAL', 'ADMIN', 'MAIN_ADMIN')")
    public ResponseEntity<?> getPredictiveAlerts(@PathVariable String patientId) {
        return patientService.getPatientById(patientId)
                .map(patient -> {
                    String alerts = aiService.predictiveHealthAlerts(patient);
                    return ResponseEntity.ok(Map.of("alerts", alerts));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/search")
    @PreAuthorize("hasAnyRole('DOCTOR', 'HOSPITAL', 'ADMIN', 'MAIN_ADMIN')")
    public ResponseEntity<?> naturalLanguageSearch(@RequestBody Map<String, String> request) {
        String query = request.get("query");
        List<Patient> allPatients = patientService.getAllPatients();

        List<Map<String, Object>> summaries = allPatients.stream().map(p -> {
            Map<String, Object> m = new HashMap<>();
            m.put("name", p.getFullName());
            m.put("age", p.getAge());
            m.put("conditions", p.getConditions() != null ?
                    p.getConditions().stream().map(c -> c.getName()).collect(Collectors.joining(", ")) : "none");
            m.put("medications", p.getMedications() != null ?
                    p.getMedications().stream().map(med -> med.getName()).collect(Collectors.joining(", ")) : "none");
            return m;
        }).collect(Collectors.toList());

        String result = aiService.naturalLanguageSearch(query, summaries);
        return ResponseEntity.ok(Map.of("result", result));
    }
}
