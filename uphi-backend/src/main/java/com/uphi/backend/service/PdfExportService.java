package com.uphi.backend.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfWriter;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.uphi.backend.domain.Patient;
import com.uphi.backend.domain.models.Condition;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.List;

@Service
public class PdfExportService {

    public byte[] generatePatientProfilePdf(Patient patient) throws Exception {
        Document document = new Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, out);

        document.open();

        // 1. Header
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, BaseColor.BLUE);
        Paragraph title = new Paragraph("UPHI Universal Patient Profile", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);
        document.add(new Paragraph("\n"));

        // 2. Generate and Add QR Code (Contains Full JSON payload for cross-hospital validity)
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        java.util.Map<String, Object> qrDataMap = new java.util.HashMap<>();
        qrDataMap.put("id", patient.getId());
        qrDataMap.put("name", patient.getFullName());
        qrDataMap.put("dob", patient.getDob());
        qrDataMap.put("gender", patient.getGender());
        qrDataMap.put("bloodGroup", patient.getBloodGroup());
        qrDataMap.put("abha", patient.getAbhaAddress());
        qrDataMap.put("phone", patient.getPhone());
        
        // Deep Clinical Data
        qrDataMap.put("allergies", patient.getAllergies());
        qrDataMap.put("conditions", patient.getConditions());
        qrDataMap.put("vitals", patient.getVitals());
        qrDataMap.put("medications", patient.getMedications());
        qrDataMap.put("risk", patient.getRisk());

        String qrData = mapper.writeValueAsString(qrDataMap);
        
        QRCodeWriter barcodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = barcodeWriter.encode(qrData, BarcodeFormat.QR_CODE, 200, 200);
        ByteArrayOutputStream pngOut = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOut);

        Image qrImage = Image.getInstance(pngOut.toByteArray());
        qrImage.setAlignment(Element.ALIGN_CENTER);
        document.add(qrImage);
        document.add(new Paragraph("\n"));

        // 3. Demographics
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, BaseColor.BLACK);
        document.add(new Paragraph("Patient Demographics", headerFont));
        document.add(new Paragraph("Name: " + patient.getFullName()));
        document.add(new Paragraph("ABHA Array ID: " + patient.getAbhaAddress()));
        document.add(new Paragraph("Mobile: " + patient.getPhone()));
        document.add(new Paragraph("Blood Group: " + patient.getBloodGroup()));
        document.add(new Paragraph("\n"));

        // 4. Historical Diagnoses
        document.add(new Paragraph("Formally Registered Diagnoses", headerFont));
        List<Condition> conditions = patient.getConditions();
        if (conditions != null && !conditions.isEmpty()) {
            for (Condition cond : conditions) {
                document.add(new Paragraph("- " + cond.getName() + " (Status: " + cond.getStatus() + ")"));
            }
        } else {
            document.add(new Paragraph("No pre-existing conditions reported."));
        }

        document.close();
        return out.toByteArray();
    }
}
