"""Exercise one-click Retro demo entry against local,demo API and Vite demo mode.

Defaults to http://localhost:5174 so it can run beside the usual local servers.
"""
import os
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

BASE = os.environ.get("RETRO_DEMO_BASE", "http://localhost:5174")
OUTPUT = Path(__file__).resolve().parents[1] / "artifacts" / "retro-demo"


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()
        page.set_default_timeout(20000)

        page.goto(BASE)
        expect(page.get_by_role("link", name="Explore demo")).to_be_visible()
        page.goto(BASE + "/item-details/1")
        page.get_by_role("button", name="Add to cart").click()
        page.goto(BASE)
        page.get_by_role("link", name="Explore demo").click()
        expect(page.get_by_role("heading", name="Explore Retro")).to_be_visible()
        page.evaluate("window.scrollTo(0, 0)")
        page.screenshot(path=str(OUTPUT / "demo-entry-desktop.png"), full_page=True)

        page.set_viewport_size({"width": 390, "height": 844})
        page.evaluate("window.scrollTo(0, 0)")
        page.screenshot(path=str(OUTPUT / "demo-entry-mobile.png"), full_page=True)
        page.set_viewport_size({"width": 1440, "height": 900})

        page.get_by_role("button", name="Explore as Buyer").click()
        page.wait_for_url(BASE + "/")
        page.goto(BASE + "/cart")
        expect(page.get_by_role("heading", name="Your cart is empty")).to_be_visible()
        page.goto(BASE + "/item-details/1")
        page.get_by_role("button", name="Add to cart").click()
        page.goto(BASE + "/user/dashboard")
        expect(page.get_by_role("heading", name="Your account")).to_be_visible()
        page.screenshot(path=str(OUTPUT / "buyer-overview.png"), full_page=True)
        page.goto(BASE + "/user/dashboard/my-purchases")
        expect(page.get_by_text("Working 35mm Film Camera")).to_be_visible()
        expect(page.get_by_text("Mechanical Keyboard")).to_be_visible()

        page.goto(BASE + "/user/dashboard")
        page.get_by_role("button", name="Switch demo role").click()
        expect(page.get_by_role("button", name="Explore as Seller")).to_be_visible()
        expect(page.locator("#explore-demo")).to_be_in_viewport()
        page.get_by_role("button", name="Explore as Seller").click()
        page.wait_for_url(BASE + "/seller/dashboard")
        page.goto(BASE + "/cart")
        expect(page.get_by_role("heading", name="Your cart is empty")).to_be_visible()
        page.goto(BASE + "/seller/dashboard")
        expect(page.get_by_role("heading", name="Your shop")).to_be_visible()
        expect(page.get_by_text("Sold listings")).to_be_visible()
        page.screenshot(path=str(OUTPUT / "seller-overview.png"), full_page=True)

        page.reload()
        expect(page.get_by_role("heading", name="Your shop")).to_be_visible()
        page.goto(BASE + "/seller/dashboard/all-ads")
        expect(page.get_by_role("heading", name="My listings")).to_be_visible()
        expect(page.get_by_text("Working 35mm Film Camera")).to_be_visible()
        page.goto(BASE + "/seller/dashboard/orders")
        expect(page.get_by_text("Working 35mm Film Camera")).to_be_visible()

        page.goto(BASE + "/seller/dashboard")
        page.get_by_role("button", name="Switch demo role").click()
        expect(page.get_by_role("button", name="Explore as Buyer")).to_be_visible()
        page.get_by_role("button", name="Explore as Buyer").click()
        page.wait_for_url(BASE + "/")
        page.goto(BASE + "/user/dashboard/my-purchases")
        expect(page.get_by_text("Working 35mm Film Camera")).to_be_visible()

        page.goto(BASE + "/user/dashboard")
        page.get_by_role("button", name="Sign out").click()
        page.wait_for_url(BASE + "/login")
        expect(page.get_by_role("button", name="Explore as Buyer")).to_be_visible()

        mobile = browser.new_page(viewport={"width": 390, "height": 844})
        mobile.goto(BASE)
        mobile.get_by_role("button", name="Open menu").click()
        mobile.get_by_role("link", name="Explore demo").click()
        mobile.get_by_role("button", name="Explore as Seller").click()
        mobile.wait_for_url(BASE + "/seller/dashboard")
        mobile.get_by_role("button", name="Open account navigation").click()
        mobile.get_by_role("button", name="Switch demo role").click()
        expect(mobile.get_by_role("button", name="Explore as Buyer")).to_be_visible()
        expect(mobile.locator("#explore-demo")).to_be_in_viewport()
        mobile.get_by_role("button", name="Explore as Buyer").click()
        mobile.wait_for_url(BASE + "/")
        browser.close()
    print(f"Desktop/mobile demo entry, role switching, cart isolation, refresh, orders, and logout passed. Screenshots: {OUTPUT}")


if __name__ == "__main__":
    main()
