package com.localmarket.main.seeder;

import com.localmarket.main.entity.category.Category;
import com.localmarket.main.entity.product.ListingCondition;
import com.localmarket.main.entity.product.ListingStatus;
import com.localmarket.main.entity.product.Product;
import com.localmarket.main.entity.product.ProductStatus;
import com.localmarket.main.entity.user.Role;
import com.localmarket.main.entity.user.User;
import com.localmarket.main.repository.category.CategoryRepository;
import com.localmarket.main.repository.product.ProductRepository;
import com.localmarket.main.repository.user.UserRepository;
import com.localmarket.main.service.coupon.CouponService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Profile;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Component
@Profile({"local", "portfolio"})
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
@org.springframework.core.annotation.Order(3)
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;
    private final CouponService couponService;

    @Override
    @Transactional
    public void run(String... args) {
        couponService.initializeWelcomeCoupon();

        // Leave existing marketplace data untouched; in the local profile an
        // optional admin account may already exist when this runner starts.
        if (userRepository.count() > 1) {
            log.info("Existing marketplace data detected; demo listings were not changed");
            return;
        }

        Map<String, Category> categories = loadCategories();
        List<User> sellers = seedSellers();
        seedBuyers();
        seedListings(sellers, categories);
    }

    private Map<String, Category> loadCategories() {
        Map<String, Category> categories = new LinkedHashMap<>();
        for (String name : MarketplaceCategorySeeder.CATEGORIES) {
            Category category = categoryRepository.findByNameIgnoreCase(name)
                .orElseThrow(() -> new IllegalStateException("Missing seeded category: " + name));
            categories.put(name, category);
        }
        return categories;
    }

    private List<User> seedSellers() {
        List<User> sellers = new ArrayList<>();
        sellers.add(createUser("seller1", "seller1@test.com", "Maya", "Haddad", Role.PRODUCER, "producer123"));
        sellers.add(createUser("seller2", "seller2@test.com", "Omar", "Nasser", Role.PRODUCER, "producer123"));
        sellers.add(createUser("seller3", "seller3@test.com", "Lina", "Khoury", Role.PRODUCER, "producer123"));

        // Retain the original test/demo login while presenting sellers in the API and UI.
        sellers.add(createUser(
            "producer1", "producer1@test.com", "Demo", "Seller", Role.PRODUCER, "producer123"
        ));
        return sellers;
    }

    private void seedBuyers() {
        createUser("buyer1", "buyer1@test.com", "Rami", "Salem", Role.CUSTOMER, "buyer123");
        createUser("buyer2", "buyer2@test.com", "Nour", "Fares", Role.CUSTOMER, "buyer123");
    }

    private User createUser(
        String username,
        String email,
        String firstName,
        String lastName,
        Role role,
        String password
    ) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setFirstname(firstName);
        user.setLastname(lastName);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role);
        user.setLastLogin(LocalDateTime.now());
        return userRepository.save(user);
    }

    private void seedListings(List<User> sellers, Map<String, Category> categories) {
        List<ListingSeed> catalog = List.of(
            listing("Electronics", "Unlocked Smartphone 128GB", "Unlocked phone in very good condition with charging cable and protective case.", "420.00", 1, "/demo/unlocked-smartphone-128gb.jpg", ListingCondition.LIKE_NEW),
            listing("Electronics", "Mechanical Keyboard", "Compact tactile keyboard with clean keycaps and a detachable USB cable.", "72.00", 1, "/demo/mechanical-keyboard.jpg", ListingCondition.GOOD),
            listing("Fashion", "Vintage Denim Jacket", "Classic denim jacket with a relaxed fit, clean seams, and light vintage wear.", "48.00", 1, "/demo/vintage-denim-jacket.jpg", ListingCondition.GOOD),
            listing("Fashion", "Leather Chelsea Boots", "Genuine leather boots with light sole wear and plenty of life left.", "75.00", 1, "/demo/leather-chelsea-boots.jpg", ListingCondition.GOOD),
            listing("Home & Living", "Upholstered Lounge Chair", "Comfortable tufted lounge chair with a clean, light-colored finish.", "180.00", 1, "/demo/mid-century-lounge-chair.jpg", ListingCondition.GOOD),
            listing("Home & Living", "White Table Lamp", "Compact white table lamp with a pleated shade and warm ambient light.", "45.00", 1, "/demo/ceramic-table-lamp.jpg", ListingCondition.LIKE_NEW),
            listing("Gaming", "Retro Game Boy Bundle", "Original Game Boy with its box and game cartridges; a collectible handheld setup.", "145.00", 1, "/demo/retro-game-console-bundle.jpg", ListingCondition.GOOD),
            listing("Gaming", "Ultrawide Gaming Monitor", "Wide gaming display with a slim stand and clean screen.", "190.00", 1, "/demo/27-inch-144hz-monitor.jpg", ListingCondition.LIKE_NEW),
            listing("Sports", "Aluminum Road Bicycle", "Lightweight bicycle with tuned gears, responsive brakes, and fresh bar tape.", "320.00", 1, "/demo/aluminum-road-bicycle.jpg", ListingCondition.GOOD),
            listing("Sports", "Adjustable Dumbbell Pair", "Pair of adjustable dumbbells with removable plates and secure collars.", "150.00", 2, "/demo/adjustable-dumbbell-pair.jpg", ListingCondition.GOOD),
            listing("Collectibles", "Working 35mm Film Camera", "Tested Nikon 35mm point-and-shoot camera with a clean lens and working flash.", "95.00", 1, "/demo/working-35mm-film-camera.jpg", ListingCondition.GOOD),
            listing("Collectibles", "Rare Vinyl Record", "Collectible pressing with clean labels and a well-preserved original sleeve.", "55.00", 1, "/demo/rare-vinyl-record.jpg", ListingCondition.GOOD),
            listing("Books", "Modern Design Book Set", "Collection of large-format design books with clean pages and light shelf wear.", "50.00", 1, "/demo/modern-design-book-set.jpg", ListingCondition.GOOD),
            listing("Books", "Classic Novel Collection", "Colorful collection of classic novels with clean pages and intact bindings.", "35.00", 1, "/demo/classic-novel-collection.jpg", ListingCondition.GOOD),
            listing("Accessories", "Everyday Backpack", "Durable dark backpack with padded straps and a separate laptop compartment.", "38.00", 1, "/demo/canvas-everyday-backpack.jpg", ListingCondition.LIKE_NEW),
            listing("Accessories", "Classic Stainless Watch", "Stainless-steel wristwatch in working condition with a recently replaced battery.", "90.00", 1, "/demo/classic-stainless-watch.jpg", ListingCondition.GOOD),
            listing("Musical Instruments", "Sunburst Electric Guitar", "Single-cut electric guitar professionally set up with fresh strings and low action.", "340.00", 1, "/demo/sunburst-electric-guitar.jpg", ListingCondition.GOOD),
            listing("Musical Instruments", "Steel-String Acoustic Guitar", "Warm-sounding acoustic guitar with a padded gig bag included.", "180.00", 1, "/demo/steel-string-acoustic-guitar.jpg", ListingCondition.GOOD)
        );

        for (int index = 0; index < catalog.size(); index++) {
            ListingSeed seed = catalog.get(index);
            Product product = new Product();
            product.setName(seed.title());
            product.setDescription(seed.description());
            product.setPrice(new BigDecimal(seed.price()));
            product.setQuantity(seed.quantity());
            product.setImageUrl(seed.imageUrl());
            product.setImages(new ArrayList<>(List.of(seed.imageUrl())));
            product.setCondition(seed.condition());
            product.setListingStatus(ListingStatus.ACTIVE);
            product.setStatus(ProductStatus.APPROVED);
            product.setProducer(sellers.get(index % sellers.size()));
            product.setCategories(new HashSet<>(Set.of(categories.get(seed.category()))));
            productRepository.save(product);
        }

        log.info("Seeded {} general marketplace demo listings", catalog.size());
    }

    private ListingSeed listing(
        String category,
        String title,
        String description,
        String price,
        int quantity,
        String imageUrl,
        ListingCondition condition
    ) {
        return new ListingSeed(category, title, description, price, quantity, imageUrl, condition);
    }

    private record ListingSeed(
        String category,
        String title,
        String description,
        String price,
        int quantity,
        String imageUrl,
        ListingCondition condition
    ) {
    }
}
