import { useState } from "react";
import { ArrowLeft, ArrowRight, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingImage } from "@/components/marketplace/ListingImage";
import { PriceDisplay } from "@/components/marketplace/PriceDisplay";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatOrderDate } from "@/features/orders/orderPresentation";
import { OrderStatusBadge } from "@/features/orders/OrderStatusBadge";
import { useGetMyOrdersQuery, type OrderView } from "@/redux/fetures/orders.api";
import PurchaseDetailsDialog from "./_components/PurchaseDetailsDialog";

export default function BuyerOrders() {
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<OrderView | null>(null);
  const { data, isLoading, isError, refetch } = useGetMyOrdersQuery({ page, size: 8 });

  return (
    <div className="account-page space-y-6">
      <div><h1 className="type-h1">Your orders</h1><p className="mt-2 text-sm text-muted-foreground">Every purchase, with the price recorded when you placed it.</p></div>
      {isError ? <ErrorState title="Your orders couldn't be loaded" description="Try loading your order history again." action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>} /> :
        isLoading ? <div className="space-y-4" aria-label="Loading orders">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-40" />)}</div> :
        !data?.content?.length ? <div className="border-t"><EmptyState title="You haven't purchased anything yet" description="When you buy something, its order and receipt will appear here." action={<Button asChild><a href="/search">Browse marketplace</a></Button>} /></div> : (
          <div className="space-y-4">
            {data.content.map((order) => <article key={order.orderId} className="border-t">
              <div className="flex flex-wrap items-start justify-between gap-3 pt-6 pb-3">
                <div><h2 className="font-semibold">Order #{order.orderId}</h2><p className="mt-1 text-sm text-muted-foreground">{formatOrderDate(order.orderDate)}</p></div>
                <div className="text-right"><OrderStatusBadge status={order.status} /><p className="mt-2 text-sm font-semibold"><PriceDisplay amount={order.totalPrice} /></p></div>
              </div>
              <div className="flex flex-col gap-4 pb-6 pt-2 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <ListingImage src={order.items[0]?.imageUrl} alt={order.items[0]?.title || "Order item"} className="size-20 shrink-0 rounded-md" />
                  <div className="min-w-0"><p className="truncate text-sm font-semibold">{order.items[0]?.title || "Marketplace order"}</p><p className="mt-1 text-sm text-muted-foreground">{order.items.length > 1 ? `+ ${order.items.length - 1} more items` : `Quantity ${order.items[0]?.quantity || 0}`}</p><p className="mt-1 text-xs text-muted-foreground">Simulated purchase</p></div>
                </div>
                <div className="flex flex-wrap gap-2"><Button variant="ghost" size="sm" onClick={() => setSelected(order)}><Eye className="size-4" /> Details</Button><Button asChild variant="ghost" size="sm"><a href={`/api/orders/receipt/${order.orderId}`} download><Download className="size-4" /> Receipt</a></Button></div>
              </div>
            </article>)}
            {(data.totalPages || 0) > 1 && <div className="flex items-center justify-between gap-3 text-sm"><span>Page {page + 1} of {data.totalPages}</span><div className="flex gap-2"><Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}><ArrowLeft className="size-4" /> Previous</Button><Button variant="ghost" size="sm" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}>Next <ArrowRight className="size-4" /></Button></div></div>}
          </div>
        )}
      <PurchaseDetailsDialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)} data={selected} />
    </div>
  );
}
