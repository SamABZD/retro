import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Filter, PackageSearch, Search, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { ListingGrid } from "@/components/marketplace/ListingGrid";
import { ListingGridSkeleton } from "@/components/marketplace/ListingGridSkeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { conditionLabels, sortLabels } from "@/lib/marketplace";
import { useGetAllCategoriesQuery } from "@/redux/fetures/categories.api";
import { useGetAllAdsQuery } from "@/redux/fetures/ads.api";
import type { MarketplaceSort } from "@/types/marketplace";
import CommonPagination from "../../_components/CommonPagination";
import FilterSearch, { type FilterValues } from "./_components/FilterSearch";
import MobileFilterSheet from "./_components/MobileFilterSheet";

const validSorts = new Set<MarketplaceSort>(["newest", "price-asc", "price-desc"]);
type QueryUpdates = Partial<FilterValues> & { search?: string; sort?: string; page?: string };

function positivePage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("search")?.trim() || "";
  const category = searchParams.get("category") || "";
  const condition = searchParams.get("condition") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const requestedSort = searchParams.get("sort") as MarketplaceSort | null;
  const sort = requestedSort && validSorts.has(requestedSort) ? requestedSort : "newest";
  const page = positivePage(searchParams.get("page"));
  const filters = useMemo<FilterValues>(() => ({ category, condition, minPrice, maxPrice }), [category, condition, minPrice, maxPrice]);
  const [searchDraft, setSearchDraft] = useState(query);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileFilters, setMobileFilters] = useState(filters);

  useEffect(() => setSearchDraft(query), [query]);

  const categoriesQuery = useGetAllCategoriesQuery({ page: 1, limit: 100 });
  const categories = categoriesQuery.data?.data || [];
  const selectedCategory = categories.find((entry: { id: string }) => entry.id === category);
  const hasValidPriceRange = !(minPrice && maxPrice && Number(minPrice) > Number(maxPrice));
  const listingsQuery = useGetAllAdsQuery({
    page,
    limit: 12,
    search: query,
    categoryId: category,
    condition,
    minPrice,
    maxPrice,
    sort,
  }, { skip: !hasValidPriceRange });
  const listings = listingsQuery.data?.data || [];
  const meta = listingsQuery.data?.meta || { total: 0, page: 1, limit: 12, totalPages: 1 };
  const activeCount = [category, condition, minPrice || maxPrice].filter(Boolean).length;

  const updateParams = (updates: QueryUpdates, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || (key === "sort" && value === "newest")) next.delete(key);
      else next.set(key, value);
    });
    if (resetPage) next.delete("page");
    setSearchParams(next);
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    updateParams({ search: searchDraft.trim() });
  };

  const applyDesktopFilters = (next: FilterValues) => updateParams(next);
  const clearFilters = () => updateParams({ category: "", condition: "", minPrice: "", maxPrice: "" });
  const clearEverything = () => setSearchParams(new URLSearchParams());
  const openMobileFilters = () => {
    setMobileFilters(filters);
    setMobileOpen(true);
  };

  const heading = query ? `Search results for “${query}”` : selectedCategory ? selectedCategory.name : "Browse all listings";

  return (
    <div className="min-h-[70dvh] py-8 sm:py-10">
      <PageContainer>
        <div className="max-w-3xl">
          <p className="type-label text-brand-ink">Marketplace</p>
          <h1 className="type-h1 mt-2">{heading}</h1>
          <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
            {listingsQuery.isFetching ? "Updating listings…" : `${meta.total} listing${meta.total === 1 ? "" : "s"}`}
          </p>
        </div>

        <form onSubmit={submitSearch} className="mt-7 flex max-w-3xl gap-2" role="search">
          <div className="min-w-0 flex-1">
            <SearchInput
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              onClear={() => { setSearchDraft(""); updateParams({ search: "" }); }}
              placeholder="Search clothes, guitars, electronics…"
              aria-label="Search marketplace listings"
              className="h-12"
            />
          </div>
          <Button type="submit" size="lg" variant="outline" aria-label="Search marketplace"><Search aria-hidden="true" /> <span className="hidden sm:inline">Search</span></Button>
        </form>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-y py-3">
          <Button type="button" variant="outline" className="lg:hidden" onClick={openMobileFilters}>
            <Filter aria-hidden="true" /> Filters{activeCount ? ` (${activeCount})` : ""}
          </Button>
          <div className="ml-auto flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline">Sort by</span>
            <Select value={sort} onValueChange={(value) => updateParams({ sort: value })}>
              <SelectTrigger className="w-full sm:w-48" aria-label="Sort listings"><SelectValue /></SelectTrigger>
              <SelectContent align="end">
                {(Object.entries(sortLabels) as Array<[MarketplaceSort, string]>).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {activeCount > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
            {category && (
              <Button size="xs" variant="ghost" className="border-b-2 border-brand-ink rounded-none" onClick={() => updateParams({ category: "" })}>
                {selectedCategory?.name || "Category"} <X aria-hidden="true" />
              </Button>
            )}
            {condition && (
              <Button size="xs" variant="ghost" className="border-b-2 border-brand-ink rounded-none" onClick={() => updateParams({ condition: "" })}>
                {conditionLabels[condition] || condition} condition <X aria-hidden="true" />
              </Button>
            )}
            {(minPrice || maxPrice) && (
              <Button size="xs" variant="ghost" className="border-b-2 border-brand-ink rounded-none" onClick={() => updateParams({ minPrice: "", maxPrice: "" })}>
                {minPrice ? `$${minPrice}` : "$0"} – {maxPrice ? `$${maxPrice}` : "Any price"} <X aria-hidden="true" />
              </Button>
            )}
            <Button size="xs" variant="ghost" onClick={clearFilters}>Clear filters</Button>
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <aside className="hidden lg:block" aria-label="Listing filters">
            <div className="sticky top-28">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-semibold">Filters</h2>
                {activeCount > 0 && <Button size="xs" variant="ghost" onClick={clearFilters}>Clear</Button>}
              </div>
              <FilterSearch idPrefix="desktop" values={filters} categories={categories} onChange={applyDesktopFilters} />
            </div>
          </aside>

          <section aria-label="Marketplace listings" className="min-w-0">
            {!hasValidPriceRange ? (
              <ErrorState
                title="Check the price range"
                description="Minimum price must not exceed maximum price."
                action={<Button variant="outline" onClick={() => updateParams({ minPrice: "", maxPrice: "" })}>Clear prices</Button>}
              />
            ) : listingsQuery.isLoading ? (
              <ListingGridSkeleton count={12} />
            ) : listingsQuery.isError ? (
              <ErrorState
                title="Listings couldn’t be loaded"
                description="Try again without changing your search or filters."
                action={<Button variant="outline" onClick={() => listingsQuery.refetch()}>Retry</Button>}
              />
            ) : listings.length === 0 ? (
              <EmptyState
                icon={<PackageSearch className="size-6" aria-hidden="true" />}
                title={query ? `No listings found for “${query}”` : "No listings match these filters"}
                description="Try a broader search, remove a filter, or browse every active listing."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button variant="outline" onClick={clearEverything}>Clear search and filters</Button>
                    <Button asChild><Link to="/search">Browse all listings</Link></Button>
                  </div>
                }
              />
            ) : (
              <>
                <ListingGrid listings={listings} />
                {meta.totalPages > 1 && (
                  <div className="mt-10 border-t pt-6">
                    <CommonPagination
                      currentPage={page}
                      totalPages={meta.totalPages}
                      onPageChange={(nextPage) => updateParams({ page: nextPage > 1 ? String(nextPage) : "" }, false)}
                    />
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </PageContainer>

      <MobileFilterSheet
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        activeCount={activeCount}
        onApply={() => { updateParams(mobileFilters); setMobileOpen(false); }}
        onClear={() => { const empty = { category: "", condition: "", minPrice: "", maxPrice: "" }; setMobileFilters(empty); updateParams(empty); setMobileOpen(false); }}
      >
        <FilterSearch idPrefix="mobile" values={mobileFilters} categories={categories} onChange={setMobileFilters} />
      </MobileFilterSheet>
    </div>
  );
}
