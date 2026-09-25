package com.localmarket.main.security;

import com.localmarket.main.entity.user.Role;
import com.localmarket.main.entity.user.User;
import com.localmarket.main.repository.producer.ProducerApplicationRepository;
import com.localmarket.main.repository.user.UserRepository;
import com.localmarket.main.service.auth.JwtService;
import com.localmarket.main.util.CookieUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final CookieUtil cookieUtil;
    private final ProducerApplicationRepository applicationRepository;

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String jwt = cookieUtil.getJwtFromCookies(request);
        if (jwt != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                authenticate(jwt);
            } catch (RuntimeException invalidToken) {
                SecurityContextHolder.clearContext();
                log.debug("Ignoring invalid authentication cookie on {}: {}",
                    request.getRequestURI(), invalidToken.getMessage());
            }
        }
        filterChain.doFilter(request, response);
    }

    private void authenticate(String jwt) {
        if (!jwtService.isTokenValid(jwt)) {
            return;
        }

        Long userId = jwtService.extractUserId(jwt);
        User user = userRepository.findById(userId).orElseThrow();
        String applicationStatus = user.getRole() == Role.CUSTOMER
            ? applicationRepository.findByCustomer(user)
                .map(application -> application.getStatus().name())
                .orElse("NO_APPLICATION")
            : null;

        CustomUserDetails details = CustomUserDetails.builder()
            .id(userId)
            .email(user.getEmail())
            .username(user.getUsername())
            .firstname(user.getFirstname())
            .lastname(user.getLastname())
            .role(user.getRole())
            .tokenVersion(user.getTokenVersion())
            .password("")
            .authorities(Collections.singletonList(new SimpleGrantedAuthority(user.getRole().name())))
            .applicationStatus(applicationStatus)
            .build();

        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities()));
    }
}
