package com.uphi.backend.service;

import com.uphi.backend.domain.InventoryItem;
import com.uphi.backend.repository.InventoryRepository;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class PharmacyService {

    private final InventoryRepository inventoryRepository;

    public PharmacyService(InventoryRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    public List<InventoryItem> getInventory(String hospitalId) {
        return inventoryRepository.findByHospitalId(hospitalId);
    }

    public List<InventoryItem> searchInventory(String query, String hospitalId) {
        return inventoryRepository.findByNameContainingIgnoreCaseAndHospitalId(query, hospitalId);
    }

    public InventoryItem addOrUpdateItem(InventoryItem item) {
        item.setLastUpdated(Instant.now());
        return inventoryRepository.save(item);
    }

    public void deleteItem(String id) {
        inventoryRepository.deleteById(id);
    }

    public Optional<InventoryItem> updateStock(String id, int adjustment) {
        return inventoryRepository.findById(id).map(item -> {
            item.setStockQuantity(item.getStockQuantity() + adjustment);
            item.setLastUpdated(Instant.now());
            return inventoryRepository.save(item);
        });
    }

    public List<InventoryItem> getLowStockItems(String hospitalId) {
        return inventoryRepository.findByHospitalId(hospitalId).stream()
                .filter(item -> item.getStockQuantity() <= item.getThreshold())
                .toList();
    }
}
