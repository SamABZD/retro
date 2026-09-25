import json
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts"
ARTIFACTS.mkdir(exist_ok=True)

console_errors = []
failed_requests = []

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1100})
    page.on(
        "console",
        lambda message: console_errors.append(message.text)
        if message.type == "error"
        else None,
    )
    page.on(
        "requestfailed",
        lambda request: failed_requests.append(
            {"url": request.url, "failure": request.failure}
        ),
    )

    login_response = page.request.post(
        "http://127.0.0.1:5173/api/auth/login",
        data={"email": "producer1@test.com", "password": "producer123"},
    )
    response = page.goto("http://127.0.0.1:5173/", wait_until="domcontentloaded")
    try:
        page.wait_for_load_state("networkidle", timeout=10_000)
    except Exception:
        # Google Translate can keep a background request open indefinitely.
        pass
    page.locator("h1, h2").first.wait_for(timeout=15_000)
    page.screenshot(path=str(ARTIFACTS / "marketplace-home.png"), full_page=True)

    product_payload = page.evaluate(
        """async () => {
          const response = await fetch('/api/products?page=0&size=12');
          return response.json();
        }"""
    )
    first_group = product_payload["content"][0]
    first_product = first_group["products"][0]

    detail_response = page.goto(
        f"http://127.0.0.1:5173/item-details/{first_product['productId']}",
        wait_until="domcontentloaded",
    )
    page.get_by_text(first_product["name"], exact=False).first.wait_for(
        timeout=15_000
    )
    page.screenshot(path=str(ARTIFACTS / "marketplace-item.png"), full_page=True)

    report = {
        "home_status": response.status if response else None,
        "detail_status": detail_response.status if detail_response else None,
        "login_status": login_response.status,
        "title": page.title(),
        "seeded_total": product_payload["totalElements"],
        "tested_product": first_product["name"],
        "tested_product_visible": first_product["name"] in page.locator("body").inner_text(),
        "headings": page.locator("h1, h2").all_inner_texts()[:12],
        "console_errors": console_errors,
        "failed_requests": failed_requests,
    }
    print(json.dumps(report, indent=2))
    browser.close()
