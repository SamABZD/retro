import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IconButtonProps extends Omit<ComponentProps<typeof Button>, "children"> {
  label: string;
  children: ReactNode;
}

export function IconButton({ label, children, className, size = "icon", ...props }: IconButtonProps) {
  return (
    <Button size={size} aria-label={label} title={label} className={cn("shrink-0", className)} {...props}>
      {children}
    </Button>
  );
}

