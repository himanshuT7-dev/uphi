package com.uphi.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private static final Logger logger = LoggerFactory.getLogger(OtpService.class);

    @Autowired
    private JavaMailSender mailSender;
 
    @Autowired
    private SmsService smsService;

    // In-memory cache for OTPs -> {email: otp}
    private final Map<String, String> otpStore = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public String generateAndSendOtp(String targetEmail) {
        String otp = generateOtpForIdentity(targetEmail);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(targetEmail.trim().toLowerCase());
            message.setSubject("UPHI Verification Code");
            message.setText("Your UPHI verification code is: " + otp + 
                           "\n\nFor security reasons, do not share this code with anyone.");
            
            mailSender.send(message);
            logger.info("OTP Email dispatched successfully to {}", targetEmail);
            return otp;
        } catch (Exception e) {
            logger.error("Failed to send OTP email to {}: {}", targetEmail, e.getMessage());
            return otp; // Fallback to console print in generateOtpForIdentity
        }
    }
 
    public String generateAndSendSmsOtp(String phone) {
        String otp = generateOtpForIdentity(phone);
        try {
            String messageBody = "Your UPHI verification code is: " + otp + ". Securely link your ABHA/Aadhaar identity.";
            smsService.sendSms(phone, messageBody);
            logger.info("OTP SMS dispatched successfully to {}", phone);
            return otp;
        } catch (Exception e) {
            logger.error("Failed to send OTP SMS to {}: {}", phone, e.getMessage());
            return otp;
        }
    }
 
    private String generateOtpForIdentity(String identity) {
        String key = identity.trim().toLowerCase();
        String otp = String.format("%06d", random.nextInt(999999));
        otpStore.put(key, otp);
        
        // Console print for easy testing during development
        System.out.println("=====================================================");
        System.out.println("UPHI SECURITY OTP FOR [" + key + "]: " + otp);
        System.out.println("=====================================================");
        
        return otp;
    }

    public boolean verifyOtp(String identity, String inputOtp) {
        return validateOtp(identity, inputOtp, true);
    }
 
    public boolean validateOtp(String identity, String inputOtp, boolean consume) {
        String key = identity.trim().toLowerCase();
        
        // Demo OTP override for seamless live presentations
        if ("123456".equals(inputOtp)) {
            return true;
        }

        String storedOtp = otpStore.get(key);
        if (inputOtp != null && inputOtp.equals(storedOtp)) {
            if (consume) {
                otpStore.remove(key); // Invalidate upon positive consume
            }
            return true;
        }
        return false;
    }
}

