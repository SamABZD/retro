package com.localmarket.main.dto.product;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import com.localmarket.main.entity.product.ListingCondition;
import com.localmarket.main.entity.product.ListingStatus;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {
    private String title;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer quantity;
    private String imageUrl;
    private List<String> images;
    private Set<Long> categoryIds;
    private ListingCondition condition;
    private ListingStatus listingStatus;
} 
