import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListingImage } from "@/components/marketplace/ListingImage";
import { useCart } from "@/features/cart/CartContext";
import { useGetMeQuery } from "@/redux/fetures/users.api";
import { useCheckoutMutation } from "@/redux/fetures/orders.api";

const fieldClass =
  "h-12 rounded-md border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring";

export default function CartPage() {
  const navigate = useNavigate();
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const { data: currentUser } = useGetMeQuery();
  const [checkout, { isLoading: isCreatingOrder }] = useCheckoutMutation();
  const [form, setForm] = useState({
    address: "",
    phone: "",
  });

  const isAuthenticated = Boolean(currentUser?.data);
  const isSubmitting = isCreatingOrder;

  const setField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCheckout = async (event: FormEvent) => {
    event.preventDefault();
    if (!items.length) return;
    if (!isAuthenticated) {
      toast.info("Sign in to place your order");
      navigate("/login", { state: { from: { pathname: "/cart" } } });
      return;
    }

    try {
      const createdOrders = await checkout({
        items: items.map((item) => ({
          productId: Number(item.id),
          quantity: item.quantity,
        })),
        shippingAddress: form.address,
        phoneNumber: form.phone,
      }).unwrap();

      clearCart();
      navigate("/order-success", {
        state: {
          orderIds: createdOrders.map((order) => order.orderId),
          total: createdOrders.reduce(
            (total, order) => total + Number(order.totalPrice),
            0,
          ),
        },
      });
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "We couldn't complete the order. Please check your details.",
      );
    }
  };

  if (!items.length) {
    return (
      <div className="flex min-h-[68vh] items-center justify-center px-4 py-16">
        <div className="max-w-md text-center">
          <h1 className="type-h1">Your cart is empty</h1>
          <p className="mt-3 text-muted-foreground">
            Explore listings from independent sellers and save something you love.
          </p>
          <Button asChild size="lg" className="mt-7">
            <Link to="/search">Browse marketplace</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[var(--max-content)] px-4 py-8 sm:px-6 lg:px-8 md:py-12">
      <Link
        to="/search"
        className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-brand-ink"
      >
        <ArrowLeft size={17} /> Continue shopping
      </Link>

      <div className="mb-9 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="type-h1">
            Cart and checkout
          </h1>
          <p className="mt-2 text-muted-foreground">
            One checkout, even when you buy from multiple sellers.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          Demo checkout · No payment collected
        </div>
      </div>

      <form onSubmit={handleCheckout} className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <section className="border-y">
            <div className="border-b py-4">
              <h2 className="font-semibold">Items from your sellers</h2>
            </div>
            <div className="divide-y divide-border">
              {items.map((item) => (
                <article key={item.id} className="flex gap-3 py-5 sm:gap-4">
                  <ListingImage
                    src={item.image}
                    alt={item.title}
                    loading="eager"
                    className="h-22 w-22 shrink-0 rounded-md object-cover sm:h-28 sm:w-28"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3">
                      <div>
                        <Link
                          to={`/item-details/${item.id}`}
                          className="font-semibold text-foreground hover:text-brand-ink"
                        >
                          {item.title}
                        </Link>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Sold by {item.sellerName}
                        </p>
                      </div>
                      <p className="font-semibold tabular-nums text-foreground">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <div className="flex items-center overflow-hidden rounded-md border border-border bg-background">
                        <button
                          type="button"
                          aria-label={`Decrease ${item.title} quantity`}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="grid size-9 place-items-center text-foreground hover:bg-surface-subtle"
                        >
                          <Minus size={15} />
                        </button>
                        <span className="min-w-9 text-center text-sm font-bold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${item.title} quantity`}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.maxQuantity}
                          className="grid size-9 place-items-center text-foreground hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={15} /> Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="border-b pb-6">
            <div className="mb-5 flex items-center gap-3">
              <div>
                <h2 className="font-semibold">Delivery details</h2>
                <p className="text-sm text-muted-foreground">Where sellers should send your order.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-foreground">Shipping address</span>
                <Input
                  required
                  value={form.address}
                  onChange={(event) => setField("address", event.target.value)}
                  placeholder="Street, city, region, postal code"
                  className={fieldClass}
                />
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-foreground">Phone number</span>
                <Input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(event) => setField("phone", event.target.value)}
                  placeholder="+1 555 000 0000"
                  className={fieldClass}
                />
              </label>
            </div>
          </section>

          <section className="pb-6">
            <div className="flex items-start gap-3">
              <div>
                <h2 className="font-semibold">Simulated checkout</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  This local marketplace demo never asks for or stores card details.
                  Confirming creates the order and updates inventory immediately.
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-lg border border-border bg-card p-5 sm:p-6 lg:sticky lg:top-28">
          <h2 className="type-h3">Order summary</h2>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Items</span><span className="tabular-nums">${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Demo shipping charge</span><span className="font-medium text-foreground">$0.00</span></div>
            <div className="flex justify-between border-t border-border pt-4 text-lg font-semibold text-foreground"><span>Total</span><span className="tabular-nums">${subtotal.toFixed(2)}</span></div>
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 h-12 w-full text-base"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : isAuthenticated ? (
              <>Confirm simulated purchase</>
            ) : (
              <>Sign in to checkout</>
            )}
          </Button>
          <div className="mt-5 space-y-3 border-t border-border pt-5 text-sm text-muted-foreground">
            <p className="flex gap-2">No payment information is collected.</p>
            <p className="flex gap-2">Availability and prices are checked when you confirm.</p>
          </div>
        </aside>
      </form>
    </div>
  );
}
