import { describe, expect, it } from "vitest";
import { formatListingDate, normalizeListingImage } from "./marketplace";

describe("normalizeListingImage", () => {
  it("normalizes server filenames and the legacy image route", () => {
    expect(normalizeListingImage("camera.webp")).toBe("/api/listings/images/camera.webp");
    expect(normalizeListingImage("/api/products/images/camera.webp")).toBe("/api/listings/images/camera.webp");
  });

  it("preserves safe web and root-relative URLs", () => {
    expect(normalizeListingImage("https://images.example/camera.webp")).toBe("https://images.example/camera.webp");
    expect(normalizeListingImage("/demo/camera.webp")).toBe("/demo/camera.webp");
  });

  it("does not expose embedded data or blob URLs", () => {
    expect(normalizeListingImage("data:image/svg+xml,<svg/>"))
      .toBe("/api/listings/images/data%3Aimage%2Fsvg%2Bxml%2C%3Csvg%2F%3E");
    expect(normalizeListingImage("blob:https://example.test/id"))
      .toBe("/api/listings/images/blob%3Ahttps%3A%2F%2Fexample.test%2Fid");
  });
});

describe("formatListingDate", () => {
  it("handles absent and invalid dates", () => {
    expect(formatListingDate()).toBe("Date unavailable");
    expect(formatListingDate("not-a-date")).toBe("Date unavailable");
  });

  it("formats a valid marketplace date", () => {
    expect(formatListingDate("2026-09-24T12:00:00Z")).toMatch(/Sep 24, 2026/);
  });
});
