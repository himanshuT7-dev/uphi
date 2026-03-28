package com.uphi.backend.dto;

public class AuthResponse {
    private String token;
    private String username;
    private String role;
    private String hospitalId;

    public AuthResponse(String token, String username, String role, String hospitalId) {
        this.token = token;
        this.username = username;
        this.role = role;
        this.hospitalId = hospitalId;
    }

    public String getToken() {
        return token;
    }

    public String getUsername() {
        return username;
    }

    public String getRole() {
        return role;
    }

    public String getHospitalId() {
        return hospitalId;
    }
}
