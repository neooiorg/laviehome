"use client";

import { useState } from "react";

import { money } from "@/lib/format";
import type { MenuItem } from "@/lib/menu-actions";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface RoomMenuOptionsProps {
  items: MenuItem[];
  onMenuItemsChange?: (items: MenuItem[], totalPrice: number) => void;
}

export function RoomMenuOptions({ items, onMenuItemsChange }: RoomMenuOptionsProps) {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

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

  return (
    <section className="mt-8 rounded-2xl border border-yellow-200 bg-gradient-to-b from-yellow-50 to-transparent p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">Chọn menu</h3>
        <p className="mt-1 text-sm text-gray-600">Còn nhiều món để chọn</p>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {items.map((item) => (
          <Card
            key={item.id}
            className={`cursor-pointer overflow-hidden transition-all ${
              selectedItems.includes(item.id) ? "border-primary bg-primary/10 shadow-sm" : "bg-white hover:bg-gray-50"
            }`}
            onClick={() => handleToggle(item.id)}
          >
            {item.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image_url} alt={item.name} className="h-32 w-full object-cover" />
            )}
            <div className="flex items-start gap-3 p-4">
              <div
                className="mt-1"
                onClick={(event) => {
                  event.stopPropagation();
                }}
              >
                <Checkbox checked={selectedItems.includes(item.id)} onCheckedChange={() => handleToggle(item.id)} />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <Label className="cursor-pointer font-semibold text-gray-900">{item.name}</Label>
                  <span className="whitespace-nowrap text-sm font-bold text-pink-500">{money(Number(item.price))}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-gray-600">{item.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedItems.length > 0 && (
        <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-100 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">Tổng menu ({selectedItems.length}):</span>
            <span className="text-lg font-bold text-pink-600">{money(totalPrice)}</span>
          </div>
        </div>
      )}
    </section>
  );
}
