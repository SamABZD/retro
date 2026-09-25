import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function ContactUs() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="type-label text-brand-ink">Help & contact</p>
      <h1 className="type-h1 mt-2">How can we help?</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        This is a local portfolio demo, so a live support inbox is not connected. The guides below explain the available marketplace flows and safer ways to browse.
      </p>
      <div className="mt-8 divide-y border-y">
        <div className="flex flex-wrap items-center justify-between gap-3 py-5">
          <div><h2 className="font-semibold">Buying and selling questions</h2><p className="mt-1 text-sm text-muted-foreground">Accounts, listings, checkout, and orders.</p></div>
          <Button asChild variant="outline"><Link to="/faq">Read FAQs <ArrowRight aria-hidden="true" /></Link></Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 py-5">
          <div><h2 className="font-semibold">Marketplace safety</h2><p className="mt-1 text-sm text-muted-foreground">How to assess listings and avoid suspicious requests.</p></div>
          <Button asChild variant="outline"><Link to="/fraud-prevention">Safety guide <ArrowRight aria-hidden="true" /></Link></Button>
        </div>
      </div>
    </div>
  );
}
