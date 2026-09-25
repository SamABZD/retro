package com.localmarket.main.controller.order;

import com.localmarket.main.dto.order.OrderRequest;
import com.localmarket.main.dto.order.OrderResponse;
import com.localmarket.main.entity.order.Order;
import com.localmarket.main.entity.order.OrderStatus;
import com.localmarket.main.exception.ApiException;
import com.localmarket.main.exception.ErrorType;
import com.localmarket.main.security.CustomUserDetails;
import com.localmarket.main.security.ProducerOnly;
import com.localmarket.main.service.order.OrderService;
import com.localmarket.main.service.pdf.PdfGeneratorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    private static final int MAX_PAGE_SIZE = 100;

    private final OrderService orderService;
    private final PdfGeneratorService pdfGeneratorService;

    @PostMapping("/checkout")
    public ResponseEntity<List<OrderResponse>> checkout(
        @Valid @RequestBody OrderRequest request,
        @AuthenticationPrincipal CustomUserDetails user
    ) {
        requireUser(user);
        return ResponseEntity.ok(orderService.placeOrder(request, user.getId()));
    }

    @GetMapping
    public ResponseEntity<Page<OrderResponse>> getMyOrders(
        @AuthenticationPrincipal CustomUserDetails user,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "orderDate") String sortBy,
        @RequestParam(defaultValue = "desc") String direction
    ) {
        requireUser(user);
        return ResponseEntity.ok(orderService.getBuyerOrders(user.getId(), pageable(page, size, sortBy, direction)));
    }

    @GetMapping("/my-orders/status/{status}")
    public ResponseEntity<List<OrderResponse>> getMyOrdersByStatus(
        @AuthenticationPrincipal CustomUserDetails user,
        @PathVariable OrderStatus status
    ) {
        requireUser(user);
        return ResponseEntity.ok(orderService.getBuyerOrdersByStatus(user.getId(), status));
    }

    @GetMapping("/my-orders/{orderId}")
    public ResponseEntity<OrderResponse> getMyOrder(
        @AuthenticationPrincipal CustomUserDetails user,
        @PathVariable Long orderId
    ) {
        requireUser(user);
        return ResponseEntity.ok(orderService.getBuyerOrder(orderId, user.getId()));
    }

    @PutMapping("/{orderId}/status")
    @ProducerOnly
    public ResponseEntity<OrderResponse> updateOrderStatus(
        @PathVariable Long orderId,
        @RequestParam OrderStatus status,
        @AuthenticationPrincipal CustomUserDetails user
    ) {
        requireUser(user);
        return ResponseEntity.ok(orderService.updateOrderStatus(orderId, status, user.getId()));
    }

    @GetMapping("/producer-orders")
    @ProducerOnly
    public ResponseEntity<Page<OrderResponse>> getProducerOrders(
        @AuthenticationPrincipal CustomUserDetails user,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "orderDate") String sortBy,
        @RequestParam(defaultValue = "desc") String direction
    ) {
        requireUser(user);
        return ResponseEntity.ok(orderService.getProducerOrders(
            user.getId(), pageable(page, size, sortBy, direction)));
    }

    @GetMapping("/producer-orders/status/{status}")
    @ProducerOnly
    public ResponseEntity<Page<OrderResponse>> getProducerOrdersByStatus(
        @AuthenticationPrincipal CustomUserDetails user,
        @PathVariable OrderStatus status,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "orderDate") String sortBy,
        @RequestParam(defaultValue = "desc") String direction
    ) {
        requireUser(user);
        return ResponseEntity.ok(orderService.getProducerOrdersByStatus(
            user.getId(), status, pageable(page, size, sortBy, direction)));
    }

    @GetMapping("/receipt/{orderId}")
    public ResponseEntity<Resource> getOrderReceipt(
        @PathVariable Long orderId,
        @AuthenticationPrincipal CustomUserDetails user
    ) {
        requireUser(user);
        Order order = orderService.getBuyerOrderEntity(orderId, user.getId());
        byte[] pdfContent = pdfGeneratorService.generateReceipt(order);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=receipt_" + orderId + ".pdf")
            .contentType(MediaType.APPLICATION_PDF)
            .body(new ByteArrayResource(pdfContent));
    }

    private Pageable pageable(int page, int size, String sortBy, String direction) {
        if (page < 0 || size < 1 || size > MAX_PAGE_SIZE) {
            throw new ApiException(ErrorType.VALIDATION_FAILED,
                "Page must be non-negative and size must be between 1 and " + MAX_PAGE_SIZE);
        }
        String safeSort = switch (sortBy) {
            case "status", "totalPrice" -> sortBy;
            default -> "orderDate";
        };
        Sort.Direction safeDirection;
        try {
            safeDirection = Sort.Direction.fromString(direction);
        } catch (IllegalArgumentException invalidDirection) {
            throw new ApiException(ErrorType.VALIDATION_FAILED, "Sort direction must be asc or desc");
        }
        return PageRequest.of(page, size, Sort.by(safeDirection, safeSort));
    }

    private void requireUser(CustomUserDetails user) {
        if (user == null) {
            throw new ApiException(ErrorType.INVALID_SESSION, "Authentication required");
        }
    }
}
