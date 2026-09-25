package com.localmarket.main.seeder;

import com.localmarket.main.entity.category.Category;
import com.localmarket.main.repository.category.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import java.util.List;

@Slf4j
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
@Order(2)
@RequiredArgsConstructor
public class MarketplaceCategorySeeder implements CommandLineRunner {
    public static final List<String> CATEGORIES = List.of(
        "Electronics",
        "Fashion",
        "Home & Living",
        "Gaming",
        "Sports",
        "Collectibles",
        "Books",
        "Accessories",
        "Musical Instruments"
    );

    private final CategoryRepository categoryRepository;

    @Override
    @Transactional
    public void run(String... args) {
        int added = 0;
        for (String name : CATEGORIES) {
            if (categoryRepository.findByNameIgnoreCase(name).isEmpty()) {
                Category category = new Category();
                category.setName(name);
                categoryRepository.save(category);
                added++;
            }
        }

        if (added > 0) {
            log.info("Added {} missing general marketplace categories without changing existing listings", added);
        }
    }
}
