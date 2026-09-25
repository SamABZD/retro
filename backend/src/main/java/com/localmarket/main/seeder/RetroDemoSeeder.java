package com.localmarket.main.seeder;

import com.localmarket.main.entity.category.Category;
import com.localmarket.main.entity.order.Order;
import com.localmarket.main.entity.order.OrderItem;
import com.localmarket.main.entity.order.OrderStatus;
import com.localmarket.main.entity.payment.Payment;
import com.localmarket.main.entity.payment.PaymentMethod;
import com.localmarket.main.entity.payment.PaymentStatus;
import com.localmarket.main.entity.product.ListingCondition;
import com.localmarket.main.entity.product.ListingStatus;
import com.localmarket.main.entity.product.Product;
import com.localmarket.main.entity.product.ProductStatus;
import com.localmarket.main.entity.user.Role;
import com.localmarket.main.entity.user.User;
import com.localmarket.main.repository.category.CategoryRepository;
import com.localmarket.main.repository.order.OrderRepository;
import com.localmarket.main.repository.payment.PaymentRepository;
import com.localmarket.main.repository.product.ProductRepository;
import com.localmarket.main.repository.user.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Sample accounts exist only in explicitly selected demo environments. */
@Slf4j
@Component
@Profile({"local & demo", "portfolio"})
@ConditionalOnProperty(name = "app.demo.enabled", havingValue = "true")
@org.springframework.core.annotation.Order(4)
@RequiredArgsConstructor
public class RetroDemoSeeder implements CommandLineRunner {
    private static final String PASSWORD = "retro123";
    private final UserRepository users;
    private final CategoryRepository categories;
    private final ProductRepository products;
    private final OrderRepository orders;
    private final PaymentRepository payments;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        User buyer = account("buyer@retro.demo", "retro_buyer", "Sam", "The Man", Role.CUSTOMER);
        User seller = account("seller@retro.demo", "retro_seller", "Jamie", "Carter", Role.PRODUCER);

        // Existing local data may have been changed during exploration. Leave it alone.
        if (!products.findByProducerUserId(seller.getUserId()).isEmpty()) {
            return;
        }

        Product camera = listing(seller, "Collectibles", "Working 35mm Film Camera",
            "Tested 35mm camera with working flash and a clean lens.", "95.00", 0,
            "/demo/working-35mm-film-camera.jpg", ListingCondition.GOOD, ListingStatus.SOLD);
        Product keyboard = listing(seller, "Electronics", "Mechanical Keyboard",
            "Compact tactile keyboard with a detachable cable and clean keycaps.", "72.00", 3,
            "/demo/mechanical-keyboard.jpg", ListingCondition.GOOD, ListingStatus.ACTIVE);
        listing(seller, "Gaming", "Retro Game Boy Bundle",
            "Original handheld console with games, tested and ready to play.", "145.00", 2,
            "/demo/retro-game-console-bundle.jpg", ListingCondition.GOOD, ListingStatus.ACTIVE);
        listing(seller, "Accessories", "Classic Stainless Watch",
            "Stainless-steel watch in working condition with a fresh battery.", "90.00", 1,
            "/demo/classic-stainless-watch.jpg", ListingCondition.GOOD, ListingStatus.ACTIVE);
        listing(seller, "Collectibles", "Rare Vinyl Record",
            "Collectible pressing with original sleeve and clean labels.", "55.00", 2,
            "/demo/rare-vinyl-record.jpg", ListingCondition.GOOD, ListingStatus.ACTIVE);

        if (orders.findByCustomerUserId(buyer.getUserId()).isEmpty()) {
            sampleOrder(buyer, seller, camera, OrderStatus.DELIVERED, 18);
            sampleOrder(buyer, seller, keyboard, OrderStatus.PROCESSING, 3);
        }
        log.info("Seeded Retro demo buyer, seller, listings, and purchase history");
    }

    private User account(String email, String username, String firstName, String lastName, Role role) {
        return users.findByEmail(email).orElseGet(() -> {
            User user = new User();
            user.setEmail(email);
            user.setUsername(username);
            user.setFirstname(firstName);
            user.setLastname(lastName);
            user.setRole(role);
            user.setPasswordHash(passwordEncoder.encode(PASSWORD));
            return users.save(user);
        });
    }

    private Product listing(User seller, String category, String title, String description,
                            String price, int quantity, String image, ListingCondition condition,
                            ListingStatus listingStatus) {
        Category savedCategory = categories.findByNameIgnoreCase(category)
            .orElseThrow(() -> new IllegalStateException("Missing demo category: " + category));
        Product product = new Product();
        product.setProducer(seller);
        product.setName(title);
        product.setDescription(description);
        product.setPrice(new BigDecimal(price));
        product.setQuantity(quantity);
        product.setImageUrl(image);
        product.setImages(new ArrayList<>(List.of(image)));
        product.setCondition(condition);
        product.setStatus(ProductStatus.APPROVED);
        product.setListingStatus(listingStatus);
        product.setCategories(new HashSet<>(Set.of(savedCategory)));
        return products.save(product);
    }

    private void sampleOrder(User buyer, User seller, Product product, OrderStatus status, int daysAgo) {
        Order order = new Order();
        order.setCustomer(buyer);
        order.setShippingAddress("42 Cedar Street, Beirut");
        order.setPhoneNumber("+961 70 555 014");
        order.setOrderDate(LocalDateTime.now().minusDays(daysAgo));
        order.setStatus(status);
        order.setPaymentMethod(PaymentMethod.SIMULATED);
        order.setTotalPrice(product.getPrice());

        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setProduct(product);
        item.setQuantity(1);
        item.setPrice(product.getPrice());
        item.setProductTitleSnapshot(product.getName());
        item.setProductImageSnapshot(product.getImageUrl());
        item.setSellerIdSnapshot(seller.getUserId());
        item.setSellerNameSnapshot("Jamie Carter");
        order.setItems(new ArrayList<>(List.of(item)));
        Order savedOrder = orders.save(order);

        Payment payment = new Payment();
        payment.setPaymentMethod(PaymentMethod.SIMULATED);
        payment.setPaymentStatus(PaymentStatus.COMPLETED);
        payment.setAmount(product.getPrice());
        payment.setOrderId(savedOrder.getOrderId());
        payment.setTransactionId("RETRO-DEMO-" + savedOrder.getOrderId());
        savedOrder.setPayment(payments.save(payment));
        orders.save(savedOrder);
    }
}
