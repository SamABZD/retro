import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { ListingGrid } from "@/components/marketplace/ListingGrid";
import { ListingGridSkeleton } from "@/components/marketplace/ListingGridSkeleton";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAllCategoriesQuery } from "@/redux/fetures/categories.api";
import { useGetAllAdsQuery } from "@/redux/fetures/ads.api";

export default function HomePage() {
  const categoriesQuery = useGetAllCategoriesQuery({ page: 1, limit: 20 });
  const newestQuery = useGetAllAdsQuery({ page: 1, limit: 8, sort: "newest" });
  const moreQuery = useGetAllAdsQuery({ page: 2, limit: 8, sort: "newest" });
  const categories = categoriesQuery.data?.data || [];
  const newest = newestQuery.data?.data || [];
  const more = moreQuery.data?.data || [];

  return <PageContainer className="pb-16 sm:pb-20">
    <section className="flex flex-col justify-between gap-5 pb-9 pt-10 sm:pb-11 sm:pt-14 lg:flex-row lg:items-end">
      <div><h1 className="type-display max-w-[17ch]">Find something worth keeping.</h1><p className="mt-4 text-sm text-muted-foreground sm:text-base">Good things. New owners. A little more possibility.</p></div>
      <Link to="/search" className="inline-flex min-h-11 w-fit items-center gap-3 text-sm font-medium underline decoration-border underline-offset-8 hover:decoration-primary">Browse all listings <ArrowRight className="size-4" aria-hidden="true" /></Link>
    </section>
    <section aria-label="Browse by category" className="border-y py-3">
      {categoriesQuery.isLoading ? <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 lg:grid-cols-5" aria-label="Loading categories">{Array.from({ length: 9 }, (_, index) => <Skeleton key={index} className="h-11" />)}</div> : categoriesQuery.isError ? <ErrorState title="Categories couldn’t be loaded" description="Try again to browse by category." action={<Button variant="outline" onClick={() => categoriesQuery.refetch()}>Retry</Button>} /> :
        <div className="flex gap-x-6 overflow-x-auto sm:grid sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-5">{categories.map((category: { id: string; name: string }, index: number) => <Link key={category.id} to={`/search?category=${encodeURIComponent(category.id)}`} className="group flex min-h-12 shrink-0 items-center gap-3 py-2 text-sm"><span className="text-xs tabular-nums text-brand-ink">{String(index + 1).padStart(2, "0")}</span><span className="font-medium underline-offset-4 group-hover:underline">{category.name}</span></Link>)}</div>}
    </section>
    <section className="pt-10 sm:pt-12">
      <SectionHeader title="Newly listed" action={<Button asChild variant="ghost"><Link to="/search?sort=newest">View all <ArrowRight aria-hidden="true" /></Link></Button>} />
      {newestQuery.isLoading ? <ListingGridSkeleton className="mt-6 lg:grid-cols-4" /> : newestQuery.isError ? <ErrorState className="mt-6" title="Listings couldn’t be loaded" description="The marketplace may be temporarily unavailable." action={<Button variant="outline" onClick={() => newestQuery.refetch()}>Retry</Button>} /> : <ListingGrid listings={newest} className="mt-6 lg:grid-cols-4" />}
    </section>
    {(moreQuery.isLoading || more.length > 0) && <section className="mt-12 border-t pt-10 sm:mt-16"><SectionHeader title="Explore more" />{moreQuery.isLoading ? <ListingGridSkeleton className="mt-6 lg:grid-cols-4" /> : <ListingGrid listings={more} className="mt-6 lg:grid-cols-4" />}</section>}
  </PageContainer>;
}
