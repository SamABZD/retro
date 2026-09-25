import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function BrandMark({ className, link = true }: { className?: string; link?: boolean }) {
  const content = <span className="text-[2rem] font-semibold leading-none tracking-[-0.065em] text-foreground">retro<span className="text-primary">.</span></span>;
  const classes = cn("inline-flex min-h-11 shrink-0 items-center", className);
  return link ? <Link to="/" className={classes} aria-label="Retro home">{content}</Link> : <span className={classes}>{content}</span>;
}
