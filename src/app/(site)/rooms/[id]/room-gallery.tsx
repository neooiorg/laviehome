"use client";

import { useState } from "react";
import Image from "next/image";

const PLACEHOLDER_IMG = "https://placehold.co/900x650/1b1023/white?text=Anh+phong";
function safeImg(src: string | undefined | null) {
  return src && (src.startsWith("http") || src.startsWith("/")) ? src : PLACEHOLDER_IMG;
}

export function RoomGallery({ images, alt }: { images: string[]; alt: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const mainSrc = safeImg(images[activeIndex] ?? images[0]);

  return (
    <div className="space-y-6">
      <div className="border-4 border-white bg-slate-900 rounded-3xl overflow-hidden shadow-[8px_8px_0px_rgba(243,90,189,0.4)] aspect-[16/10] relative">
        <Image src={mainSrc} alt={alt} fill priority className="object-cover" />
        <div className="absolute top-4 left-4 bg-pink-600 border-2 border-white text-white px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-[3px_3px_0px_#fff]">
          ✨ Ảnh phòng thực tế 100%
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
                <Image
                  src={safeImg(imgUrl)}
                  alt={`${alt} - Góc ${index + 1}`}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
