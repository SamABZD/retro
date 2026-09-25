const FraudPrevention = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          Fraud Prevention
        </h1>
        <p className="text-muted-foreground mb-8">Safety tips for this local demo</p>

        <div className="space-y-8 text-foreground leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              1. How to Identify Fraud
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Suspiciously low prices compared to market value.</li>
              <li>Requests for payment outside our platform or via unverified methods.</li>
              <li>Unclear or misleading descriptions of products or services.</li>
              <li>Users refusing to provide verifiable contact information.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              2. Reporting Suspicious Activity
            </h2>
            <p>
              If a listing or user seems suspicious, stop the transaction and
              save the listing link, messages, and any relevant evidence.
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Do not send money or personal information.</li>
              <li>Keep a brief description of the suspicious behavior.</li>
              <li>This demo does not have a live reporting channel. Do not proceed with a suspicious transaction.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              3. Safer Marketplace Habits
            </h2>
            <p>
              Use the information available in the marketplace before you make a decision:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Compare the price with similar listings.</li>
              <li>Read the description and condition carefully.</li>
              <li>Keep checkout and order details inside Retro.</li>
              <li>Leave the transaction if a seller pressures you to act quickly.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              4. User Responsibilities
            </h2>
            <p>
              Users play a key role in keeping the platform safe. Always:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Review the seller information before making a purchase.</li>
              <li>Never share sensitive information outside our platform.</li>
              <li>Stop if a listing or message seems suspicious.</li>
            </ul>
          </section>

          <section className="border-t pt-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Need Help?
            </h2>
            <p>
              If you suspect fraud, stop the transaction. This local demo does not
              provide a support or reporting inbox.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default FraudPrevention;
