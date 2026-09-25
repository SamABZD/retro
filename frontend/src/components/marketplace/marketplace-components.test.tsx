import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrderStatusBadge } from "@/features/orders/OrderStatusBadge";
import { ListingStatusBadge } from "./ListingStatusBadge";
import { PriceDisplay } from "./PriceDisplay";

describe("marketplace presentation components", () => {
  it("formats monetary values", () => {
    render(<PriceDisplay amount="1299.5" />);
    expect(screen.getByText("$1,299.50")).toBeInTheDocument();
  });

  it("shows customer-facing listing status labels", () => {
    render(<ListingStatusBadge status="ACTIVE" />);
    expect(screen.getByText("Available")).toHaveAttribute("data-variant", "success");
  });

  it("shows customer-facing order status labels", () => {
    render(<OrderStatusBadge status="DELIVERED" />);
    expect(screen.getByText("Delivered")).toHaveAttribute("data-variant", "success");
  });
});
