import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandMark } from "@/components/brand/BrandMark";

interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
  asideTitle?: string;
  asideDescription?: string;
}

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="min-h-dvh bg-background px-5 sm:px-8">
      <a href="#auth-form" className="skip-link">Skip to form</a>
      <header className="mx-auto flex max-w-[var(--max-content)] items-center justify-between gap-4 border-b py-5">
        <BrandMark />
        <Link to="/" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" aria-hidden="true" />Back to marketplace</Link>
      </header>
      <div id="auth-form" className="mx-auto w-full max-w-[28rem] py-12 sm:py-20" tabIndex={-1}>
        <div className="mb-8"><h1 className="type-h1">{title}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p></div>
        {children}
      </div>
      <footer className="mx-auto flex max-w-[28rem] flex-wrap gap-x-5 gap-y-2 border-t py-6 text-xs text-muted-foreground">
        <Link to="/terms" className="hover:text-foreground">Terms</Link><Link to="/privacy" className="hover:text-foreground">Privacy</Link><Link to="/fraud-prevention" className="hover:text-foreground">Marketplace safety</Link>
      </footer>
    </main>
  );
}
