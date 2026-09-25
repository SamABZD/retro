import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrderSuccessPage() {
  const { state } = useLocation();
  const orderIds: number[] = state?.orderIds || [];

  return (
    <div className="min-h-[70vh] px-4 py-16">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-success-surface text-success">
          <CheckCircle2 size={42} />
        </div>
        <h1 className="type-h1 mt-7">
          Your order is confirmed
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          The seller has received your order. You can follow each shipment from your purchase history.
        </p>

        {orderIds.length > 0 && (
          <div className="mt-8 border-y py-5 text-left">
            <div className="flex items-center gap-3 text-foreground">
              <PackageCheck className="text-brand-ink" />
              <span className="font-semibold">Order {orderIds.join(", #")}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Simulated order total: ${Number(state?.total || 0).toFixed(2)}
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/search">Keep shopping</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/user/dashboard/my-purchases">View purchases</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
