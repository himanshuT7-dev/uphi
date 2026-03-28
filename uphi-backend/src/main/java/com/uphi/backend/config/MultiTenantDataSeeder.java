package com.uphi.backend.config;

import com.uphi.backend.domain.*;
import com.uphi.backend.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class MultiTenantDataSeeder {

    private static final Logger logger = LoggerFactory.getLogger(MultiTenantDataSeeder.class);

    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final ConsentRepository consentRepository;
    private final InvoiceRepository invoiceRepository;
    private final AuditLogRepository auditLogRepository;
    private final InventoryRepository inventoryRepository; // Added InventoryRepository

    public MultiTenantDataSeeder(
            HospitalRepository hospitalRepository,
            UserRepository userRepository,
            PatientRepository patientRepository,
            MedicalRecordRepository medicalRecordRepository,
            PrescriptionRepository prescriptionRepository,
            AppointmentRepository appointmentRepository,
            ConsentRepository consentRepository,
            InvoiceRepository invoiceRepository,
            AuditLogRepository auditLogRepository,
            InventoryRepository inventoryRepository) { // Added InventoryRepository to constructor
        this.hospitalRepository = hospitalRepository;
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.appointmentRepository = appointmentRepository;
        this.consentRepository = consentRepository;
        this.invoiceRepository = invoiceRepository;
        this.auditLogRepository = auditLogRepository;
        this.inventoryRepository = inventoryRepository; // Initialized InventoryRepository
    }

    @EventListener(ApplicationReadyEvent.class)
    public void migrateLegacyData() {
        logger.info("Initializing Multi-Tenant Migration Check...");

        // 1. Ensure a Default Legacy Hospital exists
        Hospital defaultHospital = hospitalRepository.findByName("UPHI Central Facility")
                .orElseGet(() -> {
                    Hospital h = new Hospital();
                    h.setName("UPHI Central Facility");
                    h.setAbhaFacilityId("IN-UPHI-CENTRAL");
                    h.setAddress("123 Health Ave, Primary Branch");
                    h.setContactPhone("1800-111-222");
                    h.setEmail("admin@uphi.health");
                    logger.info("Created legacy default hospital: {}", h.getName());
                    return hospitalRepository.save(h);
                });

        String legacyId = defaultHospital.getId();

        // 2. Migrate Users (excluding MAIN_ADMIN who are global)
        List<User> usersWithoutHospital = userRepository.findAll().stream()
                .filter(u -> u.getHospitalId() == null && u.getRole() != Role.MAIN_ADMIN)
                .toList();
        if (!usersWithoutHospital.isEmpty()) {
            usersWithoutHospital.forEach(u -> u.setHospitalId(legacyId));
            userRepository.saveAll(usersWithoutHospital);
            logger.info("Migrated {} users to legacy hospital.", usersWithoutHospital.size());
        }

        // 3. Migrate Patients
        List<Patient> allPatients = patientRepository.findAll();
        int migratedPatients = 0;
        for (Patient p : allPatients) {
            if (p.getAffiliatedHospitals() == null) {
                p.setAffiliatedHospitals(new HashSet<>());
            }
            if (p.getAffiliatedHospitals().isEmpty()) {
                p.getAffiliatedHospitals().add(legacyId);
                patientRepository.save(p);
                migratedPatients++;
            }
        }
        if (migratedPatients > 0) logger.info("Migrated {} patients to legacy hospital.", migratedPatients);

        // 4. Migrate Transactional Records (MedicalRecords, Prescriptions, Appointments, etc.)
        migrateCollection(medicalRecordRepository, "MedicalRecords", legacyId);
        migrateCollection(prescriptionRepository, "Prescriptions", legacyId);
        migrateCollection(appointmentRepository, "Appointments", legacyId);
        migrateCollection(consentRepository, "Consents", legacyId);
        migrateCollection(invoiceRepository, "Invoices", legacyId);
        migrateCollection(auditLogRepository, "AuditLogs", legacyId);

        // 5. Seed Initial Inventory if empty
        if (inventoryRepository.findByHospitalId(legacyId).isEmpty()) {
            List<String> meds = List.of("Paracetamol 500mg", "Amoxicillin 250mg", "Metformin 500mg", "Atorvastatin 10mg", "Amlodipine 5mg", "Omeprazole 20mg", "Cefixime 200mg");
            for (String med : meds) {
                InventoryItem item = new InventoryItem();
                item.setName(med);
                item.setType("Tablet");
                item.setStockQuantity(100 + new java.util.Random().nextInt(400));
                item.setThreshold(50);
                item.setUnitPrice(5.0 + new java.util.Random().nextDouble() * 20);
                item.setManufacturer("UPHI Pharma");
                item.setHospitalId(legacyId);
                inventoryRepository.save(item);
            }
            logger.info("Seeded initial inventory for legacy hospital.");
        }

        logger.info("Multi-Tenant Migration Check Complete.");
    }

    private void migrateCollection(org.springframework.data.mongodb.repository.MongoRepository repo, String name, String legacyId) {
        List<Object> allRecords = repo.findAll();
        List<Object> toSave = new java.util.ArrayList<>();
        for (Object record : allRecords) {
            try {
                java.lang.reflect.Method getHospitalId = record.getClass().getMethod("getHospitalId");
                String hospitalId = (String) getHospitalId.invoke(record);
                if (hospitalId == null) {
                    java.lang.reflect.Method setHospitalId = record.getClass().getMethod("setHospitalId", String.class);
                    setHospitalId.invoke(record, legacyId);
                    toSave.add(record);
                }
            } catch (Exception e) {
                logger.error("Failed to migrate record type {}: {}", name, e.getMessage());
            }
        }
        if (!toSave.isEmpty()) {
            repo.saveAll(toSave);
            logger.info("Migrated {} {} to legacy hospital.", toSave.size(), name);
        }
    }
}
