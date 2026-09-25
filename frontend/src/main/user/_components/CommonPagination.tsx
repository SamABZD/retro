import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function CommonPagination({ currentPage, totalPages, onPageChange }: Props) {
  return (
    <nav className="flex items-center justify-between gap-4" aria-label="Listing pages">
      <p className="text-sm text-muted-foreground">
        Page <span className="font-semibold text-foreground">{currentPage}</span> of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          aria-label="Previous page"
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
        >
          <ChevronLeft aria-hidden="true" /> <span className="hidden sm:inline">Previous</span>
        </Button>
        <Button
          type="button"
          aria-label="Next page"
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
        >
          <span className="hidden sm:inline">Next</span> <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
