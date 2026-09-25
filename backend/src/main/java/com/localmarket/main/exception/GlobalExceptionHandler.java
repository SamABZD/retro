package com.localmarket.main.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.csrf.InvalidCsrfTokenException;
import org.springframework.security.web.csrf.MissingCsrfTokenException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import com.localmarket.main.dto.error.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.server.ResponseStatusException;

@ControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(ApiException ex, HttpServletRequest request) {
        log.error("API Exception: {} on path: {}", ex.getMessage(), request.getRequestURI());
        return ResponseEntity
            .status(ex.getErrorType().getStatus())
            .body(error(ex.getErrorType().getStatus(), ex.getErrorType().name(), ex.getMessage(), request.getRequestURI()));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(
            AuthenticationException ex, HttpServletRequest request) {
        log.error("Authentication Exception: {} on path: {}", ex.getMessage(), request.getRequestURI());
        return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(error(HttpStatus.UNAUTHORIZED, "AUTHENTICATION_FAILED", "Invalid email or password", request.getRequestURI()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(
            AccessDeniedException ex, HttpServletRequest request) {
        log.error("Access Denied Exception: {} on path: {}", ex.getMessage(), request.getRequestURI());
        return ResponseEntity
            .status(HttpStatus.FORBIDDEN)
            .body(error(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "You do not have permission to perform this action", request.getRequestURI()));
    }

    @ExceptionHandler({InvalidCsrfTokenException.class, MissingCsrfTokenException.class})
    public ResponseEntity<ErrorResponse> handleCsrfException(Exception ex, HttpServletRequest request) {
        log.error("CSRF Exception: {} on path: {}", ex.getMessage(), request.getRequestURI());
        return ResponseEntity
            .status(HttpStatus.FORBIDDEN)
            .body(error(HttpStatus.FORBIDDEN, "INVALID_CSRF_TOKEN", "Security token is missing or expired", request.getRequestURI()));
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .map(fieldError -> fieldError.getDefaultMessage())
            .findFirst()
            .orElse("Request validation failed");
        String path = request.getDescription(false).replace("uri=", "");
        return ResponseEntity.badRequest().body(
            error(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", message, path));
    }

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {
        String path = request.getDescription(false).replace("uri=", "");
        return ResponseEntity.badRequest().body(
            error(HttpStatus.BAD_REQUEST, "INVALID_REQUEST",
                "Request contains invalid or unsupported fields", path));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex, HttpServletRequest request) {
        log.error("Unexpected error: {} on path: {}", ex.getMessage(), request.getRequestURI(), ex);
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(error(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", "An unexpected error occurred", request.getRequestURI()));
    }

    private ErrorResponse error(HttpStatus status, String code, String message, String path) {
        return ErrorResponse.builder()
            .status(status.value())
            .code(code)
            .message(message)
            .path(path)
            .timestamp(java.time.LocalDateTime.now())
            .build();
    }
} 
