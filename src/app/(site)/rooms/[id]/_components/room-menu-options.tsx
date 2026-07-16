"use client";

import { useState } from "react";

import { money } from "@/lib/format";
import type { MenuItem } from "@/lib/menu-actions";

interface RoomMenuOptionsProps {
  items: MenuItem[];
  onMenuItemsChange?: (items: MenuItem[], totalPrice: number) => void;
}

export function RoomMenuOptions({ items, onMenuItemsChange }: RoomMenuOptionsProps) {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  function handleToggle(itemId: number) {
    const nextSelectedIds = selectedItems.includes(itemId)
      ? selectedItems.filter((id) => id !== itemId)
      : [...selectedItems, itemId];

    setSelectedItems(nextSelectedIds);

    const selectedMenuItems = items.filter((item) => nextSelectedIds.includes(item.id));
    const totalPrice = selectedMenuItems.reduce((sum, item) => sum + Number(item.price), 0);
    onMenuItemsChange?.(selectedMenuItems, totalPrice);
  }

  if (!items.length) {
    return (
      <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-xl font-bold text-white">Menu options</h3>
        <p className="mt-2 text-sm text-white/60">Chi nhánh này hiện chưa có menu để chọn thêm.</p>
      </section>
    );
  }

  const totalPrice = selectedItems.reduce((sum, id) => {
    const item = items.find((menuItem) => menuItem.id === id);
    return sum + Number(item?.price ?? 0);
  }, 0);

  const hasValidImage = (item: MenuItem) =>
    !!item.image_url &&
    !failedImages.has(item.id) &&
    (item.image_url.startsWith("http") || item.image_url.startsWith("/"));

  return (
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-5">
        <h3 className="text-xl font-black tracking-[-0.02em] text-white">Chọn menu</h3>
        <p className="mt-1 text-sm text-white/50">Còn nhiều món để chọn</p>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {items.map((item) => {
          const selected = selectedItems.includes(item.id);
          const showImg = hasValidImage(item);
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => handleToggle(item.id)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleToggle(item.id)}
              className={`group flex cursor-pointer items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-200 ${
                selected
                  ? "border-yellow-400/60 bg-yellow-400/10 shadow-[0_0_12px_rgba(234,179,8,0.12)]"
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]"
              }`}
            >
              {/* Thumbnail */}
              {showImg ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image_url!}
                    alt={item.name}
                    className="h-full w-full object-cover"
                    onError={() =>
                      setFailedImages((prev) => new Set([...prev, item.id]))
                    }
                  />
                </div>
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 text-2xl">
                  🛒
                </div>
              )}

              {/* Content */}
              <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                <div className="min-w-0">
                  <p className={`truncate text-sm font-semibold leading-tight ${selected ? "text-yellow-300" : "text-white"}`}>
                    {item.name}
                  </p>
                  {item.description && (
                    <p className="mt-0.5 truncate text-xs text-white/45">{item.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="whitespace-nowrap text-sm font-bold text-pink-400">
                    {money(Number(item.price))}
                  </span>
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                      selected
                        ? "border-yellow-400 bg-yellow-400"
                        : "border-white/30 bg-transparent"
                    }`}
                  >
                    {selected && (
                      <svg viewBox="0 0 10 8" className="h-2.5 w-2.5 text-black" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 4l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedItems.length > 0 && (
        <div className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white/80">
              Tổng menu ({selectedItems.length}):
            </span>
            <span className="text-lg font-black text-pink-400">{money(totalPrice)}</span>
          </div>
        </div>
      )}
    </section>
  );
}
