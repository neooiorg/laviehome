'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { money } from '@/lib/format';
import { getMenuItemsByBranch } from '@/lib/menu-actions';
import type { MenuItem } from '@/lib/menu-actions';

interface RoomMenuOptionsProps {
  branchId: number;
  onMenuItemsChange?: (items: MenuItem[], totalPrice: number) => void;
}

export function RoomMenuOptions({ branchId, onMenuItemsChange }: RoomMenuOptionsProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setSelectedItems([]);
    onMenuItemsChange?.([], 0);
    getMenuItemsByBranch(branchId)
      .then((items) => {
        setMenuItems(items.filter((item) => item.is_active));
      })
      .finally(() => setLoading(false));
  }, [branchId, onMenuItemsChange]);

  function handleToggle(itemId: number) {
    const newSelected = selectedItems.includes(itemId)
      ? selectedItems.filter((id) => id !== itemId)
      : [...selectedItems, itemId];
    setSelectedItems(newSelected);

    // Calculate total and notify parent
    const selectedMenuItems = menuItems.filter((item) => newSelected.includes(item.id));
    const totalPrice = selectedMenuItems.reduce((sum, item) => sum + Number(item.price), 0);
    onMenuItemsChange?.(selectedMenuItems, totalPrice);
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Đang tải menu options...</div>;
  }

  if (!menuItems.length) {
    return null;
  }

  const totalPrice = selectedItems.reduce((sum, id) => {
    const item = menuItems.find((i) => i.id === id);
    return sum + Number(item?.price ?? 0);
  }, 0);

  return (
    <section className="mt-8 bg-gradient-to-b from-yellow-50 to-transparent rounded-2xl p-6 border border-yellow-200">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">Chọn menu</h3>
        <p className="text-sm text-gray-600 mt-1">Còn nhiều món để chọn</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {menuItems.map((item) => (
          <Card
            key={item.id}
            className={`cursor-pointer transition-all overflow-hidden ${
              selectedItems.includes(item.id)
                ? 'bg-primary/10 border-primary shadow-sm'
                : 'bg-white hover:bg-gray-50'
            }`}
            onClick={() => handleToggle(item.id)}
          >
            {item.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-32 object-cover"
              />
            )}
            <div className="flex items-start gap-3 p-4">
              <Checkbox
                checked={selectedItems.includes(item.id)}
                onCheckedChange={() => handleToggle(item.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start gap-2">
                  <Label className="font-semibold cursor-pointer text-gray-900">
                    {item.name}
                  </Label>
                  <span className="text-sm font-bold text-pink-500 whitespace-nowrap">
                    {money(Number(item.price))}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {item.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedItems.length > 0 && (
        <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-900">
              Tổng menu ({selectedItems.length}):
            </span>
            <span className="font-bold text-lg text-pink-600">{money(totalPrice)}</span>
          </div>
        </div>
      )}
    </section>
  );
}
