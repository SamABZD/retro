import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function AboutUs() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="type-label text-brand-ink">About Retro</p>
      <h1 className="type-h1 mt-2 max-w-3xl">Useful things deserve their next owner.</h1>
      <p className="mt-5 max-w-2xl text-lg leading-7 text-muted-foreground">
        Retro connects people who have something worth passing on with people looking for it. Browse clothes, instruments, electronics, books, home pieces, and more from independent sellers.
      </p>
      <div className="mt-10 grid gap-8 border-t pt-8 sm:grid-cols-3">
        <section>
          <h2 className="text-lg font-semibold">Find something useful</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Search by keyword, category, condition, or price, and review the seller and item details before deciding.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">Give an item a new life</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Approved sellers can create photo-led listings, manage availability, and follow orders in one workspace.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">Know what the demo does</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Checkout is simulated. It creates orders and updates inventory without collecting payment information or arranging shipping.</p>
        </section>
      </div>
      <Button asChild className="mt-10"><Link to="/search">Explore listings <ArrowRight aria-hidden="true" /></Link></Button>
    </div>
  );
}
