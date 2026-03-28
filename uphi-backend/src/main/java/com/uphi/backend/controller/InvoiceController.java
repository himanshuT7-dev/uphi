package com.uphi.backend.controller;

import com.uphi.backend.domain.Invoice;
import com.uphi.backend.repository.InvoiceRepository;
import com.uphi.backend.service.PdfService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceRepository invoiceRepository;
    private final PdfService pdfService;

    public InvoiceController(InvoiceRepository invoiceRepository, PdfService pdfService) {
        this.invoiceRepository = invoiceRepository;
        this.pdfService = pdfService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MAIN_ADMIN', 'HOSPITAL', 'RECEPTIONIST')")
    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAIN_ADMIN', 'HOSPITAL', 'PATIENT')")
    public List<Invoice> getPatientInvoices(@PathVariable String patientId) {
        return invoiceRepository.findByPatientId(patientId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MAIN_ADMIN', 'HOSPITAL', 'RECEPTIONIST')")
    public Invoice createInvoice(@RequestBody Invoice invoice) {
        return invoiceRepository.save(invoice);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAIN_ADMIN', 'HOSPITAL', 'RECEPTIONIST')")
    public ResponseEntity<?> updateInvoiceStatus(@PathVariable String id, @RequestBody java.util.Map<String, String> body) {
        return invoiceRepository.findById(id).map(inv -> {
            inv.setStatus(body.get("status"));
            if (body.containsKey("paymentMethod")) {
                inv.setPaymentMethod(body.get("paymentMethod"));
            }
            return ResponseEntity.ok(invoiceRepository.save(inv));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAIN_ADMIN')")
    public ResponseEntity<?> deleteInvoice(@PathVariable String id) {
        invoiceRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAIN_ADMIN', 'HOSPITAL', 'PATIENT')")
    public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable String id) {
        return invoiceRepository.findById(id).map(inv -> {
            try {
                byte[] pdf = pdfService.generateInvoicePdf(inv);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=invoice_" + id + ".pdf")
                        .contentType(MediaType.APPLICATION_PDF)
                        .body(pdf);
            } catch (Exception e) {
                return ResponseEntity.internalServerError().<byte[]>build();
            }
        }).orElse(ResponseEntity.notFound().build());
    }
}
