import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-transparent text-sm font-semibold transition-[background-color,border-color,color,box-shadow] disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border-border bg-card text-foreground hover:border-input hover:bg-surface-subtle",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/75",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        link: "h-auto border-0 p-0 text-foreground decoration-primary underline-offset-4 hover:underline active:translate-y-0",
        signal: "bg-primary text-primary-foreground hover:bg-primary-hover",
      },
      size: {
        default: "h-11 px-4",
        xs: "h-8 gap-1 px-2.5 text-xs",
        sm: "h-9 px-3",
        lg: "h-12 px-6 text-base",
        icon: "size-11 p-0",
        "icon-xs": "size-8 p-0 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-9 p-0",
        "icon-lg": "size-12 p-0 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  isLoading = false,
  loadingText,
  children,
  disabled,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    isLoading?: boolean;
    loadingText?: string;
  }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      aria-busy={isLoading || undefined}
      disabled={disabled || isLoading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {isLoading ? (
        <>
          <LoaderCircle className="animate-spin" aria-hidden="true" />
          {loadingText ? <span>{loadingText}</span> : <span className="sr-only">Loading</span>}
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
