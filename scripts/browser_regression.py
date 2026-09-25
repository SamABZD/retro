"""Browser regression for checkout, permissions, concurrency, and account flows.

Run this against a freshly seeded, isolated local-profile backend and the Vite
development server. The script intentionally mutates its disposable database.
"""

from __future__ import annotations

import base64
import re
import time
from pathlib import Path

from playwright.sync_api import Browser, Page, expect, sync_playwright


BASE = "http://127.0.0.1:5173"
ROOT = Path(__file__).resolve().parents[1]
VALID_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg=="
)


def monitored_page(browser: Browser, *, width: int = 1280, height: int = 900):
    context = browser.new_context(viewport={"width": width, "height": height})
    page = context.new_page()
    page_errors: list[str] = []
    server_errors: list[str] = []
    page.on("pageerror", lambda error: page_errors.append(str(error)))
    page.on(
        "response",
        lambda response: server_errors.append(f"{response.status} {response.url}")
        if response.status >= 500 and response.url.startswith(BASE)
        else None,
    )
    return context, page, page_errors, server_errors


def login(page: Page, email: str, password: str, expected_path: str = "/") -> None:
    page.goto(f"{BASE}/login")
    page.get_by_label("Email address").fill(email)
    page.get_by_label("Password", exact=True).fill(password)
    page.get_by_role("button", name="Sign in", exact=True).click()
    page.wait_for_url(f"{BASE}{expected_path}")


def logout(page: Page) -> None:
    page.goto(BASE)
    page.get_by_label("Open account menu").click()
    page.get_by_text("Sign out", exact=True).click()
    page.wait_for_url(f"{BASE}/")
    expect(page.get_by_role("link", name="Sign in")).to_be_visible()


def api(page: Page, url: str, method: str = "GET", body=None):
    return page.evaluate(
        """async ({url, method, body}) => {
          const csrf = document.cookie.split('; ').find(value => value.startsWith('XSRF-TOKEN='));
          const headers = {};
          if (csrf) headers['X-XSRF-TOKEN'] = decodeURIComponent(csrf.split('=').slice(1).join('='));
          if (body !== null) headers['Content-Type'] = 'application/json';
          const response = await fetch(url, {
            method, headers, credentials: 'include',
            body: body === null ? undefined : JSON.stringify(body),
          });
          let payload = null;
          try { payload = await response.json(); } catch (_) {}
          return {status: response.status, payload};
        }""",
        {"url": url, "method": method, "body": body},
    )


def multipart(page: Page, fields: dict[str, str], files: list[dict] | None = None, url: str = "/api/listings", method: str = "POST"):
    encoded_files = []
    for spec in files or []:
        encoded_files.append(
            {
                "name": spec["name"],
                "type": spec["type"],
                "base64": base64.b64encode(spec.get("bytes", b"")).decode(),
                "size": spec.get("size"),
            }
        )
    return page.evaluate(
        """async ({fields, files, url, method}) => {
          const form = new FormData();
          Object.entries(fields).forEach(([key, value]) => form.append(key, value));
          for (const spec of files) {
            let bytes;
            if (spec.size) {
              bytes = new Uint8Array(spec.size);
            } else {
              const binary = atob(spec.base64);
              bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
            }
            form.append('image', new File([bytes], spec.name, {type: spec.type}));
          }
          const csrf = document.cookie.split('; ').find(value => value.startsWith('XSRF-TOKEN='));
          const headers = {};
          if (csrf) headers['X-XSRF-TOKEN'] = decodeURIComponent(csrf.split('=').slice(1).join('='));
          const response = await fetch(url, {method, headers, credentials: 'include', body: form});
          let payload = null;
          try { payload = await response.json(); } catch (_) {}
          return {status: response.status, payload};
        }""",
        {"fields": fields, "files": encoded_files, "url": url, "method": method},
    )


def listing_fields(title: str, category_id: int, *, price: str = "49.00", quantity: str = "1", description: str = "Browser regression listing."):
    return {
        "title": title,
        "description": description,
        "price": price,
        "quantity": quantity,
        "categoryIds": str(category_id),
        "imageUrl": "https://example.com/regression-listing.jpg",
        "condition": "GOOD",
    }


