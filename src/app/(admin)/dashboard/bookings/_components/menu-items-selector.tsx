'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { money } from '@/lib/format';
import type { MenuItem } from '@/lib/menu-actions';

interface MenuItemsSelectorProps {
  items: MenuItem[];
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
}

export function MenuItemsSelector({ items, selectedIds, onSelectionChange }: MenuItemsSelectorProps) {
  const activeItems = items.filter((item) => item.is_active);

  function handleToggle(itemId: number) {
    onSelectionChange(
      selectedIds.includes(itemId)
        ? selectedIds.filter((id) => id !== itemId)
        : [...selectedIds, itemId]
    );
  }

  if (!activeItems.length) {
    return (
      <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
        Không có menu items hoạt động cho chi nhánh này
      </div>
    );
  }

  const totalPrice = selectedIds.reduce((sum, id) => {
    const item = items.find((i) => i.id === id);
    return sum + Number(item?.price ?? 0);
  }, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {activeItems.map((item) => (
          <Card
            key={item.id}
            className={`p-4 cursor-pointer transition-colors ${
              selectedIds.includes(item.id)
                ? 'bg-primary/10 border-primary'
                : 'hover:bg-muted/50'
            }`}
            onClick={() => handleToggle(item.id)}
          >
            <div className="flex items-start gap-3">
              <div
                className="mt-1"
                onClick={(event) => {
                  event.stopPropagation();
                }}
              >
                <Checkbox
                  checked={selectedIds.includes(item.id)}
                  onCheckedChange={() => handleToggle(item.id)}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <Label className="font-semibold cursor-pointer">{item.name}</Label>
                  <span className="text-sm font-bold text-primary whitespace-nowrap">
                    {money(item.price)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {item.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Tổng menu items ({selectedIds.length}):</span>
            <span className="font-bold text-primary">{money(totalPrice)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
