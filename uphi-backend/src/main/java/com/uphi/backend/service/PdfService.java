package com.uphi.backend.service;

import com.lowagie.text.Document;
import com.lowagie.text.Image;
import com.lowagie.text.pdf.BaseFont;

import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfWriter;

import com.uphi.backend.domain.Patient;
import com.uphi.backend.domain.Invoice;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;


@Service
public class PdfService {

    @Autowired
    private QrService qrService;

    public byte[] generatePatientIdCard(Patient patient) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        
        // ID Card Size: CR80 (approx 3.375 x 2.125 inches) -> 243 x 153 points
        com.lowagie.text.Rectangle pageSize = new com.lowagie.text.Rectangle(243, 153);
        Document document = new Document(pageSize, 0, 0, 0, 0);

        PdfWriter writer = PdfWriter.getInstance(document, out);
        
        document.open();
        PdfContentByte cb = writer.getDirectContent();

        // 1. Background Design (Gradient or Solid)
        cb.setRGBColorFill(245, 248, 255); // Very light grey-blue
        cb.rectangle(0, 0, 243, 153);
        cb.fill();

        // 2. Header Accent
        cb.setRGBColorFill(37, 99, 235); // Accent Blue
        cb.rectangle(0, 120, 243, 33);
        cb.fill();

