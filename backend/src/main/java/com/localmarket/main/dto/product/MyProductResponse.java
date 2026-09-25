package com.localmarket.main.dto.product;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

import com.localmarket.main.entity.category.Category;
import com.localmarket.main.entity.product.ProductStatus;
import com.localmarket.main.entity.product.ListingCondition;
import com.localmarket.main.entity.product.ListingStatus;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MyProductResponse {
    private Long productId;
    private String title;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer quantity;
    private String imageUrl;
    private List<String> images;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Set<Category> categories;
    private ProductStatus status;
    private String declineReason;
    private boolean stock;
    private ListingCondition condition;
    private ListingStatus listingStatus;
} 
