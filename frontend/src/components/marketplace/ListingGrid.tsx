import { ListingCard } from "@/components/marketplace/ListingCard";
import type { MarketplaceListing } from "@/types/marketplace";
import { cn } from "@/lib/utils";

export function ListingGrid({ listings, className }: { listings: MarketplaceListing[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4", className)}>
      {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
    </div>
  );
}
