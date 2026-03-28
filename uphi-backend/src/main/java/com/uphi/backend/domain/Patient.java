package com.uphi.backend.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import com.uphi.backend.domain.models.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Document(collection = "patients")
public class Patient {

    @Id
    private String id;

    @Indexed
    private String userId; // Reference to User collection

    private String fullName;
    private int age;
    private String gender;
    private String dob;


    private ContactInfo contactInfo;
    private EmergencyContact emergencyContact;

    @Indexed(unique = true)
    @Field("abhaAddress")
    private String abhaAddress;

    private String bloodGroup;
    private String phone;
    private String email;

    private List<Allergy> allergies;
    private List<Condition> conditions;
    private Vitals vitals;
    private List<Medication> medications;
    private Risk risk;
    private List<ImagingRecord> imagingRecords;
    private List<MedicalDocument> medicalDocuments;
    private List<RelatedPerson> relatedPersons;
    
    private Set<String> affiliatedHospitals;

    private String aadhaar;
    private Instant createdAt;

    public Patient() {
        this.createdAt = Instant.now();
        this.allergies = new ArrayList<>();
        this.conditions = new ArrayList<>();
        this.medications = new ArrayList<>();
        this.imagingRecords = new ArrayList<>();
        this.medicalDocuments = new ArrayList<>();
        this.relatedPersons = new ArrayList<>();
        this.affiliatedHospitals = new HashSet<>();
        this.vitals = new Vitals();
        this.risk = new Risk();
        this.contactInfo = new ContactInfo();
        this.emergencyContact = new EmergencyContact();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getDob() {
        return dob;
    }

    public void setDob(String dob) {
        this.dob = dob;
    }


    public ContactInfo getContactInfo() {
        return contactInfo;
    }

    public void setContactInfo(ContactInfo contactInfo) {
        this.contactInfo = contactInfo;
    }

    public EmergencyContact getEmergencyContact() {
        return emergencyContact;
    }

    public void setEmergencyContact(EmergencyContact emergencyContact) {
        this.emergencyContact = emergencyContact;
    }

    public String getAbhaAddress() {
        return abhaAddress;
    }

    public void setAbhaAddress(String abhaAddress) {
        this.abhaAddress = abhaAddress;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getBloodGroup() {
        return bloodGroup;
    }

    public void setBloodGroup(String bloodGroup) {
        this.bloodGroup = bloodGroup;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public List<Allergy> getAllergies() {
        return allergies;
    }

    public void setAllergies(List<Allergy> allergies) {
        this.allergies = allergies;
    }

    public List<Condition> getConditions() {
        return conditions;
    }

    public void setConditions(List<Condition> conditions) {
        this.conditions = conditions;
    }

    public Vitals getVitals() {
        return vitals;
    }

    public void setVitals(Vitals vitals) {
        this.vitals = vitals;
    }

    public List<Medication> getMedications() {
        return medications;
    }

    public void setMedications(List<Medication> medications) {
        this.medications = medications;
    }

    public Risk getRisk() {
        return risk;
    }

    public void setRisk(Risk risk) {
        this.risk = risk;
    }

    public List<ImagingRecord> getImagingRecords() {
        return imagingRecords;
    }

    public void setImagingRecords(List<ImagingRecord> imagingRecords) {
        this.imagingRecords = imagingRecords;
    }

    public List<MedicalDocument> getMedicalDocuments() {
        return medicalDocuments;
    }

    public void setMedicalDocuments(List<MedicalDocument> medicalDocuments) {
        this.medicalDocuments = medicalDocuments;
    }

    public List<RelatedPerson> getRelatedPersons() {
        return relatedPersons;
    }

    public void setRelatedPersons(List<RelatedPerson> relatedPersons) {
        this.relatedPersons = relatedPersons;
    }

    public Set<String> getAffiliatedHospitals() {
        return affiliatedHospitals;
    }

    public void setAffiliatedHospitals(Set<String> affiliatedHospitals) {
        this.affiliatedHospitals = affiliatedHospitals;
    }
    public String getAadhaar() {
        return aadhaar;
    }
 
    public void setAadhaar(String aadhaar) {
        this.aadhaar = aadhaar;
    }
}
