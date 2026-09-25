import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  level?: 1 | 2 | 3;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
  level = 2,
}: SectionHeaderProps) {
  const Heading = `h${level}` as const;
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="type-label mb-2 text-brand-ink">{eyebrow}</p>}
        <Heading className={level === 1 ? "type-h1" : level === 2 ? "type-h2" : "type-h3"}>
          {title}
        </Heading>
        {description && (
          <p className="mt-2 max-w-[var(--max-reading)] text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

