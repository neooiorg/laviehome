import { notFound } from 'next/navigation';
import { getBranches } from '@/lib/homestay-dashboard';
import { getMenuItemById } from '@/lib/menu-actions';
import { MenuItemForm } from '../../_components/menu-item-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chỉnh sửa Menu Item - Admin Dashboard',
};

interface EditMenuItemPageProps {
  params: {
    id: string;
  };
}

export default async function EditMenuItemPage({ params }: EditMenuItemPageProps) {
  const [menuItem, branches] = await Promise.all([
    getMenuItemById(Number(params.id)),
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
