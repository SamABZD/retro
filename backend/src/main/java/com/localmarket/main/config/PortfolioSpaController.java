package com.localmarket.main.config;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** Serves the built React app on the same origin as its API in the portfolio demo. */
@Controller
@Profile("portfolio")
public class PortfolioSpaController {
    @GetMapping({
        "/", "/login", "/register", "/forgot-password", "/search",
        "/item-details/{id}", "/cart", "/order-success",
        "/terms", "/privacy", "/fraud-prevention", "/faq", "/about", "/contact",
        "/create-seller-profile", "/user/dashboard", "/user/dashboard/**",
        "/seller/dashboard", "/seller/dashboard/**"
    })
    public String frontend() {
        return "forward:/index.html";
    }
}
