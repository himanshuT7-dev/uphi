package com.uphi.backend.repository;

import com.uphi.backend.domain.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;
import java.util.List;
import com.uphi.backend.domain.Role;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByUsername(String username);
    Optional<User> findByMobile(String mobile);
    Optional<User> findByEmail(String email);
    List<User> findByRoleNot(Role role);

}
