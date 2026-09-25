package com.localmarket.main;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.localmarket.main.entity.product.ListingStatus;
import com.localmarket.main.entity.user.Role;
import com.localmarket.main.repository.order.OrderRepository;
import com.localmarket.main.repository.product.ProductRepository;
import com.localmarket.main.repository.user.UserRepository;
import com.localmarket.main.seeder.RetroDemoSeeder;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles({"local", "demo"})
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:retrodemotest;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class RetroDemoTests {
    @Autowired private MockMvc mvc;
    @Autowired private UserRepository users;
    @Autowired private ProductRepository products;
    @Autowired private OrderRepository orders;
    @Autowired private RetroDemoSeeder seeder;

    @Test
    void demoSeedIsStableAndUsesExistingMarketplaceModel() throws Exception {
        var buyer = users.findByEmail("buyer@retro.demo").orElseThrow();
        var seller = users.findByEmail("seller@retro.demo").orElseThrow();
        assertEquals(Role.CUSTOMER, buyer.getRole());
        assertEquals(Role.PRODUCER, seller.getRole());
        assertTrue(products.findByProducerUserId(seller.getUserId()).size() >= 5);
        assertTrue(products.findByProducerUserId(seller.getUserId()).stream()
            .anyMatch(product -> product.getListingStatus() == ListingStatus.SOLD));
        assertEquals(2, orders.findByCustomerUserId(buyer.getUserId()).size());
        assertEquals(2, orders.findByItemsProductProducerUserId(seller.getUserId()).size());

        seeder.run();
        assertEquals(5, products.findByProducerUserId(seller.getUserId()).size());
        assertEquals(2, orders.findByCustomerUserId(buyer.getUserId()).size());
    }

    @Test
    void demoPersonasUseRealCookiesRolesAndLogout() throws Exception {
        Cookie buyer = login("buyer@retro.demo");
        mvc.perform(get("/api/auth/me").cookie(buyer))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.role").value("CUSTOMER"));
        mvc.perform(get("/api/orders").cookie(buyer))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(2));
        mvc.perform(get("/api/orders/producer-orders").cookie(buyer))
            .andExpect(status().isForbidden());

        mvc.perform(post("/api/auth/logout").cookie(buyer).with(csrf()))
            .andExpect(status().isOk());
        mvc.perform(get("/api/auth/me").cookie(buyer))
            .andExpect(status().isUnauthorized());

        Cookie seller = login("seller@retro.demo");
        mvc.perform(get("/api/auth/me").cookie(seller))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.role").value("PRODUCER"));
        mvc.perform(get("/api/orders/producer-orders").cookie(seller))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(2));
        mvc.perform(get("/api/orders").cookie(seller))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(0));
    }

    private Cookie login(String email) throws Exception {
        return mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"retro123\"}"))
            .andExpect(status().isOk())
            .andExpect(cookie().httpOnly("jwt", true))
            .andReturn().getResponse().getCookie("jwt");
    }
}
