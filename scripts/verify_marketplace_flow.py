import json
import re
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts"
ARTIFACTS.mkdir(exist_ok=True)

report = {
    "buyer_login": None,
    "product": None,
    "order_id": None,
    "order_confirmed": False,
    "purchase_history_visible": False,
    "seller_login": None,
    "seller_dashboard_visible": False,
    "seller_order_visible": False,
    "seller_status_updated": False,
    "console_errors": [],
    "failed_local_requests": [],
    "local_responses": [],
}

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)

    buyer = browser.new_context(viewport={"width": 1440, "height": 1000})
    buyer_page = buyer.new_page()
    buyer_page.on(
        "console",
        lambda message: report["console_errors"].append(message.text)
        if message.type == "error"
        else None,
    )
    buyer_page.on(
        "requestfailed",
        lambda request: report["failed_local_requests"].append(
            {"url": request.url, "failure": request.failure}
        )
        if request.url.startswith("http://127.0.0.1")
        else None,
    )
    buyer_page.on(
        "response",
        lambda response: report["local_responses"].append(
            {"url": response.url, "status": response.status}
        )
        if "/api/orders" in response.url or "/api/auth/me" in response.url
        else None,
    )

    login = buyer.request.post(
        "http://127.0.0.1:5173/api/auth/login",
        data={"email": "customer1@test.com", "password": "customer123"},
    )
    report["buyer_login"] = login.status

    products_response = buyer.request.get(
        "http://127.0.0.1:5173/api/products?page=0&size=30"
    )
    products = products_response.json()["content"]
    seller_group = next(group for group in products if group["username"] == "producer1")
    product = next(product for product in seller_group["products"] if product["quantity"] > 0)
    report["product"] = {"id": product["productId"], "name": product["name"]}

    buyer_page.goto(
        f"http://127.0.0.1:5173/item-details/{product['productId']}",
        wait_until="networkidle",
    )
    buyer_page.get_by_role("button", name="Buy now").click()
    buyer_page.wait_for_url("**/cart")

    buyer_page.get_by_label("Shipping address").fill("10 Market Street, Beirut")
    buyer_page.get_by_label("Phone number").fill("+961 1 555 010")
    buyer_page.get_by_label("Name on card").fill("John Smith")
    buyer_page.get_by_label("Card number").fill("4242 4242 4242 4242")
    buyer_page.get_by_label("Expiry").fill("12/29")
    buyer_page.get_by_label("Security code").fill("123")
    buyer_page.get_by_role("button", name="Pay and place order").click()
    try:
        buyer_page.wait_for_url("**/order-success", timeout=45000)
    except Exception:
        report["checkout_diagnostic"] = {
            "url": buyer_page.url,
            "required_fields": buyer_page.locator("input[required]").evaluate_all(
                "els => els.map(el => ({name: el.getAttribute('placeholder'), value: el.value, valid: el.checkValidity()}))"
            ),
            "page_text": buyer_page.locator("body").inner_text()[-2500:],
        }
        buyer_page.screenshot(
            path=str(ARTIFACTS / "checkout-failure.png"), full_page=True
        )
        print(json.dumps(report, indent=2))
        raise
    buyer_page.get_by_role("heading", name="Your order is confirmed").wait_for()
    confirmation_text = buyer_page.locator("body").inner_text()
    order_match = re.search(r"Order\s+#?(\d+)", confirmation_text)
    if not order_match:
        raise AssertionError("The confirmation page did not expose an order number")
    order_id = int(order_match.group(1))
    report["order_id"] = order_id
    report["order_confirmed"] = True
    buyer_page.screenshot(
        path=str(ARTIFACTS / "buyer-order-confirmed.png"), full_page=True
    )

    buyer_page.goto(
        "http://127.0.0.1:5173/user/dashboard/my-purchases",
        wait_until="networkidle",
    )
    buyer_page.get_by_role("heading", name="My Purchases").wait_for(timeout=15000)
    report["purchase_history_visible"] = (
        f"ORDER-{order_id}" in buyer_page.locator("body").inner_text()
        or product["name"] in buyer_page.locator("body").inner_text()
    )
    buyer_page.screenshot(
        path=str(ARTIFACTS / "buyer-purchases.png"), full_page=True
    )
    buyer.close()

    seller = browser.new_context(viewport={"width": 1440, "height": 1000})
    seller_page = seller.new_page()
    seller_page.on(
        "console",
        lambda message: report["console_errors"].append(message.text)
        if message.type == "error"
        else None,
    )
    seller_page.on(
        "requestfailed",
        lambda request: report["failed_local_requests"].append(
            {"url": request.url, "failure": request.failure}
        )
        if request.url.startswith("http://127.0.0.1")
        else None,
    )

    seller_login = seller.request.post(
        "http://127.0.0.1:5173/api/auth/login",
        data={"email": "producer1@test.com", "password": "producer123"},
    )
    report["seller_login"] = seller_login.status

    seller_page.goto(
        "http://127.0.0.1:5173/seller/dashboard", wait_until="networkidle"
    )
    seller_page.get_by_role(
        "heading", name="Run your marketplace business"
    ).wait_for(timeout=15000)
    report["seller_dashboard_visible"] = True

    seller_page.goto(
        "http://127.0.0.1:5173/seller/dashboard/orders",
        wait_until="networkidle",
    )
    seller_page.get_by_role("heading", name="Orders to fulfill").wait_for(
        timeout=15000
    )
    order_card = seller_page.locator("article").filter(
        has_text=f"Order #{order_id}"
    )
    order_card.wait_for(timeout=15000)
    report["seller_order_visible"] = True
    action = order_card.get_by_role("button", name="Start processing")
    action.click()
    order_card.get_by_text("PROCESSING", exact=True).wait_for(timeout=15000)
    report["seller_status_updated"] = True
    seller_page.screenshot(
        path=str(ARTIFACTS / "seller-orders.png"), full_page=True
    )
    seller.close()

    browser.close()

print(json.dumps(report, indent=2))
