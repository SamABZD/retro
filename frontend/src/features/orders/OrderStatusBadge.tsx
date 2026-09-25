import { Badge } from "@/components/ui/badge";
import { orderStatusLabel } from "./orderPresentation";

const variants = {
  PAYMENT_COMPLETED: "info",
  PROCESSING: "warning",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "destructive",
  PENDING_PAYMENT: "warning",
  PAYMENT_FAILED: "destructive",
  RETURNED: "secondary",
} as const;

export function OrderStatusBadge({ status }: { status: string }) {
  const variant = variants[status as keyof typeof variants] || "secondary";
  return <Badge variant={variant}>{orderStatusLabel(status)}</Badge>;
}
