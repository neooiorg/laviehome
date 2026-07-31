"use client";

import { useState } from "react";
import { Download, Maximize2, X } from "lucide-react";

import { RoomPhoto } from "@/components/room-photo";

const PLACEHOLDER_IMG = "https://placehold.co/900x650/1b1023/white?text=Anh+phong";

function safeImg(src: string | undefined | null) {
  return src && (src.startsWith("http") || src.startsWith("/")) ? src : PLACEHOLDER_IMG;
}

function downloadHref(src: string) {
  return `/api/download-image?src=${encodeURIComponent(src)}`;
}

export function RoomGallery({ images, alt }: { images: string[]; alt: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const mainSrc = safeImg(images[activeIndex] ?? images[0]);

  return (
    <div className="space-y-6">
      <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border-4 border-white bg-slate-900 shadow-[8px_8px_0px_rgba(243,90,189,0.4)]">
        <button
          type="button"
          onClick={() => setLightboxSrc(mainSrc)}
          className="absolute inset-0 cursor-zoom-in"
          aria-label="Xem ảnh lớn"
        >
          <RoomPhoto src={mainSrc} alt={alt} priority sizes="(max-width: 1024px) 100vw, 800px" />
        </button>
        <div className="absolute left-4 top-4 bg-pink-600 border-2 border-white text-white px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-[3px_3px_0px_#fff]">
          Ảnh phòng thực tế 100%
        </div>
        <div className="absolute right-4 top-4 z-10 flex gap-2">
          <a
            href={downloadHref(mainSrc)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white bg-black/55 text-white shadow-[3px_3px_0px_rgba(255,255,255,0.45)] backdrop-blur transition hover:bg-pink-600"
            aria-label="Tải ảnh xuống"
            title="Tải ảnh xuống"
          >
            <Download size={18} />
          </a>
          <button
            type="button"
            onClick={() => setLightboxSrc(mainSrc)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white bg-black/55 text-white shadow-[3px_3px_0px_rgba(255,255,255,0.45)] backdrop-blur transition hover:bg-pink-600"
            aria-label="Xem ảnh lớn"
            title="Xem ảnh lớn"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.slice(0, 6).map((imgUrl, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                type="button"
                key={index}
                onClick={() => setActiveIndex(index)}
                aria-label={`Xem ảnh ${index + 1}`}
                aria-pressed={isActive}
                className={`border-2 bg-slate-900 rounded-2xl overflow-hidden shadow-[4px_4px_0px_rgba(255,255,255,0.05)] transition-all aspect-[4/3] relative cursor-pointer group ${
                  isActive
                    ? "border-pink-300 shadow-[4px_4px_0px_rgba(243,90,189,0.5)]"
                    : "border-white/20 hover:border-pink-300 hover:shadow-[4px_4px_0px_rgba(243,90,189,0.3)]"
                }`}
              >
                <RoomPhoto
                  src={safeImg(imgUrl)}
                  alt={`${alt} - Góc ${index + 1}`}
                  sizes="(max-width: 640px) 50vw, 260px"
                  className="transition duration-300 group-hover:scale-105"
                />
              </button>
            );
          })}
        </div>
      )}

      {lightboxSrc ? (
        <div className="fixed inset-0 z-[90] bg-black/90 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="absolute right-4 top-4 z-10 flex gap-2">
            <a
              href={downloadHref(lightboxSrc)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white backdrop-blur transition hover:bg-pink-600"
              aria-label="Tải ảnh xuống"
              title="Tải ảnh xuống"
            >
              <Download size={20} />
            </a>
            <button
              type="button"
              onClick={() => setLightboxSrc(null)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white backdrop-blur transition hover:bg-pink-600"
              aria-label="Đóng ảnh lớn"
              title="Đóng"
            >
              <X size={22} />
            </button>
          </div>
          <button
            type="button"
            className="absolute inset-0 cursor-zoom-out"
            onClick={() => setLightboxSrc(null)}
            aria-label="Đóng ảnh lớn"
          />
          <div className="pointer-events-none relative h-full w-full">
            <RoomPhoto src={lightboxSrc} alt={alt} sizes="100vw" className="pointer-events-auto" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
