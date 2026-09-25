import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { ListingImage } from "@/components/marketplace/ListingImage";
import { PriceDisplay } from "@/components/marketplace/PriceDisplay";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatOrderDate, orderStatusLabel } from "@/features/orders/orderPresentation";
import { OrderStatusBadge } from "@/features/orders/OrderStatusBadge";
import { useGetSellerOrdersQuery, useUpdateSellerOrderStatusMutation, type OrderView } from "@/redux/fetures/orders.api";

const nextAction: Record<string, { status: string; label: string }> = {
  PAYMENT_COMPLETED: { status: "PROCESSING", label: "Start processing" },
  PROCESSING: { status: "SHIPPED", label: "Mark shipped" },
  SHIPPED: { status: "DELIVERED", label: "Mark delivered" },
};

export default function SellerOrdersPage() {
  const [page, setPage] = useState(0);
  const [cancelTarget, setCancelTarget] = useState<OrderView | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
  const { data, isLoading, isError, refetch } = useGetSellerOrdersQuery({ page, size: 10 });
  const [updateStatus] = useUpdateSellerOrderStatusMutation();

  const changeStatus = async (order: OrderView, status: string) => {
    setPendingOrderId(order.orderId);
    try {
      await updateStatus({ orderId: order.orderId, status }).unwrap();
      toast.success(`Order #${order.orderId}: ${orderStatusLabel(status)}`);
      setCancelTarget(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Order status could not be updated.");
    } finally {
      setPendingOrderId(null);
    }
  };

  return (
    <div className="account-page space-y-6">
      <div>
        <h1 className="type-h1">Seller orders</h1>
        <p className="mt-2 text-sm text-muted-foreground">Only orders for your listings appear here. Update them as you fulfill each sale.</p>
      </div>
      {isError ? <ErrorState title="Your orders couldn't be loaded" description="Try loading your orders again." action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>} /> :
        isLoading ? <div className="space-y-4" aria-label="Loading seller orders">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-48" />)}</div> :
        !data?.content?.length ? <div className="border-t"><EmptyState title="No orders yet" description="Orders will appear when buyers purchase your approved listings." /></div> : (
          <div className="space-y-4">
            {data.content.map((order) => {
              const action = nextAction[order.status];
              const canCancel = order.status === "PAYMENT_COMPLETED" || order.status === "PROCESSING";
              return <article key={order.orderId} className="border-t">
                <div className="flex flex-wrap items-start justify-between gap-3 pt-6 pb-3">
                  <div><h2 className="font-semibold">Order #{order.orderId}</h2><p className="mt-1 text-sm text-muted-foreground">{formatOrderDate(order.orderDate)}</p></div>
                  <div className="text-right"><OrderStatusBadge status={order.status} /><p className="mt-2 text-sm font-semibold"><PriceDisplay amount={order.totalPrice} /></p></div>
                </div>
                <div className="divide-y">
                  {order.items.map((item) => <div key={item.orderItemId} className="flex min-w-0 items-center gap-3 py-4">
                    <ListingImage src={item.imageUrl} alt={item.title} className="size-16 shrink-0 rounded-md" />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.quantity} × <PriceDisplay amount={item.unitPrice} /></p></div>
                    <PriceDisplay amount={item.lineTotal} className="text-sm" />
                  </div>)}
                </div>
                <div className="flex flex-col gap-4 pb-6 pt-3 sm:flex-row sm:items-end sm:justify-between">
                  <p className="max-w-md text-sm text-muted-foreground"><span className="font-semibold text-foreground">Delivery address:</span> {order.shippingAddress}</p>
                  <div className="flex flex-wrap gap-2">
                    {canCancel && <Button variant="ghost" size="sm" disabled={pendingOrderId === order.orderId} onClick={() => setCancelTarget(order)}>Cancel order</Button>}
                    {action && <Button size="sm" isLoading={pendingOrderId === order.orderId} loadingText="Updating" onClick={() => changeStatus(order, action.status)}>{action.label}</Button>}
                  </div>
                </div>
              </article>;
            })}
            {(data.totalPages || 0) > 1 && <div className="flex items-center justify-between gap-3 text-sm"><span>Page {page + 1} of {data.totalPages}</span><div className="flex gap-2"><Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}><ArrowLeft className="size-4" /> Previous</Button><Button variant="ghost" size="sm" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}>Next <ArrowRight className="size-4" /></Button></div></div>}
          </div>
        )}

      <Dialog open={Boolean(cancelTarget)} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent><DialogHeader><DialogTitle>Cancel order #{cancelTarget?.orderId}?</DialogTitle><DialogDescription>The order will be marked cancelled and the purchased quantity returned to listing inventory. This cannot be undone from the seller page.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setCancelTarget(null)}>Keep order</Button><Button variant="destructive" isLoading={pendingOrderId === cancelTarget?.orderId} loadingText="Cancelling" onClick={() => cancelTarget && changeStatus(cancelTarget, "CANCELLED")}>Cancel order</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
