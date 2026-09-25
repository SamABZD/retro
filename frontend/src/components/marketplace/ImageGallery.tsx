import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { ListingImage } from "@/components/marketplace/ListingImage";
import type { MarketplaceImage } from "@/types/marketplace";

export function ImageGallery({ images, title }: { images: MarketplaceImage[]; title: string }) {
  const uniqueImages = useMemo(
    () => Array.from(new Set(images.map((image) => image.url).filter(Boolean))),
    [images],
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const hasMultiple = uniqueImages.length > 1;

  useEffect(() => setSelectedIndex(0), [title, uniqueImages.length]);

  const selectRelative = (offset: number) => {
    if (!uniqueImages.length) return;
    setSelectedIndex((current) => (current + offset + uniqueImages.length) % uniqueImages.length);
  };

  return (
    <div
      className="space-y-3"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") selectRelative(-1);
        if (event.key === "ArrowRight") selectRelative(1);
      }}
      tabIndex={0}
      aria-label={`${title} image gallery`}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted sm:aspect-[16/11]">
        <ListingImage
          src={uniqueImages[selectedIndex]}
          alt={hasMultiple ? `${title}, image ${selectedIndex + 1} of ${uniqueImages.length}` : title}
          loading="eager"
          className="pointer-events-none h-full w-full"
        />
        {hasMultiple && (
          <>
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-between p-3">
              <IconButton
                type="button"
                variant="outline"
                label="Previous image"
                onClick={() => selectRelative(-1)}
                className="pointer-events-auto bg-background/95"
              >
                <ChevronLeft aria-hidden="true" />
              </IconButton>
              <IconButton
                type="button"
                variant="outline"
                label="Next image"
                onClick={() => selectRelative(1)}
                className="pointer-events-auto bg-background/95"
              >
                <ChevronRight aria-hidden="true" />
              </IconButton>
            </div>
            <span className="absolute bottom-3 right-3 z-30 rounded-md bg-foreground/85 px-2 py-1 text-xs font-medium text-background">
              {selectedIndex + 1} / {uniqueImages.length}
            </span>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Choose listing image">
          {uniqueImages.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={`Show image ${index + 1}`}
              aria-current={selectedIndex === index ? "true" : undefined}
              className="h-16 w-20 shrink-0 overflow-hidden rounded-md border-2 bg-muted aria-[current=true]:border-brand-ink"
            >
              <ListingImage src={image} alt="" className="pointer-events-none h-full w-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
