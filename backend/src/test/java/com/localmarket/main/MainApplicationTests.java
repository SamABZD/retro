package com.localmarket.main;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.hamcrest.Matchers.hasItem;

import static java.nio.charset.StandardCharsets.UTF_8;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.localmarket.main.dto.auth.LoginRequest;
import com.localmarket.main.entity.category.Category;
import com.localmarket.main.repository.category.CategoryRepository;
import com.localmarket.main.entity.product.ListingStatus;
import com.localmarket.main.entity.product.Product;
import com.localmarket.main.repository.product.ProductRepository;
import com.localmarket.main.repository.user.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.mock.web.MockPart;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("local")
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:localmarkettest;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class MainApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void ordinaryLocalProfileDoesNotSeedOneClickDemoAccounts() {
        org.junit.jupiter.api.Assertions.assertTrue(userRepository.findByEmail("buyer@retro.demo").isEmpty());
        org.junit.jupiter.api.Assertions.assertTrue(userRepository.findByEmail("seller@retro.demo").isEmpty());
    }

    @Test
    void publicMarketplaceAndCookieLoginAreAvailable() throws Exception {
        mockMvc.perform(get("/api/products").param("page", "0").param("size", "12"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$.totalElements").value(18));

        mockMvc.perform(get("/api/listings")
                .param("page", "0")
                .param("size", "20")
                .param("search", "guitar"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$..title", hasItem("Sunburst Electric Guitar")))
            .andExpect(jsonPath("$..condition", hasItem("GOOD")))
            .andExpect(jsonPath("$..listingStatus", hasItem("ACTIVE")));

        mockMvc.perform(get("/api/listings")
                .param("page", "0")
                .param("size", "20")
                .param("condition", "LIKE_NEW"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(4));

        mockMvc.perform(get("/api/listings")
                .param("page", "0")
                .param("size", "20")
                .param("minPrice", "100")
                .param("maxPrice", "200")
                .param("sortBy", "price")
                .param("direction", "asc"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(5))
            .andExpect(jsonPath("$.content[0].products[0].price").value(145.00));

        mockMvc.perform(get("/api/listings")
                .param("minPrice", "500")
                .param("maxPrice", "100"))
            .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/categories"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$..name", hasItem("Electronics")))
            .andExpect(jsonPath("$..name", hasItem("Fashion")))
            .andExpect(jsonPath("$..name", hasItem("Musical Instruments")));

        LoginRequest login = new LoginRequest("producer1@test.com", "producer123");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(login)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value(200))
            .andExpect(cookie().exists("jwt"))
            .andExpect(cookie().httpOnly("jwt", true))
            .andReturn();

        Cookie jwt = loginResult.getResponse().getCookie("jwt");
        Category electronics = categoryRepository.findByNameIgnoreCase("Electronics").orElseThrow();

        MvcResult createResult = mockMvc.perform(multipart("/api/listings")
                .part(textPart("title", "Seller CRUD Test Camera"))
                .part(textPart("description", "A test listing used to verify seller-owned create, read, update, and delete."))
                .part(textPart("price", "199.50"))
                .part(textPart("quantity", "1"))
                .part(textPart("categoryIds", electronics.getCategoryId().toString()))
                .part(textPart("imageUrl", "https://example.com/test-camera.jpg"))
                .part(textPart("condition", "LIKE_NEW"))
                .cookie(jwt)
                .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value("Seller CRUD Test Camera"))
            .andExpect(jsonPath("$.condition").value("LIKE_NEW"))
            .andExpect(jsonPath("$.listingStatus").value("ACTIVE"))
            .andExpect(jsonPath("$.images[0]").value("https://example.com/test-camera.jpg"))
            .andReturn();

        long listingId = objectMapper.readTree(createResult.getResponse().getContentAsString())
            .get("productId").asLong();

        mockMvc.perform(get("/api/listings/my-listings/{id}", listingId).cookie(jwt))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value("Seller CRUD Test Camera"));

        mockMvc.perform(multipart("/api/listings/{id}", listingId)
                .part(textPart("title", "Updated Seller CRUD Camera"))
                .part(textPart("description", "Updated safely without replacing the existing image gallery."))
                .part(textPart("price", "189.00"))
                .part(textPart("quantity", "1"))
                .part(textPart("categoryIds", electronics.getCategoryId().toString()))
                .part(textPart("condition", "GOOD"))
                .cookie(jwt)
                .with(csrf())
                .with(request -> {
                    request.setMethod("PUT");
                    return request;
                }))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value("Updated Seller CRUD Camera"))
            .andExpect(jsonPath("$.condition").value("GOOD"))
            .andExpect(jsonPath("$.images[0]").value("https://example.com/test-camera.jpg"));

        mockMvc.perform(delete("/api/listings/{id}", listingId)
                .cookie(jwt)
                .with(csrf()))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/listings/my-listings/{id}", listingId).cookie(jwt))
            .andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void listingCreationRejectsUnsafeRemoteImageReferences() throws Exception {
        Cookie seller = login("seller1@test.com", "producer123");
        long categoryId = categoryRepository.findByNameIgnoreCase("Electronics")
            .orElseThrow().getCategoryId();

        mockMvc.perform(multipart("/api/listings")
                .part(textPart("title", "Unsafe Image Test"))
                .part(textPart("description", "Verifies that embedded active image payloads are rejected."))
                .part(textPart("price", "25.00"))
                .part(textPart("quantity", "1"))
                .part(textPart("categoryIds", String.valueOf(categoryId)))
                .part(textPart("imageUrl", "data:image/svg+xml,<svg onload=alert(1)></svg>"))
                .part(textPart("condition", "GOOD"))
                .cookie(seller)
                .with(csrf()))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_FILE"));
    }

    @Test
    @Transactional
    void listingCreationRejectsTextBeyondSchemaBounds() throws Exception {
        Cookie seller = login("seller1@test.com", "producer123");
        long categoryId = categoryRepository.findByNameIgnoreCase("Electronics")
            .orElseThrow().getCategoryId();

        mockMvc.perform(multipart("/api/listings")
                .part(textPart("title", "T".repeat(256)))
                .part(textPart("description", "Valid description"))
                .part(textPart("price", "25.00"))
                .part(textPart("quantity", "1"))
                .part(textPart("categoryIds", String.valueOf(categoryId)))
                .part(textPart("imageUrl", "https://example.com/title-bound.jpg"))
                .part(textPart("condition", "GOOD"))
                .cookie(seller)
                .with(csrf()))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));

        mockMvc.perform(multipart("/api/listings")
                .part(textPart("title", "Valid title"))
                .part(textPart("description", "D".repeat(256)))
                .part(textPart("price", "25.00"))
                .part(textPart("quantity", "1"))
                .part(textPart("categoryIds", String.valueOf(categoryId)))
                .part(textPart("imageUrl", "https://example.com/description-bound.jpg"))
                .part(textPart("condition", "GOOD"))
                .cookie(seller)
                .with(csrf()))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
    }

    @Test
    @Transactional
    void checkoutIsAtomicAuthoritativeAndOwnerScoped() throws Exception {
        Product sellerOneListing = listing("Unlocked Smartphone 128GB");
        Product sellerTwoListing = listing("Mechanical Keyboard");
        Cookie buyerCookie = login("buyer1@test.com", "buyer123");

        mockMvc.perform(post("/api/orders/checkout")
                .cookie(buyerCookie)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"items":[],"shippingAddress":"Beirut","phoneNumber":"12345678"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        mockMvc.perform(post("/api/orders/checkout")
                .cookie(buyerCookie)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"items":[{"productId":%d,"quantity":-1}],"shippingAddress":"Beirut","phoneNumber":"12345678"}
                    """.formatted(sellerOneListing.getProductId())))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        mockMvc.perform(post("/api/orders/checkout")
                .cookie(buyerCookie)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"items":[{"productId":%d,"quantity":999}],"shippingAddress":"Beirut","phoneNumber":"12345678"}
                    """.formatted(sellerOneListing.getProductId())))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INSUFFICIENT_STOCK"));

        mockMvc.perform(post("/api/orders/checkout")
                .cookie(buyerCookie)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"items":[{"productId":999999,"quantity":1}],"shippingAddress":"Beirut","phoneNumber":"12345678"}
                    """))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("PRODUCT_NOT_FOUND"));

        Product unavailable = listing("Vintage Denim Jacket");
        unavailable.setListingStatus(ListingStatus.INACTIVE);
        productRepository.saveAndFlush(unavailable);
        mockMvc.perform(post("/api/orders/checkout")
                .cookie(buyerCookie)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"items":[{"productId":%d,"quantity":1}],"shippingAddress":"Beirut","phoneNumber":"12345678"}
                    """.formatted(unavailable.getProductId())))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("OPERATION_NOT_ALLOWED"));

        String checkoutBody = """
            {
              "items":[
                {"productId":%d,"quantity":1,"price":0.01},
                {"productId":%d,"quantity":1,"price":0.01}
              ],
              "shippingAddress":"Hamra, Beirut",
              "phoneNumber":"+961 70 000 000",
              "paymentMethod":"CARD",
              "cardNumber":"4242424242424242"
            }
            """.formatted(sellerOneListing.getProductId(), sellerTwoListing.getProductId());

        mockMvc.perform(post("/api/orders/checkout")
                .cookie(buyerCookie)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(checkoutBody))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));

        String validCheckoutBody = """
            {
              "items":[
                {"productId":%d,"quantity":1},
                {"productId":%d,"quantity":1}
              ],
              "shippingAddress":"Hamra, Beirut",
              "phoneNumber":"+961 70 000 000"
            }
            """.formatted(sellerOneListing.getProductId(), sellerTwoListing.getProductId());

        MvcResult checkoutResult = mockMvc.perform(post("/api/orders/checkout")
                .cookie(buyerCookie)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(validCheckoutBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$..paymentMethod", hasItem("SIMULATED")))
            .andExpect(jsonPath("$..unitPrice", hasItem(420.00)))
            .andExpect(jsonPath("$..unitPrice", hasItem(72.00)))
            .andExpect(jsonPath("$[0].accessToken").doesNotExist())
            .andExpect(jsonPath("$[0].customer").doesNotExist())
            .andExpect(jsonPath("$[0].payment").doesNotExist())
            .andReturn();

        JsonNode checkout = objectMapper.readTree(checkoutResult.getResponse().getContentAsString());
        Map<Long, Long> orderBySeller = new HashMap<>();
        for (JsonNode order : checkout) {
            orderBySeller.put(order.at("/items/0/sellerId").asLong(), order.get("orderId").asLong());
        }

        Product soldOut = productRepository.findById(sellerOneListing.getProductId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(0, soldOut.getQuantity());
        org.junit.jupiter.api.Assertions.assertEquals(ListingStatus.SOLD, soldOut.getListingStatus());

        mockMvc.perform(get("/api/orders").cookie(buyerCookie))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(2))
            .andExpect(jsonPath("$.content[0].items[0].title").isNotEmpty());

        mockMvc.perform(get("/api/orders")
                .param("page", String.valueOf(Integer.MAX_VALUE))
                .param("size", "100")
                .cookie(buyerCookie))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content.length()").value(0));

        Cookie otherBuyer = login("buyer2@test.com", "buyer123");
        long sellerOneOrderId = orderBySeller.get(sellerOneListing.getProducer().getUserId());
        mockMvc.perform(get("/api/orders/my-orders/{id}", sellerOneOrderId).cookie(otherBuyer))
            .andExpect(status().isNotFound());

        Cookie sellerOneCookie = login("seller1@test.com", "producer123");
        MvcResult sellerOneOrders = mockMvc.perform(get("/api/orders/producer-orders").cookie(sellerOneCookie))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.content[0].items[0].sellerId")
                .value(sellerOneListing.getProducer().getUserId()))
            .andExpect(jsonPath("$.content[0].customer").doesNotExist())
            .andExpect(jsonPath("$.content[0].phoneNumber").doesNotExist())
            .andReturn();

        Cookie sellerTwoCookie = login("seller2@test.com", "producer123");
        mockMvc.perform(put("/api/orders/{id}/status", sellerOneOrderId)
                .param("status", "PROCESSING")
                .cookie(sellerTwoCookie)
                .with(csrf()))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.code").value("ORDER_ACCESS_DENIED"));

        mockMvc.perform(put("/api/orders/{id}/status", sellerOneOrderId)
                .param("status", "PROCESSING")
                .cookie(sellerOneCookie)
                .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PROCESSING"));

        mockMvc.perform(put("/api/orders/{id}/status", sellerOneOrderId)
                .param("status", "PAYMENT_FAILED")
                .cookie(sellerOneCookie)
                .with(csrf()))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_STATUS_TRANSITION"));

        mockMvc.perform(put("/api/orders/{id}/status", sellerOneOrderId)
                .param("status", "CANCELLED")
                .cookie(sellerOneCookie)
                .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("CANCELLED"));

        Product restored = productRepository.findById(sellerOneListing.getProductId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(1, restored.getQuantity());
        org.junit.jupiter.api.Assertions.assertEquals(ListingStatus.ACTIVE, restored.getListingStatus());

        mockMvc.perform(delete("/api/listings/{id}", sellerOneListing.getProductId())
                .cookie(sellerOneCookie)
                .with(csrf()))
            .andExpect(status().isNoContent());
        Product archived = productRepository.findById(sellerOneListing.getProductId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(ListingStatus.ARCHIVED, archived.getListingStatus());

        mockMvc.perform(get("/api/orders/my-orders/{id}", sellerOneOrderId).cookie(buyerCookie))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items[0].title").value("Unlocked Smartphone 128GB"))
            .andExpect(jsonPath("$.items[0].unitPrice").value(420.00));

        mockMvc.perform(post("/api/auth/logout").cookie(buyerCookie).with(csrf()))
            .andExpect(status().isOk())
            .andExpect(cookie().maxAge("jwt", 0));
        mockMvc.perform(get("/api/orders").cookie(buyerCookie))
            .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/orders").cookie(new Cookie("jwt", "not-a-jwt")))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @Transactional
    void publicRegistrationCannotAssignPrivilegedRole() throws Exception {
        String request = """
            {
              "username":"role-test",
              "email":"role-test@example.com",
              "firstname":"Role",
              "lastname":"Test",
              "password":"safe-password-123",
              "role":"ADMIN"
            }
            """;
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
            .andExpect(status().isOk())
            .andExpect(cookie().exists("jwt"))
            .andReturn();

        mockMvc.perform(get("/api/auth/me").cookie(result.getResponse().getCookie("jwt")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.role").value("CUSTOMER"));
    }

    @Test
    @Transactional
    void sellerCanReorderAndRemoveOnlyTheirOwnListingImages() throws Exception {
        Cookie seller = login("seller1@test.com", "producer123");
        Cookie otherSeller = login("seller2@test.com", "producer123");
        long categoryId = categoryRepository.findByNameIgnoreCase("Electronics")
            .orElseThrow().getCategoryId();
        String first = "https://example.com/first-photo.jpg";
        String second = "https://example.com/second-photo.jpg";

        MvcResult created = mockMvc.perform(multipart("/api/listings")
                .part(textPart("title", "Stage Five Gallery Test"))
                .part(textPart("description", "A listing to verify safe gallery editing."))
                .part(textPart("price", "65.00"))
                .part(textPart("quantity", "1"))
                .part(textPart("categoryIds", String.valueOf(categoryId)))
                .part(textPart("imageUrl", first))
                .part(textPart("existingImages", objectMapper.writeValueAsString(List.of(second))))
                .part(textPart("condition", "GOOD"))
                .cookie(seller).with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.images[0]").value(second))
            .andExpect(jsonPath("$.images[1]").value(first))
            .andReturn();
        long id = objectMapper.readTree(created.getResponse().getContentAsString())
            .get("productId").asLong();

        mockMvc.perform(multipart("/api/listings/{id}", id)
                .part(textPart("title", "Stage Five Gallery Test"))
                .part(textPart("description", "A listing to verify safe gallery editing."))
                .part(textPart("price", "65.00"))
                .part(textPart("quantity", "1"))
                .part(textPart("categoryIds", String.valueOf(categoryId)))
                .part(textPart("condition", "GOOD"))
                .part(textPart("existingImages", objectMapper.writeValueAsString(List.of(first, second))))
                .cookie(seller).with(csrf())
                .with(request -> { request.setMethod("PUT"); return request; }))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.images[0]").value(first))
            .andExpect(jsonPath("$.images[1]").value(second));

        mockMvc.perform(multipart("/api/listings/{id}", id)
                .part(textPart("title", "Stage Five Gallery Test"))
                .part(textPart("description", "A listing to verify safe gallery editing."))
                .part(textPart("price", "65.00"))
                .part(textPart("quantity", "1"))
                .part(textPart("categoryIds", String.valueOf(categoryId)))
                .part(textPart("existingImages", objectMapper.writeValueAsString(List.of("https://example.com/foreign.jpg"))))
                .cookie(seller).with(csrf())
                .with(request -> { request.setMethod("PUT"); return request; }))
            .andExpect(status().isBadRequest());

        mockMvc.perform(multipart("/api/listings/{id}", id)
                .part(textPart("title", "Stage Five Gallery Test"))
                .part(textPart("description", "A listing to verify safe gallery editing."))
                .part(textPart("price", "65.00"))
                .part(textPart("quantity", "1"))
                .part(textPart("categoryIds", String.valueOf(categoryId)))
                .part(textPart("existingImages", "[]"))
                .cookie(seller).with(csrf())
                .with(request -> { request.setMethod("PUT"); return request; }))
            .andExpect(status().isBadRequest());

        mockMvc.perform(multipart("/api/listings/{id}", id)
                .part(textPart("title", "Stage Five Gallery Test"))
                .part(textPart("description", "A listing to verify safe gallery editing."))
                .part(textPart("price", "65.00"))
                .part(textPart("quantity", "1"))
                .part(textPart("categoryIds", String.valueOf(categoryId)))
                .part(textPart("existingImages", objectMapper.writeValueAsString(List.of(second))))
                .cookie(otherSeller).with(csrf())
                .with(request -> { request.setMethod("PUT"); return request; }))
            .andExpect(status().isForbidden());

        mockMvc.perform(multipart("/api/listings/{id}", id)
                .part(textPart("title", "Stage Five Gallery Test"))
                .part(textPart("description", "A listing to verify safe gallery editing."))
                .part(textPart("price", "65.00"))
                .part(textPart("quantity", "1"))
                .part(textPart("categoryIds", String.valueOf(categoryId)))
                .part(textPart("existingImages", objectMapper.writeValueAsString(List.of(second))))
                .cookie(seller).with(csrf())
                .with(request -> { request.setMethod("PUT"); return request; }))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.images.length()").value(1))
            .andExpect(jsonPath("$.images[0]").value(second));
    }

    @Test
    @Transactional
    void passwordChangeInvalidatesOldSession() throws Exception {
        Cookie buyer = login("buyer1@test.com", "buyer123");
        mockMvc.perform(post("/api/users/change-password")
                .cookie(buyer).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"oldPassword":"buyer123","newPassword":"NewPassword123!"}
                    """))
            .andExpect(status().isOk());
        mockMvc.perform(get("/api/auth/me").cookie(buyer))
            .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new LoginRequest("buyer1@test.com", "NewPassword123!"))))
            .andExpect(status().isOk());
    }

    @Test
    @Transactional
    void applicationApprovalUpgradesBuyerAndInvalidatesOldSession() throws Exception {
        Cookie buyer = login("buyer2@test.com", "buyer123");
        Cookie admin = login("admin@local.market", "admin12345");
        long categoryId = categoryRepository.findByNameIgnoreCase("Electronics")
            .orElseThrow().getCategoryId();
        mockMvc.perform(get("/api/producer-applications/status").cookie(buyer))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("NO_APPLICATION"));

        MvcResult application = mockMvc.perform(post("/api/producer-applications")
                .cookie(buyer).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"businessName":"Secondhand Finds","businessDescription":"Used consumer goods and collectibles",
                     "businessPhoneNumber":"12345678","businessAddress":"Beirut",
                     "cityRegion":"Beirut","yearsOfExperience":0,"categoryIds":[%d]}
                    """.formatted(categoryId)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PENDING"))
            .andReturn();
        long applicationId = objectMapper.readTree(application.getResponse().getContentAsString())
            .get("applicationId").asLong();
        mockMvc.perform(get("/api/producer-applications/status").cookie(buyer))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PENDING"));
        mockMvc.perform(post("/api/producer-applications/{id}/approve", applicationId)
                .cookie(admin).with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("APPROVED"));
        mockMvc.perform(get("/api/auth/me").cookie(buyer))
            .andExpect(status().isUnauthorized());
        Cookie upgraded = login("buyer2@test.com", "buyer123");
        mockMvc.perform(get("/api/auth/me").cookie(upgraded))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.role").value("PRODUCER"));
    }

    private Cookie login(String email, String password) throws Exception {
        LoginRequest login = new LoginRequest(email, password);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(login)))
            .andExpect(status().isOk())
            .andExpect(cookie().exists("jwt"))
            .andReturn();
        return result.getResponse().getCookie("jwt");
    }

    private Product listing(String title) {
        return productRepository.findAll().stream()
            .filter(product -> title.equals(product.getName()))
            .findFirst()
            .orElseThrow();
    }

    private MockPart textPart(String name, String value) {
        MockPart part = new MockPart(name, value.getBytes(UTF_8));
        part.getHeaders().setContentType(MediaType.TEXT_PLAIN);
        return part;
    }
}
