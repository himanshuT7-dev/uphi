package com.uphi.backend.service;
 
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
 
import jakarta.annotation.PostConstruct;
 
@Service
public class SmsService {
 
    private static final Logger logger = LoggerFactory.getLogger(SmsService.class);
 
    @Value("${twilio.account-sid}")
    private String accountSid;
 
    @Value("${twilio.auth-token}")
    private String authToken;
 
    @Value("${twilio.from-number}")
    private String fromNumber;
 
    @PostConstruct
    public void init() {
        if (!accountSid.startsWith("ACXXX")) {
            Twilio.init(accountSid, authToken);
            logger.info("Twilio initialized with Account SID: {}", accountSid);
        } else {
            logger.warn("Twilio skipped initialization (Placeholder detected).");
        }
    }
 
    public void sendSms(String to, String body) {
        if (accountSid.startsWith("ACXXX")) {
            logger.info("DEV MODE: SMS to {}: {}", to, body);
            System.out.println("=====================================================");
            System.out.println("DEV SMS BYPASS: " + to);
            System.out.println("MESSAGE: " + body);
            System.out.println("=====================================================");
            return;
        }
 
        try {
            Message message = Message.creator(
                    new PhoneNumber(to),
                    new PhoneNumber(fromNumber),
                    body)
                .create();
            logger.info("SMS sent successfully. SID: {}", message.getSid());
        } catch (Exception e) {
            logger.error("Failed to send SMS to {}: {}", to, e.getMessage());
            throw new RuntimeException("SMS delivery failed: " + e.getMessage());
        }
    }
}
