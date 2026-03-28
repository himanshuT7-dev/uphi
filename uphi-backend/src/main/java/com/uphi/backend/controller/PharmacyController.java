package com.uphi.backend.controller;

import com.uphi.backend.domain.InventoryItem;
import com.uphi.backend.domain.User;
import com.uphi.backend.repository.UserRepository;
import com.uphi.backend.service.PharmacyService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pharmacy")
public class PharmacyController {

    private final PharmacyService pharmacyService;
    private final UserRepository userRepository;

    public PharmacyController(PharmacyService pharmacyService, UserRepository userRepository) {
        this.pharmacyService = pharmacyService;
        this.userRepository = userRepository;
    }

    private String getHospitalId(Principal principal) {
        return userRepository.findByUsername(principal.getName())
                .map(User::getHospitalId)
                .orElse(null);
    }

    @GetMapping("/inventory")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAIN_ADMIN', 'HOSPITAL', 'DOCTOR', 'RECEPTIONIST')")
    public ResponseEntity<List<InventoryItem>> getInventory(Principal principal) {
        String hospitalId = getHospitalId(principal);
        if (hospitalId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(pharmacyService.getInventory(hospitalId));
    }

    @PostMapping("/inventory")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAIN_ADMIN', 'HOSPITAL', 'RECEPTIONIST', 'DOCTOR')")
    public ResponseEntity<InventoryItem> addItem(@RequestBody InventoryItem item, Principal principal) {
        String hospitalId = getHospitalId(principal);
        if (hospitalId == null) return ResponseEntity.status(401).build();
        item.setHospitalId(hospitalId);
        return ResponseEntity.ok(pharmacyService.addOrUpdateItem(item));
    }

    @PutMapping("/inventory/{id}/stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAIN_ADMIN', 'HOSPITAL', 'RECEPTIONIST')")
    public ResponseEntity<InventoryItem> updateStock(@PathVariable String id, @RequestBody Map<String, Integer> body) {
        return pharmacyService.updateStock(id, body.getOrDefault("adjustment", 0))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/inventory/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAIN_ADMIN', 'HOSPITAL', 'RECEPTIONIST')")
    public ResponseEntity<Void> deleteItem(@PathVariable String id) {
        pharmacyService.deleteItem(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAIN_ADMIN', 'HOSPITAL', 'DOCTOR', 'RECEPTIONIST')")
    public ResponseEntity<List<InventoryItem>> getLowStock(Principal principal) {
        String hospitalId = getHospitalId(principal);
        if (hospitalId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(pharmacyService.getLowStockItems(hospitalId));
    }
}