def create_listing(page: Page, title: str, category_id: int, *, price: str = "49.00", quantity: str = "1") -> dict:
    result = multipart(page, listing_fields(title, category_id, price=price, quantity=quantity))
    assert result["status"] == 200, result
    return result["payload"]


def approve(page: Page, listing_id: int) -> None:
    result = api(page, f"/api/listings/{listing_id}/approve", "POST")
    assert result["status"] == 200, result


def checkout(page: Page, listing_id: int, quantity: int = 1, **extra):
    body = {
        "items": [{"productId": listing_id, "quantity": quantity}],
        "shippingAddress": "Hamra, Beirut",
        "phoneNumber": "+961 70 000 000",
        **extra,
    }
    return api(page, "/api/orders/checkout", "POST", body)


def arm_checkout(page: Page, listing_id: int, start_ms: int) -> None:
    page.evaluate(
        """({listingId, start}) => {
          const csrf = document.cookie.split('; ').find(value => value.startsWith('XSRF-TOKEN='));
          const headers = {'Content-Type': 'application/json'};
          if (csrf) headers['X-XSRF-TOKEN'] = decodeURIComponent(csrf.split('=').slice(1).join('='));
          window.__regressionCheckout = new Promise(resolve => {
            setTimeout(async () => {
              const response = await fetch('/api/orders/checkout', {
                method: 'POST', headers, credentials: 'include',
                body: JSON.stringify({
                  items: [{productId: listingId, quantity: 1}],
                  shippingAddress: 'Hamra, Beirut',
                  phoneNumber: '+961 70 000 000',
                }),
              });
              let payload = null;
              try { payload = await response.json(); } catch (_) {}
              resolve({status: response.status, payload});
            }, Math.max(0, start - Date.now()));
          });
          return true;
        }""",
        {"listingId": listing_id, "start": start_ms},
    )


def flat_listings(payload: dict) -> list[dict]:
    return [product for group in payload.get("content", []) for product in group.get("products", [])]


