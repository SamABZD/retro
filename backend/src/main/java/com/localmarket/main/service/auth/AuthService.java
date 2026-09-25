package com.localmarket.main.service.auth;

import com.localmarket.main.dto.auth.AuthRequest;
import com.localmarket.main.dto.auth.AuthResponse;
import com.localmarket.main.dto.auth.RegisterRequest;
import com.localmarket.main.entity.user.User;
import com.localmarket.main.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import org.springframework.security.authentication.BadCredentialsException;
import com.localmarket.main.entity.user.Role;
import org.springframework.transaction.annotation.Transactional;
import com.localmarket.main.exception.ApiException;
import com.localmarket.main.exception.ErrorType;
import com.localmarket.main.repository.token.TokenRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import com.localmarket.main.dto.auth.AuthServiceResult;
import com.localmarket.main.service.email.EmailService;
import jakarta.mail.MessagingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Map;
import java.util.HashMap;
import com.localmarket.main.websocket.NotificationWebSocketHandler;
import org.springframework.security.core.context.SecurityContextHolder;
import com.localmarket.main.service.auth.ResetCodeService;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TokenRepository tokenRepository;
    private final EmailService emailService;
    private final NotificationWebSocketHandler webSocketHandler;
    private final ResetCodeService resetCodeService;
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    public AuthServiceResult register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ApiException(ErrorType.EMAIL_ALREADY_EXISTS, "Email already exists");
        }

        // Public registration is always a buyer account. Privileged roles are
        // managed by dedicated authenticated admin/seller-application flows.
        Role roleToAssign = Role.CUSTOMER;

        User user = new User();
        user.setUsername(request.getUsername());
        user.setFirstname(request.getFirstname());
        user.setLastname(request.getLastname());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setLastLogin(LocalDateTime.now());
        user.setRole(roleToAssign);
        
        User savedUser = userRepository.save(user);
        String token = jwtService.generateToken(savedUser);
        
        // Send welcome email
        try {
            emailService.sendHtmlEmail(
                savedUser.getEmail(),
                "Welcome to Retro!",
                savedUser.getFirstname(),
                "welcome-email",
                null,
                new HashMap<>()
            );
        } catch (Exception e) {
            log.error("Failed to send welcome email to {}: {}", savedUser.getEmail(), e.getMessage());
        }
        
        tokenRepository.storeToken(token, savedUser.getUserId());
        
        return new AuthServiceResult(
            AuthResponse.builder()
                .status(200)
                .message("Registration successful")
                .build(),
            token
        );
    }

    public AuthServiceResult login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("Invalid email or password"));
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        user.setTokenVersion(nextTokenVersion(user));
        String token = jwtService.generateToken(user);
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        tokenRepository.storeToken(token, user.getUserId());
        
        return new AuthServiceResult(
            AuthResponse.builder()
                .status(200)
                .message("Login successful")
                .build(),
            token
        );
    }

    @Transactional
    public void logout(String token, String userEmail) {
        Long userId = jwtService.extractUserId(token);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorType.USER_NOT_FOUND,
                        "User with id " + userId + " not found"));

        user.setTokenVersion(nextTokenVersion(user));
        userRepository.save(user);
        tokenRepository.invalidateToken(token);

        // Close any active WebSocket sessions for this user
        try {
            webSocketHandler.closeUserSessions(userEmail);
        } catch (Exception e) {
            log.warn("Failed to close WebSocket session for user {}: {}", userEmail, e.getMessage());
        }

        // Clear the SecurityContext
        SecurityContextHolder.clearContext();
    }

    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ApiException(ErrorType.USER_NOT_FOUND, 
                "No account found with this email"));

        // Generate reset code
        String resetCode = resetCodeService.generateCode(email);
        
        // Send email with reset code
        try {
            Map<String, Object> templateVariables = new HashMap<String, Object>();
            templateVariables.put("resetCode", resetCode);
            
            emailService.sendHtmlEmail(
                email,
                "Password Reset Code",
                user.getFirstname(),
                "password-reset-email",
                null,
                templateVariables
            );
        } catch (Exception e) {
            resetCodeService.invalidateCode(email);
            log.warn("Password reset email could not be sent to {}: {}", email, e.getMessage());
            throw new ApiException(ErrorType.EMAIL_SENDING_FAILED, 
                "Failed to send reset code email");
        }
    }

    public void verifyAndResetPassword(String email, String code, String newPassword) {
        // Validate before consuming the one-time code.
        if (newPassword == null || newPassword.trim().length() < 6) {
            throw new ApiException(ErrorType.INVALID_PASSWORD,
                "New password must be at least 6 characters long");
        }
        if (!resetCodeService.verifyCode(email, code)) {
            throw new ApiException(ErrorType.INVALID_TOKEN, 
                "Invalid or expired reset code");
        }

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ApiException(ErrorType.USER_NOT_FOUND, 
                "User not found"));

        // Update password and invalidate existing tokens
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setTokenVersion(nextTokenVersion(user));
        userRepository.save(user);
    }

    private int nextTokenVersion(User user) {
        return user.getTokenVersion() == null ? 1 : user.getTokenVersion() + 1;
    }
}
