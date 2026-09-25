import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function PageContainer({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("marketplace-container mx-auto w-full max-w-[var(--max-content)] px-4 sm:px-6 lg:px-8", className)}
      {...props}
    />
  );
}

