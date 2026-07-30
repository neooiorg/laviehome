"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Room photo that never crops or stretches. The full image is shown with
 * `object-contain`, and a blurred, zoomed copy of the same image fills the
 * letterbox area behind it — so photos of any aspect ratio look clean without
 * ugly empty bars.
 *
 * Drop it into any positioned (`relative`) box with a fixed size / aspect —
 * both layers use `fill`.
 */
export function RoomPhoto({
  src,
  alt,
  sizes,
  priority,
  className,
}: {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  // Uploaded room images are pre-optimized webp served from our own route.
  const unoptimized = src.startsWith("/api/upload/");
  return (
    <>
      <Image
        src={src}
        alt=""
        aria-hidden
        fill
        sizes={sizes}
        unoptimized={unoptimized}
        draggable={false}
        className="scale-110 object-cover opacity-40 blur-2xl select-none"
      />
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        unoptimized={unoptimized}
        draggable={false}
        className={cn("object-contain select-none", className)}
      />
    </>
  );
}
