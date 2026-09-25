import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { toast } from "react-toastify";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { ConditionBadge } from "@/components/marketplace/ConditionBadge";
import { ImageGallery } from "@/components/marketplace/ImageGallery";
import { ListingGrid } from "@/components/marketplace/ListingGrid";
import { ListingGridSkeleton } from "@/components/marketplace/ListingGridSkeleton";
import { ListingStatusBadge } from "@/components/marketplace/ListingStatusBadge";
import { PriceDisplay } from "@/components/marketplace/PriceDisplay";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/features/cart/CartContext";
import { formatListingDate } from "@/lib/marketplace";
import { useGetAdByIdQuery, useGetAllAdsQuery } from "@/redux/fetures/ads.api";

function DetailSkeleton() {
  return (
    <PageContainer className="py-8" aria-label="Loading listing">
      <Skeleton className="h-5 w-40" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <Skeleton className="aspect-[4/3] rounded-lg sm:aspect-[16/11]" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </PageContainer>
  );
}

export default function ItemDetailsPage() {
  const { id = "" } = useParams();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const detailQuery = useGetAdByIdQuery(id, { skip: !id });
  const listing = detailQuery.data?.data;
  const primaryCategory = listing?.categories[0];
  const relatedQuery = useGetAllAdsQuery(
    { page: 1, limit: 6, categoryId: primaryCategory?.id, sort: "newest" },
    { skip: !primaryCategory?.id },
  );

  useEffect(() => {
    setQuantity(1);
    window.scrollTo({ top: 0 });
  }, [id]);

  const related = useMemo(
    () => (relatedQuery.data?.data || []).filter((entry) => entry.id !== id).slice(0, 4),
    [relatedQuery.data?.data, id],
  );

  if (detailQuery.isLoading) return <DetailSkeleton />;

  if (detailQuery.isError || !listing) {
    return (
      <PageContainer className="grid min-h-[65dvh] place-items-center py-12">
        <ErrorState
          className="w-full max-w-2xl"
          title="Listing not found"
          description="It may have been removed, archived, or the link may be out of date."
          action={<Button asChild variant="outline"><Link to="/search">Browse listings</Link></Button>}
        />
      </PageContainer>
    );
  }

  const maxQuantity = Math.max(0, Number(listing.quantity || 0));
  const canAddToCart = listing.stock && listing.listingStatus === "ACTIVE" && maxQuantity > 0;
  const categoryQuery = primaryCategory ? `?category=${encodeURIComponent(primaryCategory.id)}` : "";

  const addToCart = () => {
    if (!canAddToCart) return;
    addItem({
      id: listing.id,
      title: listing.title,
      price: listing.price,
      image: listing.images[0]?.url || "",
      sellerName: listing.seller.displayName,
      maxQuantity,
    }, quantity);
    toast.success(`${listing.title} added to your cart`);
  };

  return (
    <div className="pb-16 pt-6 sm:pb-20 sm:pt-8">
      <PageContainer>
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground hover:underline">Home</Link>
          <span aria-hidden="true">/</span>
          <Link to="/search" className="hover:text-foreground hover:underline">Browse</Link>
          {primaryCategory && (
            <>
              <span aria-hidden="true">/</span>
              <Link to={`/search${categoryQuery}`} className="hover:text-foreground hover:underline">{primaryCategory.name}</Link>
            </>
          )}
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)] lg:gap-10">
          <ImageGallery images={listing.images} title={listing.title} />

          <aside className="min-w-0 lg:sticky lg:top-28 lg:self-start">
            <div className="flex flex-wrap gap-2">
              <ConditionBadge condition={listing.condition} />
              <ListingStatusBadge status={listing.listingStatus} />
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{listing.title}</h1>
            <PriceDisplay amount={listing.price} className="mt-4 block text-3xl text-foreground" />

            <div className="mt-7 border-y py-5">
              <div className="flex items-start gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Sold by</p>
                  <p className="font-semibold">{listing.seller.displayName}</p>
                  {listing.seller.username !== listing.seller.displayName && (
                    <p className="text-sm text-muted-foreground">@{listing.seller.username}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                {canAddToCart ? `${maxQuantity} available` : "Currently unavailable"}
              </span>
              <span className="flex items-center gap-2 text-muted-foreground">
                Listed {formatListingDate(listing.createdAt)}
              </span>
            </div>

            {canAddToCart ? (
              <div className="mt-7 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Quantity</span>
                  <div className="flex items-center rounded-md border bg-card">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                      disabled={quantity <= 1}
                      className="grid size-10 place-items-center text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"
                    >
                      <Minus className="size-4" aria-hidden="true" />
                    </button>
                    <span className="min-w-10 text-center text-sm font-semibold" aria-live="polite">{quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
                      disabled={quantity >= maxQuantity}
                      className="grid size-10 place-items-center text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <Button size="lg" className="w-full" onClick={addToCart}>
                  <ShoppingCart aria-hidden="true" /> Add to cart
                </Button>
              </div>
            ) : (
              <Button size="lg" className="mt-7 w-full" disabled>This listing is unavailable</Button>
            )}

            <Button asChild variant="ghost" className="mt-3 w-full">
              <Link to={`/search${categoryQuery}`}><ArrowLeft aria-hidden="true" /> Back to {primaryCategory ? primaryCategory.name : "listings"}</Link>
            </Button>
          </aside>
        </div>

        <div className="mt-12 grid gap-8 border-t pt-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section>
            <h2 className="type-h2">About this listing</h2>
            <p className="mt-4 max-w-3xl whitespace-pre-wrap text-base leading-7 text-muted-foreground">
              {listing.description || "The seller has not added a description."}
            </p>
          </section>
          <section aria-labelledby="listing-details-title">
            <h2 id="listing-details-title" className="type-h3">Listing details</h2>
            <dl className="mt-4 divide-y border-y text-sm">
              <div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">Condition</dt><dd className="font-medium">{listing.condition.replaceAll("_", " ").toLowerCase()}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">Status</dt><dd className="font-medium">{listing.listingStatus.toLowerCase()}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">Quantity</dt><dd className="font-medium">{listing.quantity}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">Category</dt><dd className="text-right font-medium">{listing.categories.map((entry) => entry.name).join(", ") || "Uncategorized"}</dd></div>
            </dl>
          </section>
        </div>

        {(relatedQuery.isLoading || related.length > 0) && (
          <section className="mt-14 border-t pt-10">
            <SectionHeader
              eyebrow={primaryCategory?.name}
              title="Related listings"
              
              action={primaryCategory && <Button asChild variant="outline"><Link to={`/search${categoryQuery}`}>View category</Link></Button>}
            />
            {relatedQuery.isLoading ? (
              <ListingGridSkeleton count={4} className="mt-7 lg:grid-cols-4" />
            ) : (
              <ListingGrid listings={related} className="mt-7 lg:grid-cols-4" />
            )}
          </section>
        )}
      </PageContainer>
    </div>
  );
}
