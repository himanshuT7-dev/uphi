package com.uphi.backend.service;

import com.uphi.backend.domain.*;
import com.uphi.backend.domain.models.*;
import com.uphi.backend.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DataSeederService {
    private static final Logger logger = LoggerFactory.getLogger(DataSeederService.class);

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final AppointmentRepository appointmentRepository;
    private final InvoiceRepository invoiceRepository;
    private final InventoryRepository inventoryItemRepository;
    private final ConsentRepository consentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeederService(PatientRepository patientRepository, 
                          UserRepository userRepository, 
                          HospitalRepository hospitalRepository,
                          MedicalRecordRepository medicalRecordRepository,
                          AppointmentRepository appointmentRepository,
                          InvoiceRepository invoiceRepository,
                          InventoryRepository inventoryItemRepository,
                          ConsentRepository consentRepository,
                          PrescriptionRepository prescriptionRepository,
                          PasswordEncoder passwordEncoder) {
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.hospitalRepository = hospitalRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.appointmentRepository = appointmentRepository;
        this.invoiceRepository = invoiceRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.consentRepository = consentRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void seedGoldenDemo() {
        logger.info("Initializing Golden Demo Seeding...");
        // --- 0. Pre-Cleanup ---
        try {
            logger.info("Cleaning existing database...");
            medicalRecordRepository.deleteAll();
            appointmentRepository.deleteAll();
            invoiceRepository.deleteAll();
            inventoryItemRepository.deleteAll();
            consentRepository.deleteAll();
            prescriptionRepository.deleteAll();
            patientRepository.deleteAll();

            // 0.2 Specific User Cleanup: Preserve core platform identities to maintain active session
            List<String> coreUsers = Arrays.asList("uphi_master", "admin", "Himanshu", "main_admin");
            userRepository.findAll().forEach(u -> {
                if (!coreUsers.contains(u.getUsername())) {
                    userRepository.delete(u);
                }
            });

            hospitalRepository.deleteAll();
            logger.info("Database cleaned (Active Session Preserved).");

        } catch (Exception e) {
            logger.error("Error during database cleanup: {}", e.getMessage());
            throw e;
        }

        // --- 1. Global Admin ---
        logger.info("Recreating platform identities...");
        createMainAdmin("uphi_master", "Master@123", "uphi.master@gmail.com");
        logger.info("Platform identities ready.");


        // --- 2. Hospital Entities ---
        String[] hospitalNames = {"Apollo Hospital", "Max Healthcare", "Fortis Hospital", "AIIMS Delhi", "Medanta", "CMC Vellore"};
        for (String hName : hospitalNames) {
            Hospital h = new Hospital();
            h.setName(hName);
            h.setAbhaFacilityId("F-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            h.setAddress("City Center, New Delhi");
            String logoId = hName.contains("Apollo") ? "1" : hName.contains("Max") ? "2" : "3";
            h.setLogoUrl("https://img.icons8.com/color/96/hospital-" + logoId + ".png");
            h = hospitalRepository.save(h);

            // Create Hospital Admin
            String admUser = hName.split(" ")[0].toLowerCase() + "_admin";
            createUser(admUser, "Admin@123", Role.ADMIN, h.getId(), hName.split(" ")[0] + " Administrator", "Management", "ADM-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());

            // Create Doctors (3 per hospital)
            String[] doctorSpecialties = {"Cardiology", "Neurology", "General Medicine"};
            String[] doctorTitles = {"Dr. Rajesh Kapoor", "Dr. Sunita Mehta", "Dr. Arjun Nair"};
            List<String> doctorIds = new ArrayList<>();
            for (int i = 1; i <= 3; i++) {
                String dName = hName.split(" ")[0].toLowerCase() + "_dr" + i;
                User doc = createUser(dName, "Doctor@123", Role.DOCTOR, h.getId(), doctorTitles[i-1], doctorSpecialties[i-1], "MC-DEL" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
                doctorIds.add(doc.getId());
            }

            // Create Receptionists (2 per hospital)
            for (int i = 1; i <= 2; i++) {
                String rName = hName.split(" ")[0].toLowerCase() + "_staff" + i;
                createUser(rName, "Staff@123", Role.RECEPTIONIST, h.getId(), hName.split(" ")[0] + " Front Desk", "Administration", "UPHI-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
            }

            // Seed Patients for this hospital
            List<Patient> patients = seedPatientsForHospital(h.getId(), 4);

            // Seed Appointments, Invoices, Pharmacy for this hospital
            seedAppointments(h.getId(), h.getName(), patients, doctorTitles);
            seedInvoices(h.getId(), patients);
            seedPharmacy(h.getId());
            seedPrescriptions(h.getId(), patients, doctorTitles);
        }

        // --- 3. Hero Personas ---
        seedHeroPersonas();
    }

    // ==================== APPOINTMENTS ====================
    private void seedAppointments(String hospitalId, String hospitalName, List<Patient> patients, String[] doctorNames) {
        String[][] appointmentData = {
            {"2026-04-08", "09:30", "Cardiology", "Routine cardiac checkup and ECG", "Standard"},
            {"2026-04-08", "10:00", "Neurology", "Follow-up for migraine treatment", "Urgent"},
            {"2026-04-08", "11:15", "General Medicine", "Annual health screening", "Standard"},
            {"2026-04-08", "14:00", "Cardiology", "Post-surgery follow-up evaluation", "Urgent"},
            {"2026-04-09", "09:00", "General Medicine", "Diabetes management review", "Standard"},
            {"2026-04-09", "10:30", "Neurology", "Cognitive assessment and EEG", "Standard"},
            {"2026-04-09", "13:00", "Cardiology", "Hypertension management", "Emergency"},
            {"2026-04-10", "08:30", "General Medicine", "Pre-operative clearance", "Low"},
            {"2026-04-10", "11:00", "Neurology", "Peripheral neuropathy consultation", "Standard"},
            {"2026-04-10", "15:00", "Cardiology", "Echocardiogram review", "Standard"},
        };
        
        String[] statuses = {"SCHEDULED", "SCHEDULED", "COMPLETED", "SCHEDULED", "SCHEDULED",
                             "SCHEDULED", "COMPLETED", "SCHEDULED", "CANCELLED", "SCHEDULED"};

        for (int i = 0; i < appointmentData.length; i++) {
            Appointment apt = new Appointment();
            apt.setHospitalId(hospitalId);
            Patient p = patients.get(i % patients.size());
            apt.setPatientId(p.getId());
            apt.setPatientName(p.getFullName());
            apt.setDoctorName(doctorNames[i % doctorNames.length]);
            apt.setDepartment(appointmentData[i][2]);
            apt.setDate(appointmentData[i][0]);
            apt.setTime(appointmentData[i][1]);
            apt.setNotes(appointmentData[i][3]);
            apt.setUrgency(appointmentData[i][4]);
            apt.setStatus(statuses[i]);
            appointmentRepository.save(apt);
        }
    }

    // ==================== INVOICES ====================
    private void seedInvoices(String hospitalId, List<Patient> patients) {
        String[][] invoiceItems = {
            {"Consultation Fee|1500", "ECG Test|800", "Blood Panel (CBC)|450"},
            {"OPD Registration|200", "X-Ray Chest PA|1200", "Consultation Fee|1500"},
            {"MRI Brain|8500", "Neurologist Consult|2500", "IV Medication|350"},
            {"Cardiac Stress Test|3500", "Echocardiogram|4200", "Cardio Consult|2000"},
            {"General Checkup|1000", "Urine Analysis|300", "Thyroid Panel|650", "Lipid Profile|800"},
            {"Emergency Room Charge|5000", "CT Scan Abdomen|6500", "Surgical Dressing|400"},
        };
        String[] statuses = {"PAID", "PENDING", "PAID", "PENDING", "PAID", "PENDING"};
        String[] methods = {"UPI", null, "Card", null, "Cash", null};

        for (int i = 0; i < invoiceItems.length; i++) {
            Invoice inv = new Invoice();
            inv.setHospitalId(hospitalId);
            Patient p = patients.get(i % patients.size());
            inv.setPatientId(p.getId());
            inv.setPatientName(p.getFullName());
            inv.setStatus(statuses[i]);
            inv.setPaymentMethod(methods[i]);
            inv.setCreatedAt(Instant.now().minus(i * 3L, ChronoUnit.DAYS));

            List<Invoice.LineItem> items = new ArrayList<>();
            double total = 0;
            for (String itemStr : invoiceItems[i]) {
                String[] parts = itemStr.split("\\|");
                Invoice.LineItem li = new Invoice.LineItem();
                li.setDescription(parts[0]);
                li.setAmount(Double.parseDouble(parts[1]));
                items.add(li);
                total += li.getAmount();
            }
            inv.setItems(items);
            inv.setTotalAmount(total);
            invoiceRepository.save(inv);
        }
    }

    // ==================== PHARMACY & INVENTORY ====================
    private void seedPharmacy(String hospitalId) {
        String[][] drugs = {
            {"Paracetamol 500mg", "Tablet", "2400", "200", "2.50", "Cipla"},
            {"Amoxicillin 250mg", "Capsule", "800", "100", "8.75", "Sun Pharma"},
            {"Metformin 500mg", "Tablet", "1500", "150", "3.20", "Dr. Reddy's"},
            {"Atorvastatin 10mg", "Tablet", "600", "80", "12.50", "Lupin"},
            {"Cetirizine 10mg", "Tablet", "1800", "200", "1.80", "Mankind Pharma"},
            {"Omeprazole 20mg", "Capsule", "950", "100", "5.60", "Torrent Pharma"},
            {"Azithromycin 500mg", "Tablet", "300", "50", "22.00", "Zydus Cadila"},
            {"Normal Saline 500ml", "IV Fluid", "400", "60", "45.00", "Baxter"},
            {"Insulin Glargine", "Injection", "120", "20", "850.00", "Sanofi"},
            {"Diclofenac Gel 30g", "Topical", "350", "50", "65.00", "Novartis"},
            {"Salbutamol Inhaler", "Inhaler", "90", "15", "175.00", "GSK"},
            {"Pantoprazole 40mg", "Tablet", "1100", "120", "6.40", "Abbott"},
            {"Dexamethasone 4mg", "Injection", "200", "30", "35.00", "Cadila"},
            {"Povidone Iodine 5%", "Antiseptic", "500", "75", "28.00", "Win-Medicare"},
            {"Surgical Mask N95", "Equipment", "5000", "500", "12.00", "3M India"},
        };

        for (String[] d : drugs) {
            InventoryItem item = new InventoryItem();
            item.setHospitalId(hospitalId);
            item.setName(d[0]);
            item.setType(d[1]);
            item.setStockQuantity(Integer.parseInt(d[2]));
            item.setThreshold(Integer.parseInt(d[3]));
            item.setUnitPrice(Double.parseDouble(d[4]));
            item.setManufacturer(d[5]);
            inventoryItemRepository.save(item);
        }
    }

    private void createMainAdmin(String user, String pass, String mail) {
        // Remove any existing entry to avoid duplicates
        userRepository.findByUsername(user).ifPresent(existing -> userRepository.delete(existing));
        User u = new User();
        u.setUsername(user);
        u.setEmail(mail);
        u.setPasswordHash(passwordEncoder.encode(pass));
        u.setRole(Role.MAIN_ADMIN);
        userRepository.save(u);
    }

    private User createUser(String user, String pass, Role role, String hid, String fullName, String spec, String reg) {
        User u = new User();
        u.setUsername(user);
        u.setEmail(user + "@uphi.health");
        u.setPasswordHash(passwordEncoder.encode(pass));
        u.setRole(role);
        u.setHospitalId(hid);
        u.setFullName(fullName);
        u.setSpecialization(spec);
        u.setRegistrationId(reg);
        return userRepository.save(u);
    }

    private static final String[][] PATIENT_NAMES = {
        {"Aarav Sharma", "Male"}, {"Neha Patel", "Female"}, {"Rohan Gupta", "Male"}, {"Kavya Singh", "Female"},
        {"Arjun Reddy", "Male"}, {"Simran Kaur", "Female"}, {"Vikram Rao", "Male"}, {"Ananya Iyer", "Female"},
        {"Siddharth Joshi", "Male"}, {"Pooja Mehta", "Female"}, {"Karan Malhotra", "Male"}, {"Divya Nair", "Female"},
        {"Aditya Verma", "Male"}, {"Riya Bhat", "Female"}, {"Manish Chauhan", "Male"}, {"Shruti Desai", "Female"},
        {"Rahul Kapoor", "Male"}, {"Meera Sundaram", "Female"}, {"Varun Tiwari", "Male"}, {"Ishita Das", "Female"},
        {"Amit Pandey", "Male"}, {"Nisha Srivastava", "Female"}, {"Deepak Yadav", "Male"}, {"Tanvi Kulkarni", "Female"}
    };
    private int patientNameIdx = 0;

    public List<Patient> seedPatientsForHospital(String hospitalId, int count) {
        List<Patient> seeded = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            String[] nameEntry = PATIENT_NAMES[patientNameIdx % PATIENT_NAMES.length];
            Patient p = createPatient(nameEntry[0], hospitalId);
            p.setGender(nameEntry[1]);
            patientRepository.save(p);
            patientNameIdx++;
            seeded.add(p);
        }
        return seeded;
    }

    private void seedHeroPersonas() {
        Hospital apollo = hospitalRepository.findByName("Apollo Hospital").orElseThrow();
        
        // Persona A: Ramesh Kumar (Chronic)
        Patient ramesh = createPatient("Ramesh Kumar", apollo.getId());
        ramesh.setAbhaAddress("ABHA-1234-5678");
        ramesh.setPhone("+91 9999900001");
        ramesh.setAge(49);
        ramesh.setGender("Male");
        ramesh.setDob("1975-04-08");
        ramesh.setBloodGroup("O+");
        ramesh.setEmail("ramesh.kumar@email.com");
        
        User rUser = new User();
        rUser.setUsername("ABHA-1234-5678");
        rUser.setPasswordHash(passwordEncoder.encode("Patient@123"));
        rUser.setRole(Role.PATIENT);
        rUser = userRepository.save(rUser);
        ramesh.setUserId(rUser.getId());
        
        String[] types = {"CONSULTATION", "LAB", "RADIOLOGY", "CONSULTATION", "VACCINATION", "CONSULTATION"};
        for (int i = 1; i <= 6; i++) {
            MedicalRecord record = new MedicalRecord();
            record.setPatientId(ramesh.getId());
            record.setType(types[i-1]);
            record.setDiagnosticSummary("Detailed analysis for phase " + i + ". Parameters are within standard deviation.");
            record.setHospitalId(apollo.getId());
            record.setDate(java.time.Instant.now().minus(java.time.Duration.ofDays(30L * i)));
            medicalRecordRepository.save(record);
        }
        
        Vitals v = new Vitals();
        v.setBloodPressure("140/90");
        v.setWeight(84.2);
        v.setHeartRate(82);
        v.setSpO2(98);
        v.setTemperature(36.5);
        ramesh.setVitals(v);
        
        Map<String, RiskData> rameshRisk = new HashMap<>();
        
        RiskData cardiac = new RiskData();
        cardiac.setScore(65);
        cardiac.setLevel("high");
        cardiac.setTrend("increasing");
        
        RiskData diabetes = new RiskData();
        diabetes.setScore(42);
        diabetes.setLevel("moderate");
        diabetes.setTrend("stable");
        
        RiskData ckd = new RiskData();
        ckd.setScore(12);
        ckd.setLevel("low");
        ckd.setTrend("decreasing");
        
        RiskData readmission = new RiskData();
        readmission.setScore(78);
        readmission.setLevel("critical");
        readmission.setTrend("increasing");
        
        rameshRisk.put("cardiac", cardiac);
        rameshRisk.put("diabetes", diabetes);
        rameshRisk.put("ckd", ckd);
        rameshRisk.put("readmission", readmission);
        ramesh.setRiskScores(rameshRisk);

        // Lab Results
        List<LabResult> rameshLabs = new ArrayList<>();
        rameshLabs.add(new LabResult("HbA1c", "8.2", "4.0-5.6%", "05/04/2026", "up"));
        rameshLabs.add(new LabResult("Blood Glucose", "164", "70-100 mg/dL", "05/04/2026", "up"));
        rameshLabs.add(new LabResult("LDL Cholesterol", "145", "<100 mg/dL", "12/03/2026", "stable"));
        rameshLabs.add(new LabResult("Creatinine", "1.4", "0.7-1.3 mg/dL", "12/03/2026", "up"));
        ramesh.setLabResults(rameshLabs);

        // Timeline
        List<TimelineEvent> rameshTimeline = new ArrayList<>();
        rameshTimeline.add(new TimelineEvent("08/04/2026", "Cardiology Review Appointment", "consult", "Apollo Hospital"));
        rameshTimeline.add(new TimelineEvent("05/04/2026", "Blood Glucose Panel (Critical)", "lab", "Apollo Lab"));
        rameshTimeline.add(new TimelineEvent("12/03/2026", "Standard Health Checkup", "consult", "Fortis Hospital"));
        rameshTimeline.add(new TimelineEvent("15/01/2026", "Acute Gastritis Admission", "admission", "Apollo Hospital"));
        ramesh.setTimeline(rameshTimeline);

        // Related Persons (Family)
        RelatedPerson priyaLink = new RelatedPerson();
        priyaLink.setFullName("Priya Verma");
        priyaLink.setRelationship("Sister");
        priyaLink.setPhone("+91 9999900002");
        ramesh.getRelatedPersons().add(priyaLink);

        // Imaging
        ImagingRecord rameshXray = new ImagingRecord();
        rameshXray.setType("XRAY");
        rameshXray.setAnalysis("Minor inflammation in lower lobe. Preserving as clinical baseline.");
        rameshXray.setDoctorName("Dr. Rajesh Kapoor");
        rameshXray.setDate(Instant.now().minus(2, ChronoUnit.DAYS));
        ramesh.getImagingRecords().add(rameshXray);

        patientRepository.save(ramesh);

        // Persona B: Priya Verma (Urgent Allergic)
        Patient priya = createPatient("Priya Verma", apollo.getId());
        priya.setAbhaAddress("ABHA-8765-4321");
        priya.setAge(32);
        priya.setGender("Female");
        priya.setPhone("+91 9999900002");
        priya.setBloodGroup("A+");
        
        User pUser = new User();
        pUser.setUsername("ABHA-8765-4321");
        pUser.setPasswordHash(passwordEncoder.encode("Patient@123"));
        pUser.setRole(Role.PATIENT);
        pUser = userRepository.save(pUser);
        priya.setUserId(pUser.getId());
        
        Condition allergy = new Condition();
        allergy.setName("Penicillin Allergy");
        allergy.setStatus("CRITICAL");
        priya.getConditions().add(allergy);

        // Related Person backlink
        RelatedPerson rameshLink = new RelatedPerson();
        rameshLink.setFullName("Ramesh Kumar");
        rameshLink.setRelationship("Brother");
        rameshLink.setPhone("9876543210");
        priya.getRelatedPersons().add(rameshLink);

        patientRepository.save(priya);
    }

    private Patient createPatient(String name, String hid) {
        Random rng = new Random(name.hashCode()); // Deterministic per patient
        Patient p = new Patient();
        p.setFullName(name);
        p.setAbhaAddress("ABHA-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        p.getAffiliatedHospitals().add(hid);
        int age = 25 + rng.nextInt(40);
        p.setAge(age);
        String gender = name.contains("Neha") || name.contains("Kavya") || name.contains("Simran") || name.contains("Ananya") || name.contains("Pooja") || name.contains("Divya") || name.contains("Riya") || name.contains("Shruti") || name.contains("Meera") || name.contains("Ishita") || name.contains("Nisha") || name.contains("Tanvi") ? "Female" : "Male";
        p.setGender(gender);
        String[] bloodGroups = {"A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"};
        p.setBloodGroup(bloodGroups[rng.nextInt(bloodGroups.length)]);
        p.setDob((1985 + rng.nextInt(20)) + "-" + String.format("%02d", 1 + rng.nextInt(12)) + "-" + String.format("%02d", 1 + rng.nextInt(28)));
        p.setPhone("+91 " + (9000000000L + rng.nextInt(999999999)));
        p.setEmail(name.toLowerCase().replaceAll("\\s+", ".") + "@email.com");

        // Vitals
        Vitals v = new Vitals();
        v.setBloodPressure((110 + rng.nextInt(40)) + "/" + (65 + rng.nextInt(25)));
        v.setWeight(50.0 + rng.nextInt(40));
        v.setHeartRate(60 + rng.nextInt(35));
        v.setSpO2(94 + rng.nextInt(6));
        v.setTemperature(36.2 + rng.nextDouble() * 1.5);
        p.setVitals(v);

        // Conditions
        String[][] conditionPool = {
            {"Hypertension", "ACTIVE"}, {"Type 2 Diabetes", "ACTIVE"}, {"Asthma", "CONTROLLED"},
            {"Hypothyroidism", "ACTIVE"}, {"Migraine", "RECURRENT"}, {"GERD", "CONTROLLED"},
            {"Iron Deficiency Anemia", "ACTIVE"}, {"Chronic Back Pain", "ACTIVE"},
            {"Hyperlipidemia", "ACTIVE"}, {"Vitamin D Deficiency", "ACTIVE"},
            {"Anxiety Disorder", "MANAGED"}, {"Osteoarthritis", "PROGRESSIVE"}
        };
        int numConditions = 1 + rng.nextInt(3);
        for (int ci = 0; ci < numConditions; ci++) {
            String[] cd = conditionPool[(rng.nextInt(conditionPool.length) + ci) % conditionPool.length];
            Condition c = new Condition();
            c.setName(cd[0]);
            c.setStatus(cd[1]);
            p.getConditions().add(c);
        }

        // Allergies
        String[][] allergyPool = {{"Penicillin", "SEVERE"}, {"Sulfa Drugs", "MODERATE"}, {"Peanuts", "MILD"}, {"Dust Mites", "MODERATE"}, {"Ibuprofen", "SEVERE"}, {"Latex", "MODERATE"}};
        if (rng.nextInt(3) < 2) { // 66% chance of having allergies
            Allergy a = new Allergy();
            String[] al = allergyPool[rng.nextInt(allergyPool.length)];
            a.setName(al[0]);
            a.setSeverity(al[1]);
            p.getAllergies().add(a);
        }

        // Risk Scores
        String[] levels = {"low", "moderate", "high", "critical"};
        String[] trends = {"stable", "increasing", "decreasing"};
        java.util.Map<String, RiskData> risks = new java.util.HashMap<>();
        String[] riskTypes = {"cardiac", "diabetes", "respiratory", "readmission"};
        for (String rt : riskTypes) {
            RiskData rd = new RiskData();
            rd.setScore(5 + rng.nextInt(90));
            rd.setLevel(levels[Math.min(rd.getScore() / 25, 3)]);
            rd.setTrend(trends[rng.nextInt(trends.length)]);
            risks.put(rt, rd);
        }
        p.setRiskScores(risks);

        // Lab Results
        String[][] labPool = {
            {"HbA1c", "6.8", "4.0-5.6%"}, {"Blood Glucose (F)", "118", "70-100 mg/dL"},
            {"LDL Cholesterol", "132", "<100 mg/dL"}, {"HDL Cholesterol", "48", ">40 mg/dL"},
            {"Creatinine", "1.1", "0.7-1.3 mg/dL"}, {"TSH", "4.8", "0.4-4.0 mIU/L"},
            {"Hemoglobin", "12.4", "12-16 g/dL"}, {"Vitamin D", "18", "30-100 ng/mL"},
            {"Platelet Count", "245000", "150000-400000"}, {"WBC Count", "7200", "4500-11000"}
        };
        String[] labTrends = {"up", "down", "stable"};
        int numLabs = 3 + rng.nextInt(4);
        for (int li = 0; li < numLabs; li++) {
            String[] lab = labPool[(li + rng.nextInt(labPool.length)) % labPool.length];
            String date = String.format("%02d/%02d/2026", 1 + rng.nextInt(12), 1 + rng.nextInt(28));
            double variance = 0.8 + rng.nextDouble() * 0.4;
            String val = lab[0].contains("Count") ? String.valueOf((int)(Double.parseDouble(lab[1]) * variance)) :
                         String.format("%.1f", Double.parseDouble(lab[1]) * variance);
            p.getLabResults().add(new LabResult(lab[0], val, lab[2], date, labTrends[rng.nextInt(labTrends.length)]));
        }

        // Timeline
        String[][] timelinePool = {
            {"General Health Screening", "consult"}, {"Blood Work Panel", "lab"},
            {"Cardiology Consultation", "consult"}, {"Pharmacy Refill", "medication"},
            {"Physical Therapy Session", "procedure"}, {"Vaccination (Flu)", "vaccination"},
            {"Follow-up Appointment", "consult"}, {"CT Scan Abdomen", "imaging"},
            {"Dental Checkup", "consult"}, {"Emergency Room Visit", "admission"}
        };
        String[] hospitalNames = {"Apollo Hospital", "Max Healthcare", "Fortis Hospital", "AIIMS Delhi"};
        int numTimeline = 3 + rng.nextInt(4);
        for (int ti = 0; ti < numTimeline; ti++) {
            String[] te = timelinePool[(ti + rng.nextInt(timelinePool.length)) % timelinePool.length];
            String date = String.format("%02d/%02d/2026", Math.max(1, 4 - ti), 1 + rng.nextInt(28));
            p.getTimeline().add(new TimelineEvent(date, te[0], te[1], hospitalNames[rng.nextInt(hospitalNames.length)]));
        }

        // Imaging Records
        String[][] imagingPool = {
            {"XRAY", "Chest X-ray shows clear lung fields. No acute findings.", "Dr. Rajesh Kapoor"},
            {"CT", "CT Abdomen reveals no evidence of obstruction. Normal anatomy.", "Dr. Sunita Mehta"},
            {"MRI", "MRI Brain unremarkable. No mass effect or midline shift.", "Dr. Arjun Nair"},
            {"ULTRASOUND", "Hepatobiliary ultrasound shows normal liver parenchyma.", "Dr. Rajesh Kapoor"},
            {"ECG", "Normal sinus rhythm. No ST changes. Rate 72 bpm.", "Dr. Sunita Mehta"}
        };
        if (rng.nextInt(3) < 2) { // 66% have imaging
            String[] img = imagingPool[rng.nextInt(imagingPool.length)];
            ImagingRecord ir = new ImagingRecord();
            ir.setType(img[0]);
            ir.setAnalysis(img[1]);
            ir.setDoctorName(img[2]);
            ir.setDate(Instant.now().minus(rng.nextInt(30), ChronoUnit.DAYS));
            p.getImagingRecords().add(ir);
        }

        // Medications
        String[] meds = {"Metformin 500mg", "Atorvastatin 20mg", "Lisinopril 10mg", "Amlodipine 5mg", "Levothyroxine 50mcg", "Gabapentin 300mg"};
        int numMeds = 2 + rng.nextInt(4);
        for (int i = 0; i < numMeds; i++) {
            Medication m = new Medication();
            m.setName(meds[(i + rng.nextInt(meds.length)) % meds.length]);
            p.getMedications().add(m);
        }

        // Medical Documents
        String[] docNames = {"Pre-op Assessment", "Discharge Summary", "Insurance Form", "Lab Panel Report", "Referral Letter", "Vaccination Record"};
        for (int i = 0; i < 3; i++) {
            MedicalDocument d = new MedicalDocument(docNames[(i + rng.nextInt(docNames.length)) % docNames.length], "REPORT", "/sample.pdf", "UPHI Registrar");
            p.getMedicalDocuments().add(d);
        }

        // Emergency Contact
        EmergencyContact ec = new EmergencyContact();
        String[] ecNames = {"Anita Sharma", "Vikram Singh", "Priya Gupta", "Suresh Kumar", "Meena Patel", "Ravi Reddy"};
        ec.setName(ecNames[rng.nextInt(ecNames.length)]);
        ec.setRelationship(rng.nextBoolean() ? "Spouse" : "Parent");
        ec.setPhone("+91 " + (9000000000L + rng.nextInt(999999999)));
        p.setEmergencyContact(ec);

        return patientRepository.save(p);
    }

    // ==================== PRESCRIPTIONS ====================
    public void seedPrescriptions(String hospitalId, List<Patient> patients, String[] doctorNames) {
        String[][] rxData = {
            {"Hypertension Management", "Tab Amlodipine 5mg|5mg|Once daily|30 days|Take in the morning,Tab Losartan 50mg|50mg|Once daily|30 days|After breakfast"},
            {"Type 2 Diabetes Control", "Tab Metformin 500mg|500mg|Twice daily|60 days|After meals,Inj Insulin Glargine|10 units|Once daily|30 days|Subcutaneous at bedtime"},
            {"Acute Respiratory Infection", "Tab Azithromycin 500mg|500mg|Once daily for 5 days|5 days|After meals,Syp Ambroxol|5ml|Thrice daily|7 days|After meals"},
            {"Chronic Pain Management", "Tab Pregabalin 75mg|75mg|Twice daily|28 days|After meals,Tab Diclofenac 50mg|50mg|Twice daily as needed|14 days|With food"},
            {"Thyroid Disorder", "Tab Levothyroxine 50mcg|50mcg|Once daily|90 days|Empty stomach morning,Tab Calcium-Vit D3|500mg|Once daily|90 days|After dinner"},
            {"Lipid Management", "Tab Atorvastatin 20mg|20mg|Once daily|90 days|At bedtime,Tab Fenofibrate 145mg|145mg|Once daily|60 days|After meals"},
        };
        String[] instructionPool = {
            "Follow up in 4 weeks. Monitor BP daily.", "Strict diet compliance required. Avoid sugar.",
            "Complete the full course. Report if fever persists.", "Physiotherapy recommended alongside medication.",
            "Recheck thyroid levels in 6 weeks.", "Lipid panel after 12 weeks. Reduce fatty foods."
        };

        for (int i = 0; i < Math.min(rxData.length, patients.size()); i++) {
            Prescription rx = new Prescription();
            rx.setHospitalId(hospitalId);
            Patient pat = patients.get(i % patients.size());
            rx.setPatientId(pat.getId());
            rx.setPatientName(pat.getFullName());
            rx.setDoctorName(doctorNames[i % doctorNames.length]);
            rx.setDiagnosis(rxData[i][0]);
            rx.setInstructions(instructionPool[i]);
            rx.setDate(java.time.LocalDate.now().minusDays(i * 3L).toString());
            rx.setCreatedAt(Instant.now().minus(i * 3L, ChronoUnit.DAYS));

            List<Prescription.PrescribedMed> medList = new ArrayList<>();
            for (String medStr : rxData[i][1].split(",")) {
                String[] parts = medStr.split("\\|");
                Prescription.PrescribedMed pm = new Prescription.PrescribedMed();
                pm.setName(parts[0].trim());
                pm.setDosage(parts[1].trim());
                pm.setFrequency(parts[2].trim());
                pm.setDuration(parts[3].trim());
                if (parts.length > 4) pm.setNotes(parts[4].trim());
                medList.add(pm);
            }
            rx.setMedications(medList);
            prescriptionRepository.save(rx);
        }
    }
}
