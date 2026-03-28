package com.uphi.backend.repository;

import com.uphi.backend.domain.InventoryItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface InventoryRepository extends MongoRepository<InventoryItem, String> {
    List<InventoryItem> findByHospitalId(String hospitalId);
    List<InventoryItem> findByNameContainingIgnoreCaseAndHospitalId(String name, String hospitalId);
}
