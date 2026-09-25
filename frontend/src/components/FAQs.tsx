import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const questions = [
  {
    question: "How do I buy an item?",
    answer: "Browse or search listings, review the item and seller details, then add the item to your cart. The local demo checkout asks for a delivery address and phone number but never requests payment details.",
  },
  {
    question: "How do I sell an item?",
    answer: "Create an account, apply to become a seller, and wait for approval. You can then add a listing with a title, description, price, condition, category, quantity, and photos. New and edited listings are reviewed before they appear publicly.",
  },
  {
    question: "Can I edit or remove a listing?",
    answer: "Sellers can manage their own listings from My listings. A listing linked to an existing order is archived when removed so the buyer's order history remains intact.",
  },
  {
    question: "Where can I see my orders?",
    answer: "Open Orders in your account to see purchases, order status, item prices, and receipts. Sellers have a separate Orders view for purchases involving their listings.",
  },
  {
    question: "Does the demo process real payments or shipping?",
    answer: "No. Checkout is simulated and does not collect card details or arrange shipment. Orders and inventory still update within the local demo.",
  },
];

export default function FAQs() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="type-label text-brand-ink">Help</p>
      <h1 className="type-h1 mt-2">Common questions</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">A quick guide to buying and selling in this marketplace demo.</p>
      <div className="mt-8 divide-y border-y">
        {questions.map(({ question, answer }) => (
          <details key={question} className="group py-4">
            <summary className="cursor-pointer list-none pr-8 font-semibold marker:hidden focus-visible:rounded-sm [&::-webkit-details-marker]:hidden">
              {question}<span className="float-right text-brand-ink group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{answer}</p>
          </details>
        ))}
      </div>
      <Button asChild variant="outline" className="mt-8"><Link to="/search">Browse listings</Link></Button>
    </div>
  );
}
