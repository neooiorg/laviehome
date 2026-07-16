'use client';

import { Check, ShoppingBag } from 'lucide-react';

import { cn } from '@/lib/utils';
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
      <p className="text-sm text-muted-foreground py-3">
        Không có menu items hoạt động cho chi nhánh này.
      </p>
    );
  }

  return (
    <div className="rounded-lg border divide-y overflow-hidden">
      {activeItems.map((item) => {
        const selected = selectedIds.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleToggle(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
              selected ? 'bg-primary/5' : 'hover:bg-muted/40'
            )}
          >
            {item.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image_url}
                alt=""
                className="h-10 w-10 shrink-0 rounded-md border object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                <ShoppingBag className="size-4 text-muted-foreground" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium leading-tight">{item.name}</div>
              {item.description && (
                <div className="mt-0.5 truncate text-xs text-muted-foreground">{item.description}</div>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className={cn('text-sm font-semibold', selected ? 'text-primary' : '')}>
                {money(item.price)}đ
              </span>
              <Check
                className={cn(
                  'size-4 transition-opacity',
                  selected ? 'text-primary opacity-100' : 'opacity-0'
                )}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
