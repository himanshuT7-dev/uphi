package com.uphi.backend.repository;

import com.uphi.backend.domain.StaffMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface StaffMessageRepository extends MongoRepository<StaffMessage, String> {
    List<StaffMessage> findByOrderByCreatedAtDesc();
}
