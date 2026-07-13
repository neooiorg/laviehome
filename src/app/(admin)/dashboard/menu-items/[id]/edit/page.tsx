import { notFound } from 'next/navigation';
import { getBranches } from '@/lib/homestay-dashboard';
import { getMenuItemById } from '@/lib/menu-actions';
import { MenuItemForm } from '../../_components/menu-item-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chỉnh sửa Menu Item - Admin Dashboard',
};

export default async function EditMenuItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [menuItem, branches] = await Promise.all([
    getMenuItemById(Number(id)),
    getBranches(),
  ]);

  if (!menuItem) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chỉnh sửa Menu Item</h1>
        <p className="text-muted-foreground mt-2">{menuItem.name}</p>
      </div>
      <MenuItemForm branches={branches} initialData={menuItem} isEditing={true} />
    </div>
  );
}
