package com.localmarket.main.dto.order;

import com.localmarket.main.entity.order.OrderStatus;
import com.localmarket.main.entity.payment.PaymentMethod;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long orderId;
    private OrderStatus status;
    private LocalDateTime orderDate;
    private BigDecimal totalPrice;
    private PaymentMethod paymentMethod;
    private String shippingAddress;
    private List<OrderItemResponse> items;
} 
