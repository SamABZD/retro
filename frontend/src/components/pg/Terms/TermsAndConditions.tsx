const TermsAndConditions = () => (
  <div className="min-h-screen bg-background px-4 py-12 md:px-8">
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-brand-ink">
        Local preview
      </p>
      <h1 className="text-3xl font-semibold text-foreground">Terms & Conditions</h1>
      <p className="mt-5 leading-relaxed text-muted-foreground">
        This is a portfolio-stage marketplace demo, not a live commercial service.
        Production terms have not been published for this preview. Listings and
        orders here are for testing the buyer and seller experience only.
      </p>
      <div className="mt-8 border-t pt-6">
        <h2 className="text-lg font-semibold text-foreground">Before a public launch</h2>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          The operator must provide reviewed terms covering accounts, permitted
          listings, payments, fulfillment, disputes, and the responsibilities of
          buyers and sellers. Do not rely on this demo page as those terms.
        </p>
      </div>
    </div>
  </div>
);

export default TermsAndConditions;
