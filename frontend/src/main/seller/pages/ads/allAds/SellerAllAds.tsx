import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { ConditionBadge } from "@/components/marketplace/ConditionBadge";
import { ListingImage } from "@/components/marketplace/ListingImage";
import { ListingStatusBadge } from "@/components/marketplace/ListingStatusBadge";
import { PriceDisplay } from "@/components/marketplace/PriceDisplay";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteAdMutation } from "@/redux/fetures/ads.api";
import { useGetSellerListingsQuery, type SellerListing } from "@/redux/fetures/sellerListings.api";

const PAGE_SIZE = 8;
const statusOptions = ["ALL", "ACTIVE", "SOLD", "INACTIVE", "ARCHIVED"];
const date = (value?: string) => value ? new Date(value.replace(" ", "T")).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Date unavailable";

export default function SellerAllAds() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<SellerListing | null>(null);
  const [removeTarget, setRemoveTarget] = useState<SellerListing | null>(null);
  const { data: listings = [], isLoading, isError, refetch } = useGetSellerListingsQuery();
  const [removeListing, { isLoading: isRemoving }] = useDeleteAdMutation();

  const filtered = useMemo(() => listings.filter((listing) =>
    (status === "ALL" || listing.listingStatus === status) &&
    (!search.trim() || `${listing.title} ${listing.categoryName}`.toLowerCase().includes(search.trim().toLowerCase())),
  ), [listings, search, status]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const confirmRemove = async () => {
    if (!removeTarget) return;
    try {
      await removeListing(removeTarget.id).unwrap();
      toast.success("Listing removed from your active inventory");
      setRemoveTarget(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "This listing could not be removed.");
    }
  };

  return (
    <div className="account-page space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="type-h1">My listings</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage your items, availability, and review status.</p>
        </div>
        <Button asChild><Link to="/seller/dashboard/ads/create"><Plus className="size-4" /> Create listing</Link></Button>
      </div>

      <div className="flex flex-col gap-3 border-y py-4 sm:flex-row sm:items-center">
        <label htmlFor="my-listing-search" className="sr-only">Search my listings</label>
        <Input id="my-listing-search" type="search" value={search} placeholder="Search my listings" onChange={(event) => { setSearch(event.target.value); setPage(0); }} className="sm:max-w-sm" />
        <label htmlFor="my-listing-status" className="sr-only">Filter listing status</label>
        <select id="my-listing-status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }} className="h-11 rounded-md border border-input bg-card px-3 text-sm sm:ml-auto sm:w-44">
          {statusOptions.map((option) => <option key={option} value={option}>{option === "ALL" ? "All statuses" : option[0] + option.slice(1).toLowerCase()}</option>)}
        </select>
      </div>

      {isError ? <ErrorState title="Your listings couldn't be loaded" description="Try loading your inventory again." action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>} /> :
        isLoading ? <div className="space-y-3" aria-label="Loading listings">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-32" />)}</div> :
        filtered.length === 0 ? <div className="border-t"><EmptyState title={search || status !== "ALL" ? "No listings match those filters" : "You haven't listed anything yet"} description={search || status !== "ALL" ? "Try another search or status." : "Create your first listing to start selling."} action={<Button asChild><Link to="/seller/dashboard/ads/create">Create your first listing</Link></Button>} /></div> : (
          <div className="border-y">
            <div className="divide-y" aria-live="polite">
              {visible.map((listing) => (
                <article key={listing.id} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 py-5 sm:flex sm:items-center sm:gap-6">
                  <ListingImage src={listing.images[0]} alt={listing.title} className="size-22 shrink-0 rounded-md sm:size-24" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="min-w-0 text-base font-semibold text-foreground">{listing.title}</h2>
                      <ListingStatusBadge status={listing.listingStatus} />
                      {listing.moderationStatus !== "APPROVED" && <span className="rounded-md bg-warning-surface px-2 py-0.5 text-xs font-medium text-foreground">{listing.moderationStatus === "DECLINED" ? "Needs changes" : "Awaiting review"}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground">{listing.categoryName} · {date(listing.createdAt)} · {listing.quantity} available</p>
                    <div className="flex flex-wrap items-center gap-2"><ConditionBadge condition={listing.condition} /><PriceDisplay amount={listing.price} /></div>
                    {listing.declineReason && <p className="text-sm text-destructive">Review note: {listing.declineReason}</p>}
                  </div>
                  <div className="col-span-2 flex flex-wrap gap-2 sm:justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setSelected(listing)}><Eye className="size-4" /> View</Button>
                    {listing.listingStatus !== "ARCHIVED" && <Button variant="ghost" size="sm" asChild><Link to={`/seller/dashboard/ads/edit/${listing.id}`}><Pencil className="size-4" /> Edit</Link></Button>}
                    {listing.listingStatus !== "ARCHIVED" && <Button variant="ghost" size="sm" onClick={() => setRemoveTarget(listing)}><Trash2 className="size-4" /> Remove</Button>}
                  </div>
                </article>
              ))}
            </div>
            {pageCount > 1 && <div className="flex items-center justify-between border-t py-3 text-sm">
              <span>Page {currentPage + 1} of {pageCount}</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} aria-label="Previous listings page"><ArrowLeft className="size-4" /> Previous</Button>
                <Button variant="ghost" size="sm" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)} aria-label="Next listings page">Next <ArrowRight className="size-4" /></Button>
              </div>
            </div>}
          </div>
        )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selected?.title}</DialogTitle><DialogDescription>Seller-owned listing details</DialogDescription></DialogHeader>
          {selected && <div className="space-y-4 text-sm">
            <ListingImage src={selected.images[0]} alt={selected.title} className="aspect-[16/9] w-full rounded-md" />
            <div className="flex flex-wrap gap-2"><ListingStatusBadge status={selected.listingStatus} /><ConditionBadge condition={selected.condition} /></div>
            <p className="whitespace-pre-wrap leading-6 text-muted-foreground">{selected.description}</p>
            <p><PriceDisplay amount={selected.price} /> · {selected.quantity} available</p>
          </div>}
          <DialogFooter>{selected?.listingStatus !== "ARCHIVED" && <Button asChild><Link to={`/seller/dashboard/ads/edit/${selected?.id}`}>Edit listing</Link></Button>}</DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(removeTarget)} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remove this listing?</DialogTitle><DialogDescription>{removeTarget?.title} will disappear from the public catalog. Listings attached to past orders are archived so purchase history stays intact; other listings are deleted.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setRemoveTarget(null)}>Keep listing</Button><Button variant="destructive" onClick={confirmRemove} isLoading={isRemoving} loadingText="Removing">Remove listing</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
