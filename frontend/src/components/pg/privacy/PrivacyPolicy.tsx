const PrivacyPolicy = () => (
  <div className="min-h-screen bg-background px-4 py-12 md:px-8">
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-brand-ink">
        Local preview
      </p>
      <h1 className="text-3xl font-semibold text-foreground">Privacy Policy</h1>
      <p className="mt-5 leading-relaxed text-muted-foreground">
        This page is a placeholder for a local portfolio demo, not a production
        privacy notice. Please use test details only; do not enter real personal
        or payment information while evaluating this preview.
      </p>
      <div className="mt-8 border-t pt-6">
        <h2 className="text-lg font-semibold text-foreground">Before a public launch</h2>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          A reviewed privacy notice must explain what information the live service
          collects, how it is used and retained, who receives it, and how people
          can make privacy requests. This demo page does not make those claims.
        </p>
      </div>
    </div>
  </div>
);

export default PrivacyPolicy;
