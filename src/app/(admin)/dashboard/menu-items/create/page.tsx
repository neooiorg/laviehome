import { getBranches } from '@/lib/homestay-dashboard';
import { MenuItemForm } from '../_components/menu-item-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thêm Menu Item - Admin Dashboard',
};

export default async function CreateMenuItemPage() {
  const branches = await getBranches();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Thêm Menu Item</h1>
        <p className="text-muted-foreground mt-2">Tạo menu item mới cho khách hàng đặt phòng</p>
      </div>
      <MenuItemForm branches={branches} />
    </div>
  );
}
