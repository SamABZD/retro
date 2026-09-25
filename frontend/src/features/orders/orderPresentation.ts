export const orderStatusLabel = (status: string) => ({
  PAYMENT_COMPLETED: "Order placed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  PENDING_PAYMENT: "Awaiting payment",
  PAYMENT_FAILED: "Payment failed",
  RETURNED: "Returned",
}[status] || status.replaceAll("_", " "));

export const formatOrderDate = (value?: string) => {
  if (!value) return "Date unavailable";
  const parsed = new Date(value.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? "Date unavailable" : parsed.toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
};
