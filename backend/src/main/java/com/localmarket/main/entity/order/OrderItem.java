package com.localmarket.main.entity.order;

import com.localmarket.main.entity.product.Product;
import lombok.Data;
import lombok.ToString;
import jakarta.persistence.*;
import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Data
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long orderItemId;
    
    @JsonBackReference
    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "orderId")
    private Order order;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "productId")
    private Product product;
    
    private Integer quantity;
    private BigDecimal price;

    @Column(name = "productTitleSnapshot", length = 255)
    private String productTitleSnapshot;

    @Column(name = "productImageSnapshot", length = 2083)
    private String productImageSnapshot;

    @Column(name = "sellerIdSnapshot")
    private Long sellerIdSnapshot;

    @Column(name = "sellerNameSnapshot", length = 255)
    private String sellerNameSnapshot;
} 
