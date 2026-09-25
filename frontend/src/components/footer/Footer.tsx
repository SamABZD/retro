import { Link } from "react-router-dom";
import { BrandMark } from "@/components/brand/BrandMark";
import { PageContainer } from "@/components/layout/PageContainer";

const footerLinks = [
  { label: "Browse", to: "/search" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "Safety", to: "/fraud-prevention" },
  { label: "Terms", to: "/terms" },
  { label: "Privacy", to: "/privacy" },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t">
      <PageContainer className="py-8 sm:py-10">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <BrandMark />
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Good things deserve another chapter.
            </p>
          </div>
          <nav aria-label="Footer navigation" className="flex max-w-2xl flex-wrap gap-x-6 gap-y-3">
            {footerLinks.map((link) => (
              <Link key={link.to} to={link.to} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-8 border-t pt-5 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Retro. Buy nearby. Sell simply.
        </div>
      </PageContainer>
    </footer>
  );
}

