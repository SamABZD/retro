import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingImage } from "@/components/marketplace/ListingImage";
import { PriceDisplay } from "@/components/marketplace/PriceDisplay";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatOrderDate, orderStatusLabel } from "@/features/orders/orderPresentation";
import type { OrderView } from "@/redux/fetures/orders.api";

export default function PurchaseDetailsDialog({ open, onOpenChange, data }: { open: boolean; onOpenChange: (open: boolean) => void; data: OrderView | null }) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto">
      <DialogHeader><DialogTitle>Order #{data?.orderId}</DialogTitle><DialogDescription>{formatOrderDate(data?.orderDate)} · {orderStatusLabel(data?.status || "")}</DialogDescription></DialogHeader>
      {data && <>
        <div className="divide-y rounded-lg border">
          {data.items.map((item) => <div key={item.orderItemId} className="flex min-w-0 gap-3 p-3">
            <ListingImage src={item.imageUrl} alt={item.title} className="size-16 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">Sold by {item.sellerName}</p><p className="mt-1 text-sm text-muted-foreground">{item.quantity} × <PriceDisplay amount={item.unitPrice} /></p></div>
            <PriceDisplay amount={item.lineTotal} className="text-sm" />
          </div>)}
        </div>
        <div className="space-y-2 text-sm"><div className="flex justify-between"><span>Total at purchase</span><PriceDisplay amount={data.totalPrice} /></div><p className="text-muted-foreground">Simulated checkout. No card details were collected.</p></div>
        <DialogFooter><Button asChild><a href={`/api/orders/receipt/${data.orderId}`} download><Download className="size-4" /> Download receipt</a></Button></DialogFooter>
      </>}
    </DialogContent>
  </Dialog>;
}
