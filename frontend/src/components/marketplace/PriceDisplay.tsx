import { cn } from "@/lib/utils";

export function PriceDisplay({ amount, currency = "USD", className }: { amount: number | string; currency?: string; className?: string }) {
  const numericAmount = Number(amount);
  const formatted = Number.isFinite(numericAmount)
    ? new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(numericAmount)
    : String(amount);

  return <span className={cn("font-semibold tabular-nums tracking-[-0.02em] text-foreground", className)}>{formatted}</span>;
}

