

const conditionLabels: Record<string, string> = {
  NEW: "New",
  LIKE_NEW: "Like new",
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Well used",
};

export function ConditionBadge({ condition }: { condition?: string }) {
  const normalized = (condition || "GOOD").toUpperCase();
  return <span className="text-[0.8125rem] text-muted-foreground">{conditionLabels[normalized] || condition || "Good"}</span>;
}
