import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider, useCart, type CartItem } from "./CartContext";

const queryState = vi.hoisted(() => ({
  current: { data: undefined as undefined | { data: { id: string } }, isLoading: false },
}));

vi.mock("@/redux/fetures/users.api", () => ({
  useGetMeQuery: () => queryState.current,
}));

function CartProbe() {
  const { items } = useCart();
  return <output aria-label="Cart contents">{JSON.stringify(items)}</output>;
}

const item = (id: string, quantity: number, maxQuantity: number): CartItem => ({
  id,
  title: `Listing ${id}`,
  price: 10,
  image: "/demo/item.jpg",
  sellerName: "Seller",
  quantity,
  maxQuantity,
});

describe("CartProvider account storage", () => {
  beforeEach(() => {
    localStorage.clear();
    queryState.current = { data: undefined, isLoading: false };
  });

  it("moves a guest cart into the authenticated account without overwriting saved items", async () => {
    localStorage.setItem("local-market-cart:guest", JSON.stringify([
      item("shared", 2, 4),
      item("guest-only", 1, 2),
    ]));
    localStorage.setItem("local-market-cart:buyer-1", JSON.stringify([
      item("shared", 1, 3),
      item("saved-only", 1, 1),
    ]));
    queryState.current = {
      data: { data: { id: "buyer-1" } },
      isLoading: false,
    };

    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>,
    );

    await waitFor(() => {
      const contents = JSON.parse(screen.getByLabelText("Cart contents").textContent || "[]") as CartItem[];
      expect(contents.map((entry) => entry.id)).toEqual(["shared", "saved-only", "guest-only"]);
      expect(contents.find((entry) => entry.id === "shared")).toMatchObject({
        quantity: 3,
        maxQuantity: 3,
      });
    });

    expect(localStorage.getItem("local-market-cart:guest")).toBeNull();
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem("local-market-cart:buyer-1") || "[]")).toHaveLength(3);
    });
  });
});
