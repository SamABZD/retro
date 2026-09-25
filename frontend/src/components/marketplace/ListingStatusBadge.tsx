import { Badge } from "@/components/ui/badge";

const statusLabels: Record<string, string> = {
  ACTIVE: "Available",
  SOLD: "Sold",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
};

export function ListingStatusBadge({ status }: { status?: string }) {
  const normalized = (status || "ACTIVE").toUpperCase();
  const variant = normalized === "ACTIVE" ? "success" : "secondary";
  return <Badge variant={variant}>{statusLabels[normalized] || status || "Available"}</Badge>;
}
