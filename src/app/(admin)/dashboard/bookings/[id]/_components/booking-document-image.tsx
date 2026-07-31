"use client";

import { useState } from "react";
import { Download, Maximize2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

function downloadHref(src: string) {
  return `/api/download-image?src=${encodeURIComponent(src)}`;
}

export function BookingDocumentImage({ src, label }: { src: string; label: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="flex gap-1.5">
          <Button type="button" variant="outline" size="icon" className="size-8" onClick={() => setOpen(true)} title="Xem ảnh lớn">
            <Maximize2 className="size-4" />
            <span className="sr-only">Xem ảnh lớn</span>
          </Button>
          <Button asChild variant="outline" size="icon" className="size-8" title="Tải ảnh xuống">
            <a href={downloadHref(src)}>
              <Download className="size-4" />
              <span className="sr-only">Tải ảnh xuống</span>
            </a>
          </Button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full overflow-hidden rounded-lg border bg-muted text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={label} className="w-full object-cover" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[90] bg-black/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="absolute right-4 top-4 z-10 flex gap-2">
            <Button asChild variant="secondary" size="icon" title="Tải ảnh xuống">
              <a href={downloadHref(src)}>
                <Download className="size-5" />
                <span className="sr-only">Tải ảnh xuống</span>
              </a>
            </Button>
            <Button type="button" variant="secondary" size="icon" onClick={() => setOpen(false)} title="Đóng">
              <X className="size-5" />
              <span className="sr-only">Đóng</span>
            </Button>
          </div>
          <button type="button" className="absolute inset-0 cursor-zoom-out" onClick={() => setOpen(false)} aria-label="Đóng ảnh lớn" />
          <div className="pointer-events-none relative z-0 flex h-full w-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={label} className="pointer-events-auto max-h-full max-w-full rounded-lg object-contain shadow-2xl" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
