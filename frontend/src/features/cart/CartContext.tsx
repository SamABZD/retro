import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useGetMeQuery } from "@/redux/fetures/users.api";

export interface CartItem {
  id: string;
  title: string;
  price: number;
  image: string;
  sellerName: string;
  quantity: number;
  maxQuantity: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

const STORAGE_PREFIX = "local-market-cart";
const CartContext = createContext<CartContextValue | null>(null);

const isCartItem = (value: unknown): value is CartItem => {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartItem>;
  return (
    typeof item.id === "string" && item.id.length > 0 &&
    typeof item.title === "string" &&
    typeof item.price === "number" && Number.isFinite(item.price) && item.price > 0 &&
    typeof item.image === "string" &&
    typeof item.sellerName === "string" &&
    typeof item.quantity === "number" && Number.isInteger(item.quantity) && item.quantity > 0 &&
    typeof item.maxQuantity === "number" && Number.isInteger(item.maxQuantity) && item.maxQuantity > 0 &&
    item.quantity <= item.maxQuantity
  );
};

const loadCart = (storageKey: string): CartItem[] => {
  try {
    const saved = localStorage.getItem(storageKey);
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
  } catch {
    return [];
  }
};

const mergeCarts = (saved: CartItem[], incoming: CartItem[]) => {
  const merged = [...saved];
  for (const item of incoming) {
    const existing = merged.find((entry) => entry.id === item.id);
    if (existing) {
      const availableQuantity = Math.min(existing.maxQuantity, item.maxQuantity);
      existing.quantity = Math.min(
        existing.quantity + item.quantity,
        availableQuantity,
      );
      existing.maxQuantity = availableQuantity;
    } else {
      merged.push(item);
    }
  }
  return merged;
};

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: userData, isLoading } = useGetMeQuery();
  const desiredStorageKey = `${STORAGE_PREFIX}:${userData?.data?.id || "guest"}`;
  const [activeStorageKey, setActiveStorageKey] = useState(`${STORAGE_PREFIX}:guest`);
  const [items, setItems] = useState<CartItem[]>(() => loadCart(`${STORAGE_PREFIX}:guest`));
  const isSwitchingStorage = !isLoading && desiredStorageKey !== activeStorageKey;

  useEffect(() => {
    if (isSwitchingStorage) {
      const savedItems = loadCart(desiredStorageKey);
      const movingGuestCart = activeStorageKey === `${STORAGE_PREFIX}:guest`
        && desiredStorageKey !== `${STORAGE_PREFIX}:guest`;
      const nextItems = movingGuestCart ? mergeCarts(savedItems, items) : savedItems;
      if (movingGuestCart) {
        localStorage.removeItem(`${STORAGE_PREFIX}:guest`);
      }
      setItems(nextItems);
      setActiveStorageKey(desiredStorageKey);
    }
  }, [activeStorageKey, desiredStorageKey, isSwitchingStorage, items]);

  useEffect(() => {
    if (!isSwitchingStorage) {
      localStorage.setItem(activeStorageKey, JSON.stringify(items));
    }
  }, [activeStorageKey, isSwitchingStorage, items]);

  const value = useMemo<CartContextValue>(() => {
    const addItem = (
      item: Omit<CartItem, "quantity">,
      requestedQuantity = 1,
    ) => {
      if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1 || item.maxQuantity < 1) {
        return;
      }
      setItems((current) => {
        const existing = current.find((entry) => entry.id === item.id);
        if (!existing) {
          return [
            ...current,
            {
              ...item,
              quantity: Math.min(Math.max(1, requestedQuantity), item.maxQuantity),
            },
          ];
        }

        return current.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                quantity: Math.min(
                  entry.quantity + requestedQuantity,
                  entry.maxQuantity,
                ),
              }
            : entry,
        );
      });
    };

    const updateQuantity = (id: string, quantity: number) => {
      if (!Number.isInteger(quantity) || quantity < 1) return;
      setItems((current) =>
        current.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                quantity: Math.min(Math.max(1, quantity), entry.maxQuantity),
              }
            : entry,
        ),
      );
    };

    return {
      items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      ),
      addItem,
      updateQuantity,
      removeItem: (id) =>
        setItems((current) => current.filter((item) => item.id !== id)),
      clearCart: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
