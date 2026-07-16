import Link from 'next/link';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllMenuItems } from '@/lib/menu-actions';
import { getBranches } from '@/lib/homestay-dashboard';
import { MenuItemsTable } from './_components/menu-items-table';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Menu Items - Admin Dashboard',
  description: 'Quản lý menu items cho đặt phòng',
};

export default async function MenuItemsPage() {
  const [menuItems, branches] = await Promise.all([getAllMenuItems(), getBranches()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menu Items</h1>
          <p className="text-muted-foreground mt-2">Quản lý các tùy chọn menu khi đặt phòng</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/menu-items/create">
            <Plus className="mr-2 size-4" />
            Thêm Menu Item
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Menu Items ({menuItems.length})</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <MenuItemsTable items={menuItems} branches={branches} />
        </CardContent>
      </Card>
    </div>
  );
}