def main() -> None:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        contexts = []
        monitors: list[tuple[list[str], list[str]]] = []

        def page_for(**kwargs):
            context, page, page_errors, server_errors = monitored_page(browser, **kwargs)
            contexts.append(context)
            monitors.append((page_errors, server_errors))
            return page, page_errors, server_errors

        # Guest discovery, search URL state, history, direct routes, and controlled errors.
        guest, guest_errors, guest_server_errors = page_for()
        guest.goto(BASE)
        expect(guest.get_by_role("heading", name="Useful things deserve their next owner.")).to_be_visible()
        expect(guest.get_by_role("link", name="Browse all listings")).to_be_visible()
        expect(guest.get_by_role("link", name="Sign in")).to_be_visible()

        searches = [
            "/api/listings?page=0&size=100&search=",
            "/api/listings?page=0&size=100&search=%20%20%20",
            "/api/listings?page=0&size=100&search=GuItAr",
            "/api/listings?page=0&size=100&search=%25_%3Cscript%3E",
            f"/api/listings?page=0&size=100&search={'x' * 512}",
            "/api/listings?page=999&size=12",
            "/api/listings?page=0&size=100&minPrice=0",
            "/api/listings?page=0&size=100&maxPrice=999999.99",
            "/api/listings?page=0&size=100&sortBy=price&direction=asc",
            "/api/listings?page=0&size=100&sortBy=price&direction=desc",
        ]
        for url in searches:
            result = api(guest, url)
            assert result["status"] == 200, (url, result)
        assert api(guest, "/api/listings?minPrice=-1")["status"] == 400
        assert api(guest, "/api/listings?maxPrice=-1")["status"] == 400
        assert api(guest, "/api/listings?minPrice=100&maxPrice=10")["status"] == 400

        guest.goto(f"{BASE}/search?search=guitar&condition=GOOD&sort=price-asc")
        expect(guest.get_by_role("heading", name=re.compile("Search results for"))).to_be_visible()
        guest.get_by_role("link", name="View Steel-String Acoustic Guitar").click()
        guest.wait_for_url(f"{BASE}/item-details/18")
        expect(guest.get_by_role("heading", name="Steel-String Acoustic Guitar", level=1)).to_be_visible()
        guest.go_back()
        guest.wait_for_url(re.compile(r"search=guitar.*condition=GOOD.*sort=price-asc"))
        guest.go_forward()
        guest.wait_for_url(f"{BASE}/item-details/18")
        expect(guest.get_by_role("heading", name="Steel-String Acoustic Guitar", level=1)).to_be_visible()
        guest.goto(f"{BASE}/search?minPrice=500&maxPrice=10")
        expect(guest.get_by_role("heading", name="Check the price range")).to_be_visible()
        guest.goto(f"{BASE}/search?search=definitely-no-such-listing")
        expect(guest.get_by_role("heading", name=re.compile("No listings found"))).to_be_visible()
        guest.goto(f"{BASE}/not-a-real-route")
        expect(guest.get_by_role("heading", name="Page not found")).to_be_visible()
        guest.goto(f"{BASE}/item-details/999999")
        expect(guest.get_by_role("heading", name="Listing not found")).to_be_visible()

        # Guest cart -> login -> same cart. This is the Browser auth-handoff regression.
        guest.goto(f"{BASE}/item-details/18")
        guest.get_by_role("button", name="Add to cart").click()
        guest.goto(f"{BASE}/cart")
        guest.get_by_label("Shipping address").fill("Hamra, Beirut")
        guest.get_by_label("Phone number").fill("+961 70 000 000")
        guest.get_by_role("button", name="Sign in to checkout").click()
        guest.wait_for_url(f"{BASE}/login")
        guest.get_by_label("Email address").fill("buyer1@test.com")
        guest.get_by_label("Password", exact=True).fill("wrong-password")
        guest.get_by_role("button", name="Sign in", exact=True).click()
        expect(guest).to_have_url(f"{BASE}/login")
        guest.get_by_label("Password", exact=True).fill("buyer123")
        guest.get_by_role("button", name="Sign in", exact=True).click()
        guest.wait_for_url(f"{BASE}/cart")
        expect(guest.get_by_text("Steel-String Acoustic Guitar", exact=True)).to_be_visible()
        assert api(guest, "/api/auth/login", "POST", {"email": "not-an-email", "password": "buyer123"})["status"] == 400

        # Registration cannot self-assign a privileged role.
        registration = page_for()[0]
        registration.goto(BASE)
        registered = api(registration, "/api/auth/register", "POST", {
            "username": "regressionbuyer",
            "email": "regressionbuyer@example.com",
            "firstname": "Browser",
            "lastname": "Buyer",
            "password": "SafePassword123!",
            "role": "ADMIN",
        })
        assert registered["status"] == 200, registered
        registered_me = api(registration, "/api/auth/me")
        assert registered_me["status"] == 200 and registered_me["payload"]["role"] == "CUSTOMER", registered_me

        # Malformed cookies fail closed.
        malformed_context = browser.new_context()
        contexts.append(malformed_context)
        malformed_context.add_cookies([{"name": "jwt", "value": "not.a.jwt", "url": BASE}])
        malformed = malformed_context.new_page()
        malformed.goto(BASE)
        assert api(malformed, "/api/auth/me")["status"] == 401

        # Seller/admin setup and backend validation/attack surface.
        seller1 = page_for()[0]
        seller2 = page_for()[0]
        admin = page_for()[0]
        buyer2 = page_for()[0]
        login(seller1, "seller1@test.com", "producer123")
        login(seller2, "seller2@test.com", "producer123")
        login(admin, "admin@local.market", "admin12345")
        login(buyer2, "buyer2@test.com", "buyer123")
        categories = api(seller1, "/api/categories")["payload"]
        category_id = next(item["categoryId"] for item in categories if item["name"] == "Electronics")

        invalid_fields = [
            listing_fields("T" * 256, category_id),
            listing_fields("Valid title", category_id, description="D" * 256),
            listing_fields("Valid title", category_id, price="0"),
            listing_fields("Valid title", category_id, price="-1"),
            listing_fields("Valid title", category_id, price="10.001"),
            listing_fields("Valid title", category_id, price="1000000"),
            listing_fields("Valid title", category_id, quantity="0"),
            listing_fields("Valid title", category_id, quantity="-1"),
            listing_fields("Valid title", category_id, quantity="2147483648"),
            listing_fields("Valid title", 999999),
        ]
        for fields in invalid_fields:
            result = multipart(seller1, fields)
            assert result["status"] in (400, 404), result
        blank_description = listing_fields("Valid title", category_id, description="   ")
        assert multipart(seller1, blank_description)["status"] == 400
        no_image = listing_fields("No image", category_id)
        no_image.pop("imageUrl")
        assert multipart(seller1, no_image)["status"] == 400

        png = {"name": "safe.png", "type": "image/png", "bytes": VALID_PNG}
        attack_files = [
            {"name": "renamed-executable.png", "type": "image/png", "bytes": b"MZ\x00\x00payload"},
            {"name": "fake.png", "type": "image/png", "bytes": b"not a png"},
            {"name": "notes.txt", "type": "text/plain", "bytes": b"plain text"},
            {"name": "active.svg", "type": "image/svg+xml", "bytes": b"<svg onload='alert(1)'/>"},
            {"name": "malformed.jpg", "type": "image/jpeg", "bytes": b"\xff\xd8"},
            {"name": "oversized.png", "type": "image/png", "size": 5_000_001},
        ]
        base_upload_fields = listing_fields("Upload attack", category_id)
        base_upload_fields.pop("imageUrl")
        for malicious in attack_files:
            result = multipart(seller1, base_upload_fields, [malicious])
            assert result["status"] == 400, (malicious["name"], result)
        assert multipart(seller1, base_upload_fields, [png] * 9)["status"] == 400
        traversal = multipart(
            seller1,
            {**base_upload_fields, "title": "Traversal filename is contained"},
            [{"name": "../../escape.png", "type": "image/png", "bytes": VALID_PNG}],
        )
        assert traversal["status"] == 200, traversal
        stored = traversal["payload"]["images"][0]
        assert re.fullmatch(r"/api/listings/images/[a-f0-9-]+\.png", stored), stored

        # Double-clicking listing creation must not duplicate a listing.
        seller1.goto(f"{BASE}/seller/dashboard/ads/create")
        seller1.get_by_label("Title").fill("Regression Double Submit")
        seller1.get_by_label("Description").fill("Created by a rapid double-click regression check.")
        seller1.get_by_label("Category").select_option(str(category_id))
        seller1.get_by_label("Condition").select_option("GOOD")
        seller1.get_by_label("Price (USD)").fill("55.00")
        seller1.get_by_label("Quantity").fill("1")
        seller1.locator('input[type="file"]').set_input_files(str(ROOT / "frontend" / "public" / "favicon.png"))
        seller1.get_by_role("button", name="Submit listing").dblclick(delay=10)
        seller1.wait_for_url(f"{BASE}/seller/dashboard/all-ads")
        owned = api(seller1, "/api/listings/my-products?page=0&size=100")
        duplicates = [item for item in owned["payload"]["content"] if item["title"] == "Regression Double Submit"]
        assert len(duplicates) == 1, duplicates

        # Create inventory used by concurrency, authority, status, and cancellation checks.
        race_listing = create_listing(seller1, "Regression Concurrency Item", category_id, price="91.25")
        lifecycle_listing = create_listing(seller1, "Regression Lifecycle Item", category_id, price="77.77")
        duplicate_item_listing = create_listing(seller1, "Regression Duplicate Item", category_id, price="12.50", quantity="2")
        cancel_listing = create_listing(seller1, "Regression Cancellation Item", category_id, price="32.00", quantity="2")
        inactive_listing = create_listing(seller1, "Regression Inactive Item", category_id, price="18.00")
        for listing in (race_listing, lifecycle_listing, duplicate_item_listing, cancel_listing, inactive_listing):
            approve(admin, listing["productId"])

        # Cross-seller listing ownership is enforced for private read, edit, and archive.
        target_id = lifecycle_listing["productId"]
        assert api(seller2, f"/api/listings/my-listings/{target_id}")["status"] == 403
        denied_edit = multipart(
            seller2,
            listing_fields("Stolen listing", category_id),
            url=f"/api/listings/{target_id}",
            method="PUT",
        )
        assert denied_edit["status"] == 403, denied_edit
        assert api(seller2, f"/api/listings/{target_id}", "DELETE")["status"] == 403
        assert checkout(seller1, target_id)["status"] == 400

        # Two buyers race for quantity one: exactly one wins and stock never goes negative.
        start_ms = int(time.time() * 1000) + 900
        arm_checkout(guest, race_listing["productId"], start_ms)
        arm_checkout(buyer2, race_listing["productId"], start_ms)
        race_one = guest.evaluate("window.__regressionCheckout")
        race_two = buyer2.evaluate("window.__regressionCheckout")
        assert sorted([race_one["status"], race_two["status"]]) == [200, 400], (race_one, race_two)
        raced = api(seller1, f"/api/listings/{race_listing['productId']}")
        assert raced["payload"]["quantity"] == 0 and raced["payload"]["listingStatus"] == "SOLD", raced

        assert api(guest, "/api/orders/checkout", "POST", {
            "items": [], "shippingAddress": "Beirut", "phoneNumber": "12345678"
        })["status"] == 400
        assert checkout(guest, 999999)["status"] == 404

        # Unknown client totals/prices/seller ids are rejected; a clean request uses the database price.
        forged_attempt = api(guest, "/api/orders/checkout", "POST", {
            "items": [{"productId": target_id, "quantity": 1, "price": 0, "sellerId": 999999}],
            "shippingAddress": "Hamra, Beirut",
            "phoneNumber": "+961 70 000 000",
            "subtotal": 0,
            "total": 0,
        })
        assert forged_attempt["status"] == 400, forged_attempt
        authoritative = checkout(guest, target_id)
        assert authoritative["status"] == 200, authoritative
        authoritative_order = authoritative["payload"][0]
        assert float(authoritative_order["totalPrice"]) == 77.77, authoritative_order

        # Repeated lines are combined once and cannot oversell.
        combined = api(guest, "/api/orders/checkout", "POST", {
            "items": [
                {"productId": duplicate_item_listing["productId"], "quantity": 1},
                {"productId": duplicate_item_listing["productId"], "quantity": 1},
            ],
            "shippingAddress": "Hamra, Beirut",
            "phoneNumber": "+961 70 000 000",
        })
        assert combined["status"] == 200, combined
        assert len(combined["payload"][0]["items"]) == 1
        assert combined["payload"][0]["items"][0]["quantity"] == 2

        # Buyer/order isolation and seller lifecycle enforcement.
        order_id = authoritative_order["orderId"]
        assert api(buyer2, f"/api/orders/my-orders/{order_id}")["status"] == 404
        assert api(buyer2, f"/api/orders/receipt/{order_id}")["status"] == 404
        assert api(seller2, f"/api/orders/{order_id}/status?status=PROCESSING", "PUT")["status"] == 403
        for status_name in ("PROCESSING", "SHIPPED", "DELIVERED"):
            updated = api(seller1, f"/api/orders/{order_id}/status?status={status_name}", "PUT")
            assert updated["status"] == 200 and updated["payload"]["status"] == status_name, updated
        assert api(seller1, f"/api/orders/{order_id}/status?status=PROCESSING", "PUT")["status"] == 400

        cancelled_order = checkout(guest, cancel_listing["productId"])
        assert cancelled_order["status"] == 200, cancelled_order
        cancelled_id = cancelled_order["payload"][0]["orderId"]
        cancelled = api(seller1, f"/api/orders/{cancelled_id}/status?status=CANCELLED", "PUT")
        assert cancelled["status"] == 200 and cancelled["payload"]["status"] == "CANCELLED", cancelled
        restored = api(seller1, f"/api/listings/{cancel_listing['productId']}")
        assert restored["payload"]["quantity"] == 2 and restored["payload"]["listingStatus"] == "ACTIVE", restored

        inactive_fields = listing_fields("Regression Inactive Item", category_id, price="18.00")
        inactive_fields["existingImages"] = '["https://example.com/regression-listing.jpg"]'
        inactive_fields["listingStatus"] = "INACTIVE"
        made_inactive = multipart(
            seller1,
            inactive_fields,
            url=f"/api/listings/{inactive_listing['productId']}",
            method="PUT",
        )
        assert made_inactive["status"] == 200, made_inactive
        approve(admin, inactive_listing["productId"])
        assert checkout(guest, inactive_listing["productId"])["status"] == 400

        # Buyer A logout -> Buyer B login in the same browser cannot expose A cart/order/cache state.
        guest.goto(f"{BASE}/user/dashboard/my-purchases")
        expect(guest.get_by_text("Regression Lifecycle Item", exact=True)).to_be_visible()
        logout(guest)
        guest.goto(f"{BASE}/user/dashboard/my-purchases")
        guest.wait_for_url(f"{BASE}/login")
        assert api(guest, "/api/orders")["status"] == 401
        login(guest, "buyer2@test.com", "buyer123", "/user/dashboard/my-purchases")
        guest.goto(f"{BASE}/cart")
        expect(guest.get_by_text("Steel-String Acoustic Guitar", exact=True)).not_to_be_visible()
        guest.goto(f"{BASE}/user/dashboard/my-purchases")
        expect(guest.get_by_text("Regression Lifecycle Item", exact=True)).not_to_be_visible()

        # Seller role routes fail closed and account switching does not leak seller-owned data.
        seller1.goto(f"{BASE}/seller/dashboard/all-ads")
        expect(seller1.get_by_text("Regression Lifecycle Item", exact=True)).to_be_visible()
        logout(seller1)
        login(seller1, "seller2@test.com", "producer123")
        seller1.goto(f"{BASE}/seller/dashboard/all-ads")
        expect(seller1.get_by_text("Regression Lifecycle Item", exact=True)).not_to_be_visible()
        seller1.goto(f"{BASE}/user/dashboard")
        seller1.wait_for_url(f"{BASE}/seller/dashboard")

        # Demo content is local, coherent, and fully available without third-party assets.
        demo = api(buyer2, "/api/listings?page=0&size=100")
        assert demo["status"] == 200
        demo_listings = [item for item in flat_listings(demo["payload"]) if item["productId"] <= 18]
        assert len(demo_listings) == 18, len(demo_listings)
        for item in demo_listings:
            assert item["title"].strip() and item["description"].strip()
            assert float(item["price"]) > 0 and item["condition"]
            assert item["categories"] and item["images"]
            for image in item["images"]:
                assert image.startswith("/demo/"), (item["title"], image)
                response = buyer2.request.get(f"{BASE}{image}")
                assert response.ok, (item["title"], image, response.status)

        # Error-state and broken-image behavior remain controlled.
        error_context = browser.new_context(viewport={"width": 430, "height": 900})
        contexts.append(error_context)
        error_page = error_context.new_page()
        error_page.route("**/api/listings?**", lambda route: route.fulfill(status=500, content_type="application/json", body='{"message":"simulated"}'))
        error_page.goto(f"{BASE}/search")
        expect(error_page.get_by_role("heading", name="Listings couldn’t be loaded")).to_be_visible()
        error_page.unroute("**/api/listings?**")
        error_page.route("**/demo/**", lambda route: route.abort())
        error_page.goto(f"{BASE}/item-details/18")
        expect(error_page.get_by_role("img", name=re.compile("image unavailable")).first).to_be_visible()
        assert error_page.evaluate("document.documentElement.scrollWidth") <= 430

        # Buyer B's older session was revoked by the later login in the switching browser.
        assert api(buyer2, "/api/auth/me")["status"] == 401
        buyer2.goto(f"{BASE}/user/dashboard/my-purchases")
        buyer2.wait_for_url(f"{BASE}/login")
        assert api(buyer2, "/api/orders")["status"] == 401

        assert not guest_errors, guest_errors
        assert not guest_server_errors, guest_server_errors
        all_page_errors = [error for page_errors, _ in monitors for error in page_errors]
        all_server_errors = [error for _, server_errors in monitors for error in server_errors]
        assert not all_page_errors, all_page_errors
        assert not all_server_errors, all_server_errors

        for context in contexts:
            context.close()
        browser.close()

    print("Browser regression suite passed")
    print("- guest discovery/search/history/auth handoff")
    print("- auth abuse, role forgery, upload attacks, and text bounds")
    print("- double submission, concurrency, server pricing, isolation, lifecycle, cancellation")
    print("- demo assets, controlled errors, broken images, and responsive overflow")


if __name__ == "__main__":
    main()
