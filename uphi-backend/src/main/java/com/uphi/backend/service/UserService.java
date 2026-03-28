package com.uphi.backend.service;

import com.uphi.backend.domain.Role;
import com.uphi.backend.domain.User;
import com.uphi.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> getStaff() {
        return userRepository.findByRoleNot(Role.PATIENT).stream()
                .map(u -> {
                    u.setPasswordHash(null);
                    return u;
                })
                .collect(Collectors.toList());
    }
}
