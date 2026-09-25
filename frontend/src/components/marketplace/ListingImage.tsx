import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListingImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
}

export function ListingImage({ src, alt, className, loading = "lazy" }: ListingImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return (
      <div
        className={cn("grid place-items-center bg-muted text-muted-foreground", className)}
        role="img"
        aria-label={`${alt} image unavailable`}
      >
        <span className="flex flex-col items-center gap-2 text-xs font-medium">
          <ImageOff className="size-6" aria-hidden="true" />
          Image unavailable
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}
