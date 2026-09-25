import { describe, expect, it } from "vitest";
import { formatOrderDate, orderStatusLabel } from "./orderPresentation";

describe("order presentation", () => {
  it("maps domain statuses to readable labels", () => {
    expect(orderStatusLabel("PAYMENT_COMPLETED")).toBe("Order placed");
    expect(orderStatusLabel("AWAITING_PICKUP")).toBe("AWAITING PICKUP");
  });

  it("handles missing and invalid dates", () => {
    expect(formatOrderDate()).toBe("Date unavailable");
    expect(formatOrderDate("invalid")).toBe("Date unavailable");
  });
});
