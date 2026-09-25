import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface MobileFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCount: number;
  onApply: () => void;
  onClear: () => void;
  children: ReactNode;
}

export default function MobileFilterSheet({
  open,
  onOpenChange,
  activeCount,
  onApply,
  onClear,
  children,
}: MobileFilterSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[min(90vw,24rem)] sm:max-w-sm">
        <SheetHeader className="border-b">
          <SheetTitle>Filter listings</SheetTitle>
          <SheetDescription>
            {activeCount ? `${activeCount} filter${activeCount === 1 ? "" : "s"} active` : "Narrow the marketplace results."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-2">{children}</div>
        <SheetFooter className="border-t">
          <Button onClick={onApply}>Apply filters</Button>
          <Button variant="ghost" onClick={onClear}>Clear filters</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
