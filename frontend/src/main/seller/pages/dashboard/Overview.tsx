import { ArrowRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ListingImage } from "@/components/marketplace/ListingImage";
import { ListingStatusBadge } from "@/components/marketplace/ListingStatusBadge";

import { PriceDisplay } from "@/components/marketplace/PriceDisplay";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetSellerListingsQuery } from "@/redux/fetures/sellerListings.api";
import { useGetSellerOrdersQuery } from "@/redux/fetures/orders.api";
import { formatOrderDate } from "@/features/orders/orderPresentation";
import { OrderStatusBadge } from "@/features/orders/OrderStatusBadge";

export default function SellerOverview() {
  const { data: listings = [], isLoading: loadingListings, isError: listingsError, refetch: refetchListings } = useGetSellerListingsQuery();
  const { data: orders, isLoading: loadingOrders, isError: ordersError, refetch: refetchOrders } = useGetSellerOrdersQuery({ page: 0, size: 5 });
  const active = listings.filter((item) => item.listingStatus === "ACTIVE" && item.moderationStatus === "APPROVED").length;
  const sold = listings.filter((item) => item.listingStatus === "SOLD").length;
  const inactive = listings.filter((item) => item.listingStatus === "INACTIVE").length;

  return (
    <div className="account-page space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="type-h1">Your shop</h1>
          <p className="mt-2 text-sm text-muted-foreground">A home for your listings and orders.</p>
        </div>
        <Button asChild><Link to="/seller/dashboard/ads/create"><Plus className="size-4" /> Create listing</Link></Button>
      </header>

      {listingsError ? <ErrorState title="Listing summary unavailable" description="Your inventory could not be loaded." action={<Button variant="outline" onClick={() => refetchListings()}>Retry</Button>} /> : (
        <section aria-label="Listing summary" className="border-b pb-7 pt-2">
          {loadingListings ? <Skeleton className="h-16" /> : <div className="flex flex-wrap gap-x-10 gap-y-4">
            <div><p className="text-2xl font-semibold tabular-nums">{active}</p><p className="text-sm text-muted-foreground">Active listings</p></div>
            <div><p className="text-2xl font-semibold tabular-nums">{sold}</p><p className="text-sm text-muted-foreground">Sold listings</p></div>
            <div><p className="text-2xl font-semibold tabular-nums">{inactive}</p><p className="text-sm text-muted-foreground">Inactive listings</p></div>
            <div><p className="text-2xl font-semibold tabular-nums">{orders?.totalElements ?? (loadingOrders ? "—" : 0)}</p><p className="text-sm text-muted-foreground">Total seller orders</p></div>
          </div>}
        </section>
      )}

      <div className="space-y-10">
        <section aria-labelledby="recent-listings-heading">
          <div className="flex items-center justify-between gap-3 border-b pb-4">
            <div><h2 id="recent-listings-heading" className="type-h2">Recent listings</h2><p className="mt-1 text-sm text-muted-foreground">Your newest items</p></div>
            <Button variant="link" asChild><Link to="/seller/dashboard/all-ads">View all <ArrowRight className="size-4" /></Link></Button>
          </div>
          {listingsError ? <div className="p-5"><ErrorState title="Listings unavailable" description="Try again from My listings." /></div> :
            loadingListings ? <div className="space-y-3 p-5">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-20" />)}</div> :
            listings.length === 0 ? <EmptyState title="You haven't listed anything yet" description="Your first listing will appear here after you create it." action={<Button asChild><Link to="/seller/dashboard/ads/create">Create your first listing</Link></Button>} /> :
            <div className="divide-y">{listings.slice(0, 5).map((listing) => <article key={listing.id} className="flex min-w-0 gap-3 py-4 sm:items-center">
              <ListingImage src={listing.images[0]} alt={listing.title} className="size-16 shrink-0 rounded-md" />
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_6rem] sm:items-center sm:gap-6"><div className="min-w-0"><Link to={`/seller/dashboard/ads/edit/${listing.id}`} className="block truncate text-[0.9375rem] font-medium hover:underline">{listing.title}</Link><p className="mt-1 text-[0.8125rem] text-muted-foreground">{listing.quantity} available</p></div><PriceDisplay amount={listing.price} className="text-lg sm:text-right" /><ListingStatusBadge status={listing.listingStatus} /></div>
            </article>)}</div>}
        </section>

        <section aria-labelledby="recent-orders-heading">
          <div className="flex items-center justify-between gap-3 border-b pb-4">
            <div><h2 id="recent-orders-heading" className="type-h2">Recent orders</h2><p className="mt-1 text-sm text-muted-foreground">Purchases involving your listings</p></div>
            <Button variant="link" asChild><Link to="/seller/dashboard/orders">View all <ArrowRight className="size-4" /></Link></Button>
          </div>
          {ordersError ? <div className="p-5"><ErrorState title="Orders unavailable" description="Try loading your orders again." action={<Button variant="outline" onClick={() => refetchOrders()}>Retry</Button>} /></div> :
            loadingOrders ? <div className="space-y-3 p-5">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-20" />)}</div> :
            !orders?.content?.length ? <EmptyState title="No orders yet" description="Buyer orders will appear here when one of your listings sells." /> :
            <div className="divide-y">{orders.content.map((order) => <article key={order.orderId} className="flex items-center gap-3 py-4">
              <ListingImage src={order.items[0]?.imageUrl} alt={order.items[0]?.title || "Order item"} className="size-16 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold">Order #{order.orderId}</p><p className="mt-1 truncate text-sm text-muted-foreground">{order.items.map((item) => `${item.title} × ${item.quantity}`).join(", ")}</p><p className="mt-1 text-xs text-muted-foreground">{formatOrderDate(order.orderDate)}</p><div className="mt-2"><OrderStatusBadge status={order.status} /></div></div>
            </article>)}</div>}
        </section>
      </div>

      <nav aria-label="Seller quick actions" className="flex flex-wrap gap-6 border-t pt-6 text-sm font-medium">
        <Link className="text-brand-ink hover:underline" to="/seller/dashboard/ads/create">Create listing</Link>
        <Link className="text-brand-ink hover:underline" to="/seller/dashboard/all-ads">Manage listings</Link>
        <Link className="text-brand-ink hover:underline" to="/seller/dashboard/orders">View orders</Link>
      </nav>
    </div>
  );
}
