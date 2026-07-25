import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
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
    <PageContainer>
      <MenuItemForm branches={branches} initialData={menuItem} isEditing={true} />
    </PageContainer>
  );
}
