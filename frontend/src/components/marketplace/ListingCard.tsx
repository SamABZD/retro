import { Link } from "react-router-dom";
import { ListingImage } from "@/components/marketplace/ListingImage";
import { PriceDisplay } from "@/components/marketplace/PriceDisplay";
import { conditionLabels } from "@/lib/marketplace";
import type { MarketplaceListing } from "@/types/marketplace";
import { cn } from "@/lib/utils";

export function ListingCard({ listing, className }: { listing: MarketplaceListing; className?: string }) {
  const href = `/item-details/${listing.id}`;
  return (
    <article className={cn("group flex min-w-0 flex-col", className)}>
      <Link to={href} className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-muted focus-visible:outline-offset-4" aria-label={`View ${listing.title}`}>
        <ListingImage src={listing.images[0]?.url} alt={listing.title} className="h-full w-full transition-transform duration-200 group-hover:scale-[1.015] motion-reduce:transform-none" />
        {listing.listingStatus !== "ACTIVE" && <span className="absolute left-2 top-2 rounded-md bg-background px-2 py-1 text-xs font-medium">{listing.listingStatus === "SOLD" ? "Sold" : "Unavailable"}</span>}
      </Link>
      <div className="pt-3">
        <h3 className="line-clamp-2 min-h-11 text-[0.9375rem] font-medium leading-[1.4] tracking-normal sm:text-base"><Link to={href} className="decoration-primary underline-offset-4 hover:underline">{listing.title}</Link></h3>
        <PriceDisplay amount={listing.price} className="mt-1 block text-lg font-semibold sm:text-xl" />
        <p className="mt-1 truncate text-[0.8125rem] leading-5 text-muted-foreground">{conditionLabels[listing.condition] || listing.condition} <span aria-hidden="true">·</span> {listing.seller.displayName}</p>
      </div>
    </article>
  );
}
