package com.localmarket.main.service.payment;

import com.localmarket.main.dto.payment.PaymentResponse;
import com.localmarket.main.entity.payment.Payment;
import com.localmarket.main.entity.payment.PaymentStatus;
import com.localmarket.main.repository.payment.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.UUID;
import com.localmarket.main.entity.payment.PaymentMethod;

@Service
@RequiredArgsConstructor
public class PaymentService {
    private final PaymentRepository paymentRepository;

    /**
     * Records the result of the local demo checkout. No card, wallet, or bank
     * information is accepted or persisted by this application.
     */
    public PaymentResponse recordSimulatedPayment(BigDecimal amount, Long orderId) {
        Payment payment = new Payment();
        payment.setPaymentMethod(PaymentMethod.SIMULATED);
        payment.setTransactionId("DEMO_" + UUID.randomUUID());
        payment.setPaymentStatus(PaymentStatus.COMPLETED);
        payment.setAmount(amount);
        payment.setOrderId(orderId);
        Payment savedPayment = paymentRepository.save(payment);
        return new PaymentResponse(savedPayment.getPaymentId(), savedPayment.getTransactionId());
    }
}
