import { ArrowRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ListingImage } from "@/components/marketplace/ListingImage";
import { PriceDisplay } from "@/components/marketplace/PriceDisplay";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/features/cart/CartContext";
import { formatOrderDate, orderStatusLabel } from "@/features/orders/orderPresentation";
import { useGetMyOrdersQuery } from "@/redux/fetures/orders.api";
import { useGetMeQuery, useGetSellerApplicationStatusQuery } from "@/redux/fetures/users.api";

export default function AccountOverview() {
  const { data: me } = useGetMeQuery();
  const { itemCount } = useCart();
  const { data: orders, isLoading: ordersLoading, isError: ordersError, refetch } = useGetMyOrdersQuery({ page: 0, size: 3 });
  const { data: application, isLoading: applicationLoading } = useGetSellerApplicationStatusQuery();
  const user = me?.data;

  return <div className="account-page space-y-7">
    <div><h1 className="type-h1">Your account</h1><p className="mt-2 text-sm text-muted-foreground">Welcome back{user?.firstName ? `, ${user.firstName}` : ""}. Your purchases and selling path are here.</p></div>
    <section aria-label="Account summary" className="flex flex-wrap gap-x-12 gap-y-4 border-y py-5">
      <div><p className="text-2xl font-semibold tabular-nums">{orders?.totalElements ?? (ordersLoading ? "—" : 0)}</p><p className="text-sm text-muted-foreground">Orders</p></div>
      <div><p className="text-2xl font-semibold tabular-nums">{itemCount}</p><p className="text-sm text-muted-foreground">Items in cart</p></div>
      <div><p className="text-sm font-semibold">{user?.email || "Account"}</p><p className="mt-1 text-sm text-muted-foreground">Signed-in email</p></div>
    </section>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <section aria-labelledby="recent-purchases-heading">
        <div className="flex items-center justify-between gap-3 border-b pb-4"><div><h2 id="recent-purchases-heading" className="text-lg font-semibold">Recent orders</h2><p className="mt-1 text-sm text-muted-foreground">Your latest purchases</p></div><Button variant="link" asChild><Link to="/user/dashboard/my-purchases">All orders <ArrowRight className="size-4" /></Link></Button></div>
        {ordersError ? <div className="p-5"><ErrorState title="Orders unavailable" description="Try loading your order history again." action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>} /></div> : ordersLoading ? <div className="space-y-3 p-5">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-20" />)}</div> : !orders?.content?.length ? <EmptyState title="You haven't purchased anything yet" description="Once you place an order, it will appear here." action={<Button asChild><Link to="/search">Browse marketplace</Link></Button>} /> : <div className="divide-y">{orders.content.map((order) => <div key={order.orderId} className="flex items-center gap-3 py-4"><ListingImage src={order.items[0]?.imageUrl} alt={order.items[0]?.title || "Order item"} className="size-16 shrink-0 rounded-md" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">Order #{order.orderId} · {order.items[0]?.title}</p><p className="mt-1 text-xs text-muted-foreground">{formatOrderDate(order.orderDate)} · {orderStatusLabel(order.status)}</p></div><PriceDisplay amount={order.totalPrice} className="text-sm" /></div>)}</div>}
      </section>
      <aside className="space-y-4 border-t py-5 lg:border-t-0 lg:border-l lg:pl-6">
        <h2 className="text-lg font-semibold">Become a seller</h2>
        {applicationLoading ? <Skeleton className="h-12" /> : application?.status === "PENDING" ? <p className="text-sm leading-6 text-muted-foreground">Your application is awaiting review. Seller tools become available after approval.</p> : application?.status === "DECLINED" ? <p className="text-sm leading-6 text-muted-foreground">Your last application needs changes{application.declineReason ? `: ${application.declineReason}` : "."} You can apply again.</p> : application?.status === "APPROVED" ? <p className="text-sm leading-6 text-muted-foreground">Your application was approved. Sign in again to open seller tools.</p> : <p className="text-sm leading-6 text-muted-foreground">Sell clothes, guitars, books, electronics, and other useful things. An administrator reviews seller applications.</p>}
        {application?.status !== "PENDING" && application?.status !== "APPROVED" && <Button asChild variant="signal" className="w-full"><Link to="/create-seller-profile"><ShoppingBag className="size-4" /> Apply to sell</Link></Button>}
      </aside>
    </div>
  </div>;
}
