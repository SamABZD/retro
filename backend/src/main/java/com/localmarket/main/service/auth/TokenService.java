package com.localmarket.main.service.auth;

import org.springframework.stereotype.Service;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import com.localmarket.main.entity.AccessToken.AccessToken;
import com.localmarket.main.repository.AccessToken.AccessTokenRepository;

import java.time.LocalDateTime;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;

// Retained for compatibility with legacy guest-order access tokens. The active
// authenticated checkout does not create or expose these tokens.
@Service
@RequiredArgsConstructor
public class TokenService {
    
    private final AccessTokenRepository accessTokenRepository;

    public String createCheckoutToken(String email) {
        AccessToken token = new AccessToken();
        token.setToken(UUID.randomUUID().toString());
        token.setEmail(email);
        token.setExpiresAt(LocalDateTime.now().plusDays(7));
        token.setCreatedAt(LocalDateTime.now());
        accessTokenRepository.save(token);
        return token.getToken();
    }

    public String validateAccessToken(String token) {
        return accessTokenRepository
            .findByTokenAndExpiresAtAfter(token, LocalDateTime.now())
            .map(AccessToken::getEmail)
            .orElse(null);
    }

    @Scheduled(fixedRate = 3600000) // Run every hour
    @Transactional
    public void cleanupExpiredTokens() {
        accessTokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());
    }
} 
