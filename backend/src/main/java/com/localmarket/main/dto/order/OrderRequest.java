package com.localmarket.main.dto.order;

import lombok.Data;
import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

@Data
public class OrderRequest {
    @NotEmpty(message = "Cart must contain at least one item")
    @Valid
    private List<OrderItemRequest> items;

    @NotBlank(message = "Shipping address is required")
    @Size(max = 500, message = "Shipping address cannot exceed 500 characters")
    private String shippingAddress;

    @NotBlank(message = "Phone number is required")
    @Size(min = 6, max = 32, message = "Phone number must be between 6 and 32 characters")
    private String phoneNumber;
}