        // 3. UPHI Logo / Header Text
        BaseFont bfBold = BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
        cb.beginText();
        cb.setFontAndSize(bfBold, 12);
        cb.setRGBColorFill(255, 255, 255);
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "UPHI HEALTH ID", 15, 132, 0);
        cb.endText();

        // 4. Patient Name
        BaseFont bfNormal = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
        cb.beginText();
        cb.setFontAndSize(bfBold, 11);
        cb.setRGBColorFill(15, 23, 42); // Slate 900
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, patient.getFullName().toUpperCase(), 15, 95, 0);
        
        // 5. ABHA Address / Portal ID
        cb.setFontAndSize(bfNormal, 8);
        cb.setRGBColorFill(71, 85, 105); // Slate 600
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "ID: " + patient.getAbhaAddress(), 15, 82, 0);

        // 6. Demographics
        cb.setFontAndSize(bfNormal, 7);
        cb.setRGBColorFill(71, 85, 105);
        String gender = (patient.getGender() != null && !patient.getGender().equalsIgnoreCase("null")) ? patient.getGender() : "N/A";
        String blood = (patient.getBloodGroup() != null && !patient.getBloodGroup().equalsIgnoreCase("null") && !patient.getBloodGroup().isEmpty()) ? patient.getBloodGroup() : "N/A";
        String dob = (patient.getDob() != null && !patient.getDob().equalsIgnoreCase("null")) ? patient.getDob() : "N/A";
        
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "GENDER: " + gender, 15, 68, 0);
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "BLOOD: " + blood, 15, 58, 0);
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "DOB: " + dob, 15, 48, 0);
        cb.endText();

        // Simplify QR data to ensure it fits and renders reliably
        String qrData = "UPHI:" + patient.getAbhaAddress(); 
        byte[] qrBytes = qrService.generateQrCode(qrData, 200, 200);
        Image qrImage = Image.getInstance(qrBytes);
        qrImage.setAbsolutePosition(165, 35);
        qrImage.scaleAbsolute(55, 55);
        cb.addImage(qrImage); 

        // 8. Security Footer
        cb.beginText();
        cb.setFontAndSize(bfNormal, 5);
        cb.setRGBColorFill(148, 163, 184); // Slate 400
        cb.showTextAligned(PdfContentByte.ALIGN_CENTER, "VERIFIED DIGITAL HEALTH RECORD • UPHI NETWORK", 121, 10, 0);
        cb.endText();

        document.close();
        return out.toByteArray();
    }

    public byte[] generateInvoicePdf(Invoice invoice) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        // Standard A4 size
        Document document = new Document();
        PdfWriter writer = PdfWriter.getInstance(document, out);
        document.open();
        
        PdfContentByte cb = writer.getDirectContent();
        BaseFont bfBold = BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
        BaseFont bfNormal = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);

        // Header Section
        cb.beginText();
        cb.setFontAndSize(bfBold, 24);
        cb.setRGBColorFill(37, 99, 235); // UPHI Blue
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "UPHI", 50, 770, 0);
        cb.setFontAndSize(bfBold, 16);
        cb.setRGBColorFill(71, 85, 105);
        cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, "INVOICE", 550, 770, 0);
        cb.endText();

        cb.setLineWidth(2f);
        cb.setRGBColorStroke(37, 99, 235);
        cb.moveTo(50, 760);
        cb.lineTo(550, 760);
        cb.stroke();

        // Invoice Metadata
        cb.beginText();
        cb.setFontAndSize(bfNormal, 10);
        cb.setRGBColorFill(100, 116, 139);
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "Invoice No: #" + invoice.getId().toUpperCase(), 50, 740, 0);
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "Date: " + (invoice.getCreatedAt() != null ? invoice.getCreatedAt().toString() : "N/A"), 50, 725, 0);
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "Status: " + invoice.getStatus(), 50, 710, 0);
        cb.endText();

        // Billing Details
        cb.beginText();
        cb.setFontAndSize(bfBold, 12);
        cb.setRGBColorFill(15, 23, 42);
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "PATIENT DETAILS", 50, 670, 0);
        cb.setFontAndSize(bfNormal, 11);
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "Name: " + invoice.getPatientName(), 50, 650, 0);
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "ID: " + invoice.getPatientId(), 50, 635, 0);
        cb.endText();

        // Table Header
        cb.setRGBColorFill(248, 250, 252);
        cb.rectangle(50, 580, 500, 25);
        cb.fill();
        
        cb.beginText();
        cb.setFontAndSize(bfBold, 10);
        cb.setRGBColorFill(71, 85, 105);
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "DESCRIPTION", 60, 587, 0);
        cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, "AMOUNT (INR)", 540, 587, 0);
        cb.endText();

        // Items logic
        float y = 560;
        cb.beginText();
        cb.setFontAndSize(bfNormal, 10);
        cb.setRGBColorFill(15, 23, 42);
        
        if (invoice.getItems() != null && !invoice.getItems().isEmpty()) {
            for (Invoice.LineItem item : invoice.getItems()) {
                cb.showTextAligned(PdfContentByte.ALIGN_LEFT, item.getDescription(), 60, y, 0);
                cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, String.format("%.2f", item.getAmount()), 540, y, 0);
                y -= 20;
            }
        } else {
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "Hospital Consultation & Clinical Services", 60, y, 0);
            cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, String.format("%.2f", invoice.getTotalAmount()), 540, y, 0);
            y -= 20;
        }
        cb.endText();

        // Total Section
        cb.setLineWidth(1f);
        cb.setRGBColorStroke(226, 232, 240);
        cb.moveTo(350, y - 10);
        cb.lineTo(550, y - 10);
        cb.stroke();

        cb.beginText();
        cb.setFontAndSize(bfBold, 12);
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "TOTAL DUE", 350, y - 30, 0);
        cb.setRGBColorFill(37, 99, 235);
        cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, "INR " + String.format("%.2f", invoice.getTotalAmount()), 540, y - 30, 0);
        cb.endText();

        // Payment Info
        if ("PAID".equals(invoice.getStatus())) {
            cb.beginText();
            cb.setFontAndSize(bfBold, 10);
            cb.setRGBColorFill(34, 197, 94); // Success Green
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "PAYMENT COMPLETED VIA " + (invoice.getPaymentMethod() != null ? invoice.getPaymentMethod() : "CASH"), 50, y - 70, 0);
            cb.endText();
        }

        // Footer
        cb.beginText();
        cb.setFontAndSize(bfNormal, 8);
        cb.setRGBColorFill(148, 163, 184);
        cb.showTextAligned(PdfContentByte.ALIGN_CENTER, "This is an electronically generated statement. No signature required.", 300, 40, 0);
        cb.showTextAligned(PdfContentByte.ALIGN_CENTER, "UPHI Clinical Network • Verified Digital Billing", 300, 30, 0);
        cb.endText();

        document.close();
        return out.toByteArray();
    }

    public byte[] generateDischargeSummary(Patient patient, java.util.Map<String, String> dischargeData) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(com.lowagie.text.PageSize.A4, 50, 50, 50, 50);
        PdfWriter writer = PdfWriter.getInstance(document, out);
        document.open();
        PdfContentByte cb = writer.getDirectContent();
        BaseFont bfBold = BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.CP1252, false);
        BaseFont bfNormal = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, false);
        float pageWidth = document.getPageSize().getWidth();
        float y = document.getPageSize().getHeight() - 50;

        // Header
        cb.beginText();
        cb.setFontAndSize(bfBold, 20);
        cb.setRGBColorFill(37, 99, 235);
        cb.showTextAligned(PdfContentByte.ALIGN_CENTER, "UPHI CLINICAL NETWORK", pageWidth / 2, y, 0);
        y -= 22;
        cb.setFontAndSize(bfBold, 14);
        cb.setRGBColorFill(15, 23, 42);
        cb.showTextAligned(PdfContentByte.ALIGN_CENTER, "DISCHARGE SUMMARY", pageWidth / 2, y, 0);
        y -= 30;
        cb.endText();

        // Divider
        cb.setLineWidth(1.5f);
        cb.setRGBColorStroke(37, 99, 235);
        cb.moveTo(50, y);
        cb.lineTo(pageWidth - 50, y);
        cb.stroke();
        y -= 30;

        // Patient Info
        cb.beginText();
        cb.setFontAndSize(bfBold, 11);
        cb.setRGBColorFill(71, 85, 105);
        String[][] info = {
            {"Patient Name", patient.getFullName() != null ? patient.getFullName() : "N/A"},
            {"ABHA Address", patient.getAbhaAddress() != null ? patient.getAbhaAddress() : "N/A"},
            {"Gender / DOB", (patient.getGender() != null ? patient.getGender() : "N/A") + " / " + (patient.getDob() != null ? patient.getDob() : "N/A")},
            {"Blood Group", patient.getBloodGroup() != null ? patient.getBloodGroup() : "N/A"},
            {"Admission Date", dischargeData.getOrDefault("admissionDate", "N/A")},
            {"Discharge Date", dischargeData.getOrDefault("dischargeDate", "N/A")},
        };
        for (String[] row : info) {
            cb.setFontAndSize(bfBold, 10);
            cb.setRGBColorFill(148, 163, 184);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, row[0].toUpperCase(), 60, y, 0);
            cb.setFontAndSize(bfNormal, 11);
            cb.setRGBColorFill(15, 23, 42);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, row[1], 220, y, 0);
            y -= 20;
        }
        cb.endText();
        y -= 15;

        // Sections
        String[][] sections = {
            {"Diagnosis", dischargeData.getOrDefault("diagnosis", "N/A")},
            {"Treatment Given", dischargeData.getOrDefault("treatment", "N/A")},
            {"Condition at Discharge", dischargeData.getOrDefault("conditionAtDischarge", "Stable")},
            {"Follow-Up Instructions", dischargeData.getOrDefault("followUp", "Review in 7 days")},
            {"Medications on Discharge", dischargeData.getOrDefault("medications", "As prescribed")},
        };
        for (String[] section : sections) {
            cb.beginText();
            cb.setFontAndSize(bfBold, 11);
            cb.setRGBColorFill(37, 99, 235);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, section[0], 60, y, 0);
            y -= 18;
            cb.setFontAndSize(bfNormal, 10);
            cb.setRGBColorFill(15, 23, 42);
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, section[1], 60, y, 0);
            cb.endText();
            y -= 28;
        }

        // Footer
        cb.beginText();
        cb.setFontAndSize(bfNormal, 8);
        cb.setRGBColorFill(148, 163, 184);
        cb.showTextAligned(PdfContentByte.ALIGN_CENTER, "This is an electronically generated document. No signature required.", pageWidth / 2, 40, 0);
        cb.showTextAligned(PdfContentByte.ALIGN_CENTER, "UPHI Clinical Network • Verified Healthcare", pageWidth / 2, 30, 0);
        cb.endText();

        document.close();
        return out.toByteArray();
    }

    public byte[] generatePrescriptionPdf(Patient patient, com.uphi.backend.domain.Prescription prescription) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(com.lowagie.text.PageSize.A4, 50, 50, 50, 50);
        PdfWriter writer = PdfWriter.getInstance(document, out);
        document.open();
        PdfContentByte cb = writer.getDirectContent();
        BaseFont bfBold = BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.CP1252, false);
        BaseFont bfNormal = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, false);
        float pageWidth = document.getPageSize().getWidth();
        float y = document.getPageSize().getHeight() - 50;

        // Header
        cb.beginText();
        cb.setFontAndSize(bfBold, 20);
        cb.setRGBColorFill(37, 99, 235);
        cb.showTextAligned(PdfContentByte.ALIGN_CENTER, "UPHI CLINICAL NETWORK", pageWidth / 2, y, 0);
        y -= 22;
        cb.setFontAndSize(bfBold, 14);
        cb.setRGBColorFill(15, 23, 42);
        cb.showTextAligned(PdfContentByte.ALIGN_CENTER, "PRESCRIPTION", pageWidth / 2, y, 0);
        y -= 30;
        cb.endText();

        // Divider
        cb.setLineWidth(1.5f);
        cb.setRGBColorStroke(37, 99, 235);
        cb.moveTo(50, y);
        cb.lineTo(pageWidth - 50, y);
        cb.stroke();
        y -= 30;

        // Patient + Doctor Info
        cb.beginText();
        cb.setFontAndSize(bfBold, 10);
        cb.setRGBColorFill(148, 163, 184);
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "PATIENT", 60, y, 0);
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "PRESCRIBING DOCTOR", 320, y, 0);
        y -= 18;
        cb.setFontAndSize(bfBold, 12);
        cb.setRGBColorFill(15, 23, 42);
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, patient.getFullName() != null ? patient.getFullName() : "N/A", 60, y, 0);
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, prescription.getDoctorName() != null ? prescription.getDoctorName() : "N/A", 320, y, 0);
        y -= 16;
        cb.setFontAndSize(bfNormal, 10);
        cb.setRGBColorFill(100, 116, 139);
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, patient.getAbhaAddress() != null ? patient.getAbhaAddress() : "", 60, y, 0);
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "Date: " + (prescription.getDate() != null ? prescription.getDate() : "N/A"), 320, y, 0);
        y -= 30;

        // Diagnosis
        cb.setFontAndSize(bfBold, 11);
        cb.setRGBColorFill(37, 99, 235);
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "DIAGNOSIS", 60, y, 0);
        y -= 16;
        cb.setFontAndSize(bfNormal, 11);
        cb.setRGBColorFill(15, 23, 42);
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, prescription.getDiagnosis() != null ? prescription.getDiagnosis() : "N/A", 60, y, 0);
        y -= 30;

        // Medications Table Header
        cb.setFontAndSize(bfBold, 11);
        cb.setRGBColorFill(37, 99, 235);
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "MEDICATIONS", 60, y, 0);
        y -= 20;
        cb.setFontAndSize(bfBold, 9);
        cb.setRGBColorFill(148, 163, 184);
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "MEDICATION", 60, y, 0);
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "DOSAGE", 220, y, 0);
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "FREQUENCY", 330, y, 0);
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "DURATION", 450, y, 0);
        cb.endText();
        y -= 5;
        cb.setLineWidth(0.5f);
        cb.setRGBColorStroke(226, 232, 240);
        cb.moveTo(60, y);
        cb.lineTo(pageWidth - 60, y);
        cb.stroke();
        y -= 18;

        // Medication rows
        if (prescription.getMedications() != null) {
            for (com.uphi.backend.domain.Prescription.PrescribedMed med : prescription.getMedications()) {
                cb.beginText();
                cb.setFontAndSize(bfNormal, 10);
                cb.setRGBColorFill(15, 23, 42);
                cb.showTextAligned(PdfContentByte.ALIGN_LEFT, med.getName() != null ? med.getName() : "N/A", 60, y, 0);
                cb.showTextAligned(PdfContentByte.ALIGN_LEFT, med.getDosage() != null ? med.getDosage() : "N/A", 220, y, 0);
                cb.showTextAligned(PdfContentByte.ALIGN_LEFT, med.getFrequency() != null ? med.getFrequency() : "N/A", 330, y, 0);
                cb.showTextAligned(PdfContentByte.ALIGN_LEFT, med.getDuration() != null ? med.getDuration() : "N/A", 450, y, 0);
                cb.endText();
                y -= 18;
            }
        }
        y -= 15;

        // Instructions
        cb.beginText();
        cb.setFontAndSize(bfBold, 11);
        cb.setRGBColorFill(37, 99, 235);
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "INSTRUCTIONS", 60, y, 0);
        y -= 16;
        cb.setFontAndSize(bfNormal, 10);
        cb.setRGBColorFill(15, 23, 42);
        cb.showTextAligned(PdfContentByte.ALIGN_LEFT, prescription.getInstructions() != null ? prescription.getInstructions() : "Follow-up as advised", 60, y, 0);
        cb.endText();

        // Footer
        cb.beginText();
        cb.setFontAndSize(bfNormal, 8);
        cb.setRGBColorFill(148, 163, 184);
        cb.showTextAligned(PdfContentByte.ALIGN_CENTER, "This is an electronically generated prescription. Valid without stamp.", pageWidth / 2, 40, 0);
        cb.showTextAligned(PdfContentByte.ALIGN_CENTER, "UPHI Clinical Network • Digital Healthcare", pageWidth / 2, 30, 0);
        cb.endText();

        document.close();
        return out.toByteArray();
    }
}
