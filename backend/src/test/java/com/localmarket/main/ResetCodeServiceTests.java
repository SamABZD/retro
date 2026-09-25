package com.localmarket.main;

import com.localmarket.main.service.auth.ResetCodeService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ResetCodeServiceTests {
    private final ResetCodeService service = new ResetCodeService();

    @Test
    void codeIsSixDigitsAndCanBeUsedOnlyOnce() {
        String code = service.generateCode("buyer@example.com");
        assertTrue(code.matches("\\d{6}"));
        assertTrue(service.verifyCode("buyer@example.com", code));
        assertFalse(service.verifyCode("buyer@example.com", code));
    }

    @Test
    void fiveIncorrectAttemptsInvalidateCode() {
        String code = service.generateCode("seller@example.com");
        String wrongCode = code.equals("000000") ? "999999" : "000000";
        for (int attempt = 0; attempt < 5; attempt++) {
            assertFalse(service.verifyCode("seller@example.com", wrongCode));
        }
        assertFalse(service.verifyCode("seller@example.com", code));
    }

    @Test
    void failedDeliveryCanInvalidateCode() {
        String code = service.generateCode("buyer@example.com");
        service.invalidateCode("buyer@example.com");
        assertFalse(service.verifyCode("buyer@example.com", code));
    }
}
