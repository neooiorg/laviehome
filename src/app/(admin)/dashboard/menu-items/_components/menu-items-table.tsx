'use client';

import Link from 'next/link';
import { Pencil, Trash2, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { money } from '@/lib/format';
import { deleteMenuItem, toggleMenuItemStatus } from '@/lib/menu-actions';
import { useState } from 'react';
import type { MenuItem } from '@/lib/menu-actions';

interface MenuItemsTableProps {
  items: MenuItem[];
}

export function MenuItemsTable({ items }: MenuItemsTableProps) {
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState<number | null>(null);

  async function handleDelete(id: number) {
    if (!confirm('Bạn chắc chắn muốn xóa menu item này?')) return;
    setIsDeleting(id);
    try {
      await deleteMenuItem(id);
    } finally {
      setIsDeleting(null);
    }
  }

  async function handleToggleStatus(id: number) {
    setIsTogglingStatus(id);
    try {
      await toggleMenuItemStatus(id);
    } finally {
      setIsTogglingStatus(null);
    }
  }

  if (!items.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Chưa có menu items nào</p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-auto">
      <table className="w-full caption-bottom text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="h-12 px-4 text-left align-middle font-medium">Tên</th>
            <th className="h-12 px-4 text-left align-middle font-medium">Mô tả</th>
            <th className="h-12 px-4 text-left align-middle font-medium">Giá</th>
            <th className="h-12 px-4 text-left align-middle font-medium">Chi nhánh</th>
            <th className="h-12 px-4 text-left align-middle font-medium">Trạng thái</th>
            <th className="h-12 px-4 text-right align-middle font-medium">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-muted/50">
              <td className="px-4 py-3 align-middle font-medium">{item.name}</td>
              <td className="px-4 py-3 align-middle text-muted-foreground line-clamp-1">
                {item.description}
              </td>
              <td className="px-4 py-3 align-middle font-semibold text-primary">
                {money(item.price)}
              </td>
              <td className="px-4 py-3 align-middle text-sm text-muted-foreground">
                Branch {item.branch_id}
              </td>
              <td className="px-4 py-3 align-middle">
                <Badge variant={item.is_active ? 'default' : 'outline'}>
                  {item.is_active ? 'Hoạt động' : 'Tắt'}
                </Badge>
              </td>
              <td className="px-4 py-3 align-middle text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(item.id)}
                    disabled={isTogglingStatus === item.id}
                    title={item.is_active ? 'Tắt' : 'Bật'}
                  >
                    {item.is_active ? (
                      <Eye className="size-4" />
                    ) : (
                      <EyeOff className="size-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/menu-items/${item.id}/edit`}>
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    disabled={isDeleting === item.id}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
