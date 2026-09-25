package com.localmarket.main.service.auth;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Map;
import java.security.SecureRandom;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ResetCodeService {
    private static final int MAX_ATTEMPTS = 5;
    private final SecureRandom random = new SecureRandom();
    private final Map<String, ResetCodeEntry> resetCodes = new ConcurrentHashMap<>();
    
    private static class ResetCodeEntry {
        final String code;
        final LocalDateTime expiresAt;
        final int failedAttempts;
        
        ResetCodeEntry(String code, LocalDateTime expiresAt, int failedAttempts) {
            this.code = code;
            this.expiresAt = expiresAt;
            this.failedAttempts = failedAttempts;
        }
    }
    
    public String generateCode(String email) {
        String code = String.format("%06d", random.nextInt(1_000_000));
        resetCodes.put(email, new ResetCodeEntry(code, LocalDateTime.now().plusMinutes(15), 0));
        return code;
    }

    public void invalidateCode(String email) {
        resetCodes.remove(email);
    }
    
    public boolean verifyCode(String email, String code) {
        AtomicBoolean verified = new AtomicBoolean(false);
        resetCodes.computeIfPresent(email, (key, entry) -> {
            if (!LocalDateTime.now().isBefore(entry.expiresAt)) {
                return null;
            }
            if (entry.code.equals(code)) {
                verified.set(true);
                return null;
            }
            int failedAttempts = entry.failedAttempts + 1;
            return failedAttempts >= MAX_ATTEMPTS
                ? null : new ResetCodeEntry(entry.code, entry.expiresAt, failedAttempts);
        });
        return verified.get();
    }
    
    // Cleanup expired codes (call this periodically)
    public void cleanupExpiredCodes() {
        LocalDateTime now = LocalDateTime.now();
        resetCodes.entrySet().removeIf(entry -> now.isAfter(entry.getValue().expiresAt));
    }

    @Scheduled(fixedRate = 300000) // Run every 5 minutes
    public void scheduledCleanup() {
        cleanupExpiredCodes();
    }
} 
