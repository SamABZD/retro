import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingEditor } from "@/features/seller/ListingEditor";
import { useGetSellerListingQuery } from "@/redux/fetures/sellerListings.api";

export default function SellerEditAds() {
  const { id } = useParams();
  const { data: listing, isLoading, isError, refetch } = useGetSellerListingQuery(id || "", { skip: !id });

  if (!id) return <ErrorState title="Listing not found" description="The listing link is incomplete." />;
  if (isLoading) return <div className="mx-auto max-w-5xl space-y-5 p-6"><Skeleton className="h-9 w-56" /><Skeleton className="h-96" /></div>;
  if (isError || !listing) return <div className="mx-auto max-w-5xl p-6"><ErrorState title="Listing could not be loaded" description="Check the listing link or try again." action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>} /></div>;
  if (listing.listingStatus === "ARCHIVED") return <div className="mx-auto max-w-5xl p-6"><ErrorState title="This listing is archived" description="Archived listings stay out of the public catalog and cannot be edited here." /></div>;

  return <ListingEditor listing={listing} />;
}
