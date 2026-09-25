package com.localmarket.main.service.order;

import com.localmarket.main.dto.order.OrderItemRequest;
import com.localmarket.main.dto.order.OrderItemResponse;
import com.localmarket.main.dto.order.OrderRequest;
import com.localmarket.main.dto.order.OrderResponse;
import com.localmarket.main.dto.payment.PaymentResponse;
import com.localmarket.main.entity.order.Order;
import com.localmarket.main.entity.order.OrderItem;
import com.localmarket.main.entity.order.OrderStatus;
import com.localmarket.main.entity.payment.Payment;
import com.localmarket.main.entity.payment.PaymentMethod;
import com.localmarket.main.entity.product.ListingStatus;
import com.localmarket.main.entity.product.Product;
import com.localmarket.main.entity.product.ProductStatus;
import com.localmarket.main.entity.user.User;
import com.localmarket.main.exception.ApiException;
import com.localmarket.main.exception.ErrorType;
import com.localmarket.main.repository.order.OrderRepository;
import com.localmarket.main.repository.payment.PaymentRepository;
import com.localmarket.main.repository.product.ProductRepository;
import com.localmarket.main.repository.user.UserRepository;
import com.localmarket.main.service.notification.customer.CustomerNotificationService;
import com.localmarket.main.service.notification.producer.ProducerNotificationService;
import com.localmarket.main.service.payment.PaymentService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {
    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository;
    private final ProducerNotificationService producerNotificationService;
    private final CustomerNotificationService customerNotificationService;

    /**
     * Completes a local simulated purchase in one transaction. Inventory rows
     * are locked in id order, prices come from the database, and every order,
     * payment record, stock change, and history snapshot commits together.
     */
    public List<OrderResponse> placeOrder(OrderRequest request, Long customerId) {
        User customer = userRepository.findById(customerId)
            .orElseThrow(() -> new ApiException(ErrorType.USER_NOT_FOUND, "Authenticated user was not found"));

        Map<Long, Integer> requestedQuantities = combineQuantities(request.getItems());
        Map<Long, Product> lockedProducts = new LinkedHashMap<>();
        for (Map.Entry<Long, Integer> entry : requestedQuantities.entrySet()) {
            Product product = productRepository.findByIdForUpdate(entry.getKey())
                .orElseThrow(() -> new ApiException(
                    ErrorType.PRODUCT_NOT_FOUND,
                    "Listing " + entry.getKey() + " no longer exists"
                ));
            validatePurchasable(product, entry.getValue(), customerId);
            lockedProducts.put(entry.getKey(), product);
        }

        Map<Long, List<ProductQuantity>> bySeller = new LinkedHashMap<>();
        for (Map.Entry<Long, Product> entry : lockedProducts.entrySet()) {
            Product product = entry.getValue();
            bySeller.computeIfAbsent(product.getProducer().getUserId(), ignored -> new ArrayList<>())
                .add(new ProductQuantity(product, requestedQuantities.get(entry.getKey())));
        }

        List<Order> savedOrders = new ArrayList<>();
        for (Map.Entry<Long, List<ProductQuantity>> sellerEntry : bySeller.entrySet()) {
            Order order = new Order();
            order.setCustomer(customer);
            order.setShippingAddress(request.getShippingAddress().trim());
            order.setPhoneNumber(request.getPhoneNumber().trim());
            order.setOrderDate(LocalDateTime.now());
            order.setStatus(OrderStatus.PAYMENT_COMPLETED);
            order.setPaymentMethod(PaymentMethod.SIMULATED);

            BigDecimal total = BigDecimal.ZERO;
            List<OrderItem> orderItems = new ArrayList<>();
            for (ProductQuantity selection : sellerEntry.getValue()) {
                Product product = selection.product();
                int quantity = selection.quantity();

                OrderItem orderItem = new OrderItem();
                orderItem.setOrder(order);
                orderItem.setProduct(product);
                orderItem.setQuantity(quantity);
                orderItem.setPrice(product.getPrice());
                orderItem.setProductTitleSnapshot(product.getName());
                orderItem.setProductImageSnapshot(primaryImage(product));
                orderItem.setSellerIdSnapshot(product.getProducer().getUserId());
                orderItem.setSellerNameSnapshot(product.getProducer().getUsername());
                orderItems.add(orderItem);
                total = total.add(product.getPrice().multiply(BigDecimal.valueOf(quantity)));
            }

            order.setItems(orderItems);
            order.setTotalPrice(total);
            Order savedOrder = orderRepository.save(order);
            PaymentResponse paymentResult = paymentService.recordSimulatedPayment(total, savedOrder.getOrderId());
            Payment payment = paymentRepository.findById(paymentResult.getPaymentId())
                .orElseThrow(() -> new ApiException(ErrorType.PAYMENT_NOT_FOUND, "Simulated payment record was not created"));
            savedOrder.setPayment(payment);
            savedOrders.add(orderRepository.save(savedOrder));
        }

        for (Map.Entry<Long, Product> entry : lockedProducts.entrySet()) {
            Product product = entry.getValue();
            int remaining = product.getQuantity() - requestedQuantities.get(entry.getKey());
            product.setQuantity(remaining);
            if (remaining == 0) {
                product.setListingStatus(ListingStatus.SOLD);
            }
            productRepository.save(product);
        }

        for (Order order : savedOrders) {
            try {
                producerNotificationService.notifyNewOrder(
                    order.getItems().get(0).getSellerIdSnapshot(), order);
            } catch (RuntimeException notificationFailure) {
                log.warn("Order {} committed without a seller notification: {}",
                    order.getOrderId(), notificationFailure.getMessage());
            }
        }
        return savedOrders.stream().map(this::toResponse).toList();
    }

    private Map<Long, Integer> combineQuantities(List<OrderItemRequest> items) {
        Map<Long, Integer> combined = new TreeMap<>();
        for (OrderItemRequest item : items) {
            if (item.getProductId() == null || item.getQuantity() == null || item.getQuantity() < 1) {
                throw new ApiException(ErrorType.VALIDATION_FAILED,
                    "Every cart item needs a listing and a positive quantity");
            }
            try {
                combined.merge(item.getProductId(), item.getQuantity(), Math::addExact);
            } catch (ArithmeticException overflow) {
                throw new ApiException(ErrorType.VALIDATION_FAILED, "Requested quantity is too large");
            }
        }
        if (combined.isEmpty()) {
            throw new ApiException(ErrorType.VALIDATION_FAILED, "Cart must contain at least one item");
        }
        return combined;
    }

    private void validatePurchasable(Product product, int requested, Long customerId) {
        if (product.getStatus() != ProductStatus.APPROVED
            || (product.getListingStatus() != null && product.getListingStatus() != ListingStatus.ACTIVE)
            || product.getQuantity() == null
            || product.getQuantity() < 1) {
            throw new ApiException(ErrorType.OPERATION_NOT_ALLOWED,
                "Listing '" + product.getName() + "' is no longer available");
        }
        if (product.getProducer().getUserId().equals(customerId)) {
            throw new ApiException(ErrorType.OPERATION_NOT_ALLOWED, "You cannot purchase your own listing");
        }
        if (requested > product.getQuantity()) {
            throw new ApiException(ErrorType.INSUFFICIENT_STOCK,
                String.format("Only %d of '%s' remain", product.getQuantity(), product.getName()));
        }
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getBuyerOrders(Long customerId, Pageable pageable) {
        return page(orderRepository.findByCustomerUserId(customerId), pageable);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getBuyerOrdersByStatus(Long customerId, OrderStatus status) {
        return orderRepository.findByCustomerUserIdAndStatus(customerId, status)
            .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getBuyerOrder(Long orderId, Long customerId) {
        return toResponse(getBuyerOrderEntity(orderId, customerId));
    }

    @Transactional(readOnly = true)
    public Order getBuyerOrderEntity(Long orderId, Long customerId) {
        return orderRepository.findByOrderIdAndCustomerUserId(orderId, customerId)
            .orElseThrow(() -> new ApiException(ErrorType.ORDER_NOT_FOUND, "Order not found"));
    }

    @Transactional(readOnly = true)
    public List<Order> getUserOrders(Long customerId) {
        return orderRepository.findByCustomerUserId(customerId);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getProducerOrders(Long producerId, Pageable pageable) {
        List<Order> orders = orderRepository.findByItemsProductProducerUserId(producerId)
            .stream().distinct().toList();
        return pageForSeller(orders, producerId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getProducerOrdersByStatus(
        Long producerId,
        OrderStatus status,
        Pageable pageable
    ) {
        List<Order> orders = orderRepository
            .findByItemsProductProducerUserIdAndStatus(producerId, status)
            .stream().distinct().toList();
        return pageForSeller(orders, producerId, pageable);
    }

    public OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus, Long producerId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ApiException(ErrorType.ORDER_NOT_FOUND, "Order not found"));
        boolean ownsEveryItem = !order.getItems().isEmpty() && order.getItems().stream()
            .allMatch(item -> sellerId(item).equals(producerId));
        if (!ownsEveryItem) {
            throw new ApiException(ErrorType.ORDER_ACCESS_DENIED, "You can only update your own sales");
        }

        validateSellerTransition(order.getStatus(), newStatus);
        if (newStatus == OrderStatus.CANCELLED) {
            restoreInventory(order);
        }
        order.setStatus(newStatus);
        Order saved = orderRepository.save(order);
        try {
            if (newStatus == OrderStatus.SHIPPED) {
                customerNotificationService.notifyDeliveryUpdate(saved, "Your order has shipped");
            } else if (newStatus == OrderStatus.DELIVERED) {
                customerNotificationService.notifyDeliveryUpdate(saved, "Your order was delivered");
            } else {
                customerNotificationService.notifyOrderStatusUpdate(saved);
            }
        } catch (RuntimeException notificationFailure) {
            log.warn("Order {} status changed without a customer notification: {}",
                orderId, notificationFailure.getMessage());
        }
        return toResponse(saved);
    }

    private void validateSellerTransition(OrderStatus current, OrderStatus next) {
        boolean valid = (current == OrderStatus.PAYMENT_COMPLETED
                && (next == OrderStatus.PROCESSING || next == OrderStatus.CANCELLED))
            || (current == OrderStatus.PROCESSING
                && (next == OrderStatus.SHIPPED || next == OrderStatus.CANCELLED))
            || (current == OrderStatus.SHIPPED && next == OrderStatus.DELIVERED);
        if (!valid) {
            throw new ApiException(ErrorType.INVALID_STATUS_TRANSITION,
                "Status cannot change from " + current + " to " + next);
        }
    }

    private void restoreInventory(Order order) {
        for (OrderItem item : order.getItems()) {
            Product product = productRepository.findByIdForUpdate(item.getProduct().getProductId())
                .orElseThrow(() -> new ApiException(ErrorType.PRODUCT_NOT_FOUND,
                    "Ordered listing no longer exists"));
            product.setQuantity(product.getQuantity() + item.getQuantity());
            if (product.getListingStatus() == ListingStatus.SOLD) {
                product.setListingStatus(ListingStatus.ACTIVE);
            }
            productRepository.save(product);
        }
    }

    private Page<OrderResponse> pageForSeller(List<Order> orders, Long sellerId, Pageable pageable) {
        return page(orders, pageable, order -> toSellerResponse(order, sellerId));
    }

    private Page<OrderResponse> page(List<Order> orders, Pageable pageable) {
        return page(orders, pageable, this::toResponse);
    }

    private Page<OrderResponse> page(
        List<Order> orders,
        Pageable pageable,
        java.util.function.Function<Order, OrderResponse> mapper
    ) {
        List<Order> sorted = new ArrayList<>(orders);
        sorted.sort(comparatorFor(pageable));
        long offset = pageable.getOffset();
        if (offset >= sorted.size()) {
            return new PageImpl<>(List.of(), pageable, sorted.size());
        }
        int start = (int) offset;
        int end = Math.min(start + pageable.getPageSize(), sorted.size());
        List<OrderResponse> content = sorted.subList(start, end).stream().map(mapper).toList();
        return new PageImpl<>(content, pageable, sorted.size());
    }

    private Comparator<Order> comparatorFor(Pageable pageable) {
        if (pageable.getSort().isUnsorted()) {
            return Comparator.comparing(Order::getOrderDate).reversed();
        }
        var sortOrder = pageable.getSort().iterator().next();
        Comparator<Order> comparator = switch (sortOrder.getProperty()) {
            case "status" -> Comparator.comparing(Order::getStatus);
            case "totalPrice" -> Comparator.comparing(Order::getTotalPrice);
            default -> Comparator.comparing(Order::getOrderDate);
        };
        return sortOrder.isAscending() ? comparator : comparator.reversed();
    }

    private OrderResponse toResponse(Order order) {
        OrderResponse result = response(order, order.getItems());
        // Legacy orders may include discounts; retain the amount actually recorded.
        result.setTotalPrice(order.getTotalPrice());
        return result;
    }

    private OrderResponse toSellerResponse(Order order, Long sellerId) {
        List<OrderItem> ownedItems = order.getItems().stream()
            .filter(item -> sellerId(item).equals(sellerId))
            .toList();
        return response(order, ownedItems);
    }

    private OrderResponse response(Order order, List<OrderItem> visibleItems) {
        BigDecimal visibleTotal = visibleItems.stream()
            .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        return OrderResponse.builder()
            .orderId(order.getOrderId())
            .status(order.getStatus())
            .orderDate(order.getOrderDate())
            .totalPrice(visibleTotal)
            .paymentMethod(order.getPaymentMethod())
            .shippingAddress(order.getShippingAddress())
            .items(visibleItems.stream().map(this::toItemResponse).toList())
            .build();
    }

    private OrderItemResponse toItemResponse(OrderItem item) {
        Product product = item.getProduct();
        String title = item.getProductTitleSnapshot() != null
            ? item.getProductTitleSnapshot() : product.getName();
        String image = item.getProductImageSnapshot() != null
            ? item.getProductImageSnapshot() : primaryImage(product);
        String sellerName = item.getSellerNameSnapshot() != null
            ? item.getSellerNameSnapshot() : product.getProducer().getUsername();
        return OrderItemResponse.builder()
            .orderItemId(item.getOrderItemId())
            .productId(product.getProductId())
            .title(title)
            .imageUrl(image)
            .sellerId(sellerId(item))
            .sellerName(sellerName)
            .quantity(item.getQuantity())
            .unitPrice(item.getPrice())
            .lineTotal(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
            .build();
    }

    private Long sellerId(OrderItem item) {
        return item.getSellerIdSnapshot() != null
            ? item.getSellerIdSnapshot() : item.getProduct().getProducer().getUserId();
    }

    private String primaryImage(Product product) {
        if (product.getImages() != null && !product.getImages().isEmpty()) {
            return product.getImages().get(0);
        }
        return product.getImageUrl();
    }

    private record ProductQuantity(Product product, int quantity) {
    }
}
