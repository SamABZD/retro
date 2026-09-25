"""Targeted Retro contrast, keyboard, focus, and reduced-motion checks."""
import json
import re
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "artifacts/accessibility"
BASE = "http://127.0.0.1:5173"


def luminance(value):
    channels = [int(value[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    linear = [c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in channels]
    return sum(a * b for a, b in zip(linear, (.2126, .7152, .0722)))


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    colors = dict(re.findall(r"--([a-z-]+):\s*(#[0-9a-fA-F]{6})", (ROOT / "frontend/src/index.css").read_text()))
    pairs = [
        ("Ink on Ivory", "foreground", "background", 4.5),
        ("Secondary on Ivory", "muted-foreground", "background", 4.5),
        ("Secondary on White", "muted-foreground", "card", 4.5),
        ("Ink on Persimmon", "primary-foreground", "primary", 4.5),
        ("Ink on hover Persimmon", "primary-foreground", "primary-hover", 4.5),
        ("Accent text on Ivory", "brand-ink", "background", 4.5),
        ("Accent text on White", "brand-ink", "card", 4.5),
        ("Focus on Ivory", "ring", "background", 3),
        ("Focus on White", "ring", "card", 3),
        ("Input boundary on White", "input", "card", 3),
        ("Input boundary on Ivory", "input", "background", 3),
        ("Active / delivered", "success", "success-surface", 4.5),
        ("Processing", "warning-foreground", "warning-surface", 4.5),
        ("Shipped", "info", "info-surface", 4.5),
        ("Cancelled", "destructive", "destructive-surface", 4.5),
        ("Sold / neutral", "secondary-foreground", "secondary", 4.5),
    ]
    results = []
    for label, foreground, background, minimum in pairs:
        low, high = sorted((luminance(colors[foreground]), luminance(colors[background])))
        ratio = (high + .05) / (low + .05)
        results.append({"pair": label, "foreground": colors[foreground], "background": colors[background], "ratio": round(ratio, 2), "minimum": minimum, "passed": ratio >= minimum})
        assert ratio >= minimum, (label, ratio)
    (OUTPUT / "contrast-audit.json").write_text(json.dumps(results, indent=2))

    checks = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
        page.goto(BASE)
        page.wait_for_load_state("networkidle")
        page.keyboard.press("Tab")
        expect(page.get_by_role("link", name="Skip to content", exact=True)).to_be_focused()
        page.keyboard.press("Enter")
        expect(page.locator("#main-content")).to_be_focused()
        checks.append("Keyboard skip link transfers focus to main content")
        search = page.locator("#desktop-market-search")
        search.focus()
        outline = search.evaluate("el => ({border: getComputedStyle(el).borderColor, shadow: getComputedStyle(el).boxShadow})")
        assert "182, 56, 34" in outline["border"], outline
        assert "182, 56, 34" in outline["shadow"], outline
        search.fill("guitar")
        search.press("Enter")
        expect(page.get_by_role("heading", level=1)).to_contain_text("guitar")
        checks.append("Keyboard search submits and shows a contrasting focus boundary/ring")

        page.set_viewport_size({"width": 375, "height": 812})
        page.goto(BASE)
        menu = page.get_by_role("button", name="Open menu", exact=True)
        menu.focus()
        menu.press("Enter")
        dialog = page.get_by_role("dialog", name="Marketplace menu")
        expect(dialog).to_be_visible()
        assert dialog.evaluate("el => el.contains(document.activeElement)")
        page.keyboard.press("Escape")
        expect(dialog).not_to_be_visible()
        expect(menu).to_be_focused()
        checks.append("Mobile menu opens by keyboard and restores focus on Escape")

        page.goto(BASE + "/search")
        filters = page.get_by_role("button", name="Filters", exact=True)
        filters.focus()
        filters.press("Enter")
        sheet = page.get_by_role("dialog", name="Filter listings")
        expect(sheet).to_be_visible()
        sheet.get_by_role("combobox", name="Category").click()
        page.get_by_role("option", name="Musical Instruments").click()
        sheet.get_by_role("button", name="Apply filters").click()
        expect(page.get_by_role("heading", level=1)).to_have_text("Musical Instruments")
        checks.append("Mobile filter drawer retains working category selection")

        page.goto(BASE + "/login")
        page.get_by_label("Email address").fill("seller1@test.com")
        page.get_by_label("Password", exact=True).fill("producer123")
        page.get_by_role("button", name="Sign in", exact=True).click()
        page.wait_for_url(BASE + "/")
        page.goto(BASE + "/seller/dashboard")
        navigation = page.get_by_role("button", name="Open account navigation")
        navigation.focus()
        navigation.press("Enter")
        account_sheet = page.get_by_role("dialog")
        expect(account_sheet).to_be_visible()
        account_sheet.get_by_role("link", name="Create listing", exact=True).click()
        expect(page.get_by_role("heading", name="Create a listing")).to_be_visible()
        upload = page.locator('input[type="file"]')
        upload.focus()
        focus = upload.evaluate("el => ({width: getComputedStyle(el.parentElement).outlineWidth, color: getComputedStyle(el.parentElement).outlineColor})")
        assert focus == {"width": "2px", "color": "rgb(182, 56, 34)"}, focus
        checks.append("Seller drawer navigation works and photo upload has a visible focus target")
        assert page.evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches")
        transition = page.locator('button[type="submit"]').evaluate("el => getComputedStyle(el).transitionDuration")
        assert all(float(duration.rstrip('s')) <= .001 for duration in transition.split(', ')), transition
        checks.append("Reduced motion suppresses transitions without disabling controls")
        page.screenshot(path=OUTPUT / "create-listing-keyboard-focus.png", full_page=True)
        browser.close()
    (OUTPUT / "keyboard-audit.json").write_text(json.dumps(checks, indent=2))
    print(f"Passed {len(results)} contrast pairings and {len(checks)} keyboard/focus/motion checks")


if __name__ == "__main__":
    main()
