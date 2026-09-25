import type { MarketplaceSort } from "@/types/marketplace";

export const conditionLabels: Record<string, string> = {
  NEW: "New",
  LIKE_NEW: "Like new",
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Well used",
};

export const sortLabels: Record<MarketplaceSort, string> = {
  newest: "Newest first",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
};

export function formatListingDate(value?: string) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function normalizeListingImage(value?: string | null) {
  const image = value?.trim();
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) {
    return image;
  }
  if (image.startsWith("/api/products/images/")) {
    return image.replace("/api/products/images/", "/api/listings/images/");
  }
  if (image.startsWith("/")) return image;
  return `/api/listings/images/${encodeURIComponent(image)}`;
}
